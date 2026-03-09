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
  level: z.coerce.number().int().min(1).optional().default(1),
  isActive: z.boolean().optional().default(true),
});

type PositionForm = z.infer<typeof schema>;

const fields: FormField<PositionForm>[] = [
  { name: "name", label: "Nombre de la Posición/Cargo", required: true },
  { name: "level", label: "Nivel (Numérico)", type: "number" },
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
  { field: "name", headerName: "Cargo", flex: 1 },
  { field: "level", headerName: "Nivel", width: 100 },
  { field: "isActive", headerName: "Activo", type: "boolean", width: 100 },
];

export default function PositionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<
    PositionForm | undefined
  >();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showError } = useNotification();

  const handleCreate = () => {
    setSelectedId(null);
    setDefaultValues({ name: "", level: 1, isActive: true });
    setDialogOpen(true);
  };

  const handleEdit = async (id: string, row?: any) => {
    setLoading(true);
    try {
      const data = await HttpClient.get<any>(`/position/${id}`);
      setSelectedId(id);
      setDefaultValues({
        name: data.name,
        level: data.level || 1,
        isActive: data.isActive,
      });
      setDialogOpen(true);
    } catch (error) {
      showError("Error al cargar los datos del cargo");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: PositionForm) => {
    const payload = {
      ...data,
      isActive: String(data.isActive) === "true",
    };

    try {
      if (selectedId) {
        await HttpClient.patch(`/position/${selectedId}`, payload);
      } else {
        await HttpClient.post("/position", payload);
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <>
      <DataTable
        title="Posiciones / Cargos"
        endpoint="/position"
        columns={columns}
        breadcrumbs={[{ label: "Administrativo" }, { label: "Posiciones" }]}
        onCreate={handleCreate}
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        infoDescription="Administración de los cargos laborales definidos en la organización."
        infoInstructions={`Asigna un nombre descriptivo a cada cargo para facilitar la clasificación de los empleados.
Asegúrate de que el cargo esté activo para poder seleccionarlo en el registro de empleados.`}
      />
      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={selectedId ? "Editar Cargo" : "Crear Cargo"}
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
        loading={loading}
      />
    </>
  );
}
