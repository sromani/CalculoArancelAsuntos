import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Escribanos Estudio",
  description: "Sistema notarial — experiencia moderna",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
