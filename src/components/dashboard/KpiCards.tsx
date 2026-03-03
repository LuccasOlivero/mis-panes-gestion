import type { PeriodKPIs, PeriodComparison } from "@/src/types/dashboard.types";
import { formatCurrency } from "@/src/lib/utils/currency";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  kpis: PeriodKPIs;
  comparison: PeriodComparison;
}

interface DiffBadgeProps {
  pct: number | null;
  invert?: boolean;
}

function DiffBadge({ pct, invert = false }: DiffBadgeProps) {
  if (pct === null)
    return <span className="text-xs text-stone-400">Sin datos anteriores</span>;

  // invert=true → para gastos, subida es mala (rojo), bajada es buena (verde)
  const isPositive = invert ? pct < 0 : pct > 0;
  const isNeutral = pct === 0;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-400">
        <Minus className="size-3" />
        Sin cambios
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
    >
      {isPositive ? (
        <TrendingUp className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {pct > 0 ? "+" : ""}
      {pct}% vs período anterior
    </span>
  );
}

export function KpiCards({ kpis, comparison }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* Ventas totales */}
      <div className="stat-card">
        <span className="stat-label">Ventas totales</span>
        <span className="stat-value text-amber-700">
          {formatCurrency(kpis.totalVentas)}
        </span>
        <DiffBadge pct={comparison.ventasDiffPct} />
        <span className="mt-1 text-xs text-stone-400">
          {kpis.cantVentas} transacciones
        </span>
      </div>

      {/* Gastos totales */}
      <div className="stat-card">
        <span className="stat-label">Gastos totales</span>
        <span className="stat-value text-red-600">
          {formatCurrency(kpis.totalGastos)}
        </span>
        <DiffBadge pct={comparison.gastosDiffPct} invert />
        <span className="mt-1 text-xs text-stone-400">
          {kpis.cantGastos} egresos
        </span>
      </div>

      {/* Balance neto */}
      <div className="stat-card">
        <span className="stat-label">Balance neto</span>
        <span
          className={`stat-value ${kpis.balanceNeto >= 0 ? "text-green-700" : "text-red-700"}`}
        >
          {formatCurrency(kpis.balanceNeto)}
        </span>
        <DiffBadge pct={comparison.balanceDiffPct} />
      </div>

      {/* Ticket promedio */}
      <div className="stat-card">
        <span className="stat-label">Ticket promedio</span>
        <span className="stat-value text-stone-700">
          {formatCurrency(kpis.ticketPromedio)}
        </span>
        <span className="mt-1 text-xs text-stone-400">Por venta</span>
      </div>
    </div>
  );
}
