"use client";

import { useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import { GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { HttpClient } from "@/lib/api/client";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import CsvImportDialog from "@/components/common/CsvImportDialog";
import { formatDateTime } from "@/lib/formatters";
import { Button } from "@mui/material";
import {
  RestoreFromTrash as RestoreFromTrashIcon,
  RemoveCircle as RemoveCircleIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

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
  const [deleteClient, setDeleteClient] = useState<any | null>(null);
  const [reactivateClient, setReactivateClient] = useState<any | null>(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showSuccess, showError } = useNotification();

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
    if (!row.isActive || row.deletedAt) {
      return [
        <GridActionsCellItem
          key={`reactivate-${row.id}`}
          icon={<RestoreFromTrashIcon color="success" />}
          label="Reactivar Cliente"
          title="Reactivar"
          showInMenu={false}
          onClick={() => setReactivateClient(row)}
        />,
      ];
    }
    return [];
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
    </>
  );
}
