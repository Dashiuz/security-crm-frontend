"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  EditOutlined,
  DeleteOutline,
} from "@mui/icons-material";
import { GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import {
  SecurityServiceCatalogItem,
  CommercialSettingsApi,
  CommercialSector,
  WeaponModality,
} from "@/lib/api/commercial-settings";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import ServiceCatalogDrawer from "../drawers/ServiceCatalogDrawer";
import ServiceDetailDrawer from "../drawers/ServiceDetailDrawer";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import { useNotification } from "@/providers/NotificationProvider";
import { noxiaPalette, jetBrainsMono } from "@/theme/noxiaTheme";

interface ServiceCatalogTabProps {
  services: SecurityServiceCatalogItem[];
  onRefresh: () => void;
}

export default function ServiceCatalogTab({ services, onRefresh }: ServiceCatalogTabProps) {
  const { showSuccess, showError } = useNotification();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<SecurityServiceCatalogItem | null>(null);

  // Visor detallado
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailService, setDetailService] = useState<SecurityServiceCatalogItem | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<SecurityServiceCatalogItem | null>(null);

  const handleEdit = (row: SecurityServiceCatalogItem) => {
    setSelectedService(row);
    setDrawerOpen(true);
  };

  const handleView = (row: SecurityServiceCatalogItem) => {
    setDetailService(row);
    setDetailOpen(true);
  };

  const handleEditFromDetail = (service: SecurityServiceCatalogItem) => {
    setDetailOpen(false);
    handleEdit(service);
  };

  const handleCreate = () => {
    setSelectedService(null);
    setDrawerOpen(true);
  };

  const handleDeleteClick = (row: SecurityServiceCatalogItem) => {
    setServiceToDelete(row);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    try {
      await CommercialSettingsApi.deleteServiceCatalog(serviceToDelete.id);
      showSuccess("Servicio eliminado del catálogo");
      onRefresh();
    } catch (err: any) {
      showError(err?.message || "Error al eliminar el servicio");
    } finally {
      setDeleteConfirmOpen(false);
      setServiceToDelete(null);
    }
  };

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "serviceCode",
        headerName: "COD",
        width: 75,
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, fontFamily: jetBrainsMono.style.fontFamily, color: noxiaPalette.primary.main }}
          >
            #{params.value}
          </Typography>
        ),
      },
      {
        field: "name",
        headerName: "Servicio / Descripción",
        flex: 1.5,
        minWidth: 220,
        renderCell: (params) => (
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.25, color: "text.primary" }}>
              {params.value}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.2, mt: 0.25 }}>
              {params.row.targetPosition}
            </Typography>
          </Box>
        ),
      },
      {
        field: "sector",
        headerName: "Sector",
        width: 155,
        renderCell: (params) => {
          let label = "Comercial";
          let color: "primary" | "info" | "default" = "primary";
          if (params.value === CommercialSector.RESIDENTIAL_STRATA_4_6) {
            label = "Residencial E4-6";
            color = "info";
          } else if (params.value === CommercialSector.RESIDENTIAL_STRATA_1_3) {
            label = "Residencial E1-3";
            color = "default";
          }
          return <Chip label={label} size="small" color={color} variant="outlined" sx={{ fontWeight: 600 }} />;
        },
      },
      {
        field: "weaponModality",
        headerName: "Arma",
        width: 120,
        renderCell: (params) => {
          let label = "Con Arma";
          if (params.value === WeaponModality.NO_WEAPON) label = "Sin Arma";
          if (params.value === WeaponModality.CANINE_SUPPORT) label = "Canino";
          return <Typography variant="caption" sx={{ fontWeight: 600 }}>{label}</Typography>;
        },
      },
      {
        field: "dailyTotalHours",
        headerName: "Turno",
        width: 140,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontFamily: jetBrainsMono.style.fontFamily, whiteSpace: "nowrap" }}>
            {params.value}h ({params.row.dayHours}D / {params.row.nightHours}N)
          </Typography>
        ),
      },
      {
        field: "billableDaysPerMonth",
        headerName: "Días/Mes",
        width: 95,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontFamily: jetBrainsMono.style.fontFamily }}>
            {params.value} días
          </Typography>
        ),
      },
      {
        field: "adminSupervisionPct",
        headerName: "% A&S",
        width: 85,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 700, color: noxiaPalette.primary.dark }}>
            {(Number(params.value) * 100).toFixed(0)}%
          </Typography>
        ),
      },
      {
        field: "actions",
        type: "actions",
        headerName: "Acciones",
        width: 90,
        getActions: (params) => [
          <GridActionsCellItem
            key="edit"
            icon={<EditOutlined fontSize="small" />}
            label="Editar"
            onClick={() => handleEdit(params.row as SecurityServiceCatalogItem)}
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteOutline fontSize="small" color="error" />}
            label="Eliminar"
            onClick={() => handleDeleteClick(params.row as SecurityServiceCatalogItem)}
          />,
        ],
      },
    ],
    [],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
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
            Catálogo Maestro de Servicios de Vigilancia
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Especificaciones técnicas, turnos y factor de administración y supervisión por modalidad
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleCreate}
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
          Nuevo Servicio
        </Button>
      </Box>

      {/* Vista Densa de Datos */}
      <ResponsiveDataView<any>
        title="Servicios de Vigilancia"
        rows={services}
        columns={columns}
        loading={false}
        hideStatusFilter={true}
        rowHeight={64}
        onView={handleView}
        getRowId={(r) => r.id}
        renderMobileCard={(row: SecurityServiceCatalogItem) => (
          <Paper
            elevation={0}
            onClick={() => handleView(row)}
            sx={{
              p: 2,
              mb: 1.5,
              borderRadius: 2,
              border: "1px solid rgba(0,0,0,0.08)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: "rgba(124, 58, 237, 0.02)",
                borderColor: "rgba(124, 58, 237, 0.3)",
              },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                #{row.serviceCode} - {row.name}
              </Typography>
              <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
                <IconButton size="small" onClick={() => handleEdit(row)}>
                  <EditOutlined fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDeleteClick(row)}>
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
              Cargo: {row.targetPosition} | Sector: {row.sector} | Arma: {row.weaponModality}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="space-between">
              <Typography variant="caption">
                Turno: <b>{row.dailyTotalHours}h ({row.dayHours}D / {row.nightHours}N)</b>
              </Typography>
              <Typography variant="caption">
                Días: <b>{row.billableDaysPerMonth}</b>
              </Typography>
              <Typography variant="caption" sx={{ color: noxiaPalette.primary.main, fontWeight: 700 }}>
                A&S: {(Number(row.adminSupervisionPct) * 100).toFixed(0)}%
              </Typography>
            </Stack>
          </Paper>
        )}
      />

      {/* Drawer Detalle de Servicio */}
      <ServiceDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        service={detailService}
        onEdit={handleEditFromDetail}
      />

      {/* Drawer Formulario */}
      <ServiceCatalogDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        serviceItem={selectedService}
        onSuccess={onRefresh}
      />

      {/* Confirmación Eliminación */}
      <PromptConfirmDialog
        open={deleteConfirmOpen}
        title="Eliminar Servicio del Catálogo"
        description={`Para confirmar la eliminación del servicio #${serviceToDelete?.serviceCode} - ${serviceToDelete?.name}, escriba ELIMINAR:`}
        expectedValue="ELIMINAR"
        inputLabel="Confirmación"
        confirmButtonText="Eliminar Servicio"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
}
