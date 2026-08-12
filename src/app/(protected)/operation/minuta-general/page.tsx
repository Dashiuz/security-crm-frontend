"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { useAuth } from "@/components/AuthContext";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import { GridColDef } from "@mui/x-data-grid";
import { Box, MenuItem, TextField } from "@mui/material";
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
  {
    field: "createdBy",
    headerName: "Creado Por",
    width: 160,
    valueGetter: (value: any) => value || "Sistema",
  },
];

export default function MinutaGeneralPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<MinutaForm | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const { showError } = useNotification();
  const { session } = useAuth();

  const isGlobalUser = !session?.user?.clientId;

  useEffect(() => {
    if (isGlobalUser) {
      HttpClient.get<any[]>("/client")
        .then((data) => setClients(data || []))
        .catch(() => {});
    }
  }, [isGlobalUser]);

  const permissions = session?.permissions || [];
  const canDelete =
    permissions.includes("godlike:manage") ||
    permissions.includes("minuta:manage") ||
    permissions.includes("minuta:delete");
  const canEdit =
    permissions.includes("godlike:manage") ||
    permissions.includes("minuta:manage") ||
    permissions.includes("minuta:update");
  const canCreate =
    permissions.includes("godlike:manage") ||
    permissions.includes("minuta:manage") ||
    permissions.includes("minuta:create");

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

  const handleDelete = async (id: string) => {
    try {
      await HttpClient.delete(`/operation/minuta/general/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al eliminar el registro");
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

  const endpoint = selectedClientId
    ? `/operation/minuta/general?clientId=${selectedClientId}`
    : "/operation/minuta/general";

  return (
    <>
      {isGlobalUser && (
        <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
          <TextField
            select
            size="small"
            label="Filtrar por Cliente / Conjunto"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            sx={{ minWidth: 300, bgcolor: "background.paper", borderRadius: 1 }}
          >
            <MenuItem value="">Todos los Clientes / Conjuntos</MenuItem>
            {clients.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} ({c.internalCode})
              </MenuItem>
            ))}
          </TextField>
        </Box>
      )}
      <DataTable
        title="Minuta General"
        endpoint={endpoint}
        columns={columns}
        breadcrumbs={[{ label: "Operaciones" }, { label: "Minuta General" }]}
        onCreate={canCreate ? handleCreate : undefined}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
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
