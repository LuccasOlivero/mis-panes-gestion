"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSaleAction } from "@/src/actions/sale.actions";
import type {
  DbProduct,
  PriceType,
  PaymentMethod,
} from "@/src/types/database.types";
import { resolvePriceForType } from "@/src/types/product.types";
import { calculateSaleTotal, formatCurrency } from "@/src/lib/utils/currency";
import { AlertCircle, CheckCircle2, Search } from "lucide-react";

const PRICE_TYPES: { value: PriceType; label: string }[] = [
  { value: "publico", label: "Público" },
  { value: "negocio", label: "Negocio" },
  { value: "repartidor", label: "Repartidor" },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "transferencia", label: "Transf." },
];

interface Props {
  products: DbProduct[];
}

export function NuevaVentaForm({ products }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(
    null,
  );
  const [customName, setCustomName] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [priceType, setPriceType] = useState<PriceType>("publico");
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");

  function handleSelectProduct(product: DbProduct) {
    setSelectedProduct(product);
    setIsCustom(false);
    setProductSearch(product.name);
    const price = resolvePriceForType(
      {
        id: product.id,
        name: product.name,
        description: product.description,
        basePrice: product.base_price,
        priceNegocio: product.price_negocio,
        priceRepartidor: product.price_repartidor,
        isCustom: product.is_custom,
        active: product.active,
      },
      priceType,
    );
    setUnitPrice(String(price));
  }

  function handlePriceTypeChange(pt: PriceType) {
    setPriceType(pt);
    if (selectedProduct) {
      const price = resolvePriceForType(
        {
          id: selectedProduct.id,
          name: selectedProduct.name,
          description: selectedProduct.description,
          basePrice: selectedProduct.base_price,
          priceNegocio: selectedProduct.price_negocio,
          priceRepartidor: selectedProduct.price_repartidor,
          isCustom: selectedProduct.is_custom,
          active: selectedProduct.active,
        },
        pt,
      );
      setUnitPrice(String(price));
    }
  }

  const qty = parseFloat(quantity) || 0;
  const price = parseFloat(unitPrice) || 0;
  const disc = parseFloat(discount) || 0;
  const total = calculateSaleTotal(price, qty, disc);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()),
  );
  const showDropdown =
    productSearch.length > 0 && !selectedProduct && !isCustom;

  function handleSubmit() {
    setError(null);
    const productName = isCustom
      ? customName
      : (selectedProduct?.name ?? productSearch);
    if (!productName.trim()) {
      setError("Seleccioná o escribí un producto.");
      return;
    }
    startTransition(async () => {
      const result = await createSaleAction({
        productId: isCustom ? undefined : selectedProduct?.id,
        productName: productName.trim(),
        quantity: qty,
        unitPrice: price,
        priceType,
        discount: disc,
        paymentMethod,
      });
      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/movimientos");
          router.refresh();
        }, 900);
      }
    });
  }

  if (success) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10">
        <CheckCircle2 className="size-12 text-green-500" />
        <p className="text-lg font-semibold text-stone-900">
          ¡Venta registrada!
        </p>
        <p className="text-sm text-stone-500">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Datos de la venta</span>
      </div>
      <div className="card-body space-y-5">
        {/* Producto */}
        <div>
          <label className="form-label">Producto</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              className="form-input pl-9"
              placeholder="Buscar producto o ingresar nombre libre..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setSelectedProduct(null);
                setIsCustom(false);
              }}
            />
            {showDropdown && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg">
                {filteredProducts.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-stone-50"
                    onClick={() => handleSelectProduct(p)}
                  >
                    <span className="font-medium text-stone-800">{p.name}</span>
                    <span className="text-xs text-stone-400">
                      {formatCurrency(p.base_price)}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  className="w-full border-t border-stone-100 px-4 py-2.5 text-left text-sm font-medium text-amber-700 hover:bg-amber-50"
                  onClick={() => {
                    setIsCustom(true);
                    setCustomName(productSearch);
                  }}
                >
                  + Usar &quot;{productSearch}&quot; como producto personalizado
                </button>
              </div>
            )}
          </div>
          {isCustom && (
            <div className="mt-2">
              <input
                type="text"
                className="form-input"
                placeholder="Nombre del producto personalizado"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Tipo de precio + Precio unitario */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Tipo de precio</label>
            <div className="flex gap-2">
              {PRICE_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handlePriceTypeChange(value)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-all ${
                    priceType === value
                      ? "border-amber-600 bg-amber-600 text-white"
                      : "border-stone-200 bg-white text-stone-600 hover:border-amber-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Precio unitario</label>
            <input
              type="number"
              className="form-input"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Cantidad + Descuento */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Cantidad</label>
            <input
              type="number"
              className="form-input"
              placeholder="1"
              min="0.001"
              step="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Descuento</label>
            <input
              type="number"
              className="form-input"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
        </div>

        {/* Medio de pago */}
        <div>
          <label className="form-label">Medio de pago</label>
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPaymentMethod(value)}
                className={`rounded-lg border py-2.5 text-sm font-medium transition-all ${
                  paymentMethod === value
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-stone-200 bg-white text-stone-600 hover:border-amber-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-4">
          <span className="text-sm font-medium text-stone-600">
            Total a cobrar
          </span>
          <span className="tabular-nums text-2xl font-semibold text-amber-700">
            {formatCurrency(total)}
          </span>
        </div>

        {error && (
          <p className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            className="btn-primary flex-1"
            onClick={handleSubmit}
            disabled={isPending || total <= 0}
          >
            {isPending
              ? "Registrando..."
              : `Registrar · ${formatCurrency(total)}`}
          </button>
          <button
            className="btn-secondary"
            onClick={() => router.push("/movimientos")}
            disabled={isPending}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
