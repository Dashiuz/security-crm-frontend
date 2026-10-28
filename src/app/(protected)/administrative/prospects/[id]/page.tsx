"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Breadcrumbs,
  Link,
  Chip,
  Paper,
  Divider,
  CircularProgress,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  FormGroup,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert
} from "@mui/material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import ChameleonPdfPreview from "@/app/(protected)/commercial/proposals/components/ChameleonPdfPreview";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Handshake as HandshakeIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  CalendarMonth as CalendarMonthIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Groups as GroupsIcon,
  VideoCall as VideoCallIcon,
  Engineering as EngineeringIcon,
  EventRepeat as RecaptationIcon,
  HistoryEdu as TimelineIcon,
  ReceiptLong as ReceiptLongIcon,
  PictureAsPdf as PdfIcon,
  EditOutlined as EditIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Print as PrintIcon,
  Close as CloseIcon,
  FlashOn as BoltIcon,
  CheckCircleOutline as CheckCircleIcon,
} from "@mui/icons-material";
import UserAutocomplete, { UserOption } from "@/components/common/UserAutocomplete";
import {
  commercialProposalsApi,
  CommercialProposalDto,
  ProposalStatus,
  PnlHealthStatus,
} from "@/lib/api/commercial-proposals";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";
import {
  commercialCrmApi,
  CommercialFollowUpDto,
  InteractionChannel,
  FollowUpMilestoneStatus,
  DealLossReasonCategory,
  CreateFollowUpPayload,
} from "@/lib/api/commercial-crm";

const INTERACTION_CHANNEL_CONFIG: Record<
  InteractionChannel,
  { label: string; icon: any }
> = {
  PHONE_CALL: { label: "Llamada Telefónica", icon: PhoneIcon },
  WHATSAPP_MESSAGE: { label: "Mensaje WhatsApp", icon: WhatsAppIcon },
  EMAIL: { label: "Correo Electrónico", icon: EmailIcon },
  IN_PERSON_MEETING: { label: "Reunión Presencial", icon: GroupsIcon },
  VIDEO_CONFERENCE: { label: "Videoconferencia", icon: VideoCallIcon },
  TECHNICAL_VISIT: { label: "Visita Técnica", icon: EngineeringIcon },
};

const FOLLOW_UP_STATUS_CONFIG: Record<
  FollowUpMilestoneStatus,
  { label: string; color: "warning" | "success" | "error" | "default" }
> = {
  PENDING: { label: "En Proceso / Seguimiento", color: "warning" },
  WON: { label: "Ganado / Cerrado", color: "success" },
  LOST: { label: "Perdido vs Competencia", color: "error" },
  REJECTED: { label: "Rechazado / Cancelado", color: "default" },
};

const LOSS_REASON_LABELS: Record<DealLossReasonCategory, string> = {
  COMPETITOR_PRICE: "Precio inferior de la competencia",
  AUTOMATIC_RENEWAL: "Renovación automática del contrato anterior",
  PERMANENCE_CLAUSE: "Cláusula de permanencia con proveedor actual",
  HIGHER_VALUE_ADDED: "Mayor valor agregado ofrecido por competidor",
  BUDGET_LIMITATION: "Limitación presupuestal del cliente",
  PREFERS_CONCIERGE: "Preferencia por conserjería no armada",
  NO_DECISION_CANCELLED: "Proceso cancelado / Sin decisión del consejo",
  FAILED_COMPLIANCE: "No superó estudio de cumplimiento o SARLAFT",
  OTHER: "Otro motivo justificado",
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface TowerInput {
  towerName: string;
  floorsAmount: number;
  apartmentsPerFloor: number;
  elevators: number;
}

export default function ProspectDetailPage() {
  const params = useParams();
  const prospectId = params.id as string;
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prospect, setProspect] = useState<any | null>(null);

  // Users for Assignment
  const [coordinatorUser, setCoordinatorUser] = useState<UserOption | null>(null);
  const [commercialUser, setCommercialUser] = useState<UserOption | null>(null);

  // Dirty state tracking
  const [isDirty, setIsDirty] = useState(false);

  // Tab 0: General Info
  const [generalForm, setGeneralForm] = useState({
    name: "",
    sector: "RESIDENTIAL",
    nit: "",
    address: "",
    phone: "",
    email: "",
    city: "Bogotá",
    commune: "",
    neighborhood: "",
    cai: "",
    quadrant: "",
    quadrantPhone: "",
    observations: "",
  });

  // Tab 1: Structure & Amenities
  const [structureType, setStructureType] = useState<string>("BUILDING_CLUSTER");
  const [floorsAmount, setFloorsAmount] = useState<number>(5);
  const [apartmentsPerFloor, setApartmentsPerFloor] = useState<number>(4);
  const [singleElevators, setSingleElevators] = useState<number>(1);
  const [towers, setTowers] = useState<TowerInput[]>([
    { towerName: "Torre 1", floorsAmount: 10, apartmentsPerFloor: 4, elevators: 2 },
  ]);
  const [unitsAmount, setUnitsAmount] = useState<number>(50);
  const [housePrefix, setHousePrefix] = useState<string>("Casa");
  const [commercialStoresAmount, setCommercialStoresAmount] = useState<number>(0);

  const [entries, setEntries] = useState({
    mainEntry: true,
    separateVehicleEntryExit: false,
    sharedVehicleEntryExit: true,
    exclusivePetEntry: false,
    exclusiveDeliveryEntry: false,
    sharedPetDeliveryEntry: true,
  });
  const [entryImages, setEntryImages] = useState<Record<string, string>>({});

  const [amenities, setAmenities] = useState({
    hasSocialRoom: false,
    socialRoomAmount: 0,
    hasGym: false,
    gymAmount: 0,
    hasPool: false,
    poolAmount: 0,
    hasTennisCourt: false,
    tennisCourtAmount: 0,
    hasBasketballCourt: false,
    basketballCourtAmount: 0,
    hasFootballCourt: false,
    footballCourtAmount: 0,
    hasVolleyballCourt: false,
    volleyballCourtAmount: 0,
    hasSquashCourt: false,
    squashCourtAmount: 0,
    hasPlayground: false,
    playgroundAmount: 0,
    hasParking: true,
    parkingAmount: 50,
    hasGuestParking: true,
    guestParkingAmount: 15,
    hasBicycleRack: true,
    bicycleRackAmount: 20,
    hasStorageRoom: false,
    storageRoomAmount: 0,
  });

  // Convert Contract Dialog State
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertForm, setConvertForm] = useState({
    contractNumber: "",
    contractDate: new Date().toISOString().split("T")[0],
    lastContractDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split("T")[0],
    renewedContract: false,
    coordinatorInChargeId: "",
    commercialContactId: "",
    administrationType: "INDIVIDUAL",
  });

  // Quotations & Commercial Dossier State (SPEC-ADM-027)
  const [proposals, setProposals] = useState<CommercialProposalDto[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [previewProposal, setPreviewProposal] = useState<CommercialProposalDto | null>(null);
  const [wonTargetProposal, setWonTargetProposal] = useState<CommercialProposalDto | null>(null);
  const [transitioningWon, setTransitioningWon] = useState(false);

  const fetchProposals = useCallback(async () => {
    if (!prospectId) return;
    setLoadingProposals(true);
    try {
      const res = await commercialProposalsApi.getProposals({ clientId: prospectId, take: 50 });
      setProposals(res.data || []);
    } catch {
      // non-blocking
    } finally {
      setLoadingProposals(false);
    }
  }, [prospectId]);

  const handleConfirmWon = async (targetProposalId: string, createServiceOrderNow: boolean) => {
    try {
      setTransitioningWon(true);
      await commercialProposalsApi.updateStatus(targetProposalId, "WON");
      showSuccess("Propuesta aprobada y marcada como GANADA.");

      if (createServiceOrderNow) {
        setWonTargetProposal(null);
        router.push(`/commercial/service-orders?fromProposalId=${targetProposalId}`);
      } else {
        setWonTargetProposal(null);
        await fetchProposals();
      }
    } catch {
      showError("Error al marcar la propuesta como ganada.");
    } finally {
      setTransitioningWon(false);
    }
  };

  // CRM Follow-up State (SPEC-ADM-022)
  const [followUps, setFollowUps] = useState<CommercialFollowUpDto[]>([]);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [followUpDrawerOpen, setFollowUpDrawerOpen] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [followUpForm, setFollowUpForm] = useState<CreateFollowUpPayload>({
    clientId: prospectId,
    interactionDate: new Date().toISOString().split("T")[0],
    contactChannel: "PHONE_CALL",
    contactPersonName: "",
    contactPersonRole: "Administrador / Miembro de Consejo",
    managementSummary: "",
    nextContactDate: "",
    statusAfterFollowUp: "PENDING",
    lossReasonCategory: "COMPETITOR_PRICE",
    lossReasonDescription: "",
    winningCompetitorName: "",
    competitorPriceQuoted: 0,
    competitorGuardsSalary: 0,
  });

  const fetchFollowUps = async () => {
    setLoadingFollowUps(true);
    try {
      const data = await commercialCrmApi.getFollowUpsByClient(prospectId);
      setFollowUps(data);
    } catch (err: any) {
      showError(err.message || "Error al cargar la bitácora comercial");
    } finally {
      setLoadingFollowUps(false);
    }
  };

  const handleSaveFollowUp = async () => {
    if (!followUpForm.contactPersonName || !followUpForm.managementSummary) {
      showError("Por favor complete el nombre de la persona contactada y el resumen de la gestión");
      return;
    }
    setSavingFollowUp(true);
    try {
      await commercialCrmApi.createFollowUp({
        ...followUpForm,
        clientId: prospectId,
        competitorPriceQuoted: Number(followUpForm.competitorPriceQuoted) || undefined,
        competitorGuardsSalary: Number(followUpForm.competitorGuardsSalary) || undefined,
      });
      showSuccess("Gestión comercial registrada en la bitácora exitosamente");
      setFollowUpDrawerOpen(false);
      setFollowUpForm({
        clientId: prospectId,
        interactionDate: new Date().toISOString().split("T")[0],
        contactChannel: "PHONE_CALL",
        contactPersonName: "",
        contactPersonRole: "Administrador / Miembro de Consejo",
        managementSummary: "",
        nextContactDate: "",
        statusAfterFollowUp: "PENDING",
        lossReasonCategory: "COMPETITOR_PRICE",
        lossReasonDescription: "",
        winningCompetitorName: "",
        competitorPriceQuoted: 0,
        competitorGuardsSalary: 0,
      });
      await fetchFollowUps();
      await fetchProspectData();
    } catch (err: any) {
      showError(err.message || "Error al registrar seguimiento comercial");
    } finally {
      setSavingFollowUp(false);
    }
  };

  const handleDeleteFollowUp = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta gestión comercial?")) return;
    try {
      await commercialCrmApi.deleteFollowUp(id);
      showSuccess("Gestión comercial eliminada");
      await fetchFollowUps();
    } catch (err: any) {
      showError(err.message || "Error al eliminar seguimiento comercial");
    }
  };

  const fetchProspectData = async () => {
    setLoading(true);
    try {
      const prospectData = await HttpClient.get<any>(`/prospect/${prospectId}`);

      setProspect(prospectData);

      const gen = {
        name: prospectData.name || "",
        sector: prospectData.sector || "RESIDENTIAL",
        nit: prospectData.nit || "",
        address: prospectData.address || "",
        phone: prospectData.phone || "",
        email: prospectData.email || "",
        city: prospectData.city || "Bogotá",
        commune: prospectData.commune || "",
        neighborhood: prospectData.neighborhood || "",
        cai: prospectData.cai || "",
        quadrant: prospectData.quadrant || "",
        quadrantPhone: prospectData.quadrantPhone || "",
        observations: prospectData.observations || "",
      };
      setGeneralForm(gen);

      const props = prospectData.clientProperties || {};
      const sType = props.structureType || "BUILDING_CLUSTER";
      setStructureType(sType);
      setUnitsAmount(props.unitsAmount || 50);
      setCommercialStoresAmount(props.commercialStoresAmount || 0);

      if (prospectData.towers && prospectData.towers.length > 0) {
        setTowers(
          prospectData.towers.map((t: any) => ({
            towerName: t.towerName || "Torre",
            floorsAmount: t.floorsAmount || 10,
            apartmentsPerFloor: t.apartmentsPerFloor || 4,
            elevators: t.elevators || 1,
          })),
        );
        if (sType === "SINGLE_BUILDING") {
          setFloorsAmount(prospectData.towers[0]?.floorsAmount || 5);
          setApartmentsPerFloor(prospectData.towers[0]?.apartmentsPerFloor || 4);
          setSingleElevators(prospectData.towers[0]?.elevators || 1);
        }
      } else {
        setFloorsAmount(5);
        setApartmentsPerFloor(4);
        setSingleElevators(1);
      }

      if (props.entriesDescription) {
        setEntries((prev) => ({ ...prev, ...props.entriesDescription }));
      }
      if (props.entriesMediaFiles) {
        setEntryImages(props.entriesMediaFiles);
      }

      const amen = {
        hasSocialRoom: Boolean(props.hasSocialRoom),
        socialRoomAmount: props.socialRoomAmount || 0,
        hasGym: Boolean(props.hasGym),
        gymAmount: props.gymAmount || 0,
        hasPool: Boolean(props.hasPool),
        poolAmount: props.poolAmount || 0,
        hasTennisCourt: Boolean(props.hasTennisCourt),
        tennisCourtAmount: props.tennisCourtAmount || 0,
        hasBasketballCourt: Boolean(props.hasBasketballCourt),
        basketballCourtAmount: props.basketballCourtAmount || 0,
        hasFootballCourt: Boolean(props.hasFootballCourt),
        footballCourtAmount: props.footballCourtAmount || 0,
        hasVolleyballCourt: Boolean(props.hasVolleyballCourt),
        volleyballCourtAmount: props.volleyballCourtAmount || 0,
        hasSquashCourt: Boolean(props.hasSquashCourt),
        squashCourtAmount: props.squashCourtAmount || 0,
        hasPlayground: Boolean(props.hasPlayground),
        playgroundAmount: props.playgroundAmount || 0,
        hasParking: Boolean(props.hasParking),
        parkingAmount: props.parkingAmount || 0,
        hasGuestParking: Boolean(props.hasGuestParking),
        guestParkingAmount: props.guestParkingAmount || 0,
        hasBicycleRack: Boolean(props.hasBicycleRack),
        bicycleRackAmount: props.bicycleRackAmount || 0,
        hasStorageRoom: Boolean(props.hasStorageRoom),
        storageRoomAmount: props.storageRoomAmount || 0,
      };
      setAmenities(amen);

      setConvertForm((prev) => ({
        ...prev,
        contractNumber: `CONT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      }));

      setIsDirty(false);
    } catch (err: any) {
      showError(err.message || "Error al cargar la información del prospecto.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prospectId) {
      fetchProspectData();
      fetchFollowUps();
      fetchProposals();
    }
  }, [prospectId]);

  // Mark dirty
  const markDirty = () => {
    setIsDirty(true);
  };

  // Towers
  const handleAddTower = () => {
    markDirty();
    const nextTowerNum = towers.length + 1;
    setTowers((prev) => [
      ...prev,
      { towerName: `Torre ${nextTowerNum}`, floorsAmount: 10, apartmentsPerFloor: 4, elevators: 1 },
    ]);
  };

  const handleRemoveTower = (index: number) => {
    markDirty();
    setTowers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTowerChange = (index: number, field: keyof TowerInput, value: any) => {
    markDirty();
    setTowers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Entrances
  const handleEntryChange = (name: keyof typeof entries, checked: boolean) => {
    markDirty();
    setEntries((prev) => {
      const updated = { ...prev, [name]: checked };
      if (name === "separateVehicleEntryExit" && checked) updated.sharedVehicleEntryExit = false;
      else if (name === "sharedVehicleEntryExit" && checked) updated.separateVehicleEntryExit = false;

      if (name === "sharedPetDeliveryEntry" && checked) {
        updated.exclusivePetEntry = false;
        updated.exclusiveDeliveryEntry = false;
      } else if (name === "exclusivePetEntry" || name === "exclusiveDeliveryEntry") {
        if (checked && updated.exclusivePetEntry && updated.exclusiveDeliveryEntry) {
          updated.sharedPetDeliveryEntry = false;
        }
      }
      return updated;
    });
  };

  const handleImagePlaceholder = (entryKey: string) => {
    markDirty();
    setEntryImages((prev) => ({
      ...prev,
      [entryKey]: `foto_entrada_${entryKey}.jpg (adjuntada)`,
    }));
  };

  // Save All Changes
  const handleSaveProspectChanges = async () => {
    setSaving(true);
    try {
      const payload: any = {
        ...generalForm,
        structureConfig: {
          structureType,
          floorsAmount: Number(floorsAmount),
          apartmentsPerFloor: Number(apartmentsPerFloor),
          towersAmount: structureType === "SINGLE_BUILDING" ? 1 : towers.length,
          towers:
            structureType === "SINGLE_BUILDING"
              ? [
                  {
                    towerName: "Edificio Principal",
                    floorsAmount: Number(floorsAmount),
                    apartmentsPerFloor: Number(apartmentsPerFloor),
                    elevators: Number(singleElevators),
                  },
                ]
              : towers.map((t) => ({
                  ...t,
                  floorsAmount: Number(t.floorsAmount),
                  apartmentsPerFloor: Number(t.apartmentsPerFloor),
                  elevators: Number(t.elevators || 0),
                })),
          unitsAmount: Number(unitsAmount),
          prefix: housePrefix,
          hasCommercialStores: structureType === "MIXED",
          commercialStoresAmount: structureType === "MIXED" ? Number(commercialStoresAmount) : 0,
          entriesDescription: entries,
          entriesMediaFiles: entryImages,
          ...amenities,
        },
      };

      await HttpClient.patch(`/prospect/${prospectId}`, payload);
      showSuccess("¡Cambios del prospecto y estructura guardados satisfactoriamente!");
      setIsDirty(false);
      fetchProspectData();
    } catch (err: any) {
      showError(err.message || "Error al actualizar prospecto.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmConvert = async () => {
    if (!convertForm.contractNumber || !convertForm.contractDate || !convertForm.lastContractDate) {
      showError("Por favor completa los campos de número y fechas de contrato.");
      return;
    }
    setConverting(true);
    try {
      await HttpClient.post(`/prospect/${prospectId}/convert`, convertForm);
      showSuccess(`¡Felicidades! Se ha cerrado el contrato y "${prospect.name}" ahora es un Cliente Activo.`);
      setConvertDialogOpen(false);
      router.push("/administrative/clients");
    } catch (err: any) {
      showError(err.message || "Error al formalizar el contrato.");
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!prospect) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">No se encontró el prospecto.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            router.push("/administrative/prospects");
          }}
          sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
        >
          Mis Clientes
        </Link>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            router.push("/administrative/prospects");
          }}
          sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
        >
          Prospectos
        </Link>
        <Typography color="text.primary">{prospect.name}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/administrative/prospects")}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Volver a la Lista
          </Button>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            {generalForm.name || prospect.name}
          </Typography>
          <Chip label="PROSPECTO COMERCIAL" color="warning" size="small" sx={{ fontWeight: 600 }} />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<HandshakeIcon />}
            onClick={() => {
              setCoordinatorUser(null);
              setCommercialUser(null);
              setConvertForm((prev) => ({
                ...prev,
                contractNumber: `CONT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
              }));
              setConvertDialogOpen(true);
            }}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 2,
              fontWeight: 600,
              boxShadow: 1,
            }}
          >
            Cerrar Contrato (Formalizar)
          </Button>

          {isDirty && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveProspectChanges}
              disabled={saving}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 2,
                fontWeight: 600,
                boxShadow: 2,
              }}
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs Navigation */}
      <Paper sx={{ borderRadius: 3, mb: 3, boxShadow: 1 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="📍 INFORMACIÓN GENERAL Y UBICACIÓN" sx={{ fontWeight: 600, textTransform: "none" }} />
          <Tab label="🏢 ESTRUCTURA FÍSICA Y ÁREAS COMUNES" sx={{ fontWeight: 600, textTransform: "none" }} />
          <Tab label="🤝 BITÁCORA COMERCIAL Y CRM" sx={{ fontWeight: 600, textTransform: "none" }} />
          <Tab label={`📋 COTIZACIONES Y PROPUESTAS (${proposals.length})`} sx={{ fontWeight: 600, textTransform: "none" }} />
        </Tabs>

        {/* TAB 0: INFORMACIÓN GENERAL */}
        <CustomTabPanel value={tabIndex} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
              Información de Ubicación y Contacto del Prospecto
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Sector *"
                  value={generalForm.sector}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, sector: e.target.value });
                  }}
                >
                  <MenuItem value="RESIDENTIAL">Residencial (Conjuntos / Edificios)</MenuItem>
                  <MenuItem value="COMMERCIAL">Comercial / Centros Comerciales</MenuItem>
                  <MenuItem value="INDUSTRIAL">Industrial / Parques Industriales</MenuItem>
                  <MenuItem value="GOVERNMENT">Gubernamental</MenuItem>
                  <MenuItem value="OTHER">Otro</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre / Razón Social *"
                  value={generalForm.name}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, name: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="NIT *"
                  value={generalForm.nit}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, nit: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Dirección *"
                  value={generalForm.address}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, address: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Teléfono *"
                  value={generalForm.phone}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({
                      ...generalForm,
                      phone: e.target.value.replace(/\D/g, ""),
                    });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Correo Electrónico *"
                  value={generalForm.email}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, email: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Ciudad"
                  value={generalForm.city}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, city: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Localidad / Comuna"
                  value={generalForm.commune}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, commune: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Barrio / Zona"
                  value={generalForm.neighborhood}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, neighborhood: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="CAI Cercano"
                  value={generalForm.cai}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, cai: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Cuadrante de Policía"
                  value={generalForm.quadrant}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, quadrant: e.target.value });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Teléfono del Cuadrante"
                  value={generalForm.quadrantPhone}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({
                      ...generalForm,
                      quadrantPhone: e.target.value.replace(/\D/g, ""),
                    });
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observaciones"
                  value={generalForm.observations}
                  onChange={(e) => {
                    markDirty();
                    setGeneralForm({ ...generalForm, observations: e.target.value });
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </CustomTabPanel>

        {/* TAB 1: ESTRUCTURA FÍSICA Y ÁREAS COMUNES */}
        <CustomTabPanel value={tabIndex} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
              Modelado de Estructura, Accesos y Áreas Comunes
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Complejo *"
                  value={structureType}
                  onChange={(e) => {
                    markDirty();
                    setStructureType(e.target.value);
                  }}
                >
                  <MenuItem value="SINGLE_BUILDING">Edificio Único (Torre individual)</MenuItem>
                  <MenuItem value="BUILDING_CLUSTER">Conjunto de Torres / Bloques</MenuItem>
                  <MenuItem value="HOUSE_CLUSTER">Conjunto Cerrado de Casas</MenuItem>
                  <MenuItem value="MIXED">Conjunto Mixto (Residencial + Locales Comerciales)</MenuItem>
                  <MenuItem value="COMMERCIAL">Comercios / Centro Comercial</MenuItem>
                  <MenuItem value="OTHER">Otro Tipo de Inmueble</MenuItem>
                </TextField>
              </Grid>

              {structureType === "MIXED" && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                  inputProps={{ min: 0 }}
                    label="Cantidad de Locales Comerciales *"
                    value={commercialStoresAmount}
                    onChange={(e) => {
                      markDirty();
                      setCommercialStoresAmount(Number(e.target.value));
                    }}
                  />
                </Grid>
              )}

              {/* SINGLE_BUILDING */}
              {structureType === "SINGLE_BUILDING" && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Definición de Torre / Edificio
                    </Typography>
                  </Box>

                  <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                  inputProps={{ min: 0 }}
                          label="Pisos"
                          value={floorsAmount}
                          onChange={(e) => {
                            markDirty();
                            setFloorsAmount(Number(e.target.value));
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                  inputProps={{ min: 0 }}
                          label="Aptos / Piso"
                          value={apartmentsPerFloor}
                          onChange={(e) => {
                            markDirty();
                            setApartmentsPerFloor(Number(e.target.value));
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                  inputProps={{ min: 0 }}
                          label="Ascensores"
                          value={singleElevators}
                          onChange={(e) => {
                            markDirty();
                            setSingleElevators(Number(e.target.value));
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* BUILDING_CLUSTER or MIXED */}
              {(structureType === "BUILDING_CLUSTER" || structureType === "MIXED") && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Definición de Torres / Edificios
                    </Typography>
                    <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={handleAddTower}>
                      Agregar Torre
                    </Button>
                  </Box>

                  {towers.map((tower, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Nombre de la Torre"
                            value={tower.towerName}
                            onChange={(e) => handleTowerChange(idx, "towerName", e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2.5 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                  inputProps={{ min: 0 }}
                            label="Pisos"
                            value={tower.floorsAmount}
                            onChange={(e) => handleTowerChange(idx, "floorsAmount", Number(e.target.value))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2.5 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                  inputProps={{ min: 0 }}
                            label="Aptos / Piso"
                            value={tower.apartmentsPerFloor}
                            onChange={(e) => handleTowerChange(idx, "apartmentsPerFloor", Number(e.target.value))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                  inputProps={{ min: 0 }}
                            label="Ascensores"
                            value={tower.elevators}
                            onChange={(e) => handleTowerChange(idx, "elevators", Number(e.target.value))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 1 }}>
                          {towers.length > 1 && (
                            <IconButton color="error" size="small" onClick={() => handleRemoveTower(idx)}>
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Grid>
              )}

              {/* HOUSE_CLUSTER */}
              {structureType === "HOUSE_CLUSTER" && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Definición de Casas
                    </Typography>
                  </Box>

                  <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                  inputProps={{ min: 0 }}
                          label="Cantidad Total de Casas"
                          value={unitsAmount}
                          onChange={(e) => {
                            markDirty();
                            setUnitsAmount(Number(e.target.value));
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Prefijo de Inmueble"
                          value={housePrefix}
                          onChange={(e) => {
                            markDirty();
                            setHousePrefix(e.target.value);
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* OTHER */}
              {structureType === "OTHER" && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Definición de Inmuebles
                    </Typography>
                  </Box>

                  <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                  inputProps={{ min: 0 }}
                          label="Cantidad Total de Inmuebles / Unidades"
                          value={unitsAmount}
                          onChange={(e) => {
                            markDirty();
                            setUnitsAmount(Number(e.target.value));
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Prefijo de Inmueble"
                          value={housePrefix}
                          onChange={(e) => {
                            markDirty();
                            setHousePrefix(e.target.value);
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* Entrances */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, my: 1.5 }}>
                  🚪 Entradas y Accesos
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={entries.mainEntry}
                              onChange={(e) => handleEntryChange("mainEntry", e.target.checked)}
                            />
                          }
                          label="1. Entrada Principal"
                        />
                        {entries.mainEntry && (
                          <Button
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            variant="text"
                            onClick={() => handleImagePlaceholder("mainEntry")}
                            sx={{ ml: 4, mb: 1 }}
                          >
                            {entryImages["mainEntry"] || "Anexar foto Entrada Principal"}
                          </Button>
                        )}

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={entries.separateVehicleEntryExit}
                              disabled={entries.sharedVehicleEntryExit}
                              onChange={(e) =>
                                handleEntryChange("separateVehicleEntryExit", e.target.checked)
                              }
                            />
                          }
                          label="2. Vehicular separada para entrada y salida"
                        />
                        {entries.separateVehicleEntryExit && (
                          <Button
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            variant="text"
                            onClick={() => handleImagePlaceholder("separateVehicleEntryExit")}
                            sx={{ ml: 4, mb: 1 }}
                          >
                            {entryImages["separateVehicleEntryExit"] || "Anexar foto Vehicular Separada"}
                          </Button>
                        )}

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={entries.sharedVehicleEntryExit}
                              disabled={entries.separateVehicleEntryExit}
                              onChange={(e) =>
                                handleEntryChange("sharedVehicleEntryExit", e.target.checked)
                              }
                            />
                          }
                          label="3. Vehicular compartida para entrada y salida"
                        />
                        {entries.sharedVehicleEntryExit && (
                          <Button
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            variant="text"
                            onClick={() => handleImagePlaceholder("sharedVehicleEntryExit")}
                            sx={{ ml: 4, mb: 1 }}
                          >
                            {entryImages["sharedVehicleEntryExit"] || "Anexar foto Vehicular Compartida"}
                          </Button>
                        )}
                      </FormGroup>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={entries.exclusivePetEntry}
                              disabled={entries.sharedPetDeliveryEntry}
                              onChange={(e) => handleEntryChange("exclusivePetEntry", e.target.checked)}
                            />
                          }
                          label="4. Entrada exclusiva mascotas"
                        />
                        {entries.exclusivePetEntry && (
                          <Button
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            variant="text"
                            onClick={() => handleImagePlaceholder("exclusivePetEntry")}
                            sx={{ ml: 4, mb: 1 }}
                          >
                            {entryImages["exclusivePetEntry"] || "Anexar foto Acceso Mascotas"}
                          </Button>
                        )}

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={entries.exclusiveDeliveryEntry}
                              disabled={entries.sharedPetDeliveryEntry}
                              onChange={(e) => handleEntryChange("exclusiveDeliveryEntry", e.target.checked)}
                            />
                          }
                          label="5. Entrada exclusiva domiciliarios"
                        />
                        {entries.exclusiveDeliveryEntry && (
                          <Button
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            variant="text"
                            onClick={() => handleImagePlaceholder("exclusiveDeliveryEntry")}
                            sx={{ ml: 4, mb: 1 }}
                          >
                            {entryImages["exclusiveDeliveryEntry"] || "Anexar foto Domiciliarios"}
                          </Button>
                        )}

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={entries.sharedPetDeliveryEntry}
                              disabled={entries.exclusivePetEntry && entries.exclusiveDeliveryEntry}
                              onChange={(e) =>
                                handleEntryChange("sharedPetDeliveryEntry", e.target.checked)
                              }
                            />
                          }
                          label="6. Entrada compartida para mascotas y domiciliarios"
                        />
                        {entries.sharedPetDeliveryEntry && (
                          <Button
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            variant="text"
                            onClick={() => handleImagePlaceholder("sharedPetDeliveryEntry")}
                            sx={{ ml: 4, mb: 1 }}
                          >
                            {entryImages["sharedPetDeliveryEntry"] || "Anexar foto Acceso Compartido"}
                          </Button>
                        )}
                      </FormGroup>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>

              {/* Amenities */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, my: 1.5 }}>
                  🏊‍♂️ Áreas Comunes, Parqueaderos y Servicios
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                  inputProps={{ min: 0 }}
                      label="Parqueaderos Privados"
                      value={amenities.parkingAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({ ...amenities, parkingAmount: Number(e.target.value) });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                  inputProps={{ min: 0 }}
                      label="Parqueaderos Visitantes"
                      value={amenities.guestParkingAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({ ...amenities, guestParkingAmount: Number(e.target.value) });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                  inputProps={{ min: 0 }}
                      label="Bicicleteros"
                      value={amenities.bicycleRackAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({ ...amenities, bicycleRackAmount: Number(e.target.value) });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                  inputProps={{ min: 0 }}
                      label="Depósitos"
                      value={amenities.storageRoomAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({ ...amenities, storageRoomAmount: Number(e.target.value) });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                  inputProps={{ min: 0 }}
                      label="Salón Social"
                      value={amenities.socialRoomAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasSocialRoom: Number(e.target.value) > 0,
                          socialRoomAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                  inputProps={{ min: 0 }}
                      label="Gimnasio"
                      value={amenities.gymAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasGym: Number(e.target.value) > 0,
                          gymAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                  inputProps={{ min: 0 }}
                      label="Piscinas"
                      value={amenities.poolAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasPool: Number(e.target.value) > 0,
                          poolAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                  inputProps={{ min: 0 }}
                      label="Canchas de Squash"
                      value={amenities.squashCourtAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasSquashCourt: Number(e.target.value) > 0,
                          squashCourtAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                  inputProps={{ min: 0 }}
                      label="Canchas de Tenis"
                      value={amenities.tennisCourtAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasTennisCourt: Number(e.target.value) > 0,
                          tennisCourtAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                  inputProps={{ min: 0 }}
                      label="Canchas de Fútbol"
                      value={amenities.footballCourtAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasFootballCourt: Number(e.target.value) > 0,
                          footballCourtAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                  inputProps={{ min: 0 }}
                      label="Canchas de Baloncesto"
                      value={amenities.basketballCourtAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasBasketballCourt: Number(e.target.value) > 0,
                          basketballCourtAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                  inputProps={{ min: 0 }}
                      label="Parques Infantiles"
                      value={amenities.playgroundAmount}
                      onChange={(e) => {
                        markDirty();
                        setAmenities({
                          ...amenities,
                          hasPlayground: Number(e.target.value) > 0,
                          playgroundAmount: Number(e.target.value),
                        });
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </CustomTabPanel>

        {/* TAB 2: BITÁCORA COMERCIAL Y CRM */}
        <CustomTabPanel value={tabIndex} index={2}>
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                mb: 3,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <TimelineIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  BITÁCORA DE SEGUIMIENTO Y GESTIÓN COMERCIAL
                </Typography>
                <Chip
                  size="small"
                  label={`${followUps.length} Gestión${followUps.length === 1 ? "" : "es"}`}
                  color="primary"
                  variant="outlined"
                />
              </Box>

              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setFollowUpDrawerOpen(true)}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                Registrar Interacción
              </Button>
            </Box>

            {/* Recaptation Alert Banner */}
            {prospect.recaptationTargetDate && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: 2,
                  borderColor: "warning.main",
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255, 179, 0, 0.1)"
                      : "rgba(255, 179, 0, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <RecaptationIcon color="warning" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="warning.main">
                    Campaña de Recaptación Programada a 11 Meses
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Este negocio fue registrado como perdido frente a la competencia. La fecha objetivo calculada para contactar al cliente antes del preaviso de renovación automática es:{" "}
                    <strong>{prospect.recaptationTargetDate.split("T")[0]}</strong>.
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Follow-up Timeline */}
            {loadingFollowUps ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress size={32} />
              </Box>
            ) : followUps.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 2,
                  bgcolor: "background.default",
                }}
              >
                <TimelineIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  No hay interacciones registradas aún
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480, mx: "auto", mt: 0.5 }}>
                  Utilice el botón &quot;Registrar Interacción&quot; para documentar llamadas telefónicas, visitas técnicas o reuniones con el consejo o administración.
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {followUps.map((item) => {
                  const channelCfg =
                    INTERACTION_CHANNEL_CONFIG[item.contactChannel] || {
                      label: item.contactChannel,
                      icon: PhoneIcon,
                    };
                  const statusCfg =
                    FOLLOW_UP_STATUS_CONFIG[item.statusAfterFollowUp] || {
                      label: item.statusAfterFollowUp,
                      color: "default",
                    };
                  const ChannelIcon = channelCfg.icon;

                  return (
                    <Paper
                      key={item.id}
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          boxShadow: 2,
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          gap: 1.5,
                          mb: 1.5,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 1.5,
                              bgcolor: "action.hover",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <ChannelIcon color="primary" fontSize="small" />
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {channelCfg.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.interactionDate ? item.interactionDate.split("T")[0] : "-"} • Registrado por:{" "}
                              {item.assignedCommercial?.fullName || "Comercial Asignado"}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip
                            size="small"
                            label={statusCfg.label}
                            color={statusCfg.color}
                            variant="filled"
                            sx={{ fontWeight: 600 }}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteFollowUp(item.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Contact details */}
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          PERSONA CONTACTADA:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {item.contactPersonName}{" "}
                          {item.contactPersonRole && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                            >
                              ({item.contactPersonRole})
                            </Typography>
                          )}
                        </Typography>
                      </Box>

                      {/* Management Summary */}
                      <Box sx={{ bgcolor: "background.default", p: 2, borderRadius: 1.5, mb: 1.5 }}>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                          {item.managementSummary}
                        </Typography>
                      </Box>

                      {/* Loss details if applicable */}
                      {(item.statusAfterFollowUp === "LOST" ||
                        item.statusAfterFollowUp === "REJECTED") &&
                        item.lossReasonCategory && (
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              mb: 1.5,
                              borderRadius: 1.5,
                              borderColor: "error.light",
                              bgcolor: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(244, 67, 54, 0.08)"
                                  : "rgba(244, 67, 54, 0.04)",
                            }}
                          >
                            <Typography
                              variant="caption"
                              fontWeight={700}
                              color="error.main"
                              display="block"
                              sx={{ mb: 0.5 }}
                            >
                              DETALLES DE LA PÉRDIDA DEL NEGOCIO:
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                              <Typography variant="caption">
                                <strong>Motivo:</strong>{" "}
                                {LOSS_REASON_LABELS[item.lossReasonCategory] ||
                                  item.lossReasonCategory}
                              </Typography>
                              {item.winningCompetitorName && (
                                <Typography variant="caption">
                                  <strong>Competidor Ganador:</strong>{" "}
                                  {item.winningCompetitorName}
                                </Typography>
                              )}
                              {item.competitorPriceQuoted && (
                                <Typography variant="caption">
                                  <strong>Precio Cotizado por Competidor:</strong>{" "}
                                  ${item.competitorPriceQuoted.toLocaleString("es-CO")} COP
                                </Typography>
                              )}
                            </Box>
                            {item.lossReasonDescription && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                sx={{ mt: 0.5 }}
                              >
                                {item.lossReasonDescription}
                              </Typography>
                            )}
                          </Paper>
                        )}

                      {/* Next Contact Date */}
                      {item.nextContactDate && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CalendarMonthIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            Próxima gestión programada:{" "}
                            <strong>{item.nextContactDate.split("T")[0]}</strong>
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Box>
        </CustomTabPanel>
        {/* TAB 3: COTIZACIONES Y PROPUESTAS */}
        <CustomTabPanel value={tabIndex} index={3}>
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Cotizaciones y Ofertas Comerciales Estatutarias
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Historial de propuestas económicas emitidas con la calculadora SVSP en vivo para este prospecto.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push(`/commercial/proposals/new?clientId=${prospectId}`)}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 2.5,
                  background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)",
                  },
                }}
              >
                + Nueva Cotización
              </Button>
            </Box>

            {loadingProposals ? (
              <Box sx={{ p: 6, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={36} />
              </Box>
            ) : proposals.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <ReceiptLongIcon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.4, mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "text.secondary" }}>
                  No hay cotizaciones registradas para este prospecto
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                  Genere una propuesta económica personalizada que se transferirá automáticamente cuando este prospecto se formalice a cliente.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push(`/commercial/proposals/new?clientId=${prospectId}`)}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  + Crear Primera Cotización
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Folio</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Fecha Creación</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Puestos SVSP</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Total Mensual (COP)</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Margen P&L</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Estado</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {proposals.map((prop) => {
                      const positionsCount = prop.items?.length || 0;
                      return (
                        <TableRow key={prop.id} hover>
                          <TableCell>
                            <Typography
                              component="span"
                              onClick={() => router.push(`/commercial/proposals/${prop.id}`)}
                              sx={{
                                fontWeight: 800,
                                color: "primary.main",
                                cursor: "pointer",
                                "&:hover": { textDecoration: "underline" },
                              }}
                            >
                              {prop.proposalFolioCode}
                            </Typography>
                            <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                              v{prop.versionNumber}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem" }}>
                            {new Date(prop.createdAt).toLocaleDateString("es-CO", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem" }}>
                            <Chip
                              size="small"
                              label={`${positionsCount} Puesto${positionsCount === 1 ? "" : "s"}`}
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: "text.primary" }}>
                            $ {Number(prop.totalMonthlyWithTax || 0).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              icon={<TrendingUpIcon sx={{ fontSize: "14px !important" }} />}
                              label={`${prop.netMarginPercentage}%`}
                              color={
                                prop.pnlStatus === "PROFITABLE" ? "success" : prop.pnlStatus === "WARNING_LOW_MARGIN" ? "warning" : "error"
                              }
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={
                                prop.status === "WON"
                                  ? "Ganada / Aceptada"
                                  : prop.status === "DRAFT"
                                  ? "Borrador"
                                  : prop.status === "APPROVED_INTERNAL"
                                  ? "Aprobada Internamente"
                                  : prop.status === "SENT_TO_CLIENT"
                                  ? "Enviada al Cliente"
                                  : prop.status === "LOST"
                                  ? "Perdida"
                                  : prop.status
                              }
                              color={
                                prop.status === "WON"
                                  ? "success"
                                  : prop.status === "SENT_TO_CLIENT"
                                  ? "primary"
                                  : prop.status === "APPROVED_INTERNAL"
                                  ? "info"
                                  : prop.status === "LOST"
                                  ? "error"
                                  : "default"
                              }
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                              {prop.status !== "WON" && (
                                <Tooltip title="Aprobar y Marcar como Ganada (WON)">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => setWonTargetProposal(prop)}
                                  >
                                    <TrophyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Editar en Canvas">
                                <IconButton
                                  size="small"
                                  onClick={() => router.push(`/commercial/proposals/${prop.id}`)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Vista Previa de Propuesta">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => setPreviewProposal(prop)}
                                >
                                  <PdfIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </CustomTabPanel>
      </Paper>

      {/* Drawer: Nueva Interacción Comercial */}
      <ResponsiveFormDrawer
        open={followUpDrawerOpen}
        onClose={() => !savingFollowUp && setFollowUpDrawerOpen(false)}
        title="Registrar Gestión Comercial"
        subtitle="Registro cronológico de llamadas, visitas y seguimiento"
        isSubmitting={savingFollowUp}
        submitButtonText="Guardar en Bitácora"
        formId="create-followup-form"
      >
        <Box
          component="form"
          id="create-followup-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveFollowUp();
          }}
        >
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Canal de Interacción *"
                value={followUpForm.contactChannel}
                onChange={(e) =>
                  setFollowUpForm({
                    ...followUpForm,
                    contactChannel: e.target.value as InteractionChannel,
                  })
                }
              >
                {Object.entries(INTERACTION_CHANNEL_CONFIG).map(([k, cfg]) => (
                  <MenuItem key={k} value={k}>
                    {cfg.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Fecha de la Interacción *"
                InputLabelProps={{ shrink: true }}
                value={followUpForm.interactionDate}
                onChange={(e) =>
                  setFollowUpForm({ ...followUpForm, interactionDate: e.target.value })
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Persona Contactada *"
                placeholder="ej. Dra. María Consuelo / Presidente de Consejo"
                value={followUpForm.contactPersonName}
                onChange={(e) =>
                  setFollowUpForm({
                    ...followUpForm,
                    contactPersonName: e.target.value,
                  })
                }
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Cargo / Rol del Contacto"
                placeholder="ej. Administrador, Tesorero, Gerente General"
                value={followUpForm.contactPersonRole || ""}
                onChange={(e) =>
                  setFollowUpForm({
                    ...followUpForm,
                    contactPersonRole: e.target.value,
                  })
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                label="Resumen de la Gestión *"
                placeholder="Detalle los puntos clave discutidos, solicitudes del cliente o condiciones para la propuesta comercial..."
                value={followUpForm.managementSummary}
                onChange={(e) =>
                  setFollowUpForm({
                    ...followUpForm,
                    managementSummary: e.target.value,
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
                label="Próxima Fecha de Contacto (Opcional)"
                InputLabelProps={{ shrink: true }}
                value={followUpForm.nextContactDate || ""}
                onChange={(e) =>
                  setFollowUpForm({
                    ...followUpForm,
                    nextContactDate: e.target.value,
                  })
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Estado Comercial tras la Gestión *"
                value={followUpForm.statusAfterFollowUp}
                onChange={(e) =>
                  setFollowUpForm({
                    ...followUpForm,
                    statusAfterFollowUp: e.target.value as FollowUpMilestoneStatus,
                  })
                }
              >
                {Object.entries(FOLLOW_UP_STATUS_CONFIG).map(([k, cfg]) => (
                  <MenuItem key={k} value={k}>
                    {cfg.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Loss fields shown only if LOST or REJECTED */}
            {(followUpForm.statusAfterFollowUp === "LOST" ||
              followUpForm.statusAfterFollowUp === "REJECTED") && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight={700} color="error.main" sx={{ mb: 1 }}>
                    Motivo de Pérdida y Análisis Competitivo
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Motivo de la Pérdida *"
                    value={followUpForm.lossReasonCategory || "COMPETITOR_PRICE"}
                    onChange={(e) =>
                      setFollowUpForm({
                        ...followUpForm,
                        lossReasonCategory: e.target.value as DealLossReasonCategory,
                      })
                    }
                  >
                    {Object.entries(LOSS_REASON_LABELS).map(([k, label]) => (
                      <MenuItem key={k} value={k}>
                        {label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nombre del Competidor Ganador"
                    placeholder="ej. Atlas Seguridad, Securitas, Fortox"
                    value={followUpForm.winningCompetitorName || ""}
                    onChange={(e) =>
                      setFollowUpForm({
                        ...followUpForm,
                        winningCompetitorName: e.target.value,
                      })
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Precio Cotizado por Competidor (COP)"
                    value={followUpForm.competitorPriceQuoted || 0}
                    onChange={(e) =>
                      setFollowUpForm({
                        ...followUpForm,
                        competitorPriceQuoted: Number(e.target.value),
                      })
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    label="Detalle / Justificación de la Pérdida"
                    placeholder="Factores decisivos, valores agregados regalados por la competencia o feedback del consejo..."
                    value={followUpForm.lossReasonDescription || ""}
                    onChange={(e) =>
                      setFollowUpForm({
                        ...followUpForm,
                        lossReasonDescription: e.target.value,
                      })
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      bgcolor: "action.hover",
                      borderRadius: 1.5,
                      borderColor: "warning.main",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      ⚠️ <strong>Alerta Automática de Recaptación:</strong> Al marcar este negocio como perdido, el sistema proyectará automáticamente la fecha objetivo a 11 meses (335 días) para activar la campaña de recaptación antes de que se venza el periodo de preaviso de la empresa ganadora.
                    </Typography>
                  </Paper>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </ResponsiveFormDrawer>

      {/* Convert Drawer */}
      <ResponsiveFormDrawer
        open={convertDialogOpen}
        onClose={() => !converting && setConvertDialogOpen(false)}
        title={`Cerrar Contrato: ${generalForm.name || prospect.name}`}
        subtitle="Formalización del cliente en la plataforma operativa"
        isSubmitting={converting}
        submitButtonText="Confirmar y Cerrar Contrato"
        formId="convert-prospect-detail-form"
      >
        <Box
          component="form"
          id="convert-prospect-detail-form"
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
                  setConvertForm({ ...convertForm, contractNumber: e.target.value })
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
                      <CalendarMonthIcon sx={{ color: "action.active", pointerEvents: "none" }} />
                    </InputAdornment>
                  ),
                }}
                label="Fecha Inicial del Contrato *"
                InputLabelProps={{ shrink: true }}
                value={convertForm.contractDate}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, contractDate: e.target.value })
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
                      <CalendarMonthIcon sx={{ color: "action.active", pointerEvents: "none" }} />
                    </InputAdornment>
                  ),
                }}
                label="Fecha Final del Contrato *"
                InputLabelProps={{ shrink: true }}
                value={convertForm.lastContractDate}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, lastContractDate: e.target.value })
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
                  setConvertForm({ ...convertForm, coordinatorInChargeId: u?.id || "" });
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
                  setConvertForm({ ...convertForm, commercialContactId: u?.id || "" });
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
      {/* Drawer: Marcar Propuesta como Ganada desde Prospecto */}
      <ResponsiveFormDrawer
        open={Boolean(wonTargetProposal)}
        onClose={() => !transitioningWon && setWonTargetProposal(null)}
        title="Aprobar y Marcar como Ganada"
        subtitle="Cierre de negociación comercial y emisión de Orden de Servicio"
        headerIcon={<TrophyIcon sx={{ color: "#059669", fontSize: 28 }} />}
        width={{ xs: "100%", sm: 540, md: 580 }}
        customActions={
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
            <Button
              fullWidth
              variant="contained"
              disabled={transitioningWon}
              startIcon={transitioningWon ? <CircularProgress size={18} color="inherit" /> : <BoltIcon />}
              onClick={() => wonTargetProposal && handleConfirmWon(wonTargetProposal.id, true)}
              sx={{
                py: 1.4,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                fontSize: "0.92rem",
                letterSpacing: "0.2px",
                background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
                color: "#FFFFFF",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
                  boxShadow: "0 6px 20px rgba(16, 185, 129, 0.45)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              {transitioningWon ? "Procesando y emitiendo orden..." : "⚡ Marcar como Ganada y Emitir Orden de Servicio"}
            </Button>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5 }}>
              <Button
                variant="text"
                onClick={() => setWonTargetProposal(null)}
                disabled={transitioningWon}
                sx={{
                  py: 1,
                  px: 2,
                  borderRadius: "8px",
                  textTransform: "none",
                  color: "text.secondary",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="outlined"
                disabled={transitioningWon}
                startIcon={<CheckCircleIcon />}
                onClick={() => wonTargetProposal && handleConfirmWon(wonTargetProposal.id, false)}
                sx={{
                  py: 1,
                  px: 2.5,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  border: "1.5px solid #059669",
                  color: "#059669",
                  bgcolor: "rgba(5, 150, 105, 0.04)",
                  "&:hover": {
                    border: "1.5px solid #047857",
                    bgcolor: "rgba(5, 150, 105, 0.1)",
                  },
                }}
              >
                Solo Marcar como Ganada
              </Button>
            </Box>
          </Box>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
            Está a punto de registrar la aceptación formal de la propuesta por parte del prospecto. Al marcarla como ganada, concluye exitosamente la negociación comercial y se habilita la creación de la <strong>Orden de Servicio Operativa</strong>.
          </Typography>

          {wonTargetProposal && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: "#F8FAFC",
                borderRadius: 2.5,
                border: "1px solid #E2E8F0",
              }}
            >
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                    Folio de Cotización
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#4338CA", mt: 0.2 }}>
                    {wonTargetProposal.proposalFolioCode}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                    Prospecto Destinatario
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A", mt: 0.2 }}>
                    {wonTargetProposal.client?.name || generalForm.name || "Sin nombre"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                    Facturación Mensual (COP)
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#059669", mt: 0.2 }}>
                    $ {Number(wonTargetProposal.totalMonthlyWithTax || 0).toLocaleString("es-CO")}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                    Margen Operativo P&L
                  </Typography>
                  <Box sx={{ mt: 0.2 }}>
                    <Chip
                      size="small"
                      icon={<TrendingUpIcon sx={{ fontSize: "14px !important" }} />}
                      label={`${wonTargetProposal.netMarginPercentage}%`}
                      color={
                        wonTargetProposal.pnlStatus === "PROFITABLE" ? "success" : wonTargetProposal.pnlStatus === "WARNING_LOW_MARGIN" ? "warning" : "error"
                      }
                      sx={{ fontWeight: 700, fontSize: "0.78rem" }}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}

          <Alert
            severity="info"
            icon={<BoltIcon sx={{ color: "#0284C7" }} />}
            sx={{
              borderRadius: 2,
              bgcolor: "#F0F9FF",
              border: "1px solid #BAE6FD",
              "& .MuiAlert-message": { fontSize: "0.85rem", color: "#0369A1", lineHeight: 1.5 },
            }}
          >
            <strong>Recomendación Operativa:</strong> Al crear la Orden de Servicio, el sistema trasladará las especificaciones del puesto e integrará el Código OMEGA para el posterior despliegue.
          </Alert>
        </Box>
      </ResponsiveFormDrawer>

      {/* Modal: Vista Previa PDF de Propuesta */}
      <Dialog
        open={Boolean(previewProposal)}
        onClose={() => setPreviewProposal(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: "92vh",
            maxHeight: "92vh",
            borderRadius: 3,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Vista Previa: {previewProposal?.proposalFolioCode}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Imprimir
            </Button>
            {previewProposal && (
              <Button
                size="small"
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  const id = previewProposal.id;
                  setPreviewProposal(null);
                  router.push(`/commercial/proposals/${id}`);
                }}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Editar en Canvas
              </Button>
            )}
            <IconButton onClick={() => setPreviewProposal(null)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, flex: 1, bgcolor: "#F1F5F9", overflowY: "auto" }}>
          {previewProposal && (
            <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
              <ChameleonPdfPreview
                proposalNumber={previewProposal.proposalFolioCode}
                date={new Date(previewProposal.createdAt).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                clientName={previewProposal.client?.name || generalForm.name || "Prospecto"}
                clientNit={previewProposal.client?.nit || generalForm.nit || ""}
                clientCity={previewProposal.draftSnapshotJson?.clientCity || generalForm.city || "Bogotá D.C."}
                skin={previewProposal.draftSnapshotJson?.skin || {
                  primaryColor: "#0F172A",
                  secondaryColor: "#4338CA",
                  headerLogoUrl: "",
                  footerText: "Propuesta de Seguridad Privada",
                }}
                bodyHtml={
                  previewProposal.draftSnapshotJson?.clauseBlocks
                    ? previewProposal.draftSnapshotJson.clauseBlocks
                        .map((b: any) => `<h3>${b.title || ""}</h3>${b.content}`)
                        .join("<br/>")
                    : "<p>Propuesta técnica y económica generada.</p>"
                }
                serviceItems={previewProposal.items?.map((it: any) => ({
                  name: it.positionTitle,
                  modality: it.weaponModality,
                  hours: it.scheduleType,
                  postsCount: it.quantity,
                  monthlyTotal:
                    Number(it.totalMonthlyBilledPrice) ||
                    (Number(it.unitMonthlyBilledPrice) || 0) * (Number(it.quantity) || 1),
                }))}
                valueAddedItems={previewProposal.valueAddedItems?.map((v: any) => ({
                  itemName: v.itemName,
                  quantity: v.quantity,
                  periodicity: v.periodicity,
                  itemInternalCost: Number(v.itemInternalCost) || 0,
                  notes: v.notes,
                }))}
                signers={previewProposal.signers}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
