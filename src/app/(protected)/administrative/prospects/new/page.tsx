"use client";

import { useState, useRef, useEffect } from "react";
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
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Tooltip,
  IconButton,
} from "@mui/material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  DoorFrontRounded as DoorFrontIcon,
  PhotoCameraRounded as CameraIcon,
  OpenInNewRounded as OpenInNewIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
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
    stratum: 4 as number | string,
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
    noExclusiveEntries: false,
  });

  const [entryImages, setEntryImages] = useState<Record<string, any>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [activeImageKey, setActiveImageKey] = useState<string | null>(null);
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const input = imageInputRef.current;
    if (!input) return;
    const handleCancel = () => {
      if (activeImageKey) {
        setUploadingKeys((prev) => ({ ...prev, [activeImageKey]: false }));
        setActiveImageKey(null);
      }
    };
    input.addEventListener("cancel", handleCancel);
    return () => {
      input.removeEventListener("cancel", handleCancel);
    };
  }, [activeImageKey]);

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

  // Upload handler for access points
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeImageKey) return;

    try {
      setUploadingKeys((prev) => ({ ...prev, [activeImageKey]: true }));
      const uploaded = await StorageApi.uploadMedia({
        file,
        entityType: MediaTypeCategory.CLIENT,
        entityId: "new",
        clientId: null,
        subType: `entry_${activeImageKey}`,
      });
      setEntryImages((prev) => ({
        ...prev,
        [activeImageKey]: {
          mediaId: uploaded.id,
          fileName: uploaded.fileName,
          url: uploaded.presignedUrl || uploaded.url,
        },
      }));
      showSuccess(`Fotografía de acceso "${file.name}" adjuntada correctamente.`);
    } catch (err: any) {
      showError(err.message || "Error al subir fotografía de acceso.");
    } finally {
      setUploadingKeys((prev) => ({
        ...prev,
        [activeImageKey]: false,
      }));
    }
  };

  const triggerUpload = (key: string) => {
    setActiveImageKey(key);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
      imageInputRef.current.click();
    }
  };

  const handleRemovePhoto = (key: string) => {
    setEntryImages((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  // Access points mutual exclusion logic
  const handleEntryToggle = (key: string, checked: boolean) => {
    setEntries((prev) => {
      const next: any = { ...prev, [key]: checked };

      // Option 7: "Sin entradas exclusivas" disables & clears 4, 5, 6
      if (key === "noExclusiveEntries" && checked) {
        next.exclusivePetEntry = false;
        next.exclusiveDeliveryEntry = false;
        next.sharedPetDeliveryEntry = false;
        setEntryImages((prevImgs) => {
          const copy = { ...prevImgs };
          delete copy["exclusivePetEntry"];
          delete copy["exclusiveDeliveryEntry"];
          delete copy["sharedPetDeliveryEntry"];
          return copy;
        });
      }

      if (
        (key === "exclusivePetEntry" ||
          key === "exclusiveDeliveryEntry" ||
          key === "sharedPetDeliveryEntry") &&
        checked
      ) {
        next.noExclusiveEntries = false;
      }

      // Option 2 & 3 mutual exclusion
      if (key === "separateVehicleEntryExit" && checked) {
        next.sharedVehicleEntryExit = false;
      } else if (key === "sharedVehicleEntryExit" && checked) {
        next.separateVehicleEntryExit = false;
      }

      // Option 4 & 5 vs Option 6
      if (key === "sharedPetDeliveryEntry" && checked) {
        next.exclusivePetEntry = false;
        next.exclusiveDeliveryEntry = false;
      } else if (
        (key === "exclusivePetEntry" || key === "exclusiveDeliveryEntry") &&
        checked
      ) {
        if (next.exclusivePetEntry && next.exclusiveDeliveryEntry) {
          next.sharedPetDeliveryEntry = false;
        }
      }

      return next;
    });
  };

  const handleSaveProspect = async () => {
    setLoading(true);
    try {
      const payload = {
        ...locationForm,
        stratum: locationForm.stratum ? Number(locationForm.stratum) : null,
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
    if (startStudy && createdProspectId) {
      showSuccess("¡Prospecto registrado! Módulo de Estudio de Seguridad asignado.");
      router.push(`/administrative/prospects/${createdProspectId}/operations`);
    } else {
      showSuccess("¡Prospecto de cliente registrado satisfactoriamente!");
      router.push("/administrative/prospects");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <input
        type="file"
        ref={imageInputRef}
        style={{ display: "none" }}
        accept="image/*,application/pdf"
        onChange={handleFileChange}
      />
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
          {steps.map((label) => (
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
                    select
                    fullWidth
                    label="Estrato Socioeconómico"
                    value={locationForm.stratum}
                    onChange={(e) =>
                      setLocationForm({
                        ...locationForm,
                        stratum: e.target.value,
                      })
                    }
                    helperText="Requerido para cálculo tarifario SVSP"
                  >
                    <MenuItem value="">Sin especificar</MenuItem>
                    <MenuItem value={1}>Estrato 1 (Bajo - Bajo)</MenuItem>
                    <MenuItem value={2}>Estrato 2 (Bajo)</MenuItem>
                    <MenuItem value={3}>Estrato 3 (Medio - Bajo)</MenuItem>
                    <MenuItem value={4}>Estrato 4 (Medio)</MenuItem>
                    <MenuItem value={5}>Estrato 5 (Medio - Alto)</MenuItem>
                    <MenuItem value={6}>Estrato 6 (Alto)</MenuItem>
                  </TextField>
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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

                {/* Entrances Multiple Check — 7 Opciones con Evidencia */}
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.2,
                      mb: 1.5,
                    }}
                  >
                    <DoorFrontIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Control de Accesos y Puntos de Entrada (7 Opciones con Evidencia)
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2.5 }} />

                  <Grid container spacing={2.5}>
                    {/* Columna Izquierda: Accesos Principales y Vehiculares */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                          sx={{ textTransform: "uppercase", display: "block", mb: 1.5 }}
                        >
                          Accesos Peatonales y Vehiculares
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {/* Opción 1: Entrada Principal Peatonal */}
                          <Box>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={Boolean(entries.mainEntry)}
                                  onChange={(e) =>
                                    handleEntryToggle("mainEntry", e.target.checked)
                                  }
                                />
                              }
                              label="1. Entrada Principal (Peatonal)"
                            />
                            {entries.mainEntry && (
                              <Box
                                sx={{
                                  ml: 4,
                                  mt: 0.5,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Button
                                  size="small"
                                  variant={
                                    entryImages["mainEntry"] ? "contained" : "outlined"
                                  }
                                  color={
                                    entryImages["mainEntry"] ? "success" : "primary"
                                  }
                                  startIcon={
                                    entryImages["mainEntry"] ? (
                                      <CheckCircleIcon />
                                    ) : (
                                      <CameraIcon />
                                    )
                                  }
                                  onClick={() => triggerUpload("mainEntry")}
                                  disabled={uploadingKeys["mainEntry"]}
                                >
                                  {uploadingKeys["mainEntry"]
                                    ? "Subiendo Archivo..."
                                    : entryImages["mainEntry"]
                                      ? "Archivo Adjuntado (Cambiar)"
                                      : "Adjuntar Archivo"}
                                </Button>
                                {entryImages["mainEntry"] && (
                                  <>
                                    <Tooltip title="Ver Fotografía">
                                      <IconButton
                                        size="small"
                                        component="a"
                                        href={
                                          typeof entryImages["mainEntry"] === "string"
                                            ? entryImages["mainEntry"]
                                            : entryImages["mainEntry"].url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <OpenInNewIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleRemovePhoto("mainEntry")}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>
                            )}
                          </Box>

                          {/* Opción 2: Vehicular separada */}
                          <Box>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={Boolean(entries.separateVehicleEntryExit)}
                                  disabled={Boolean(entries.sharedVehicleEntryExit)}
                                  onChange={(e) =>
                                    handleEntryToggle(
                                      "separateVehicleEntryExit",
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="2. Vehicular separada para entrada y salida"
                            />
                            {entries.separateVehicleEntryExit && (
                              <Box
                                sx={{
                                  ml: 4,
                                  mt: 0.5,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Button
                                  size="small"
                                  variant={
                                    entryImages["separateVehicleEntryExit"]
                                      ? "contained"
                                      : "outlined"
                                  }
                                  color={
                                    entryImages["separateVehicleEntryExit"]
                                      ? "success"
                                      : "primary"
                                  }
                                  startIcon={
                                    entryImages["separateVehicleEntryExit"] ? (
                                      <CheckCircleIcon />
                                    ) : (
                                      <CameraIcon />
                                    )
                                  }
                                  onClick={() =>
                                    triggerUpload("separateVehicleEntryExit")
                                  }
                                  disabled={
                                    uploadingKeys["separateVehicleEntryExit"]
                                  }
                                >
                                  {uploadingKeys["separateVehicleEntryExit"]
                                    ? "Subiendo Archivo..."
                                    : entryImages["separateVehicleEntryExit"]
                                      ? "Archivo Adjuntado (Cambiar)"
                                      : "Adjuntar Archivo"}
                                </Button>
                                {entryImages["separateVehicleEntryExit"] && (
                                  <>
                                    <Tooltip title="Ver Fotografía">
                                      <IconButton
                                        size="small"
                                        component="a"
                                        href={
                                          typeof entryImages["separateVehicleEntryExit"] === "string"
                                            ? entryImages["separateVehicleEntryExit"]
                                            : entryImages["separateVehicleEntryExit"].url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <OpenInNewIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        handleRemovePhoto("separateVehicleEntryExit")
                                      }
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>
                            )}
                          </Box>

                          {/* Opción 3: Vehicular compartida */}
                          <Box>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={Boolean(entries.sharedVehicleEntryExit)}
                                  disabled={Boolean(entries.separateVehicleEntryExit)}
                                  onChange={(e) =>
                                    handleEntryToggle(
                                      "sharedVehicleEntryExit",
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="3. Vehicular compartida para entrada y salida"
                            />
                            {entries.sharedVehicleEntryExit && (
                              <Box
                                sx={{
                                  ml: 4,
                                  mt: 0.5,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Button
                                  size="small"
                                  variant={
                                    entryImages["sharedVehicleEntryExit"]
                                      ? "contained"
                                      : "outlined"
                                  }
                                  color={
                                    entryImages["sharedVehicleEntryExit"]
                                      ? "success"
                                      : "primary"
                                  }
                                  startIcon={
                                    entryImages["sharedVehicleEntryExit"] ? (
                                      <CheckCircleIcon />
                                    ) : (
                                      <CameraIcon />
                                    )
                                  }
                                  onClick={() => triggerUpload("sharedVehicleEntryExit")}
                                  disabled={uploadingKeys["sharedVehicleEntryExit"]}
                                >
                                  {uploadingKeys["sharedVehicleEntryExit"]
                                    ? "Subiendo Archivo..."
                                    : entryImages["sharedVehicleEntryExit"]
                                      ? "Archivo Adjuntado (Cambiar)"
                                      : "Adjuntar Archivo"}
                                </Button>
                                {entryImages["sharedVehicleEntryExit"] && (
                                  <>
                                    <Tooltip title="Ver Fotografía">
                                      <IconButton
                                        size="small"
                                        component="a"
                                        href={
                                          typeof entryImages["sharedVehicleEntryExit"] === "string"
                                            ? entryImages["sharedVehicleEntryExit"]
                                            : entryImages["sharedVehicleEntryExit"].url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <OpenInNewIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        handleRemovePhoto("sharedVehicleEntryExit")
                                      }
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Columna Derecha: Accesos Especiales y Opción 7 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={700}
                          sx={{ textTransform: "uppercase", display: "block", mb: 1.5 }}
                        >
                          Accesos Especializados y Exclusivos
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {/* Opción 4: Entrada exclusiva mascotas */}
                          <Box>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={Boolean(entries.exclusivePetEntry)}
                                  disabled={
                                    Boolean(entries.noExclusiveEntries) ||
                                    Boolean(entries.sharedPetDeliveryEntry)
                                  }
                                  onChange={(e) =>
                                    handleEntryToggle(
                                      "exclusivePetEntry",
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="4. Entrada exclusiva mascotas"
                            />
                            {entries.exclusivePetEntry && (
                              <Box
                                sx={{
                                  ml: 4,
                                  mt: 0.5,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Button
                                  size="small"
                                  variant={
                                    entryImages["exclusivePetEntry"]
                                      ? "contained"
                                      : "outlined"
                                  }
                                  color={
                                    entryImages["exclusivePetEntry"]
                                      ? "success"
                                      : "primary"
                                  }
                                  startIcon={
                                    entryImages["exclusivePetEntry"] ? (
                                      <CheckCircleIcon />
                                    ) : (
                                      <CameraIcon />
                                    )
                                  }
                                  onClick={() => triggerUpload("exclusivePetEntry")}
                                  disabled={uploadingKeys["exclusivePetEntry"]}
                                >
                                  {uploadingKeys["exclusivePetEntry"]
                                    ? "Subiendo Archivo..."
                                    : entryImages["exclusivePetEntry"]
                                      ? "Archivo Adjuntado (Cambiar)"
                                      : "Adjuntar Archivo"}
                                </Button>
                                {entryImages["exclusivePetEntry"] && (
                                  <>
                                    <Tooltip title="Ver Fotografía">
                                      <IconButton
                                        size="small"
                                        component="a"
                                        href={
                                          typeof entryImages["exclusivePetEntry"] === "string"
                                            ? entryImages["exclusivePetEntry"]
                                            : entryImages["exclusivePetEntry"].url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <OpenInNewIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        handleRemovePhoto("exclusivePetEntry")
                                      }
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>
                            )}
                          </Box>

                          {/* Opción 5: Entrada exclusiva domiciliarios */}
                          <Box>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={Boolean(entries.exclusiveDeliveryEntry)}
                                  disabled={
                                    Boolean(entries.noExclusiveEntries) ||
                                    Boolean(entries.sharedPetDeliveryEntry)
                                  }
                                  onChange={(e) =>
                                    handleEntryToggle(
                                      "exclusiveDeliveryEntry",
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="5. Entrada exclusiva domiciliarios"
                            />
                            {entries.exclusiveDeliveryEntry && (
                              <Box
                                sx={{
                                  ml: 4,
                                  mt: 0.5,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Button
                                  size="small"
                                  variant={
                                    entryImages["exclusiveDeliveryEntry"]
                                      ? "contained"
                                      : "outlined"
                                  }
                                  color={
                                    entryImages["exclusiveDeliveryEntry"]
                                      ? "success"
                                      : "primary"
                                  }
                                  startIcon={
                                    entryImages["exclusiveDeliveryEntry"] ? (
                                      <CheckCircleIcon />
                                    ) : (
                                      <CameraIcon />
                                    )
                                  }
                                  onClick={() => triggerUpload("exclusiveDeliveryEntry")}
                                  disabled={uploadingKeys["exclusiveDeliveryEntry"]}
                                >
                                  {uploadingKeys["exclusiveDeliveryEntry"]
                                    ? "Subiendo Archivo..."
                                    : entryImages["exclusiveDeliveryEntry"]
                                      ? "Archivo Adjuntado (Cambiar)"
                                      : "Adjuntar Archivo"}
                                </Button>
                                {entryImages["exclusiveDeliveryEntry"] && (
                                  <>
                                    <Tooltip title="Ver Fotografía">
                                      <IconButton
                                        size="small"
                                        component="a"
                                        href={
                                          typeof entryImages["exclusiveDeliveryEntry"] === "string"
                                            ? entryImages["exclusiveDeliveryEntry"]
                                            : entryImages["exclusiveDeliveryEntry"].url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <OpenInNewIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        handleRemovePhoto("exclusiveDeliveryEntry")
                                      }
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>
                            )}
                          </Box>

                          {/* Opción 6: Entrada compartida mascotas y domiciliarios */}
                          <Box>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={Boolean(entries.sharedPetDeliveryEntry)}
                                  disabled={
                                    Boolean(entries.noExclusiveEntries) ||
                                    (Boolean(entries.exclusivePetEntry) &&
                                      Boolean(entries.exclusiveDeliveryEntry))
                                  }
                                  onChange={(e) =>
                                    handleEntryToggle(
                                      "sharedPetDeliveryEntry",
                                      e.target.checked,
                                    )
                                  }
                                />
                              }
                              label="6. Entrada compartida para mascotas y domiciliarios"
                            />
                            {entries.sharedPetDeliveryEntry && (
                              <Box
                                sx={{
                                  ml: 4,
                                  mt: 0.5,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Button
                                  size="small"
                                  variant={
                                    entryImages["sharedPetDeliveryEntry"]
                                      ? "contained"
                                      : "outlined"
                                  }
                                  color={
                                    entryImages["sharedPetDeliveryEntry"]
                                      ? "success"
                                      : "primary"
                                  }
                                  startIcon={
                                    entryImages["sharedPetDeliveryEntry"] ? (
                                      <CheckCircleIcon />
                                    ) : (
                                      <CameraIcon />
                                    )
                                  }
                                  onClick={() => triggerUpload("sharedPetDeliveryEntry")}
                                  disabled={uploadingKeys["sharedPetDeliveryEntry"]}
                                >
                                  {uploadingKeys["sharedPetDeliveryEntry"]
                                    ? "Subiendo Archivo..."
                                    : entryImages["sharedPetDeliveryEntry"]
                                      ? "Archivo Adjuntado (Cambiar)"
                                      : "Adjuntar Archivo"}
                                </Button>
                                {entryImages["sharedPetDeliveryEntry"] && (
                                  <>
                                    <Tooltip title="Ver Fotografía">
                                      <IconButton
                                        size="small"
                                        component="a"
                                        href={
                                          typeof entryImages["sharedPetDeliveryEntry"] === "string"
                                            ? entryImages["sharedPetDeliveryEntry"]
                                            : entryImages["sharedPetDeliveryEntry"].url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <OpenInNewIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        handleRemovePhoto("sharedPetDeliveryEntry")
                                      }
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>
                            )}
                          </Box>

                          {/* Opción 7: Sin entradas exclusivas */}
                          <Divider sx={{ my: 0.5 }} />
                          <Box>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={Boolean(entries.noExclusiveEntries)}
                                  onChange={(e) =>
                                    handleEntryToggle(
                                      "noExclusiveEntries",
                                      e.target.checked,
                                    )
                                  }
                                  color="warning"
                                />
                              }
                              label={
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 700, color: "warning.main" }}
                                >
                                  7. Sin entradas exclusivas
                                </Typography>
                              }
                            />
                          </Box>
                        </Box>
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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
                  inputProps={{ min: 0 }}
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

      {/* Security Study Decision Drawer */}
      <ResponsiveFormDrawer
        open={securityStudyDialogOpen}
        onClose={() => handleSecurityStudyDecision(false)}
        title="¿Desea iniciar el Estudio de Seguridad?"
        subtitle="Fase post-registro para evaluación y geofencing"
        customActions={
          <Box sx={{ display: "flex", gap: 1.5, width: "100%", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button
              onClick={() => handleSecurityStudyDecision(false)}
              variant="outlined"
              color="inherit"
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              No, solo guardar prospecto
            </Button>
            <Button
              onClick={() => handleSecurityStudyDecision(true)}
              variant="contained"
              color="primary"
              startIcon={<ShieldIcon />}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Sí, iniciar estudio de seguridad
            </Button>
          </Box>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(14, 165, 233, 0.08)"
                  : "rgba(14, 165, 233, 0.05)",
              border: "1px solid",
              borderColor: "primary.main",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Prospecto Guardado Exitosamente
              </Typography>
              <Typography variant="body2" color="text.secondary">
                El prospecto comercial ha sido registrado en la base de datos de Noxia.
              </Typography>
            </Box>
          </Box>

          <Typography variant="body1">
            ¿Deseas iniciar de inmediato la fase de <strong>Estudio de Seguridad y Vulnerabilidad</strong> para este conjunto residencial?
          </Typography>

          <Typography variant="body2" color="text.secondary">
            • <strong>Sí, iniciar estudio</strong>: Abrirá de inmediato la orden de estudio con herramientas de geofencing perimetral y matriz de riesgos.<br />
            • <strong>No, solo guardar</strong>: El prospecto se mantendrá disponible en el listado para cotización y seguimiento comercial.
          </Typography>
        </Box>
      </ResponsiveFormDrawer>
    </Box>
  );
}
