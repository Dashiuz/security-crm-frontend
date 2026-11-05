"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Skeleton,
  useTheme,
  Chip,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  EditRounded as EditIcon,
  HomeWorkRounded as HomeWorkIcon,
  PoolRounded as PoolIcon,
  DoorFrontRounded as DoorFrontIcon,
  PhotoCameraRounded as CameraIcon,
  DeleteRounded as DeleteIcon,
  CheckCircleRounded as CheckCircleIcon,
  OpenInNewRounded as OpenInNewIcon,
} from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { useNotification } from "@/providers/NotificationProvider";
import { useProspectDetail } from "../ProspectContext";

const COMPLEX_TYPES = [
  { value: "BUILDING_CLUSTER", label: "Conjunto de Edificios / Torres" },
  { value: "GATED_COMMUNITY", label: "Conjunto Cerrado de Casas" },
  { value: "SINGLE_BUILDING", label: "Edificio Único" },
  { value: "COMMERCIAL_BUILDING", label: "Centro / Complejo Comercial" },
  { value: "INDUSTRIAL_PARK", label: "Parque Industrial / Logístico" },
  { value: "MIXED", label: "Uso Mixto (Residencial y Comercial)" },
];

export default function ProspectOperationsPage() {
  const { prospectId, prospect, loading, saving, updateOperations, permissions } =
    useProspectDetail();
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();

  // Active drawer: null | "structure" | "amenities" | "entries"
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);

  // Structure Form
  const [structureForm, setStructureForm] = useState({
    structureType: "BUILDING_CLUSTER",
    towersAmount: 1,
    floorsAmount: 5,
    apartmentsPerFloor: 4,
    unitsAmount: 20,
    elevatorsAmount: 1,
  });

  // Amenities Form
  const [amenitiesForm, setAmenitiesForm] = useState({
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
    hasParking: true,
    parkingAmount: 20,
    hasGuestParking: true,
    guestParkingAmount: 5,
    hasMotorcycleParking: false,
    motorcycleParkingAmount: 0,
    hasBicycleParking: false,
    bicycleParkingAmount: 0,
    hasCommercialStores: false,
    commercialStoresAmount: 0,
  });

  // Access Entries Form
  const [entriesForm, setEntriesForm] = useState({
    mainEntry: true,
    separateVehicleEntryExit: false,
    sharedVehicleEntryExit: true,
    exclusivePetEntry: false,
    exclusiveDeliveryEntry: false,
    sharedPetDeliveryEntry: true,
    noExclusiveEntries: false,
  });

  const [entryImages, setEntryImages] = useState<Record<string, any>>({});
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [activeImageKey, setActiveImageKey] = useState<string | null>(null);

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

  // Sync state with prospect data
  useEffect(() => {
    if (prospect?.clientProperties) {
      const cp = prospect.clientProperties as any;
      setStructureForm({
        structureType: cp.structureType || "BUILDING_CLUSTER",
        towersAmount: cp.towersAmount || 1,
        floorsAmount: cp.floorsAmount || 5,
        apartmentsPerFloor: cp.apartmentsPerFloor || 4,
        unitsAmount: cp.unitsAmount || 20,
        elevatorsAmount: cp.elevatorsAmount || 1,
      });

      setAmenitiesForm({
        hasSocialRoom: Boolean(cp.hasSocialRoom || cp.hasCommunalLounge),
        socialRoomAmount: cp.socialRoomAmount || 0,
        hasGym: Boolean(cp.hasGym),
        gymAmount: cp.gymAmount || 0,
        hasPool: Boolean(cp.hasPool || cp.hasSwimmingPool),
        poolAmount: cp.poolAmount || 0,
        hasPlayground: Boolean(cp.hasPlayground || cp.hasChildrenPlayground),
        playgroundAmount: cp.playgroundAmount || 0,
        hasSquashCourt: Boolean(cp.hasSquashCourt),
        squashCourtAmount: cp.squashCourtAmount || 0,
        hasTennisCourt: Boolean(cp.hasTennisCourt),
        tennisCourtAmount: cp.tennisCourtAmount || 0,
        hasFootballCourt: Boolean(cp.hasFootballCourt),
        footballCourtAmount: cp.footballCourtAmount || 0,
        hasBasketballCourt: Boolean(cp.hasBasketballCourt),
        basketballCourtAmount: cp.basketballCourtAmount || 0,
        hasParking: Boolean(cp.hasParking ?? true),
        parkingAmount: cp.parkingAmount || 20,
        hasGuestParking: Boolean(cp.hasGuestParking || cp.hasVisitorParking),
        guestParkingAmount: cp.guestParkingAmount || cp.visitorParkingAmount || 5,
        hasMotorcycleParking: Boolean(cp.hasMotorcycleParking),
        motorcycleParkingAmount: cp.motorcycleParkingAmount || 0,
        hasBicycleParking: Boolean(cp.hasBicycleParking || cp.hasBicycleRack),
        bicycleParkingAmount: cp.bicycleParkingAmount || cp.bicycleRackAmount || 0,
        hasCommercialStores: Boolean(cp.hasCommercialStores),
        commercialStoresAmount: cp.commercialStoresAmount || 0,
      });

      if (cp.entriesDescription && typeof cp.entriesDescription === "object") {
        setEntriesForm((prev) => ({ ...prev, ...cp.entriesDescription }));
      }

      if (cp.entriesMediaFiles && typeof cp.entriesMediaFiles === "object") {
        setEntryImages(cp.entriesMediaFiles);
      }
    }
  }, [prospect]);

  // Recalculate units when structure changes
  const handleStructureFieldChange = (field: string, val: any) => {
    setStructureForm((prev) => {
      const next = { ...prev, [field]: val };
      if (["towersAmount", "floorsAmount", "apartmentsPerFloor"].includes(field)) {
        next.unitsAmount =
          (Number(next.towersAmount) || 1) *
          (Number(next.floorsAmount) || 1) *
          (Number(next.apartmentsPerFloor) || 1);
      }
      return next;
    });
  };

  // Submit Handlers
  const handleSaveStructure = async () => {
    const success = await updateOperations({
      ...structureForm,
      ...amenitiesForm,
      entriesDescription: entriesForm,
      entriesMediaFiles: entryImages,
    });
    if (success) setActiveDrawer(null);
  };

  const handleSaveAmenities = async () => {
    const success = await updateOperations({
      ...structureForm,
      ...amenitiesForm,
      entriesDescription: entriesForm,
      entriesMediaFiles: entryImages,
    });
    if (success) setActiveDrawer(null);
  };

  const handleSaveEntries = async () => {
    const success = await updateOperations({
      ...structureForm,
      ...amenitiesForm,
      entriesDescription: entriesForm,
      entriesMediaFiles: entryImages,
    });
    if (success) setActiveDrawer(null);
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
        entityId: prospectId,
        clientId: prospectId,
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
      showError(err?.message || "Error al subir fotografía de acceso.");
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

  const handleEntryToggle = (key: string, checked: boolean) => {
    setEntriesForm((prev) => {
      const next: any = { ...prev, [key]: checked };

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

      if (key === "separateVehicleEntryExit" && checked) {
        next.sharedVehicleEntryExit = false;
      } else if (key === "sharedVehicleEntryExit" && checked) {
        next.separateVehicleEntryExit = false;
      }

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

  const renderField = (label: string, value?: string | number | null) => {
    const isValEmpty =
      value === undefined || value === null || String(value).trim() === "";

    return (
      <Box
        sx={{
          p: 2,
          height: "100%",
          minHeight: 70,
          borderRadius: 2.5,
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontSize: "0.68rem",
            mb: 0.6,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: isValEmpty ? "text.disabled" : "text.primary",
          }}
        >
          {!isValEmpty ? String(value) : "0"}
        </Typography>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Skeleton variant="rounded" height={160} />
        <Skeleton variant="rounded" height={220} />
      </Box>
    );
  }

  const complexTypeObj = COMPLEX_TYPES.find(
    (c) => c.value === structureForm.structureType,
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <input
        type="file"
        ref={imageInputRef}
        style={{ display: "none" }}
        accept="image/*,application/pdf"
        onChange={handleFileChange}
      />
      {/* Title */}
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Operaciones y Estructura Física
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestione la composición arquitectónica, zonas comunes y puntos de control del prospecto.
        </Typography>
      </Box>

      {/* Card 1: Estructura Habitacional */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <HomeWorkIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Estructura Habitacional y Torres
            </Typography>
          </Box>
          {permissions.canEdit && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setActiveDrawer("structure")}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Editar
            </Button>
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField("Tipo de Complejo", complexTypeObj?.label || structureForm.structureType)}
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            {renderField("Torres / Bloques", structureForm.towersAmount)}
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            {renderField("Pisos por Torre", structureForm.floorsAmount)}
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            {renderField("Inmuebles por Piso", structureForm.apartmentsPerFloor)}
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            {renderField("Total Unidades", structureForm.unitsAmount)}
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            {renderField("Ascensores", structureForm.elevatorsAmount)}
          </Grid>
        </Grid>
      </Paper>

      {/* Card 2: Amenidades y Zonas Comunes */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <PoolIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Amenidades y Zonas Comunes
            </Typography>
          </Box>
          {permissions.canEdit && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setActiveDrawer("amenities")}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Editar
            </Button>
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            {renderField("Salón Social", amenitiesForm.hasSocialRoom ? `${amenitiesForm.socialRoomAmount} disponible(s)` : "No tiene")}
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            {renderField("Gimnasio", amenitiesForm.hasGym ? `${amenitiesForm.gymAmount} disponible(s)` : "No tiene")}
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            {renderField("Piscina", amenitiesForm.hasPool ? `${amenitiesForm.poolAmount} disponible(s)` : "No tiene")}
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            {renderField("Parque Infantil", amenitiesForm.hasPlayground ? `${amenitiesForm.playgroundAmount} disponible(s)` : "No tiene")}
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            {renderField("Canchas de Squash", amenitiesForm.hasSquashCourt ? `${amenitiesForm.squashCourtAmount} cancha(s)` : "No tiene")}
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            {renderField("Canchas Deportivas (Tenis/Fútbol)", amenitiesForm.hasTennisCourt || amenitiesForm.hasFootballCourt ? "Habilitadas" : "No tiene")}
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            {renderField("Parqueaderos Residentes", amenitiesForm.hasParking ? `${amenitiesForm.parkingAmount} cupos` : "No tiene")}
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            {renderField("Parqueaderos Visitantes", amenitiesForm.hasGuestParking ? `${amenitiesForm.guestParkingAmount} cupos` : "No tiene")}
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            {renderField("Parqueadero de Motos", amenitiesForm.hasMotorcycleParking ? `${amenitiesForm.motorcycleParkingAmount} cupos` : "No tiene")}
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            {renderField("Bicicleteros", amenitiesForm.hasBicycleParking ? `${amenitiesForm.bicycleParkingAmount} puestos` : "No tiene")}
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            {renderField("Locales Comerciales", amenitiesForm.hasCommercialStores ? `${amenitiesForm.commercialStoresAmount} local(es)` : "No tiene")}
          </Grid>
        </Grid>
      </Paper>

      {/* Card 3: Puntos de Acceso Físico y Evidencia */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <DoorFrontIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Control de Accesos y Puntos de Entrada (7 Opciones con Evidencia)
            </Typography>
          </Box>
          {permissions.canEdit && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setActiveDrawer("entries")}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Editar Accesos
            </Button>
          )}
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2, mb: 2 }}>
          <Chip
            icon={entryImages.mainEntry ? <CheckCircleIcon /> : undefined}
            label={
              entriesForm.mainEntry
                ? entryImages.mainEntry
                  ? "1. Peatonal Principal (Foto adjunta)"
                  : "1. Peatonal Principal: Sí"
                : "1. Peatonal Principal: No"
            }
            variant="outlined"
            color={entriesForm.mainEntry ? "primary" : "default"}
          />
          {entriesForm.separateVehicleEntryExit && (
            <Chip
              icon={
                entryImages.separateVehicleEntryExit ? (
                  <CheckCircleIcon />
                ) : undefined
              }
              label={
                entryImages.separateVehicleEntryExit
                  ? "2. Vehicular Separado (Foto adjunta)"
                  : "2. Vehicular Separado"
              }
              variant="outlined"
              color="primary"
            />
          )}
          {entriesForm.sharedVehicleEntryExit && (
            <Chip
              icon={
                entryImages.sharedVehicleEntryExit ? (
                  <CheckCircleIcon />
                ) : undefined
              }
              label={
                entryImages.sharedVehicleEntryExit
                  ? "3. Vehicular Compartido (Foto adjunta)"
                  : "3. Vehicular Compartido"
              }
              variant="outlined"
              color="primary"
            />
          )}
          {entriesForm.exclusivePetEntry && (
            <Chip
              icon={
                entryImages.exclusivePetEntry ? (
                  <CheckCircleIcon />
                ) : undefined
              }
              label={
                entryImages.exclusivePetEntry
                  ? "4. Entrada Mascotas (Foto adjunta)"
                  : "4. Entrada Mascotas"
              }
              variant="outlined"
              color="primary"
            />
          )}
          {entriesForm.exclusiveDeliveryEntry && (
            <Chip
              icon={
                entryImages.exclusiveDeliveryEntry ? (
                  <CheckCircleIcon />
                ) : undefined
              }
              label={
                entryImages.exclusiveDeliveryEntry
                  ? "5. Entrada Domiciliarios (Foto adjunta)"
                  : "5. Entrada Domiciliarios"
              }
              variant="outlined"
              color="primary"
            />
          )}
          {entriesForm.sharedPetDeliveryEntry && (
            <Chip
              icon={
                entryImages.sharedPetDeliveryEntry ? (
                  <CheckCircleIcon />
                ) : undefined
              }
              label={
                entryImages.sharedPetDeliveryEntry
                  ? "6. Mascotas y Domiciliarios (Foto adjunta)"
                  : "6. Mascotas y Domiciliarios"
              }
              variant="outlined"
              color="primary"
            />
          )}
          {entriesForm.noExclusiveEntries && (
            <Chip
              label="7. Sin entradas exclusivas"
              variant="outlined"
              color="warning"
            />
          )}
        </Box>

        {Object.keys(entryImages).length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{ textTransform: "uppercase", display: "block", mb: 1 }}
            >
              Evidencias Fotográficas Adjuntas
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {Object.entries(entryImages).map(([key, imgData]) => {
                const url =
                  typeof imgData === "string" ? imgData : imgData?.url;
                const fileName =
                  typeof imgData === "object" ? imgData?.fileName : key;
                return (
                  <Box
                    key={key}
                    sx={{
                      p: 1,
                      px: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: "background.paper",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <CameraIcon fontSize="small" color="primary" />
                    <Typography variant="caption" fontWeight={600}>
                      {key}: {fileName || "foto"}
                    </Typography>
                    {url && (
                      <Tooltip title="Ver Fotografía">
                        <IconButton
                          size="small"
                          component="a"
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Drawer 1: Editar Estructura */}
      <ResponsiveFormDrawer
        open={activeDrawer === "structure"}
        onClose={() => !saving && setActiveDrawer(null)}
        title="Editar Estructura Habitacional"
        subtitle="Configure los parámetros arquitectónicos y unidades del prospecto."
        isSubmitting={saving}
        submitButtonText="Guardar Cambios"
        formId="structure-form"
        width={{ xs: "100%", sm: 500 }}
      >
        <Box
          component="form"
          id="structure-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveStructure();
          }}
          sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            fullWidth
            select
            label="Tipo de Complejo"
            value={structureForm.structureType}
            onChange={(e) => handleStructureFieldChange("structureType", e.target.value)}
            size="small"
          >
            {COMPLEX_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Cantidad de Torres"
                value={structureForm.towersAmount}
                onChange={(e) => handleStructureFieldChange("towersAmount", Number(e.target.value))}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Pisos por Torre"
                value={structureForm.floorsAmount}
                onChange={(e) => handleStructureFieldChange("floorsAmount", Number(e.target.value))}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Inmuebles por Piso"
                value={structureForm.apartmentsPerFloor}
                onChange={(e) => handleStructureFieldChange("apartmentsPerFloor", Number(e.target.value))}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Total de Unidades"
                value={structureForm.unitsAmount}
                onChange={(e) => handleStructureFieldChange("unitsAmount", Number(e.target.value))}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                type="number"
                label="Cantidad de Ascensores"
                value={structureForm.elevatorsAmount}
                onChange={(e) => handleStructureFieldChange("elevatorsAmount", Number(e.target.value))}
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
      </ResponsiveFormDrawer>

      {/* Drawer 2: Editar Amenidades */}
      <ResponsiveFormDrawer
        open={activeDrawer === "amenities"}
        onClose={() => !saving && setActiveDrawer(null)}
        title="Editar Amenidades y Zonas Comunes"
        subtitle="Especifique las instalaciones disponibles en el complejo."
        isSubmitting={saving}
        submitButtonText="Guardar Cambios"
        formId="amenities-form"
        width={{ xs: "100%", sm: 540 }}
      >
        <Box
          component="form"
          id="amenities-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveAmenities();
          }}
          sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={amenitiesForm.hasSocialRoom}
                    onChange={(e) => setAmenitiesForm({ ...amenitiesForm, hasSocialRoom: e.target.checked })}
                  />
                }
                label="Salón Social"
              />
              {amenitiesForm.hasSocialRoom && (
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  label="Cantidad Salones"
                  value={amenitiesForm.socialRoomAmount}
                  onChange={(e) => setAmenitiesForm({ ...amenitiesForm, socialRoomAmount: Number(e.target.value) })}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={amenitiesForm.hasGym}
                    onChange={(e) => setAmenitiesForm({ ...amenitiesForm, hasGym: e.target.checked })}
                  />
                }
                label="Gimnasio"
              />
              {amenitiesForm.hasGym && (
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  label="Cantidad Gimnasios"
                  value={amenitiesForm.gymAmount}
                  onChange={(e) => setAmenitiesForm({ ...amenitiesForm, gymAmount: Number(e.target.value) })}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={amenitiesForm.hasPool}
                    onChange={(e) => setAmenitiesForm({ ...amenitiesForm, hasPool: e.target.checked })}
                  />
                }
                label="Piscina"
              />
              {amenitiesForm.hasPool && (
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  label="Cantidad Piscinas"
                  value={amenitiesForm.poolAmount}
                  onChange={(e) => setAmenitiesForm({ ...amenitiesForm, poolAmount: Number(e.target.value) })}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={amenitiesForm.hasPlayground}
                    onChange={(e) => setAmenitiesForm({ ...amenitiesForm, hasPlayground: e.target.checked })}
                  />
                }
                label="Parque Infantil"
              />
              {amenitiesForm.hasPlayground && (
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  label="Cantidad Parques"
                  value={amenitiesForm.playgroundAmount}
                  onChange={(e) => setAmenitiesForm({ ...amenitiesForm, playgroundAmount: Number(e.target.value) })}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={amenitiesForm.hasGuestParking}
                    onChange={(e) => setAmenitiesForm({ ...amenitiesForm, hasGuestParking: e.target.checked })}
                  />
                }
                label="Parqueadero Visitantes"
              />
              {amenitiesForm.hasGuestParking && (
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  label="Cupos Visitantes"
                  value={amenitiesForm.guestParkingAmount}
                  onChange={(e) => setAmenitiesForm({ ...amenitiesForm, guestParkingAmount: Number(e.target.value) })}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={amenitiesForm.hasMotorcycleParking}
                    onChange={(e) => setAmenitiesForm({ ...amenitiesForm, hasMotorcycleParking: e.target.checked })}
                  />
                }
                label="Parqueadero Motos"
              />
              {amenitiesForm.hasMotorcycleParking && (
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  label="Cupos Motos"
                  value={amenitiesForm.motorcycleParkingAmount}
                  onChange={(e) => setAmenitiesForm({ ...amenitiesForm, motorcycleParkingAmount: Number(e.target.value) })}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={amenitiesForm.hasBicycleParking}
                    onChange={(e) => setAmenitiesForm({ ...amenitiesForm, hasBicycleParking: e.target.checked })}
                  />
                }
                label="Bicicleteros"
              />
              {amenitiesForm.hasBicycleParking && (
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  label="Puestos Bicicletas"
                  value={amenitiesForm.bicycleParkingAmount}
                  onChange={(e) => setAmenitiesForm({ ...amenitiesForm, bicycleParkingAmount: Number(e.target.value) })}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={amenitiesForm.hasCommercialStores}
                    onChange={(e) => setAmenitiesForm({ ...amenitiesForm, hasCommercialStores: e.target.checked })}
                  />
                }
                label="Locales Comerciales"
              />
              {amenitiesForm.hasCommercialStores && (
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  label="Cantidad Locales"
                  value={amenitiesForm.commercialStoresAmount}
                  onChange={(e) => setAmenitiesForm({ ...amenitiesForm, commercialStoresAmount: Number(e.target.value) })}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>
          </Grid>
        </Box>
      </ResponsiveFormDrawer>

      {/* Drawer 3: Editar Puntos de Acceso Físico (7 Opciones con Evidencia) */}
      <ResponsiveFormDrawer
        open={activeDrawer === "entries"}
        onClose={() => !saving && setActiveDrawer(null)}
        title="Control de Accesos y Puntos de Entrada"
        subtitle="Configure los accesos peatonales, vehiculares y anexar evidencias fotográficas."
        isSubmitting={saving}
        submitButtonText="Guardar Accesos"
        formId="entries-form"
        width={{ xs: "100%", sm: 580 }}
      >
        <Box
          component="form"
          id="entries-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveEntries();
          }}
          sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          {/* Sección 1: Accesos Peatonales y Vehiculares */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
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
                      checked={Boolean(entriesForm.mainEntry)}
                      onChange={(e) =>
                        handleEntryToggle("mainEntry", e.target.checked)
                      }
                    />
                  }
                  label="1. Entrada Principal (Peatonal)"
                />
                {entriesForm.mainEntry && (
                  <Box sx={{ ml: 4, mt: 0.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      size="small"
                      variant={entryImages["mainEntry"] ? "contained" : "outlined"}
                      color={entryImages["mainEntry"] ? "success" : "primary"}
                      startIcon={entryImages["mainEntry"] ? <CheckCircleIcon /> : <CameraIcon />}
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
                      checked={Boolean(entriesForm.separateVehicleEntryExit)}
                      disabled={Boolean(entriesForm.sharedVehicleEntryExit)}
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
                {entriesForm.separateVehicleEntryExit && (
                  <Box sx={{ ml: 4, mt: 0.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      size="small"
                      variant={entryImages["separateVehicleEntryExit"] ? "contained" : "outlined"}
                      color={entryImages["separateVehicleEntryExit"] ? "success" : "primary"}
                      startIcon={entryImages["separateVehicleEntryExit"] ? <CheckCircleIcon /> : <CameraIcon />}
                      onClick={() => triggerUpload("separateVehicleEntryExit")}
                      disabled={uploadingKeys["separateVehicleEntryExit"]}
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
                          onClick={() => handleRemovePhoto("separateVehicleEntryExit")}
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
                      checked={Boolean(entriesForm.sharedVehicleEntryExit)}
                      disabled={Boolean(entriesForm.separateVehicleEntryExit)}
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
                {entriesForm.sharedVehicleEntryExit && (
                  <Box sx={{ ml: 4, mt: 0.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      size="small"
                      variant={entryImages["sharedVehicleEntryExit"] ? "contained" : "outlined"}
                      color={entryImages["sharedVehicleEntryExit"] ? "success" : "primary"}
                      startIcon={entryImages["sharedVehicleEntryExit"] ? <CheckCircleIcon /> : <CameraIcon />}
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
                          onClick={() => handleRemovePhoto("sharedVehicleEntryExit")}
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

          {/* Sección 2: Accesos Especializados y Exclusivos */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
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
                      checked={Boolean(entriesForm.exclusivePetEntry)}
                      disabled={
                        Boolean(entriesForm.noExclusiveEntries) ||
                        Boolean(entriesForm.sharedPetDeliveryEntry)
                      }
                      onChange={(e) =>
                        handleEntryToggle("exclusivePetEntry", e.target.checked)
                      }
                    />
                  }
                  label="4. Entrada exclusiva mascotas"
                />
                {entriesForm.exclusivePetEntry && (
                  <Box sx={{ ml: 4, mt: 0.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      size="small"
                      variant={entryImages["exclusivePetEntry"] ? "contained" : "outlined"}
                      color={entryImages["exclusivePetEntry"] ? "success" : "primary"}
                      startIcon={entryImages["exclusivePetEntry"] ? <CheckCircleIcon /> : <CameraIcon />}
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
                          onClick={() => handleRemovePhoto("exclusivePetEntry")}
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
                      checked={Boolean(entriesForm.exclusiveDeliveryEntry)}
                      disabled={
                        Boolean(entriesForm.noExclusiveEntries) ||
                        Boolean(entriesForm.sharedPetDeliveryEntry)
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
                {entriesForm.exclusiveDeliveryEntry && (
                  <Box sx={{ ml: 4, mt: 0.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      size="small"
                      variant={entryImages["exclusiveDeliveryEntry"] ? "contained" : "outlined"}
                      color={entryImages["exclusiveDeliveryEntry"] ? "success" : "primary"}
                      startIcon={entryImages["exclusiveDeliveryEntry"] ? <CheckCircleIcon /> : <CameraIcon />}
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
                          onClick={() => handleRemovePhoto("exclusiveDeliveryEntry")}
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
                      checked={Boolean(entriesForm.sharedPetDeliveryEntry)}
                      disabled={
                        Boolean(entriesForm.noExclusiveEntries) ||
                        (Boolean(entriesForm.exclusivePetEntry) &&
                          Boolean(entriesForm.exclusiveDeliveryEntry))
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
                {entriesForm.sharedPetDeliveryEntry && (
                  <Box sx={{ ml: 4, mt: 0.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      size="small"
                      variant={entryImages["sharedPetDeliveryEntry"] ? "contained" : "outlined"}
                      color={entryImages["sharedPetDeliveryEntry"] ? "success" : "primary"}
                      startIcon={entryImages["sharedPetDeliveryEntry"] ? <CheckCircleIcon /> : <CameraIcon />}
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
                          onClick={() => handleRemovePhoto("sharedPetDeliveryEntry")}
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
                      checked={Boolean(entriesForm.noExclusiveEntries)}
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
        </Box>
      </ResponsiveFormDrawer>
    </Box>
  );
}
