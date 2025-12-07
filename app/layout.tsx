import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--fuente-inter" });

export const metadata: Metadata = {
  title: "Planificador de itinerarios con persistencia",
  description:
    "Aplicación Next.js en español para gestionar itinerarios con actividades y franjas de color, lista para GitHub Actions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
