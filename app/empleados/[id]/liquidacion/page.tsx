import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { SalaryRecordForm } from "@/src/components/empleados/SalaryRecordForm";
import { ArrowLeft } from "lucide-react";
import { getEmployeeProfileAction } from "@/src/actions/employee.actions";

export default async function LiquidacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const month = format(new Date(), "yyyy-MM");
  const result = await getEmployeeProfileAction(id, month);
  if (!result.success) notFound();

  const { employee, monthStats } = result.data;

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href={`/empleados/${id}`} className="btn-ghost btn-sm p-1.5">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="page-title">Liquidación — {employee.fullName}</h1>
            <p className="page-subtitle">Registrar pago de sueldo</p>
          </div>
        </div>
      </div>
      <div className="page-content max-w-xl">
        <SalaryRecordForm
          employeeId={id}
          employeeName={employee.fullName}
          baseSalary={employee.baseSalary}
          monthAdvances={monthStats.totalAdvances}
          monthPenalties={monthStats.totalPenalties}
        />
      </div>
    </div>
  );
}
