import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Sidebar } from "@/src/components/shared/Sidebar";
import { ShiftStatusBadge } from "@/src/components/shifts/ShiftStatusBadge";
import { OrdersUrgentBanner } from "@/src/components/reparto/OrdersUrgentBanner";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Panteca",
  description: "Sistema de gestión interno",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <div>
          <Sidebar
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
