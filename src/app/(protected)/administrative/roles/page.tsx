"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import ResponsiveDetailWrapper from "@/components/common/ResponsiveDetailWrapper";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import { formatDateTime } from "@/lib/formatters";
import {
  Typography,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Tabs,
  Tab,
  FormControlLabel,
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
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { GridColDef } from "@mui/x-data-grid";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";
import { useAuth } from "@/components/AuthContext";

// --- Role Edit Dialog (Consolidated & Refactored Master-Detail) ---

interface RoleEditDialogProps {
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

function RoleEditDialog({
  open,
  onClose,
  role,
  allPermissions,
  onSuccess,
}: RoleEditDialogProps) {
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
  const activeCategoryKeys = activeCategoryPerms.map((p) => p.key);
  const activeSelectedCount = activeCategoryKeys.filter((k) =>
    selectedPermissions.includes(k),
  ).length;
  const isAllCategorySelected =
    activeCategoryKeys.length > 0 &&
    activeSelectedCount === activeCategoryKeys.length;

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleToggleAllCategory = () => {
    if (isAllCategorySelected) {
      // Desactivar todos los permisos de la categoría actual
      setSelectedPermissions((prev) =>
        prev.filter((k) => !activeCategoryKeys.includes(k)),
      );
    } else {
      // Activar todos los permisos de la categoría actual
      setSelectedPermissions((prev) => {
        const next = new Set([...prev, ...activeCategoryKeys]);
        return Array.from(next);
      });
    }
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
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? "100%" : "85vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* 4. Cabecera Fija */}
      <DialogTitle
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              letterSpacing: "-0.01em",
            }}
          >
            Gestionar Rol: {role?.name}
          </Typography>
          {isMobile && (
            <IconButton onClick={onClose} size="small" edge="end" aria-label="cerrar">
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        <TextField
          fullWidth
          size="small"
          label="Nombre del Rol"
          value={name}
          onChange={(e) => setName(e.target.value)}
          variant="outlined"
          sx={{ mt: 1.5 }}
        />

        {/* Selector de categoría en Móvil (xs/sm) */}
        {isMobile && (
          <FormControl fullWidth size="small" sx={{ mt: 1.5 }}>
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
                        color={count > 0 ? (count === catKeys.length ? "primary" : "default") : "default"}
                        variant={count === catKeys.length ? "filled" : "outlined"}
                        sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, ml: 1 }}
                      />
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        )}
      </DialogTitle>

      {/* 1. Layout Master-Detail */}
      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Columna Izquierda: Tabs Verticales (30% en Desktop, oculta en Móvil) */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            width: "30%",
            borderRight: "1px solid",
            borderColor: "divider",
            overflowY: "auto",
            bgcolor: (t) =>
              t.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "grey.50",
          }}
        >
          <Tabs
            orientation="vertical"
            value={tabIndex}
            onChange={(_, v) => setTabIndex(v)}
            sx={{
              "& .MuiTab-root": {
                alignItems: "stretch",
                textAlign: "left",
                py: 1.5,
                px: 2,
                minHeight: 48,
                textTransform: "none",
                transition: "all 0.15s ease",
                "&.Mui-selected": {
                  bgcolor: (t) =>
                    t.palette.mode === "dark"
                      ? "rgba(25, 118, 210, 0.15)"
                      : "primary.50",
                  color: "primary.main",
                  fontWeight: 700,
                },
                "&:hover": {
                  bgcolor: "action.hover",
                },
              },
              "& .MuiTabs-indicator": {
                right: 0,
                width: 3,
                borderRadius: "3px 0 0 3px",
              },
            }}
          >
            {categories.map((cat, i) => {
              const catKeys = visiblePermissions
                .filter((p) => p.key.startsWith(cat + ":"))
                .map((p) => p.key);
              const count = catKeys.filter((k) =>
                selectedPermissions.includes(k),
              ).length;
              const isSelected = tabIndex === i;

              return (
                <Tab
                  key={cat}
                  label={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: "0.85rem",
                          color: isSelected ? "primary.main" : "text.primary",
                        }}
                      >
                        {CATEGORY_LABELS[cat] || cat.toUpperCase()}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${count}/${catKeys.length}`}
                        color={count > 0 ? (count === catKeys.length ? "primary" : "default") : "default"}
                        variant={count === catKeys.length ? "filled" : "outlined"}
                        sx={{
                          height: 20,
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          ml: 1,
                          pointerEvents: "none",
                        }}
                      />
                    </Box>
                  }
                />
              );
            })}
          </Tabs>
        </Box>

        {/* Columna Derecha: Lista de Permisos (70% en Desktop, 100% en Móvil) */}
        <Box
          sx={{
            width: { xs: "100%", md: "70%" },
            p: { xs: 2, sm: 2.5 },
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* 3. Control Maestro (Bulk Action) */}
          {activeCategoryKeys.length > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.5,
                borderRadius: 2,
                bgcolor: (t) =>
                  t.palette.mode === "dark"
                    ? "rgba(255,255,255,0.04)"
                    : "grey.50",
                border: "1px solid",
                borderColor: "divider",
                mb: 2,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    color="primary"
                    checked={isAllCategorySelected}
                    onChange={handleToggleAllCategory}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Habilitar todos los permisos de{" "}
                    {CATEGORY_LABELS[activeCategory] || activeCategory.toUpperCase()}
                  </Typography>
                }
                sx={{ m: 0 }}
              />
              <Chip
                size="small"
                label={`${activeSelectedCount} de ${activeCategoryKeys.length}`}
                color={isAllCategorySelected ? "primary" : "default"}
                variant="outlined"
                sx={{ fontSize: "0.72rem", fontWeight: 700 }}
              />
            </Box>
          )}

          {/* 2. Micro-interacciones y Lista Moderna */}
          <List dense disablePadding sx={{ width: "100%" }}>
            {activeCategoryPerms.map((perm) => {
              const isChecked = selectedPermissions.includes(perm.key);
              return (
                <ListItemButton
                  key={perm.id || perm.key}
                  onClick={() => togglePermission(perm.key)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.75,
                    p: 1.25,
                    border: "1px solid",
                    borderColor: isChecked ? "primary.light" : "divider",
                    bgcolor: isChecked
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
                              ? "rgba(25, 118, 210, 0.18)"
                              : "rgba(25, 118, 210, 0.08)"
                        : "action.hover",
                      borderColor: isChecked ? "primary.main" : "primary.light",
                    },
                  }}
                >
                  <ListItemText
                    disableTypography
                    primary={
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "text.primary" }}
                      >
                        {perm.desc || perm.key}
                      </Typography>
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
                            borderColor: isChecked ? "primary.main" : "divider",
                            color: isChecked ? "primary.main" : "text.secondary",
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
      </DialogContent>

      {/* 4. Footer Fijo */}
      <DialogActions
        sx={{
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          Total permisos activos: {selectedPermissions.length}
        </Typography>

        <Stack direction="row" spacing={1.5}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
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
  { field: "name", headerName: "Nombre del Rol", flex: 1 },
  {
    field: "createdBy",
    headerName: "Creado Por",
    width: 180,
    valueGetter: (value: any) => value || "Sistema",
  },
  {
    field: "createdAt",
    headerName: "Creado En",
    width: 180,
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
  const { showError } = useNotification();

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
        onView={handleView}
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
        confirmButtonText="Eliminar Rol"
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

      <RoleEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        role={selectedRole}
        allPermissions={allPermissions}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </>
  );
}
