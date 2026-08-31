"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { useAuth } from "@/components/AuthContext";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import { GridColDef } from "@mui/x-data-grid";
import { Box, MenuItem, TextField, Paper, FormControl, Select, Typography } from "@mui/material";
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
  { field: "plate", headerName: "Placa", width: 110 },
  { field: "parkingNumber", headerName: "Parqueadero", width: 120 },
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
  { field: "brand", headerName: "Marca", width: 120 },
  { field: "color", headerName: "Color", width: 100 },
  {
    field: "createdBy",
    headerName: "Creado Por",
    width: 160,
    valueGetter: (value: any) => value || "Sistema",
  },
];

export default function ParkingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<ParkingForm | undefined>();
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
      entryTime: now.toTimeString().split(" ")[0],
      parkingNumber: "",
      plate: "",
      brand: "",
      color: "",
      condition: "GOOD",
      observations: "",
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

  const handleDelete = async (id: string) => {
    try {
      await HttpClient.delete(`/operation/minuta/parking/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al eliminar el registro de parqueadero");
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

  const endpoint = selectedClientId
    ? `/operation/minuta/parking?clientId=${selectedClientId}`
    : "/operation/minuta/parking";

  return (
    <>
      {isGlobalUser && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 160 }}>
            Conjunto / Cliente Activo:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 280 }}>
            <Select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">Todos los Clientes / Conjuntos</MenuItem>
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} ({c.internalCode || c.nit})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      )}
      <DataTable
        title="Control de Parqueadero"
        endpoint={endpoint}
        columns={columns}
        breadcrumbs={[{ label: "Operaciones" }, { label: "Parqueadero" }]}
        onCreate={canCreate ? handleCreate : undefined}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
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
