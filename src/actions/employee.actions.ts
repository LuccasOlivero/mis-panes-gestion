"use server";

import { createServerClient } from "@/src/lib/supabase/server";
import { startOfMonth, endOfMonth, format } from "date-fns";
import type {
  Employee,
  EmployeeShift,
  EmployeeSanction,
  EmployeeAdvance,
  EmployeeSalaryRecord,
  EmployeeProfileSummary,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  RegisterCheckInInput,
  RegisterCheckOutInput,
  CreateSanctionInput,
  CreateAdvanceInput,
  CreateSalaryRecordInput,
} from "@/src/types/employee.types";

type Result<T> = { success: true; data: T } | { success: false; error: string };
type Ok = { success: true } | { success: false; error: string };

// ─── Mappers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEmployee(r: any): Employee {
  return {
    id: r.id,
    fullName: r.full_name,
    role: r.role,
    hireDate: r.hire_date,
    baseSalary: r.base_salary ?? 0,
    active: r.active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapShift(r: any): EmployeeShift {
  return {
    id: r.id,
    employeeId: r.employee_id,
    checkIn: r.check_in,
    checkOut: r.check_out ?? null,
    hoursWorked: r.hours_worked ?? null,
    status: r.status,
    notes: r.notes ?? null,
    createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSanction(r: any): EmployeeSanction {
  return {
    id: r.id,
    employeeId: r.employee_id,
    date: r.date,
    reason: r.reason,
    penaltyAmount: r.penalty_amount ?? null,
    createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAdvance(r: any): EmployeeAdvance {
  return {
    id: r.id,
    employeeId: r.employee_id,
    date: r.date,
    amount: r.amount,
    notes: r.notes ?? null,
    createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSalaryRecord(r: any): EmployeeSalaryRecord {
  return {
    id: r.id,
    employeeId: r.employee_id,
    period: r.period,
    salaryAmount: r.salary_amount,
    totalAdvances: r.total_advances ?? 0,
    totalPenalties: r.total_penalties ?? 0,
    finalPaid: r.final_paid,
    notes: r.notes ?? null,
    createdAt: r.created_at,
  };
}

// ─── Empleados ────────────────────────────────────────────────────────────────

export async function getEmployeesAction(): Promise<Result<Employee[]>> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("full_name");

    if (error) throw new Error(error.message);
    return { success: true, data: (data ?? []).map(mapEmployee) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getEmployeeAction(id: string): Promise<Result<Employee>> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return { success: true, data: mapEmployee(data) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function createEmployeeAction(
  input: CreateEmployeeInput,
): Promise<Ok> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("employees").insert({
      full_name: input.fullName,
      role: input.role,
      hire_date: input.hireDate,
      base_salary: input.baseSalary,
      active: true,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateEmployeeAction(
  id: string,
  input: UpdateEmployeeInput,
): Promise<Ok> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("employees")
      .update({
        full_name: input.fullName,
        role: input.role,
        hire_date: input.hireDate,
        base_salary: input.baseSalary,
        active: input.active,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── Fichaje ──────────────────────────────────────────────────────────────────

export async function getTodayShiftAction(
  employeeId: string,
): Promise<Result<EmployeeShift | null>> {
  try {
    const supabase = createServerClient();
    const today = format(new Date(), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("employee_shifts")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("check_in", `${today}T00:00:00`)
      .lte("check_in", `${today}T23:59:59`)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { success: true, data: data ? mapShift(data) : null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function registerCheckInAction(
  input: RegisterCheckInInput,
): Promise<Ok> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("employee_shifts").insert({
      employee_id: input.employeeId,
      check_in: new Date().toISOString(),
      status: input.status,
      notes: input.notes ?? null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function registerCheckOutAction(
  input: RegisterCheckOutInput,
): Promise<Ok> {
  try {
    const supabase = createServerClient();

    // Traer el check_in para calcular horas trabajadas
    const { data: shift, error: fetchError } = await supabase
      .from("employee_shifts")
      .select("check_in")
      .eq("id", input.shiftId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const checkOut = new Date();
    const checkIn = new Date(shift.check_in);
    const hoursWorked =
      Math.round(((checkOut.getTime() - checkIn.getTime()) / 3_600_000) * 100) /
      100;

    const { error } = await supabase
      .from("employee_shifts")
      .update({
        check_out: checkOut.toISOString(),
        hours_worked: hoursWorked,
      })
      .eq("id", input.shiftId);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── Perfil completo del empleado ─────────────────────────────────────────────

export async function getEmployeeProfileAction(
  id: string,
  month: string, // "2026-02" — YYYY-MM
): Promise<Result<EmployeeProfileSummary>> {
  try {
    const supabase = createServerClient();
    const monthStart = startOfMonth(new Date(`${month}-01`)).toISOString();
    const monthEnd = endOfMonth(new Date(`${month}-01`)).toISOString();
    const today = format(new Date(), "yyyy-MM-dd");

    const [empRes, shiftsRes, todayRes, advancesRes, sanctionsRes, salaryRes] =
      await Promise.all([
        supabase.from("employees").select("*").eq("id", id).single(),

        // Asistencia del mes seleccionado
        supabase
          .from("employee_shifts")
          .select("*")
          .eq("employee_id", id)
          .gte("check_in", monthStart)
          .lte("check_in", monthEnd)
          .order("check_in", { ascending: false }),

        // Fichaje de hoy
        supabase
          .from("employee_shifts")
          .select("*")
          .eq("employee_id", id)
          .gte("check_in", `${today}T00:00:00`)
          .lte("check_in", `${today}T23:59:59`)
          .maybeSingle(),

        // Todos los adelantos
        supabase
          .from("employee_salary_advances")
          .select("*")
          .eq("employee_id", id)
          .order("date", { ascending: false }),

        // Todas las sanciones
        supabase
          .from("employee_sanctions")
          .select("*")
          .eq("employee_id", id)
          .order("date", { ascending: false }),

        // Todas las liquidaciones
        supabase
          .from("employee_salary_records")
          .select("*")
          .eq("employee_id", id)
          .order("period", { ascending: false }),
      ]);

    if (empRes.error) throw new Error(empRes.error.message);
    if (shiftsRes.error) throw new Error(shiftsRes.error.message);
    if (advancesRes.error) throw new Error(advancesRes.error.message);
    if (sanctionsRes.error) throw new Error(sanctionsRes.error.message);
    if (salaryRes.error) throw new Error(salaryRes.error.message);

    const monthShifts = (shiftsRes.data ?? []).map(mapShift);
    const advances = (advancesRes.data ?? []).map(mapAdvance);
    const sanctions = (sanctionsRes.data ?? []).map(mapSanction);
    const salaryRecords = (salaryRes.data ?? []).map(mapSalaryRecord);

    // Adelantos y penalizaciones del mes seleccionado
    const monthAdvances = advances.filter((a) => a.date.startsWith(month));
    const monthSanctions = sanctions.filter((s) => s.date.startsWith(month));

    const monthStats = {
      present: monthShifts.filter((s) => s.status === "presente").length,
      late: monthShifts.filter((s) => s.status === "tarde").length,
      absentJustified: monthShifts.filter(
        (s) => s.status === "ausente_justificado",
      ).length,
      absentUnjustified: monthShifts.filter(
        (s) => s.status === "ausente_injustificado",
      ).length,
      totalHours: monthShifts.reduce((s, r) => s + (r.hoursWorked ?? 0), 0),
      totalAdvances: monthAdvances.reduce((s, a) => s + a.amount, 0),
      totalPenalties: monthSanctions.reduce(
        (s, s2) => s + (s2.penaltyAmount ?? 0),
        0,
      ),
    };

    return {
      success: true,
      data: {
        employee: mapEmployee(empRes.data),
        todayShift: todayRes.data ? mapShift(todayRes.data) : null,
        monthShifts,
        advances,
        sanctions,
        salaryRecords,
        monthStats,
      },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── Sanciones ────────────────────────────────────────────────────────────────

export async function createSanctionAction(
  input: CreateSanctionInput,
): Promise<Ok> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("employee_sanctions").insert({
      employee_id: input.employeeId,
      date: input.date,
      reason: input.reason,
      penalty_amount: input.penaltyAmount ?? null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── Adelantos ────────────────────────────────────────────────────────────────

export async function createAdvanceAction(
  input: CreateAdvanceInput,
): Promise<Ok> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("employee_salary_advances").insert({
      employee_id: input.employeeId,
      date: input.date,
      amount: input.amount,
      notes: input.notes ?? null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── Liquidaciones ────────────────────────────────────────────────────────────

export async function createSalaryRecordAction(
  input: CreateSalaryRecordInput,
): Promise<Ok> {
  try {
    const supabase = createServerClient();

    // Calcular totales del período para el registro
    const [advRes, sanctRes] = await Promise.all([
      supabase
        .from("employee_salary_advances")
        .select("amount")
        .eq("employee_id", input.employeeId)
        .gte("date", `${input.period}-01`)
        .lte("date", `${input.period}-31`),
      supabase
        .from("employee_sanctions")
        .select("penalty_amount")
        .eq("employee_id", input.employeeId)
        .gte("date", `${input.period}-01`)
        .lte("date", `${input.period}-31`),
    ]);

    const totalAdvances = (advRes.data ?? []).reduce(
      (s, r) => s + (r.amount ?? 0),
      0,
    );
    const totalPenalties = (sanctRes.data ?? []).reduce(
      (s, r) => s + (r.penalty_amount ?? 0),
      0,
    );

    const { error } = await supabase.from("employee_salary_records").insert({
      employee_id: input.employeeId,
      period: input.period,
      salary_amount: input.salaryAmount,
      total_advances: totalAdvances,
      total_penalties: totalPenalties,
      final_paid: input.finalPaid,
      notes: input.notes ?? null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
