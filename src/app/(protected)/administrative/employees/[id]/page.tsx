"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Chip,
  Paper,
  Skeleton,
  useTheme,
  useMediaQuery,
  Button,
  Avatar,
} from "@mui/material";
import {
  ArrowBackRounded as ArrowBackIcon,
  BadgeRounded as BadgeIcon,
  BusinessRounded as BusinessIcon,
  VpnKeyRounded as KeyIcon,
  CalendarMonthRounded as CalendarIcon,
  ArrowForwardIosRounded as ArrowForwardIcon,
  LocationOnRounded as LocationIcon,
  PhoneRounded as PhoneIcon,
  CheckCircleRounded as CheckCircleIcon,
  CancelRounded as CancelIcon,
} from "@mui/icons-material";
import { useEmployeeDetail } from "./EmployeeDetailContext";

export default function EmployeeHubPage() {
  const { employeeId, summary, loading } = useEmployeeDetail();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Desktop: Auto redirect to overview
  useEffect(() => {
    if (!isMobile && employeeId) {
      router.replace(`/administrative/employees/${employeeId}/overview`);
    }
  }, [isMobile, employeeId, router]);

  if (!isMobile) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Redirigiendo a Datos Generales...
        </Typography>
      </Box>
    );
  }

  const employee = summary?.employee;
  const user = summary?.user;
  const activeCount = summary?.activeAssignments?.length || 0;

  const initials = employee?.fullName
    ? employee.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
    : "EM";

  const hubCards = [
    {
      id: "overview",
      title: "Datos Generales",
      description: "Información de identificación, contrato laboral y contacto del recurso.",
      icon: <BadgeIcon sx={{ fontSize: 28, color: "primary.main" }} />,
      badge: employee?.positionName || "Ficha",
      path: `/administrative/employees/${employeeId}/overview`,
      color: theme.palette.primary.main,
    },
    {
      id: "assignments",
      title: "Puestos Asignados",
      description: "Sedes concurrentes e historial cronológico de traslados y relevos.",
      icon: <BusinessIcon sx={{ fontSize: 28, color: "#00b0ff" }} />,
      badge: `${activeCount} ${activeCount === 1 ? "Sede" : "Sedes"}`,
      path: `/administrative/employees/${employeeId}/assignments`,
      color: "#00b0ff",
    },
    {
      id: "account",
      title: "Cuenta Digital",
      description: "Credenciales de acceso, roles RBAC y permisos del software.",
      icon: <KeyIcon sx={{ fontSize: 28, color: "#ab47bc" }} />,
      badge: user?.isActive ? "Cuenta Activa" : "Sin Cuenta",
      path: `/administrative/employees/${employeeId}/account`,
      color: "#ab47bc",
    },
    {
      id: "schedule",
      title: "Programación de Turnos",
      description: "Cuadrantes, programación de turnos y disponibilidad operativa.",
      icon: <CalendarIcon sx={{ fontSize: 28, color: "#2e7d32" }} />,
      badge: "Operaciones",
      path: `/administrative/employees/${employeeId}/schedule`,
      color: "#2e7d32",
    },
  ];

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Top back button */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={() => router.push("/administrative/employees")}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Volver a Personal
        </Button>
      </Box>

      {/* Employee Overview Card */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(22, 27, 34, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)"
              : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
        }}
      >
        {loading && !employee ? (
          <Box>
            <Skeleton width="70%" height={28} sx={{ mb: 1 }} />
            <Skeleton width="40%" height={20} sx={{ mb: 1 }} />
            <Skeleton width="90%" height={16} />
          </Box>
        ) : (
          <>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
              <Avatar
                src={employee?.avatarUrl || undefined}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: "primary.main",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                }}
              >
                {initials}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  {employee?.fullName || "Empleado"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {employee?.documentType || "CC"}: {employee?.document}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mb: 1.5 }}>
              {employee?.positionName && (
                <Chip
                  size="small"
                  label={employee.positionName}
                  variant="outlined"
                  sx={{ fontSize: "0.72rem", fontWeight: 600 }}
                />
              )}
              <Chip
                size="small"
                icon={
                  employee?.isActive ? (
                    <CheckCircleIcon sx={{ fontSize: "14px !important" }} />
                  ) : (
                    <CancelIcon sx={{ fontSize: "14px !important" }} />
                  )
                }
                label={employee?.isRetired ? "Dado de Baja" : employee?.isActive ? "Activo" : "Inactivo"}
                color={employee?.isRetired ? "error" : employee?.isActive ? "success" : "default"}
                sx={{ fontWeight: 600, fontSize: "0.72rem" }}
              />
              <Chip
                size="small"
                icon={<KeyIcon sx={{ fontSize: "14px !important" }} />}
                label={user?.isActive ? "Acceso Digital Activo" : "Sin Acceso Digital"}
                color={user?.isActive ? "primary" : "default"}
                variant={user?.isActive ? "filled" : "outlined"}
                sx={{ fontWeight: 600, fontSize: "0.72rem" }}
              />
              <Chip
                size="small"
                icon={<BusinessIcon sx={{ fontSize: "14px !important" }} />}
                label={`${activeCount} ${activeCount === 1 ? "sede activa" : "sedes activas"}`}
                color={activeCount > 0 ? "info" : "default"}
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: "0.72rem" }}
              />
            </Box>

            {employee?.address && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: "text.secondary" }}>
                <LocationIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" noWrap>
                  {employee.address}
                </Typography>
              </Box>
            )}
            {employee?.phone && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: "text.secondary", mt: 0.5 }}>
                <PhoneIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption">{employee.phone}</Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Hub Spokes Title */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ letterSpacing: "0.02em" }}>
        Módulos y Secciones
      </Typography>

      {/* Hub Spokes Grid */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {hubCards.map((card) => (
          <Card
            key={card.id}
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${theme.palette.divider}`,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: card.color,
                boxShadow: `0 4px 16px ${card.color}22`,
                transform: "translateY(-2px)",
              },
            }}
          >
            <CardActionArea
              onClick={() => router.push(card.path)}
              sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flex: 1, pr: 1 }}>
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.03)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {card.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {card.title}
                    </Typography>
                    {card.badge && (
                      <Chip
                        size="small"
                        label={card.badge}
                        sx={{
                          height: 18,
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          bgcolor: `${card.color}15`,
                          color: card.color,
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }}>
                    {card.description}
                  </Typography>
                </Box>
              </Box>
              <ArrowForwardIcon sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }} />
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
