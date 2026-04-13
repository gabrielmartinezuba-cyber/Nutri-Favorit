import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import ClientLayout from "@/components/layout/ClientLayout";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Favorit AI - Nutrición & Congelados",
  description: "Asistente nutricional inteligente y tienda premium de Favorit.",
};

export const viewport: Viewport = {
  themeColor: "#6B2139",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      {/*
        body ya NO tiene pb-24 fijo — ClientLayout lo aplica
        solo en las rutas de tienda donde existe el Bottombar.
      */}
      <body className="min-h-full bg-stone-100 flex flex-col font-sans relative">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
