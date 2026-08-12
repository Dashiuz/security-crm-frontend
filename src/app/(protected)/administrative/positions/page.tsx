"use client";

import { useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import { GridColDef } from "@mui/x-data-grid";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";

import DetailDialog from "@/components/common/DetailDialog";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import { formatDateTime } from "@/lib/formatters";
import { Chip } from "@mui/material";

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
  { field: "name", headerName: "Cargo", flex: 1 },
  { field: "level", headerName: "Nivel", width: 90 },
  { field: "isActive", headerName: "Activo", type: "boolean", width: 90 },
  {
    field: "createdBy",
    headerName: "Creado Por",
    width: 180,
    valueGetter: (value: any) => value || "Sistema",
  },
  {
    field: "createdAt",
    headerName: "Creado En",
    width: 180,
    valueFormatter: (value: any) => (value ? formatDateTime(value) : "N/A"),
  },
];

export default function PositionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailPos, setDetailPos] = useState<any | null>(null);
  const [deletePos, setDeletePos] = useState<any | null>(null);
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

  const handleView = (row: any) => {
    setDetailPos(row);
  };

  const handleDeleteRequest = (id: string) => {
    HttpClient.get<any[]>("/position").then((posts) => {
      const target = posts.find((p) => p.id === id);
      if (target) setDeletePos(target);
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletePos) return;
    try {
      await HttpClient.delete(`/position/${deletePos.id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al inhabilitar el cargo");
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
        onDelete={handleDeleteRequest}
        onView={handleView}
        refreshTrigger={refreshTrigger}
        infoDescription="Administración de los cargos laborales definidos en la organización."
        infoInstructions={`Asigna un nombre descriptivo a cada cargo para facilitar la clasificación de los empleados.
Haz clic en el icono de ojo para ver quién creó el registro.
Para inhabilitar un cargo, confirma ingresando su nombre exacto.`}
      />

      <DetailDialog
        open={Boolean(detailPos)}
        onClose={() => setDetailPos(null)}
        title="Detalles del Cargo / Posición"
        fields={
          detailPos
            ? [
                { label: "Cargo / Posición", value: detailPos.name },
                { label: "NivelJerárquico", value: detailPos.level ?? 1 },
                {
                  label: "Estado",
                  value: (
                    <Chip
                      label={detailPos.isActive ? "Activo" : "Inactivo"}
                      color={detailPos.isActive ? "success" : "default"}
                      size="small"
                    />
                  ),
                },
                { label: "Creado Por", value: detailPos.createdBy || "Sistema" },
                {
                  label: "Creado En",
                  value: detailPos.createdAt
                    ? formatDateTime(detailPos.createdAt)
                    : "N/A",
                },
              ]
            : []
        }
      />

      <PromptConfirmDialog
        open={Boolean(deletePos)}
        onClose={() => setDeletePos(null)}
        onConfirm={handleConfirmDelete}
        title="Inhabilitar / Eliminar Cargo"
        description={`Para confirmar la inactivación del cargo "${deletePos?.name}", por favor ingrese su nombre exacto:`}
        expectedValue={deletePos?.name || ""}
        inputLabel="Nombre del Cargo"
        confirmButtonText="Confirmar Inactivación"
        confirmColor="error"
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
