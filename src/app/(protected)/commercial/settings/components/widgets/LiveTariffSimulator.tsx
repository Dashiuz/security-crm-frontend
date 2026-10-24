"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Stack,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  CalculateOutlined,
  LocalAtmOutlined,
} from "@mui/icons-material";
import {
  CommercialSector,
  WeaponModality,
  TariffPeriodConfig,
} from "@/lib/api/commercial-settings";
import { useTariffSimulation } from "../../hooks/useTariffSimulation";
import { noxiaPalette, jetBrainsMono } from "@/theme/noxiaTheme";

interface LiveTariffSimulatorProps {
  activePeriod?: TariffPeriodConfig | null;
}

const formatCOP = (val?: number) => {
  if (val === undefined || val === null || isNaN(val)) return "$ 0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(val);
};

export default function LiveTariffSimulator({ activePeriod }: LiveTariffSimulatorProps) {
  const { params, result, loading, updateParam } = useTariffSimulation(activePeriod?.id);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${noxiaPalette.primary.light}30`,
        background: `linear-gradient(145deg, #FFFFFF 0%, ${noxiaPalette.primary.soft} 100%)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          bgcolor: "#FFFFFF",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              p: 0.8,
              borderRadius: 2,
              bgcolor: `${noxiaPalette.primary.main}15`,
              color: noxiaPalette.primary.main,
              display: "flex",
            }}
          >
            <CalculateOutlined fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: noxiaPalette.secondary.main }}>
              Simulador Tarifario en Vivo
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Cálculo instantáneo de precios y retenciones tributarias
            </Typography>
          </Box>
        </Stack>
        {loading && <CircularProgress size={18} sx={{ color: noxiaPalette.primary.main }} />}
      </Box>

      <CardContent sx={{ p: 2.5 }}>
        {/* Parámetros de Selección */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="sector-select-label">Sector Económico</InputLabel>
              <Select
                labelId="sector-select-label"
                value={params.sector}
                label="Sector Económico"
                onChange={(e) => updateParam("sector", e.target.value as CommercialSector)}
              >
                <MenuItem value={CommercialSector.COMMERCIAL_PUBLIC}>Comercial y Público (8.8 SMMLV)</MenuItem>
                <MenuItem value={CommercialSector.RESIDENTIAL_STRATA_4_6}>Residencial Estratos 4, 5 y 6 (8.6 SMMLV)</MenuItem>
                <MenuItem value={CommercialSector.RESIDENTIAL_STRATA_1_3}>Residencial Estratos 1, 2 y 3 (7.66 SMMLV)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="modality-select-label">Modalidad de Arma</InputLabel>
              <Select
                labelId="modality-select-label"
                value={params.weaponModality}
                label="Modalidad de Arma"
                onChange={(e) => updateParam("weaponModality", e.target.value as WeaponModality)}
              >
                <MenuItem value={WeaponModality.LETHAL_WEAPON}>Con Arma Letal (A&S 10%)</MenuItem>
                <MenuItem value={WeaponModality.NO_WEAPON}>Sin Arma (A&S 8% Com / 10% Res)</MenuItem>
                <MenuItem value={WeaponModality.NON_LETHAL_WEAPON}>Arma No Letal (A&S 10%)</MenuItem>
                <MenuItem value={WeaponModality.CANINE_SUPPORT}>Medio Canino (A&S 11%)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Horas Día"
              value={params.dayHours}
              onChange={(e) => updateParam("dayHours", parseInt(e.target.value) || 0)}
              inputProps={{ min: 0, max: 24 }}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Horas Noche"
              value={params.nightHours}
              onChange={(e) => updateParam("nightHours", parseInt(e.target.value) || 0)}
              inputProps={{ min: 0, max: 24 }}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="days-select-label">Días Mes</InputLabel>
              <Select
                labelId="days-select-label"
                value={params.billableDays}
                label="Días Mes"
                onChange={(e) => updateParam("billableDays", Number(e.target.value))}
              >
                <MenuItem value={30}>30 (Mes Completo)</MenuItem>
                <MenuItem value={26}>26 (Lun-Sáb con Festivos)</MenuItem>
                <MenuItem value={24}>24 (Lun-Sáb)</MenuItem>
                <MenuItem value={22}>22 (Lun-Vie con Festivos)</MenuItem>
                <MenuItem value={20}>20 (Lun-Vie)</MenuItem>
                <MenuItem value={10}>10 (Fines de semana y Festivos)</MenuItem>
                <MenuItem value={8}>8 (Sáb y Dom)</MenuItem>
                <MenuItem value={2}>2 (Solo Festivos)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="% Descuento"
              value={params.discountPct ? params.discountPct * 100 : 0}
              onChange={(e) => updateParam("discountPct", (parseFloat(e.target.value) || 0) / 100)}
              inputProps={{ min: 0, max: 20, step: 0.5 }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        {/* Desglose Financiero */}
        <Box sx={{ bgcolor: "#FFFFFF", borderRadius: 2.5, p: 2, border: "1px solid rgba(0,0,0,0.06)" }}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Tarifa Base 24h
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: jetBrainsMono.style.fontFamily }}>
                {formatCOP(result?.tariffBase24h)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Costo Directo Mensual
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: jetBrainsMono.style.fontFamily }}>
                {formatCOP(result?.directCost)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                A&S ({((result?.adminSupervisionPct || 0) * 100).toFixed(0)}%)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: jetBrainsMono.style.fontFamily }}>
                {formatCOP(result?.adminSupervisionValue)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Subtotal antes de IVA
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: jetBrainsMono.style.fontFamily }}>
                {formatCOP(result?.subtotalBeforeTax)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Base AIU (10%)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: jetBrainsMono.style.fontFamily }}>
                {formatCOP(result?.aiuBaseValue)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                IVA sobre AIU (19%)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: jetBrainsMono.style.fontFamily }}>
                {formatCOP(result?.ivaValue)}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 1.5 }} />

          {/* TOTAL DESTACADO */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${noxiaPalette.primary.main}10`,
              border: `1px solid ${noxiaPalette.primary.main}30`,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: noxiaPalette.primary.dark, fontWeight: 700, textTransform: "uppercase" }}>
                Total Factura Mensual (Con IVA)
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: noxiaPalette.primary.main,
                  fontFamily: jetBrainsMono.style.fontFamily,
                  letterSpacing: -0.5,
                }}
              >
                {formatCOP(result?.totalWithTax)}
              </Typography>
            </Box>
            <Chip
              icon={<LocalAtmOutlined sx={{ fontSize: "16px !important" }} />}
              label={`Día: ${formatCOP(result?.dailyRate)}`}
              size="small"
              sx={{
                fontWeight: 600,
                bgcolor: "#FFFFFF",
                border: `1px solid ${noxiaPalette.primary.light}40`,
                fontFamily: jetBrainsMono.style.fontFamily,
              }}
            />
          </Box>

          {/* Resumen Tributario y Retenciones */}
          <Stack direction="row" spacing={2} sx={{ mt: 1.5 }} justifyContent="space-between">
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              ReteFuente (2% AIU): <b>{formatCOP(result?.retefuenteValue)}</b>
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              ReteICA (1.38% Sub): <b>{formatCOP(result?.reteIcaValue)}</b>
            </Typography>
            <Typography variant="caption" sx={{ color: noxiaPalette.success.dark, fontWeight: 600 }}>
              Neto a recibir: <b>{formatCOP(result?.netCompanyToReceive)}</b>
            </Typography>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
