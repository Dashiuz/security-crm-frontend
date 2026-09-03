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
  isActive: z.boolean().optional().default(true),
});

type DepartmentForm = z.infer<typeof schema>;

const fields: FormField<DepartmentForm>[] = [
  { name: "name", label: "Nombre del Departamento", required: true },
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
  { field: "name", headerName: "Nombre", flex: 1 },
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

export default function DepartmentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailDept, setDetailDept] = useState<any | null>(null);
  const [deleteDept, setDeleteDept] = useState<any | null>(null);
  const [defaultValues, setDefaultValues] = useState<
    DepartmentForm | undefined
  >();
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useNotification();

  const handleCreate = () => {
    setSelectedId(null);
    setDefaultValues({ name: "", isActive: true });
    setDialogOpen(true);
  };

  const handleEdit = async (id: string, row?: any) => {
    setLoading(true);
    try {
      const data = await HttpClient.get<any>(`/department/${id}`);
      setSelectedId(id);
      setDefaultValues({
        name: data.name,
        isActive: data.isActive,
      });
      setDialogOpen(true);
    } catch (error) {
      showError("Error al cargar los datos del departamento");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (row: any) => {
    setDetailDept(row);
  };

  const handleDeleteRequest = (id: string) => {
    HttpClient.get<any[]>("/department").then((depts) => {
      const target = depts.find((d) => d.id === id);
      if (target) setDeleteDept(target);
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDept) return;
    try {
      await HttpClient.delete(`/department/${deleteDept.id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al inhabilitar el departamento");
    }
  };

  const handleSubmit = async (data: DepartmentForm) => {
    try {
      if (selectedId) {
        await HttpClient.patch(`/department/${selectedId}`, data);
      } else {
        await HttpClient.post("/department", data);
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
      }>("/department/import/csv", {
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
        title="Departamentos"
        endpoint="/department"
        columns={columns}
        breadcrumbs={[{ label: "Administrativo" }, { label: "Departamentos" }]}
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
        infoDescription="Organización de las unidades estructurales de la empresa (ej. Operaciones, Recursos Humanos, Seguridad)."
        infoInstructions={`Crea un departamento asignándole un nombre y estado.
Haz clic en el icono de ojo para consultar el creador y fecha de registro.
Para inhabilitar un departamento, confirma ingresando su nombre exacto.`}
      />

      <DetailDialog
        open={Boolean(detailDept)}
        onClose={() => setDetailDept(null)}
        title="Detalles del Departamento"
        fields={
          detailDept
            ? [
                { label: "Nombre", value: detailDept.name },
                {
                  label: "Estado",
                  value: (
                    <Chip
                      label={detailDept.isActive ? "Activo" : "Inactivo"}
                      color={detailDept.isActive ? "success" : "default"}
                      size="small"
                    />
                  ),
                },
                { label: "Creado Por", value: detailDept.createdBy || "Sistema" },
                {
                  label: "Creado En",
                  value: detailDept.createdAt
                    ? formatDateTime(detailDept.createdAt)
                    : "N/A",
                },
              ]
            : []
        }
      />

      <PromptConfirmDialog
        open={Boolean(deleteDept)}
        onClose={() => setDeleteDept(null)}
        onConfirm={handleConfirmDelete}
        title="Inhabilitar / Eliminar Departamento"
        description={`Para confirmar la inactivación del departamento "${deleteDept?.name}", por favor ingrese su nombre exacto:`}
        expectedValue={deleteDept?.name || ""}
        inputLabel="Nombre del Departamento"
        confirmButtonText="Confirmar Inactivación"
        confirmColor="error"
      />

      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={selectedId ? "Editar Departamento" : "Crear Departamento"}
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
        loading={loading}
      />

      <CsvImportDialog
        open={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        title="Importar Departamentos"
        templateColumns={["Nombre", "EstadoActivo"]}
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
