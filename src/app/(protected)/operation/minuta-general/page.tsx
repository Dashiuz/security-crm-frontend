"use client";

import { useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import { GridColDef } from "@mui/x-data-grid";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";
import { formatDate, formatTime } from "@/lib/formatters";

const schema = z.object({
  date: z.string().min(1, "La fecha es requerida"),
  time: z.string().min(1, "La hora es requerida"),
  occurredAt: z.string().min(1, "La fecha/hora de ocurrencia es requerida"),
  annotation: z.string().min(1, "La anotación es requerida"),
  category: z.string().optional().default("GENERAL"),
  priority: z.coerce.number().int().min(1).max(5).optional().default(3),
  isConfidential: z.boolean().optional().default(false),
});

type MinutaForm = z.infer<typeof schema>;

const fields: FormField<MinutaForm>[] = [
  { name: "date", label: "Fecha", type: "date", required: true },
  { name: "time", label: "Hora", type: "time", required: true },
  { name: "occurredAt", label: "Ocurrido En", hidden: true },
  { name: "annotation", label: "Anotación / Novedad", required: true },
  { name: "category", label: "Categoría" },
  {
    name: "priority",
    label: "Prioridad (1-5)",
    type: "number",
    inputProps: { min: 1, max: 5 },
  },
  {
    name: "isConfidential",
    label: "Confidencial",
    type: "select",
    options: [
      { value: "true", label: "Sí" },
      { value: "false", label: "No" },
    ],
  },
];

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  {
    field: "date",
    headerName: "Fecha",
    width: 120,
    valueFormatter: (value: any) => formatDate(value),
  },
  {
    field: "time",
    headerName: "Hora",
    width: 110,
    valueFormatter: (value: any) => formatTime(value),
  },
  { field: "annotation", headerName: "Anotación", flex: 1 },
  { field: "category", headerName: "Categoría", width: 120 },
  { field: "priority", headerName: "Prioridad", width: 90 },
];

export default function MinutaGeneralPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<MinutaForm | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showError } = useNotification();

  const handleCreate = () => {
    setSelectedId(null);
    const now = new Date();
    setDefaultValues({
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().split(" ")[0],
      occurredAt: now.toISOString(),
      annotation: "",
      category: "GENERAL",
      priority: 3,
      isConfidential: false,
    });
    setDialogOpen(true);
  };

  const handleEdit = async (id: string, row?: any) => {
    try {
      const data = await HttpClient.get<any>(`/operation/minuta/general/${id}`);
      setSelectedId(id);
      setDefaultValues({
        ...data,
        isConfidential: !!data.isConfidential,
      });
      setDialogOpen(true);
    } catch (error) {
      showError("Error al cargar la minuta");
    }
  };

  const handleSubmit = async (data: MinutaForm) => {
    try {
      if (selectedId) {
        await HttpClient.patch(`/operation/minuta/general/${selectedId}`, data);
      } else {
        await HttpClient.post("/operation/minuta/general", data);
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <>
      <DataTable
        title="Minuta General"
        endpoint="/operation/minuta/general"
        columns={columns}
        breadcrumbs={[{ label: "Operaciones" }, { label: "Minuta General" }]}
        onCreate={handleCreate}
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        infoDescription="Registro cronológico y detallado de todas las novedades, incidentes y actividades relevantes ocurridas durante el turno de seguridad."
        infoInstructions={`Registra cada novedad con su nivel de prioridad (1-5) y una descripción clara.
Utiliza el campo de fecha y hora del sistema para asegurar la trazabilidad del evento.
Puedes editar registros para ampliar información si es necesario.`}
      />
      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={selectedId ? "Editar Minuta" : "Crear Registro de Minuta"}
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
      />
    </>
  );
}
