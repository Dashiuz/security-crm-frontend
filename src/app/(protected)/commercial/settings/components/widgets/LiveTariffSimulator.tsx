"use client";

import React, { useState, useEffect } from "react";
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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  CalculateOutlined,
  LocalAtmOutlined,
  ArrowForwardOutlined,
  WarningAmberOutlined,
  RestartAltOutlined,
  ScheduleOutlined,
  PaidOutlined,
} from "@mui/icons-material";
import {
  CommercialSector,
  WeaponModality,
  TariffPeriodConfig,
} from "@/lib/api/commercial-settings";
import { useTariffSimulation } from "../../hooks/useTariffSimulation";
import { noxiaPalette, jetBrainsMono } from "@/theme/noxiaTheme";
import RegulatoryExemptionDialog from "./RegulatoryExemptionDialog";

interface LiveTariffSimulatorProps {
  periods?: TariffPeriodConfig[];
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

export default function LiveTariffSimulator({ periods = [], activePeriod }: LiveTariffSimulatorProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(activePeriod?.id || "");

  useEffect(() => {
    if (activePeriod?.id && !selectedPeriodId) {
      setSelectedPeriodId(activePeriod.id);
    }
  }, [activePeriod, selectedPeriodId]);

  const currentPeriod = React.useMemo(() => {
    return (
      periods.find((p) => p.id === selectedPeriodId) ||
      activePeriod ||
      periods[0] ||
      null
    );
  }, [periods, selectedPeriodId, activePeriod]);

  const { params, result, loading, updateParam, setParams } = useTariffSimulation(currentPeriod?.id);

  const handlePeriodChange = (newPeriodId: string) => {
    setSelectedPeriodId(newPeriodId);
    const chosen = periods.find((p) => p.id === newPeriodId);
    let newMultiplier = Number(chosen?.commercialMultiplier) || 8.8;
    if (params.sector === CommercialSector.RESIDENTIAL_STRATA_4_6) {
      newMultiplier = Number(chosen?.strata46Multiplier) || 9.77;
    } else if (params.sector === CommercialSector.RESIDENTIAL_STRATA_1_3) {
      newMultiplier = Number(chosen?.strata13Multiplier) || 7.0;
    }
    setParams((prev) => ({
      ...prev,
      tariffPeriodId: newPeriodId,
      customSectorMultiplier: newMultiplier,
    }));
  };

  // Marco legal de jornada: "modern2026" (13h/11h) vs "traditional" (15h/9h)
  const [legalScheme, setLegalScheme] = useState<"modern2026" | "traditional">("modern2026");

  // Estado para el diálogo de confirmación de excepción regulatoria
  const [exemptionModalOpen, setExemptionModalOpen] = useState(false);
  const [exemptionDetails, setExemptionDetails] = useState({
    title: "",
    description: "",
    currentValue: "",
    legalFloor: "",
  });

  // Multiplicador base según sector seleccionado
  const standardSectorMultiplier = React.useMemo(() => {
    if (params.sector === CommercialSector.RESIDENTIAL_STRATA_4_6) {
      return Number(currentPeriod?.strata46Multiplier) || 9.77;
    }
    if (params.sector === CommercialSector.RESIDENTIAL_STRATA_1_3) {
      return Number(currentPeriod?.strata13Multiplier) || 7.0;
    }
    return Number(currentPeriod?.commercialMultiplier) || 8.8;
  }, [params.sector, currentPeriod]);

  // Sincronizar multiplicador cuando cambia el sector si no ha sido forzado manualmente
  const handleSectorChange = (sector: CommercialSector) => {
    let newMultiplier = 8.8;
    if (sector === CommercialSector.RESIDENTIAL_STRATA_4_6) {
      newMultiplier = Number(currentPeriod?.strata46Multiplier) || 9.77;
    } else if (sector === CommercialSector.RESIDENTIAL_STRATA_1_3) {
      newMultiplier = Number(currentPeriod?.strata13Multiplier) || 7.0;
    } else {
      newMultiplier = Number(currentPeriod?.commercialMultiplier) || 8.8;
    }
    setParams((prev) => ({
      ...prev,
      sector,
      customSectorMultiplier: newMultiplier,
    }));
  };

  // Cambio de esquema de jornada (Moderno 13/11 vs Tradicional 15/9)
  const handleLegalSchemeChange = (_: React.MouseEvent<HTMLElement>, newScheme: "modern2026" | "traditional" | null) => {
    if (!newScheme) return;
    setLegalScheme(newScheme);

    const isFullDay = (params.dayHours + params.nightHours) === 24;

    if (newScheme === "modern2026") {
      setParams((prev) => ({
        ...prev,
        statutoryDayHours: 13,
        statutoryNightHours: 11,
        dayProportionFactor: 0.4759,
        nightProportionFactor: 0.5241,
        ...(isFullDay ? { dayHours: 13, nightHours: 11 } : {}),
      }));
    } else {
      setParams((prev) => ({
        ...prev,
        statutoryDayHours: 15,
        statutoryNightHours: 9,
        dayProportionFactor: 0.5,
        nightProportionFactor: 0.5,
        ...(isFullDay ? { dayHours: 15, nightHours: 9 } : {}),
      }));
    }
  };

  // Verificar si hay desviación regulatoria respecto al piso SVSP
  const currentMultiplier = params.customSectorMultiplier ?? standardSectorMultiplier;
  const isBelowFloor =
    (params.sector === CommercialSector.COMMERCIAL_PUBLIC && currentMultiplier < 8.8) ||
    (params.sector === CommercialSector.RESIDENTIAL_STRATA_4_6 && currentMultiplier < 9.77);

  const handleOpenExemption = () => {
    const required = params.sector === CommercialSector.RESIDENTIAL_STRATA_4_6 ? 9.77 : 8.8;
    setExemptionDetails({
      title: "Multiplicador de Tarifa por debajo del Piso Oficial",
      description: `El multiplicador configurado (${currentMultiplier} SMMLV) es inferior a la exigencia oficial de la Superintendencia de Vigilancia (${required} SMMLV para el sector ${params.sector === CommercialSector.RESIDENTIAL_STRATA_4_6 ? "Residencial Estratos 4, 5 y 6" : "Comercial / Público"}). Facturar por debajo de esta tarifa requiere justificación contractual o régimen de excepción.`,
      currentValue: `${currentMultiplier.toFixed(2)} SMMLV`,
      legalFloor: `${required.toFixed(2)} SMMLV`,
    });
    setExemptionModalOpen(true);
  };

  const handleResetToLegalFloor = () => {
    updateParam("customSectorMultiplier", standardSectorMultiplier);
    setExemptionModalOpen(false);
  };

  const activeSmmlv = Number(currentPeriod?.smmlv) || 1750905;

  return (
    <>
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
            flexWrap: "wrap",
            gap: 1.5,
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
                Multiplicadores dinámicos, días de pronto pago y traza matemática en tiempo real
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: "wrap" }}>
            {periods && periods.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <Select
                  value={currentPeriod?.id || ""}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    bgcolor: "#FFFFFF",
                    height: 32,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  {periods.map((p) => (
                    <MenuItem key={p.id} value={p.id} sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      Vigencia {p.year} {p.isActive ? "(Activa)" : "(Histórica)"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {isBelowFloor && (
              <Chip
                icon={<WarningAmberOutlined sx={{ fontSize: "15px !important" }} />}
                label="Excepción Regulatoria (< Piso SVSP)"
                size="small"
                onClick={handleOpenExemption}
                sx={{
                  bgcolor: `${noxiaPalette.warning.main}18`,
                  color: noxiaPalette.warning.dark,
                  border: `1px solid ${noxiaPalette.warning.main}50`,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              />
            )}
            {loading && <CircularProgress size={18} sx={{ color: noxiaPalette.primary.main }} />}
          </Stack>
        </Box>

        <CardContent sx={{ p: 2.5 }}>
          {/* Fila 1: Parámetros de Selección Sectorial y Multiplicador */}
          <Grid container spacing={2}>
            {/* Sector Económico */}
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="sector-select-label">Sector Económico</InputLabel>
                <Select
                  labelId="sector-select-label"
                  value={params.sector}
                  label="Sector Económico"
                  onChange={(e) => handleSectorChange(e.target.value as CommercialSector)}
                >
                  <MenuItem value={CommercialSector.COMMERCIAL_PUBLIC}>
                    Comercial y Público (8.80 SMMLV)
                  </MenuItem>
                  <MenuItem value={CommercialSector.RESIDENTIAL_STRATA_4_6}>
                    Residencial Estratos 4, 5 y 6 (9.77 SMMLV)
                  </MenuItem>
                  <MenuItem value={CommercialSector.RESIDENTIAL_STRATA_1_3}>
                    Residencial Estratos 1, 2 y 3 (Libre - Ref: 7.00 SMMLV)
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Multiplicador Personalizado */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Multiplicador (SMMLV)"
                placeholder="0"
                value={params.customSectorMultiplier === 0 ? "" : (params.customSectorMultiplier ?? standardSectorMultiplier)}
                onChange={(e) => updateParam("customSectorMultiplier", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                slotProps={{
                  htmlInput: {
                    step: 0.01,
                    min: 1,
                    max: 20,
                    style: { fontFamily: jetBrainsMono.style.fontFamily, fontWeight: 700 },
                  },
                  input: {
                    endAdornment: (
                      <Tooltip title="Restablecer multiplicador oficial del sector">
                        <IconButton
                          size="small"
                          onClick={() => updateParam("customSectorMultiplier", standardSectorMultiplier)}
                          sx={{ p: 0.5 }}
                        >
                          <RestartAltOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ),
                  },
                }}
                helperText={`Oficial: ${standardSectorMultiplier} SMMLV`}
              />
            </Grid>

            {/* Modalidad de Arma */}
            <Grid size={{ xs: 12, sm: 6, md: 5 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="modality-select-label">Modalidad de Arma y Supervisión</InputLabel>
                <Select
                  labelId="modality-select-label"
                  value={params.weaponModality}
                  label="Modalidad de Arma y Supervisión"
                  onChange={(e) => updateParam("weaponModality", e.target.value as WeaponModality)}
                >
                  <MenuItem value={WeaponModality.LETHAL_WEAPON}>Con Arma Letal (A&S 10% de ley)</MenuItem>
                  <MenuItem value={WeaponModality.NO_WEAPON}>Sin Arma (A&S 8% Com / 10% Res)</MenuItem>
                  <MenuItem value={WeaponModality.NON_LETHAL_WEAPON}>Arma No Letal (A&S 10% de ley)</MenuItem>
                  <MenuItem value={WeaponModality.CANINE_SUPPORT}>Medio Canino (A&S 11% de ley)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Fila 2: Franjas Horarias, Días y Pronto Pago */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Horas Día */}
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Horas Día"
                placeholder="0"
                value={params.dayHours === 0 ? "" : (params.dayHours ?? "")}
                onChange={(e) => updateParam("dayHours", e.target.value === "" ? 0 : parseInt(e.target.value))}
                inputProps={{ min: 0, max: 24 }}
                helperText={`Piso: ${params.statutoryDayHours || 13}h`}
              />
            </Grid>

            {/* Horas Noche */}
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Horas Noche"
                placeholder="0"
                value={params.nightHours === 0 ? "" : (params.nightHours ?? "")}
                onChange={(e) => updateParam("nightHours", e.target.value === "" ? 0 : parseInt(e.target.value))}
                inputProps={{ min: 0, max: 24 }}
                helperText={`Piso: ${params.statutoryNightHours || 11}h`}
              />
            </Grid>

            {/* Días Facturables */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="days-select-label">Días Mes</InputLabel>
                <Select
                  labelId="days-select-label"
                  value={params.billableDays}
                  label="Días Mes"
                  onChange={(e) => updateParam("billableDays", Number(e.target.value))}
                >
                  <MenuItem value={30}>30 (Mes Completo)</MenuItem>
                  <MenuItem value={26}>26 (Lun-Sáb con Fest.)</MenuItem>
                  <MenuItem value={24}>24 (Lun-Sáb)</MenuItem>
                  <MenuItem value={22}>22 (Lun-Vie con Fest.)</MenuItem>
                  <MenuItem value={20}>20 (Lun-Vie)</MenuItem>
                  <MenuItem value={10}>10 (Fines y Fest.)</MenuItem>
                  <MenuItem value={8}>8 (Sáb y Dom)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* % Descuento Pronto Pago */}
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="% Dcto. Pronto Pago"
                placeholder="0"
                value={params.discountPct === 0 ? "" : (params.discountPct !== undefined ? Number((params.discountPct * 100).toFixed(2)) : "")}
                onChange={(e) => updateParam("discountPct", e.target.value === "" ? 0 : (parseFloat(e.target.value) || 0) / 100)}
                slotProps={{ htmlInput: { min: 0, max: 20, step: 0.5 } }}
                helperText="Sobre subtotal"
              />
            </Grid>

            {/* Días para Pronto Pago */}
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Días Pronto Pago"
                placeholder="0"
                value={params.promptPaymentDays === 0 ? "" : (params.promptPaymentDays ?? "")}
                onChange={(e) => updateParam("promptPaymentDays", e.target.value === "" ? 0 : parseInt(e.target.value))}
                slotProps={{ htmlInput: { min: 1, max: 60 } }}
                helperText="Días calendario"
              />
            </Grid>

            {/* Toggle Marco Legal */}
            <Grid size={{ xs: 12, md: 2 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Marco de Franjas
                </Typography>
                <ToggleButtonGroup
                  value={legalScheme}
                  exclusive
                  onChange={handleLegalSchemeChange}
                  size="small"
                  fullWidth
                  sx={{ height: 38 }}
                >
                  <ToggleButton value="modern2026" sx={{ fontSize: "0.72rem", fontWeight: 700 }}>
                    2026 (13/11h)
                  </ToggleButton>
                  <ToggleButton value="traditional" sx={{ fontSize: "0.72rem" }}>
                    Trad. (15/9h)
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>
          </Grid>

          {/* RASTRO MATEMÁTICO INTERACTIVO (BREADCRUMB TRACE) */}
          <Box
            sx={{
              mt: 2.5,
              p: 1.8,
              borderRadius: 2.5,
              bgcolor: "rgba(124, 58, 237, 0.04)",
              border: `1px dashed ${noxiaPalette.primary.light}60`,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <PaidOutlined fontSize="small" sx={{ color: noxiaPalette.primary.main }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: noxiaPalette.primary.dark, textTransform: "uppercase" }}>
                Traza Matemática Oficial de Liquidación SVSP
              </Typography>
            </Stack>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1,
                fontSize: "0.78rem",
                fontFamily: jetBrainsMono.style.fontFamily,
              }}
            >
              <Chip
                label={`SMMLV ${formatCOP(activeSmmlv)} × ${currentMultiplier}`}
                size="small"
                variant="outlined"
                sx={{ fontFamily: jetBrainsMono.style.fontFamily, fontWeight: 600 }}
              />
              <ArrowForwardOutlined sx={{ fontSize: 13, color: "text.secondary" }} />

              <Chip
                label={`Base 24h: ${formatCOP(result?.tariffBase24h)}`}
                size="small"
                sx={{ bgcolor: "#FFFFFF", fontFamily: jetBrainsMono.style.fontFamily, fontWeight: 700 }}
              />
              <ArrowForwardOutlined sx={{ fontSize: 13, color: "text.secondary" }} />

              <Chip
                label={`Directo: ${formatCOP(result?.directCost)}`}
                size="small"
                sx={{ bgcolor: "#FFFFFF", fontFamily: jetBrainsMono.style.fontFamily }}
              />
              <ArrowForwardOutlined sx={{ fontSize: 13, color: "text.secondary" }} />

              <Chip
                label={`+ A&S (${((result?.adminSupervisionPct || 0.1) * 100).toFixed(0)}%): ${formatCOP(result?.adminSupervisionValue)}`}
                size="small"
                sx={{ bgcolor: "#FFFFFF", fontFamily: jetBrainsMono.style.fontFamily }}
              />
              <ArrowForwardOutlined sx={{ fontSize: 13, color: "text.secondary" }} />

              <Chip
                label={`Subtotal: ${formatCOP(result?.subtotalBeforeTax)}`}
                size="small"
                color="secondary"
                sx={{ fontFamily: jetBrainsMono.style.fontFamily, fontWeight: 700 }}
              />

              {Boolean(result?.discountValue && result.discountValue > 0) && (
                <>
                  <ArrowForwardOutlined sx={{ fontSize: 13, color: "text.secondary" }} />
                  <Chip
                    label={`Dcto (${((result?.discountPct || 0) * 100).toFixed(1)}%): -${formatCOP(result?.discountValue)}`}
                    size="small"
                    sx={{ bgcolor: `${noxiaPalette.warning.main}20`, color: noxiaPalette.warning.dark, fontFamily: jetBrainsMono.style.fontFamily }}
                  />
                </>
              )}

              <ArrowForwardOutlined sx={{ fontSize: 13, color: "text.secondary" }} />
              <Chip
                label={`AIU (10%): ${formatCOP(result?.aiuBaseValue)}`}
                size="small"
                sx={{ bgcolor: "#FFFFFF", fontFamily: jetBrainsMono.style.fontFamily }}
              />
              <ArrowForwardOutlined sx={{ fontSize: 13, color: "text.secondary" }} />

              <Chip
                label={`IVA 19%: ${formatCOP(result?.ivaValue)}`}
                size="small"
                sx={{ bgcolor: "#FFFFFF", fontFamily: jetBrainsMono.style.fontFamily }}
              />
              <ArrowForwardOutlined sx={{ fontSize: 13, color: "text.secondary" }} />

              <Chip
                label={`Total: ${formatCOP(result?.totalWithTax)}`}
                size="small"
                color="primary"
                sx={{ fontFamily: jetBrainsMono.style.fontFamily, fontWeight: 800 }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* Desglose Financiero */}
          <Box sx={{ bgcolor: "#FFFFFF", borderRadius: 2.5, p: 2, border: "1px solid rgba(0,0,0,0.06)" }}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Tarifa Base 24h ({currentMultiplier} SMMLV)
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: jetBrainsMono.style.fontFamily }}>
                  {formatCOP(result?.tariffBase24h)}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Costo Directo ({params.dayHours}h D / {params.nightHours}h N)
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
                p: 2,
                borderRadius: 2,
                bgcolor: `${noxiaPalette.primary.main}10`,
                border: `1px solid ${noxiaPalette.primary.main}30`,
                flexWrap: "wrap",
                gap: 1.5,
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

              <Stack direction="row" spacing={1} alignItems="center">
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
                <Chip
                  icon={<ScheduleOutlined sx={{ fontSize: "16px !important" }} />}
                  label={`Pronto Pago: ${params.promptPaymentDays ?? 10} días (${((params.discountPct || 0) * 100).toFixed(1)}%)`}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: "#FFFFFF",
                    border: `1px solid ${noxiaPalette.primary.light}40`,
                    fontFamily: jetBrainsMono.style.fontFamily,
                  }}
                />
              </Stack>
            </Box>

            {/* Resumen Tributario y Retenciones */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1.5 }} justifyContent="space-between">
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

      {/* Modal de Excepción Regulatoria */}
      <RegulatoryExemptionDialog
        open={exemptionModalOpen}
        onClose={() => setExemptionModalOpen(false)}
        onConfirmExemption={() => setExemptionModalOpen(false)}
        onResetToLegalFloor={handleResetToLegalFloor}
        deviationTitle={exemptionDetails.title}
        deviationDescription={exemptionDetails.description}
        currentValueLabel={exemptionDetails.currentValue}
        legalFloorLabel={exemptionDetails.legalFloor}
      />
    </>
  );
}
