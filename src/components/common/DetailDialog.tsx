"use client";

import React, { useState } from "react";
import {
  Button,
  Grid,
  Typography,
  Box,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  LocationOnOutlined as LocationIcon,
  PersonOutline as PersonIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  CampaignOutlined as CampaignIcon,
  ShieldOutlined as ShieldIcon,
  InfoOutlined as InfoIcon,
  AssignmentOutlined as AssignmentIcon,
} from "@mui/icons-material";
import ResponsiveDetailWrapper from "./ResponsiveDetailWrapper";

export interface DetailField {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  category?: "novedad" | "general" | "tiempo" | "ubicacion" | "vinculo" | "auditoria" | "estado" | string;
  highlight?: boolean;
}

interface DetailDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fields: DetailField[];
  headerContent?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export default function DetailDialog({
  open,
  onClose,
  title,
  subtitle,
  fields,
  headerContent,
  secondaryAction,
}: DetailDialogProps) {
  const [copiedId, setCopiedId] = useState(false);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Helper to categorize fields dynamically if category is not explicitly passed
  const categorizeField = (field: DetailField) => {
    if (field.category) return field.category;
    const l = field.label.toLowerCase();
    if (
      l.includes("anotación") ||
      l.includes("anotacion") ||
      l.includes("novedad") ||
      l.includes("descripción") ||
      l.includes("descripcion") ||
      l.includes("observación") ||
      l.includes("observaciones")
    ) {
      return "novedad";
    }
    if (l.includes("id ") || l === "id" || l.includes("radicado") || l.includes("guía") || l.includes("guia")) {
      return "identificador";
    }
    if (l.includes("fecha") || l.includes("hora")) {
      return "tiempo";
    }
    if (l.includes("puesto") || l.includes("ubicación") || l.includes("ubicacion") || l.includes("lugar")) {
      return "ubicacion";
    }
    if (l.includes("residente") || l.includes("cliente") || l.includes("visitante") || l.includes("conductor") || l.includes("destinatario") || l.includes("fuente") || l.includes("origen")) {
      return "vinculo";
    }
    if (l.includes("registrado por") || l.includes("creado por") || l.includes("recepcionado por") || l.includes("cargo")) {
      return "auditoria";
    }
    if (l.includes("prioridad") || l.includes("categoría") || l.includes("categoria") || l.includes("estado") || l.includes("confidencial")) {
      return "estado";
    }
    return "general";
  };

  // Extract special highlighted fields
  const idField = fields.find((f) => {
    const l = f.label.toLowerCase();
    return l.includes("id registro") || l === "id" || l.includes("código") || l.includes("radicado");
  });

  const noveltyField = fields.find((f) => {
    const l = f.label.toLowerCase();
    return (
      f.highlight ||
      l.includes("anotación") ||
      l.includes("anotacion") ||
      l.includes("novedad") ||
      l.includes("descripción") ||
      l.includes("descripcion") ||
      l.includes("observación")
    );
  });

  // Extract status & priority fields to render as upper quick-stats badges
  const badgeFields = fields.filter((f) => {
    const l = f.label.toLowerCase();
    return (
      l.includes("prioridad") ||
      l.includes("categoría") ||
      l.includes("categoria") ||
      l.includes("estado") ||
      l.includes("confidencial") ||
      l.includes("tipo")
    );
  });

  // Regular grid fields (excluding id, novelty which get special prominent placement)
  const regularFields = fields.filter((f) => f !== idField && f !== noveltyField && !badgeFields.includes(f));

  // Audit fields (created by, createdAt)
  const auditFields = regularFields.filter((f) => categorizeField(f) === "auditoria");
  const coreFields = regularFields.filter((f) => categorizeField(f) !== "auditoria");

  return (
    <ResponsiveDetailWrapper
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
          gap={1.5}
          flexDirection={{ xs: "column-reverse", sm: "row" }}
        >
          <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
            {secondaryAction}
          </Box>
          <Button
            onClick={onClose}
            variant="contained"
            color="primary"
            sx={{
              px: 4,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              width: { xs: "100%", sm: "auto" },
              boxShadow: "none",
            }}
          >
            Cerrar
          </Button>
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* HERO SECTION: MEDIA EVIDENCE OR FALLBACK BANNER */}
        {headerContent && (
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 3,
              bgcolor: (theme) => (theme.palette.mode === "dark" ? "#141414" : "#f1f3f5"),
              border: "1px solid",
              borderColor: "divider",
              textAlign: "center",
              overflow: "hidden",
            }}
          >
            {headerContent}
          </Paper>
        )}

        {/* SUBTITLE */}
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: -1 }}>
            {subtitle}
          </Typography>
        )}

        {/* TOP STATUS BAR: ID + QUICK BADGES */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            p: 1.5,
            bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {idField ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                {idField.label}:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  bgcolor: (theme) => (theme.palette.mode === "dark" ? "#262626" : "#e9ecef"),
                  px: 1,
                  py: 0.3,
                  borderRadius: 1,
                  fontSize: "0.8rem",
                }}
              >
                {String(idField.value)}
              </Typography>
              <Tooltip title={copiedId ? "¡Copiado!" : "Copiar ID"}>
                <IconButton size="small" onClick={() => handleCopy(String(idField.value))} sx={{ p: 0.5 }}>
                  {copiedId ? <CheckIcon sx={{ fontSize: 16, color: "success.main" }} /> : <CopyIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <ShieldIcon sx={{ fontSize: 18, color: "primary.main" }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                Registro Activo
              </Typography>
            </Box>
          )}

          {badgeFields.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} alignItems="center">
              {badgeFields.map((bf, idx) => (
                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {React.isValidElement(bf.value) ? (
                    bf.value
                  ) : (
                    <Chip
                      size="small"
                      label={`${bf.label}: ${bf.value ?? "N/A"}`}
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                    />
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {/* PROMINENT EVENT / NOVELTY CARD ("LA NOTICIA") */}
        {noveltyField && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: (theme) => (theme.palette.mode === "dark" ? "primary.dark" : "primary.light"),
              bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(25, 118, 210, 0.08)" : "rgba(25, 118, 210, 0.04)"),
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <CampaignIcon sx={{ color: "primary.main", fontSize: 22 }} />
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: "primary.main",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontSize: "0.78rem",
                }}
              >
                {noveltyField.label}
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                color: "text.primary",
                lineHeight: 1.6,
                wordBreak: "break-word",
                pl: 0.5,
              }}
            >
              {noveltyField.value ?? "Sin anotaciones"}
            </Typography>
          </Paper>
        )}

        {/* CORE INFORMATION GRID TILES */}
        {coreFields.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              bgcolor: (theme) => (theme.palette.mode === "dark" ? "#1e1e1e" : "#ffffff"),
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{
                mb: 2,
                fontWeight: 700,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <AssignmentIcon sx={{ fontSize: 17, color: "primary.main" }} />
              Información del Registro
            </Typography>

            <Grid container spacing={2}>
              {coreFields.map((field, index) => {
                const category = categorizeField(field);
                let IconComponent = InfoIcon;
                if (category === "tiempo") IconComponent = field.label.toLowerCase().includes("hora") ? TimeIcon : CalendarIcon;
                if (category === "ubicacion") IconComponent = LocationIcon;
                if (category === "vinculo") IconComponent = PersonIcon;

                return (
                  <Grid key={index} size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "#f8f9fa"),
                        border: "1px solid",
                        borderColor: "divider",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: "primary.light",
                          bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "#f1f3f5"),
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.5 }}>
                        <IconComponent sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                          {field.label}
                        </Typography>
                      </Box>
                      <Box sx={{ pl: 2.8 }}>
                        {React.isValidElement(field.value) ? (
                          field.value
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: "text.primary",
                              wordBreak: "break-word",
                            }}
                          >
                            {field.value ?? "N/A"}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        )}

        {/* AUDIT & TRACEABILITY METADATA */}
        {auditFields.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "#f8f9fa"),
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "block",
                mb: 1.5,
              }}
            >
              Auditoría y Trazabilidad
            </Typography>

            <Grid container spacing={1.5}>
              {auditFields.map((af, idx) => (
                <Grid key={idx} size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {af.label}:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {af.value ?? "Sistema"}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
      </Box>
    </ResponsiveDetailWrapper>
  );
}
