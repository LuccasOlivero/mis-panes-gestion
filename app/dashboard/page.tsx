import { getDashboardDataAction } from "@/src/actions/dashboard.actions";
import { DashboardClient } from "@/src/components/dashboard/DashboardClient";
import { LayoutDashboard } from "lucide-react";

/**
 * Período por defecto: último mes (opción 4).
 * El Client Component maneja los cambios de período sin recargar la página.
 */
export default async function DashboardPage() {
  const result = await getDashboardDataAction("month");

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="size-5 text-stone-400" />
          <div>
            <h1 className="page-title">Graficos</h1>
            <p className="page-subtitle">Resumen financiero por período</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        {result.success ? (
          <DashboardClient initialData={result.data} initialPeriod="month" />
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Error al cargar el dashboard: {result.error}
          </div>
        )}
      </div>
    </div>
  );
}
