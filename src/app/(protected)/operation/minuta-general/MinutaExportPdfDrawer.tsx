"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  TextField,
  Chip,
  Paper,
  Avatar,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  PictureAsPdf as PictureAsPdfIcon,
  Business as BusinessIcon,
  DateRange as DateRangeIcon,
  CheckCircleOutline as CheckIcon,
  CorporateFare as CorporateFareIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import { Tenant } from "@/lib/api/auth";
import { HttpClient } from "@/lib/api/client";
import { generateMinutaRangePdf } from "@/lib/pdf/minutaPdfGenerator";
import { useNotification } from "@/providers/NotificationProvider";

interface MinutaExportPdfDrawerProps {
  open: boolean;
  onClose: () => void;
  isInternal: boolean;
  activeClientId?: string | null;
  activeClientName?: string | null;
  tenant: Tenant | null;
}

export default function MinutaExportPdfDrawer({
  open,
  onClose,
  isInternal,
  activeClientId,
  activeClientName,
  tenant,
}: MinutaExportPdfDrawerProps) {
  const { showSuccess, showError } = useNotification();
  const [startDate, setStartDate] = useState<string>(
    dayjs().startOf("month").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState<string>(
    dayjs().format("YYYY-MM-DD")
  );
  const [exporting, setExporting] = useState<boolean>(false);

  // Quick range helpers
  const applyPreset = (type: "today" | "week" | "month") => {
    const today = dayjs().format("YYYY-MM-DD");
    if (type === "today") {
      setStartDate(today);
      setEndDate(today);
    } else if (type === "week") {
      setStartDate(dayjs().subtract(7, "day").format("YYYY-MM-DD"));
      setEndDate(today);
    } else if (type === "month") {
      setStartDate(dayjs().startOf("month").format("YYYY-MM-DD"));
      setEndDate(today);
    }
  };

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      showError("Por favor indique la fecha inicial y final del reporte.");
      return;
    }

    if (dayjs(startDate).isAfter(dayjs(endDate))) {
      showError("La fecha inicial no puede ser posterior a la fecha final.");
      return;
    }

    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.append("isInternal", isInternal ? "true" : "false");
      params.append("take", "1000");
      params.append("startDate", startDate);
      params.append("endDate", endDate);

      if (!isInternal && activeClientId) {
        params.append("clientId", activeClientId);
      }

      const res = await HttpClient.get<any>(`/operation/minuta/general?${params.toString()}`);
      const minutas = Array.isArray(res) ? res : res.data || [];

      if (minutas.length === 0) {
        showError("No se encontraron registros de minuta en el rango de fechas seleccionado.");
        setExporting(false);
        return;
      }

      await generateMinutaRangePdf({
        minutas,
        tenant,
        filters: {
          startDate,
          endDate,
          clientName: !isInternal ? activeClientName || undefined : "Operaciones Internas",
        },
      });

      showSuccess(`Reporte consolidado generado con éxito (${minutas.length} registros).`);
      onClose();
    } catch (err: any) {
      console.error("PDF export error:", err);
      showError(err.message || "Error al generar el reporte en PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={onClose}
      title="Exportar Reporte Consolidado PDF"
      subtitle="Informe cronológico oficial con membrete corporativo y firmas"
      headerIcon={<PictureAsPdfIcon sx={{ color: "primary.main", fontSize: 28 }} />}
      width={{ xs: "100%", md: 460 }}
      actions={
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            width: "100%",
            flexDirection: { xs: "column-reverse", sm: "row" },
          }}
        >
          <Button
            onClick={onClose}
            color="inherit"
            disabled={exporting}
            sx={{ width: { xs: "100%", sm: "auto" }, textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleDownload}
            disabled={exporting}
            startIcon={
              exporting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <PictureAsPdfIcon />
              )
            }
            sx={{
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
              px: 3,
              py: 1,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {exporting ? "Generando Reporte..." : "Descargar Reporte PDF"}
          </Button>
        </Box>
      }
    >
      <Stack spacing={2.5} sx={{ py: 1 }}>
        {/* Sede / Alcance Banner */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "#f8fafc",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                bgcolor: isInternal ? "secondary.50" : "primary.50",
                color: isInternal ? "secondary.main" : "primary.main",
                width: 44,
                height: 44,
              }}
            >
              {isInternal ? <CorporateFareIcon /> : <BusinessIcon />}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}>
                {isInternal ? "Alcance Operativo" : "Sede / Conjunto Activo"}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                {isInternal
                  ? "Minutas Operativas Internas de la Empresa"
                  : activeClientName || "Todas las sedes autorizadas"}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Atajos Rápidos */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
            ATAJOS DE PERÍODO:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Chip
              label="Hoy"
              onClick={() => applyPreset("today")}
              variant="outlined"
              size="small"
              clickable
              sx={{ fontWeight: 600, borderRadius: 1.5 }}
            />
            <Chip
              label="Últimos 7 días"
              onClick={() => applyPreset("week")}
              variant="outlined"
              size="small"
              clickable
              sx={{ fontWeight: 600, borderRadius: 1.5 }}
            />
            <Chip
              label="Mes en Curso"
              onClick={() => applyPreset("month")}
              variant="outlined"
              color="primary"
              size="small"
              clickable
              sx={{ fontWeight: 600, borderRadius: 1.5 }}
            />
          </Stack>
        </Box>

        {/* Inputs de Rango */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <DateRangeIcon color="action" fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Rango de Fechas a Consultar
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <TextField
              label="Fecha Inicial (Desde)"
              type="date"
              fullWidth
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha Final (Hasta)"
              type="date"
              fullWidth
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </Paper>

        <Divider />

        {/* Especificaciones del Reporte */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
            EL DOCUMENTO GENERADO INCLUYE:
          </Typography>
          <Stack spacing={1}>
            {[
              "Membrete oficial con logo del tenant, NIT y datos legales",
              "Semáforo cromático por nivel de prioridad de novedad",
              "Detalle de anotación, ubicación y firma para entrega de puesto",
            ].map((text, idx) => (
              <Stack key={idx} direction="row" spacing={1} alignItems="center">
                <CheckIcon color="success" sx={{ fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                  {text}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Stack>
    </ResponsiveFormDrawer>
  );
}
