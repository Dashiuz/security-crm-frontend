"use client";

import { useState, useEffect } from "react";
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
  CircularProgress,
  IconButton,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";

interface TowerInput {
  towerName: string;
  floorsAmount: number;
  apartmentsPerFloor: number;
  elevators: number;
}

interface DynamicContact {
  roleName: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  birthdate?: string;
  attachmentName?: string;
}

interface CouncilMember {
  name: string;
  email: string;
  phone: string;
  unit: string;
}

const steps = [
  "Ubicación",
  "Estructura",
  "Contractual",
  "Contacto y Administración",
  "Consejo Administrativo",
];

export default function CreateClientPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);

  // Step 1: Location & General Info
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
  const [locationErrors, setLocationErrors] = useState<Record<string, string>>({});

  // Step 2: Structural Data
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

  // Step 3: Contractual Info
  const [contractForm, setContractForm] = useState({
    contractNumber: `CONT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    renewedContract: false,
    contractDate: new Date().toISOString().split("T")[0],
    lastContractDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split("T")[0],
    coordinatorInChargeId: "",
    commercialContactId: "",
    installedTech: false,
    weaponsAmount: 0,
    securityStudy: "",
  });
  const [contractDocs, setContractDocs] = useState<Record<string, string>>({});

  // Step 4: Contact & Administration Info
  const [administrationType, setAdministrationType] = useState<"ENTERPRISE" | "INDIVIDUAL">("INDIVIDUAL");

  // If Enterprise
  const [adminCompanyData, setAdminCompanyData] = useState({
    companyName: "",
    nit: "",
    address: "",
    email: "",
    phone: "",
    legalRepresentative: {
      name: "",
      document: "",
      email: "",
      phone: "",
      birthdate: "",
      attachmentName: "",
    },
    hasDelegatedAdmin: false,
    delegatedAdmin: {
      name: "",
      document: "",
      email: "",
      phone: "",
      birthdate: "",
      attachmentName: "",
    },
    hasAdminAssistant: false,
    adminAssistant: {
      name: "",
      document: "",
      email: "",
      phone: "",
      birthdate: "",
      attachmentName: "",
    },
  });

  const [additionalAdminContacts, setAdditionalAdminContacts] = useState<DynamicContact[]>([]);

  // If Individual
  const [individualAdminData, setIndividualAdminData] = useState({
    administrator: "",
    representativeDocument: "",
    administratorEmail: "",
    administratorPhone: "",
  });

  // Step 5: Council Data
  const [councilPresident, setCouncilPresident] = useState({ name: "", email: "", phone: "", unit: "" });
  const [councilTreasurer, setCouncilTreasurer] = useState({ name: "", email: "", phone: "", unit: "" });
  const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>([
    { name: "", email: "", phone: "", unit: "" },
  ]);

  const handleImagePlaceholder = (entryKey: string) => {
    setEntryImages((prev) => ({
      ...prev,
      [entryKey]: `foto_entrada_${entryKey}.jpg (adjuntada)`,
    }));
  };

  useEffect(() => {
    HttpClient.get<any[]>("/employee")
      .then((data) => {
        setEmployees(
          data.map((e) => ({
            value: e.id,
            label: `${e.fullName} (${e.positionName || "Sin Cargo"})`,
          })),
        );
      })
      .catch(() => {});
  }, []);

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
      setLocationErrors(errs);
      return Object.keys(errs).length === 0;
    }
    if (stepIdx === 2) {
      if (!contractForm.contractNumber.trim()) {
        showError("El número de contrato es requerido.");
        return false;
      }
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

  // Towers
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

  // Entrances
  const handleEntryChange = (name: keyof typeof entries, checked: boolean) => {
    setEntries((prev) => {
      const updated = { ...prev, [name]: checked };
      if (name === "separateVehicleEntryExit" && checked) updated.sharedVehicleEntryExit = false;
      else if (name === "sharedVehicleEntryExit" && checked) updated.separateVehicleEntryExit = false;

      if (name === "sharedPetDeliveryEntry" && checked) {
        updated.exclusivePetEntry = false;
        updated.exclusiveDeliveryEntry = false;
      } else if ((name === "exclusivePetEntry" || name === "exclusiveDeliveryEntry") && checked) {
        if (updated.exclusivePetEntry && updated.exclusiveDeliveryEntry) updated.sharedPetDeliveryEntry = false;
      }
      return updated;
    });
  };

  // Additional Admin Contacts
  const handleAddAdminContact = () => {
    setAdditionalAdminContacts((prev) => [
      ...prev,
      { roleName: "Asistente", name: "", document: "", email: "", phone: "" },
    ]);
  };
  const handleRemoveAdminContact = (idx: number) => {
    setAdditionalAdminContacts((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleAdminContactChange = (idx: number, field: keyof DynamicContact, val: string) => {
    setAdditionalAdminContacts((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  // Council Members
  const handleAddCouncilMember = () => {
    setCouncilMembers((prev) => [...prev, { name: "", email: "", phone: "", unit: "" }]);
  };
  const handleRemoveCouncilMember = (idx: number) => {
    setCouncilMembers((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleCouncilMemberChange = (idx: number, field: keyof CouncilMember, val: string) => {
    setCouncilMembers((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleDocMockUpload = (docKey: string) => {
    setContractDocs((prev) => ({
      ...prev,
      [docKey]: `documento_${docKey}.pdf (cargado)`,
    }));
  };

  const handleCreateClient = async () => {
    setLoading(true);
    try {
      const payload: any = {
        ...locationForm,
        contractNumber: contractForm.contractNumber.trim(),
        renewedContract: contractForm.renewedContract,
        contractDate: contractForm.contractDate ? contractForm.contractDate : null,
        lastContractDate: contractForm.lastContractDate ? contractForm.lastContractDate : null,
        contractEndDate: contractForm.lastContractDate ? contractForm.lastContractDate : null,
        installedTech: contractForm.installedTech,
        weaponsAmount: Number(contractForm.weaponsAmount || 0),
        securityStudy: contractForm.securityStudy,
        coordinatorInChargeId: contractForm.coordinatorInChargeId || null,
        commercialContactId: contractForm.commercialContactId || null,
        contractMediaFiles: contractDocs,
        administrationType,
        administrationCompanyData:
          administrationType === "ENTERPRISE"
            ? { ...adminCompanyData, additionalContacts: additionalAdminContacts }
            : null,
        administrator:
          administrationType === "INDIVIDUAL"
            ? individualAdminData.administrator
            : adminCompanyData.legalRepresentative.name,
        administratorPhone:
          administrationType === "INDIVIDUAL"
            ? individualAdminData.administratorPhone
            : adminCompanyData.phone,
        administratorEmail:
          administrationType === "INDIVIDUAL"
            ? individualAdminData.administratorEmail
            : adminCompanyData.email,
        councilData: {
          president: councilPresident,
          treasurer: councilTreasurer,
          councilMembers: councilMembers.filter((m) => m.name.trim() !== ""),
        },
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

      await HttpClient.post("/client/with-structure", payload);
      showSuccess("¡Cliente y conjunto residencial registrados con éxito!");
      router.push("/administrative/clients");
    } catch (err: any) {
      showError(err.message || "Error al registrar el cliente.");
    } finally {
      setLoading(false);
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
            router.push("/administrative/clients");
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
            router.push("/administrative/clients");
          }}
          sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
        >
          Clientes
        </Link>
        <Typography color="text.primary">Nuevo Cliente</Typography>
      </Breadcrumbs>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/administrative/clients")}
            sx={{ borderRadius: 2 }}
          >
            Volver a Clientes
          </Button>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Registro Integral de Cliente
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, boxShadow: 1 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Wizard Form */}
      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <CardContent sx={{ p: 4 }}>
          {/* STEP 1: UBICACION */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
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
                    <MenuItem value="RESIDENTIAL">Residencial</MenuItem>
                    <MenuItem value="COMMERCIAL">Comercial</MenuItem>
                    <MenuItem value="INDUSTRIAL">Industrial</MenuItem>
                    <MenuItem value="GOVERNMENT">Gubernamental</MenuItem>
                    <MenuItem value="OTHER">Otro</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Nombre o Razón Social *"
                    value={locationForm.name}
                    error={Boolean(locationErrors.name)}
                    helperText={locationErrors.name}
                    onChange={(e) => {
                      setLocationForm({ ...locationForm, name: e.target.value });
                      if (locationErrors.name) setLocationErrors({ ...locationErrors, name: "" });
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="NIT *"
                    value={locationForm.nit}
                    error={Boolean(locationErrors.nit)}
                    helperText={locationErrors.nit}
                    onChange={(e) => {
                      setLocationForm({ ...locationForm, nit: e.target.value });
                      if (locationErrors.nit) setLocationErrors({ ...locationErrors, nit: "" });
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Dirección *"
                    value={locationForm.address}
                    error={Boolean(locationErrors.address)}
                    helperText={locationErrors.address}
                    onChange={(e) => {
                      setLocationForm({ ...locationForm, address: e.target.value });
                      if (locationErrors.address) setLocationErrors({ ...locationErrors, address: "" });
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Teléfono *"
                    value={locationForm.phone}
                    error={Boolean(locationErrors.phone)}
                    helperText={locationErrors.phone}
                    onChange={(e) => {
                      const numVal = e.target.value.replace(/\D/g, "");
                      setLocationForm({ ...locationForm, phone: numVal });
                      if (locationErrors.phone) setLocationErrors({ ...locationErrors, phone: "" });
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico *"
                    value={locationForm.email}
                    error={Boolean(locationErrors.email)}
                    helperText={locationErrors.email}
                    onChange={(e) => {
                      setLocationForm({ ...locationForm, email: e.target.value });
                      if (locationErrors.email) setLocationErrors({ ...locationErrors, email: "" });
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
                    value={locationForm.commune}
                    onChange={(e) => setLocationForm({ ...locationForm, commune: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Barrio"
                    value={locationForm.neighborhood}
                    onChange={(e) => setLocationForm({ ...locationForm, neighborhood: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="CAI Cercano"
                    value={locationForm.cai}
                    onChange={(e) => setLocationForm({ ...locationForm, cai: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Cuadrante"
                    value={locationForm.quadrant}
                    onChange={(e) => setLocationForm({ ...locationForm, quadrant: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Teléfono del Cuadrante"
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
                    label="Observaciones"
                    value={locationForm.observations}
                    onChange={(e) => setLocationForm({ ...locationForm, observations: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
                <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={handleNext} sx={{ px: 4 }}>
                  Siguiente: Estructura
                </Button>
              </Box>
            </Box>
          )}

          {/* STEP 2: ESTRUCTURA */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
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

                {/* Entrances */}
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

                {/* Amenities */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
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
                <Button variant="outlined" onClick={handleBack}>
                  Atrás
                </Button>
                <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={handleNext} sx={{ px: 4 }}>
                  Siguiente: Información Contractual
                </Button>
              </Box>
            </Box>
          )}

          {/* STEP 3: CONTRACTUAL */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                📄 3. Información Contractual y Documentación
              </Typography>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Número de Contrato *"
                    value={contractForm.contractNumber}
                    onChange={(e) => setContractForm({ ...contractForm, contractNumber: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de Contrato"
                    value={contractForm.renewedContract ? "RENEWED" : "NEW"}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, renewedContract: e.target.value === "RENEWED" })
                    }
                  >
                    <MenuItem value="NEW">Contrato Nuevo</MenuItem>
                    <MenuItem value="RENEWED">Contrato Renovado</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha Inicial del Contrato"
                    InputLabelProps={{ shrink: true }}
                    value={contractForm.contractDate}
                    onChange={(e) => setContractForm({ ...contractForm, contractDate: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha Final del Contrato"
                    InputLabelProps={{ shrink: true }}
                    value={contractForm.lastContractDate}
                    onChange={(e) => setContractForm({ ...contractForm, lastContractDate: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Contacto Comercial Asignado"
                    value={contractForm.commercialContactId}
                    onChange={(e) => setContractForm({ ...contractForm, commercialContactId: e.target.value })}
                  >
                    <MenuItem value="">-- Sin Asignar --</MenuItem>
                    {employees.map((e) => (
                      <MenuItem key={e.value} value={e.value}>
                        {e.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Coordinador de Ingeniería / Operaciones"
                    value={contractForm.coordinatorInChargeId}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, coordinatorInChargeId: e.target.value })
                    }
                  >
                    <MenuItem value="">-- Sin Asignar --</MenuItem>
                    {employees.map((e) => (
                      <MenuItem key={e.value} value={e.value}>
                        {e.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Document Attachments */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2, mb: 1.5 }}>
                    📎 Adjuntos y Soportes Contractuales
                  </Typography>
                  <Grid container spacing={2}>
                    {[
                      { key: "financialStatements", label: "Estados Financieros" },
                      { key: "legalRepresentation", label: "Representación Jurídica" },
                      { key: "serviceOrder", label: "Orden de Servicio" },
                      { key: "contractDoc", label: "Documento de Contrato" },
                      { key: "otroSi", label: "Otro Sí" },
                      { key: "basc", label: "Certificación BASC" },
                      { key: "insurancePolicy", label: "Pólizas de Seguro" },
                      { key: "techContract", label: "Contratos de Tecnología" },
                    ].map((doc) => (
                      <Grid key={doc.key} size={{ xs: 12, sm: 6, md: 3 }}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            {doc.label}
                          </Typography>
                          <Button
                            size="small"
                            variant={contractDocs[doc.key] ? "contained" : "outlined"}
                            color={contractDocs[doc.key] ? "success" : "primary"}
                            startIcon={<CloudUploadIcon />}
                            onClick={() => handleDocMockUpload(doc.key)}
                          >
                            {contractDocs[doc.key] ? "Cargado" : "Adjuntar PDF"}
                          </Button>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                <Button variant="outlined" onClick={handleBack}>
                  Atrás
                </Button>
                <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={handleNext} sx={{ px: 4 }}>
                  Siguiente: Contacto y Administración
                </Button>
              </Box>
            </Box>
          )}

          {/* STEP 4: CONTACTO Y ADMINISTRACION */}
          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                👤 4. Información de Contacto del Cliente y Administración
              </Typography>

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de Administración *"
                    value={administrationType}
                    onChange={(e) => setAdministrationType(e.target.value as any)}
                  >
                    <MenuItem value="INDIVIDUAL">Administración Individual / Directa</MenuItem>
                    <MenuItem value="ENTERPRISE">Empresa Administradora Tercerizada</MenuItem>
                  </TextField>
                </Grid>

                {administrationType === "INDIVIDUAL" ? (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Nombre del Administrador *"
                        value={individualAdminData.administrator}
                        onChange={(e) =>
                          setIndividualAdminData({ ...individualAdminData, administrator: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Cédula del Administrador"
                        value={individualAdminData.representativeDocument}
                        onChange={(e) =>
                          setIndividualAdminData({
                            ...individualAdminData,
                            representativeDocument: e.target.value,
                          })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Correo del Administrador"
                        value={individualAdminData.administratorEmail}
                        onChange={(e) =>
                          setIndividualAdminData({
                            ...individualAdminData,
                            administratorEmail: e.target.value,
                          })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Teléfono del Administrador"
                        value={individualAdminData.administratorPhone}
                        onChange={(e) =>
                          setIndividualAdminData({
                            ...individualAdminData,
                            administratorPhone: e.target.value.replace(/\D/g, ""),
                          })
                        }
                      />
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Razón Social de la Empresa Administradora *"
                        value={adminCompanyData.companyName}
                        onChange={(e) =>
                          setAdminCompanyData({ ...adminCompanyData, companyName: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="NIT de la Empresa"
                        value={adminCompanyData.nit}
                        onChange={(e) =>
                          setAdminCompanyData({ ...adminCompanyData, nit: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Correo de la Empresa"
                        value={adminCompanyData.email}
                        onChange={(e) =>
                          setAdminCompanyData({ ...adminCompanyData, email: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Teléfono de la Empresa"
                        value={adminCompanyData.phone}
                        onChange={(e) =>
                          setAdminCompanyData({
                            ...adminCompanyData,
                            phone: e.target.value.replace(/\D/g, ""),
                          })
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                        Representante Legal
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Nombre Representante"
                        value={adminCompanyData.legalRepresentative.name}
                        onChange={(e) =>
                          setAdminCompanyData({
                            ...adminCompanyData,
                            legalRepresentative: {
                              ...adminCompanyData.legalRepresentative,
                              name: e.target.value,
                            },
                          })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Cédula"
                        value={adminCompanyData.legalRepresentative.document}
                        onChange={(e) =>
                          setAdminCompanyData({
                            ...adminCompanyData,
                            legalRepresentative: {
                              ...adminCompanyData.legalRepresentative,
                              document: e.target.value,
                            },
                          })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Teléfono"
                        value={adminCompanyData.legalRepresentative.phone}
                        onChange={(e) =>
                          setAdminCompanyData({
                            ...adminCompanyData,
                            legalRepresentative: {
                              ...adminCompanyData.legalRepresentative,
                              phone: e.target.value.replace(/\D/g, ""),
                            },
                          })
                        }
                      />
                    </Grid>

                    {/* Additional Contacts */}
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, mb: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Contactos Adicionales de la Administración
                        </Typography>
                        <Button startIcon={<AddIcon />} size="small" variant="outlined" onClick={handleAddAdminContact}>
                          Agregar Contacto
                        </Button>
                      </Box>

                      {additionalAdminContacts.map((contact, idx) => (
                        <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, sm: 3 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Cargo / Rol"
                                value={contact.roleName}
                                onChange={(e) => handleAdminContactChange(idx, "roleName", e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 3 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Nombre"
                                value={contact.name}
                                onChange={(e) => handleAdminContactChange(idx, "name", e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 3 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Teléfono"
                                value={contact.phone}
                                onChange={(e) =>
                                  handleAdminContactChange(
                                    idx,
                                    "phone",
                                    e.target.value.replace(/\D/g, ""),
                                  )
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 2.5 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Correo"
                                value={contact.email}
                                onChange={(e) => handleAdminContactChange(idx, "email", e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 0.5 }}>
                              <IconButton color="error" size="small" onClick={() => handleRemoveAdminContact(idx)}>
                                <DeleteIcon />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Grid>
                  </>
                )}
              </Grid>

              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                <Button variant="outlined" onClick={handleBack}>
                  Atrás
                </Button>
                <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={handleNext} sx={{ px: 4 }}>
                  Siguiente: Consejo Administrativo
                </Button>
              </Box>
            </Box>
          )}

          {/* STEP 5: CONSEJO ADMINISTRATIVO */}
          {activeStep === 4 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                🏛️ 5. Datos del Consejo de Administración
              </Typography>

              <Grid container spacing={2.5}>
                {/* Presidente */}
                <Grid size={{ xs: 12 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                      Presidente del Consejo
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Nombre Completo"
                          value={councilPresident.name}
                          onChange={(e) => setCouncilPresident({ ...councilPresident, name: e.target.value })}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Teléfono"
                          value={councilPresident.phone}
                          onChange={(e) =>
                            setCouncilPresident({
                              ...councilPresident,
                              phone: e.target.value.replace(/\D/g, ""),
                            })
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Correo Electrónico"
                          value={councilPresident.email}
                          onChange={(e) => setCouncilPresident({ ...councilPresident, email: e.target.value })}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Apto / Casa"
                          value={councilPresident.unit}
                          onChange={(e) => setCouncilPresident({ ...councilPresident, unit: e.target.value })}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Tesorero */}
                <Grid size={{ xs: 12 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                      Tesorero del Consejo
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Nombre Completo"
                          value={councilTreasurer.name}
                          onChange={(e) => setCouncilTreasurer({ ...councilTreasurer, name: e.target.value })}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Teléfono"
                          value={councilTreasurer.phone}
                          onChange={(e) =>
                            setCouncilTreasurer({
                              ...councilTreasurer,
                              phone: e.target.value.replace(/\D/g, ""),
                            })
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Correo Electrónico"
                          value={councilTreasurer.email}
                          onChange={(e) => setCouncilTreasurer({ ...councilTreasurer, email: e.target.value })}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Apto / Casa"
                          value={councilTreasurer.unit}
                          onChange={(e) => setCouncilTreasurer({ ...councilTreasurer, unit: e.target.value })}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Otros Consejeros */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1, mb: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Otros Consejeros / Vocales
                    </Typography>
                    <Button startIcon={<AddIcon />} size="small" variant="outlined" onClick={handleAddCouncilMember}>
                      Agregar Consejero
                    </Button>
                  </Box>

                  {councilMembers.map((member, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label={`Consejero #${idx + 1} - Nombre`}
                            value={member.name}
                            onChange={(e) => handleCouncilMemberChange(idx, "name", e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Teléfono"
                            value={member.phone}
                            onChange={(e) =>
                              handleCouncilMemberChange(
                                idx,
                                "phone",
                                e.target.value.replace(/\D/g, ""),
                              )
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Correo"
                            value={member.email}
                            onChange={(e) => handleCouncilMemberChange(idx, "email", e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 1.5 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Inmueble"
                            value={member.unit}
                            onChange={(e) => handleCouncilMemberChange(idx, "unit", e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 0.5 }}>
                          {councilMembers.length > 1 && (
                            <IconButton color="error" size="small" onClick={() => handleRemoveCouncilMember(idx)}>
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                <Button variant="outlined" onClick={handleBack} disabled={loading}>
                  Atrás
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleCreateClient}
                  disabled={loading}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  {loading ? "Guardando Cliente..." : "Finalizar y Registrar Cliente"}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
