import "./globals.css";

import { ShiftStatusBadge } from "@/src/components/shifts/ShiftStatusBadge";
import { Sidebar } from "@/src/components/shared/Sidebar";

import { Suspense } from "react";

import { Geist, Geist_Mono } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

/**
 * layout.tsx es Server Component → puede renderizar ShiftStatusBadge (async Server Component).
 * Se pasa como prop al Sidebar (Client Component) usando el patrón "children como slot".
 * Así el Client Component nunca llama directamente al Server Component.
 *
 * Suspense es obligatorio porque ShiftStatusBadge hace un fetch asíncrono.
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <div className="flex min-h-screen">
          <Sidebar
            shiftBadge={
              <Suspense fallback={<ShiftBadgeSkeleton />}>
                <ShiftStatusBadge />
              </Suspense>
            }
          />
          <main className="ml-64 min-h-screen flex-1 bg-stone-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function ShiftBadgeSkeleton() {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-stone-50 px-2 py-1.5 animate-pulse">
      <div className="size-2.5 rounded-full bg-stone-200" />
      <div className="h-3 w-28 rounded bg-stone-200" />
    </div>
  );
}
