"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExpenseAction } from "@/src/actions/expense.actions";
import type {
  ExpenseCategory,
  PaymentMethod,
} from "@/src/types/database.types";
import { formatCurrency } from "@/src/lib/utils/currency";
import { AlertCircle, CheckCircle2, Paperclip } from "lucide-react";
import { expenseCategoryLabels } from "@/src/modules/expenses/domain/expense.entity";

const CATEGORIES = Object.entries(expenseCategoryLabels) as [
  ExpenseCategory,
  string,
][];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "transferencia", label: "Transf." },
];

export function NuevoGastoForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("insumos");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  function handleSubmit() {
    setError(null);
    const amt = parseFloat(amount);
    startTransition(async () => {
      const result = await createExpenseAction({
        description: description.trim(),
        amount: amt,
        category,
        paymentMethod,
        notes: notes.trim() || undefined,
        receiptFile: receiptFile ?? undefined,
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
          ¡Gasto registrado!
        </p>
        <p className="text-sm text-stone-500">Redirigiendo...</p>
      </div>
    );
  }

  const amt = parseFloat(amount) || 0;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Datos del gasto</span>
      </div>
      <div className="card-body space-y-5">
        {/* Descripción */}
        <div>
          <label className="form-label">Descripción</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ej: Harina 25kg, reparación horno, gas..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autoFocus
          />
        </div>

        {/* Monto */}
        <div>
          <label className="form-label">Monto</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">
              $
            </span>
            <input
              type="number"
              className="form-input pl-7"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="form-label">Categoría</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={`rounded-lg border py-2.5 text-sm font-medium transition-all ${
                  category === value
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-stone-200 bg-white text-stone-600 hover:border-amber-400"
                }`}
              >
                {label}
              </button>
            ))}
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

        {/* Notas */}
        <div>
          <label className="form-label">
            Notas <span className="font-normal text-stone-400">(opcional)</span>
          </label>
          <textarea
            className="form-input resize-none"
            rows={2}
            placeholder="Información adicional..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Comprobante */}
        <div>
          <label className="form-label">
            Comprobante{" "}
            <span className="font-normal text-stone-400">(opcional)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-3 transition-all hover:border-amber-400 hover:bg-amber-50/50">
            <Paperclip className="size-4 text-stone-400" />
            <span className="text-sm text-stone-500">
              {receiptFile ? receiptFile.name : "Adjuntar imagen o PDF..."}
            </span>
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-4">
          <span className="text-sm font-medium text-stone-600">
            Total del gasto
          </span>
          <span className="tabular-nums text-2xl font-semibold text-red-600">
            {formatCurrency(amt)}
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
            disabled={isPending || amt <= 0 || !description.trim()}
          >
            {isPending
              ? "Registrando..."
              : `Registrar · ${formatCurrency(amt)}`}
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
