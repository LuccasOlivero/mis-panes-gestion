// ─── Tipos de pan ─────────────────────────────────────────────────────────────

export const BREAD_TYPES = [
  { key: "mignones", label: "Mignones" },
  { key: "biz_gordos", label: "Biz. gordos" },
  { key: "biz_chatos", label: "Biz. chatos" },
  { key: "facturas", label: "Facturas" },
  { key: "salvado_sal", label: "Salvado c/sal" },
  { key: "salvado_sin_sal", label: "Salvado s/sal" },
  { key: "cuernitos", label: "Cuernitos" },
  { key: "chipaco", label: "Chipaco" },
  { key: "tortillas", label: "Tortillas" },
  { key: "caucas", label: "Caucas" },
  { key: "bollos", label: "Bollos" },
] as const;

export type BreadKey = (typeof BREAD_TYPES)[number]["key"];

// ─── Entidad ──────────────────────────────────────────────────────────────────

export type BreadQuantities = Record<BreadKey, number>;

export interface ProductionRecord {
  id: string;
  recordDate: string; // "2026-03-19"
  quantities: BreadQuantities;
  notes: string | null;
  recordedBy: string | null; // nombre del empleado que creó
  lastEditedBy: string | null; // nombre del empleado que editó por última vez
  createdAt: string;
  updatedAt: string;
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface UpsertProductionInput {
  recordDate: string;
  quantities: BreadQuantities;
  authorName: string; // obligatorio al guardar
  notes?: string;
  isEdit: boolean; // true → actualiza lastEditedBy, false → recordedBy
}

// ─── Semana ───────────────────────────────────────────────────────────────────

export interface WeekRange {
  from: string; // lunes "2026-03-16"
  to: string; // domingo "2026-03-22"
  label: string; // "16 – 22 mar 2026"
}
