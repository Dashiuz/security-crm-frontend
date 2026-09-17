"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import { HttpClient } from "@/lib/api/client";
import { AuthService } from "@/lib/api/auth";
import { Box, Typography, Chip } from "@mui/material";
import { GridActionsCellItem } from "@mui/x-data-grid";
import {
  Login as LoginIcon,
  Block as BlockIcon,
  CheckCircleOutline as CheckCircleIcon,
} from "@mui/icons-material";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  sidebarColor?: string;
  features?: string[];
  profile?: {
    legalName?: string;
    taxId?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  subscription?: {
    planTier?: string;
    status?: string;
    maxClients?: number;
    maxUsers?: number;
    maxEmployees?: number;
  };
}

export default function TenantsPage() {
  const router = useRouter();
  const [statusTargetTenant, setStatusTargetTenant] = useState<Tenant | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showSuccess, showError } = useNotification();

  const handleCreate = () => {
    router.push("/administrative/tenants/create");
  };

  const handleEdit = (id: string) => {
    router.push(`/administrative/tenants/${id}`);
  };

  const handleView = (row: any) => {
    router.push(`/administrative/tenants/${row.id}`);
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusTargetTenant) return;
    if (statusTargetTenant.slug === "system" || statusTargetTenant.id === "system") {
      showError("No es posible desactivar la empresa maestra del sistema.");
      setStatusTargetTenant(null);
      return;
    }
    const newStatus = !statusTargetTenant.isActive;
    try {
      await HttpClient.patch(`/tenants/${statusTargetTenant.id}`, {
        isActive: newStatus,
      });
      showSuccess(
        `Empresa "${statusTargetTenant.name}" ${newStatus ? "activada" : "desactivada"} exitosamente.`
      );
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(
        error.message ||
          `Error al ${newStatus ? "activar" : "desactivar"} la empresa`
      );
    } finally {
      setStatusTargetTenant(null);
    }
  };

  const handleImpersonate = async (tenantId: string) => {
    try {
      await AuthService.impersonate(tenantId);
      window.location.href = "/dashboard";
    } catch (error) {
      showError("Error al iniciar administración de la empresa.");
    }
  };

  const customActions = (row: any) => {
    if (row.slug === "system" || row.id === "system") {
      return [];
    }
    const actions = [
      <GridActionsCellItem
        key={`impersonate-${row.id}`}
        icon={<LoginIcon color="success" />}
        label="Administrar"
        title="Administrar Empresa"
        showInMenu={false}
        onClick={() => handleImpersonate(row.id)}
      />,
    ];

    if (row.isActive) {
      actions.push(
        <GridActionsCellItem
          key={`deactivate-${row.id}`}
          icon={<BlockIcon color="error" />}
          label="Desactivar"
          title="Desactivar Empresa"
          showInMenu={false}
          onClick={() => setStatusTargetTenant(row as Tenant)}
        />
      );
    } else {
      actions.push(
        <GridActionsCellItem
          key={`activate-${row.id}`}
          icon={<CheckCircleIcon color="success" />}
          label="Activar"
          title="Activar Empresa"
          showInMenu={false}
          onClick={() => setStatusTargetTenant(row as Tenant)}
        />
      );
    }

    return actions;
  };

  const columns = [
    { field: "name", headerName: "Nombre de la Empresa", flex: 1.2 },
    { field: "slug", headerName: "Slug", flex: 0.9 },
    {
      field: "planTier",
      headerName: "Plan",
      flex: 0.8,
      valueGetter: (_: any, row: any) => row.subscription?.planTier || "BASIC",
      renderCell: (params: any) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === "ENTERPRISE"
              ? "secondary"
              : params.value === "PRO"
              ? "primary"
              : "default"
          }
          variant="outlined"
        />
      ),
    },
    {
      field: "contactEmail",
      headerName: "Correo de Contacto",
      flex: 1.1,
      valueGetter: (_: any, row: any) => row.profile?.contactEmail || "N/A",
    },
    {
      field: "isActive",
      headerName: "Estado",
      flex: 0.8,
      renderCell: (params: any) => (
        <Chip
          label={params.value ? "Activo" : "Inactivo"}
          color={params.value ? "success" : "default"}
          size="small"
        />
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="body2" color="error" sx={{ mb: 2 }}>
        * Esta página es exclusiva para usuarios SuperAdmin (GODLIKE).
      </Typography>

      <DataTable
        title="Gestión de Empresas (Tenants)"
        endpoint="/tenants"
        columns={columns}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Administrativo" },
          { label: "Empresas" },
        ]}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
        customActions={customActions}
        refreshTrigger={refreshTrigger}
      />

      <PromptConfirmDialog
        open={Boolean(statusTargetTenant)}
        onClose={() => setStatusTargetTenant(null)}
        onConfirm={handleConfirmToggleStatus}
        title={
          statusTargetTenant?.isActive
            ? "Desactivar Empresa"
            : "Activar Empresa"
        }
        description={
          statusTargetTenant?.isActive
            ? `Para confirmar la desactivación de la empresa "${statusTargetTenant?.name}", por favor ingrese su nombre exacto. Los usuarios de esta empresa no podrán iniciar sesión:`
            : `Para reactivar la empresa "${statusTargetTenant?.name}" y permitir nuevamente el acceso a sus usuarios, por favor ingrese su nombre exacto:`
        }
        expectedValue={statusTargetTenant?.name || ""}
        inputLabel="Nombre de la Empresa"
        confirmButtonText={
          statusTargetTenant?.isActive
            ? "Desactivar Empresa"
            : "Activar Empresa"
        }
        confirmColor={statusTargetTenant?.isActive ? "error" : "primary"}
      />
    </Box>
  );
}
