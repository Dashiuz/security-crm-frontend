"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";
import { AuthService } from "@/lib/api/auth";
import { Box, Typography, Chip } from "@mui/material";
import { GridActionsCellItem } from "@mui/x-data-grid";
import { Login as LoginIcon } from "@mui/icons-material";

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
}

interface Feature {
  key: string;
  name: string;
  description?: string;
}

const tenantSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  slug: z.string().min(1, "El identificador (slug) es obligatorio"),
  isActive: z.boolean(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  sidebarColor: z.string().optional(),
  features: z.array(z.string()).optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

import DetailDialog from "@/components/common/DetailDialog";

// ... existing interfaces ...

export default function TenantsPage() {
  const [featuresList, setFeaturesList] = useState<Feature[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [detailTenant, setDetailTenant] = useState<Tenant | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showError } = useNotification();

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const data = await HttpClient.get<Feature[]>("/features");
        setFeaturesList(data);
      } catch (error) {
        showError("Error cargando el catálogo de características.");
      }
    };
    loadFeatures();
  }, [showError]);

  const handleCreate = () => {
    setEditingTenant(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string, row: any) => {
    setEditingTenant(row as Tenant);
    setIsFormOpen(true);
  };

  const handleView = (row: any) => {
    setDetailTenant(row as Tenant);
  };

  const handleDelete = async (id: string) => {
    try {
      const target = await HttpClient.get<Tenant>(`/tenants/${id}`);
      if (target?.slug === "system" || id === "system") {
        showError("No es posible eliminar el tenant maestro del sistema.");
        return;
      }
      await HttpClient.delete(`/tenants/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al eliminar la empresa");
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
    return [
      <GridActionsCellItem
        key={`impersonate-${row.id}`}
        icon={<LoginIcon color="success" />}
        label="Administrar"
        showInMenu={false}
        onClick={() => handleImpersonate(row.id)}
      />,
    ];
  };

  const handleFormSubmit = async (data: TenantFormData) => {
    try {
      const { features, ...tenantPayload } = data;

      if (editingTenant) {
        await HttpClient.patch(`/tenants/${editingTenant.id}`, tenantPayload);
        if (features !== undefined) {
          await HttpClient.put(`/tenants/${editingTenant.id}/features`, {
            featureKeys: features,
          });
        }
      } else {
        const newTenant = await HttpClient.post<Tenant>("/tenants", tenantPayload);
        if (features !== undefined && features.length > 0) {
          await HttpClient.put(`/tenants/${newTenant.id}/features`, {
            featureKeys: features,
          });
        }
      }
      setIsFormOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      throw error;
    }
  };

  const columns = [
    { field: "name", headerName: "Nombre", flex: 1 },
    { field: "slug", headerName: "Identificador (Slug)", flex: 1 },
    {
      field: "isActive",
      headerName: "Estado",
      flex: 1,
      valueFormatter: (value: boolean) => (value ? "Activo" : "Inactivo"),
    },
  ];

  const formFields: FormField<TenantFormData>[] = [
    {
      name: "name",
      label: "Nombre de la Empresa",
      required: true,
      placeholder: "Ej: Security Inc",
    },
    {
      name: "slug",
      label: "Identificador (Slug)",
      required: true,
      placeholder: "Ej: security-inc",
    },
    {
      name: "isActive",
      label: "Estado Activo",
      type: "select",
      options: [
        { value: "true", label: "Activo" },
        { value: "false", label: "Inactivo" },
      ],
      required: true,
    },
    {
      name: "logoUrl",
      label: "URL del Logo",
    },
    {
      name: "primaryColor",
      label: "Color Primario (Hex)",
      placeholder: "Ej: #1976d2",
    },
    {
      name: "secondaryColor",
      label: "Color Secundario (Hex)",
      placeholder: "Ej: #9c27b0",
    },
    {
      name: "features",
      label: "Módulos Habilitados",
      type: "multiselect",
      options: featuresList.map((f) => ({ value: f.key, label: f.name })),
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
        onDelete={handleDelete}
        onView={handleView}
        customActions={customActions}
        refreshTrigger={refreshTrigger}
      />

      <DetailDialog
        open={Boolean(detailTenant)}
        onClose={() => setDetailTenant(null)}
        title="Detalles de la Empresa"
        fields={
          detailTenant
            ? [
                { label: "Nombre", value: detailTenant.name },
                { label: "Identificador (Slug)", value: detailTenant.slug },
                {
                  label: "Estado",
                  value: (
                    <Chip
                      label={detailTenant.isActive ? "Activo" : "Inactivo"}
                      color={detailTenant.isActive ? "success" : "default"}
                      size="small"
                    />
                  ),
                },
                { label: "URL Logo", value: detailTenant.logoUrl || "No especificado" },
                { label: "Color Primario", value: detailTenant.primaryColor || "Default" },
                { label: "Color Secundario", value: detailTenant.secondaryColor || "Default" },
                {
                  label: "Módulos Habilitados",
                  value:
                    detailTenant.features && detailTenant.features.length > 0 ? (
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                        {detailTenant.features.map((f) => (
                          <Chip key={f} label={f} size="small" variant="outlined" color="primary" />
                        ))}
                      </Box>
                    ) : (
                      "Ninguno"
                    ),
                },
              ]
            : []
        }
      />

      <FormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        title={editingTenant ? "Editar Empresa" : "Nueva Empresa"}
        schema={tenantSchema}
        fields={formFields}
        defaultValues={
          editingTenant
            ? {
                name: editingTenant.name,
                slug: editingTenant.slug,
                isActive: editingTenant.isActive,
                logoUrl: editingTenant.logoUrl || "",
                primaryColor: editingTenant.primaryColor || "",
                secondaryColor: editingTenant.secondaryColor || "",
                sidebarColor: editingTenant.sidebarColor || "",
                features: editingTenant.features || [],
              }
            : {
                name: "",
                slug: "",
                isActive: true,
                logoUrl: "",
                primaryColor: "#1976d2",
                secondaryColor: "#9c27b0",
                sidebarColor: "",
                features: [],
              }
        }
      />
    </Box>
  );
}
