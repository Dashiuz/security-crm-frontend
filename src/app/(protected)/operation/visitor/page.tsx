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
  occurredAt: z.string().min(1, "La fecha/hora es requerida"),
  entryTime: z.string().min(1, "La hora de ingreso es requerida"),
  exitTime: z.string().optional().nullable(),
  visitorName: z.string().min(1, "El nombre del visitante es requerido"),
  visitorDocument: z.string().min(1, "El documento es requerido"),
  visitorCompany: z.string().optional().nullable(),
  vehiclePlate: z.string().optional().nullable(),
  vehicleType: z.string().optional().nullable(),
  badgeNumber: z.string().optional().nullable(),
  destinationInterior: z.string().optional().nullable(),
  destinationApartment: z.string().optional().nullable(),
  hostName: z.string().optional().nullable(),
  entryAuthorizedBy: z.string().optional().nullable(),
  observation: z.string().optional().nullable(),
});

type VisitorForm = z.infer<typeof schema>;

const fields: FormField<VisitorForm>[] = [
  { name: "date", label: "Fecha", type: "date", required: true },
  { name: "time", label: "Hora Registro", type: "time", required: true },
  { name: "occurredAt", label: "Ocurrido En", hidden: true },
  { name: "entryTime", label: "Hora Ingreso", type: "time", required: true },
  { name: "exitTime", label: "Hora Salida", type: "time" },
  { name: "visitorName", label: "Nombre Visitante", required: true },
  { name: "visitorDocument", label: "Documento Visitante", required: true },
  { name: "visitorCompany", label: "Empresa Visitante" },
  { name: "badgeNumber", label: "Número Ficha / Gafete" },
  { name: "destinationInterior", label: "Interior / Torre" },
  { name: "destinationApartment", label: "Apto / Casa / Oficina" },
  { name: "hostName", label: "Persona A Visitar" },
  { name: "entryAuthorizedBy", label: "Autorizado Por" },
  { name: "vehicleType", label: "Tipo Vehículo" },
  { name: "vehiclePlate", label: "Placa Vehículo" },
  { name: "observation", label: "Observaciones" },
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
    field: "entryTime",
    headerName: "Ingreso",
    width: 90,
    valueFormatter: (value: any) => formatTime(value),
  },
  {
    field: "exitTime",
    headerName: "Salida",
    width: 90,
    valueFormatter: (value: any) => (value ? formatTime(value) : "En sitio"),
  },
  { field: "visitorName", headerName: "Visitante", width: 180 },
  { field: "visitorDocument", headerName: "Documento", width: 120 },
  { field: "destinationApartment", headerName: "Destino", width: 110 },
  { field: "vehiclePlate", headerName: "Placa", width: 100 },
  {
    field: "createdBy",
    headerName: "Creado Por",
    width: 160,
    valueGetter: (value: any) => value || "Sistema",
  },
];

export default function VisitorControlPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<VisitorForm | undefined>();
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
    const currentTime = now.toTimeString().split(" ")[0];
    setDefaultValues({
      date: now.toISOString().split("T")[0],
      time: currentTime,
      occurredAt: now.toISOString(),
      entryTime: currentTime,
      exitTime: "",
      visitorName: "",
      visitorDocument: "",
      visitorCompany: "",
      vehiclePlate: "",
      vehicleType: "",
      badgeNumber: "",
      destinationInterior: "",
      destinationApartment: "",
      hostName: "",
      entryAuthorizedBy: "",
      observation: "",
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

  const handleDelete = async (id: string) => {
    try {
      await HttpClient.delete(`/operation/minuta/visitor/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al eliminar el registro de visitante");
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
        onCreate={canCreate ? handleCreate : undefined}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
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
