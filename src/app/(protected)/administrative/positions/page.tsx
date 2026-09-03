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
import CsvImportDialog from "@/components/common/CsvImportDialog";
import { formatDateTime } from "@/lib/formatters";
import { Chip, Button } from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";

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
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useNotification();

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

  const handleImport = async (data: Array<Record<string, string>>, fileName: string) => {
    try {
      const response = await HttpClient.post<{
        status: string;
        totalRows: number;
        successRows: number;
        errorRows: number;
        errors?: Array<{ row: number; reason: string }>;
      }>("/position/import/csv", {
        data,
        fileName,
      });
      return response;
    } catch (error: any) {
      showError(error.message || "Error al importar el archivo CSV.");
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
        extraHeaderActions={
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloudUploadIcon />}
            onClick={() => setCsvImportOpen(true)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.85rem" },
              py: { xs: 0.75, sm: 0.65 },
              px: { xs: 1.8, sm: 2.2 },
              borderRadius: 2,
              whiteSpace: "nowrap",
            }}
          >
            Cargar CSV
          </Button>
        }
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

      <CsvImportDialog
        open={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        title="Importar Posiciones / Cargos"
        templateColumns={["Nombre", "Nivel", "EstadoActivo"]}
        onImport={handleImport}
        onSuccessRedirect={(result) => {
          setCsvImportOpen(false);
          setRefreshTrigger((prev) => prev + 1);
          if (result?.status === 'SUCCESS') {
            showSuccess("Importación masiva completada con éxito");
          } else if (result?.status === 'PARTIAL') {
            showSuccess("Importación masiva completada parcialmente. Revisa las advertencias.");
          }
        }}
      />
    </>
  );
}
