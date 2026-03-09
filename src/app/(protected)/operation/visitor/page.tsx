"use client";

import { useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import { GridColDef } from "@mui/x-data-grid";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";
import { formatTime } from "@/lib/formatters";

const schema = z.object({
  date: z.string().min(1, "La fecha es requerida"),
  time: z.string().min(1, "La hora es requerida"),
  occurredAt: z.string().min(1, "La fecha/hora es requerida"),
  visitorFullName: z.string().min(1, "El nombre del visitante es requerido"),
  visitorIdNumber: z.string().min(1, "El documento del visitante es requerido"),
  visitorIdType: z.string().optional().default("CC"),
  entryTime: z.string().min(1, "La hora de entrada es requerida"),
  authorizedByFullName: z.string().optional(),
  peopleCount: z.coerce.number().int().min(1).optional().default(1),
  mode: z.string().min(1, "El modo es requerido"),
  destination: z.string().optional(),
  observations: z.string().optional(),
});

type VisitorForm = z.infer<typeof schema>;

const fields: FormField<VisitorForm>[] = [
  { name: "date", label: "Fecha", type: "date", required: true },
  { name: "time", label: "Hora", type: "time", required: true },
  { name: "occurredAt", label: "Ocurrido En", hidden: true },
  { name: "visitorFullName", label: "Nombre Visitante", required: true },
  {
    name: "visitorIdType",
    label: "Tipo Documento",
    type: "select",
    options: [
      { value: "CC", label: "Cédula de Ciudadanía" },
      { value: "CE", label: "Cédula de Extranjería" },
      { value: "PAS", label: "Pasaporte" },
    ],
  },
  {
    name: "visitorIdNumber",
    label: "Número Documento Visitante",
    required: true,
  },
  { name: "entryTime", label: "Hora Entrada", type: "time", required: true },
  { name: "authorizedByFullName", label: "Autorizado Por" },
  { name: "peopleCount", label: "N° Personas", type: "number" },
  {
    name: "mode",
    label: "Modo",
    type: "select",
    options: [
      { value: "PEDESTRIAN", label: "Peatonal" },
      { value: "VEHICLE", label: "Vehicular" },
    ],
    required: true,
  },
  { name: "destination", label: "Destino (Apt/Oficina)" },
  { name: "observations", label: "Observaciones" },
];

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "visitorFullName", headerName: "Visitante", width: 220 },
  { field: "visitorIdNumber", headerName: "Documento", width: 130 },
  {
    field: "entryTime",
    headerName: "Entrada",
    width: 110,
    valueFormatter: (value: any) => formatTime(value),
  },
  {
    field: "exitTime",
    headerName: "Salida",
    width: 110,
    valueFormatter: (value: any) => formatTime(value),
  },
  { field: "mode", headerName: "Modo", width: 110 },
  { field: "destination", headerName: "Destino", width: 150 },
];

export default function VisitorPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<VisitorForm | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showError } = useNotification();

  const handleCreate = () => {
    setSelectedId(null);
    const now = new Date();
    setDefaultValues({
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().split(" ")[0],
      occurredAt: now.toISOString(),
      entryTime: now.toTimeString().split(" ")[0],
      visitorFullName: "",
      visitorIdNumber: "",
      visitorIdType: "CC",
      mode: "PEDESTRIAN",
      peopleCount: 1,
    } as any);
    setDialogOpen(true);
  };

  const handleEdit = async (id: string, row?: any) => {
    try {
      const data = await HttpClient.get<any>(`/operation/minuta/visitor/${id}`);
      setSelectedId(id);
      setDefaultValues(data);
      setDialogOpen(true);
    } catch (error) {
      showError("Error al cargar el registro de visitantes");
    }
  };

  const handleSubmit = async (data: VisitorForm) => {
    try {
      if (selectedId) {
        await HttpClient.patch(`/operation/minuta/visitor/${selectedId}`, data);
      } else {
        await HttpClient.post("/operation/minuta/visitor", data);
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <>
      <DataTable
        title="Control de Visitas"
        endpoint="/operation/minuta/visitor"
        columns={columns}
        breadcrumbs={[{ label: "Operaciones" }, { label: "Visitantes" }]}
        onCreate={handleCreate}
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        infoDescription="Gestión de acceso para personas externas a la organización, validando su identificación y destino."
        infoInstructions={`Solicita el documento de identidad al visitante para su registro.
Indica el lugar de destino o la persona a quien visita.
Recuerda registrar la salida del visitante una vez finalice su estadía.`}
      />
      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={
          selectedId
            ? "Actualizar Salida / Editar"
            : "Nuevo Ingreso de Visitante"
        }
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
      />
    </>
  );
}
