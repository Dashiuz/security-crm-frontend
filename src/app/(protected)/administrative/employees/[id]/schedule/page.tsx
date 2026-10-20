"use client";

import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Avatar,
  Divider,
  Stack,
  useTheme,
  Button,
} from "@mui/material";
import {
  CalendarMonthRounded as CalendarIcon,
  AccessTimeRounded as TimeIcon,
  FingerprintRounded as BiometricIcon,
  SwapCallsRounded as RelevoIcon,
  ApartmentRounded as ApartmentIcon,
  ShieldRounded as ShieldIcon,
} from "@mui/icons-material";
import { useEmployeeDetail } from "../EmployeeDetailContext";

export default function EmployeeSchedulePage() {
  const { summary } = useEmployeeDetail();
  const theme = useTheme();

  const employee = summary?.employee;
  const activeAssignments = summary?.activeAssignments || [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}>
              <CalendarIcon fontSize="medium" />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Programación Operativa y Cuadrantes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Turnos, relevos y control horario para {employee?.fullName || "este empleado"}
              </Typography>
            </Box>
          </Box>
          <Chip
            label="Módulo en Integración"
            color="primary"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 700, fontSize: "0.75rem" }}
          />
        </Box>
      </Paper>

      {/* Feature Preview Card */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(33, 150, 243, 0.04)"
              : "rgba(25, 118, 210, 0.02)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <ShieldIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>
            Planificador de Guardas y Turnos Rotativos
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 700, mb: 3 }}>
          Este espacio está reservado para la asignación y visualización del calendario mensual de turnos operativos
          (2x2, 4x2, 6x1), registros de asistencia en minuta física, y control biométrico en los puestos de trabajo.
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <TimeIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={700}>
                  Turnos Programados
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Control de jornadas diurnas, nocturnas y días de descanso compensatorio.
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <RelevoIcon color="secondary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={700}>
                  Relevos y Cubrimientos
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Historial de reemplazos en puestos fijos y novedades operacionales del servicio.
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <BiometricIcon color="success" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={700}>
                  Marcación Biométrica
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Sincronización con minuta de guardia y georreferenciación en garita.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Current active posts summary for schedule context */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
          <ApartmentIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>
            Sedes Habilitadas para Programación
          </Typography>
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {activeAssignments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No registra puestos de trabajo activos actualmente. Para habilitar programación, asigna una sede en la pestaña &quot;Puestos Asignados&quot;.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {activeAssignments.map((a, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "action.hover",
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {a.clientName}
                </Typography>
                <Chip size="small" label="Sede Activa" color="success" variant="outlined" sx={{ fontSize: "0.7rem" }} />
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
