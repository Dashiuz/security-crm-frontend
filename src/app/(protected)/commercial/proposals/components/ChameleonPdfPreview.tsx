"use client";

import React from "react";
import {
  Box,
  Typography,
  Stack,
  Divider,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
} from "@mui/material";
import {
  VerifiedUser,
  Shield,
  MilitaryTech,
  Lock,
} from "@mui/icons-material";
import {
  DocumentHeaderLayout,
  TenantDocumentSkin,
  AuthorizedSigner,
} from "@/lib/api/commercial-settings";

interface ChameleonPdfPreviewProps {
  skin?: Partial<TenantDocumentSkin> | null;
  layout?: DocumentHeaderLayout;
  clientName?: string;
  clientNit?: string;
  clientCity?: string;
  proposalNumber?: string;
  date?: string;
  bodyHtml?: string;
  serviceItems?: Array<{
    name: string;
    modality: string;
    hours: string;
    postsCount: number;
    monthlyTotal: number;
  }>;
  signers?: AuthorizedSigner[];
}

export default function ChameleonPdfPreview({
  skin,
  layout = DocumentHeaderLayout.MODERN_MINIMALIST,
  clientName = "CONJUNTO RESIDENCIAL LOS ALPES P.H.",
  clientNit = "901.442.189-3",
  clientCity = "Bogotá D.C.",
  proposalNumber = "PROP-2026-0042",
  date = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }),
  bodyHtml = "<p>Por medio de la presente, nos complace presentarles nuestra propuesta formal de servicios de vigilancia y seguridad privada armada y no armada...</p>",
  serviceItems = [
    {
      name: "Vigilancia Física 24 Horas",
      modality: "Arma Letal",
      hours: "Turno 2x2x2 (15h día / 9h noche)",
      postsCount: 1,
      monthlyTotal: 17270787,
    },
  ],
  signers = [],
}: ChameleonPdfPreviewProps) {
  const primaryColor = skin?.primaryBrandColorHex || "#1E1B4B";
  const accentColor = skin?.accentBrandColorHex || "#7C3AED";
  const companyName = skin?.companyLegalName || "NOXIA SEGURIDAD PRIVADA S.A.S.";
  const companyNit = skin?.companyNit || "NIT: 900.000.000-1";
  const svspLic = skin?.supervigilanciaLicense || "Resolución SVSP No. 004921";

  // Total calculation
  const subtotal = serviceItems.reduce((acc, curr) => acc + curr.monthlyTotal, 0);
  const aiu = subtotal * 0.1;
  const iva = aiu * 0.19;
  const total = subtotal + iva;

  // Render Header according to selected layout
  const renderHeader = () => {
    switch (layout) {
      case DocumentHeaderLayout.CLASSIC_CORPORATE:
        return (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                bgcolor: primaryColor,
                color: "#ffffff",
                p: 2,
                borderRadius: "4px 4px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "0.02em" }}>
                  {companyName}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {companyNit} • {svspLic}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "#ffffff", color: primaryColor, px: 1.5, py: 0.75, borderRadius: 1, fontWeight: 800 }}>
                PROPUESTA ECONÓMICA
              </Box>
            </Box>
            <Box sx={{ height: 4, bgcolor: accentColor }} />
          </Box>
        );

      case DocumentHeaderLayout.EDITORIAL_CENTERED:
        return (
          <Box sx={{ textAlign: "center", mb: 3, pt: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: primaryColor, fontFamily: "serif", letterSpacing: "0.04em" }}>
              {companyName}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
              {companyNit} • Vigilada por la Superintendencia de Vigilancia y Seguridad Privada
            </Typography>
            <Divider sx={{ borderColor: accentColor, width: 80, mx: "auto", borderWidth: 2, mb: 1.5 }} />
            <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: "0.15em", color: "text.secondary" }}>
              OFERTA COMERCIAL INSTITUCIONAL DE SEGURIDAD PRIVADA
            </Typography>
          </Box>
        );

      case DocumentHeaderLayout.FRAME_ACCREDITED:
        return (
          <Box
            sx={{
              p: 2,
              mb: 3,
              border: `2px solid ${primaryColor}`,
              borderRadius: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: primaryColor }}>
                {companyName}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                {companyNit} • {svspLic}
              </Typography>
              <Typography variant="caption" sx={{ color: accentColor, fontWeight: 700 }}>
                {proposalNumber}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {skin?.hasIso9001Certified !== false && (
                <Chip icon={<VerifiedUser sx={{ fontSize: 13 }} />} label="ISO 9001" size="small" variant="outlined" sx={{ fontSize: "0.65rem", fontWeight: 700 }} />
              )}
              {skin?.hasBascCertified !== false && (
                <Chip icon={<Shield sx={{ fontSize: 13 }} />} label="BASC V6" size="small" variant="outlined" sx={{ fontSize: "0.65rem", fontWeight: 700 }} />
              )}
              {skin?.hasPoliceSupportNetwork !== false && (
                <Chip icon={<MilitaryTech sx={{ fontSize: 13 }} />} label="Red Apoyo PONAL" size="small" variant="outlined" sx={{ fontSize: "0.65rem", fontWeight: 700 }} />
              )}
            </Stack>
          </Box>
        );

      case DocumentHeaderLayout.MODERN_MINIMALIST:
      default:
        return (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                <Box sx={{ width: 4, height: 44, bgcolor: primaryColor, borderRadius: 1 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: primaryColor, lineHeight: 1.1 }}>
                    {companyName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {companyNit} • {svspLic}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  Número Consecutivo
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accentColor }}>
                  {proposalNumber}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ mt: 1.5, borderColor: "divider" }} />
          </Box>
        );
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: "100%",
        maxWidth: 720,
        mx: "auto",
        p: 4,
        bgcolor: "#ffffff",
        color: "#1e293b",
        fontFamily: "'Inter', sans-serif",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        position: "relative",
      }}
    >
      {/* Header */}
      {renderHeader()}

      {/* Meta Destinatario */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          bgcolor: "rgba(241, 245, 249, 0.6)",
          borderRadius: 1.5,
          borderLeft: `4px solid ${primaryColor}`,
        }}
      >
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 7 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              Señores / Razón Social:
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {clientName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              NIT: {clientNit} • {clientCity}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }} sx={{ textAlign: { xs: "left", sm: "right" } }}>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              Fecha de Emisión:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {date}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Validez: 15 Días Calendario
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Cuerpo de la Propuesta (TipTap render) */}
      <Box
        sx={{
          mb: 3,
          lineHeight: 1.6,
          fontSize: "0.88rem",
          "& p": { mb: 1.25 },
          "& h1, & h2, & h3": { color: primaryColor, mt: 2, mb: 1 },
          "& ul, & ol": { pl: 3, mb: 1.25 },
        }}
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

      {/* Tabla Económica Homologada SVSP */}
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryColor, mb: 1, textTransform: "uppercase" }}>
        Estructura Económica y Tarifas Mensuales (Decreto Ley SVSP 2026)
      </Typography>

      <TableContainer component={Box} sx={{ mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: primaryColor }}>
            <TableRow>
              <TableCell sx={{ color: "#ffffff", fontWeight: 700, fontSize: "0.75rem" }}>Servicio</TableCell>
              <TableCell sx={{ color: "#ffffff", fontWeight: 700, fontSize: "0.75rem" }}>Modalidad</TableCell>
              <TableCell sx={{ color: "#ffffff", fontWeight: 700, fontSize: "0.75rem" }}>Programación</TableCell>
              <TableCell align="center" sx={{ color: "#ffffff", fontWeight: 700, fontSize: "0.75rem" }}>Puestos</TableCell>
              <TableCell align="right" sx={{ color: "#ffffff", fontWeight: 700, fontSize: "0.75rem" }}>Tarifa Mes (COP)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {serviceItems.map((item, idx) => (
              <TableRow key={idx} sx={{ "&:nth-of-type(even)": { bgcolor: "neutral.50" } }}>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>{item.name}</TableCell>
                <TableCell sx={{ fontSize: "0.78rem" }}>{item.modality}</TableCell>
                <TableCell sx={{ fontSize: "0.78rem" }}>{item.hours}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>{item.postsCount}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.82rem" }}>
                  $ {item.monthlyTotal.toLocaleString("es-CO")}
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ bgcolor: "rgba(241, 245, 249, 0.4)" }}>
              <TableCell colSpan={4} align="right" sx={{ fontWeight: 700, fontSize: "0.78rem" }}>
                Subtotal Antes de Impuestos:
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                $ {subtotal.toLocaleString("es-CO")}
              </TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: "rgba(241, 245, 249, 0.4)" }}>
              <TableCell colSpan={4} align="right" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                IVA sobre AIU (19% sobre base AIU 10%):
              </TableCell>
              <TableCell align="right" sx={{ fontSize: "0.78rem" }}>
                $ {iva.toLocaleString("es-CO")}
              </TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: "primary.soft" }}>
              <TableCell colSpan={4} align="right" sx={{ fontWeight: 800, fontSize: "0.85rem", color: primaryColor }}>
                TOTAL FACTURADO CON IVA (COP):
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.92rem", color: primaryColor }}>
                $ {total.toLocaleString("es-CO")}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bloque de Firmas Autorizadas */}
      <Box sx={{ mt: 4, pt: 2, borderTop: "1px dashed", borderColor: "divider" }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 2, textTransform: "uppercase" }}>
          Representación y Suscripción Formal
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={4} justifyContent="space-around">
          {signers.length > 0 ? (
            signers.map((s) => (
              <Box key={s.id} sx={{ textAlign: "center", minWidth: 200 }}>
                {s.signatureUrl ? (
                  <Box
                    component="img"
                    src={s.signatureUrl}
                    alt={s.fullName}
                    sx={{ height: 48, objectFit: "contain", mx: "auto", mb: 0.5 }}
                  />
                ) : (
                  <Box sx={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>
                      [Firma Digital Registrada]
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ borderColor: primaryColor, mb: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.82rem" }}>
                  {s.fullName}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  {s.jobTitle}
                </Typography>
                {s.professionalCardNum && (
                  <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "text.secondary" }}>
                    T.P. {s.professionalCardNum}
                  </Typography>
                )}
              </Box>
            ))
          ) : (
            <Box sx={{ textAlign: "center", minWidth: 220 }}>
              <Box sx={{ height: 40 }} />
              <Divider sx={{ borderColor: primaryColor, mb: 0.5 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.82rem" }}>
                Dirección Comercial / Representante Legal
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                {companyName}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Footer Forense Criptográfico (Ley 527 de 1999) */}
      <Box sx={{ mt: 4, pt: 1.5, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Lock sx={{ fontSize: 13, color: "text.secondary" }} />
          <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>
            Documento emitido bajo Ley 527 de 1999 • Firma Digital y Trazabilidad Forense
          </Typography>
        </Stack>
        <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary", fontFamily: "monospace" }}>
          SHA-256: 7f8a9...b4c2
        </Typography>
      </Box>
    </Paper>
  );
}
