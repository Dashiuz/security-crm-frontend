"use client";

import { useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { useTenant } from "@/providers/TenantProvider";
import DataTable from "@/components/common/DataTable";
import { GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { HttpClient } from "@/lib/api/client";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import CsvImportDialog from "@/components/common/CsvImportDialog";
import { formatDateTime } from "@/lib/formatters";
import {
  Button,
  Stack,
  Box,
  Typography,
  Avatar,
  Chip,
} from "@mui/material";
import {
  RestoreFromTrash as RestoreFromTrashIcon,
  RemoveCircle as RemoveCircleIcon,
  DeleteForever as DeleteForeverIcon,
  CloudUpload as CloudUploadIcon,
  Security as SecurityIcon,
  Map as MapIcon,
  ApartmentRounded as ApartmentIcon,
  LocationOnRounded as LocationIcon,
  StorefrontRounded as StorefrontIcon,
  PrecisionManufacturingRounded as FactoryIcon,
  LocalHospitalRounded as LocalHospitalIcon,
  AccountBalanceRounded as AccountBalanceIcon,
  SchoolRounded as SchoolIcon,
  LocalShippingRounded as LocalShippingIcon,
  BusinessRounded as BusinessIcon,
  DescriptionRounded as ContractIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

const SECTOR_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactElement }
> = {
  RESIDENTIAL: {
    label: "Residencial",
    color: "#0284c7",
    bg: "rgba(2, 132, 199, 0.08)",
    icon: <ApartmentIcon sx={{ fontSize: 13 }} />,
  },
  COMMERCIAL: {
    label: "Comercial",
    color: "#d97706",
    bg: "rgba(217, 119, 6, 0.08)",
    icon: <StorefrontIcon sx={{ fontSize: 13 }} />,
  },
  INDUSTRIAL: {
    label: "Industrial",
    color: "#475569",
    bg: "rgba(71, 85, 105, 0.08)",
    icon: <FactoryIcon sx={{ fontSize: 13 }} />,
  },
  HEALTHCARE: {
    label: "Salud",
    color: "#e11d48",
    bg: "rgba(225, 29, 72, 0.08)",
    icon: <LocalHospitalIcon sx={{ fontSize: 13 }} />,
  },
  FINANCIAL: {
    label: "Financiero",
    color: "#16a34a",
    bg: "rgba(22, 163, 74, 0.08)",
    icon: <AccountBalanceIcon sx={{ fontSize: 13 }} />,
  },
  EDUCATIONAL: {
    label: "Educativo",
    color: "#7c3aed",
    bg: "rgba(124, 58, 237, 0.08)",
    icon: <SchoolIcon sx={{ fontSize: 13 }} />,
  },
  GOVERNMENT: {
    label: "Gobierno",
    color: "#0891b2",
    bg: "rgba(8, 145, 178, 0.08)",
    icon: <AccountBalanceIcon sx={{ fontSize: 13 }} />,
  },
  LOGISTICS: {
    label: "Logística",
    color: "#ea580c",
    bg: "rgba(234, 88, 12, 0.08)",
    icon: <LocalShippingIcon sx={{ fontSize: 13 }} />,
  },
  MIXED: {
    label: "Mixto",
    color: "#4f46e5",
    bg: "rgba(79, 70, 229, 0.08)",
    icon: <BusinessIcon sx={{ fontSize: 13 }} />,
  },
  OTHER: {
    label: "Otro",
    color: "#64748b",
    bg: "rgba(100, 116, 139, 0.08)",
    icon: <BusinessIcon sx={{ fontSize: 13 }} />,
  },
};

const columns: GridColDef[] = [
  {
    field: "name",
    headerName: "Cliente / Conjunto",
    flex: 1.5,
    minWidth: 240,
    renderCell: (params) => {
      const active = Boolean(params.row.isActive && !params.row.deletedAt);
      return (
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ height: "100%" }}
        >
          <Avatar
            variant="rounded"
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: active
                ? "rgba(37, 99, 235, 0.1)"
                : "rgba(148, 163, 184, 0.12)",
              color: active ? "#2563eb" : "text.disabled",
              border: "1px solid",
              borderColor: active ? "rgba(37, 99, 235, 0.2)" : "divider",
            }}
          >
            <ApartmentIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                fontSize: "0.85rem",
                lineHeight: 1.25,
                color: active ? "text.primary" : "text.secondary",
              }}
              noWrap
            >
              {params.value}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              display="block"
              sx={{ fontSize: "0.72rem" }}
            >
              NIT: {params.row.nit || "N/A"}
            </Typography>
          </Box>
        </Stack>
      );
    },
  },
  {
    field: "internalCode",
    headerName: "Omega",
    width: 155,
    renderCell: (params) => (
      <Chip
        size="small"
        label={params.value ? `${params.value}` : "S/C"}
        variant="outlined"
        sx={{
          fontFamily: "monospace",
          fontWeight: 700,
          fontSize: "0.72rem",
          height: 24,
          letterSpacing: "0.02em",
          borderColor: "divider",
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.04)"
              : "rgba(0, 0, 0, 0.03)",
          borderRadius: 1.5,
        }}
      />
    ),
  },
  {
    field: "sector",
    headerName: "Sector",
    width: 145,
    renderCell: (params) => {
      const config = SECTOR_CONFIG[params.value] || {
        label: params.value || "General",
        color: "#64748b",
        bg: "rgba(100, 116, 139, 0.08)",
        icon: <BusinessIcon sx={{ fontSize: 13 }} />,
      };
      return (
        <Chip
          size="small"
          icon={config.icon}
          label={config.label}
          sx={{
            fontWeight: 600,
            fontSize: "0.72rem",
            height: 24,
            color: config.color,
            bgcolor: config.bg,
            border: "1px solid transparent",
            "& .MuiChip-icon": {
              color: "inherit",
              ml: "4px",
            },
          }}
        />
      );
    },
  },
  {
    field: "contractNumber",
    headerName: "Contrato",
    width: 140,
    renderCell: (params) => (
      <Stack direction="row" spacing={0.6} alignItems="center">
        <ContractIcon sx={{ fontSize: 14, color: "text.secondary" }} />
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: params.value ? "text.primary" : "text.secondary",
          }}
          noWrap
        >
          {params.value || "Sin contrato"}
        </Typography>
      </Stack>
    ),
  },
  {
    field: "city",
    headerName: "Ciudad",
    width: 125,
    renderCell: (params) => (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <LocationIcon sx={{ fontSize: 14, color: "text.secondary" }} />
        <Typography
          variant="body2"
          sx={{ fontSize: "0.8rem", color: "text.primary" }}
          noWrap
        >
          {params.value || "N/A"}
        </Typography>
      </Stack>
    ),
  },
  {
    field: "isActive",
    headerName: "Estado",
    width: 125,
    renderCell: (params) => {
      const active = Boolean(params.row.isActive && !params.row.deletedAt);
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
                boxShadow: active
                  ? "0 0 6px rgba(16, 185, 129, 0.6)"
                  : "none",
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
    width: 150,
    valueGetter: (value: any) => value || "Sistema",
  },
  {
    field: "createdAt",
    headerName: "Creado En",
    width: 165,
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

  const handleOpenGeofence = (row: any) => {
    router.push(`/administrative/clients/${row.id}/security-studies`);
  };

  const handleCreate = () => {
    router.push("/administrative/clients/new");
  };

  const handleView = (row: any) => {
    router.push(`/administrative/clients/${row.id}`);
  };

  const handleDeleteRequest = (id: string) => {
    HttpClient.get<any>("/client").then((res) => {
      const list: any[] = Array.isArray(res) ? res : res?.data || [];
      const target = list.find((c) => c.id === id);
      if (target) setDeleteClient(target);
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteClient) return;
    try {
      await HttpClient.delete(`/client/${deleteClient.id}`);
      showSuccess(`Cliente "${deleteClient.name}" inhabilitado exitosamente.`);
      setDeleteClient(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al inhabilitar el cliente");
    }
  };

  const handleConfirmReactivate = async () => {
    if (!reactivateClient) return;
    try {
      await HttpClient.patch(`/client/${reactivateClient.id}/reactivate`, {});
      showSuccess(`Cliente "${reactivateClient.name}" reactivado exitosamente.`);
      setReactivateClient(null);
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
    const isActiveClient = Boolean(row.isActive && !row.deletedAt);

    if (isActiveClient) {
      if (isFeatureEnabled("sec_study")) {
        actions.push(
          <GridActionsCellItem
            key={`studies-${row.id}`}
            icon={<SecurityIcon color="primary" />}
            label="Estudios de Seguridad"
            showInMenu={true}
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
            label="Configurar Geofence (Perímetro)"
            showInMenu={true}
            onClick={() => handleOpenGeofence(row)}
          />,
        );
      }
    } else {
      actions.push(
        <GridActionsCellItem
          key={`reactivate-${row.id}`}
          icon={<RestoreFromTrashIcon color="success" />}
          label="Reactivar Cliente"
          showInMenu={true}
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
        deleteActionLabel="Eliminar..."
        deleteIcon={<DeleteForeverIcon color="error" />}
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
        title="Eliminar Cliente"
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
