import type { Metadata } from "next";
import "./globals.css";
import "./estudio-plain.css";
import Navbar from "./components/layout/Navbar";
import { Outfit, Raleway } from "next/font/google";
import { AuthProvider } from "./context/AuthContext";
  // todo (navbar, pages, ...) puede acceder a saber si hay un usuario logueado.

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-raleway",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Simulador y gestión — Escribanos",
  description: "Simulador arancel notarial y gestión departamento legal y notarial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${raleway.variable} ${outfit.variable} antialiased`}
        style={{ fontFamily: "var(--font-raleway)" }}
      >
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
