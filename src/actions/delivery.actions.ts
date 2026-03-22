"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/src/lib/supabase/server"
import { differenceInDays, format, parseISO } from "date-fns"
import type {
  DeliveryClient,
  DeliverySale,
  DeliveryExpense,
  DeliveryNote,
  DeliveryOrder,
  DailyDeliverySummary,
  CreateDeliveryClientInput,
  CreateDeliverySaleInput,
  CreateDeliveryExpenseInput,
  CreateDeliveryNoteInput,
  CreateDeliveryOrderInput,
} from "@/src/types/delivery.types"

type Result<T> = { success: true; data: T } | { success: false; error: string }
type Ok        = { success: true }          | { success: false; error: string }

// ─── Mappers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapClient(r: any): DeliveryClient {
  return { id: r.id, name: r.name, notes: r.notes ?? null, active: r.active, createdAt: r.created_at }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSale(r: any, clientName?: string): DeliverySale {
  return {
    id: r.id, saleDate: r.sale_date,
    clientId: r.client_id ?? null,
    clientTempName: r.client_temp_name ?? null,
    clientName: clientName ?? r.client_temp_name ?? "Cliente desconocido",
    isTemp: !r.client_id,
    total: r.total ?? 0,
    notes: r.notes ?? null,
    createdAt: r.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExpense(r: any): DeliveryExpense {
  return { id: r.id, expenseDate: r.expense_date, name: r.name, total: r.total ?? 0, createdAt: r.created_at }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNote(r: any): DeliveryNote {
  return { id: r.id, content: r.content, createdAt: r.created_at }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrder(r: any, today?: string): DeliveryOrder {
  // Si no se pasa today, calcularlo en zona horaria Argentina
  const todayStr = today ?? format(
    new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })),
    "yyyy-MM-dd"
  )
  const todayDate    = parseISO(todayStr)
  const deliveryDate = parseISO(r.delivery_date)
  const daysLeft     = differenceInDays(deliveryDate, todayDate)
  return {
    id: r.id, clientName: r.client_name, description: r.description,
    deliveryDate: r.delivery_date, daysLeft,
    saleAmount:  r.sale_amount  ?? 0,
    saleCreated: r.sale_created ?? false,
    completed: r.completed, completedAt: r.completed_at ?? null, createdAt: r.created_at,
  }
}

// ─── Clientes ─────────────────────────────────────────────────────────────────

export async function getDeliveryClientsAction(): Promise<Result<DeliveryClient[]>> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("delivery_clients").select("*").eq("active", true).order("name")
    if (error) throw new Error(error.message)
    return { success: true, data: (data ?? []).map(mapClient) }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

export async function createDeliveryClientAction(
  input: CreateDeliveryClientInput
): Promise<Result<DeliveryClient>> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("delivery_clients")
      .insert({ name: input.name.trim(), notes: input.notes?.trim() ?? null })
      .select().single()
    if (error) throw new Error(error.message)
    return { success: true, data: mapClient(data) }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

// ─── Resumen diario ───────────────────────────────────────────────────────────

export async function getDailyDeliverySummaryAction(
  date: string
): Promise<Result<DailyDeliverySummary>> {
  try {
    const supabase = createServerClient()

    const [salesRes, expensesRes] = await Promise.all([
      supabase
        .from("delivery_sales")
        .select("*, delivery_clients(name)")
        .eq("sale_date", date)
        .order("created_at", { ascending: true }),
      supabase
        .from("delivery_expenses")
        .select("*")
        .eq("expense_date", date)
        .order("created_at", { ascending: true }),
    ])

    if (salesRes.error)    throw new Error(salesRes.error.message)
    if (expensesRes.error) throw new Error(expensesRes.error.message)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sales    = (salesRes.data ?? []).map((r) => mapSale(r, (r as any).delivery_clients?.name))
    const expenses = (expensesRes.data ?? []).map(mapExpense)

    const totalSales    = sales.reduce((s, r) => s + r.total, 0)
    const totalExpenses = expenses.reduce((s, r) => s + r.total, 0)

    return {
      success: true,
      data: {
        date,
        totalSales,
        totalExpenses,
        netBalance: totalSales - totalExpenses,
        salesCount: sales.length,
        sales,
        expenses,
      },
    }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

// ─── Ventas ───────────────────────────────────────────────────────────────────

export async function createDeliverySaleAction(input: CreateDeliverySaleInput): Promise<Ok> {
  try {
    if (!input.clientId && !input.clientTempName?.trim())
      return { success: false, error: "Debe especificar un cliente." }
    if (!input.total || input.total <= 0)
      return { success: false, error: "El total debe ser mayor a 0." }
    const supabase = createServerClient()
    const { error } = await supabase.from("delivery_sales").insert({
      sale_date:        input.saleDate,
      client_id:        input.clientId        ?? null,
      client_temp_name: input.clientTempName?.trim() ?? null,
      total:            input.total,
      notes:            input.notes?.trim()   ?? null,
    })
    if (error) throw new Error(error.message)
    revalidatePath("/reparto")
    return { success: true }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

export async function deleteDeliverySaleAction(saleId: string): Promise<Ok> {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.from("delivery_sales").delete().eq("id", saleId)
    if (error) throw new Error(error.message)
    revalidatePath("/reparto")
    return { success: true }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

// ─── Gastos de reparto ────────────────────────────────────────────────────────

export async function createDeliveryExpenseAction(input: CreateDeliveryExpenseInput): Promise<Ok> {
  try {
    if (!input.name.trim())
      return { success: false, error: "El nombre del gasto es obligatorio." }
    if (!input.total || input.total <= 0)
      return { success: false, error: "El total debe ser mayor a 0." }
    const supabase = createServerClient()
    const { error } = await supabase.from("delivery_expenses").insert({
      expense_date: input.expenseDate,
      name:         input.name.trim(),
      total:        input.total,
    })
    if (error) throw new Error(error.message)
    revalidatePath("/reparto")
    return { success: true }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

export async function deleteDeliveryExpenseAction(expenseId: string): Promise<Ok> {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.from("delivery_expenses").delete().eq("id", expenseId)
    if (error) throw new Error(error.message)
    revalidatePath("/reparto")
    return { success: true }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

// ─── Notas ────────────────────────────────────────────────────────────────────

export async function getDeliveryNotesAction(): Promise<Result<DeliveryNote[]>> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("delivery_notes").select("*").order("created_at", { ascending: false })
    if (error) throw new Error(error.message)
    return { success: true, data: (data ?? []).map(mapNote) }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

export async function createDeliveryNoteAction(input: CreateDeliveryNoteInput): Promise<Ok> {
  try {
    if (!input.content.trim()) return { success: false, error: "La nota no puede estar vacía." }
    const supabase = createServerClient()
    const { error } = await supabase.from("delivery_notes").insert({ content: input.content.trim() })
    if (error) throw new Error(error.message)
    revalidatePath("/reparto")
    return { success: true }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

export async function deleteDeliveryNoteAction(noteId: string): Promise<Ok> {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.from("delivery_notes").delete().eq("id", noteId)
    if (error) throw new Error(error.message)
    revalidatePath("/reparto")
    return { success: true }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export async function getDeliveryOrdersAction(): Promise<Result<{
  pending: DeliveryOrder[]; completed: DeliveryOrder[]; urgent: DeliveryOrder[]
}>> {
  try {
    const supabase = createServerClient()

    // Fecha de hoy en Argentina (UTC-3) — independiente del servidor
    const todayAR = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
    )
    const today = format(todayAR, "yyyy-MM-dd")

    // Cutoff: pedidos cuya fecha de entrega fue hace más de 2 días
    const cutoffDate = new Date(todayAR)
    cutoffDate.setDate(cutoffDate.getDate() - 2)
    const expiredCutoff = format(cutoffDate, "yyyy-MM-dd")

    // Auto-completar pedidos vencidos (delivery_date < hoy - 2 días)
    await supabase
      .from("delivery_orders")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("completed", false)
      .lt("delivery_date", expiredCutoff)

    const { data, error } = await supabase
      .from("delivery_orders").select("*").order("delivery_date", { ascending: true })
    if (error) throw new Error(error.message)

    const orders    = (data ?? []).map((r) => mapOrder(r, today))
    const pending   = orders.filter((o) => !o.completed)
    const completed = orders.filter((o) => o.completed)
    const urgent    = pending.filter((o) => o.daysLeft <= 2)

    return { success: true, data: { pending, completed, urgent } }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

export async function createDeliveryOrderAction(input: CreateDeliveryOrderInput): Promise<Ok> {
  try {
    if (!input.clientName.trim()) return { success: false, error: "El nombre del cliente es obligatorio." }
    if (!input.description.trim()) return { success: false, error: "La descripción es obligatoria." }
    const supabase = createServerClient()
    const { error } = await supabase.from("delivery_orders").insert({
      client_name:   input.clientName.trim(),
      description:   input.description.trim(),
      delivery_date: input.deliveryDate,
      sale_amount:   input.saleAmount ?? 0,
      sale_created:  false,
    })
    if (error) throw new Error(error.message)
    revalidatePath("/pedidos")
    return { success: true }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

// ─── Marcar pedido como entregado → crea venta en reparto ────────────────────

export async function markOrderDeliveredAction(orderId: string): Promise<Ok> {
  try {
    const supabase = createServerClient()

    // 1. Traer el pedido
    const { data: order, error: fetchErr } = await supabase
      .from("delivery_orders")
      .select("id, client_name, description, delivery_date, sale_amount, sale_created, completed")
      .eq("id", orderId)
      .single()

    if (fetchErr) throw new Error(fetchErr.message)
    if (!order)   throw new Error("Pedido no encontrado.")

    // Idempotencia: si la venta ya fue creada, no duplicar
    if (order.sale_created) {
      // Solo marcar como completado si todavía no lo está
      if (!order.completed) {
        await supabase
          .from("delivery_orders")
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq("id", orderId)
      }
      return { success: true }
    }

    // 2. Crear la venta en delivery_sales como cliente temporal
    const today = format(new Date(), "yyyy-MM-dd")
    const { error: saleErr } = await supabase.from("delivery_sales").insert({
      sale_date:        today,
      client_id:        null,
      client_temp_name: order.client_name,
      total:            order.sale_amount ?? 0,
      notes:            order.description ?? null,
    })
    if (saleErr) throw new Error(saleErr.message)

    // 3. Marcar pedido como completado + sale_created = true
    const { error: updateErr } = await supabase
      .from("delivery_orders")
      .update({
        completed:    true,
        completed_at: new Date().toISOString(),
        sale_created: true,
      })
      .eq("id", orderId)

    if (updateErr) throw new Error(updateErr.message)
    revalidatePath("/pedidos")
    return { success: true }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

export async function deleteDeliveryOrderAction(orderId: string): Promise<Ok> {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.from("delivery_orders").delete().eq("id", orderId)
    if (error) throw new Error(error.message)
    revalidatePath("/pedidos")
    return { success: true }
  } catch (e) { return { success: false, error: (e as Error).message } }
}

export async function getUrgentOrdersAction(): Promise<Result<DeliveryOrder[]>> {
  try {
    const supabase  = createServerClient()
    const todayAR   = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
    )
    const today        = format(todayAR, "yyyy-MM-dd")
    const twoDaysAhead = format(new Date(todayAR.getTime() + 2 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
    const { data, error } = await supabase
      .from("delivery_orders").select("*")
      .eq("completed", false)
      .gte("delivery_date", today)
      .lte("delivery_date", twoDaysAhead)
      .order("delivery_date", { ascending: true })
    if (error) throw new Error(error.message)
    return { success: true, data: (data ?? []).map((r) => mapOrder(r, today)) }
  } catch (e) { return { success: false, error: (e as Error).message } }
}
