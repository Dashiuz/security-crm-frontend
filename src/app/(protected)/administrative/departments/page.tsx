"use client";

import { useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import { GridColDef } from "@mui/x-data-grid";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";

import ResponsiveDetailWrapper from "@/components/common/ResponsiveDetailWrapper";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import CsvImportDialog from "@/components/common/CsvImportDialog";
import { formatDateTime } from "@/lib/formatters";
import { Chip, Button, Box, Stack, Avatar, Typography, Paper, Grid } from "@mui/material";
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

      <ResponsiveDetailWrapper
        open={Boolean(detailDept)}
        onClose={() => setDetailDept(null)}
        title="Detalles del Departamento"
        actions={
          <Box display="flex" justifyContent="flex-end">
            <Button onClick={() => setDetailDept(null)} variant="outlined">
              Cerrar
            </Button>
          </Box>
        }
      >
        {detailDept && (
          <Box>
            <Box sx={{ bgcolor: 'background.default', p: 3, borderRadius: 2, mb: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontSize: "1.5rem", fontWeight: 700 }}>
                  {detailDept.name.substring(0, 2).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {detailDept.name}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
                    <Chip
                      size="small"
                      label={detailDept.isActive ? "Activo" : "Inactivo"}
                      color={detailDept.isActive ? "success" : "default"}
                      sx={{ ml: "0 !important" }}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Paper elevation={0} sx={{ bgcolor: 'background.default', borderRadius: 2, p: 3, height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Información de Registro
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Creado Por</Typography>
                      <Typography variant="body2">{detailDept.createdBy || "Sistema"}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Fecha de Creación</Typography>
                      <Typography variant="body2">{detailDept.createdAt ? formatDateTime(detailDept.createdAt) : "N/A"}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </ResponsiveDetailWrapper>

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
