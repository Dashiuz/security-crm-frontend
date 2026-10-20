"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { useTenant } from "@/providers/TenantProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import ResponsiveDetailWrapper from "@/components/common/ResponsiveDetailWrapper";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import ClientAutocomplete, { ClientOption } from "@/components/common/ClientAutocomplete";
import EmployeeAutocomplete, { EmployeeOption } from "@/components/common/EmployeeAutocomplete";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import {
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Box,
  Divider,
  Alert,
  Chip,
  Grid,
  Paper,
  Avatar,
  InputAdornment,
  IconButton,
  CircularProgress,
  Autocomplete,
  Checkbox,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Security as SecurityIcon,
  LockReset as LockResetIcon,
  PersonAdd as PersonAddIcon,
  AssignmentInd as AssignmentIndIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  InfoOutlined as InfoOutlinedIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Business as BusinessIcon,
  BadgeOutlined as BadgeOutlinedIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  DeleteForever as DeleteForeverIcon,
} from "@mui/icons-material";
import { GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";

// --- Schemas & Fields ---

const standardSchema = z.object({
  document: z.string().min(1, "El documento es requerido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  roleIds: z
    .preprocess((val) => {
      if (!val || val === "") return [];
      if (Array.isArray(val)) return val;
      return [val];
    }, z.array(z.string()))
    .optional(),
  userType: z.enum(["EMPLOYEE", "RESIDENCE_MANAGER"]).optional().default("EMPLOYEE"),
  clientId: z.string().optional(),
  fullName: z.string().optional(),
}).refine(data => {
  if (data.userType === "RESIDENCE_MANAGER") {
    return !!data.clientId && !!data.fullName;
  }
  return true;
}, { message: "Conjunto y Nombre son requeridos para Administradores", path: ["clientId"] });

const systemSchema = z.object({
  document: z.string().min(1, "El documento es requerido"),
  fullName: z.string().min(1, "El nombre completo es requerido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  roleIds: z
    .preprocess((val) => {
      if (!val || val === "") return [];
      if (Array.isArray(val)) return val;
      return [val];
    }, z.array(z.string()))
    .optional(),
  department: z.string().optional(),
  position: z.string().optional(),
});

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type UserForm = z.infer<typeof standardSchema>;
type SystemUserForm = z.infer<typeof systemSchema>;
type ResetPasswordForm = z.infer<typeof resetSchema>;

const standardFields: FormField<any>[] = [
  {
    name: "document",
    label: "Documento del Empleado (debe existir)",
    required: true,
  },
  {
    name: "password",
    label: "Contraseña",
    required: true,
    placeholder: "Asigne una Contraseña",
    type: "password",
  },
  {
    name: "roleIds",
    label: "Asignar Roles (Opcional)",
    type: "select",
  },
];

const systemFields: FormField<any>[] = [
  {
    name: "document",
    label: "Documento de Identidad",
    required: true,
    placeholder: "Número de documento",
  },
  {
    name: "fullName",
    label: "Nombre Completo",
    required: true,
    placeholder: "Nombre completo del administrador",
  },
  {
    name: "password",
    label: "Contraseña",
    required: true,
    placeholder: "Asigne una Contraseña",
    type: "password",
  },
  {
    name: "roleIds",
    label: "Asignar Roles (Opcional)",
    type: "select",
  },
  {
    name: "department",
    label: "Departamento",
    disabled: true,
  },
  {
    name: "position",
    label: "Cargo",
    disabled: true,
  },
];

const resetFields: FormField<ResetPasswordForm>[] = [
  {
    name: "password",
    label: "Nueva Contraseña",
    type: "password",
    required: true,
  },
  {
    name: "confirmPassword",
    label: "Confirmar Contraseña",
    type: "password",
    required: true,
  },
];

// --- Consolidated Edit Drawer ---

interface UserEditDrawerProps {
  open: boolean;
  onClose: () => void;
  user: any;
  allRoles: { id: string; name: string }[];
  onSuccess: () => void;
}

function UserEditDrawer({
  open,
  onClose,
  user,
  allRoles,
  onSuccess,
}: UserEditDrawerProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [updatingRole, setUpdatingRole] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    if (open && user?.roles?.length > 0) {
      setSelectedRole(user.roles[0].id);
    } else {
      setSelectedRole("");
    }
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, [open, user]);

  const handleRoleUpdate = async () => {
    if (!selectedRole) return;
    setUpdatingRole(true);
    try {
      await HttpClient.patch(`/users/${user.id}/roles`, {
        addRoleIds: [selectedRole],
        removeRoleIds: user.roles
          ?.filter((r: any) => r.id !== selectedRole)
          .map((r: any) => r.id),
      });
      showSuccess("Rol actualizado con éxito");
      onSuccess();
    } catch (error: any) {
      showError(error.message || "Error al actualizar el rol");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 8) {
      showError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Las contraseñas no coinciden");
      return;
    }
    setResettingPassword(true);
    try {
      await HttpClient.patch("/user/admin/reset-password", {
        document: user.document,
        newPassword: newPassword,
      });
      showSuccess("Contraseña restablecida con éxito");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.message || "Error al restablecer la contraseña");
    } finally {
      setResettingPassword(false);
    }
  };

  const currentRoleName = user?.roles?.[0]?.name || "Sin Rol";

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={onClose}
      title="Gestionar Usuario"
      subtitle={user?.fullName || "Modifique el rol o restablezca las credenciales"}
      headerIcon={<SecurityIcon color="primary" />}
      headerBadge={
        <Chip
          size="small"
          label={user?.isActive ? "Activo" : "Inactivo"}
          color={user?.isActive ? "success" : "default"}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      }
      width={{ xs: "100%", sm: 540, md: 560 }}
      actions={
        <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
          <Button onClick={onClose} variant="outlined" color="inherit">
            Cerrar
          </Button>
        </Box>
      }
    >
      <Stack spacing={3}>
        {/* SECCIÓN 1: ROL DE ACCESO */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: (t) =>
              t.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "grey.50",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <SecurityIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Rol de Acceso
              </Typography>
            </Stack>
            <Chip
              size="small"
              label={`Actual: ${currentRoleName}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: "0.75rem" }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Asigne el rol principal para este usuario. Esto determinará sus permisos y nivel de acceso en la plataforma.
          </Typography>

          <TextField
            select
            fullWidth
            size="small"
            label="Rol del Usuario"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            sx={{ mb: 2 }}
          >
            {allRoles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleRoleUpdate}
              disabled={!selectedRole || updatingRole}
              startIcon={
                updatingRole ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
              sx={{ fontWeight: 600 }}
            >
              {updatingRole ? "Actualizando..." : "Actualizar Rol"}
            </Button>
          </Box>
        </Paper>

        {/* SECCIÓN 2: SEGURIDAD Y RESTABLECIMIENTO DE CONTRASEÑA */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: (t) =>
              t.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "grey.50",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <LockResetIcon color="warning" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Seguridad y Contraseña
            </Typography>
          </Stack>

          <Alert severity="warning" sx={{ mb: 2.5, fontSize: "0.85rem" }}>
            Al restablecer la contraseña, se obligará al usuario a cambiarla en su próximo inicio de sesión.
          </Alert>

          <Stack spacing={2} sx={{ mb: 2.5 }}>
            <TextField
              fullWidth
              size="small"
              type={showNewPassword ? "text" : "password"}
              label="Nueva Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              size="small"
              type={showConfirmPassword ? "text" : "password"}
              label="Confirmar Nueva Contraseña"
              placeholder="Repita la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              color="warning"
              onClick={handlePasswordReset}
              disabled={!newPassword || !confirmPassword || resettingPassword}
              startIcon={
                resettingPassword ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
              sx={{ fontWeight: 600 }}
            >
              {resettingPassword ? "Restableciendo..." : "Restablecer Contraseña"}
            </Button>
          </Box>
        </Paper>
      </Stack>
    </ResponsiveFormDrawer>
  );
}

// --- Standard User Create Drawer ---

interface ClientAdministratorOption {
  name: string;
  document: string;
  email: string;
  phone: string;
  roleName: string;
  administrationType: "INDIVIDUAL" | "ENTERPRISE";
  isAlreadyUser: boolean;
  hasAccessToThisClient: boolean;
  userId?: string;
}

function UserCreateDrawer({
  open,
  onClose,
  onSubmit,
  allRoles,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  allRoles: { id: string; name: string }[];
}) {
  const [userType, setUserType] = useState<"EMPLOYEE" | "RESIDENCE_MANAGER">("EMPLOYEE");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);

  // Residence Manager state
  const [clientOption, setClientOption] = useState<ClientOption | null>(null);
  const [administrators, setAdministrators] = useState<ClientAdministratorOption[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<ClientAdministratorOption | null>(null);

  const [document, setDocument] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    if (open) {
      setUserType("EMPLOYEE");
      setSelectedEmployee(null);
      setClientOption(null);
      setAdministrators([]);
      setSelectedAdmin(null);
      setDocument("");
      setFullName("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setRoleIds([]);
      setSubmitting(false);
    }
  }, [open]);

  // Reactive fetch of client administrators
  useEffect(() => {
    if (userType === "RESIDENCE_MANAGER" && clientOption?.id) {
      setLoadingAdmins(true);
      setSelectedAdmin(null);
      setDocument("");
      setFullName("");
      HttpClient.get<ClientAdministratorOption[]>(
        `/client/${clientOption.id}/administrators`,
      )
        .then((admins) => {
          const list = admins || [];
          setAdministrators(list);
          if (list.length === 1) {
            handleSelectAdmin(list[0]);
          }
        })
        .catch((err: any) => {
          showError(err.message || "Error al cargar administradores del conjunto");
          setAdministrators([]);
        })
        .finally(() => {
          setLoadingAdmins(false);
        });
    } else {
      setAdministrators([]);
      setSelectedAdmin(null);
      setDocument("");
      setFullName("");
    }
  }, [clientOption, userType]);

  const handleSelectAdmin = (admin: ClientAdministratorOption | null) => {
    setSelectedAdmin(admin);
    if (admin) {
      setDocument(admin.document);
      setFullName(admin.name);
    } else {
      setDocument("");
      setFullName("");
    }
  };

  const isMultiClientExisting =
    userType === "RESIDENCE_MANAGER" && !!selectedAdmin?.isAlreadyUser;
  const isAlreadyActiveInClient =
    userType === "RESIDENCE_MANAGER" && !!selectedAdmin?.hasAccessToThisClient;

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const passwordTooShort = password.length > 0 && password.length < 8;

  const handleSubmit = async () => {
    try {
      if (userType === "EMPLOYEE") {
        if (!selectedEmployee || !document) {
          showError("Debe seleccionar un empleado existente");
          return;
        }
        if (!password || password.length < 8) {
          showError("La contraseña debe tener al menos 8 caracteres");
          return;
        }
        if (password !== confirmPassword) {
          showError("Las contraseñas no coinciden");
          return;
        }
      } else if (userType === "RESIDENCE_MANAGER") {
        if (!clientOption) {
          showError("Debe seleccionar un conjunto residencial / cliente");
          return;
        }
        if (!selectedAdmin || !document) {
          showError("Debe seleccionar un administrador registrado");
          return;
        }
        if (selectedAdmin.hasAccessToThisClient) {
          showError("Este administrador ya cuenta con acceso activo a este conjunto");
          return;
        }
        if (!isMultiClientExisting) {
          if (!password || password.length < 8) {
            showError("La contraseña debe tener al menos 8 caracteres");
            return;
          }
          if (password !== confirmPassword) {
            showError("Las contraseñas no coinciden");
            return;
          }
        }
      }

      const data: any = {
        userType,
        document,
        roleIds,
      };

      if (!isMultiClientExisting) {
        data.password = password;
      }

      if (userType === "RESIDENCE_MANAGER") {
        data.fullName = fullName;
        data.clientId = clientOption?.id;
        data.roleName = selectedAdmin?.roleName;
      }

      setSubmitting(true);
      await onSubmit(data);
      showSuccess(
        isMultiClientExisting
          ? "Acceso al conjunto residencial habilitado con éxito"
          : "Usuario creado exitosamente",
      );
    } catch (err: any) {
      showError(err.message || "Error al procesar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled =
    submitting ||
    (userType === "EMPLOYEE" &&
      (!selectedEmployee ||
        !password ||
        password.length < 8 ||
        password !== confirmPassword)) ||
    (userType === "RESIDENCE_MANAGER" &&
      (!clientOption ||
        !selectedAdmin ||
        isAlreadyActiveInClient ||
        (!isMultiClientExisting &&
          (!password || password.length < 8 || password !== confirmPassword))));

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={onClose}
      title="Crear Usuario"
      subtitle={
        userType === "RESIDENCE_MANAGER"
          ? "Otorgue credenciales o habilite accesos a administradores de conjunto"
          : "Registre una cuenta de acceso para un empleado activo"
      }
      headerIcon={<PersonAddIcon color="primary" />}
      width={{ xs: "100%", sm: 540 }}
      isSubmitting={submitting}
      actions={
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            justifyContent: "flex-end",
            width: "100%",
            flexDirection: { xs: "column-reverse", sm: "row" },
          }}
        >
          <Button onClick={onClose} color="inherit" disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            startIcon={
              submitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
            sx={{ fontWeight: 600, minWidth: 150 }}
          >
            {submitting
              ? "Procesando..."
              : isMultiClientExisting
              ? "Habilitar Acceso a Conjunto"
              : "Crear Usuario"}
          </Button>
        </Box>
      }
    >
      <Stack spacing={2.5}>
        {/* SELECTOR DE TIPO DE USUARIO */}
        <TextField
          select
          fullWidth
          size="small"
          label="Tipo de Usuario"
          value={userType}
          onChange={(e) => {
            setUserType(e.target.value as any);
            setSelectedEmployee(null);
            setClientOption(null);
            setSelectedAdmin(null);
            setDocument("");
            setFullName("");
            setPassword("");
            setConfirmPassword("");
          }}
        >
          <MenuItem value="EMPLOYEE">Usuario para Empleado</MenuItem>
          <MenuItem value="RESIDENCE_MANAGER">
            Usuario Administrador de Conjunto
          </MenuItem>
        </TextField>

        {/* --- FLUJO DE RESIDENCE_MANAGER --- */}
        {userType === "RESIDENCE_MANAGER" && (
          <>
            {/* 1. Selector de Cliente / Conjunto */}
            <ClientAutocomplete
              value={clientOption}
              onChange={setClientOption}
              error={false}
              helperText=""
            />

            {/* Estado de carga de administradores */}
            {loadingAdmins && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  py: 2,
                }}
              >
                <CircularProgress size={20} color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Consultando administradores registrados en legal...
                </Typography>
              </Box>
            )}

            {/* Aviso cuando el cliente no tiene administradores configurados */}
            {clientOption && !loadingAdmins && administrators.length === 0 && (
              <Alert
                severity="info"
                icon={<InfoOutlinedIcon fontSize="inherit" />}
                sx={{
                  borderRadius: 2,
                  bgcolor: (t) =>
                    t.palette.mode === "dark"
                      ? "rgba(100, 116, 139, 0.15)"
                      : "rgba(100, 116, 139, 0.08)",
                  color: "text.primary",
                  border: "1px solid",
                  borderColor: "divider",
                  "& .MuiAlert-icon": { color: "info.main" },
                }}
              >
                El cliente seleccionado no cuenta con datos de administración registrados en el módulo <strong>Legal y Contratos</strong>.
                Para otorgar accesos, primero configure la administración en la ficha del cliente.
              </Alert>
            )}

            {/* 2. Selector de Administrador (Habilitado solo tras escoger cliente con datos) */}
            {clientOption && !loadingAdmins && administrators.length > 0 && (
              <TextField
                select
                fullWidth
                size="small"
                label="Administrador Registrado (Legal)"
                value={selectedAdmin ? selectedAdmin.document : ""}
                onChange={(e) => {
                  const found = administrators.find(
                    (a) => a.document === e.target.value,
                  );
                  handleSelectAdmin(found || null);
                }}
                helperText="Seleccione la persona física designada contractualmente por la copropiedad"
              >
                {administrators.map((admin) => (
                  <MenuItem key={admin.document} value={admin.document}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {admin.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          C.C. {admin.document}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={admin.roleName}
                        variant="outlined"
                        sx={{ fontSize: "0.75rem", height: 22 }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            )}

            {/* Tarjeta de Resumen del Administrador Seleccionado */}
            {selectedAdmin && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (t) =>
                    t.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.02)"
                      : "grey.50",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {selectedAdmin.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Documento: <strong>{selectedAdmin.document}</strong>
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={selectedAdmin.roleName}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ fontSize: "0.8rem", color: "text.secondary", flexWrap: "wrap", gap: 1 }}
                >
                  {selectedAdmin.phone && <span>📞 {selectedAdmin.phone}</span>}
                  {selectedAdmin.email && <span>✉️ {selectedAdmin.email}</span>}
                </Stack>
              </Paper>
            )}

            {/* Aviso si ya cuenta con acceso activo a este cliente */}
            {isAlreadyActiveInClient && (
              <Alert
                severity="warning"
                sx={{
                  borderRadius: 2,
                  bgcolor: (t) =>
                    t.palette.mode === "dark"
                      ? "rgba(245, 158, 11, 0.12)"
                      : "rgba(245, 158, 11, 0.08)",
                  color: "text.primary",
                  border: "1px solid",
                  borderColor: "warning.light",
                }}
              >
                Este administrador ya cuenta con acceso activo a este conjunto residencial.
              </Alert>
            )}

            {/* Aviso si ya tiene cuenta en Noxia (Multi-Cliente) */}
            {isMultiClientExisting && !isAlreadyActiveInClient && (
              <Alert
                severity="info"
                icon={<AssignmentIndIcon />}
                sx={{
                  borderRadius: 2,
                  bgcolor: (t) =>
                    t.palette.mode === "dark"
                      ? "rgba(2, 132, 199, 0.12)"
                      : "rgba(2, 132, 199, 0.08)",
                  color: "text.primary",
                  border: "1px solid",
                  borderColor: "primary.light",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Cuenta Activa Detectada
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                  {selectedAdmin?.name} ya cuenta con usuario activo en la plataforma. Al confirmar, se le habilitará el acceso para administrar este conjunto residencial manteniendo su contraseña actual.
                </Typography>
              </Alert>
            )}
          </>
        )}

        {/* --- FLUJO DE EMPLOYEE --- */}
        {userType === "EMPLOYEE" && (
          <>
            <EmployeeAutocomplete
              value={selectedEmployee}
              onChange={(emp) => {
                setSelectedEmployee(emp);
                setDocument(emp?.document || "");
                setFullName(emp?.fullName || "");
              }}
              required
            />

            {selectedEmployee && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (t) =>
                    t.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.02)"
                      : "grey.50",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {selectedEmployee.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Cédula / Documento: <strong>{selectedEmployee.document}</strong>
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={selectedEmployee.positionRef?.name || "Cargo"}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                {selectedEmployee.departmentRef?.name && (
                  <Typography variant="caption" color="text.secondary">
                    Departamento: {selectedEmployee.departmentRef.name}
                  </Typography>
                )}
              </Paper>
            )}
          </>
        )}

        {/* --- CAMPOS DE CONTRASEÑA --- */}
        {/* Solo si es empleado o si es administrador nuevo sin cuenta previa */}
        {(userType === "EMPLOYEE" ||
          (userType === "RESIDENCE_MANAGER" &&
            selectedAdmin &&
            !selectedAdmin.isAlreadyUser)) && (
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              type={showPassword ? "text" : "password"}
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              size="small"
              type={showConfirmPassword ? "text" : "password"}
              label="Confirmar Contraseña"
              placeholder="Repita la contraseña asignada"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showConfirmPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Helper status visual para contraseñas (sin rojos agresivos) */}
            {confirmPassword.length > 0 && confirmPassword !== password && (
              <Typography
                variant="caption"
                sx={{
                  color: "warning.main",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                Las contraseñas no coinciden aún
              </Typography>
            )}

            {passwordTooShort && (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                La contraseña debe tener al menos 8 caracteres ({password.length}/8)
              </Typography>
            )}

            {passwordsMatch && password.length >= 8 && (
              <Typography
                variant="caption"
                sx={{
                  color: "primary.main",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <CheckCircleOutlineIcon fontSize="inherit" />
                Contraseñas coinciden correctamente
              </Typography>
            )}
          </Stack>
        )}

        {/* --- ASIGNACIÓN DE ROLES --- */}
        {userType === "EMPLOYEE" && (
          <Autocomplete
            multiple
            size="small"
            options={allRoles}
            disableCloseOnSelect
            getOptionLabel={(option) => option.name}
            value={allRoles.filter((r) => roleIds.includes(r.id))}
            onChange={(_, newValue) => {
              setRoleIds(newValue.map((r) => r.id));
            }}
            renderOption={(props, option, { selected }) => {
              const { key, ...optionProps } = props as any;
              return (
                <li key={key || option.id} {...optionProps}>
                  <Checkbox
                    size="small"
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {option.name}
                    </Typography>
                  </Box>
                </li>
              );
            }}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key || option.id}
                    {...tagProps}
                    label={option.name}
                    size="small"
                    variant="outlined"
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Asignar Roles (Opcional)"
                placeholder="Buscar y seleccionar roles..."
              />
            )}
          />
        )}

        {userType === "RESIDENCE_MANAGER" && (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: (t) =>
                t.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "grey.50",
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <AdminPanelSettingsIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Rol Asignado: residence-manager
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Permisos predeterminados para la gestión de residentes y copropiedad
                </Typography>
              </Box>
            </Box>
            <Chip
              size="small"
              label="Automático"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: "0.75rem" }}
            />
          </Paper>
        )}
      </Stack>
    </ResponsiveFormDrawer>
  );
}

// --- Main Page ---

const columns: GridColDef[] = [
  {
    field: "fullName",
    headerName: "Usuario",
    flex: 1.5,
    minWidth: 230,
    renderCell: (params) => {
      const name = params.row.fullName || "Usuario";
      const initials = name
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      return (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ height: "100%" }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: "0.8rem",
              fontWeight: 700,
              bgcolor: params.row.isActive ? "primary.main" : "text.disabled",
              color: "#fff",
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              Doc: {params.row.document}
            </Typography>
          </Box>
        </Stack>
      );
    },
  },
  {
    field: "clientName",
    headerName: "Cliente / Conjunto",
    flex: 1,
    minWidth: 160,
    valueGetter: (value: any) => value || "Sin asignar",
  },
  {
    field: "roles",
    headerName: "Rol de Acceso",
    flex: 1,
    minWidth: 140,
    renderCell: (params) => {
      const rolesList = params.row.roles || [];
      if (rolesList.length === 0) {
        return <Typography variant="caption" color="text.secondary" fontStyle="italic">Sin Rol</Typography>;
      }
      return (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
          {rolesList.map((r: any) => (
            <Chip
              key={r.id || r.name}
              icon={<SecurityIcon sx={{ fontSize: "13px !important" }} />}
              label={r.name}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600, height: 22, fontSize: "0.72rem" }}
            />
          ))}
        </Stack>
      );
    },
  },
  { field: "department", headerName: "Departamento", width: 130 },
  { field: "position", headerName: "Cargo", width: 130 },
  {
    field: "userType",
    headerName: "Tipo",
    width: 140,
    valueGetter: (value: any) =>
      value === "RESIDENCE_MANAGER" ? "Admin. Conjunto" : "Empleado",
  },
  {
    field: "isActive",
    headerName: "Estado",
    width: 120,
    renderCell: (params) => {
      const active = Boolean(params.value);
      return (
        <Chip
          size="small"
          label={active ? "Activo" : "Inactivo"}
          icon={
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: active ? "#10b981" : "#94a3b8",
                boxShadow: active ? "0 0 6px rgba(16, 185, 129, 0.6)" : "none",
                ml: "4px !important",
              }}
            />
          }
          variant="outlined"
          sx={{
            fontWeight: 700,
            fontSize: "0.72rem",
            height: 24,
            borderColor: active ? "success.light" : "divider",
            color: active ? "success.dark" : "text.secondary",
            bgcolor: active ? "rgba(16, 185, 129, 0.05)" : "transparent",
          }}
        />
      );
    },
  },
];

export default function UsersPage() {
  const { tenant } = useTenant();
  const isSystemTenant = tenant?.slug === "system";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailUser, setDetailUser] = useState<any | null>(null);
  const [deleteUserData, setDeleteUserData] = useState<any | null>(null);
  const [allRoles, setAllRoles] = useState<{ id: string; name: string }[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    HttpClient.get<any[]>("/role").then((data) => {
      setAllRoles(data.map((r) => ({ id: r.id, name: r.name })));
    });
  }, []);

  const handleCreate = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string, row: any) => {
    setSelectedUser(row);
    setEditDialogOpen(true);
  };

  const handleView = (row: any) => {
    setDetailUser(row);
  };

  const handleDeleteRequest = (id: string) => {
    // Find matching user or store selected user data
    HttpClient.get<any[]>("/user").then((users) => {
      const target = users.find((u) => u.id === id);
      if (target) setDeleteUserData(target);
    });
  };

  const handleToggleUserStatus = async (user: any) => {
    if (user.isActive) {
      setDeleteUserData(user);
    } else {
      try {
        await HttpClient.patch(`/user/${user.id}/status`, { isActive: true });
        showSuccess("Usuario habilitado exitosamente");
        setRefreshTrigger((prev) => prev + 1);
      } catch (err: any) {
        showError(err.message || "Error al habilitar el usuario");
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteUserData) return;
    try {
      await HttpClient.delete(`/user/${deleteUserData.id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al eliminar el usuario");
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const payload = isSystemTenant
        ? {
            ...data,
            department: "system",
            position: "system manager",
          }
        : data;
      await HttpClient.post("/user", payload);
      setRefreshTrigger((prev) => prev + 1);
      setDialogOpen(false);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <>
      <DataTable
        title={isSystemTenant ? "Gestión de Usuarios (GODLIKE)" : "Gestión de Usuarios"}
        endpoint="/user"
        columns={columns}
        breadcrumbs={[{ label: isSystemTenant ? "Sistema" : "Administrativo" }, { label: "Usuarios" }]}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        deleteActionLabel="Eliminar..."
        deleteIcon={<DeleteForeverIcon color="error" />}
        onView={handleView}
        customActions={(row) => [
          <GridActionsCellItem
            key="toggle-status"
            icon={
              row.isActive ? (
                <BlockIcon color="error" fontSize="small" />
              ) : (
                <CheckCircleIcon color="success" fontSize="small" />
              )
            }
            label={row.isActive ? "Inhabilitar usuario" : "Habilitar usuario"}
            onClick={() => handleToggleUserStatus(row)}
            showInMenu={true}
          />,
        ]}
        refreshTrigger={refreshTrigger}
        infoDescription={
          isSystemTenant
            ? "Gestión centralizada de los administradores globales (GODLIKE) del sistema con control total."
            : "Gestión centralizada de los usuarios del sistema, permitiendo la creación de cuentas, asignación de roles y restablecimiento de contraseñas de seguridad."
        }
        infoInstructions={
          isSystemTenant
            ? `Gestione los administradores (GODLIKE) del sistema.
Para crear un nuevo usuario administrador, complete el documento, nombre completo y contraseña (el cargo y departamento son asignados por el sistema).
Haz clic en el icono de borrado para inhabilitar la cuenta confirmando con la cédula (debe existir al menos un usuario activo).`
            : `Para crear un usuario, el empleado debe existir previamente.
Haz clic en el icono de ojo para ver los detalles del usuario.
Haz clic en el icono de borrado para inhabilitar la cuenta confirmando con la cédula del usuario.`
        }
      />

      <ResponsiveDetailWrapper
        open={Boolean(detailUser)}
        onClose={() => setDetailUser(null)}
        title="Detalles del Usuario"
        actions={
          <Box display="flex" justifyContent="flex-end">
            <Button onClick={() => setDetailUser(null)} variant="outlined">
              Cerrar
            </Button>
          </Box>
        }
      >
        {detailUser && (
          <Box>
            <Box sx={{ bgcolor: 'background.default', p: 3, borderRadius: 2, mb: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontSize: "1.5rem", fontWeight: 700 }}>
                  {detailUser.fullName
                    ? detailUser.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("")
                    : "US"}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {detailUser.fullName}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
                    <Chip size="small" label={detailUser.position || "Sin Cargo"} variant="outlined" sx={{ ml: "0 !important" }} />
                    <Chip size="small" label={detailUser.department || "Sin Departamento"} variant="outlined" />
                    <Chip
                      size="small"
                      label={detailUser.isActive ? "Activo" : "Inactivo"}
                      color={detailUser.isActive ? "success" : "default"}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ bgcolor: 'background.default', borderRadius: 2, p: 3, height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Información Operativa
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Documento</Typography>
                      <Typography variant="body2">{detailUser.document}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Cliente / Conjunto</Typography>
                      <Typography variant="body2">{detailUser.clientName || "Sin asignar (se gestiona desde Empleado)"}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ bgcolor: 'background.default', borderRadius: 2, p: 3, height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Accesos
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Roles Asignados</Typography>
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {detailUser.roles && detailUser.roles.length > 0 ? (
                          detailUser.roles.map((r: any) => (
                            <Chip key={r.id || r.name} label={r.name} size="small" variant="outlined" />
                          ))
                        ) : (
                          <Typography variant="body2">Sin Rol</Typography>
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </ResponsiveDetailWrapper>

      <PromptConfirmDialog
        open={Boolean(deleteUserData)}
        onClose={() => setDeleteUserData(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Cuenta de Usuario"
        description={`Para confirmar la eliminación definitiva de la cuenta de ${deleteUserData?.fullName}, por favor ingrese su número de documento:`}
        expectedValue={deleteUserData?.document || ""}
        inputLabel="Número de Documento"
        confirmButtonText="Confirmar Eliminación"
        confirmColor="error"
      />

      {isSystemTenant ? (
        <FormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          title="Crear Usuario Administrador (GODLIKE)"
          schema={systemSchema}
          defaultValues={{
            department: "system",
            position: "system manager",
          }}
          fields={
            systemFields.map((f) =>
              f.name === "roleIds"
                ? {
                    ...f,
                    options: allRoles.map((r) => ({
                      value: r.id,
                      label: r.name,
                    })),
                  }
                : f,
            ) as any
          }
        />
      ) : (
        <UserCreateDrawer
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          allRoles={allRoles}
        />
      )}

      <UserEditDrawer
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        user={selectedUser}
        allRoles={allRoles}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </>
  );
}
