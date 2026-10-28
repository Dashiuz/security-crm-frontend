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
  blocks?: Array<{
    id?: string;
    type: string;
    title?: string;
    content: string;
  }>;
  serviceItems?: Array<{
    name: string;
    modality: string;
    hours: string;
    postsCount: number;
    monthlyTotal: number;
  }>;
  valueAddedItems?: Array<{
    itemName: string;
    quantity: number;
    periodicity: string;
    itemInternalCost: number;
    notes?: string;
  }>;
  signers?: Array<
    | AuthorizedSigner
    | {
        id: string;
        fullName: string;
        jobTitle: string;
        professionalCardNum?: string;
        signatureUrl?: string;
      }
  >;
  showSignatures?: boolean;
}

type PreviewDocItem =
  | { kind: "block"; block: { id?: string; type: string; title?: string; content: string }; estimatedHeight: number }
  | { kind: "html"; html: string; estimatedHeight: number }
  | { kind: "economic"; estimatedHeight: number }
  | { kind: "vag"; estimatedHeight: number }
  | { kind: "signatures"; estimatedHeight: number };

export default function ChameleonPdfPreview({
  skin,
  layout = DocumentHeaderLayout.MODERN_MINIMALIST,
  clientName = "CONJUNTO RESIDENCIAL LOS ALPES P.H.",
  clientNit = "901.442.189-3",
  clientCity = "Bogotá D.C.",
  proposalNumber = "PROP-2026-0042",
  date = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }),
  bodyHtml = "<p>Por medio de la presente, nos complace presentarles nuestra propuesta formal de servicios de vigilancia y seguridad privada armada y no armada...</p>",
  blocks,
  serviceItems = [
    {
      name: "Vigilancia Física 24 Horas",
      modality: "Arma Letal",
      hours: "Turno 2x2x2 (15h día / 9h noche)",
      postsCount: 1,
      monthlyTotal: 17270787,
    },
  ],
  valueAddedItems = [],
  signers = [],
  showSignatures = true,
}: ChameleonPdfPreviewProps) {
  const primaryColor = skin?.primaryBrandColorHex || "#1E1B4B";
  const accentColor = skin?.accentBrandColorHex || "#7C3AED";
  const companyName = skin?.companyLegalName || "NOXIA SEGURIDAD PRIVADA S.A.S.";
  const companyNit = skin?.companyNit || "NIT: 900.000.000-1";
  const svspLic = skin?.supervigilanciaLicense || "Resolución SVSP No. 004921";

  // Dynamic pagination packing
  const paginatedPages = React.useMemo(() => {
    const items: PreviewDocItem[] = [];

    if (blocks && blocks.length > 0) {
      for (const b of blocks) {
        const bType = (b.type || "").toUpperCase();
        if (bType === "TABLE_ECONOMIC") {
          items.push({ kind: "economic", estimatedHeight: 280 + serviceItems.length * 28 });
        } else if (bType === "TABLE_VAG") {
          if (valueAddedItems.length > 0) {
            items.push({ kind: "vag", estimatedHeight: 180 + valueAddedItems.length * 24 });
          }
        } else if (bType === "SIGNATURE_ROW") {
          if (showSignatures && signers.length > 0) {
            items.push({ kind: "signatures", estimatedHeight: 180 });
          }
        } else {
          const textLen = (b.content || "").replace(/<[^>]*>/g, "").length;
          const estimatedLines = Math.max(1, Math.ceil(textLen / 85));
          const estimatedH = (b.title ? 38 : 0) + estimatedLines * 24 + 40;
          items.push({ kind: "block", block: b, estimatedHeight: Math.min(650, estimatedH) });
        }
      }

      const hasEconomic = blocks.some((b) => (b.type || "").toUpperCase() === "TABLE_ECONOMIC");
      const hasVags = blocks.some((b) => (b.type || "").toUpperCase() === "TABLE_VAG");
      const hasSignatures = blocks.some((b) => (b.type || "").toUpperCase() === "SIGNATURE_ROW");

      if (!hasEconomic && serviceItems.length > 0) {
        items.push({ kind: "economic", estimatedHeight: 280 + serviceItems.length * 28 });
      }
      if (!hasVags && valueAddedItems.length > 0) {
        items.push({ kind: "vag", estimatedHeight: 180 + valueAddedItems.length * 24 });
      }
      if (!hasSignatures && showSignatures && signers.length > 0) {
        items.push({ kind: "signatures", estimatedHeight: 180 });
      }
    } else {
      const textLen = (bodyHtml || "").replace(/<[^>]*>/g, "").length;
      const estimatedLines = Math.max(1, Math.ceil(textLen / 85));
      const estimatedH = estimatedLines * 24 + 40;
      items.push({ kind: "html", html: bodyHtml, estimatedHeight: Math.min(650, estimatedH) });

      if (serviceItems.length > 0) {
        items.push({ kind: "economic", estimatedHeight: 280 + serviceItems.length * 28 });
      }
      if (valueAddedItems.length > 0) {
        items.push({ kind: "vag", estimatedHeight: 180 + valueAddedItems.length * 24 });
      }
      if (showSignatures && signers.length > 0) {
        items.push({ kind: "signatures", estimatedHeight: 180 });
      }
    }

    const PAGE_1_CAPACITY = 710;
    const PAGE_N_CAPACITY = 850;

    const pages: PreviewDocItem[][] = [];
    let currentPage: PreviewDocItem[] = [];
    let currentHeight = 0;

    for (const item of items) {
      const pageCap = pages.length === 0 ? PAGE_1_CAPACITY : PAGE_N_CAPACITY;
      if (currentPage.length > 0 && currentHeight + item.estimatedHeight > pageCap) {
        pages.push(currentPage);
        currentPage = [item];
        currentHeight = item.estimatedHeight;
      } else {
        currentPage.push(item);
        currentHeight += item.estimatedHeight;
      }
    }

    if (currentPage.length > 0 || pages.length === 0) {
      pages.push(currentPage);
    }

    return pages;
  }, [blocks, bodyHtml, serviceItems, valueAddedItems, signers, showSignatures]);

  const totalPages = paginatedPages.length;

  // Total calculation
  const subtotal = serviceItems.reduce((acc, curr) => acc + (Number(curr.monthlyTotal) || 0), 0);
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
          <Box sx={{ mb: 2.5, pb: 2, borderBottom: "1px solid #E2E8F0" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: "0.1em", color: primaryColor, display: "block" }}>
                  OFERTA TÉCNICO-COMERCIAL DE SEGURIDAD PRIVADA
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Régimen Especial SVSP • Ley 356 de 1994
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: "0.7rem" }}>
                  Referencia / Consecutivo
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accentColor, letterSpacing: "0.02em" }}>
                  {proposalNumber}
                </Typography>
              </Box>
            </Box>
          </Box>
        );
    }
  };

  const renderEconomicTable = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryColor, mb: 1, textTransform: "uppercase", fontSize: "0.82rem" }}>
        Estructura Económica y Tarifas Mensuales (Decreto Ley SVSP 2026)
      </Typography>

      <TableContainer component={Box} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
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
                  $ {(Number(item.monthlyTotal) || 0).toLocaleString("es-CO")}
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ bgcolor: "rgba(241, 245, 249, 0.4)" }}>
              <TableCell colSpan={4} align="right" sx={{ fontWeight: 700, fontSize: "0.78rem" }}>
                Subtotal Antes de Impuestos:
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                $ {(Number(subtotal) || 0).toLocaleString("es-CO")}
              </TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: "rgba(241, 245, 249, 0.4)" }}>
              <TableCell colSpan={4} align="right" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                IVA sobre AIU (19% sobre base AIU 10%):
              </TableCell>
              <TableCell align="right" sx={{ fontSize: "0.78rem" }}>
                $ {(Number(iva) || 0).toLocaleString("es-CO")}
              </TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: "primary.soft" }}>
              <TableCell colSpan={4} align="right" sx={{ fontWeight: 800, fontSize: "0.85rem", color: primaryColor }}>
                TOTAL FACTURADO CON IVA (COP):
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.92rem", color: primaryColor }}>
                $ {(Number(total) || 0).toLocaleString("es-CO")}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderVagTable = () => (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 800, color: primaryColor, mb: 1, textTransform: "uppercase", fontSize: "0.82rem" }}
      >
        Valores Agregados y Beneficios en Especie (100% Bonificados / Cortesía Comercial)
      </Typography>
      <TableContainer component={Box} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#F8FAFC" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#475569" }}>Beneficio / Comodato Institucional</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#475569" }}>Cantidad</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#475569" }}>Periodicidad</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#475569" }}>Valor de Referencia</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#059669" }}>Facturado al Cliente</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {valueAddedItems.map((vag, idx) => (
              <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#F8FAFC" } }}>
                <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                  {vag.itemName}
                  {vag.notes && (
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: "0.7rem" }}>
                      {vag.notes}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: "0.8rem" }}>{vag.quantity}</TableCell>
                <TableCell sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                  {vag.periodicity === "MONTHLY_RECURRING" ? "Mensual Recurrente" : vag.periodicity === "ANNUAL_RENEWAL" ? "Anual (Renovación)" : "Única Vez (Instalación)"}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: "0.78rem", color: "text.secondary", textDecoration: "line-through" }}>
                  $ {Number(vag.itemInternalCost || 0).toLocaleString("es-CO")}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.82rem", color: "#059669" }}>
                  $ 0 COP (CORTESÍA)
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderSigners = () => (
    <Box sx={{ mt: "auto", pt: 1, borderTop: "1px dashed", borderColor: "divider" }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-around">
        {signers.map((s) => (
          <Box key={s.id} sx={{ textAlign: "center", minWidth: 160, py: 0.25 }}>
            {s.signatureUrl ? (
              <Box
                component="img"
                src={s.signatureUrl}
                alt={s.fullName}
                sx={{ height: 30, objectFit: "contain", mx: "auto", mb: 0.25 }}
              />
            ) : (
              <Box sx={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic", fontSize: "0.65rem" }}>
                  [Firma Digital Registrada]
                </Typography>
              </Box>
            )}
            <Divider sx={{ borderColor: primaryColor, mb: 0.3, width: "60%", mx: "auto" }} />
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.75rem", lineHeight: 1.2 }}>
              {s.fullName}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: "0.66rem", lineHeight: 1.2 }}>
              {s.jobTitle}
            </Typography>
            {s.professionalCardNum && (
              <Typography variant="caption" sx={{ fontSize: "0.62rem", color: "text.secondary", display: "block", lineHeight: 1.1 }}>
                T.P. {s.professionalCardNum}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        "@media print": {
          gap: 0,
          p: 0,
          bgcolor: "transparent",
          display: "block",
        },
      }}
    >
      {/* Reglas de impresión dedicadas para eliminar artefactos de modales y navegadores */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: letter;
            margin: 8mm 10mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > *:not(.MuiDialog-root) {
            display: none !important;
          }
          .MuiBackdrop-root,
          .MuiDialogTitle-root,
          .MuiDialogActions-root,
          .no-print {
            display: none !important;
          }
          .MuiDialog-root {
            position: static !important;
            display: block !important;
            inset: auto !important;
            z-index: auto !important;
          }
          .MuiDialog-container {
            display: block !important;
            position: static !important;
            height: auto !important;
            padding: 0 !important;
          }
          .MuiDialog-paper {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            max-height: none !important;
            height: auto !important;
            max-width: 100% !important;
            width: 100% !important;
            overflow: visible !important;
          }
          .MuiDialogContent-root {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            border: none !important;
            display: block !important;
          }
        }
      `}} />
      {paginatedPages.map((pageItems, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;

        return (
          <React.Fragment key={`page-${pageIdx}`}>
            {/* Separador Visual entre Páginas (Oculto al imprimir) */}
            {pageIdx > 0 && (
              <Divider
                sx={{
                  width: "100%",
                  maxWidth: 780,
                  my: 0.5,
                  borderColor: "rgba(255,255,255,0.15)",
                  "@media print": { display: "none" },
                }}
              >
                <Chip
                  label={`PÁGINA ${pageIdx + 1} DE ${totalPages} • CONTINUACIÓN DOCUMENTO A4`}
                  size="small"
                  sx={{
                    bgcolor: "#0F172A",
                    color: "#94A3B8",
                    fontWeight: 800,
                    fontSize: "0.7rem",
                    letterSpacing: "0.05em",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
              </Divider>
            )}

            <Paper
              elevation={4}
              className="a4-print-page"
              sx={{
                width: "100%",
                maxWidth: 780,
                minHeight: 1040,
                p: { xs: 3, sm: 4.5 },
                bgcolor: "#ffffff",
                color: "#1e293b",
                fontFamily: "'Inter', sans-serif",
                borderRadius: 2,
                border: "1px solid #E2E8F0",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                "@media print": {
                  boxShadow: "none",
                  border: "none",
                  borderRadius: 0,
                  p: 3,
                  maxWidth: "100%",
                  minHeight: "auto",
                  pageBreakAfter: !isLastPage ? "always" : "auto",
                  breakAfter: !isLastPage ? "page" : "auto",
                },
              }}
            >
              {/* Header según posición de la página */}
              {isFirstPage ? (
                <>
                  {renderHeader()}
                  {/* Meta Destinatario */}
                  <Box
                    sx={{
                      mb: 3,
                      p: 2,
                      bgcolor: "rgba(241, 245, 249, 0.7)",
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
                </>
              ) : (
                /* Cabecera Páginas Continuación */
                <Box
                  sx={{
                    mb: 2.5,
                    pb: 1.5,
                    borderBottom: "1.5px solid #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: primaryColor, letterSpacing: "0.08em", lineHeight: 1, display: "block" }}>
                      {pageItems.some((it) => it.kind === "economic" || it.kind === "vag")
                        ? "ANEXO ECONÓMICO Y ESPECIFICACIONES"
                        : `CONTINUACIÓN PROPUESTA COMERCIAL • PÁGINA ${pageIdx + 1}`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                      Propuesta Técnico-Comercial SVSP • {clientName}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: "0.68rem" }}>
                      Consecutivo
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accentColor, letterSpacing: "0.02em" }}>
                      {proposalNumber}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Contenido dinámico empaquetado para esta página */}
              <Box sx={{ flex: 1 }}>
                {pageItems.map((item, itemIdx) => {
                  if (item.kind === "block") {
                    return (
                      <Box key={item.block.id || `preview-block-${itemIdx}`} sx={{ mb: 2 }}>
                        {item.block.title && (
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 800, color: primaryColor, mb: 0.75, textTransform: "uppercase", fontSize: "0.85rem" }}
                          >
                            {item.block.title}
                          </Typography>
                        )}
                        <Box
                          sx={{
                            lineHeight: 1.6,
                            fontSize: "0.88rem",
                            color: "#1E293B",
                            "& p": { mb: 1.25 },
                            "& ul, & ol": { pl: 3, mb: 1.25 },
                          }}
                          dangerouslySetInnerHTML={{ __html: item.block.content }}
                        />
                      </Box>
                    );
                  }

                  if (item.kind === "html") {
                    return (
                      <Box
                        key="body-html-content"
                        sx={{
                          mb: 3,
                          lineHeight: 1.6,
                          fontSize: "0.88rem",
                          "& p": { mb: 1.25 },
                          "& h1, & h2, & h3": { color: primaryColor, mt: 2, mb: 1 },
                          "& ul, & ol": { pl: 3, mb: 1.25 },
                        }}
                        dangerouslySetInnerHTML={{ __html: item.html }}
                      />
                    );
                  }

                  if (item.kind === "economic") {
                    return <React.Fragment key="item-economic">{renderEconomicTable()}</React.Fragment>;
                  }

                  if (item.kind === "vag") {
                    return <React.Fragment key="item-vag">{renderVagTable()}</React.Fragment>;
                  }

                  if (item.kind === "signatures") {
                    return <React.Fragment key="item-signatures">{renderSigners()}</React.Fragment>;
                  }

                  return null;
                })}
              </Box>

              {/* Pie de página A4 */}
              {isLastPage ? (
                /* Footer Forense Criptográfico (Ley 527 de 1999) + Legal Credentials */
                <Box sx={{ mt: "auto", pt: 2, borderTop: "1px solid #E2E8F0" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B" }}>
                      {companyName} • {companyNit} • {svspLic}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "#94A3B8", fontFamily: "monospace" }}>
                      SHA-256: 7f8a9...b4c2
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Lock sx={{ fontSize: 11, color: "#94A3B8" }} />
                      <Typography variant="caption" sx={{ fontSize: "0.62rem", color: "#94A3B8" }}>
                        Documento emitido bajo Ley 527 de 1999 • Firma Digital y Trazabilidad Forense • Copia Oficial
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "#94A3B8", fontWeight: 700 }}>
                      Página {pageIdx + 1} de {totalPages} • Fin del Documento
                    </Typography>
                  </Box>
                </Box>
              ) : (
                /* Footer Páginas Intermedias */
                <Box
                  sx={{
                    mt: "auto",
                    pt: 2,
                    borderTop: "1px solid #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 600 }}>
                    {companyName} • {companyNit} • {svspLic}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "#94A3B8", fontWeight: 700 }}>
                    Página {pageIdx + 1} de {totalPages} • No. {proposalNumber}
                  </Typography>
                </Box>
              )}
            </Paper>
          </React.Fragment>
        );
      })}
    </Box>
  );
}
