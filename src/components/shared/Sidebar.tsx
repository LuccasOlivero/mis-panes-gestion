"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  ShoppingCart,
  TrendingDown,
  ChefHat,
  Users,
  Croissant,
} from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import { ShiftStatusBadge } from "../shifts/ShiftStatusBadge";

const NAV = [
  { href: "/turnos", label: "Turnos", icon: Clock },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/gastos", label: "Gastos", icon: TrendingDown },
  { href: "/produccion", label: "Producción", icon: ChefHat },
  { href: "/empleados", label: "Empleados", icon: Users },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col border-r border-stone-200 bg-white">
      {/* Logo */}
      <div className="border-b border-stone-100 px-6 py-5">
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
      </div>

      {/* Turno activo — Server Component asyncrono */}
      <div className="border-b border-stone-100 px-4 py-3">
        <ShiftStatusBadge />
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
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

      {/* Footer */}
      <div className="border-t border-stone-100 px-6 py-4">
        <p className="text-xs text-stone-400">
          © {new Date().getFullYear()} Panteca
        </p>
      </div>
    </aside>
  );
}
