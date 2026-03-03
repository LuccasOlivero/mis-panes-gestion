"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type {
  DailyPoint,
  PeriodComparison,
  DashboardPeriod,
} from "@/src/types/dashboard.types";
import { formatCurrency } from "@/src/lib/utils/currency";

interface Props {
  points: DailyPoint[];
  comparison: PeriodComparison;
  period: DashboardPeriod;
}

const PERIOD_LABEL: Record<DashboardPeriod, string> = {
  today: "ayer",
  week: "la semana pasada",
  month: "el mes pasado",
  custom: "el período anterior",
};

// Formatea el tooltip con moneda argentina
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-lg text-sm">
      <p className="mb-2 font-semibold text-stone-700">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-stone-600">{entry.name}:</span>
          <span className="font-medium tabular-nums">
            {formatCurrency(entry.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

// Genera el texto del comentario comparativo
function buildComment(
  comparison: PeriodComparison,
  period: DashboardPeriod,
): string[] {
  const ref = PERIOD_LABEL[period];
  const lines: string[] = [];
  const { ventasDiffPct, gastosDiffPct, balanceDiffPct } = comparison;

  if (ventasDiffPct === null && gastosDiffPct === null) {
    return ["No hay datos del período anterior para comparar."];
  }

  if (ventasDiffPct !== null) {
    if (ventasDiffPct === 0) {
      lines.push(`Las ventas se mantuvieron iguales que ${ref}.`);
    } else {
      const dir = ventasDiffPct > 0 ? "más" : "menos";
      const icon = ventasDiffPct > 0 ? "↑" : "↓";
      lines.push(
        `${icon} Se vendió un ${Math.abs(ventasDiffPct)}% ${dir} que ${ref}.`,
      );
    }
  }

  if (gastosDiffPct !== null) {
    if (gastosDiffPct === 0) {
      lines.push(`Los gastos se mantuvieron iguales que ${ref}.`);
    } else {
      const dir = gastosDiffPct > 0 ? "más" : "menos";
      const icon = gastosDiffPct > 0 ? "↑" : "↓";
      lines.push(
        `${icon} Hubo un ${Math.abs(gastosDiffPct)}% ${dir} en gastos que ${ref}.`,
      );
    }
  }

  if (balanceDiffPct !== null) {
    if (balanceDiffPct === 0) {
      lines.push(`El balance neto fue idéntico al de ${ref}.`);
    } else {
      const dir = balanceDiffPct > 0 ? "mejor" : "peor";
      const icon = balanceDiffPct > 0 ? "↑" : "↓";
      lines.push(
        `${icon} El balance neto fue un ${Math.abs(balanceDiffPct)}% ${dir} que ${ref}.`,
      );
    }
  }

  return lines;
}

export function MainChart({ points, comparison, period }: Props) {
  const comments = buildComment(comparison, period);

  // Color del primer comentario depende de si fue bueno o malo
  const ventasPct = comparison.ventasDiffPct;
  const summaryColor =
    ventasPct === null
      ? "text-stone-500"
      : ventasPct > 0
        ? "text-green-700"
        : ventasPct === 0
          ? "text-stone-500"
          : "text-red-700";

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Ventas vs Gastos · Balance neto</span>
      </div>
      <div className="card-body space-y-4">
        {/* Gráfico */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={points}
              margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F5F4F2"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#A8A29E" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: "#A8A29E" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={(value) => (
                  <span className="text-stone-600">{value}</span>
                )}
              />
              <Bar
                dataKey="ventas"
                name="Ventas"
                fill="#D97706"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="gastos"
                name="Gastos"
                fill="#FCA5A5"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Line
                dataKey="balance"
                name="Balance"
                type="monotone"
                stroke="#15803D"
                strokeWidth={2}
                dot={{ r: 3, fill: "#15803D" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Comentario comparativo */}
        <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
            Comparación con período anterior
          </p>
          <div className="space-y-1">
            {comments.map((line, i) => {
              const isVentasLine = i === 0;
              const isGastosLine = i === 1;
              const color = isVentasLine
                ? summaryColor
                : isGastosLine
                  ? (comparison.gastosDiffPct ?? 0) > 0
                    ? "text-red-700"
                    : "text-green-700"
                  : (comparison.balanceDiffPct ?? 0) > 0
                    ? "text-green-700"
                    : "text-red-700";

              return (
                <p key={i} className={`text-sm font-medium ${color}`}>
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
