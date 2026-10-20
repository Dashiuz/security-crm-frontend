"use client";

import React from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import {
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider,
  Skeleton,
  useTheme,
  useMediaQuery,
  Button,
  Avatar,
  Stack,
} from "@mui/material";
import {
  ArrowBackRounded as ArrowBackIcon,
  BadgeRounded as BadgeIcon,
  BusinessRounded as BusinessIcon,
  VpnKeyRounded as KeyIcon,
  CalendarMonthRounded as CalendarIcon,
  PersonRounded as PersonIcon,
  CheckCircleRounded as CheckCircleIcon,
  CancelRounded as CancelIcon,
} from "@mui/icons-material";
import {
  EmployeeDetailProvider,
  useEmployeeDetail,
} from "./EmployeeDetailContext";
import EmployeeAvatarUploader from "./EmployeeAvatarUploader";

interface NavItem {
  id: string;
  label: string;
  pathSuffix: string;
  icon: React.ReactElement;
  description: string;
}

function EmployeeLayoutContent({ children }: { children: React.ReactNode }) {
  const { employeeId, summary, loading, reloadSummary } = useEmployeeDetail();
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const navItems: NavItem[] = [
    {
      id: "overview",
      label: "Datos Generales",
      pathSuffix: "overview",
      icon: <BadgeIcon fontSize="small" />,
      description: "Datos personales, laborales y contacto",
    },
    {
      id: "assignments",
      label: "Puestos Asignados",
      pathSuffix: "assignments",
      icon: <BusinessIcon fontSize="small" />,
      description: "Sedes concurrentes e historial de traslados",
    },
    {
      id: "account",
      label: "Cuenta Digital",
      pathSuffix: "account",
      icon: <KeyIcon fontSize="small" />,
      description: "Credenciales de acceso y roles RBAC",
    },
    {
      id: "schedule",
      label: "Programación de Turnos",
      pathSuffix: "schedule",
      icon: <CalendarIcon fontSize="small" />,
      description: "Cuadrantes y turnos operativos",
    },
  ];

  const getIsActive = (pathSuffix: string) => {
    return pathname.endsWith(`/${pathSuffix}`);
  };

  const isRootLanding =
    pathname === `/administrative/employees/${employeeId}` ||
    pathname === `/administrative/employees/${employeeId}/`;

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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: "calc(100vh - 120px)",
        width: "100%",
        bgcolor: "background.default",
        gap: isMobile ? 2 : 3,
        pt: 1,
      }}
    >
      {/* Desktop Left Sidenav */}
      {!isMobile && (
        <Paper
          elevation={0}
          sx={{
            width: 280,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(22, 27, 34, 0.7)"
                : "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(12px)",
            p: 2,
            position: "sticky",
            top: 80,
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
          }}
        >
          {/* Back button */}
          <Box sx={{ mb: 2 }}>
            <Button
              size="small"
              startIcon={<ArrowBackIcon fontSize="small" />}
              onClick={() => router.push("/administrative/employees")}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "text.secondary",
                px: 1,
                py: 0.5,
                borderRadius: 2,
                "&:hover": {
                  color: "primary.main",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              Volver a Personal
            </Button>
          </Box>

          {/* Employee Header Profile: GitHub-style Avatar at top, grey card underneath */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 2,
              width: "100%",
            }}
          >
            {/* 1. Large Circular Avatar at top with live camera & file upload actions */}
            <Box sx={{ mb: 1.8, mt: 0.5 }}>
              <EmployeeAvatarUploader
                employeeId={employeeId}
                fullName={employee?.fullName}
                avatarUrl={employee?.avatarUrl}
                initials={initials}
                size={144}
                mediaAttachments={employee?.mediaAttachments}
                onPhotoUpdated={reloadSummary}
              />
            </Box>

            {/* 2. Grey Card with the rest of the employee data */}
            <Box
              sx={{
                width: "100%",
                p: 2,
                borderRadius: 2.5,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.04)"
                    : "rgba(0, 0, 0, 0.025)",
                border: `1px solid ${theme.palette.divider}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {loading && !employee ? (
                <Box sx={{ width: "100%" }}>
                  <Skeleton width="80%" height={24} sx={{ mx: "auto", mb: 0.5 }} />
                  <Skeleton width="50%" height={16} sx={{ mx: "auto", mb: 1 }} />
                  <Skeleton width="90%" height={20} sx={{ mx: "auto" }} />
                </Box>
              ) : (
                <>
                  {/* Employee Name: NEVER truncated, wraps cleanly on desktop */}
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    title={employee?.fullName}
                    sx={{
                      fontSize: "0.95rem",
                      lineHeight: 1.3,
                      wordBreak: "break-word",
                      mb: 0.4,
                    }}
                  >
                    {employee?.fullName || "Empleado"}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1.2 }}
                  >
                    {employee?.documentType || "CC"}: {employee?.document}
                  </Typography>

                  <Stack spacing={0.8} sx={{ width: "100%", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, flexWrap: "wrap" }}>
                      <Chip
                        size="small"
                        label={employee?.positionName || "Sin Cargo"}
                        variant="outlined"
                        sx={{ fontSize: "0.7rem", height: 20 }}
                      />
                      <Chip
                        size="small"
                        label={employee?.isRetired ? "Retirado" : employee?.isActive ? "Activo" : "Inactivo"}
                        color={employee?.isRetired ? "error" : employee?.isActive ? "success" : "default"}
                        sx={{ fontSize: "0.7rem", height: 20, fontWeight: 600 }}
                      />
                    </Box>

                    {/* Acceso digital badge */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                      <Chip
                        size="small"
                        icon={user ? <CheckCircleIcon sx={{ fontSize: "13px !important" }} /> : <CancelIcon sx={{ fontSize: "13px !important" }} />}
                        label={
                          user
                            ? `Digital: ${
                                typeof user.roles?.[0] === "string"
                                  ? user.roles[0]
                                  : (user.roles?.[0] as any)?.role?.name || (user.roles?.[0] as any)?.name || "Activo"
                              }`
                            : "Sin Acceso Digital"
                        }
                        color={user ? "primary" : "default"}
                        variant={user ? "filled" : "outlined"}
                        sx={{ fontSize: "0.68rem", height: 20, fontWeight: 600 }}
                      />
                    </Box>

                    {/* Active sites count */}
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
                      {activeCount === 0
                        ? "Sin sedes asignadas"
                        : activeCount === 1
                        ? "1 sede activa"
                        : `${activeCount} sedes concurrentes`}
                    </Typography>
                  </Stack>
                </>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          {/* Sidenav Items */}
          <Typography
            variant="caption"
            sx={{
              px: 1,
              pb: 1,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "text.secondary",
              fontSize: "0.68rem",
            }}
          >
            Secciones del Recurso
          </Typography>

          <List sx={{ p: 0, display: "flex", flexDirection: "column", gap: 0.8 }}>
            {navItems.map((item) => {
              const active = getIsActive(item.pathSuffix);
              return (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    onClick={() =>
                      router.push(
                        `/administrative/employees/${employeeId}/${item.pathSuffix}`,
                      )
                    }
                    sx={{
                      borderRadius: 2,
                      py: 1.1,
                      px: 1.5,
                      bgcolor: active
                        ? theme.palette.mode === "dark"
                          ? "rgba(33, 150, 243, 0.15)"
                          : "rgba(25, 118, 210, 0.08)"
                        : "transparent",
                      color: active ? "primary.main" : "text.primary",
                      borderLeft: active
                        ? `3px solid ${theme.palette.primary.main}`
                        : "3px solid transparent",
                      transition: "all 0.18s ease-in-out",
                      "&:hover": {
                        bgcolor: active
                          ? theme.palette.mode === "dark"
                            ? "rgba(33, 150, 243, 0.22)"
                            : "rgba(25, 118, 210, 0.12)"
                          : theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.03)",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 32,
                        color: active ? "primary.main" : "text.secondary",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: "0.85rem",
                        fontWeight: active ? 700 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}

      {/* Main Spoke Area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Mobile Sub-route Top Header (Only shown when not on Hub Landing) */}
        {isMobile && !isRootLanding && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "background.paper",
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button
              size="small"
              startIcon={<ArrowBackIcon fontSize="small" />}
              onClick={() => router.push(`/administrative/employees/${employeeId}`)}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Menú del Empleado
            </Button>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ flex: 1, color: "text.secondary" }}
            >
              {employee?.fullName || "Ficha del Empleado"}
            </Typography>
          </Box>
        )}

        {children}
      </Box>
    </Box>
  );
}

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const employeeId = params?.id as string;

  return (
    <EmployeeDetailProvider employeeId={employeeId}>
      <EmployeeLayoutContent>{children}</EmployeeLayoutContent>
    </EmployeeDetailProvider>
  );
}
