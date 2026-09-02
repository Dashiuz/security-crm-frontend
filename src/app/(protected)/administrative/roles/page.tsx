"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import DetailDialog from "@/components/common/DetailDialog";
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
  Checkbox,
  FormGroup,
  TextField,
  Divider,
  Chip,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";
import { useAuth } from "@/components/AuthContext";

// --- Role Edit Dialog (Consolidated) ---

interface RoleEditDialogProps {
  open: boolean;
  onClose: () => void;
  role: any;
  allPermissions: any[];
  onSuccess: () => void;
}

function RoleEditDialog({
  open,
  onClose,
  role,
  allPermissions,
  onSuccess,
}: RoleEditDialogProps) {
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
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
      // Role details might need full permissions fetch
      HttpClient.get<any>(`/role/${role.id}`).then((data) => {
        setSelectedPermissions(data.permissions?.map((p: any) => p.key) || []);
      });
    } else {
      setName("");
      setSelectedPermissions([]);
    }
  }, [open, role]);

  const categoryOrder: Record<string, number> = {
    client: 1,
    resident: 2,
    employee: 3,
    user: 4,
    minuta: 5,
    department: 6,
    position: 7,
    role: 8,
    permission: 9,
    godlike: 10,
  };

  const categories = Array.from(
    new Set(visiblePermissions.map((p) => p.key.split(":")[0])),
  ).sort((a, b) => (categoryOrder[a] || 99) - (categoryOrder[b] || 99));

  useEffect(() => {
    if (tabIndex >= categories.length && categories.length > 0) {
      setTabIndex(0);
    }
  }, [categories.length, tabIndex]);

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSave = async () => {
    try {
      // 1. Update Name (if changed)
      if (name !== role.name) {
        await HttpClient.patch(`/role/${role.id}`, { name });
      }
      // 2. Update Permissions (Full Sync using 'keys')
      await HttpClient.patch(`/role/${role.id}/permissions`, {
        keys: selectedPermissions,
      });
      showSuccess("Rol actualizado correctamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.message || "Error al actualizar el rol");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Gestionar Rol: {role?.name}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Nombre del Rol"
            value={name}
            onChange={(e) => setName(e.target.value)}
            variant="outlined"
          />

          <Divider />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Permisos del Rol
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Seleccione los permisos que desea asignar a este rol, organizados
              por categoría.
            </Typography>

            <Tabs
              value={tabIndex}
              onChange={(_, v) => setTabIndex(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
            >
              {categories.map((cat, i) => {
                const categoryLabels: Record<string, string> = {
                  client: "CLIENTES",
                  resident: "RESIDENTES",
                  user: "USUARIOS",
                  employee: "EMPLEADOS",
                  department: "DEPARTAMENTOS",
                  position: "POSICIONES",
                  role: "ROLES",
                  permission: "PERMISOS",
                  minuta: "MINUTA",
                  godlike: "GODLIKE",
                };
                return (
                  <Tab
                    key={i}
                    label={categoryLabels[cat] || cat.toUpperCase()}
                  />
                );
              })}
            </Tabs>

            <Box sx={{ minHeight: 200 }}>
              <FormGroup row>
                {visiblePermissions
                  .filter((p) => p.key.startsWith(categories[tabIndex] + ":"))
                  .map((perm) => (
                    <FormControlLabel
                      key={perm.id}
                      control={
                        <Checkbox
                          checked={selectedPermissions.includes(perm.key)}
                          onChange={() => togglePermission(perm.key)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {perm.desc || perm.key}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {perm.key}
                          </Typography>
                        </Box>
                      }
                      sx={{ width: "45%", mb: 1 }}
                    />
                  ))}
              </FormGroup>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Guardar Cambios
        </Button>
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

      <DetailDialog
        open={Boolean(detailRole)}
        onClose={() => setDetailRole(null)}
        title="Detalles del Rol"
        fields={
          detailRole
            ? [
                { label: "Nombre del Rol", value: detailRole.name },
                { label: "Creado Por", value: detailRole.createdBy || "Sistema" },
                {
                  label: "Creado En",
                  value: detailRole.createdAt
                    ? formatDateTime(detailRole.createdAt)
                    : "N/A",
                },
                {
                  label: "Permisos Asignados",
                  value:
                    detailRole.permissions && detailRole.permissions.length > 0
                      ? detailRole.permissions.map((p: any) => p.key).join(", ")
                      : "Sin Permisos",
                },
              ]
            : []
        }
      />

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
