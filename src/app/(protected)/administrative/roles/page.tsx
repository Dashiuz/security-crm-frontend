"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import ResponsiveDetailWrapper from "@/components/common/ResponsiveDetailWrapper";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import { formatDateTime } from "@/lib/formatters";
import {
  Typography,
  Stack,
  Button,
  Box,
  Switch,
  TextField,
  Divider,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  useTheme,
  useMediaQuery,
  Grid,
  Paper,
  Avatar,
  CircularProgress,
} from "@mui/material";
import {
  AdminPanelSettingsOutlined as AdminPanelSettingsOutlinedIcon,
  SecurityRounded as SecurityIcon,
  BlockRounded as BlockIcon,
  CheckCircleRounded as CheckCircleIcon,
  DeleteForever as DeleteForeverIcon,
} from "@mui/icons-material";
import { GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";
import { useAuth } from "@/components/AuthContext";

// --- Role Edit Drawer (Consolidated & Refactored Master-Detail) ---

interface RoleEditDrawerProps {
  open: boolean;
  onClose: () => void;
  role: any;
  allPermissions: any[];
  onSuccess: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  client: "Clientes",
  resident: "Residentes",
  user: "Usuarios",
  employee: "Empleados",
  minuta: "Minutas",
  pqrs: "PQRS",
  sec_study: "Estudios de Seguridad",
  canva: "Canva & Geocercas",
  department: "Departamentos",
  position: "Posiciones",
  role: "Roles",
  permission: "Permisos",
  tenant: "Empresas",
  godlike: "SuperAdmin (Godlike)",
};

const CATEGORY_ORDER: Record<string, number> = {
  client: 1,
  resident: 2,
  user: 3,
  employee: 4,
  minuta: 5,
  pqrs: 6,
  sec_study: 7,
  canva: 8,
  department: 9,
  position: 10,
  role: 11,
  permission: 12,
  tenant: 13,
  godlike: 99,
};

function RoleEditDrawer({
  open,
  onClose,
  role,
  allPermissions,
  onSuccess,
}: RoleEditDrawerProps) {
  const { session } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const { showError, showSuccess } = useNotification();

  const isGodlike = Boolean(
    session?.permissions?.includes("godlike:manage"),
  );

  const visiblePermissions = isGodlike
    ? allPermissions
    : allPermissions.filter((p) => !p.key.startsWith("godlike:"));

  useEffect(() => {
    if (open && role) {
      setName(role.name || "");
      HttpClient.get<any>(`/role/${role.id}`).then((data) => {
        setSelectedPermissions(data.permissions?.map((p: any) => p.key) || []);
      });
    } else {
      setName("");
      setSelectedPermissions([]);
      setTabIndex(0);
    }
  }, [open, role]);

  const categories = Array.from(
    new Set(visiblePermissions.map((p) => p.key.split(":")[0])),
  ).sort((a, b) => (CATEGORY_ORDER[a] || 99) - (CATEGORY_ORDER[b] || 99));

  useEffect(() => {
    if (tabIndex >= categories.length && categories.length > 0) {
      setTabIndex(0);
    }
  }, [categories.length, tabIndex]);

  const activeCategory = categories[tabIndex] || "";
  const activeCategoryPerms = visiblePermissions.filter(
    (p) => p.key.startsWith(activeCategory + ":"),
  );

  // Ordenar permisos: el permiso :manage va en primer lugar (Hero card)
  const sortedCategoryPerms = [...activeCategoryPerms].sort((a, b) => {
    const aIsManage = a.key.endsWith(":manage");
    const bIsManage = b.key.endsWith(":manage");
    if (aIsManage && !bIsManage) return -1;
    if (!aIsManage && bIsManage) return 1;
    return a.key.localeCompare(b.key);
  });

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError("El nombre del rol es requerido");
      return;
    }
    setSaving(true);
    try {
      if (name !== role.name) {
        await HttpClient.patch(`/role/${role.id}`, { name });
      }
      await HttpClient.patch(`/role/${role.id}/permissions`, {
        keys: selectedPermissions,
      });
      showSuccess("Rol actualizado correctamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.message || "Error al actualizar el rol");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={onClose}
      title={`Gestionar Rol: ${role?.name || ""}`}
      subtitle="Configure el nombre del rol y los permisos de acceso por módulo"
      headerIcon={
        <AdminPanelSettingsOutlinedIcon
          color="primary"
          sx={{ fontSize: { xs: 24, sm: 28 } }}
        />
      }
      headerBadge={
        <Chip
          label={`${selectedPermissions.length} permisos`}
          color="primary"
          size="small"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: "0.75rem" }}
        />
      }
      width={{ xs: "100%", md: 760, lg: 820 }}
      actions={
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            flexDirection: { xs: "column-reverse", sm: "row" },
            gap: 1.5,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600 }}
          >
            Total permisos activos: {selectedPermissions.length}
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              width: { xs: "100%", sm: "auto" },
              justifyContent: "flex-end",
            }}
          >
            <Button
              onClick={onClose}
              disabled={saving}
              color="inherit"
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={saving}
              startIcon={
                saving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
              sx={{
                fontWeight: 600,
                minWidth: 140,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </Box>
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Nombre del Rol */}
        <TextField
          fullWidth
          size="small"
          label="Nombre del Rol"
          value={name}
          onChange={(e) => setName(e.target.value)}
          variant="outlined"
          helperText="Identificador único para el conjunto de permisos"
        />

        {/* Selector de categoría en Móvil (xs/sm) */}
        {isMobile && (
          <FormControl fullWidth size="small">
            <InputLabel id="category-select-label">Módulo / Categoría</InputLabel>
            <Select
              labelId="category-select-label"
              value={tabIndex}
              label="Módulo / Categoría"
              onChange={(e) => setTabIndex(Number(e.target.value))}
            >
              {categories.map((cat, i) => {
                const catKeys = visiblePermissions
                  .filter((p) => p.key.startsWith(cat + ":"))
                  .map((p) => p.key);
                const count = catKeys.filter((k) =>
                  selectedPermissions.includes(k),
                ).length;
                return (
                  <MenuItem key={cat} value={i}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {CATEGORY_LABELS[cat] || cat.toUpperCase()}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${count}/${catKeys.length}`}
                        color={
                          count > 0
                            ? count === catKeys.length
                              ? "primary"
                              : "default"
                            : "default"
                        }
                        variant={
                          count === catKeys.length ? "filled" : "outlined"
                        }
                        sx={{
                          height: 20,
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          ml: 1,
                        }}
                      />
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        )}

        {/* Master-Detail Container */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
            minHeight: { xs: "auto", md: 460 },
            bgcolor: "background.paper",
          }}
        >
          {/* Columna Izquierda: Categorías (Desktop 34%) */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              width: "34%",
              borderRight: "1px solid",
              borderColor: "divider",
              overflowY: "auto",
              maxHeight: 520,
              bgcolor: (t) =>
                t.palette.mode === "dark"
                  ? "rgba(255,255,255,0.02)"
                  : "grey.50",
            }}
          >
            <List dense disablePadding>
              {categories.map((cat, i) => {
                const catKeys = visiblePermissions
                  .filter((p) => p.key.startsWith(cat + ":"))
                  .map((p) => p.key);
                const count = catKeys.filter((k) =>
                  selectedPermissions.includes(k),
                ).length;
                const isSelected = tabIndex === i;

                return (
                  <ListItemButton
                    key={cat}
                    selected={isSelected}
                    onClick={() => setTabIndex(i)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      "&.Mui-selected": {
                        bgcolor: (t) =>
                          t.palette.mode === "dark"
                            ? "rgba(25, 118, 210, 0.16)"
                            : "primary.50",
                        color: "primary.main",
                        fontWeight: 700,
                        borderRight: (t) =>
                          `3px solid ${t.palette.primary.main}`,
                      },
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemText
                      disableTypography
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: "0.85rem",
                            color: isSelected
                              ? "primary.main"
                              : "text.primary",
                          }}
                        >
                          {CATEGORY_LABELS[cat] || cat.toUpperCase()}
                        </Typography>
                      }
                    />
                    <Chip
                      size="small"
                      label={`${count}/${catKeys.length}`}
                      color={
                        count > 0
                          ? count === catKeys.length
                            ? "primary"
                            : "default"
                          : "default"
                      }
                      variant={
                        count === catKeys.length ? "filled" : "outlined"
                      }
                      sx={{
                        height: 20,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        ml: 1,
                        pointerEvents: "none",
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>

          {/* Columna Derecha: Lista de Permisos */}
          <Box
            sx={{
              width: { xs: "100%", md: "66%" },
              p: { xs: 1.5, sm: 2 },
              overflowY: "auto",
              maxHeight: { xs: "none", md: 520 },
              display: "flex",
              flexDirection: "column",
            }}
          >
            <List dense disablePadding sx={{ width: "100%" }}>
              {sortedCategoryPerms.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.key);
                const isManage = perm.key.endsWith(":manage");

                return (
                  <ListItemButton
                    key={perm.id || perm.key}
                    onClick={() => togglePermission(perm.key)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      p: 1.5,
                      border: "1px solid",
                      borderColor: isManage
                        ? isChecked
                          ? "primary.main"
                          : "primary.light"
                        : isChecked
                          ? "primary.light"
                          : "divider",
                      borderWidth: isManage ? 2 : 1,
                      bgcolor: isManage
                        ? isChecked
                          ? (t) =>
                              t.palette.mode === "dark"
                                ? "rgba(25, 118, 210, 0.22)"
                                : "rgba(25, 118, 210, 0.08)"
                          : (t) =>
                              t.palette.mode === "dark"
                                ? "rgba(25, 118, 210, 0.08)"
                                : "rgba(25, 118, 210, 0.03)"
                        : isChecked
                          ? (t) =>
                              t.palette.mode === "dark"
                                ? "rgba(25, 118, 210, 0.12)"
                                : "rgba(25, 118, 210, 0.04)"
                          : "background.paper",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: isChecked
                          ? (t) =>
                              t.palette.mode === "dark"
                                ? "rgba(25, 118, 210, 0.25)"
                                : "rgba(25, 118, 210, 0.12)"
                          : "action.hover",
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    <ListItemText
                      disableTypography
                      primary={
                        <Box sx={{ mb: 0.5 }}>
                          {isManage && (
                            <Chip
                              size="small"
                              color="primary"
                              icon={
                                <AdminPanelSettingsOutlinedIcon
                                  sx={{ fontSize: "14px !important" }}
                                />
                              }
                              label="ADMIN / CONTROL TOTAL"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.68rem",
                                height: 22,
                                mb: 0.75,
                              }}
                            />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isManage ? 750 : 600,
                              color: "text.primary",
                              fontSize: isManage ? "0.92rem" : "0.85rem",
                            }}
                          >
                            {perm.desc || perm.key}
                          </Typography>
                          {isManage && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                display: "block",
                                mt: 0.25,
                              }}
                            >
                              Otorga gobernanza y control irrestricto sobre todas las operaciones de este módulo.
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={perm.key}
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.7rem",
                              height: 22,
                              borderColor: isChecked
                                ? "primary.main"
                                : "divider",
                              color: isChecked
                                ? "primary.main"
                                : "text.secondary",
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      }
                      sx={{ my: 0, pr: 2 }}
                    />
                    <Switch
                      edge="end"
                      color="primary"
                      checked={isChecked}
                      onChange={() => togglePermission(perm.key)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        </Box>
      </Box>
    </ResponsiveFormDrawer>
  );
}

// --- Main Page ---

const schema = z.object({
  name: z.string().min(1, "El nombre del rol es requerido").max(100),
});

type RoleForm = z.infer<typeof schema>;

const fields: FormField<RoleForm>[] = [
  { name: "name", label: "Nombre del Rol (ej. ADMIN_SYSTEM)", required: true },
];

const columns: GridColDef[] = [
  {
    field: "name",
    headerName: "Rol de Seguridad",
    flex: 1.5,
    minWidth: 220,
    renderCell: (params) => (
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ height: "100%" }}>
        <Avatar
          sx={{
            width: 34,
            height: 34,
            bgcolor: params.row.isActive !== false ? "#6366f1" : "text.disabled",
            color: "#ffffff",
          }}
        >
          <SecurityIcon sx={{ fontSize: 18 }} />
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {params.row.permissions?.length ? `${params.row.permissions.length} permisos asignados` : "Perfil de Acceso"}
          </Typography>
        </Box>
      </Stack>
    ),
  },
  {
    field: "isActive",
    headerName: "Estado",
    width: 130,
    renderCell: (params) => {
      const active = params.value !== false;
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
  {
    field: "createdBy",
    headerName: "Creado Por",
    width: 170,
    valueGetter: (value: any) => value || "Sistema",
  },
  {
    field: "createdAt",
    headerName: "Creado En",
    width: 170,
    valueFormatter: (value: any) => (value ? formatDateTime(value) : "N/A"),
  },
];

export default function RolesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [detailRole, setDetailRole] = useState<any | null>(null);
  const [deleteRole, setDeleteRole] = useState<any | null>(null);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    HttpClient.get<any[]>("/permission").then((data) => {
      setAllPermissions(data);
    });
  }, []);

  const handleCreate = () => {
    setDialogOpen(true);
  };

  const handleEdit = (id: string, row: any) => {
    setSelectedRole(row);
    setEditDialogOpen(true);
  };

  const handleView = (row: any) => {
    setDetailRole(row);
  };

  const handleDeleteRequest = (id: string) => {
    HttpClient.get<any[]>("/role").then((roles) => {
      const target = roles.find((r) => r.id === id);
      if (target) setDeleteRole(target);
    });
  };

  const handleToggleRoleStatus = async (role: any) => {
    try {
      await HttpClient.patch(`/role/${role.id}/status`, { isActive: role.isActive === false });
      showSuccess(`Rol ${role.isActive === false ? "habilitado" : "inhabilitado"} exitosamente`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al modificar el estado del rol");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteRole) return;
    try {
      await HttpClient.delete(`/role/${deleteRole.id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al eliminar el rol");
    }
  };

  const handleSubmit = async (data: RoleForm) => {
    try {
      await HttpClient.post("/role", data);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <>
      <DataTable
        title="Gestión de Roles"
        endpoint="/role"
        columns={columns}
        breadcrumbs={[{ label: "Administrativo" }, { label: "Roles" }]}
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
              row.isActive !== false ? (
                <BlockIcon color="error" fontSize="small" />
              ) : (
                <CheckCircleIcon color="success" fontSize="small" />
              )
            }
            label={row.isActive !== false ? "Inhabilitar rol" : "Habilitar rol"}
            onClick={() => handleToggleRoleStatus(row)}
            showInMenu={true}
          />,
        ]}
        refreshTrigger={refreshTrigger}
        infoDescription="Administración de los roles de acceso al sistema, permitiendo definir perfiles de usuario y asignar permisos específicos por cada módulo."
        infoInstructions={`Utiliza esta vista para crear nuevos roles o modificar los existentes.
Haz clic en el icono de ojo para ver quién creó el rol y la fecha de creación.
Haz clic en el icono de borrado para eliminar un rol especificando su nombre exacto.`}
      />

      <ResponsiveDetailWrapper
        open={Boolean(detailRole)}
        onClose={() => setDetailRole(null)}
        title="Detalles del Rol"
        actions={
          <Box display="flex" justifyContent="flex-end">
            <Button onClick={() => setDetailRole(null)} variant="outlined">
              Cerrar
            </Button>
          </Box>
        }
      >
        {detailRole && (
          <Box>
            <Box sx={{ bgcolor: 'background.default', p: 3, borderRadius: 2, mb: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontSize: "1.5rem", fontWeight: 700 }}>
                  {detailRole.name.substring(0, 2).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {detailRole.name}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Paper elevation={0} sx={{ bgcolor: 'background.default', borderRadius: 2, p: 3, height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Información de Registro
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Creado Por</Typography>
                      <Typography variant="body2">{detailRole.createdBy || "Sistema"}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Fecha de Creación</Typography>
                      <Typography variant="body2">{detailRole.createdAt ? formatDateTime(detailRole.createdAt) : "N/A"}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Permisos Asignados</Typography>
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {detailRole.permissions && detailRole.permissions.length > 0 ? (
                          detailRole.permissions.map((p: any) => (
                            <Chip key={p.key} label={p.key} size="small" variant="outlined" />
                          ))
                        ) : (
                          <Typography variant="body2">Sin Permisos</Typography>
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
        open={Boolean(deleteRole)}
        onClose={() => setDeleteRole(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Rol"
        description={`Para confirmar la eliminación del rol "${deleteRole?.name}", por favor ingrese su nombre exacto:`}
        expectedValue={deleteRole?.name || ""}
        inputLabel="Nombre del Rol"
        confirmButtonText="Confirmar Eliminación"
        confirmColor="error"
      />

      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title="Crear Rol"
        schema={schema}
        fields={fields}
      />

      <RoleEditDrawer
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        role={selectedRole}
        allPermissions={allPermissions}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </>
  );
}
