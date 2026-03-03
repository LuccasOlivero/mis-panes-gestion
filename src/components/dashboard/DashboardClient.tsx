"use client";

import { useState, useTransition, useCallback } from "react";
import { getDashboardDataAction } from "@/src/actions/dashboard.actions";
import type {
  DashboardData,
  DashboardPeriod,
  DateRange,
} from "@/src/types/dashboard.types";
import { PeriodSelector } from "@/src/components/dashboard/PeriodSelector";
import { KpiCards } from "@/src/components/dashboard/KpiCards";
import { MainChart } from "@/src/components/dashboard/MainChart";
import { ShiftsTable } from "@/src/components/dashboard/ShiftsTable";
import { AlertCircle } from "lucide-react";

interface Props {
  initialData: DashboardData;
  initialPeriod: DashboardPeriod;
}

export function DashboardClient({ initialData, initialPeriod }: Props) {
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState<DashboardPeriod>(initialPeriod);
  const [custom, setCustom] = useState<DateRange | undefined>(undefined);
  const [data, setData] = useState<DashboardData>(initialData);
  const [error, setError] = useState<string | null>(null);

  const handlePeriodChange = useCallback(
    (newPeriod: DashboardPeriod, newCustom?: DateRange) => {
      // Para rango custom, esperar a que ambas fechas estén definidas
      if (newPeriod === "custom") {
        setPeriod(newPeriod);
        setCustom(newCustom);
        if (!newCustom?.from || !newCustom?.to) return;
      } else {
        setPeriod(newPeriod);
        setCustom(undefined);
      }

      setError(null);
      startTransition(async () => {
        const result = await getDashboardDataAction(newPeriod, newCustom);
        if (!result.success) {
          setError(result.error);
        } else {
          setData(result.data);
        }
      });
    },
    [],
  );

  return (
    <div className="space-y-6">
      {/* Selector de período */}
      <PeriodSelector
        period={period}
        custom={custom}
        onChange={handlePeriodChange}
        isLoading={isPending}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="size-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Contenido con overlay de carga */}
      <div
        className={`space-y-6 transition-opacity duration-200 ${isPending ? "opacity-50 pointer-events-none" : "opacity-100"}`}
      >
        {/* KPIs */}
        <KpiCards kpis={data.kpis} comparison={data.comparison} />

        {/* Gráfico principal + comentario comparativo */}
        <MainChart
          points={data.dailyPoints}
          comparison={data.comparison}
          period={period}
        />

        {/* Tabla de turnos con detalle expandible */}
        <ShiftsTable
          shiftRows={data.shiftRows}
          movimientos={data.movimientos}
        />
      </div>
    </div>
  );
}
