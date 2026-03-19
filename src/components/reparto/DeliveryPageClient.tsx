"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getDailyDeliverySummaryAction } from "@/src/actions/delivery.actions";
import type {
  DeliveryClient,
  DailyDeliverySummary,
  DeliveryNote,
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
  const [summary, setSummary] = useState(initialSummary);
  const [date, setDate] = useState(initialDate);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleDateChange(newDate: string) {
    setDate(newDate);
    startTransition(async () => {
      const result = await getDailyDeliverySummaryAction(newDate);
      if (result.success) setSummary(result.data);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <DeliveryNotesClient notes={notes} />
      <DeliveryDayClient
        summary={summary}
        clients={clients}
        selectedDate={date}
        onDateChange={handleDateChange}
      />
    </div>
  );
}
