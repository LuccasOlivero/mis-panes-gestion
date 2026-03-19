"use server"

import { createServerClient } from "@/src/lib/supabase/server"
import { format } from "date-fns"
import type { EmployeeShift } from "@/src/types/employee.types"

type Result<T> = { success: true; data: T } | { success: false; error: string }
type Ok        = { success: true }          | { success: false; error: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapShift(r: any): EmployeeShift {
  return {
    id:          r.id,
    employeeId:  r.employee_id,
    checkIn:     r.check_in,
    checkOut:    r.check_out ?? null,
    hoursWorked: r.hours_worked ?? null,
    status:      r.status,
    notes:       r.notes ?? null,
    createdAt:   r.created_at,
  }
}

/**
 * Trae todos los fichajes de hoy para una lista de employeeIds.
 * Devuelve un Map<employeeId, EmployeeShift> para lookup O(1) en la UI.
 */
export async function getTodayShiftsAllAction(
  employeeIds: string[]
): Promise<Result<Record<string, EmployeeShift>>> {
  try {
    if (employeeIds.length === 0) return { success: true, data: {} }

    const supabase = createServerClient()
    const today    = format(new Date(), "yyyy-MM-dd")

    const { data, error } = await supabase
      .from("employee_shifts")
      .select("*")
      .in("employee_id", employeeIds)
      .gte("check_in", `${today}T00:00:00`)
      .lte("check_in", `${today}T23:59:59`)

    if (error) throw new Error(error.message)

    // Un empleado puede tener solo un fichaje por día
    const map: Record<string, EmployeeShift> = {}
    for (const row of data ?? []) {
      map[row.employee_id] = mapShift(row)
    }
    return { success: true, data: map }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function registerCheckInAction(input: {
  employeeId: string
  status:     import("@/src/types/employee.types").AttendanceStatus
  notes?:     string
}): Promise<Ok> {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.from("employee_shifts").insert({
      employee_id: input.employeeId,
      check_in:    new Date().toISOString(),
      status:      input.status,
      notes:       input.notes ?? null,
    })
    if (error) throw new Error(error.message)
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function registerCheckOutAction(input: {
  shiftId: string
}): Promise<Ok> {
  try {
    const supabase = createServerClient()

    const { data: shift, error: fetchError } = await supabase
      .from("employee_shifts")
      .select("check_in")
      .eq("id", input.shiftId)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    const checkOut    = new Date()
    const checkIn     = new Date(shift.check_in)
    const hoursWorked = Math.round(((checkOut.getTime() - checkIn.getTime()) / 3_600_000) * 100) / 100

    const { error } = await supabase
      .from("employee_shifts")
      .update({
        check_out:    checkOut.toISOString(),
        hours_worked: hoursWorked,
      })
      .eq("id", input.shiftId)

    if (error) throw new Error(error.message)
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
