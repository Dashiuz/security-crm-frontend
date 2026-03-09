"use client";

import { useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import { GridColDef } from "@mui/x-data-grid";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";

const schema = z.object({
  key: z.string().min(1, "La clave es requerida").max(100),
  desc: z.string().max(255).optional(),
});

type PermissionForm = z.infer<typeof schema>;

const fields: FormField<PermissionForm>[] = [
  { name: "key", label: "Clave (ej. employee:read)", required: true },
  { name: "desc", label: "Descripción" },
];

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 220 },
  { field: "key", headerName: "Clave de Permiso", flex: 1 },
  { field: "desc", headerName: "Descripción", flex: 2 },
];

export default function PermissionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<
    PermissionForm | undefined
  >();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const { showError, showSuccess, showWarning } = useNotification();

  const handleCreate = () => {
    setSelectedId(null);
    setDefaultValues({ key: "", desc: "" });
    setDialogOpen(true);
  };

  const handleEdit = async (id: string, row?: any) => {
    try {
      const data = await HttpClient.get<any>(`/permission/${id}`);
      setSelectedId(id);
      setDefaultValues({ key: data.key, desc: data.desc || "" });
      setDialogOpen(true);
    } catch (error) {
      showError("Error al cargar los datos del permiso");
    }
  };

  const handleSubmit = async (data: PermissionForm) => {
    try {
      if (selectedId) {
        await HttpClient.patch(`/permission/${selectedId}`, data);
      } else {
        await HttpClient.post("/permission", data);
      }
      setRefreshTrigger((prev) => prev + 1);
      setDialogOpen(false); // Close dialog on successful submission
    } catch (error: any) {
      throw error;
    }
  };

  const handleOpenRoleAssign = async () => {
    try {
      const data = await HttpClient.get<any[]>("/role");
      setRoles(data.map((r) => ({ value: r.id, label: r.name })));
      setRoleDialogOpen(true);
    } catch (error) {
      showError("Error al cargar roles");
    }
  };

  const handleAssignToRole = async () => {
    if (!selectedRole || selectedPermissions.length === 0) {
      showWarning("Selecciona un rol y al menos un permiso");
      return;
    }

    try {
      await HttpClient.patch(`/role/${selectedRole}/permissions`, {
        add: selectedPermissions,
      });
      showSuccess("Permisos asignados exitosamente");
      setRoleDialogOpen(false);
      setSelectedPermissions([]);
    } catch (error: any) {
      showError(error.message || "Error al asignar permisos");
    }
  };

  return (
    <>
      <DataTable
        title="Gestión de Permisos"
        endpoint="/permission"
        columns={columns}
        breadcrumbs={[{ label: "Administrativo" }, { label: "Permisos" }]}
        onCreate={handleCreate}
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        checkboxSelection
        getRowId={(row) => row.key}
        onRowSelectionModelChange={(newSelection) => {
          // Mapping ID to key for the assignment
          // This is a bit tricky with DataTable as is, but we can manage.
          // For now, let's assume we use the keys if possible or fetch them.
          setSelectedPermissions(newSelection as string[]);
        }}
      />

      <div
        style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}
      >
        <button
          onClick={handleOpenRoleAssign}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Asignar Permisos Seleccionados a Rol
        </button>
      </div>

      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={selectedId ? "Editar Permiso" : "Crear Permiso"}
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
      />

      {/* Role Assignment Dialog */}
      <FormDialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        onSubmit={handleAssignToRole as any}
        title="Asignar Permisos a Rol"
        schema={z.object({ roleId: z.string().min(1) })}
        fields={[
          {
            name: "roleId",
            label: "Seleccionar Rol",
            type: "select",
            options: roles,
            required: true,
          },
        ]}
        onSubmitOverride={(data: any) => {
          setSelectedRole(data.roleId);
          handleAssignToRole();
        }}
      />
    </>
  );
}
