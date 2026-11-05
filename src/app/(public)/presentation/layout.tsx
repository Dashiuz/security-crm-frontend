import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loro ERP | Presentación del Sistema",
  description:
    "Presentación de Loro ERP: El sistema de gestión operativa, comercial y nómina especializada para empresas de seguridad y vigilancia privada.",
  openGraph: {
    title: "Loro ERP | Presentación del Sistema",
    description:
      "Descubra Loro ERP: Minutas con fotos, cotizador con tarifas de la Superintendencia 2026, mapas de cámaras y nómina de turnos 24/7.",
    type: "website",
  },
};

export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="presentation-layout-container">
      {children}
    </div>
  );
}
