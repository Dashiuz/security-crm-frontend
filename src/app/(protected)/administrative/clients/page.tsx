"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useNotification } from "@/providers/NotificationProvider";
import { useTenant } from "@/providers/TenantProvider";
import DataTable from "@/components/common/DataTable";
import { GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { HttpClient } from "@/lib/api/client";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import CsvImportDialog from "@/components/common/CsvImportDialog";
import { formatDateTime } from "@/lib/formatters";
import { Button, Box, CircularProgress, Dialog, DialogTitle, DialogContent } from "@mui/material";
import {
  RestoreFromTrash as RestoreFromTrashIcon,
  RemoveCircle as RemoveCircleIcon,
  CloudUpload as CloudUploadIcon,
  Security as SecurityIcon,
  Map as MapIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import MapboxLocationPicker from "@/components/security-studies/MapboxLocationPicker";

const SecurityCanvasEditor = dynamic(
  () => import("@/components/security-studies/SecurityCanvasEditor"),
  {
    ssr: false,
    loading: () => (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 600,
        }}
      >
        <CircularProgress />
      </Box>
    ),
  },
);


const columns: GridColDef[] = [
  { field: "internalCode", headerName: "Código", width: 100 },
  { field: "name", headerName: "Nombre / Conjunto", width: 240 },
  { field: "nit", headerName: "NIT", width: 130 },
  { field: "clientStatus", headerName: "Estado Cliente", width: 120 },
  { field: "contractNumber", headerName: "Contrato", width: 140 },
  { field: "sector", headerName: "Sector", width: 130 },
  { field: "city", headerName: "Ciudad", width: 110 },
  { field: "isActive", headerName: "Activo", type: "boolean", width: 90 },
  {
    field: "createdBy",
    headerName: "Creado Por",
    width: 160,
    valueGetter: (value: any) => value || "Sistema",
  },
  {
    field: "createdAt",
    headerName: "Creado En",
    width: 170,
    valueFormatter: (value: any) => (value ? formatDateTime(value) : "N/A"),
  },
];

export default function ClientsPage() {
  const router = useRouter();
  const { isFeatureEnabled } = useTenant();
  const [deleteClient, setDeleteClient] = useState<any | null>(null);
  const [reactivateClient, setReactivateClient] = useState<any | null>(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showSuccess, showError } = useNotification();

  // Geofence states
  const [geofenceClient, setGeofenceClient] = useState<any | null>(null);
  const [geofenceData, setGeofenceData] = useState<any | null>(null);
  const [geofenceLocationPickerOpen, setGeofenceLocationPickerOpen] = useState(false);
  const [geofenceCanvasEditorOpen, setGeofenceCanvasEditorOpen] = useState(false);
  const [loadingGeofence, setLoadingGeofence] = useState(false);

  const handleOpenGeofence = async (row: any) => {
    setLoadingGeofence(true);
    setGeofenceClient(row);
    try {
      const res = await HttpClient.get<any>(
        `/administrative/security-studies/client/${row.id}/geofence`,
      );
      setGeofenceData(res);
      if (res.hasBaseImage) {
        setGeofenceCanvasEditorOpen(true);
      } else {
        setGeofenceLocationPickerOpen(true);
      }
    } catch (err: any) {
      showError(err.message || "Error al obtener geocerca del cliente.");
    } finally {
      setLoadingGeofence(false);
    }
  };

  const handleCreate = () => {
    router.push("/administrative/clients/new");
  };

  const handleView = (row: any) => {
    router.push(`/administrative/clients/${row.id}`);
  };

  const handleDeleteRequest = (id: string) => {
    HttpClient.get<any[]>("/client").then((clients) => {
      const target = clients.find((c) => c.id === id);
      if (target) setDeleteClient(target);
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteClient) return;
    try {
      await HttpClient.delete(`/client/${deleteClient.id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al inhabilitar el cliente");
    }
  };

  const handleConfirmReactivate = async () => {
    if (!reactivateClient) return;
    try {
      await HttpClient.patch(`/client/${reactivateClient.id}/reactivate`, {});
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al reactivar el cliente");
    }
  };

  const handleImport = async (
    data: Array<Record<string, string>>,
    fileName: string,
  ) => {
    try {
      const response = await HttpClient.post<{
        status: string;
        totalRows: number;
        successRows: number;
        errorRows: number;
        errors?: Array<{ row: number; reason: string }>;
      }>("/client/import/csv", {
        data,
        fileName,
      });
      return response;
    } catch (error: any) {
      showError(error.message || "Error al importar el archivo CSV.");
      throw error;
    }
  };

  const customActions = (row: any) => {
    const actions = [];
    if (row.isActive && !row.deletedAt) {
      if (isFeatureEnabled("sec_study")) {
        actions.push(
          <GridActionsCellItem
            key={`studies-${row.id}`}
            icon={<SecurityIcon color="primary" />}
            label="Estudios de Seguridad"
            title="Estudios de Seguridad"
            showInMenu={false}
            onClick={() =>
              router.push(`/administrative/clients/${row.id}/security-studies`)
            }
          />,
        );
      }
      if (isFeatureEnabled("canva")) {
        actions.push(
          <GridActionsCellItem
            key={`geofence-${row.id}`}
            icon={<MapIcon color="secondary" />}
            label="Configurar Geofence"
            title="Configurar Geofence (Perímetro Mapbox)"
            showInMenu={false}
            onClick={() => handleOpenGeofence(row)}
          />,
        );
      }
    }
    if (!row.isActive || row.deletedAt) {
      actions.push(
        <GridActionsCellItem
          key={`reactivate-${row.id}`}
          icon={<RestoreFromTrashIcon color="success" />}
          label="Reactivar Cliente"
          title="Reactivar"
          showInMenu={false}
          onClick={() => setReactivateClient(row)}
        />,
      );
    }
    return actions;
  };

  return (
    <>
      <DataTable
        title="Gestión de Clientes"
        endpoint="/client"
        columns={columns}
        breadcrumbs={[{ label: "Mis Clientes" }, { label: "Listado de Clientes" }]}
        onCreate={handleCreate}
        onView={handleView}
        onDelete={handleDeleteRequest}
        customActions={customActions}
        deleteIcon={<RemoveCircleIcon color="error" />}
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
        infoDescription="Administración de la cartera de clientes y conjuntos residenciales, incluyendo modelado de torres/viviendas y censo de residentes."
        infoInstructions={`Haz clic en 'Crear Nuevo' para ir al formulario de pantalla completa de registro de cliente y su estructura física.
        Haz clic en el icono del ojo 'Ver Detalles' para gestionar la información y el censo de residentes del conjunto.
        Para inhabilitar un cliente, confirma ingresando su NIT exacto.`}
      />

      <PromptConfirmDialog
        open={Boolean(deleteClient)}
        onClose={() => setDeleteClient(null)}
        onConfirm={handleConfirmDelete}
        title="Inhabilitar / Eliminar Cliente"
        description={`Para confirmar la eliminación del cliente "${deleteClient?.name}", por favor ingrese su NIT exacto:`}
        expectedValue={deleteClient?.nit || ""}
        inputLabel="NIT del Cliente"
        confirmButtonText="Confirmar Eliminación"
        confirmColor="error"
      />

      <PromptConfirmDialog
        open={Boolean(reactivateClient)}
        onClose={() => setReactivateClient(null)}
        onConfirm={handleConfirmReactivate}
        title="Reactivar Cliente"
        description={`Para confirmar la reactivación del cliente "${reactivateClient?.name}", por favor ingrese su NIT exacto:`}
        expectedValue={reactivateClient?.nit || ""}
        inputLabel="NIT del Cliente"
        confirmButtonText="Confirmar Reactivación"
        confirmColor="primary"
      />

      <CsvImportDialog
        open={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        title="Importar Clientes"
        templateColumns={[
          "nit",
          "name",
          "email",
          "phone",
          "address",
          "city",
          "sector",
          "internalCode",
          "contractNumber",
        ]}
        onImport={handleImport}
        onSuccessRedirect={(result) => {
          setCsvImportOpen(false);
          setRefreshTrigger((prev) => prev + 1);
          if (result?.status === "SUCCESS") {
            showSuccess("Importación masiva completada con éxito");
          } else if (result?.status === "PARTIAL") {
            showSuccess(
              "Importación masiva completada parcialmente. Revisa las advertencias.",
            );
          }
        }}
      />

      {/* Mapbox Geofence Location Picker Dialog */}
      <Dialog
        open={geofenceLocationPickerOpen && Boolean(geofenceClient)}
        onClose={() => setGeofenceLocationPickerOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Configurar Ubicación e Imagen Satelital Base - {geofenceClient?.name}
        </DialogTitle>
        <DialogContent>
          {geofenceClient && (
            <MapboxLocationPicker
              clientId={geofenceClient.id}
              clientName={geofenceClient.name}
              initialAddress={geofenceClient.address || ""}
              onBaseGenerated={(baseData) => {
                setGeofenceData((prev: any) => ({
                  ...prev,
                  hasBaseImage: true,
                  baseImageS3Key: baseData.baseImageS3Key,
                  baseImageUrl: baseData.presignedUrl,
                  center: baseData.center,
                  zoom: baseData.zoom,
                  bbox: baseData.bbox,
                }));
                setGeofenceLocationPickerOpen(false);
                setGeofenceCanvasEditorOpen(true);
              }}
              onCancel={() => setGeofenceLocationPickerOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen Geofence Canvas Editor */}
      {geofenceCanvasEditorOpen && geofenceClient && geofenceData && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9999,
            bgcolor: "background.default",
          }}
        >
          <SecurityCanvasEditor
            clientId={geofenceClient.id}
            mode="geofence"
            baseImageUrl={geofenceData.baseImageUrl}
            bbox={
              geofenceData.bbox || {
                minLat: 0,
                minLng: 0,
                maxLat: 0,
                maxLng: 0,
              }
            }
            clientGeofence={geofenceData.geofence}
            clientName={geofenceClient.name || "Cliente"}
            onPerimeterApproved={() => {
              showSuccess("¡Geofence aprobado y guardado exitosamente!");
              setGeofenceCanvasEditorOpen(false);
              setRefreshTrigger((prev) => prev + 1);
            }}
            onClose={() => {
              setGeofenceCanvasEditorOpen(false);
              setRefreshTrigger((prev) => prev + 1);
            }}
          />
        </Box>
      )}
    </>
  );
}
