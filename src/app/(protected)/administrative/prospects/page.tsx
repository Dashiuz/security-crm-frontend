"use client";

import { useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import { GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { HttpClient } from "@/lib/api/client";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import { formatDateTime } from "@/lib/formatters";
import UserAutocomplete, { UserOption } from "@/components/common/UserAutocomplete";
import {
  RemoveCircle as RemoveCircleIcon,
  DeleteForever as DeleteForeverIcon,
  HandshakeRounded as HandshakeIcon,
  TaskAlt as ConvertIcon,
  CalendarMonth as CalendarMonthIcon,
  ApartmentRounded as ApartmentIcon,
  LocationOnRounded as LocationIcon,
  StorefrontRounded as StorefrontIcon,
  PrecisionManufacturingRounded as FactoryIcon,
  LocalHospitalRounded as LocalHospitalIcon,
  AccountBalanceRounded as AccountBalanceIcon,
  SchoolRounded as SchoolIcon,
  LocalShippingRounded as LocalShippingIcon,
  BusinessRounded as BusinessIcon,
  PhoneRounded as PhoneIcon,
  EmailRounded as EmailIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import {
  InputAdornment,
  Grid,
  TextField,
  MenuItem,
  Typography,
  Box,
  Stack,
  Avatar,
  Chip,
} from "@mui/material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";

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
    headerName: "Prospecto / Razón Social",
    flex: 1.5,
    minWidth: 240,
    renderCell: (params) => {
      const active = Boolean(params.row.isActive !== false && !params.row.deletedAt);
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
                ? "rgba(139, 92, 246, 0.12)"
                : "rgba(148, 163, 184, 0.12)",
              color: active ? "#7c3aed" : "text.disabled",
              border: "1px solid",
              borderColor: active ? "rgba(139, 92, 246, 0.25)" : "divider",
            }}
          >
            <HandshakeIcon sx={{ fontSize: 20 }} />
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
    headerName: "Omega (Cód. Interno)",
    width: 155,
    renderCell: (params) => (
      <Chip
        size="small"
        label={params.value ? `Omega: ${params.value}` : "S/C"}
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
    field: "phone",
    headerName: "Contacto",
    width: 180,
    renderCell: (params) => (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
        }}
      >
        {params.row.phone ? (
          <Stack direction="row" spacing={0.6} alignItems="center">
            <PhoneIcon sx={{ fontSize: 13, color: "text.secondary" }} />
            <Typography variant="body2" sx={{ fontSize: "0.78rem" }} noWrap>
              {params.row.phone}
            </Typography>
          </Stack>
        ) : null}
        {params.row.email ? (
          <Stack direction="row" spacing={0.6} alignItems="center">
            <EmailIcon sx={{ fontSize: 13, color: "text.secondary" }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.72rem" }}
              noWrap
            >
              {params.row.email}
            </Typography>
          </Stack>
        ) : null}
        {!params.row.phone && !params.row.email && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: "0.72rem" }}
          >
            Sin contacto
          </Typography>
        )}
      </Box>
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
    width: 140,
    renderCell: (params) => {
      const active = Boolean(params.row.isActive !== false && !params.row.deletedAt);
      return (
        <Chip
          size="small"
          label={active ? "En Negociación" : "Inactivo"}
          icon={
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: active ? "#8b5cf6" : "#94a3b8",
                boxShadow: active
                  ? "0 0 6px rgba(139, 92, 246, 0.6)"
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
            borderColor: active ? "rgba(139, 92, 246, 0.3)" : "divider",
            color: active ? "#7c3aed" : "text.secondary",
            bgcolor: active ? "rgba(139, 92, 246, 0.05)" : "transparent",
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

export default function ProspectsPage() {
  const router = useRouter();
  const [deleteProspect, setDeleteProspect] = useState<any | null>(null);
  const [convertProspect, setConvertProspect] = useState<any | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [converting, setConverting] = useState(false);
  const { showSuccess, showError } = useNotification();

  // Users for Assignment
  const [coordinatorUser, setCoordinatorUser] = useState<UserOption | null>(null);
  const [commercialUser, setCommercialUser] = useState<UserOption | null>(null);

  const [convertForm, setConvertForm] = useState({
    contractNumber: "",
    contractDate: new Date().toISOString().split("T")[0],
    lastContractDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split("T")[0],
    contractEndDate: "",
    renewedContract: false,
    coordinatorInChargeId: "",
    commercialContactId: "",
    administrationType: "INDIVIDUAL",
  });

  const handleCreate = () => {
    router.push("/administrative/prospects/new");
  };

  const handleView = (row: any) => {
    router.push(`/administrative/prospects/${row.id}`);
  };

  const handleDeleteRequest = (id: string) => {
    HttpClient.get<any[]>("/prospect").then((prospects) => {
      const target = prospects.find((p) => p.id === id);
      if (target) setDeleteProspect(target);
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteProspect) return;
    try {
      await HttpClient.delete(`/prospect/${deleteProspect.id}`);
      showSuccess(`Prospecto "${deleteProspect.name}" inhabilitado exitosamente.`);
      setDeleteProspect(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al inhabilitar el prospecto.");
    }
  };

  const handleOpenConvert = (row: any) => {
    setConvertProspect(row);
    setCoordinatorUser(null);
    setCommercialUser(null);
    setConvertForm({
      contractNumber: `CONT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      contractDate: new Date().toISOString().split("T")[0],
      lastContractDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0],
      contractEndDate: "",
      renewedContract: false,
      coordinatorInChargeId: "",
      commercialContactId: "",
      administrationType: "INDIVIDUAL",
    });
  };

  const handleConfirmConvert = async () => {
    if (!convertProspect) return;
    if (
      !convertForm.contractNumber ||
      !convertForm.contractDate ||
      !convertForm.lastContractDate
    ) {
      showError("Por favor completa los campos de número y fechas de contrato.");
      return;
    }

    setConverting(true);
    try {
      await HttpClient.post(`/prospect/${convertProspect.id}/convert`, convertForm);
      showSuccess(
        `¡Felicidades! Se ha cerrado el contrato y "${convertProspect.name}" ahora es un Cliente Activo.`,
      );
      setConvertProspect(null);
      router.push("/administrative/clients");
    } catch (err: any) {
      showError(err.message || "Error al convertir el prospecto en cliente.");
    } finally {
      setConverting(false);
    }
  };

  const customActions = (row: any) => {
    return [
      <GridActionsCellItem
        key={`convert-${row.id}`}
        icon={<ConvertIcon color="primary" />}
        label="Cerrar Contrato (Convertir a Cliente)"
        showInMenu={true}
        onClick={() => handleOpenConvert(row)}
      />,
    ];
  };

  return (
    <>
      <DataTable
        title="Gestión de Prospectos de Clientes"
        endpoint="/prospect"
        columns={columns}
        breadcrumbs={[{ label: "Mis Clientes" }, { label: "Prospectos de Cliente" }]}
        onCreate={handleCreate}
        onView={handleView}
        onDelete={handleDeleteRequest}
        customActions={customActions}
        deleteActionLabel="Eliminar..."
        deleteIcon={<DeleteForeverIcon color="error" />}
        refreshTrigger={refreshTrigger}
        infoDescription="Control de cartera de prospectos comerciales y cotizaciones previas a la firma de contrato."
        infoInstructions={`Haz clic en 'Crear Nuevo' para iniciar el registro guiado (Ubicación y Estructura).
        Haz clic en el icono del visto bueno para 'Cerrar Contrato' y formalizar al prospecto como Cliente Activo.
        Haz clic en el ojo para ver los detalles del prospecto.`}
      />

      {/* Invalidate Dialog */}
      <PromptConfirmDialog
        open={Boolean(deleteProspect)}
        onClose={() => setDeleteProspect(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Prospecto"
        description={`Para confirmar la eliminación del prospecto "${deleteProspect?.name}", por favor ingrese su NIT exacto:`}
        expectedValue={deleteProspect?.nit || ""}
        inputLabel="NIT del Prospecto"
        confirmButtonText="Confirmar Eliminación"
        confirmColor="error"
      />

      {/* Convert to Client Drawer */}
      <ResponsiveFormDrawer
        open={Boolean(convertProspect)}
        onClose={() => !converting && setConvertProspect(null)}
        title={
          convertProspect
            ? `Cerrar Contrato: ${convertProspect.name}`
            : "Cerrar Contrato y Formalizar Cliente"
        }
        subtitle="Formalización del cliente en la plataforma operativa"
        isSubmitting={converting}
        submitButtonText="Confirmar y Cerrar Contrato"
        formId="convert-prospect-form"
      >
        <Box
          component="form"
          id="convert-prospect-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirmConvert();
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Al formalizar este prospecto, se convertirá en un{" "}
            <strong>Cliente Activo</strong> dentro de la plataforma y estará
            disponible para asignación operativa de guardias y residentes.
          </Typography>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Número de Contrato *"
                value={convertForm.contractNumber}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    contractNumber: e.target.value,
                  })
                }
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Tipo de Contrato"
                value={convertForm.renewedContract ? "RENEWED" : "NEW"}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    renewedContract: e.target.value === "RENEWED",
                  })
                }
              >
                <MenuItem value="NEW">Contrato Nuevo</MenuItem>
                <MenuItem value="RENEWED">Contrato Renovado</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CalendarMonthIcon
                        sx={{ color: "action.active", pointerEvents: "none" }}
                      />
                    </InputAdornment>
                  ),
                }}
                label="Fecha Inicial del Contrato *"
                InputLabelProps={{ shrink: true }}
                value={convertForm.contractDate}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    contractDate: e.target.value,
                  })
                }
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CalendarMonthIcon
                        sx={{ color: "action.active", pointerEvents: "none" }}
                      />
                    </InputAdornment>
                  ),
                }}
                label="Fecha Final del Contrato *"
                InputLabelProps={{ shrink: true }}
                value={convertForm.lastContractDate}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    lastContractDate: e.target.value,
                  })
                }
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <UserAutocomplete
                type="coordinators"
                label="Coordinador a Cargo"
                value={coordinatorUser}
                onChange={(u) => {
                  setCoordinatorUser(u);
                  setConvertForm({
                    ...convertForm,
                    coordinatorInChargeId: u?.id || "",
                  });
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <UserAutocomplete
                type="commercials"
                label="Contacto Comercial Asignado"
                value={commercialUser}
                onChange={(u) => {
                  setCommercialUser(u);
                  setConvertForm({
                    ...convertForm,
                    commercialContactId: u?.id || "",
                  });
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Tipo de Administración"
                value={convertForm.administrationType}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    administrationType: e.target.value,
                  })
                }
              >
                <MenuItem value="INDIVIDUAL">Administración Individual</MenuItem>
                <MenuItem value="ENTERPRISE">Empresa de Administración</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Box>
      </ResponsiveFormDrawer>
    </>
  );
}
