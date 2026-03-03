import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Formatea solo la hora. Ej: "14:32"
 */
export function formatTime(dateStr: string): string {
  return format(new Date(dateStr), "HH:mm", { locale: es });
}

/**
 * Formatea fecha y hora completa. Ej: "25/02/2026 14:32"
 */
export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: es });
}

/**
 * Formatea solo la fecha. Ej: "25/02/2026"
 */
export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: es });
}
