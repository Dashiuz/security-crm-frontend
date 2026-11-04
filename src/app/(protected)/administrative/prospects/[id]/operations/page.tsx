"use client";

import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  EditRounded as EditIcon,
  HomeWorkRounded as HomeWorkIcon,
  PoolRounded as PoolIcon,
  DoorFrontRounded as DoorFrontIcon,
  PhotoCameraRounded as CameraIcon,
  DeleteRounded as DeleteIcon,
  CloudUploadRounded as CloudUploadIcon,
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
    pedestrianEntry: true,
  });

  const [entryImages, setEntryImages] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

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

  // Upload Photo for an entry
  const handleFileUpload = async (entryKey: string, file: File) => {
    try {
      setUploadingImage(true);
      const res = await StorageApi.uploadMedia({
        file,
        entityType: MediaTypeCategory.CLIENT,
        entityId: prospectId,
        clientId: prospectId,
        subType: `entry_${entryKey}`,
      });
      const url = res.url || res.s3Key;
      setEntryImages((prev) => ({
        ...prev,
        [entryKey]: url,
      }));
      showSuccess(`Foto subida exitosamente para el acceso.`);
    } catch (err: any) {
      showError(err?.message || "Error al subir la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (entryKey: string) => {
    setEntryImages((prev) => {
      const next = { ...prev };
      delete next[entryKey];
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

      {/* Card 3: Puntos de Acceso Físico y Garitas */}
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
            <DoorFrontIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Puntos de Acceso Físico y Evidencia
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

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              <Chip
                label={`Entrada Principal: ${entriesForm.mainEntry ? "Activa / Habilitada" : "No"}`}
                color={entriesForm.mainEntry ? "success" : "default"}
                variant="outlined"
              />
              <Chip
                label={`Vehicular: ${entriesForm.separateVehicleEntryExit ? "Entrada/Salida Separada" : "Compartida"}`}
                color="info"
                variant="outlined"
              />
              <Chip
                label={`Acceso Peatonal: ${entriesForm.pedestrianEntry ? "Independiente" : "Integrado"}`}
                variant="outlined"
              />
              <Chip
                label={`Acceso Mascotas y Domiciliarios: ${entriesForm.sharedPetDeliveryEntry ? "Compartido" : "Exclusivos"}`}
                variant="outlined"
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Evidencias Fotográficas de Puntos de Control:
            </Typography>
            {Object.keys(entryImages).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay fotografías adjuntas para los accesos. Puede anexarlas editando los accesos.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                {Object.entries(entryImages).map(([key, imgUrl]) => (
                  <Box
                    key={key}
                    sx={{
                      p: 1,
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
                      {key}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
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

      {/* Drawer 3: Editar Puntos de Acceso */}
      <ResponsiveFormDrawer
        open={activeDrawer === "entries"}
        onClose={() => !saving && setActiveDrawer(null)}
        title="Editar Puntos de Acceso Físico"
        subtitle="Configure los accesos vehiculares, peatonales y anexar fotos."
        isSubmitting={saving}
        submitButtonText="Guardar Cambios"
        formId="entries-form"
        width={{ xs: "100%", sm: 540 }}
      >
        <Box
          component="form"
          id="entries-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveEntries();
          }}
          sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={entriesForm.mainEntry}
                onChange={(e) => setEntriesForm({ ...entriesForm, mainEntry: e.target.checked })}
              />
            }
            label="Entrada Principal Activa"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={entriesForm.separateVehicleEntryExit}
                onChange={(e) =>
                  setEntriesForm({
                    ...entriesForm,
                    separateVehicleEntryExit: e.target.checked,
                    sharedVehicleEntryExit: !e.target.checked,
                  })
                }
              />
            }
            label="Entrada y Salida Vehicular Separada"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={entriesForm.sharedVehicleEntryExit}
                onChange={(e) =>
                  setEntriesForm({
                    ...entriesForm,
                    sharedVehicleEntryExit: e.target.checked,
                    separateVehicleEntryExit: !e.target.checked,
                  })
                }
              />
            }
            label="Entrada y Salida Vehicular Compartida (Mismo carril)"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={entriesForm.pedestrianEntry}
                onChange={(e) => setEntriesForm({ ...entriesForm, pedestrianEntry: e.target.checked })}
              />
            }
            label="Acceso Peatonal Independiente"
          />

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" fontWeight={600}>
            Anexar Evidencia Fotográfica de Accesos:
          </Typography>

          {["mainEntry", "vehicleEntry", "pedestrianEntry", "deliveryEntry"].map((key) => (
            <Box
              key={key}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body2" fontWeight={500}>
                {key === "mainEntry"
                  ? "Entrada Principal"
                  : key === "vehicleEntry"
                  ? "Acceso Vehicular"
                  : key === "pedestrianEntry"
                  ? "Acceso Peatonal"
                  : "Acceso Domicilios / Mascotas"}
              </Typography>

              {entryImages[key] ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip size="small" label="Foto adjuntada" color="success" />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveImage(key)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Button
                  component="label"
                  size="small"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  disabled={uploadingImage}
                  sx={{ textTransform: "none" }}
                >
                  Subir Foto
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(key, file);
                    }}
                  />
                </Button>
              )}
            </Box>
          ))}
        </Box>
      </ResponsiveFormDrawer>
    </Box>
  );
}
