"use client";

import { useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import { GridColDef } from "@mui/x-data-grid";
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
  { field: "destination", headerName: "Destino", width: 130 },
  { field: "sender", headerName: "Remitente", width: 150 },
  { field: "courierCompany", headerName: "Empresa", width: 130 },
  { field: "status", headerName: "Estado", width: 120 },
  {
    field: "receivedTime",
    headerName: "Recibido",
    width: 120,
    valueFormatter: (value: any) => formatTime(value),
  },
  {
    field: "deliveredAt",
    headerName: "Entregado",
    width: 180,
    valueFormatter: (value: any) => formatDateTime(value),
  },
];

export default function CorrespondencePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<
    CorrespondenceForm | undefined
  >();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showError } = useNotification();

  const handleCreate = () => {
    setSelectedId(null);
    const now = new Date();
    setDefaultValues({
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().split(" ")[0],
      occurredAt: now.toISOString(),
      receivedTime: now.toTimeString().split(" ")[0],
      destination: "",
      correspondenceType: "BOX",
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
      showError("Error al cargar el registro de domicilio");
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

  return (
    <>
      <DataTable
        title="Control de Domicilios y Correspondencia"
        endpoint="/operation/minuta/correspondence"
        columns={columns}
        breadcrumbs={[{ label: "Operaciones" }, { label: "Correspondencia" }]}
        onCreate={handleCreate}
        onEdit={handleEdit}
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
