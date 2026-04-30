"use client";

import { useState, useTransition } from "react";
import { getDailyDeliverySummaryAction } from "@/src/actions/delivery.actions";
import type {
  DeliveryClient,
  DailyDeliverySummary,
  DeliveryNote,
  DeliverySale,
  DeliveryExpense,
} from "@/src/types/delivery.types";
import { DeliveryDayClient } from "./DeliveryDayClient";
import { DeliveryNotesClient } from "./DeliveryNotesClient";

interface Props {
  initialSummary: DailyDeliverySummary;
  initialDate: string;
  clients: DeliveryClient[];
  notes: DeliveryNote[];
}

export function DeliveryPageClient({
  initialSummary,
  initialDate,
  clients,
  notes,
}: Props) {
  const [date, setDate] = useState(initialDate);
  const [, startTransition] = useTransition();

  // Estado centralizado — única fuente de verdad para ventas y gastos
  const [sales, setSales] = useState<DeliverySale[]>(initialSummary.sales);
  const [expenses, setExpenses] = useState<DeliveryExpense[]>(
    initialSummary.expenses,
  );

  // Al cambiar de fecha: recargar datos del servidor y reemplazar estado local
  function handleDateChange(newDate: string) {
    setDate(newDate);
    startTransition(async () => {
      const result = await getDailyDeliverySummaryAction(newDate);
      if (result.success) {
        setSales(result.data.sales);
        setExpenses(result.data.expenses);
      }
    });
  }

  return (
    <div className="space-y-8">
      <DeliveryNotesClient notes={notes} />
      <DeliveryDayClient
        sales={sales}
        setSales={setSales}
        expenses={expenses}
        setExpenses={setExpenses}
        clients={clients}
        selectedDate={date}
        onDateChange={handleDateChange}
      />
    </div>
  );
}
