"use client";

import { useState, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Handshake as HandshakeIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";

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
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);

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

  // Load prospect details
  const fetchProspectData = async () => {
    setLoading(true);
    try {
      const [prospectData, employeesData] = await Promise.all([
        HttpClient.get<any>(`/prospect/${prospectId}`),
        HttpClient.get<any[]>("/employee").catch(() => []),
      ]);

      setProspect(prospectData);
      setEmployees(
        employeesData.map((e) => ({
          value: e.id,
          label: `${e.fullName} (${e.positionName || "Sin Cargo"})`,
        })),
      );

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
            onClick={() => setConvertDialogOpen(true)}
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
                  <MenuItem value="OTHER">Otro Tipo de Inmueble</MenuItem>
                </TextField>
              </Grid>

              {structureType === "MIXED" && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
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
      </Paper>

      {/* Convert Dialog */}
      <Dialog
        open={convertDialogOpen}
        onClose={() => !converting && setConvertDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Cerrar Contrato y Formalizar Cliente: {generalForm.name || prospect.name}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Número de Contrato *"
                value={convertForm.contractNumber}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, contractNumber: e.target.value })
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
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
                type="date"
                label="Fecha Inicial del Contrato *"
                InputLabelProps={{ shrink: true }}
                value={convertForm.contractDate}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, contractDate: e.target.value })
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha Final del Contrato *"
                InputLabelProps={{ shrink: true }}
                value={convertForm.lastContractDate}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, lastContractDate: e.target.value })
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Coordinador a Cargo"
                value={convertForm.coordinatorInChargeId}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    coordinatorInChargeId: e.target.value,
                  })
                }
              >
                <MenuItem value="">-- Sin Asignar --</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.value} value={emp.value}>
                    {emp.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Contacto Comercial Asignado"
                value={convertForm.commercialContactId}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    commercialContactId: e.target.value,
                  })
                }
              >
                <MenuItem value="">-- Sin Asignar --</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.value} value={emp.value}>
                    {emp.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
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
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConvertDialogOpen(false)} color="inherit" disabled={converting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmConvert}
            disabled={converting}
            startIcon={converting ? <CircularProgress size={20} color="inherit" /> : <HandshakeIcon />}
            sx={{ borderRadius: 2 }}
          >
            {converting ? "Formalizando..." : "Confirmar y Cerrar Contrato"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
