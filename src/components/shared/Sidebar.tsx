"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  LayoutList,
  ChefHat,
  Users,
  Croissant,
  Truck,
  PackageSearch,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

const NAV = [
  { href: "/turnos", label: "Turnos", icon: Clock },
  { href: "/movimientos", label: "Movimientos", icon: LayoutList },
  { href: "/reparto", label: "Reparto diario", icon: Truck },
  { href: "/pedidos", label: "Pedidos", icon: PackageSearch },
  { href: "/produccion", label: "Producción", icon: ChefHat },
  { href: "/empleados", label: "Empleados", icon: Users },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

interface Props {
  shiftBadge: ReactNode;
}

export function Sidebar({ shiftBadge }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navContent = (
    <>
      {/* Logo */}
      <div className="border-b border-stone-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-600">
              <Croissant className="size-4 text-white" />
            </div>

            <div>
              <p className="text-sm font-semibold leading-none text-stone-900">
                Panteca
              </p>
              <p className="mt-0.5 text-xs text-stone-400">Gestión interna</p>
            </div>
          </div>
          {/* Botón cerrar — solo mobile */}
          <button
            className="lg:hidden rounded-lg p-1.5 text-stone-400 hover:bg-stone-100"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Turno activo */}
      <div className="border-b border-stone-100 px-4 py-3">{shiftBadge}</div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(!open)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-amber-50 text-amber-700"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  active ? "text-amber-600" : "text-stone-400",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-100 px-6 py-4">
        <p className="text-xs text-stone-400">
          © {new Date().getFullYear()} Panteca
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop: sidebar fijo ──────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-20 h-screen w-64 flex-col border-r border-stone-200 bg-white">
        {navContent}
      </aside>

      {/* ── Mobile: botón hamburguesa ──────────────────────────────────────── */}
      <button
        className="lg:hidden fixed top-3 left-3 z-40 flex size-10 items-center justify-center rounded-xl bg-white border border-stone-200 shadow-sm text-stone-600 hover:bg-stone-50"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>

      {/* ── Mobile: overlay ────────────────────────────────────────────────── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile: drawer ─────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-stone-200 bg-white shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
