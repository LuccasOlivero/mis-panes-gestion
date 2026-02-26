import { redirect } from "next/navigation";
import Link from "next/link";
import { getOpenShiftAction } from "@/src/actions/shift.actions";
import { NewSaleForm } from "@/src/components/sales/NewSaleForm";
import { createServerClient } from "@/src/lib/supabase/server";
import type { DbProduct } from "@/src/types/database.types";
import { ArrowLeft } from "lucide-react";

async function getActiveProducts(): Promise<DbProduct[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .eq("is_custom", false)
    .order("name");
  return data ?? [];
}

/**
 * Next.js 15: página sin parámetros dinámicos.
 * No necesita await en props — el cambio de async params
 * aplica solo a rutas como /productos/[id].
 */
export default async function NuevaVentaPage() {
  const shiftResult = await getOpenShiftAction();
  const openShift = shiftResult.success ? shiftResult.data : null;

  // Guarda: sin turno abierto, redirigir
  if (!openShift) redirect("/ventas");

  const products = await getActiveProducts();

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/ventas" className="btn-ghost btn-sm p-1.5">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="page-title">Nueva venta</h1>
            <p className="page-subtitle">
              Turno activo: {openShift.managerName}
            </p>
          </div>
        </div>
      </div>
      <div className="page-content max-w-2xl">
        <NewSaleForm products={products} />
      </div>
    </div>
  );
}
