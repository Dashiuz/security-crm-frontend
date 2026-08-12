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
import { formatDate, formatTime, formatDateTime } from "@/lib/formatters";

const schema = z.object({
  date: z.string().min(1, "La fecha es requerida"),
  time: z.string().min(1, "La hora es requerida"),
  occurredAt: z.string().min(1, "La fecha/hora es requerida"),
  receivedTime: z.string().min(1, "La hora de recepción es requerida"),
  destination: z.string().min(1, "El destino es requerido"),
  sender: z.string().optional(),
  courierCompany: z.string().optional(),
  trackingNumber: z.string().optional(),
  correspondenceType: z.string().min(1, "El tipo es requerido"),
  observations: z.string().optional(),
});

type CorrespondenceForm = z.infer<typeof schema>;

const fields: FormField<CorrespondenceForm>[] = [
  { name: "date", label: "Fecha", type: "date", required: true },
  { name: "time", label: "Hora", type: "time", required: true },
  { name: "occurredAt", label: "Ocurrido En", hidden: true },
  {
    name: "receivedTime",
    label: "Hora Recibido",
    type: "time",
    required: true,
  },
  { name: "destination", label: "Destino (Apt/Oficina)", required: true },
  { name: "sender", label: "Remitente" },
  { name: "courierCompany", label: "Empresa Mensajería" },
  { name: "trackingNumber", label: "N° Guía" },
  {
    name: "correspondenceType",
    label: "Tipo",
    type: "select",
    options: [
      { value: "ENVELOPE", label: "Sobre / Carta" },
      { value: "BOX", label: "Paquete" },
      { value: "OTHER", label: "Comunicado / Otro" },
    ],
    required: true,
  },
  { name: "observations", label: "Observaciones" },
];

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  {
    field: "date",
    headerName: "Fecha",
    width: 110,
    valueFormatter: (value: any) => formatDate(value),
  },
  {
    field: "receivedTime",
    headerName: "Recibido",
    width: 90,
    valueFormatter: (value: any) => formatTime(value),
  },
  { field: "destination", headerName: "Destino", width: 130 },
  { field: "correspondenceType", headerName: "Tipo", width: 120 },
  { field: "courierCompany", headerName: "Mensajería", width: 140 },
  { field: "status", headerName: "Estado", width: 110 },
  {
    field: "createdBy",
    headerName: "Creado Por",
    width: 160,
    valueGetter: (value: any) => value || "Sistema",
  },
];

export default function CorrespondencePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<
    CorrespondenceForm | undefined
  >();
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
      receivedTime: now.toTimeString().split(" ")[0],
      destination: "",
      sender: "",
      courierCompany: "",
      trackingNumber: "",
      correspondenceType: "ENVELOPE",
      observations: "",
    } as any);
    setDialogOpen(true);
  };

  const handleEdit = async (id: string, row?: any) => {
    try {
      const data = await HttpClient.get<any>(
        `/operation/minuta/correspondence/${id}`,
      );
      setSelectedId(id);
      setDefaultValues(data);
      setDialogOpen(true);
    } catch (error) {
      showError("Error al cargar la correspondencia");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await HttpClient.delete(`/operation/minuta/correspondence/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al eliminar el registro");
    }
  };

  const handleSubmit = async (data: CorrespondenceForm) => {
    try {
      if (selectedId) {
        await HttpClient.patch(
          `/operation/minuta/correspondence/${selectedId}`,
          data,
        );
      } else {
        await HttpClient.post("/operation/minuta/correspondence", data);
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      throw error;
    }
  };

  const endpoint = selectedClientId
    ? `/operation/minuta/correspondence?clientId=${selectedClientId}`
    : "/operation/minuta/correspondence";

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
        title="Control de Domicilios y Correspondencia"
        endpoint={endpoint}
        columns={columns}
        breadcrumbs={[{ label: "Operaciones" }, { label: "Correspondencia" }]}
        onCreate={canCreate ? handleCreate : undefined}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        refreshTrigger={refreshTrigger}
        infoDescription="Seguimiento de paquetes, sobres y domicilios recibidos en la recepción para su posterior entrega."
        infoInstructions={`Registra el nombre del destinatario y el tipo de paquete recibido.
Indica la empresa de mensajería o el nombre del domiciliario.
Marca el paquete como 'ENTREGADO' una vez el destinatario final lo recoja.`}
      />
      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={
          selectedId
            ? "Gestionar Entrega / Editar"
            : "Nuevo Ingreso de Correspondencia"
        }
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
      />
    </>
  );
}
