"use server"

import { revalidatePath }   from "next/cache"
import { createServerClient } from "@/src/lib/supabase/server"
import type { DeliveryClient, DeliverySale } from "@/src/types/delivery.types"

type Result<T> = { success: true; data: T } | { success: false; error: string }
type Ok        = { success: true }          | { success: false; error: string }

export interface ClientHistory {
  client:       DeliveryClient
  sales:        DeliverySale[]
  totalAmount:  number
  totalOrders:  number
  lastSaleDate: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapClient(r: any): DeliveryClient {
  return { id: r.id, name: r.name, notes: r.notes ?? null, active: r.active, createdAt: r.created_at }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSale(r: any): DeliverySale {
  return {
    id:             r.id,
    saleDate:       r.sale_date,
    clientId:       r.client_id ?? null,
    clientTempName: r.client_temp_name ?? null,
    clientName:     r.client_temp_name ?? "",
    isTemp:         !r.client_id,
    total:          r.total ?? 0,
    notes:          r.notes ?? null,
    createdAt:      r.created_at,
  }
}

/** Todos los clientes (activos e inactivos) para la página de administración */
export async function getAllDeliveryClientsAction(): Promise<Result<DeliveryClient[]>> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("delivery_clients")
      .select("*")
      .order("name")
    if (error) throw new Error(error.message)
    return { success: true, data: (data ?? []).map(mapClient) }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

/** Historial completo de un cliente */
export async function getClientHistoryAction(clientId: string): Promise<Result<ClientHistory>> {
  try {
    const supabase = createServerClient()

    const [clientRes, salesRes] = await Promise.all([
      supabase.from("delivery_clients").select("*").eq("id", clientId).single(),
      supabase
        .from("delivery_sales")
        .select("*")
        .eq("client_id", clientId)
        .order("sale_date", { ascending: false }),
    ])

    if (clientRes.error) throw new Error(clientRes.error.message)
    if (salesRes.error)  throw new Error(salesRes.error.message)

    const sales      = (salesRes.data ?? []).map(mapSale)
    const totalAmount = sales.reduce((s, r) => s + r.total, 0)
    const lastSaleDate = sales.length > 0 ? sales[0].saleDate : null

    return {
      success: true,
      data: {
        client:      mapClient(clientRes.data),
        sales,
        totalAmount,
        totalOrders: sales.length,
        lastSaleDate,
      },
    }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

/** Editar nombre del cliente */
export async function updateDeliveryClientNameAction(
  id:   string,
  name: string
): Promise<Ok> {
  try {
    if (!name.trim()) return { success: false, error: "El nombre no puede estar vacío." }
    const supabase = createServerClient()
    const { error } = await supabase
      .from("delivery_clients")
      .update({ name: name.trim() })
      .eq("id", id)
    if (error) throw new Error(error.message)
    revalidatePath("/clientes")
    revalidatePath("/reparto")
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

/** Desactivar cliente (soft delete) */
export async function deactivateDeliveryClientAction(id: string): Promise<Ok> {
  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from("delivery_clients")
      .update({ active: false })
      .eq("id", id)
    if (error) throw new Error(error.message)
    revalidatePath("/clientes")
    revalidatePath("/reparto")
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

/** Reactivar cliente */
export async function reactivateDeliveryClientAction(id: string): Promise<Ok> {
  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from("delivery_clients")
      .update({ active: true })
      .eq("id", id)
    if (error) throw new Error(error.message)
    revalidatePath("/clientes")
    revalidatePath("/reparto")
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
