"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Grid,
  TextField,
  Switch,
  Button,
  Chip,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  SaveOutlined,
  ToggleOnOutlined,
} from "@mui/icons-material";
import {
  ServiceOrderDistributionRecipient,
  InternalDepartment,
  CommercialSettingsApi,
} from "@/lib/api/commercial-settings";
import { useNotification } from "@/providers/NotificationProvider";
import { noxiaPalette } from "@/theme/noxiaTheme";
import EmployeeAutocompleteSearch from "../widgets/EmployeeAutocompleteSearch";

interface DistributionMatrixTabProps {
  recipients: ServiceOrderDistributionRecipient[];
  onRefresh: () => void;
}

const DEPARTMENT_LABELS: Record<InternalDepartment, { title: string; color: string }> = {
  [InternalDepartment.CONTRACTS]: { title: "Contratos y Jurídica", color: "#4F46E5" },
  [InternalDepartment.OPERATIONS]: { title: "Operaciones y Seguridad", color: "#7C3AED" },
  [InternalDepartment.WAREHOUSE]: { title: "Almacén y Dotación", color: "#D97706" },
  [InternalDepartment.MONITORING_CENTER]: { title: "Central de Monitoreo", color: "#0284C7" },
  [InternalDepartment.CUSTOMER_SERVICE]: { title: "Servicio al Cliente", color: "#059669" },
  [InternalDepartment.HUMAN_RESOURCES]: { title: "Talento Humano (RRHH)", color: "#DC2626" },
  [InternalDepartment.QUALITY_ASSURANCE]: { title: "Calidad y SG-SST", color: "#0D9488" },
  [InternalDepartment.ACCOUNTING]: { title: "Contabilidad y Facturación", color: "#475569" },
  [InternalDepartment.TREASURY]: { title: "Tesorería y Cartera", color: "#2563EB" },
};

const ALL_DEPARTMENTS = [
  InternalDepartment.CONTRACTS,
  InternalDepartment.OPERATIONS,
  InternalDepartment.WAREHOUSE,
  InternalDepartment.MONITORING_CENTER,
  InternalDepartment.CUSTOMER_SERVICE,
  InternalDepartment.HUMAN_RESOURCES,
  InternalDepartment.QUALITY_ASSURANCE,
  InternalDepartment.ACCOUNTING,
  InternalDepartment.TREASURY,
];

export default function DistributionMatrixTab({
  recipients,
  onRefresh,
}: DistributionMatrixTabProps) {
  const { showSuccess, showError } = useNotification();
  const [isSaving, setIsSaving] = useState(false);

  const [items, setItems] = useState<ServiceOrderDistributionRecipient[]>([]);

  useEffect(() => {
    // Inicializar o mapear los 9 departamentos
    const mapped = ALL_DEPARTMENTS.map((dept) => {
      const existing = recipients.find((r) => r.department === dept);
      if (existing) return existing;
      return {
        id: "",
        department: dept,
        recipientName: `Responsable ${DEPARTMENT_LABELS[dept].title}`,
        recipientEmail: `${dept.toLowerCase()}@empresa.com`,
        isActive: true,
      };
    });
    setItems(mapped);
  }, [recipients]);

  const allActive = items.length > 0 && items.every((i) => i.isActive);
  const someActive = items.some((i) => i.isActive);

  const handleToggleAll = (checked: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, isActive: checked })));
    showSuccess(checked ? "Todos los departamentos activados" : "Todos los departamentos pausados");
  };

  const handleChange = (index: number, field: "recipientName" | "recipientEmail" | "isActive", val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await CommercialSettingsApi.updateDistributionRecipients(items);
      showSuccess("Matriz de distribución a las 9 áreas actualizada exitosamente");
      onRefresh();
    } catch (err: any) {
      showError(err?.message || "Error al guardar la matriz de distribución");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: noxiaPalette.secondary.main }}>
            Matriz de Notificación de Orden de Servicio
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Destinatarios institucionales que reciben la orden de servicio al ser adjudicado un contrato
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          {/* Toggle Maestro Seleccionar / Desmarcar Todos */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              p: "4px 12px",
              borderRadius: 2,
              bgcolor: "background.paper",
              border: "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary" }}>
              {allActive ? "Todos Activos" : someActive ? "Parcial" : "Todos Pausados"}
            </Typography>
            <Switch
              size="small"
              checked={allActive}
              onChange={(e) => handleToggleAll(e.target.checked)}
              color="primary"
            />
          </Stack>

          <Button
            variant="contained"
            size="small"
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
            onClick={handleSave}
            disabled={isSaving}
            sx={{
              bgcolor: noxiaPalette.primary.main,
              "&:hover": {
                bgcolor: noxiaPalette.primary.dark,
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.35)",
              },
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.82rem",
              px: 2.2,
              height: 36,
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(124, 58, 237, 0.2)",
            }}
          >
            Guardar Matriz de Distribución
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        {items.map((item, idx) => {
          const info = DEPARTMENT_LABELS[item.department];
          return (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={item.department}>
              <Card
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: `1px solid ${item.isActive ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.05)"}`,
                  bgcolor: item.isActive ? "#FFFFFF" : "rgba(0,0,0,0.02)",
                  opacity: item.isActive ? 1 : 0.7,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Chip
                    label={info.title}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: `${info.color}15`,
                      color: info.color,
                      fontSize: "0.75rem",
                    }}
                  />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" sx={{ color: item.isActive ? "text.primary" : "text.secondary", fontWeight: 600 }}>
                      {item.isActive ? "Activo" : "Pausado"}
                    </Typography>
                    <Switch
                      checked={item.isActive}
                      onChange={(e) => handleChange(idx, "isActive", e.target.checked)}
                      size="small"
                    />
                  </Stack>
                </Box>

                {/* Buscador con debounce de 500ms */}
                <EmployeeAutocompleteSearch
                  label="Asignar desde Empleados"
                  placeholder="Buscar por nombre o cédula..."
                  disabled={!item.isActive}
                  onSelect={(emp) => {
                    if (!emp) return;
                    setItems((prev) => {
                      const updated = [...prev];
                      updated[idx] = {
                        ...updated[idx],
                        recipientName: emp.fullName,
                        recipientEmail: emp.email || updated[idx].recipientEmail,
                      };
                      return updated;
                    });
                    showSuccess(`${emp.fullName} asignado a ${info.title}`);
                  }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Funcionario Responsable"
                  value={item.recipientName}
                  onChange={(e) => handleChange(idx, "recipientName", e.target.value)}
                  disabled={!item.isActive}
                />

                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  label="Correo Electrónico Institucional"
                  value={item.recipientEmail}
                  onChange={(e) => handleChange(idx, "recipientEmail", e.target.value)}
                  disabled={!item.isActive}
                />
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
