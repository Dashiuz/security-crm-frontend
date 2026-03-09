"use client";

import { useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import { GridColDef } from "@mui/x-data-grid";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  isActive: z.boolean().optional().default(true),
});

type DepartmentForm = z.infer<typeof schema>;

const fields: FormField<DepartmentForm>[] = [
  { name: "name", label: "Nombre del Departamento", required: true },
  {
    name: "isActive",
    label: "Estado",
    type: "select",
    options: [
      { value: "true", label: "Activo" },
      { value: "false", label: "Inactivo" },
    ],
  },
];

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 220 },
  { field: "name", headerName: "Nombre", flex: 1 },
  { field: "isActive", headerName: "Activo", type: "boolean", width: 100 },
  { field: "createdAt", headerName: "Creado En", width: 180 },
];

export default function DepartmentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<
    DepartmentForm | undefined
  >();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showError } = useNotification();

  const handleCreate = () => {
    setSelectedId(null);
    setDefaultValues({ name: "", isActive: true });
    setDialogOpen(true);
  };

  const handleEdit = async (id: string, row?: any) => {
    setLoading(true);
    try {
      const data = await HttpClient.get<any>(`/department/${id}`);
      setSelectedId(id);
      setDefaultValues({
        name: data.name,
        isActive: data.isActive,
      });
      setDialogOpen(true);
    } catch (error) {
      showError("Error al cargar los datos del departamento");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: DepartmentForm) => {
    try {
      if (selectedId) {
        await HttpClient.patch(`/department/${selectedId}`, data);
      } else {
        await HttpClient.post("/department", data);
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <>
      <DataTable
        title="Departamentos"
        endpoint="/department"
        columns={columns}
        breadcrumbs={[{ label: "Administrativo" }, { label: "Departamentos" }]}
        onCreate={handleCreate}
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        infoDescription="Organización de las unidades estructurales de la empresa (ej. Operaciones, Recursos Humanos, Seguridad)."
        infoInstructions={`Crea un departamento asignándole un nombre y estado.
El estado determina si el departamento está disponible para vincular nuevos empleados.
Cualquier cambio se reflejará automáticamente en los formularios de gestión de personal.`}
      />
      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={selectedId ? "Editar Departamento" : "Crear Departamento"}
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
        loading={loading}
      />
    </>
  );
}
