"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  Breadcrumbs,
  Link,
  CircularProgress,
  useTheme,
  useMediaQuery,
  LinearProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";

// Modular Step Components
import ClientLocationStep, { ClientLocationData } from "@/components/clients/ClientLocationStep";
import ClientStructureStep, {
  TowerItem,
  EntriesDescription,
  AmenitiesData,
} from "@/components/clients/ClientStructureStep";
import ClientContractStep, { ContractFormData } from "@/components/clients/ClientContractStep";
import ClientAdministrationStep, {
  AdminCompanyData,
  IndividualAdminData,
} from "@/components/clients/ClientAdministrationStep";
import ClientCouncilStep, { CouncilMember } from "@/components/clients/ClientCouncilStep";
import { UserOption } from "@/components/common/UserAutocomplete";

const STEPS = [
  "Ubicación y Contacto",
  "Estructura y Amenidades",
  "Información Contractual",
  "Contacto y Administración",
  "Consejo Administrativo",
];

export default function NewClientPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { showError, showSuccess } = useNotification();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Location & General Info
  const [locationForm, setLocationForm] = useState<ClientLocationData>({
    sector: "RESIDENTIAL",
    name: "",
    nit: "",
    address: "",
    phone: "",
    email: "",
    commune: "",
    neighborhood: "",
    city: "Bogotá",
    state: "Cundinamarca",
    cai: "",
    quadrant: "",
    quadrantPhone: "",
    observations: "",
  });
  const [locationErrors, setLocationErrors] = useState<Record<string, string>>({});

  // Step 2: Structure, Entries & Amenities (Initialized clean without hardcoded defaults)
  const [structureType, setStructureType] = useState<string>("BUILDING_CLUSTER");
  const [floorsAmount, setFloorsAmount] = useState<number>(0);
  const [apartmentsPerFloor, setApartmentsPerFloor] = useState<number>(0);
  const [singleElevators, setSingleElevators] = useState<number>(0);
  const [towers, setTowers] = useState<TowerItem[]>([
    { towerName: "Torre 1", floorsAmount: 0, apartmentsPerFloor: 0, elevators: 0 },
  ]);
  const [unitsAmount, setUnitsAmount] = useState<number>(0);
  const [housePrefix, setHousePrefix] = useState<string>("Casa");

  const [entries, setEntries] = useState<EntriesDescription>({
    mainEntry: false,
    separateVehicleEntryExit: false,
    sharedVehicleEntryExit: false,
    exclusivePetEntry: false,
    exclusiveDeliveryEntry: false,
    sharedPetDeliveryEntry: false,
    noExclusiveEntries: false,
  });
  const [entryImages, setEntryImages] = useState<Record<string, any>>({});

  const [amenities, setAmenities] = useState<AmenitiesData>({
    hasParking: false,
    parkingAmount: 0,
    hasGuestParking: false,
    guestParkingAmount: 0,
    hasMotorcycleParking: false,
    motorcycleParkingAmount: 0,
    hasBicycleRack: false,
    bicycleRackAmount: 0,
    bicycleCapacityPerRack: 0,
    hasStorageRoom: false,
    storageRoomAmount: 0,
    hasSocialRoom: false,
    socialRoomAmount: 0,
    hasGym: false,
    gymAmount: 0,
    hasPool: false,
    poolAmount: 0,
    hasPlayground: false,
    playgroundAmount: 0,
    hasSquashCourt: false,
    squashCourtAmount: 0,
    hasTennisCourt: false,
    tennisCourtAmount: 0,
    hasFootballCourt: false,
    footballCourtAmount: 0,
    hasBasketballCourt: false,
    basketballCourtAmount: 0,
  });

  // Step 3: Contractual Info & Real Attachments
  const [contractForm, setContractForm] = useState<ContractFormData>({
    contractNumber: `CONT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    contractStatus: "ACTIVE",
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
  const [coordinatorUser, setCoordinatorUser] = useState<UserOption | null>(null);
  const [commercialUser, setCommercialUser] = useState<UserOption | null>(null);
  const [contractMediaFiles, setContractMediaFiles] = useState<Record<string, any>>({});

  // Step 4: Contact & Administration Info
  const [administrationType, setAdministrationType] = useState<"INDIVIDUAL" | "ENTERPRISE">("INDIVIDUAL");
  const [individualAdminData, setIndividualAdminData] = useState<IndividualAdminData>({
    administrator: "",
    representativeDocument: "",
    administratorEmail: "",
    administratorPhone: "",
  });
  const [enterpriseAdminData, setEnterpriseAdminData] = useState<AdminCompanyData>({
    companyName: "",
    nit: "",
    email: "",
    phone: "",
    legalRepName: "",
    legalRepId: "",
    legalRepPhone: "",
    additionalContacts: [],
  });

  // Step 5: Council Data
  const [councilPresident, setCouncilPresident] = useState<CouncilMember>({
    name: "",
    phone: "",
    email: "",
    unit: "",
  });
  const [councilTreasurer, setCouncilTreasurer] = useState<CouncilMember>({
    name: "",
    phone: "",
    email: "",
    unit: "",
  });
  const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>([
    { name: "", phone: "", email: "", unit: "" },
  ]);

  // Step Validation
  const validateStep = (stepIdx: number): boolean => {
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
      if (Object.keys(errs).length > 0) {
        showError("Por favor complete los campos obligatorios de ubicación.");
        return false;
      }
    } else if (stepIdx === 1) {
      if (structureType === "BUILDING_CLUSTER" && towers.length === 0) {
        showError("Debe definir al menos una torre para el conjunto.");
        return false;
      }
      if ((structureType === "HOUSE_CLUSTER" || structureType === "COMMERCIAL") && unitsAmount <= 0) {
        showError("Debe indicar una cantidad válida de unidades.");
        return false;
      }
    } else if (stepIdx === 2) {
      if (!contractForm.contractNumber.trim()) {
        showError("El número de contrato es obligatorio.");
        return false;
      }
    } else if (stepIdx === 3) {
      if (administrationType === "INDIVIDUAL" && !individualAdminData.administrator.trim()) {
        showError("El nombre del administrador es obligatorio.");
        return false;
      }
      if (administrationType === "ENTERPRISE" && !enterpriseAdminData.companyName.trim()) {
        showError("La razón social de la empresa administradora es obligatoria.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit Client & Structure
  const handleCreateClient = async () => {
    if (!validateStep(activeStep)) return;

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
        contractMediaFiles,
        administrationType,
        administrationCompanyData:
          administrationType === "ENTERPRISE" ? enterpriseAdminData : null,
        administrator:
          administrationType === "INDIVIDUAL"
            ? individualAdminData.administrator
            : enterpriseAdminData.legalRepName || enterpriseAdminData.companyName,
        administratorPhone:
          administrationType === "INDIVIDUAL"
            ? individualAdminData.administratorPhone
            : enterpriseAdminData.phone,
        administratorEmail:
          administrationType === "INDIVIDUAL"
            ? individualAdminData.administratorEmail
            : enterpriseAdminData.email,
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
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1280, mx: "auto" }}>
      {/* Breadcrumb Navigation */}
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
        <Typography color="text.primary">Nuevo Cliente</Typography>
      </Breadcrumbs>

      {/* Header and Stepper */}
      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, mb: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: "text.primary", fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
            >
              Registro Integral de Cliente
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Paso {activeStep + 1} de {STEPS.length}: {STEPS[activeStep]}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/administrative/clients")}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              alignSelf: { xs: "stretch", sm: "auto" },
              justifyContent: "center",
            }}
          >
            Volver a Clientes
          </Button>
        </Box>

        {isMobile ? (
          <Box sx={{ width: "100%", mt: 1 }}>
            <Box sx={{ display: "flex", gap: 0.75, mb: 1.5 }}>
              {STEPS.map((s, idx) => (
                <Box
                  key={idx}
                  sx={{
                    flex: 1,
                    height: 5,
                    borderRadius: 2.5,
                    bgcolor: idx <= activeStep ? "primary.main" : "action.hover",
                    transition: "background-color 0.3s ease",
                  }}
                />
              ))}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", fontSize: "0.8rem" }}>
                {STEPS[activeStep]}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {activeStep + 1} de {STEPS.length}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label, index) => (
              <Step key={label} completed={activeStep > index}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
      </Paper>

      {/* Active Step Content */}
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        {activeStep === 0 && (
          <ClientLocationStep
            data={locationForm}
            onChange={(field, val) => setLocationForm({ ...locationForm, [field]: val })}
            errors={locationErrors}
          />
        )}

        {activeStep === 1 && (
          <ClientStructureStep
            structureType={structureType}
            onChangeStructureType={setStructureType}
            floorsAmount={floorsAmount}
            onChangeFloorsAmount={setFloorsAmount}
            apartmentsPerFloor={apartmentsPerFloor}
            onChangeApartmentsPerFloor={setApartmentsPerFloor}
            singleElevators={singleElevators}
            onChangeSingleElevators={setSingleElevators}
            unitsAmount={unitsAmount}
            onChangeUnitsAmount={setUnitsAmount}
            housePrefix={housePrefix}
            onChangeHousePrefix={setHousePrefix}
            towers={towers}
            onChangeTowers={setTowers}
            entries={entries}
            onChangeEntries={setEntries}
            entryImages={entryImages}
            onChangeEntryImages={setEntryImages}
            amenities={amenities}
            onChangeAmenities={setAmenities}
          />
        )}

        {activeStep === 2 && (
          <ClientContractStep
            contractForm={contractForm}
            onChangeContractForm={setContractForm}
            coordinatorUser={coordinatorUser}
            onChangeCoordinatorUser={setCoordinatorUser}
            commercialUser={commercialUser}
            onChangeCommercialUser={setCommercialUser}
            contractMediaFiles={contractMediaFiles}
            onChangeContractMediaFiles={setContractMediaFiles}
          />
        )}

        {activeStep === 3 && (
          <ClientAdministrationStep
            administrationType={administrationType}
            onChangeAdministrationType={setAdministrationType}
            individualAdmin={individualAdminData}
            onChangeIndividualAdmin={setIndividualAdminData}
            enterpriseAdmin={enterpriseAdminData}
            onChangeEnterpriseAdmin={setEnterpriseAdminData}
          />
        )}

        {activeStep === 4 && (
          <ClientCouncilStep
            councilPresident={councilPresident}
            onChangeCouncilPresident={setCouncilPresident}
            councilTreasurer={councilTreasurer}
            onChangeCouncilTreasurer={setCouncilTreasurer}
            councilMembers={councilMembers}
            onChangeCouncilMembers={setCouncilMembers}
          />
        )}

        {/* Stepper Navigation Footer */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column-reverse", sm: "row" },
            justifyContent: "space-between",
            alignItems: "stretch",
            gap: 2,
            mt: 4,
            pt: 3,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
            startIcon={<ArrowBackIcon />}
            sx={{
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2.5,
              minHeight: 46,
              px: 3,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            Atrás
          </Button>

          {activeStep < STEPS.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}
              sx={{
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2.5,
                minHeight: 46,
                px: 3.5,
                boxShadow: 2,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              Siguiente: {STEPS[activeStep + 1]}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleCreateClient}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckIcon />}
              sx={{
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2.5,
                minHeight: 46,
                px: 4,
                boxShadow: 2,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {loading ? "Creando Cliente..." : "Finalizar y Crear Cliente"}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
