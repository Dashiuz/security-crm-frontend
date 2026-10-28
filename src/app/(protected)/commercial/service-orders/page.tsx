"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Breadcrumbs,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  AssignmentOutlined,
  Send,
  CheckCircle,
  PlayCircleFilled,
  BuildOutlined,
  Security,
  LocalShipping,
  Shield,
  Close as CloseIcon,
  Delete as DeleteIcon,
  BusinessCenterOutlined,
  BadgeOutlined,
  FactCheck,
} from "@mui/icons-material";
import Link from "next/link";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import ClientAutocomplete, { ClientOption } from "@/components/common/ClientAutocomplete";
import { useNotification } from "@/providers/NotificationProvider";
import {
  commercialServiceOrdersApi,
  ServiceOrderDto,
  ServiceOrderStatus,
  ServiceOrderPositionPayload,
  ServiceOrderEquipmentPayload,
  CreateServiceOrderPayload,
} from "@/lib/api/commercial-service-orders";
import {
  commercialProposalsApi,
  CommercialProposalDto,
} from "@/lib/api/commercial-proposals";
import { ShiftScheduleType, WeaponModality } from "@/lib/api/commercial-settings";

const SHIFT_OPTIONS = [
  { value: ShiftScheduleType.SCHEDULE_2X2X2, label: "Turno 2x2x2 (24 Horas Rotativo)" },
  { value: ShiftScheduleType.SCHEDULE_3X3X2, label: "Turno 3x3x2 (24 Horas Relevos)" },
  { value: ShiftScheduleType.SCHEDULE_4X4X2, label: "Turno 4x4x2 (24 Horas Extendido)" },
  { value: ShiftScheduleType.SCHEDULE_5X1, label: "Turno 5x1 (12 Horas Lunes-Viernes)" },
  { value: ShiftScheduleType.SCHEDULE_5X2, label: "Turno 5x2 (12 Horas Hábil)" },
  { value: ShiftScheduleType.SCHEDULE_6X1, label: "Turno 6x1 (12 Horas Diurno/Nocturno)" },
  { value: ShiftScheduleType.SCHEDULE_6X2, label: "Turno 6x2 (12 Horas Especial)" },
  { value: ShiftScheduleType.SCHEDULE_7X1, label: "Turno 7x1 (Refuerzo Dominical)" },
  { value: ShiftScheduleType.SPECIAL_CUSTOM, label: "Turno Especial / A la Medida" },
];

const MODALITY_OPTIONS = [
  { value: WeaponModality.LETHAL_WEAPON, label: "Arma de Fuego Letal" },
  { value: WeaponModality.NO_WEAPON, label: "Sin Arma (Desarmado)" },
  { value: WeaponModality.NON_LETHAL_WEAPON, label: "Arma No Letal / Traumática" },
  { value: WeaponModality.CANINE_SUPPORT, label: "Manejador con Guía Canino" },
];

const STANDARD_EQUIPMENT_OPTIONS = [
  "Radio de Comunicación Motorola VHF/UHF",
  "Linterna Táctica LED Alta Potencia",
  "Detector de Metales Portátil Garrett",
  "Botiquín de Primeros Auxilios Reglamentario",
  "Chaleco Balístico Nivel IIIA",
  "Bastón de Mando Policial PR-24",
  "Pulsador de Pánico Inalámbrico",
  "Minuta de Guardia y Libro de Registro",
];

export default function ServiceOrdersPage() {
  const { showSuccess, showError } = useNotification();
  const [orders, setOrders] = useState<ServiceOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Detail Inspection Drawer State
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrderDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  // Create Service Order Drawer State
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [wonProposals, setWonProposals] = useState<CommercialProposalDto[]>([]);
  const [creationMode, setCreationMode] = useState<"PROPOSAL" | "DIRECT">("PROPOSAL");
  const [selectedProposalId, setSelectedProposalId] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);

  // Form Fields
  const [siteAddress, setSiteAddress] = useState("");
  const [siteCity, setSiteCity] = useState("Bogotá D.C.");
  const [sitePhone, setSitePhone] = useState("");
  const [installationDate, setInstallationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [contractEndDate, setContractEndDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split("T")[0]
  );
  const [empalmeDaysPrior, setEmpalmeDaysPrior] = useState<number>(3);
  const [legalRepName, setLegalRepName] = useState("");
  const [legalRepPhone, setLegalRepPhone] = useState("");
  const [administratorName, setAdministratorName] = useState("");
  const [administratorPhone, setAdministratorPhone] = useState("");
  const [administratorEmail, setAdministratorEmail] = useState("");
  const [totalMonthlyBeforeTax, setTotalMonthlyBeforeTax] = useState<number>(15000000);
  const [totalMonthlyWithTax, setTotalMonthlyWithTax] = useState<number>(15285000);
  const [operationalNotes, setOperationalNotes] = useState("");

  // Positions with Ideal Guard Profile
  const [positions, setPositions] = useState<ServiceOrderPositionPayload[]>([
    {
      id: "pos-1",
      positionTitle: "Recepción Principal",
      quantityGuards: 1,
      scheduleType: ShiftScheduleType.SCHEDULE_2X2X2,
      weaponModality: WeaponModality.LETHAL_WEAPON,
      netMonthlySalaryToPay: 2100000,
      minYearsExperiencePh: 2,
      preferredGender: "ANY",
      requiresCurrentCourse: true,
      requiresGalaUniform: false,
      specificProfileTraits: {
        minHeightMeters: 1.72,
        requiresMilitaryCardFirstClass: true,
        requiresPolygraph: true,
        academicLevel: "BACHILLER",
        specializationCourses: "CCTV, Manejo de Crisis",
      },
    },
  ]);

  // Equipment Items
  const [equipmentItems, setEquipmentItems] = useState<ServiceOrderEquipmentPayload[]>([
    {
      id: "eq-1",
      itemName: "Radio de Comunicación Motorola VHF/UHF",
      quantity: 2,
      isMandatoryOnSite: true,
      deliveryStatus: "PENDING_WAREHOUSE",
      notes: "Cargador y clip de cinturón incluidos",
    },
    {
      id: "eq-2",
      itemName: "Linterna Táctica LED Alta Potencia",
      quantity: 2,
      isMandatoryOnSite: true,
      deliveryStatus: "PENDING_WAREHOUSE",
    },
    {
      id: "eq-3",
      itemName: "Detector de Metales Portátil Garrett",
      quantity: 1,
      isMandatoryOnSite: true,
      deliveryStatus: "PENDING_WAREHOUSE",
    },
  ]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== "ALL") params.status = statusFilter;

      const res = await commercialServiceOrdersApi.getServiceOrders(params);
      setOrders(res.data || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar las órdenes de servicio");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  const fetchWonProposals = useCallback(async () => {
    try {
      const res = await commercialProposalsApi.getProposals({ status: "WON", take: 50 });
      setWonProposals(res.data || []);
    } catch (err) {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchWonProposals();
  }, [fetchOrders, fetchWonProposals]);

  // Handle Dispatch to 9 Internal Departments
  const handleDispatch = async (id: string) => {
    try {
      setDispatchingId(id);
      await commercialServiceOrdersApi.dispatchOrder(id, {
        dispatchNotes: "Despacho inmediato multidepartamental confirmado por Dirección Comercial.",
      });
      showSuccess("¡Orden de servicio despachada exitosamente a los 9 departamentos internos!");
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        const updated = await commercialServiceOrdersApi.getServiceOrderById(id);
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      showError(`Error al despachar orden: ${err.message}`);
    } finally {
      setDispatchingId(null);
    }
  };

  // When a WON proposal is selected in the creation drawer, autofill data
  const applyProposalData = useCallback((prop: CommercialProposalDto) => {
    setSelectedProposalId(prop.id);
    if (prop.client) {
      setSelectedClient({
        id: prop.client.id,
        name: prop.client.name,
        nit: prop.client.nit,
      });
    }
    setTotalMonthlyBeforeTax(Number(prop.subtotalMonthlyAfterDisc || prop.subtotalMonthlyPreDisc || 0));
    setTotalMonthlyWithTax(Number(prop.totalMonthlyWithTax || 0));

    if (prop.items && prop.items.length > 0) {
      setPositions(
        prop.items.map((item: any, idx: number) => ({
          id: `pos-${idx + 1}`,
          positionTitle: item.positionTitle || "Puesto de Vigilancia",
          quantityGuards: item.quantity || 1,
          scheduleType: (item.scheduleType as ShiftScheduleType) || ShiftScheduleType.SCHEDULE_2X2X2,
          weaponModality: (item.weaponModality as WeaponModality) || WeaponModality.LETHAL_WEAPON,
          netMonthlySalaryToPay: 2100000,
          minYearsExperiencePh: 2,
          preferredGender: "ANY",
          requiresCurrentCourse: true,
          requiresGalaUniform: false,
          specificProfileTraits: {
            minHeightMeters: 1.72,
            requiresMilitaryCardFirstClass: true,
            requiresPolygraph: true,
            academicLevel: "BACHILLER",
            specializationCourses: "CCTV, Control de Accesos",
          },
        }))
      );
    }
  }, []);

  const handleProposalSelection = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    const prop = wonProposals.find((p) => p.id === proposalId);
    if (prop) {
      applyProposalData(prop);
    } else {
      commercialProposalsApi
        .getProposalById(proposalId)
        .then((loaded) => {
          if (loaded) applyProposalData(loaded);
        })
        .catch(() => { });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const fromProposalId = params.get("fromProposalId");
      if (fromProposalId) {
        commercialProposalsApi
          .getProposalById(fromProposalId)
          .then((prop) => {
            if (prop) {
              setWonProposals((prev) => {
                if (prev.some((p) => p.id === prop.id)) return prev;
                return [prop, ...prev];
              });
              setCreationMode("PROPOSAL");
              applyProposalData(prop);
              setCreateDrawerOpen(true);
            }
          })
          .catch(() => { });
      }
    }
  }, [applyProposalData]);

  // Add Position in Create Drawer
  const handleAddPosition = () => {
    const newPos: ServiceOrderPositionPayload = {
      id: `pos-${Date.now()}`,
      positionTitle: "Vigilante de Ronda Perimetral",
      quantityGuards: 1,
      scheduleType: ShiftScheduleType.SCHEDULE_2X2X2,
      weaponModality: WeaponModality.NO_WEAPON,
      netMonthlySalaryToPay: 2000000,
      minYearsExperiencePh: 1,
      preferredGender: "ANY",
      requiresCurrentCourse: true,
      requiresGalaUniform: false,
      specificProfileTraits: {
        minHeightMeters: 1.7,
        requiresMilitaryCardFirstClass: true,
        requiresPolygraph: false,
        academicLevel: "BACHILLER",
        specializationCourses: "Rondas e Inspección",
      },
    };
    setPositions((prev) => [...prev, newPos]);
  };

  const handleUpdatePosition = (idx: number, field: keyof ServiceOrderPositionPayload, val: any) => {
    setPositions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleUpdateProfileTrait = (idx: number, traitField: string, val: any) => {
    setPositions((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        specificProfileTraits: {
          ...(copy[idx].specificProfileTraits || {}),
          [traitField]: val,
        },
      };
      return copy;
    });
  };

  const handleRemovePosition = (idx: number) => {
    if (positions.length === 1) {
      showError("Debe mantener al menos una posición en la orden de servicio.");
      return;
    }
    setPositions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Add Equipment Item in Create Drawer
  const handleAddEquipment = () => {
    const newEq: ServiceOrderEquipmentPayload = {
      id: `eq-${Date.now()}`,
      itemName: "Radio de Comunicación Motorola VHF/UHF",
      quantity: 1,
      isMandatoryOnSite: true,
      deliveryStatus: "PENDING_WAREHOUSE",
    };
    setEquipmentItems((prev) => [...prev, newEq]);
  };

  const handleUpdateEquipment = (idx: number, field: keyof ServiceOrderEquipmentPayload, val: any) => {
    setEquipmentItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveEquipment = (idx: number) => {
    setEquipmentItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Order Creation to Backend
  const handleCreateOrder = async () => {
    if (!selectedClient?.id) {
      showError("Por favor seleccione un cliente para la orden de servicio.");
      return;
    }
    if (!siteAddress.trim()) {
      showError("Por favor indique la dirección física del puesto / sede.");
      return;
    }
    if (positions.length === 0) {
      showError("Debe configurar al menos un puesto de seguridad.");
      return;
    }

    setCreating(true);
    try {
      const payload: CreateServiceOrderPayload = {
        clientId: selectedClient.id,
        proposalId: creationMode === "PROPOSAL" ? selectedProposalId || undefined : undefined,
        installationDate: installationDate || new Date().toISOString().split("T")[0],
        contractEndDate: contractEndDate || new Date().toISOString().split("T")[0],
        empalmeDaysPrior: Number(empalmeDaysPrior) || 3,
        siteAddress: siteAddress.trim(),
        siteCity: siteCity.trim() || "Bogotá D.C.",
        sitePhone: sitePhone.trim() || undefined,
        legalRepName: legalRepName.trim() || "Representante Legal Registrado",
        legalRepPhone: legalRepPhone.trim() || undefined,
        administratorName: administratorName.trim() || "Administrador del Inmueble",
        administratorPhone: administratorPhone.trim() || undefined,
        administratorEmail: administratorEmail.trim() || undefined,
        totalMonthlyBeforeTax: Number(totalMonthlyBeforeTax) || 0,
        totalMonthlyWithTax: Number(totalMonthlyWithTax) || 0,
        operationalNotes: operationalNotes.trim() || undefined,
        positions: positions.map((p) => ({
          positionTitle: p.positionTitle,
          quantityGuards: Number(p.quantityGuards) || 1,
          scheduleType: p.scheduleType,
          weaponModality: p.weaponModality,
          netMonthlySalaryToPay: Number(p.netMonthlySalaryToPay) || 0,
          minYearsExperiencePh: Number(p.minYearsExperiencePh) || 1,
          preferredGender: p.preferredGender || "ANY",
          requiresCurrentCourse: Boolean(p.requiresCurrentCourse),
          requiresGalaUniform: Boolean(p.requiresGalaUniform),
          specificProfileTraits: p.specificProfileTraits,
        })),
        equipment: equipmentItems.map((e) => ({
          itemName: e.itemName,
          quantity: Number(e.quantity) || 1,
          isMandatoryOnSite: Boolean(e.isMandatoryOnSite),
          deliveryStatus: e.deliveryStatus || "PENDING_WAREHOUSE",
          notes: e.notes,
        })),
      };

      const created = await commercialServiceOrdersApi.createServiceOrder(payload);
      showSuccess(
        `¡Orden ${created.orderFolioCode} creada con Código OMEGA ${created.omegaCode}!`
      );
      setCreateDrawerOpen(false);
      await fetchOrders();
    } catch (err: any) {
      showError(err.message || "Error al emitir orden de servicio.");
    } finally {
      setCreating(false);
    }
  };

  const getStatusChip = (status: ServiceOrderStatus) => {
    switch (status) {
      case "ISSUED_DISPATCHED":
        return <Chip label="Despachada a 9 Áreas" size="small" color="primary" sx={{ fontWeight: 700 }} />;
      case "IN_OPERATION":
        return <Chip label="En Operación Activa" size="small" color="success" sx={{ fontWeight: 700 }} />;
      case "DRAFT_CONFIGURING":
        return <Chip label="Borrador / Alistamiento" size="small" color="warning" sx={{ fontWeight: 700 }} />;
      case "CANCELLED":
        return <Chip label="Cancelada" size="small" color="error" sx={{ fontWeight: 700 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 1.5, fontSize: "0.85rem" }}>
        <Typography color="inherit">Dirección Comercial</Typography>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>
          Órdenes de Servicio y Despacho
        </Typography>
      </Breadcrumbs>

      {/* Hero Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
            Órdenes de Servicio e Instalación Operativa
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Código OMEGA, Perfil del Guarda Ideal, Dotación Física y Despacho Coordinado a 9 Departamentos.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Link href="/commercial/proposals" style={{ textDecoration: "none" }}>
            <Button variant="outlined" size="medium" sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
              Ver Propuestas Ganadas
            </Button>
          </Link>
          <Button
            variant="contained"
            color="primary"
            size="medium"
            startIcon={<AddIcon />}
            onClick={() => setCreateDrawerOpen(true)}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 2.5 }}
          >
            Nueva Orden de Servicio
          </Button>
        </Stack>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2.5, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                Órdenes Emitidas
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", my: 0.75 }}>
                {orders.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total órdenes registradas en sistema
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2.5, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                Puestos Despachados
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.main", my: 0.75 }}>
                {orders.filter((o) => o.status === "ISSUED_DISPATCHED" || o.status === "IN_OPERATION").length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Notificados a las 9 áreas internas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2.5, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                Puestos Activos OMEGA
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "success.main", my: 0.75 }}>
                {orders.filter((o) => o.status === "IN_OPERATION").length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                En servicio con supervisión en vivo
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2.5, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                En Alistamiento (Borrador)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "warning.main", my: 0.75 }}>
                {orders.filter((o) => o.status === "DRAFT_CONFIGURING").length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pendientes por despacho a bodega / RRHH
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems="center">
          <TextField
            placeholder="Buscar por código OS, código OMEGA o dirección..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: "100%", sm: 380 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {[
              { id: "ALL", label: "Todas" },
              { id: "DRAFT_CONFIGURING", label: "En Alistamiento" },
              { id: "ISSUED_DISPATCHED", label: "Despachadas" },
              { id: "IN_OPERATION", label: "En Operación" },
            ].map((st) => (
              <Chip
                key={st.id}
                label={st.label}
                onClick={() => setStatusFilter(st.id)}
                color={statusFilter === st.id ? "primary" : "default"}
                variant={statusFilter === st.id ? "filled" : "outlined"}
                sx={{ fontWeight: 600, fontSize: "0.75rem" }}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Orders Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: "neutral.50" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Código OS</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Código OMEGA</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Cliente / Puesto</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fecha Instalación</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Puestos / Guardas</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Consultando órdenes de servicio...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <AssignmentOutlined sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    No hay órdenes de servicio emitidas
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: "auto", mt: 0.5 }}>
                    Haga clic en &quot;+ Nueva Orden de Servicio&quot; para crear una orden a partir de una propuesta ganada o registrar un puesto directamente.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                    {order.orderFolioCode}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<Security fontSize="small" />}
                      label={order.omegaCode}
                      size="small"
                      color="secondary"
                      sx={{ fontWeight: 800, fontFamily: "monospace" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {order.client?.name || order.siteAddress}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {order.siteCity} • {order.siteAddress}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(order.installationDate).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {order.positions?.length || 0} Puestos ({order.positions?.reduce((a, b) => a + (b.quantityGuards || 0), 0) || 0} Guardias)
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{getStatusChip(order.status)}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailOpen(true);
                        }}
                        sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
                      >
                        Inspeccionar
                      </Button>
                      {order.status === "DRAFT_CONFIGURING" && (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<Send />}
                          disabled={dispatchingId === order.id}
                          onClick={() => handleDispatch(order.id)}
                          sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
                        >
                          {dispatchingId === order.id ? <CircularProgress size={16} /> : "Despachar"}
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DRAWER: NUEVA ORDEN DE SERVICIO (ZERO-DIALOG MANDATE) */}
      <ResponsiveFormDrawer
        open={createDrawerOpen}
        onClose={() => !creating && setCreateDrawerOpen(false)}
        title="Nueva Orden de Servicio e Instalación Operativa"
        subtitle="Generación de Código OMEGA, Perfil de Guarda Ideal y Dotación de Bodega"
        isSubmitting={creating}
        submitButtonText="Crear y Generar Código OMEGA"
        formId="create-service-order-form"
      >
        <Box
          component="form"
          id="create-service-order-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateOrder();
          }}
        >
          <Grid container spacing={3}>
            {/* Origen de la Orden */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", color: "primary.main", mb: 1 }}>
                1. Origen de la Orden de Servicio
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Button
                  variant={creationMode === "PROPOSAL" ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setCreationMode("PROPOSAL")}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                >
                  Desde Propuesta Ganada/Aprobada
                </Button>
                <Button
                  variant={creationMode === "DIRECT" ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setCreationMode("DIRECT")}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                >
                  Registro Directo (Cliente Activo)
                </Button>
              </Stack>

              {creationMode === "PROPOSAL" ? (
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Seleccione la Propuesta Ganada *"
                  value={selectedProposalId}
                  onChange={(e) => handleProposalSelection(e.target.value)}
                  helperText={
                    wonProposals.length === 0
                      ? "No hay propuestas con estado GANADA disponibles actualmente."
                      : "Al seleccionar una propuesta se precargarán automáticamente cliente, puestos y montos."
                  }
                >
                  {wonProposals.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.proposalFolioCode} — {p.client?.name || "Cliente"} ($
                      {Number(p.totalMonthlyWithTax || 0).toLocaleString("es-CO")})
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <ClientAutocomplete
                  value={selectedClient}
                  onChange={setSelectedClient}
                  label="Seleccionar Cliente / Conjunto *"
                  required
                />
              )}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

            {/* Datos de la Sede y Fechas */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", color: "primary.main", mb: 1.5 }}>
                2. Ubicación de la Sede y Fechas Operativas
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Dirección Física del Puesto / Sede *"
                    placeholder="ej. Calle 127 # 15-40, Torre Norte"
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Ciudad de Operación *"
                    value={siteCity}
                    onChange={(e) => setSiteCity(e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Fecha de Inicio / Instalación *"
                    InputLabelProps={{ shrink: true }}
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Fecha de Finalización *"
                    InputLabelProps={{ shrink: true }}
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Días Previos de Empalme"
                    value={empalmeDaysPrior}
                    onChange={(e) => setEmpalmeDaysPrior(Number(e.target.value) || 0)}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

            {/* Puestos y Perfil del Guarda Ideal */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", color: "primary.main" }}>
                    3. Puestos y Perfil del Guarda Ideal (Recursos Humanos)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Estatura, libreta militar, experiencia, cursos especiales y prueba de polígrafo
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddPosition}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                >
                  Agregar Puesto
                </Button>
              </Box>

              <Stack spacing={2.5}>
                {positions.map((pos, idx) => (
                  <Paper
                    key={pos.id || idx}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2, bgcolor: "neutral.50" }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        Puesto #{idx + 1}: {pos.positionTitle}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemovePosition(idx)}
                        disabled={positions.length === 1}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 7 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Nombre / Ubicación del Puesto *"
                          value={pos.positionTitle}
                          onChange={(e) => handleUpdatePosition(idx, "positionTitle", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Guardias *"
                          value={pos.quantityGuards}
                          onChange={(e) => handleUpdatePosition(idx, "quantityGuards", Number(e.target.value))}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Salario Neto *"
                          value={pos.netMonthlySalaryToPay}
                          onChange={(e) =>
                            handleUpdatePosition(idx, "netMonthlySalaryToPay", Number(e.target.value))
                          }
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Esquema de Turno *"
                          value={pos.scheduleType}
                          onChange={(e) => handleUpdatePosition(idx, "scheduleType", e.target.value)}
                        >
                          {SHIFT_OPTIONS.map((sh) => (
                            <MenuItem key={sh.value} value={sh.value}>
                              {sh.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Modalidad de Arma *"
                          value={pos.weaponModality}
                          onChange={(e) => handleUpdatePosition(idx, "weaponModality", e.target.value)}
                        >
                          {MODALITY_OPTIONS.map((m) => (
                            <MenuItem key={m.value} value={m.value}>
                              {m.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      {/* Parámetros del Perfil Ideal */}
                      <Grid size={{ xs: 12 }}>
                        <Paper
                          variant="outlined"
                          sx={{ p: 2, borderRadius: 2, bgcolor: "background.paper", borderColor: "primary.light" }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", textTransform: "uppercase", display: "block", mb: 1 }}>
                            Parámetros del Perfil del Guarda Ideal
                          </Typography>
                          <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Estatura Mínima (m)"
                                inputProps={{ step: "0.01", min: "1.50", max: "2.10" }}
                                value={pos.specificProfileTraits?.minHeightMeters || 1.72}
                                onChange={(e) =>
                                  handleUpdateProfileTrait(idx, "minHeightMeters", Number(e.target.value))
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Experiencia Mín (Años)"
                                value={pos.minYearsExperiencePh || 2}
                                onChange={(e) =>
                                  handleUpdatePosition(idx, "minYearsExperiencePh", Number(e.target.value))
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Cursos de Especialización"
                                placeholder="ej. CCTV, Primeros Auxilios, Control Masas"
                                value={pos.specificProfileTraits?.specializationCourses || ""}
                                onChange={(e) =>
                                  handleUpdateProfileTrait(idx, "specializationCourses", e.target.value)
                                }
                              />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={Boolean(pos.specificProfileTraits?.requiresMilitaryCardFirstClass)}
                                    onChange={(e) =>
                                      handleUpdateProfileTrait(
                                        idx,
                                        "requiresMilitaryCardFirstClass",
                                        e.target.checked
                                      )
                                    }
                                  />
                                }
                                label={<Typography variant="body2">Libreta Militar 1ra Clase</Typography>}
                              />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={Boolean(pos.specificProfileTraits?.requiresPolygraph)}
                                    onChange={(e) =>
                                      handleUpdateProfileTrait(idx, "requiresPolygraph", e.target.checked)
                                    }
                                  />
                                }
                                label={<Typography variant="body2">Prueba de Polígrafo</Typography>}
                              />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={Boolean(pos.requiresGalaUniform)}
                                    onChange={(e) =>
                                      handleUpdatePosition(idx, "requiresGalaUniform", e.target.checked)
                                    }
                                  />
                                }
                                label={<Typography variant="body2">Uniforme de Gala</Typography>}
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

            {/* Equipamiento y Dotación */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", color: "primary.main" }}>
                    4. Equipamiento y Dotación para Almacén / Bodega
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Radios, linternas, detectores y accesorios reglamentarios para el puesto
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddEquipment}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                >
                  Agregar Equipo
                </Button>
              </Box>

              <Stack spacing={1.5}>
                {equipmentItems.map((eq, idx) => (
                  <Paper key={eq.id || idx} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Grid container spacing={1.5} alignItems="center">
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Equipo / Dotación *"
                          value={eq.itemName}
                          onChange={(e) => handleUpdateEquipment(idx, "itemName", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 4, sm: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Cantidad"
                          value={eq.quantity}
                          onChange={(e) => handleUpdateEquipment(idx, "quantity", Number(e.target.value))}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={Boolean(eq.isMandatoryOnSite)}
                              onChange={(e) =>
                                handleUpdateEquipment(idx, "isMandatoryOnSite", e.target.checked)
                              }
                            />
                          }
                          label={<Typography variant="caption">Obligatorio en Sede</Typography>}
                        />
                      </Grid>
                      <Grid size={{ xs: 2, sm: 1 }} sx={{ textAlign: "right" }}>
                        <IconButton size="small" color="error" onClick={() => handleRemoveEquipment(idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </ResponsiveFormDrawer>

      {/* DRAWER: INSPECCIÓN DETALLADA 360° (ZERO-DIALOG MANDATE) */}
      <ResponsiveFormDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selectedOrder ? `Orden ${selectedOrder.orderFolioCode} — OMEGA ${selectedOrder.omegaCode}` : "Detalle de Orden"}
        subtitle="Inspección de puestos, perfil de guardias, dotación física y despacho multidepartamental"
        isSubmitting={dispatchingId !== null}
        submitButtonText={
          selectedOrder?.status === "DRAFT_CONFIGURING"
            ? "Despachar a 9 Departamentos"
            : "Despacho Confirmado"
        }
        formId="detail-service-order-form"
      >
        {selectedOrder && (
          <Box
            component="form"
            id="detail-service-order-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedOrder.status === "DRAFT_CONFIGURING") {
                handleDispatch(selectedOrder.id);
              }
            }}
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "neutral.50" }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary">Código OMEGA Oficial</Typography>
                      <Typography variant="h6" fontWeight={800} color="secondary.main" sx={{ fontFamily: "monospace" }}>
                        {selectedOrder.omegaCode}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary">Estado de la Orden</Typography>
                      <Box sx={{ mt: 0.5 }}>{getStatusChip(selectedOrder.status)}</Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary">Fecha de Inicio de Servicio</Typography>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {new Date(selectedOrder.installationDate).toLocaleDateString("es-CO", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Puestos y Perfiles */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", color: "primary.main", mb: 1 }}>
                  Puestos Operativos y Requerimientos de Personal ({selectedOrder.positions?.length || 0})
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "neutral.50" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Puesto / Cargo</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Turno</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Arma</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Cant.</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Perfil Ideal Exigido</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.positions?.map((p: any) => (
                        <TableRow key={p.id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{p.positionTitle}</TableCell>
                          <TableCell>{p.scheduleType}</TableCell>
                          <TableCell>{p.weaponModality}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{p.quantityGuards}</TableCell>
                          <TableCell>
                            <Typography variant="caption" display="block">
                              Estatura: {p.specificProfileTraits?.minHeightMeters || 1.70}m • Exp: {p.minYearsExperiencePh || 1}a
                            </Typography>
                            {p.specificProfileTraits?.requiresMilitaryCardFirstClass && (
                              <Chip size="small" label="Libreta 1ra" color="primary" variant="outlined" sx={{ height: 18, fontSize: "0.65rem", mr: 0.5 }} />
                            )}
                            {p.specificProfileTraits?.requiresPolygraph && (
                              <Chip size="small" label="Polígrafo" color="warning" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Equipamiento */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", color: "primary.main", mb: 1 }}>
                  Equipamiento y Dotación ({selectedOrder.equipment?.length || 0})
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "neutral.50" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Equipo / Dotación</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Cantidad</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Obligatorio</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Estado Bodega</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.equipment?.map((eq: any) => (
                        <TableRow key={eq.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{eq.itemName}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{eq.quantity}</TableCell>
                          <TableCell>{eq.isMandatoryOnSite ? "SÍ" : "NO"}</TableCell>
                          <TableCell>
                            <Chip size="small" label={eq.deliveryStatus} variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Logs de Despacho */}
              {selectedOrder.dispatchLogs && selectedOrder.dispatchLogs.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", color: "primary.main", mb: 1 }}>
                    Bitácora de Despacho a los 9 Departamentos ({selectedOrder.dispatchLogs.length} notificaciones)
                  </Typography>
                  <Stack spacing={1}>
                    {selectedOrder.dispatchLogs.map((log: any) => (
                      <Paper
                        key={log.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <CheckCircle color="success" fontSize="small" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {log.department}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Destinatario: {log.recipientEmail}
                            </Typography>
                          </Box>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(log.dispatchedAt).toLocaleString("es-CO")}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </ResponsiveFormDrawer>
    </Box>
  );
}
