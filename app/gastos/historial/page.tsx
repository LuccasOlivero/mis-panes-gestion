import Link from "next/link";
import { getExpensesAction } from "@/src/actions/expense.actions";
import { getShiftsAction } from "@/src/actions/shift.actions";
import { ArrowLeft, History } from "lucide-react";
import { ExpensesHistoryClient } from "@/src/components/expenses/ExpenseHistoryClient";

export default async function GastosHistorialPage() {
  const [expensesResult, shiftsResult] = await Promise.all([
    getExpensesAction(),
    getShiftsAction(50),
  ]);

  const expenses = expensesResult.success ? expensesResult.data : [];
  const shifts = shiftsResult.success ? shiftsResult.data : [];

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/gastos" className="btn-ghost btn-sm p-1.5">
            <ArrowLeft className="size-4" />
          </Link>
          <History className="size-5 text-stone-400" />
          <div>
            <h1 className="page-title">Historial de gastos</h1>
            <p className="page-subtitle">Todos los egresos registrados</p>
          </div>
        </div>
      </div>
      <div className="page-content">
        <ExpensesHistoryClient expenses={expenses} shifts={shifts} />
      </div>
    </div>
  );
}
