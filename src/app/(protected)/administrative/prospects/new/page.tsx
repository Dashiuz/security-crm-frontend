"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Breadcrumbs,
  Link,
  Divider,
  Paper,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";

interface TowerInput {
  towerName: string;
  floorsAmount: number;
  apartmentsPerFloor: number;
  elevators: number;
}

const steps = ["Información de Ubicación", "Modelado de Estructura del Inmueble"];

export default function CreateProspectPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [securityStudyDialogOpen, setSecurityStudyDialogOpen] = useState(false);
  const [createdProspectId, setCreatedProspectId] = useState<string | null>(null);

  // Section 1: Location & General Info
  const [locationForm, setLocationForm] = useState({
    sector: "RESIDENTIAL",
    name: "",
    nit: "",
    address: "",
    phone: "",
    email: "",
    commune: "",
    neighborhood: "",
    city: "Bogotá",
    cai: "",
    quadrant: "",
    quadrantPhone: "",
    observations: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Section 2: Structure & Amenities
  const [structureType, setStructureType] = useState<string>("BUILDING_CLUSTER");
  const [floorsAmount, setFloorsAmount] = useState<number>(5);
  const [apartmentsPerFloor, setApartmentsPerFloor] = useState<number>(4);
  const [singleElevators, setSingleElevators] = useState<number>(1);
  const [towers, setTowers] = useState<TowerInput[]>([
    { towerName: "Torre 1", floorsAmount: 10, apartmentsPerFloor: 4, elevators: 2 },
    { towerName: "Torre 2", floorsAmount: 10, apartmentsPerFloor: 4, elevators: 2 },
  ]);
  const [unitsAmount, setUnitsAmount] = useState<number>(50);
  const [housePrefix, setHousePrefix] = useState<string>("Casa");
  const [commercialStoresAmount, setCommercialStoresAmount] = useState<number>(4);

  // Entrances Multi-Check
  const [entries, setEntries] = useState({
    mainEntry: true,
    separateVehicleEntryExit: false,
    sharedVehicleEntryExit: true,
    exclusivePetEntry: false,
    exclusiveDeliveryEntry: false,
    sharedPetDeliveryEntry: true,
  });

  const [entryImages, setEntryImages] = useState<Record<string, string>>({});

  // Amenities
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

  const validateStep = (stepIdx: number) => {
    if (stepIdx === 0) {
      const errs: Record<string, string> = {};
      if (!locationForm.name.trim()) errs.name = "El Nombre o Razón Social es requerido.";
      if (!locationForm.nit.trim()) errs.nit = "El NIT es requerido.";
      if (!locationForm.address.trim()) errs.address = "La dirección es requerida.";
      if (!locationForm.phone.trim()) errs.phone = "El teléfono es requerido.";
      if (!locationForm.email.trim()) {
        errs.email = "El correo electrónico es requerido.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(locationForm.email)) {
        errs.email = "El formato de correo no es válido.";
      }
      setErrors(errs);
      return Object.keys(errs).length === 0;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleAddTower = () => {
    const nextTowerNum = towers.length + 1;
    setTowers((prev) => [
      ...prev,
      { towerName: `Torre ${nextTowerNum}`, floorsAmount: 10, apartmentsPerFloor: 4, elevators: 1 },
    ]);
  };

  const handleRemoveTower = (index: number) => {
    setTowers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTowerChange = (index: number, field: keyof TowerInput, value: any) => {
    setTowers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleEntryChange = (name: keyof typeof entries, checked: boolean) => {
    setEntries((prev) => {
      const updated = { ...prev, [name]: checked };

      // Mutual exclusions logic
      if (name === "separateVehicleEntryExit" && checked) {
        updated.sharedVehicleEntryExit = false;
      } else if (name === "sharedVehicleEntryExit" && checked) {
        updated.separateVehicleEntryExit = false;
      }

      if (name === "sharedPetDeliveryEntry" && checked) {
        updated.exclusivePetEntry = false;
        updated.exclusiveDeliveryEntry = false;
      } else if ((name === "exclusivePetEntry" || name === "exclusiveDeliveryEntry") && checked) {
        if (updated.exclusivePetEntry && updated.exclusiveDeliveryEntry) {
          updated.sharedPetDeliveryEntry = false;
        }
      }

      return updated;
    });
  };

  const handleImagePlaceholder = (entryKey: string) => {
    setEntryImages((prev) => ({
      ...prev,
      [entryKey]: `foto_entrada_${entryKey}.jpg (adjuntada)`,
    }));
  };

  const handleSaveProspect = async () => {
    setLoading(true);
    try {
      const payload = {
        ...locationForm,
        structureConfig: {
          structureType,
          floorsAmount: Number(floorsAmount),
          apartmentsPerFloor: Number(apartmentsPerFloor),
          towersAmount: structureType === "SINGLE_BUILDING" ? 1 : towers.length,
          towers: structureType === "SINGLE_BUILDING"
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

      const res = await HttpClient.post<any>("/prospect/with-structure", payload);
      setCreatedProspectId(res.id);
      setSecurityStudyDialogOpen(true);
    } catch (err: any) {
      showError(err.message || "Error al registrar el prospecto.");
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityStudyDecision = (startStudy: boolean) => {
    setSecurityStudyDialogOpen(false);
    if (startStudy) {
      showSuccess("¡Prospecto registrado! Módulo de Estudio de Seguridad asignado.");
      router.push("/administrative/prospects");
    } else {
      showSuccess("¡Prospecto de cliente registrado satisfactoriamente!");
      router.push("/administrative/prospects");
    }
  };

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
        <Typography color="text.primary">Nuevo Prospecto</Typography>
      </Breadcrumbs>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/administrative/prospects")}
            sx={{ borderRadius: 2 }}
          >
            Volver a Prospectos
          </Button>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Registrar Prospecto de Cliente
          </Typography>
        </Box>
      </Box>

      {/* Stepper Header */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, boxShadow: 1 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Form Content */}
      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <CardContent sx={{ p: 4 }}>
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                📍 1. Información de Ubicación y Contacto
              </Typography>

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Sector *"
                    value={locationForm.sector}
                    onChange={(e) => setLocationForm({ ...locationForm, sector: e.target.value })}
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
                    value={locationForm.name}
                    error={Boolean(errors.name)}
                    helperText={errors.name}
                    onChange={(e) => {
                      setLocationForm({ ...locationForm, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="NIT *"
                    placeholder="900123456-7"
                    value={locationForm.nit}
                    error={Boolean(errors.nit)}
                    helperText={errors.nit}
                    onChange={(e) => {
                      setLocationForm({ ...locationForm, nit: e.target.value });
                      if (errors.nit) setErrors({ ...errors, nit: "" });
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Dirección *"
                    placeholder="Calle 123 # 45-67"
                    value={locationForm.address}
                    error={Boolean(errors.address)}
                    helperText={errors.address}
                    onChange={(e) => {
                      setLocationForm({ ...locationForm, address: e.target.value });
                      if (errors.address) setErrors({ ...errors, address: "" });
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Teléfono *"
                    placeholder="3101234567"
                    value={locationForm.phone}
                    error={Boolean(errors.phone)}
                    helperText={errors.phone}
                    onChange={(e) => {
                      const numVal = e.target.value.replace(/\D/g, "");
                      setLocationForm({ ...locationForm, phone: numVal });
                      if (errors.phone) setErrors({ ...errors, phone: "" });
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico *"
                    placeholder="contacto@conjunto.com"
                    value={locationForm.email}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                    onChange={(e) => {
                      setLocationForm({ ...locationForm, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Ciudad"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Localidad / Comuna"
                    placeholder="Suba, Usaquén..."
                    value={locationForm.commune}
                    onChange={(e) => setLocationForm({ ...locationForm, commune: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Barrio / Zona"
                    placeholder="Cedritos, Chapinero..."
                    value={locationForm.neighborhood}
                    onChange={(e) => setLocationForm({ ...locationForm, neighborhood: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="CAI de Policía Cercano"
                    placeholder="CAI Cedritos"
                    value={locationForm.cai}
                    onChange={(e) => setLocationForm({ ...locationForm, cai: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Cuadrante de Policía"
                    placeholder="Q14"
                    value={locationForm.quadrant}
                    onChange={(e) => setLocationForm({ ...locationForm, quadrant: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Teléfono del Cuadrante"
                    placeholder="3109876543"
                    value={locationForm.quadrantPhone}
                    onChange={(e) =>
                      setLocationForm({
                        ...locationForm,
                        quadrantPhone: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Observaciones Comerciales"
                    placeholder="Detalles sobre las necesidades del prospecto..."
                    value={locationForm.observations}
                    onChange={(e) => setLocationForm({ ...locationForm, observations: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNext}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  Siguiente: Estructura del Inmueble
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                🏢 2. Modelado de Estructura y Porterías del Inmueble
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de Complejo *"
                    value={structureType}
                    onChange={(e) => setStructureType(e.target.value)}
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
                      onChange={(e) => setCommercialStoresAmount(Number(e.target.value))}
                    />
                  </Grid>
                )}

                {/* Structure Detail Controls */}
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
                              <Button color="error" onClick={() => handleRemoveTower(idx)}>
                                <DeleteIcon />
                              </Button>
                            )}
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Grid>
                )}

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
                            onChange={(e) => setFloorsAmount(Number(e.target.value))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Aptos / Piso"
                            value={apartmentsPerFloor}
                            onChange={(e) => setApartmentsPerFloor(Number(e.target.value))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Ascensores"
                            value={singleElevators}
                            onChange={(e) => setSingleElevators(Number(e.target.value))}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}

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
                            onChange={(e) => setUnitsAmount(Number(e.target.value))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Prefijo de Inmueble"
                            value={housePrefix}
                            onChange={(e) => setHousePrefix(e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}

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
                            onChange={(e) => setUnitsAmount(Number(e.target.value))}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Prefijo de Inmueble"
                            value={housePrefix}
                            onChange={(e) => setHousePrefix(e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                {/* Entrances Multiple Check */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                    🚪 Seleccione las entradas y accesos que tiene el conjunto:
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

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                {/* Amenities & Common Areas */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    🏊‍♂️ Áreas Comunes, Parqueaderos y Servicios
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Parqueaderos Privados"
                        value={amenities.parkingAmount}
                        onChange={(e) =>
                          setAmenities({ ...amenities, parkingAmount: Number(e.target.value) })
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Parqueaderos Visitantes"
                        value={amenities.guestParkingAmount}
                        onChange={(e) =>
                          setAmenities({ ...amenities, guestParkingAmount: Number(e.target.value) })
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Bicicleteros"
                        value={amenities.bicycleRackAmount}
                        onChange={(e) =>
                          setAmenities({ ...amenities, bicycleRackAmount: Number(e.target.value) })
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Depósitos"
                        value={amenities.storageRoomAmount}
                        onChange={(e) =>
                          setAmenities({ ...amenities, storageRoomAmount: Number(e.target.value) })
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Salón Social"
                        value={amenities.socialRoomAmount}
                        onChange={(e) =>
                          setAmenities({
                            ...amenities,
                            hasSocialRoom: Number(e.target.value) > 0,
                            socialRoomAmount: Number(e.target.value),
                          })
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Gimnasio"
                        value={amenities.gymAmount}
                        onChange={(e) =>
                          setAmenities({
                            ...amenities,
                            hasGym: Number(e.target.value) > 0,
                            gymAmount: Number(e.target.value),
                          })
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Piscinas"
                        value={amenities.poolAmount}
                        onChange={(e) =>
                          setAmenities({
                            ...amenities,
                            hasPool: Number(e.target.value) > 0,
                            poolAmount: Number(e.target.value),
                          })
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Canchas de Squash"
                        value={amenities.squashCourtAmount}
                        onChange={(e) =>
                          setAmenities({
                            ...amenities,
                            hasSquashCourt: Number(e.target.value) > 0,
                            squashCourtAmount: Number(e.target.value),
                          })
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Canchas de Tenis"
                        value={amenities.tennisCourtAmount}
                        onChange={(e) =>
                          setAmenities({
                            ...amenities,
                            hasTennisCourt: Number(e.target.value) > 0,
                            tennisCourtAmount: Number(e.target.value),
                          })
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Canchas de Fútbol"
                        value={amenities.footballCourtAmount}
                        onChange={(e) =>
                          setAmenities({
                            ...amenities,
                            hasFootballCourt: Number(e.target.value) > 0,
                            footballCourtAmount: Number(e.target.value),
                          })
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Canchas de Baloncesto"
                        value={amenities.basketballCourtAmount}
                        onChange={(e) =>
                          setAmenities({
                            ...amenities,
                            hasBasketballCourt: Number(e.target.value) > 0,
                            basketballCourtAmount: Number(e.target.value),
                          })
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Parques Infantiles"
                        value={amenities.playgroundAmount}
                        onChange={(e) =>
                          setAmenities({
                            ...amenities,
                            hasPlayground: Number(e.target.value) > 0,
                            playgroundAmount: Number(e.target.value),
                          })
                        }
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                <Button variant="outlined" onClick={handleBack} disabled={loading}>
                  Atrás
                </Button>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveProspect}
                  disabled={loading}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  {loading ? "Guardando Prospecto..." : "Guardar Prospecto"}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Security Study Decision Dialog */}
      <Dialog
        open={securityStudyDialogOpen}
        onClose={() => handleSecurityStudyDecision(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, fontWeight: 600 }}>
          <ShieldIcon color="primary" sx={{ fontSize: 32 }} />
          ¿Desea iniciar el Estudio de Seguridad?
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2 }}>
            El prospecto ha sido guardado exitosamente. ¿Deseas iniciar de inmediato la fase de <strong>Estudio de Seguridad y Vulnerabilidad</strong> para este conjunto residencial?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Si seleccionas <strong>Sí</strong>, el sistema abrirá la orden de estudio. Si seleccionas <strong>No</strong>, el prospecto se mantendrá registrado en el listado para cotización y seguimiento comercial.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => handleSecurityStudyDecision(false)} variant="outlined">
            No, solo guardar prospecto
          </Button>
          <Button onClick={() => handleSecurityStudyDecision(true)} variant="contained" color="primary">
            Sí, iniciar estudio de seguridad
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
