"use server";

import { createServerClient } from "@/src/lib/supabase/server";
import type {
  ProductionRecord,
  BreadQuantities,
  UpsertProductionInput,
} from "@/src/types/production.types";
import { BREAD_TYPES } from "@/src/types/production.types";

type Result<T> = { success: true; data: T } | { success: false; error: string };
type Ok = { success: true } | { success: false; error: string };

// ─── Mapper ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRecord(r: any): ProductionRecord {
  const quantities = {} as BreadQuantities;
  for (const { key } of BREAD_TYPES) {
    quantities[key] = r[key] ?? 0;
  }
  return {
    id: r.id,
    recordDate: r.record_date,
    quantities,
    notes: r.notes ?? null,
    recordedBy: r.recorded_by ?? null,
    lastEditedBy: r.last_edited_by ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** Trae el registro de un día específico (o null si no existe) */
export async function getProductionRecordAction(
  date: string,
): Promise<Result<ProductionRecord | null>> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("production_records")
      .select("*")
      .eq("record_date", date)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { success: true, data: data ? mapRecord(data) : null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Trae todos los registros de una semana (lunes a domingo) */
export async function getWeekProductionAction(
  weekFrom: string,
  weekTo: string,
): Promise<Result<ProductionRecord[]>> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("production_records")
      .select("*")
      .gte("record_date", weekFrom)
      .lte("record_date", weekTo)
      .order("record_date", { ascending: true });

    if (error) throw new Error(error.message);
    return { success: true, data: (data ?? []).map(mapRecord) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Crea o actualiza el registro de un día (upsert por record_date) */
export async function upsertProductionRecordAction(
  input: UpsertProductionInput,
): Promise<Ok> {
  try {
    const supabase = createServerClient();

    // Construir el objeto a insertar/actualizar
    const row: Record<string, unknown> = {
      record_date: input.recordDate,
      notes: input.notes?.trim() ?? null,
    };
    for (const { key } of BREAD_TYPES) {
      row[key] = input.quantities[key] ?? 0;
    }

    // Primer registro → recorded_by. Edición → last_edited_by.
    if (!input.isEdit) {
      row.recorded_by = input.authorName;
      row.last_edited_by = null;
    } else {
      row.last_edited_by = input.authorName;
    }

    const { error } = await supabase
      .from("production_records")
      .upsert(row, { onConflict: "record_date" });

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Trae los nombres de empleados activos para el selector */
export async function getActiveEmployeeNamesAction(): Promise<
  { success: true; data: string[] } | { success: false; error: string }
> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("employees")
      .select("full_name")
      .eq("active", true)
      .order("full_name");
    if (error) throw new Error(error.message);
    return { success: true, data: (data ?? []).map((e) => e.full_name) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
