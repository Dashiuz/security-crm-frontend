"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Tooltip,
  Avatar,
  TextField,
  Drawer,
  Alert,
  Autocomplete,
  CircularProgress,
  useTheme,
  Skeleton,
  Stack,
  InputAdornment,
} from "@mui/material";
import {
  SupervisorAccountRounded as SupervisorAccountIcon,
  AddRounded as AddIcon,
  DeleteOutlineRounded as DeleteIcon,
  SearchRounded as SearchIcon,
  PersonOutlineRounded as PersonIcon,
  SecurityRounded as SecurityIcon,
  PhoneRounded as PhoneIcon,
  EmailRounded as EmailIcon,
  RefreshRounded as RefreshIcon,
  CloseRounded as CloseIcon,
  VpnKeyRounded as VpnKeyIcon,
  LockOutlineRounded as LockIcon,
  BadgeRounded as BadgeIcon,
} from "@mui/icons-material";
import { useClientDetail } from "../ClientContext";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";

export enum DigitalAccountStatus {
  ACTIVE = "ACTIVE",
  DISABLED = "DISABLED",
  NO_ACCOUNT = "NO_ACCOUNT",
}

interface ClientUserAccessItem {
  id: string;
  userId: string | null;
  clientId: string;
  roleName: string | null;
  isActive: boolean;
  hasDigitalAccess?: boolean;
  digitalAccountStatus?: DigitalAccountStatus;
  createdAt: string;
  employeeId?: string | null;
  user: {
    id: string | null;
    fullName: string;
    document: string;
    email: string | null;
    phone: string | null;
    roles?: Array<{
      role: {
        id: string;
        name: string;
      };
    }>;
  };
}

interface UserOption {
  id: string;
  fullName: string;
  document: string;
  email?: string | null;
  position?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  roles?: Array<{ role: { name: string } }>;
}

export default function ClientUsersPage() {
  const router = useRouter();
  const { clientId, client, permissions } = useClientDetail();
  const { showSuccess, showError } = useNotification();
  const theme = useTheme();

  const [team, setTeam] = useState<ClientUserAccessItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Drawer states: Assign User
  const [assignDrawerOpen, setAssignDrawerOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [assigning, setAssigning] = useState<boolean>(false);

  // User search options for autocomplete
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  // Unassign confirmation dialog
  const [userToUnassign, setUserToUnassign] = useState<ClientUserAccessItem | null>(null);
  const [unassigning, setUnassigning] = useState<boolean>(false);

  const fetchTeam = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await HttpClient.get<any>(
        `/client/${clientId}/users`,
      );
      const teamList = Array.isArray(res) ? res : (res?.data || []);
      setTeam(teamList);
    } catch (err: any) {
      showError(err.message || "Error al cargar el equipo asignado al cliente");
    } finally {
      setLoading(false);
    }
  }, [clientId, showError]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Load all system users when drawer opens
  const handleOpenAssignDrawer = async () => {
    setAssignDrawerOpen(true);
    setSelectedUser(null);
    setLoadingUsers(true);
    try {
      const users = await HttpClient.get<any>("/user?userType=EMPLOYEE");
      const userList = Array.isArray(users) ? users : (users?.data || []);
      setAllUsers(userList.filter((u: any) => u.userType !== "RESIDENCE_MANAGER" && u.isActive));
    } catch (err: any) {
      showError(err.message || "Error al cargar la lista de usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAssignUser = async () => {
    if (!selectedUser || !clientId) return;
    setAssigning(true);
    try {
      await HttpClient.post(`/client/${clientId}/users`, {
        userId: selectedUser.id,
      });
      showSuccess(`Usuario ${selectedUser.fullName} vinculado con éxito`);
      setAssignDrawerOpen(false);
      fetchTeam();
    } catch (err: any) {
      showError(err.message || "Error al vincular el usuario al cliente");
    } finally {
      setAssigning(false);
    }
  };

  const handleConfirmUnassign = async () => {
    if (!userToUnassign || !clientId) return;
    setUnassigning(true);
    try {
      await HttpClient.delete(`/client/${clientId}/users/${userToUnassign.id}`);
      showSuccess(`Personal ${userToUnassign.user.fullName} desvinculado con éxito`);
      setUserToUnassign(null);
      fetchTeam();
    } catch (err: any) {
      showError(err.message || "Error al desvincular el personal");
    } finally {
      setUnassigning(false);
    }
  };

  // Filter team by search term
  const filteredTeam = useMemo(() => {
    if (!searchTerm.trim()) return team;
    const term = searchTerm.toLowerCase();
    return team.filter((item) => {
      const name = item.user?.fullName?.toLowerCase() || "";
      const doc = item.user?.document?.toLowerCase() || "";
      const role = item.roleName?.toLowerCase() || "";
      return name.includes(term) || doc.includes(term) || role.includes(term);
    });
  }, [team, searchTerm]);

  // Dynamic cargo grouping & counters
  const metrics = useMemo(() => {
    const total = team.length;
    const roleCounts: Record<string, number> = {};

    team.forEach((t) => {
      const role = (t.roleName || "Sin Cargo").trim();
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    return { total, roleCounts };
  }, [team]);

  const getRoleBadgeColor = (roleName: string | null) => {
    const r = (roleName || "").toUpperCase();
    if (r.includes("DIRECT") || r.includes("GEREN")) {
      return { bg: "rgba(239, 83, 80, 0.12)", color: "#c62828", border: "#ef9a9a" };
    }
    if (r.includes("COORD")) {
      return { bg: "rgba(33, 150, 243, 0.12)", color: "#1976d2", border: "#90caf9" };
    }
    if (r.includes("SUPER")) {
      return { bg: "rgba(156, 39, 176, 0.12)", color: "#7b1fa2", border: "#ce93d8" };
    }
    if (r.includes("VIGIL") || r.includes("GUARD") || r.includes("ROND")) {
      return { bg: "rgba(0, 150, 136, 0.12)", color: "#00796b", border: "#80cbc4" };
    }
    if (r.includes("OPERAD") || r.includes("CCTV") || r.includes("CONSOLA")) {
      return { bg: "rgba(255, 152, 0, 0.12)", color: "#e65100", border: "#ffb74d" };
    }
    if (r.includes("ADMIN") || r.includes("RRHH")) {
      return { bg: "rgba(76, 175, 80, 0.12)", color: "#2e7d32", border: "#a5d6a7" };
    }
    return { bg: "rgba(117, 117, 117, 0.1)", color: "text.primary", border: "divider" };
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Top Header Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(22, 27, 34, 0.7)"
              : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 44,
                height: 44,
              }}
            >
              <SupervisorAccountIcon fontSize="medium" />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Equipo Asignado y Accesos Operativos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Personal, supervisores y coordinadores vinculados a {client?.name || "esta sede"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", sm: "auto" } }}>
            <Tooltip title="Recargar lista">
              <IconButton onClick={fetchTeam} disabled={loading} size="small" sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {permissions.canManage && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAssignDrawer}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2,
                  flex: { xs: 1, sm: "none" },
                }}
              >
                Vincular Usuario
              </Button>
            )}
          </Box>
        </Box>

        {/* Quick Dynamic Metric Chips */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Chip
            label={`Total: ${metrics.total}`}
            size="small"
            sx={{ fontWeight: 700, bgcolor: "action.selected" }}
          />
          {Object.entries(metrics.roleCounts).map(([role, count]) => {
            const style = getRoleBadgeColor(role);
            return (
              <Chip
                key={role}
                label={`${role}: ${count}`}
                size="small"
                sx={{
                  fontWeight: 600,
                  bgcolor: style.bg,
                  color: style.color,
                  border: `1px solid ${style.border}`,
                }}
              />
            );
          })}
        </Stack>
      </Paper>

      {/* Main DataTable Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
        }}
      >
        {/* Search bar */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: "background.paper" }}>
          <TextField
            size="small"
            placeholder="Buscar por nombre, documento o función..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 400, width: "100%" }}
          />
        </Box>

        {/* Table Content */}
        {loading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton height={40} sx={{ mb: 1 }} />
            <Skeleton height={40} sx={{ mb: 1 }} />
            <Skeleton height={40} />
          </Box>
        ) : filteredTeam.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <SupervisorAccountIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
            <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
              {searchTerm ? "No se encontraron usuarios que coincidan con la búsqueda." : "No hay personal asignado a este cliente actualmente."}
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              Haz clic en &quot;Vincular Usuario&quot; para asignar coordinadores, supervisores o guardas a esta copropiedad.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="medium">
              <TableHead sx={{ bgcolor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>Personal / Empleado</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>Rol en esta Sede</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>Acceso Digital</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>Perfil de Sistema</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>Contacto</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>Fecha Asignación</TableCell>
                  {permissions.canManage && (
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>Acciones</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTeam.map((item) => {
                  const roleStyle = getRoleBadgeColor(item.roleName);
                  const systemRole = item.user?.roles?.[0]?.role?.name || "Sin Rol";
                  const initials = item.user?.fullName
                    ? item.user.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                    : "US";

                  return (
                    <TableRow
                      key={item.id}
                      hover
                      onClick={() => {
                        if (item.employeeId) {
                          router.push(`/administrative/employees/${item.employeeId}/overview`);
                        }
                      }}
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        cursor: item.employeeId ? "pointer" : "default",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {/* User identity */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              bgcolor: "primary.main",
                              fontSize: "0.85rem",
                              fontWeight: 700,
                            }}
                          >
                            {initials}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                              {item.user?.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                              Doc: {item.user?.document || "N/A"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Contextual role in this client */}
                      <TableCell>
                        <Chip
                          label={item.roleName || "ASIGNADO"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            letterSpacing: "0.03em",
                            bgcolor: roleStyle.bg,
                            color: roleStyle.color,
                            border: `1px solid ${roleStyle.border}`,
                          }}
                        />
                      </TableCell>

                      {/* Digital Access Status (SPEC-ADM-017) */}
                      <TableCell>
                        {item.digitalAccountStatus === DigitalAccountStatus.ACTIVE ||
                        (!item.digitalAccountStatus && item.hasDigitalAccess) ? (
                          <Chip
                            icon={<VpnKeyIcon sx={{ fontSize: "14px !important" }} />}
                            label="Acceso Activo"
                            color="success"
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: "0.72rem" }}
                          />
                        ) : item.digitalAccountStatus === DigitalAccountStatus.DISABLED ? (
                          <Chip
                            icon={<LockIcon sx={{ fontSize: "14px !important" }} />}
                            label="Suspendido"
                            color="warning"
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: "0.72rem" }}
                          />
                        ) : (
                          <Tooltip title="Personal asignado físicamente a la sede sin credenciales digitales de inicio de sesión. Haz clic para ver su expediente laboral.">
                            <Chip
                              icon={<BadgeIcon sx={{ fontSize: "14px !important" }} />}
                              label="Sin Cuenta Digital"
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.72rem",
                                bgcolor:
                                  theme.palette.mode === "dark"
                                    ? "rgba(255, 255, 255, 0.05)"
                                    : "rgba(0, 0, 0, 0.04)",
                                color: "text.secondary",
                                border: "1px dashed",
                                borderColor: "divider",
                              }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* System RBAC Role */}
                      <TableCell>
                        {item.hasDigitalAccess || item.digitalAccountStatus === DigitalAccountStatus.ACTIVE ? (
                          <Chip
                            icon={<SecurityIcon sx={{ fontSize: "14px !important" }} />}
                            label={systemRole}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.72rem", fontWeight: 600 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
                            No aplica
                          </Typography>
                        )}
                      </TableCell>

                      {/* Contact Info */}
                      <TableCell>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
                          {item.user?.email && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <EmailIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                              <Typography variant="caption" color="text.secondary">
                                {item.user.email}
                              </Typography>
                            </Box>
                          )}
                          {item.user?.phone && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <PhoneIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                              <Typography variant="caption" color="text.secondary">
                                {item.user.phone}
                              </Typography>
                            </Box>
                          )}
                          {!item.user?.email && !item.user?.phone && (
                            <Typography variant="caption" color="text.disabled">
                              Sin datos de contacto
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* Created At */}
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString("es-CO", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "N/A"}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      {permissions.canManage && (
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Desvincular de esta sede">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserToUnassign(item);
                              }}
                              sx={{
                                border: `1px solid ${theme.palette.error.light}`,
                                "&:hover": { bgcolor: "error.light", color: "#fff" },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Side Drawer: Vincular Personal */}
      <Drawer
        anchor="right"
        open={assignDrawerOpen}
        onClose={() => !assigning && setAssignDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 460 },
            p: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pb: 1.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Vincular Personal a la Sede
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {client?.name || "Copropiedad"}
              </Typography>
            </Box>
            <IconButton onClick={() => setAssignDrawerOpen(false)} disabled={assigning} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Alert severity="info" sx={{ fontSize: "0.85rem" }}>
            Selecciona el colaborador a vincular. Su rol operativo se heredará de forma automática de su cargo oficial en la organización.
          </Alert>

          {/* Standardized Autocomplete */}
          <Autocomplete<UserOption>
            options={allUsers}
            loading={loadingUsers}
            getOptionLabel={(option) => `${option.fullName} (Doc: ${option.document})`}
            value={selectedUser}
            onChange={(_, val) => setSelectedUser(val)}
            isOptionEqualToValue={(option, val) => option.id === val.id}
            noOptionsText={loadingUsers ? "Cargando usuarios..." : "No se encontraron colaboradores"}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Colaborador / Empleado"
                placeholder="Buscar por nombre o cédula..."
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingUsers ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props as any;
              const initials = option.fullName
                ? option.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                : "US";
              const positionStyle = getRoleBadgeColor(option.position || null);

              return (
                <Box
                  component="li"
                  key={key || option.id}
                  {...otherProps}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 1.25,
                    px: 1.5,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: "primary.main",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {initials}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {option.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        C.C. {option.document} {option.department ? `• ${option.department}` : ""}
                      </Typography>
                    </Box>
                  </Box>
                  {option.position && (
                    <Chip
                      label={option.position}
                      size="small"
                      sx={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        bgcolor: positionStyle.bg,
                        color: positionStyle.color,
                        border: `1px solid ${positionStyle.border}`,
                      }}
                    />
                  )}
                </Box>
              );
            }}
          />

          {/* Read-only preview card with inherited official cargo */}
          {selectedUser && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(0, 0, 0, 0.02)",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                Ficha de Asignación Operativa
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "primary.main",
                    fontWeight: 700,
                  }}
                >
                  {selectedUser.fullName
                    ? selectedUser.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                    : "US"}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={700}>
                    {selectedUser.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Documento: {selectedUser.document}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ pt: 1, borderTop: `1px dashed ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  Cargo Oficial Heredado:
                </Typography>
                <Chip
                  label={selectedUser.position || "OPERATIVO"}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: getRoleBadgeColor(selectedUser.position || null).bg,
                    color: getRoleBadgeColor(selectedUser.position || null).color,
                    border: `1px solid ${getRoleBadgeColor(selectedUser.position || null).border}`,
                  }}
                />
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", mt: 0.5 }}>
                * Este cargo se utilizará automáticamente para el despacho de alertas de seguridad y la minuta operativa en esta sede.
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Footer actions */}
        <Box sx={{ display: "flex", gap: 1.5, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button
            variant="outlined"
            onClick={() => setAssignDrawerOpen(false)}
            disabled={assigning}
            fullWidth
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignUser}
            disabled={!selectedUser || assigning}
            fullWidth
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            {assigning ? <CircularProgress size={20} color="inherit" /> : "Vincular a la Sede"}
          </Button>
        </Box>
      </Drawer>

      {/* Confirmation Drawer: Desvincular */}
      <PromptConfirmDialog
        open={Boolean(userToUnassign)}
        onClose={() => !unassigning && setUserToUnassign(null)}
        onConfirm={handleConfirmUnassign}
        title="Confirmar Desvinculación de Funcionario"
        description={`¿Está seguro de que desea retirar la asignación operativa de ${userToUnassign?.user.fullName} en esta sede? Para confirmar, ingrese su número de documento:`}
        expectedValue={userToUnassign?.user.document || userToUnassign?.user.fullName || ""}
        inputLabel="Documento del Funcionario"
        confirmButtonText="Confirmar Desvinculación"
        confirmColor="error"
      />
    </Box>
  );
}
