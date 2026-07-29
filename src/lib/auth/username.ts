export const USERNAME_REGEX = /^[a-z0-9_.-]{3,20}$/;
const INTERNAL_EMAIL_DOMAIN = "mispanes.local";

/** Convierte un username en el email interno sintético que usa Supabase Auth. */
export function toInternalEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${INTERNAL_EMAIL_DOMAIN}`;
}
