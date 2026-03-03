import Link from "next/link";
import { getAllSalesAction } from "@/src/actions/sale.actions";
import { getAllExpensesAction } from "@/src/actions/expense.actions";
import { getShiftsAction } from "@/src/actions/shift.actions";
import { ArrowLeft, History } from "lucide-react";
import { MovimientosHistorialClient } from "@/src/components/movimientos/MovimientosHistorialClient";

export default async function MovimientosHistorialPage() {
  const [salesResult, expensesResult, shiftsResult] = await Promise.all([
    getAllSalesAction(),
    getAllExpensesAction(),
    getShiftsAction(100),
  ]);

  const sales = salesResult.success ? salesResult.data : [];
  const expenses = expensesResult.success ? expensesResult.data : [];
  const shifts = shiftsResult.success ? shiftsResult.data : [];

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/movimientos" className="btn-ghost btn-sm p-1.5">
            <ArrowLeft className="size-4" />
          </Link>
          <History className="size-5 text-stone-400" />
          <div>
            <h1 className="page-title">Historial de movimientos</h1>
            <p className="page-subtitle">
              Todas las ventas y gastos — con filtros
            </p>
          </div>
        </div>
      </div>
      <div className="page-content">
        <MovimientosHistorialClient
          sales={sales}
          expenses={expenses}
          shifts={shifts}
        />
      </div>
    </div>
  );
}
