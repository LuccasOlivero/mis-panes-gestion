import type { EmployeeRole, AttendanceStatus } from "@/src/types/employee.types"

export const employeeRoleLabels: Record<EmployeeRole, string> = {
  ayudante:  "Ayudante",
  maestro:   "Maestro",
  hornero:   "Hornero",
  pastelero: "Pastelero",
}

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  presente:             "Presente",
  tarde:                "Llegada tarde",
  ausente_justificado:  "Ausente justificado",
  ausente_injustificado:"Ausente injustificado",
}

export const attendanceStatusColors: Record<AttendanceStatus, string> = {
  presente:              "bg-green-100 text-green-700",
  tarde:                 "bg-amber-100 text-amber-700",
  ausente_justificado:   "bg-blue-100 text-blue-700",
  ausente_injustificado: "bg-red-100 text-red-700",
}
