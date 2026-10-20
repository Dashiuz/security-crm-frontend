"use client";

import { useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import { GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";

import ResponsiveDetailWrapper from "@/components/common/ResponsiveDetailWrapper";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import CsvImportDialog from "@/components/common/CsvImportDialog";
import { formatDateTime } from "@/lib/formatters";
import { Chip, Button, Box, Stack, Avatar, Typography, Paper, Grid } from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  BadgeRounded as BadgeIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  DeleteForever as DeleteForeverIcon,
} from "@mui/icons-material";

export const OPERATIONAL_CATEGORIES = [
  { value: "DIRECTOR", label: "Director / Gerencial", color: "error" },
  { value: "COORDINATOR", label: "Coordinador", color: "warning" },
  { value: "SUPERVISOR", label: "Supervisor", color: "info" },
  { value: "OPERATOR", label: "Operador de Medios / CCTV", color: "secondary" },
  { value: "GUARD", label: "Guarda de Seguridad", color: "primary" },
  { value: "ADMINISTRATIVE", label: "Administrativo", color: "default" },
  { value: "OTHER", label: "Otro Cargo", color: "default" },
];

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  level: z.coerce.number().int().min(1).optional().default(1),
  operationalCategory: z.string().optional().default("GUARD"),
  isActive: z.boolean().optional().default(true),
});

type PositionForm = z.infer<typeof schema>;

const fields: FormField<PositionForm>[] = [
  { name: "name", label: "Nombre de la Posición/Cargo", required: true },
  {
    name: "operationalCategory",
    label: "Categoría Operativa",
    type: "select",
    options: OPERATIONAL_CATEGORIES.map((c) => ({
      value: c.value,
      label: c.label,
    })),
  },
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
  {
    field: "name",
    headerName: "Cargo / Posición",
    flex: 1.5,
    minWidth: 220,
    renderCell: (params) => (
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ height: "100%" }}>
        <Avatar
          sx={{
            width: 34,
            height: 34,
            bgcolor: params.row.isActive ? "#0d9488" : "text.disabled",
            color: "#ffffff",
          }}
        >
          <BadgeIcon sx={{ fontSize: 18 }} />
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            Nivel jerárquico: {params.row.level ?? 1}
          </Typography>
        </Box>
      </Stack>
    ),
  },
  {
    field: "operationalCategory",
    headerName: "Categoría Operativa",
    width: 190,
    renderCell: (params) => {
      const cat = OPERATIONAL_CATEGORIES.find((c) => c.value === params.value);
      return (
        <Chip
          size="small"
          label={cat?.label || params.value || "Guarda"}
          color={(cat?.color as any) || "default"}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      );
    },
  },
  {
    field: "isActive",
    headerName: "Estado",
    width: 130,
    renderCell: (params) => {
      const active = Boolean(params.value);
      return (
        <Chip
          size="small"
          label={active ? "Activo" : "Inactivo"}
          icon={
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: active ? "#10b981" : "#94a3b8",
                boxShadow: active ? "0 0 6px rgba(16, 185, 129, 0.6)" : "none",
                ml: "4px !important",
              }}
            />
          }
          variant="outlined"
          sx={{
            fontWeight: 700,
            fontSize: "0.72rem",
            height: 24,
            borderColor: active ? "success.light" : "divider",
            color: active ? "success.dark" : "text.secondary",
            bgcolor: active ? "rgba(16, 185, 129, 0.05)" : "transparent",
          }}
        />
      );
    },
  },
  {
    field: "createdBy",
    headerName: "Creado Por",
    width: 170,
    valueGetter: (value: any) => value || "Sistema",
  },
  {
    field: "createdAt",
    headerName: "Creado En",
    width: 170,
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
    setDefaultValues({
      name: "",
      level: 1,
      operationalCategory: "GUARD",
      isActive: true,
    });
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
        operationalCategory: data.operationalCategory || "GUARD",
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

  const handleTogglePositionStatus = async (pos: any) => {
    try {
      await HttpClient.patch(`/position/${pos.id}/status`, { isActive: !pos.isActive });
      showSuccess(`Cargo ${!pos.isActive ? "habilitado" : "inhabilitado"} exitosamente`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al modificar el estado del cargo");
    }
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
        deleteActionLabel="Eliminar..."
        deleteIcon={<DeleteForeverIcon color="error" />}
        onView={handleView}
        customActions={(row) => [
          <GridActionsCellItem
            key="toggle-status"
            icon={
              row.isActive ? (
                <BlockIcon color="error" fontSize="small" />
              ) : (
                <CheckCircleIcon color="success" fontSize="small" />
              )
            }
            label={row.isActive ? "Inhabilitar cargo" : "Habilitar cargo"}
            onClick={() => handleTogglePositionStatus(row)}
            showInMenu={true}
          />,
        ]}
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

      <ResponsiveDetailWrapper
        open={Boolean(detailPos)}
        onClose={() => setDetailPos(null)}
        title="Detalles del Cargo / Posición"
        actions={
          <Box display="flex" justifyContent="flex-end">
            <Button onClick={() => setDetailPos(null)} variant="outlined">
              Cerrar
            </Button>
          </Box>
        }
      >
        {detailPos && (
          <Box>
            <Box sx={{ bgcolor: 'background.default', p: 3, borderRadius: 2, mb: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontSize: "1.5rem", fontWeight: 700 }}>
                  {detailPos.name.substring(0, 2).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {detailPos.name}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
                    <Chip size="small" label={`Nivel Jerárquico: ${detailPos.level ?? 1}`} variant="outlined" sx={{ ml: "0 !important" }} />
                    {detailPos.operationalCategory && (
                      <Chip
                        size="small"
                        label={
                          OPERATIONAL_CATEGORIES.find((c) => c.value === detailPos.operationalCategory)?.label ||
                          detailPos.operationalCategory
                        }
                        color={
                          (OPERATIONAL_CATEGORIES.find((c) => c.value === detailPos.operationalCategory)?.color as any) ||
                          "default"
                        }
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    <Chip
                      size="small"
                      label={detailPos.isActive ? "Activo" : "Inactivo"}
                      color={detailPos.isActive ? "success" : "default"}
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
                      <Typography variant="body2">{detailPos.createdBy || "Sistema"}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Fecha de Creación</Typography>
                      <Typography variant="body2">{detailPos.createdAt ? formatDateTime(detailPos.createdAt) : "N/A"}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </ResponsiveDetailWrapper>

      <PromptConfirmDialog
        open={Boolean(deletePos)}
        onClose={() => setDeletePos(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Cargo / Posición"
        description={`Para confirmar la eliminación definitiva del cargo "${deletePos?.name}", por favor ingrese su nombre exacto:`}
        expectedValue={deletePos?.name || ""}
        inputLabel="Nombre del Cargo"
        confirmButtonText="Confirmar Eliminación"
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
        templateColumns={["Nombre", "Nivel", "CategoriaOperativa", "EstadoActivo"]}
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
