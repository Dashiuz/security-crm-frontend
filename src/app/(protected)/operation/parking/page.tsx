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
  entryTime: z.string().min(1, "La hora de entrada es requerida"),
  parkingNumber: z.string().min(1, "El número de parqueadero es requerido"),
  plate: z.string().min(1, "La placa es requerida"),
  brand: z.string().optional(),
  color: z.string().optional(),
  condition: z.string().optional().default("GOOD"),
  observations: z.string().optional(),
});

type ParkingForm = z.infer<typeof schema>;

const fields: FormField<ParkingForm>[] = [
  { name: "date", label: "Fecha", type: "date", required: true },
  { name: "time", label: "Hora", type: "time", required: true },
  { name: "occurredAt", label: "Ocurrido En", hidden: true },
  { name: "entryTime", label: "Hora Entrada", type: "time", required: true },
  { name: "parkingNumber", label: "N° Parqueadero", required: true },
  { name: "plate", label: "Placa Vehículo", required: true },
  { name: "brand", label: "Marca" },
  { name: "color", label: "Color" },
  {
    name: "condition",
    label: "Estado",
    type: "select",
    options: [
      { value: "GOOD", label: "Bueno" },
      { value: "BAD", label: "Malo" },
    ],
  },
  { name: "observations", label: "Observaciones" },
];

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "plate", headerName: "Placa", width: 100 },
  { field: "parkingNumber", headerName: "N° Parqueadero", width: 130 },
  {
    field: "entryTime",
    headerName: "Hora Entrada",
    width: 120,
    valueFormatter: (value: any) => formatTime(value),
  },
  {
    field: "exitTime",
    headerName: "Hora Salida",
    width: 120,
    valueFormatter: (value: any) => formatTime(value),
  },
  { field: "condition", headerName: "Estado", width: 100 },
];

export default function ParkingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<ParkingForm | undefined>();
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
      parkingNumber: "",
      plate: "",
      condition: "GOOD",
    } as any);
    setDialogOpen(true);
  };

  const handleEdit = async (id: string, row?: any) => {
    try {
      const data = await HttpClient.get<any>(`/operation/minuta/parking/${id}`);
      setSelectedId(id);
      setDefaultValues(data);
      setDialogOpen(true);
    } catch (error) {
      showError("Error al cargar el registro de parqueadero");
    }
  };

  const handleSubmit = async (data: ParkingForm) => {
    try {
      if (selectedId) {
        await HttpClient.patch(`/operation/minuta/parking/${selectedId}`, data);
      } else {
        await HttpClient.post("/operation/minuta/parking", data);
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <>
      <DataTable
        title="Control de Parqueadero"
        endpoint="/operation/minuta/parking"
        columns={columns}
        breadcrumbs={[{ label: "Operaciones" }, { label: "Parqueadero" }]}
        onCreate={handleCreate}
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        infoDescription="Sistema de control para el ingreso y salida de vehículos, asegurando el monitoreo de placas y tiempos de permanencia."
        infoInstructions={`Registra la placa del vehículo y selecciona el tipo (Residente, Visitante, etc.).
Asegúrate de marcar el estado 'ENTRADA' al ingresar y 'SALIDA' al retirar el vehículo.
El sistema mantendrá el historial de movimientos para auditoría.`}
      />
      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={
          selectedId
            ? "Actualizar Salida / Editar"
            : "Nuevo Ingreso a Parqueadero"
        }
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
      />
    </>
  );
}
