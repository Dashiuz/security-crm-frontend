import React from "react";
import { Box } from "@mui/material";

export const metadata = {
  title: "Catálogo y Configuración Comercial | Noxia Security CRM",
  description: "Parametrización macroeconómica, motor tarifario oficial SVSP, catálogo de servicios, salarios de guardas e identidad corporativa camaleón.",
};

export default function CommercialSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Box sx={{ width: "100%", height: "100%" }}>{children}</Box>;
}
