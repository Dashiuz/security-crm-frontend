"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import {
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Tabs,
  Tab,
  Box,
  Divider,
  Alert,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";

// --- Schemas & Fields ---

const schema = z.object({
  document: z.string().min(1, "El documento es requerido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  roleIds: z
    .preprocess((val) => {
      if (!val || val === "") return [];
      if (Array.isArray(val)) return val;
      return [val];
    }, z.array(z.string()))
    .optional(),
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

type UserForm = z.infer<typeof schema>;
type ResetPasswordForm = z.infer<typeof resetSchema>;

const fields: FormField<UserForm>[] = [
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
    // We'll populate options dynamically in the component
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

// --- Consolidated Edit Dialog ---

interface UserEditDialogProps {
  open: boolean;
  onClose: () => void;
  user: any;
  allRoles: { id: string; name: string }[];
  onSuccess: () => void;
}

function UserEditDialog({
  open,
  onClose,
  user,
  allRoles,
  onSuccess,
}: UserEditDialogProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    if (open && user?.roles?.length > 0) {
      setSelectedRole(user.roles[0].id);
    } else {
      setSelectedRole("");
    }
    setTabIndex(0);
  }, [open, user]);

  const handleRoleUpdate = async () => {
    if (!selectedRole) return;
    try {
      await HttpClient.patch(`/users/${user.id}/roles`, {
        addRoleIds: [selectedRole],
        removeRoleIds: user.roles
          ?.filter((r: any) => r.id !== selectedRole)
          .map((r: any) => r.id),
      });
      showSuccess("Rol actualizado con éxito");
      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.message || "Error al actualizar el rol");
    }
  };

  const handlePasswordReset = async (data: ResetPasswordForm) => {
    try {
      await HttpClient.patch("/user/admin/reset-password", {
        document: user.document,
        newPassword: data.password,
      });
      showSuccess("Contraseña restablecida con éxito");
      onClose();
    } catch (error: any) {
      showError(error.message || "Error al restablecer la contraseña");
      throw error;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Gestionar Usuario: {user?.fullName}</DialogTitle>
      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        variant="fullWidth"
      >
        <Tab label="Información General" />
        <Tab label="Seguridad" />
      </Tabs>

      <Box sx={{ p: 3 }}>
        {tabIndex === 0 && (
          <Stack spacing={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Asigne el rol principal para este usuario. Esto determinará sus
              permisos en el sistema.
            </Typography>
            <TextField
              select
              fullWidth
              label="Rol del Usuario"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {allRoles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              onClick={handleRoleUpdate}
              disabled={!selectedRole}
              sx={{ alignSelf: "flex-end" }}
            >
              Actualizar Rol
            </Button>
          </Stack>
        )}

        {tabIndex === 1 && (
          <>
            <Alert severity="warning" sx={{ mb: 3 }}>
              Al restablecer la contraseña, se obligará al usuario a cambiarla
              en su próximo inicio de sesión.
            </Alert>
            <FormDialog
              open={true}
              onClose={onClose}
              onSubmit={handlePasswordReset}
              title=""
              schema={resetSchema}
              fields={resetFields}
              // We use FormDialog inside but we need it to just render the fields and button
              // This is a bit hacky, normally we'd refactor FormDialog to be more composable
              // or just implement the form here. For simplicity and consistency in style:
              onSubmitOverride={handlePasswordReset}
            />
          </>
        )}
      </Box>
      {tabIndex === 0 && (
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

// --- Main Page ---

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "fullName", headerName: "Nombre Completo", width: 220 },
  { field: "document", headerName: "Documento", width: 120 },
  {
    field: "roles",
    headerName: "Rol",
    width: 150,
    valueGetter: (value: any) =>
      value?.map((r: any) => r.name).join(", ") || "Sin Rol",
  },
  { field: "department", headerName: "Departamento", width: 150 },
  { field: "position", headerName: "Cargo", width: 150 },
  { field: "isActive", headerName: "Activo", type: "boolean", width: 90 },
];

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [allRoles, setAllRoles] = useState<{ id: string; name: string }[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showError } = useNotification();

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

  const handleSubmit = async (data: UserForm) => {
    try {
      await HttpClient.post("/user", data);
      setRefreshTrigger((prev) => prev + 1);
      setDialogOpen(false);
    } catch (error: any) {
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await HttpClient.delete(`/user/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al eliminar el usuario");
    }
  };

  return (
    <>
      <DataTable
        title="Gestión de Usuarios"
        endpoint="/user"
        columns={columns}
        breadcrumbs={[{ label: "Administrativo" }, { label: "Usuarios" }]}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        refreshTrigger={refreshTrigger}
        infoDescription="Gestión centralizada de los usuarios del sistema, permitiendo la creación de cuentas, asignación de roles y restablecimiento de contraseñas de seguridad."
        infoInstructions={`Para crear un usuario, el empleado debe existir previamente.
Haz clic en el icono de edición para cambiar el rol del usuario o restablecer su contraseña.
Recuerda que al restablecer la contraseña, se obligará al usuario a cambiarla en su próximo ingreso.`}
      />
      {/* Create User Dialog */}
      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title="Crear Usuario"
        schema={schema}
        fields={
          fields.map((f) =>
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
      {/* Consolidated Edit Dialog */}
      <UserEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        user={selectedUser}
        allRoles={allRoles}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </>
  );
}
