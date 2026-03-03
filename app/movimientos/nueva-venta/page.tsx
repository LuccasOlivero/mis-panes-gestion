import { redirect } from "next/navigation";
import Link from "next/link";
import { getOpenShiftAction } from "@/src/actions/shift.actions";
import { createServerClient } from "@/src/lib/supabase/server";
import type { DbProduct } from "@/src/types/database.types";
import { ArrowLeft } from "lucide-react";
import { NuevaVentaForm } from "@/src/components/movimientos/NuevaVentaForm";

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

export default async function NuevaVentaPage() {
  const shiftResult = await getOpenShiftAction();
  const openShift = shiftResult.success ? shiftResult.data : null;

  if (!openShift) redirect("/movimientos");

  const products = await getActiveProducts();

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/movimientos" className="btn-ghost btn-sm p-1.5">
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
        <NuevaVentaForm products={products} />
      </div>
    </div>
  );
}
