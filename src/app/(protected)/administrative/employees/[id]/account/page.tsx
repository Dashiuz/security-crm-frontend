"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Avatar,
  Divider,
  Stack,
  Skeleton,
  Drawer,
  TextField,
  CircularProgress,
  Autocomplete,
  InputAdornment,
  IconButton,
  useTheme,
  Alert,
} from "@mui/material";
import {
  VpnKeyRounded as KeyIcon,
  SecurityRounded as SecurityIcon,
  LockResetRounded as ResetIcon,
  CheckCircleRounded as CheckCircleIcon,
  CancelRounded as CancelIcon,
  Visibility,
  VisibilityOff,
  BusinessRounded as BusinessIcon,
  PersonAddRounded as PersonAddIcon,
  AdminPanelSettingsRounded as AdminIcon,
  ShieldRounded as ShieldIcon,
  BlockRounded as BlockIcon,
  EditRounded as EditIcon,
  WarningAmberRounded as WarningAmberIcon,
  CloseRounded as CloseIcon,
} from "@mui/icons-material";
import { useEmployeeDetail } from "../EmployeeDetailContext";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";

interface RoleOption {
  id: string;
  name: string;
}

export default function EmployeeAccountPage() {
  const router = useRouter();
  const { employeeId, summary, loading, reloadSummary } = useEmployeeDetail();
  const { showSuccess, showError } = useNotification();
  const theme = useTheme();

  const user = summary?.user;
  const employee = summary?.employee;

  // Drawer: Enable User Account
  const [enableDrawerOpen, setEnableDrawerOpen] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Drawer: Edit Roles
  const [editRolesDrawerOpen, setEditRolesDrawerOpen] = useState(false);
  const [selectedEditRoleIds, setSelectedEditRoleIds] = useState<string[]>([]);
  const [submittingRoles, setSubmittingRoles] = useState(false);

  // Status toggle
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [disableReason, setDisableReason] = useState("");
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Load available roles when needed
  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const data = await HttpClient.get<any>("/role");
      const list: RoleOption[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setRoles(list.map((r: any) => ({ id: r.id, name: r.name })));
    } catch (err) {
      console.error("Error loading roles:", err);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleOpenEnableDrawer = () => {
    setEnableDrawerOpen(true);
    setPassword("");
    setSelectedRoleIds([]); // Keep empty so user explicitly chooses
    if (roles.length === 0) {
      fetchRoles();
    }
  };

  const handleEnableUser = async () => {
    if (!employeeId) return;
    setSubmitting(true);
    try {
      const defaultPassword = `${employee?.document || "Noxia"}#2026`;
      await HttpClient.post(`/employee/${employeeId}/enable-user`, {
        password: password.trim() || defaultPassword,
        roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : undefined,
      });
      showSuccess("Cuenta digital creada exitosamente. Accesos sincronizados.");
      setEnableDrawerOpen(false);
      await reloadSummary();
    } catch (err: any) {
      showError(err.message || "Error al crear cuenta digital para el empleado");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditRolesDrawer = () => {
    if (roles.length === 0) {
      fetchRoles();
    }
    const currentRoles = (user?.roles || []) as any[];
    const ids = currentRoles
      .map((r) => {
        if (typeof r === "string") {
          return roles.find((opt) => opt.name.toUpperCase() === r.toUpperCase())?.id;
        }
        return r.roleId || r.role?.id || r.id;
      })
      .filter(Boolean) as string[];
    setSelectedEditRoleIds(ids);
    setEditRolesDrawerOpen(true);
  };

  const handleSaveRoles = async () => {
    if (!user?.id) return;
    setSubmittingRoles(true);
    try {
      await HttpClient.patch(`/users/${user.id}/roles`, {
        roleIds: selectedEditRoleIds,
      });
      showSuccess("Roles digitales actualizados exitosamente.");
      setEditRolesDrawerOpen(false);
      await reloadSummary();
    } catch (err: any) {
      showError(err.message || "Error al actualizar los roles del usuario.");
    } finally {
      setSubmittingRoles(false);
    }
  };

  const handleToggleStatus = async (newStatus: boolean) => {
    if (!user?.id) return;
    setSubmittingStatus(true);
    try {
      await HttpClient.patch(`/user/${user.id}/status`, {
        isActive: newStatus,
      });
      showSuccess(
        newStatus
          ? "Cuenta digital habilitada exitosamente."
          : "Cuenta digital deshabilitada. Sesiones cerradas."
      );
      setConfirmDisableOpen(false);
      await reloadSummary();
    } catch (err: any) {
      showError(err.message || "Error al modificar el estado del usuario.");
    } finally {
      setSubmittingStatus(false);
    }
  };

  if (loading && !summary) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton height={150} sx={{ mb: 2 }} />
        <Skeleton height={200} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Top Status Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: user ? "primary.main" : "text.disabled",
                width: 44,
                height: 44,
              }}
            >
              <KeyIcon fontSize="medium" />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Identidad Digital y Cuenta de Usuario
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user
                  ? "Este recurso tiene credenciales de inicio de sesión habilitadas en la plataforma."
                  : "Este empleado no tiene cuenta digital activa para acceder al software."}
              </Typography>
            </Box>
          </Box>

          {!user && (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenEnableDrawer}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 2.2,
                whiteSpace: "nowrap",
              }}
            >
              Habilitar Cuenta Digital
            </Button>
          )}
        </Box>
      </Paper>

      {!user ? (
        /* Empty state: No user account */
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: `1px dashed ${theme.palette.divider}`,
            textAlign: "center",
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.02)"
                : "rgba(0, 0, 0, 0.01)",
          }}
        >
          <ShieldIcon sx={{ fontSize: 54, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} color="text.primary">
            Sin Acceso Digital Registrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: "auto", mt: 1, mb: 3 }}>
            Al habilitar una cuenta para {employee?.fullName}, se vincularán sus credenciales con el número de documento{" "}
            <strong>{employee?.document}</strong> y sus puestos vigentes se sincronizarán automáticamente.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<PersonAddIcon />}
            onClick={handleOpenEnableDrawer}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, px: 3 }}
          >
            Habilitar Cuenta Digital Ahora
          </Button>
        </Paper>
      ) : (
        /* User account active details */
        <Grid container spacing={3}>
          {/* Card 1: User Account Details */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                height: "100%",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
                <AdminIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={700}>
                  Datos de Acceso Digital
                </Typography>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                    Usuario / Documento de Acceso
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25 }}>
                    {user.document}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                    Nombre Registrado en Cuenta
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25 }}>
                    {user.fullName}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                    Estado del Usuario
                  </Typography>
                  <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                    <Chip
                      size="small"
                      icon={user.isActive ? <CheckCircleIcon sx={{ fontSize: "14px !important" }} /> : <CancelIcon sx={{ fontSize: "14px !important" }} />}
                      label={user.isActive ? "Usuario Activo" : "Usuario Desactivado"}
                      color={user.isActive ? "success" : "default"}
                      sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                    />

                    {user.isActive ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<BlockIcon fontSize="small" />}
                        onClick={() => setConfirmDisableOpen(true)}
                        disabled={submittingStatus}
                        sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                      >
                        Deshabilitar Cuenta
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon fontSize="small" />}
                        onClick={() => handleToggleStatus(true)}
                        disabled={submittingStatus}
                        sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                      >
                        Habilitar Cuenta
                      </Button>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase" }}>
                    Primer Inicio de Sesión
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {user.isFirstLogin ? "Pendiente (Debe cambiar contraseña al ingresar)" : "Completado"}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Card 2: RBAC Roles */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                height: "100%",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <SecurityIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Perfiles y Roles
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon fontSize="small" />}
                  onClick={handleOpenEditRolesDrawer}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                >
                  Modificar Roles
                </Button>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Roles del sistema asociados a este usuario para control de permisos y módulos:
              </Typography>

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((r: any, i: number) => {
                    const roleName =
                      typeof r === "string"
                        ? r
                        : r?.role?.name || r?.name || "Rol";
                    return (
                      <Chip
                        key={r?.id || r?.role?.id || i}
                        icon={<SecurityIcon sx={{ fontSize: "14px !important" }} />}
                        label={roleName}
                        color="primary"
                        variant="filled"
                        sx={{ fontWeight: 700, fontSize: "0.78rem" }}
                      />
                    );
                  })
                ) : (
                  <Chip label="Sin Roles Asignados" variant="outlined" />
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Card 3: Sincronización de Sedes en UserClientAccess */}
          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
                <BusinessIcon color="primary" />
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Sedes con Acceso Digital Sincronizado
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Clientes donde este usuario cuenta con permisos operativos en tiempo real.
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              {(!user.clientAccesses || user.clientAccesses.length === 0) ? (
                <Box sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
                  <Typography variant="body2">
                    No registra sedes activas en el módulo de accesos digitales.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {user.clientAccesses.map((access, i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={access.clientId || i}>
                      <Paper
                        variant="outlined"
                        onClick={() => access.clientId && router.push(`/administrative/clients/${access.clientId}/overview`)}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          cursor: access.clientId ? "pointer" : "default",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            bgcolor: "action.hover",
                            transform: "translateY(-2px)",
                            boxShadow: theme.shadows[2],
                            borderColor: "primary.main",
                          },
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap>
                            {access.client?.name || "Cliente"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Rol: <strong>{access.roleName || "OPERATIVO"}</strong>
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label="Activo"
                          color="success"
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600 }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Drawer: Habilitar Cuenta Digital */}
      <Drawer
        anchor="right"
        open={enableDrawerOpen}
        onClose={() => !submitting && setEnableDrawerOpen(false)}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 10,
          "& .MuiDrawer-paper": {
            zIndex: (theme) => theme.zIndex.modal + 10,
            width: { xs: "100%", sm: 480 },
            maxWidth: "100vw",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Drawer Header */}
        <Box
          sx={{
            p: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Habilitar Cuenta Digital
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Credenciales y roles de acceso para {employee?.fullName}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => !submitting && setEnableDrawerOpen(false)}
            disabled={submitting}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Drawer Body */}
        <Box
          sx={{
            p: 3,
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Se creará una cuenta vinculada a la cédula <strong>{employee?.document}</strong> para{" "}
            <strong>{employee?.fullName}</strong>.
          </Alert>

          {/* Role selector */}
          <Autocomplete
            multiple
            disablePortal
            options={roles}
            loading={loadingRoles}
            getOptionLabel={(option) => option.name || ""}
            isOptionEqualToValue={(option, val) => option.id === val.id}
            value={roles.filter((r) => selectedRoleIds.includes(r.id))}
            onChange={(_, val) => setSelectedRoleIds(val.map((r) => r.id))}
            slotProps={{
              popper: {
                sx: { zIndex: (theme) => theme.zIndex.modal + 100 },
              },
            }}
            noOptionsText={loadingRoles ? "Cargando roles..." : "No se encontraron roles disponibles"}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Roles del Sistema"
                size="small"
                placeholder={selectedRoleIds.length === 0 ? "Selecciona uno o más roles..." : ""}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingRoles ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key || option.id}
                    label={option.name}
                    size="small"
                    color="primary"
                    {...tagProps}
                  />
                );
              })
            }
          />

          {/* Password */}
          <TextField
            fullWidth
            size="small"
            label="Contraseña Inicial"
            placeholder="Dejar en blanco para generar automáticamente Cédula + #2026"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText="Si no especificas una contraseña, el usuario podrá ingresar con su número de documento seguido de #2026 y deberá cambiarla en el primer login."
          />
        </Box>

        {/* Drawer Footer */}
        <Box
          sx={{
            p: 2.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1.5,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.02)"
                : "rgba(0, 0, 0, 0.02)",
          }}
        >
          <Button
            onClick={() => setEnableDrawerOpen(false)}
            disabled={submitting}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleEnableUser}
            disabled={submitting}
            sx={{ fontWeight: 700, px: 2.5 }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : "Crear Cuenta Digital"}
          </Button>
        </Box>
      </Drawer>

      {/* Confirmation Dialog: Deshabilitar Cuenta Digital */}
      <PromptConfirmDialog
        open={confirmDisableOpen}
        onClose={() => setConfirmDisableOpen(false)}
        onConfirm={() => handleToggleStatus(false)}
        title="Deshabilitar Cuenta Digital"
        description={`Para confirmar la deshabilitación de la cuenta de ${user?.fullName}, el usuario perderá acceso inmediato a la plataforma y sus sesiones activas serán cerradas. Ingrese el número de documento para confirmar:`}
        expectedValue={user?.document || ""}
        inputLabel="Documento del Usuario"
        confirmButtonText="Deshabilitar Cuenta"
        confirmColor="error"
      />

      {/* Drawer: Modificar Roles Digitales */}
      <Drawer
        anchor="right"
        open={editRolesDrawerOpen}
        onClose={() => !submittingRoles && setEditRolesDrawerOpen(false)}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 10,
          "& .MuiDrawer-paper": {
            zIndex: (theme) => theme.zIndex.modal + 10,
            width: { xs: "100%", sm: 480 },
            maxWidth: "100vw",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            p: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Modificar Roles del Usuario
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Perfiles y permisos asignados a {user?.fullName}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => !submittingRoles && setEditRolesDrawerOpen(false)}
            disabled={submittingRoles}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box
          sx={{
            p: 3,
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Selecciona los roles del sistema que tendrá habilitados este usuario en la plataforma.
          </Alert>

          <Autocomplete
            multiple
            disablePortal
            options={roles}
            loading={loadingRoles}
            getOptionLabel={(option) => option.name || ""}
            isOptionEqualToValue={(option, val) => option.id === val.id}
            value={roles.filter((r) => selectedEditRoleIds.includes(r.id))}
            onChange={(_, val) => setSelectedEditRoleIds(val.map((r) => r.id))}
            slotProps={{
              popper: {
                sx: { zIndex: (theme) => theme.zIndex.modal + 100 },
              },
            }}
            noOptionsText={loadingRoles ? "Cargando roles..." : "No se encontraron roles disponibles"}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Roles del Sistema"
                size="small"
                placeholder={selectedEditRoleIds.length === 0 ? "Selecciona uno o más roles..." : ""}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingRoles ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key || option.id}
                    label={option.name}
                    size="small"
                    color="primary"
                    {...tagProps}
                  />
                );
              })
            }
          />
        </Box>

        <Box
          sx={{
            p: 2.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1.5,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.02)"
                : "rgba(0, 0, 0, 0.02)",
          }}
        >
          <Button
            onClick={() => setEditRolesDrawerOpen(false)}
            disabled={submittingRoles}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRoles}
            disabled={submittingRoles}
            sx={{ fontWeight: 700, px: 2.5 }}
          >
            {submittingRoles ? <CircularProgress size={20} color="inherit" /> : "Guardar Roles"}
          </Button>
        </Box>
      </Drawer>

      {/* Drawer: Deshabilitar Cuenta Digital */}
      <ResponsiveFormDrawer
        open={confirmDisableOpen}
        onClose={() => !submittingStatus && setConfirmDisableOpen(false)}
        title="Deshabilitar Cuenta Digital"
        subtitle={`Suspensión del acceso y revocación de credenciales para ${employee?.fullName || user?.fullName}`}
        headerIcon={<BlockIcon color="error" />}
        width={{ xs: "100%", sm: 520 }}
        isSubmitting={submittingStatus}
        submitButtonText="Confirmar Deshabilitación"
        submitButtonColor="error"
        actions={
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%" }}>
            <Button
              onClick={() => setConfirmDisableOpen(false)}
              color="inherit"
              disabled={submittingStatus}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleToggleStatus(false)}
              disabled={submittingStatus}
              startIcon={submittingStatus ? <CircularProgress size={16} color="inherit" /> : <BlockIcon />}
              sx={{ fontWeight: 700, px: 2.5 }}
            >
              {submittingStatus ? "Inhabilitando..." : "Deshabilitar Cuenta"}
            </Button>
          </Box>
        }
      >
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Revocación Inmediata de Acceso
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontSize: "0.85rem" }}>
              Al deshabilitar esta cuenta, se revocarán todos los tokens activos. El usuario no podrá iniciar sesión en la aplicación móvil ni en el portal web hasta que sea reactivado.
            </Typography>
          </Alert>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover" }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase" }}>
              Resumen de la Cuenta
            </Typography>
            <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Documento / Usuario</Typography>
                <Typography variant="body2" fontWeight={600}>{user?.document || "N/A"}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Colaborador</Typography>
                <Typography variant="body2" fontWeight={600}>{employee?.fullName || user?.fullName || "N/A"}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Estado Actual</Typography>
                <Box sx={{ mt: 0.25 }}>
                  <Chip size="small" label="Activo" color="success" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }} />
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Sedes Asignadas</Typography>
                <Typography variant="body2" fontWeight={600}>{user?.clientAccesses?.length || 0} sedes activas</Typography>
              </Grid>
            </Grid>
          </Paper>

          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            label="Motivo o Justificación de la Deshabilitación"
            placeholder="Ingrese el motivo administrativo u operativo (ej: retiro temporal, cambio de rol, suspensión disciplinaria)..."
            value={disableReason}
            onChange={(e) => setDisableReason(e.target.value)}
          />
        </Stack>
      </ResponsiveFormDrawer>
    </Box>
  );
}
