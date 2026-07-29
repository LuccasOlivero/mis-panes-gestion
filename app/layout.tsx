import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { headers } from "next/headers";
import "./globals.css";
import { Sidebar } from "@/src/components/shared/Sidebar";
import { ShiftStatusBadge } from "@/src/components/shifts/ShiftStatusBadge";
import { OrdersUrgentBanner } from "@/src/components/reparto/OrdersUrgentBanner";
import { getCurrentSession } from "@/src/lib/auth/session";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Panteca",
  description: "Sistema de gestión interno",
};

const BARE_PATHS = ["/login", "/acceso-denegado"];

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? "";
  const isBarePath = BARE_PATHS.includes(pathname);
  const session = isBarePath ? null : await getCurrentSession();

  return (
    <html lang="es">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        {isBarePath ? (
          children
        ) : (
          <div>
            <Sidebar
              role={session?.appRole}
              userDisplayName={session?.fullName}
              shiftBadge={
                <Suspense fallback={<ShiftBadgeSkeleton />}>
                  <ShiftStatusBadge />
                </Suspense>
              }
            />
            {/* Desktop: ml-64 para compensar sidebar fijo. Mobile: sin margen */}
            <div className="flex h-full flex-1 flex-col bg-stone-50 lg:ml-64">
              <Suspense fallback={null}>
                <OrdersUrgentBanner />
              </Suspense>
              {/* Padding top en mobile para el botón hamburguesa */}
              <main className="flex-1 pt-14 lg:pt-0">{children}</main>
            </div>
          </div>
        )}
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
