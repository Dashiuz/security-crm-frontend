"use client";

import React, { useRef, useState } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  Box,
  Paper,
  Button,
  IconButton,
  FormControlLabel,
  Checkbox,
  Switch,
  Divider,
  Chip,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  AddRounded as AddIcon,
  DeleteOutlineRounded as DeleteIcon,
  CloudUploadOutlined as CloudUploadIcon,
  CheckCircleRounded as CheckCircleIcon,
  PhotoCameraOutlined as CameraIcon,
  TwoWheelerRounded as MotoIcon,
  DirectionsBikeRounded as BikeIcon,
  LocalParkingRounded as ParkingIcon,
} from "@mui/icons-material";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { useNotification } from "@/providers/NotificationProvider";

export interface TowerItem {
  id?: string;
  towerName: string;
  floorsAmount: number;
  apartmentsPerFloor: number;
  elevators: number;
}

export interface EntriesDescription {
  mainEntry?: boolean;
  separateVehicleEntryExit?: boolean;
  sharedVehicleEntryExit?: boolean;
  exclusivePetEntry?: boolean;
  exclusiveDeliveryEntry?: boolean;
  sharedPetDeliveryEntry?: boolean;
  noExclusiveEntries?: boolean;
}

export interface AmenitiesData {
  hasParking: boolean;
  parkingAmount: number;
  hasGuestParking: boolean;
  guestParkingAmount: number;
  hasMotorcycleParking: boolean;
  motorcycleParkingAmount: number;
  hasBicycleRack: boolean;
  bicycleRackAmount: number;
  bicycleCapacityPerRack: number;
  hasStorageRoom: boolean;
  storageRoomAmount: number;
  hasSocialRoom: boolean;
  socialRoomAmount: number;
  hasGym: boolean;
  gymAmount: number;
  hasPool: boolean;
  poolAmount: number;
  hasPlayground: boolean;
  playgroundAmount: number;
  hasSquashCourt: boolean;
  squashCourtAmount: number;
  hasTennisCourt: boolean;
  tennisCourtAmount: number;
  hasFootballCourt: boolean;
  footballCourtAmount: number;
  hasBasketballCourt: boolean;
  basketballCourtAmount: number;
  hasCommercialStores?: boolean;
  commercialStoresAmount?: number;
}

export interface ClientStructureStepProps {
  clientId?: string;
  structureType: string;
  onChangeStructureType: (type: string) => void;
  floorsAmount: number;
  onChangeFloorsAmount: (val: number) => void;
  apartmentsPerFloor: number;
  onChangeApartmentsPerFloor: (val: number) => void;
  singleElevators: number;
  onChangeSingleElevators: (val: number) => void;
  unitsAmount: number;
  onChangeUnitsAmount: (val: number) => void;
  housePrefix: string;
  onChangeHousePrefix: (val: string) => void;
  towers: TowerItem[];
  onChangeTowers: (towers: TowerItem[]) => void;
  entries: EntriesDescription;
  onChangeEntries: (entries: EntriesDescription) => void;
  entryImages: Record<string, any>;
  onChangeEntryImages: (images: Record<string, any>) => void;
  amenities: AmenitiesData;
  onChangeAmenities: (amenities: AmenitiesData) => void;
  disabled?: boolean;
}

export default function ClientStructureStep({
  clientId,
  structureType,
  onChangeStructureType,
  floorsAmount,
  onChangeFloorsAmount,
  apartmentsPerFloor,
  onChangeApartmentsPerFloor,
  singleElevators,
  onChangeSingleElevators,
  unitsAmount,
  onChangeUnitsAmount,
  housePrefix,
  onChangeHousePrefix,
  towers,
  onChangeTowers,
  entries,
  onChangeEntries,
  entryImages,
  onChangeEntryImages,
  amenities,
  onChangeAmenities,
  disabled = false,
}: ClientStructureStepProps) {
  const { showError, showSuccess } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTargetSlotRef = useRef<string | null>(null);
  const [uploadingSlotKey, setUploadingSlotKey] = useState<string | null>(null);

  React.useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;
    const handleCancel = () => {
      activeTargetSlotRef.current = null;
      setUploadingSlotKey(null);
    };
    input.addEventListener("cancel", handleCancel);
    return () => {
      input.removeEventListener("cancel", handleCancel);
    };
  }, []);

  // Tower auto-duplication of numeric values (Point 3)
  const handleAddTower = () => {
    const nextTowerNum = towers.length + 1;
    const lastTower = towers.length > 0 ? towers[towers.length - 1] : null;

    const newTower: TowerItem = {
      towerName: `Torre ${nextTowerNum}`,
      floorsAmount: lastTower ? Number(lastTower.floorsAmount) : 0,
      apartmentsPerFloor: lastTower ? Number(lastTower.apartmentsPerFloor) : 0,
      elevators: lastTower ? Number(lastTower.elevators) : 0,
    };

    onChangeTowers([...towers, newTower]);
  };

  const handleRemoveTower = (idx: number) => {
    onChangeTowers(towers.filter((_, i) => i !== idx));
  };

  const handleTowerFieldChange = (idx: number, field: keyof TowerItem, val: any) => {
    const copy = [...towers];
    copy[idx] = { ...copy[idx], [field]: val };
    onChangeTowers(copy);
  };

  // Entry options handling (Point 2.1)
  const handleEntryToggle = (key: keyof EntriesDescription, checked: boolean) => {
    const next = { ...entries, [key]: checked };

    // Point 2.1: Option 7 "Sin entradas exclusivas" disables & clears options 4, 5, 6
    if (key === "noExclusiveEntries" && checked) {
      next.exclusivePetEntry = false;
      next.exclusiveDeliveryEntry = false;
      next.sharedPetDeliveryEntry = false;
    }

    if ((key === "exclusivePetEntry" || key === "exclusiveDeliveryEntry" || key === "sharedPetDeliveryEntry") && checked) {
      next.noExclusiveEntries = false;
    }

    // Vehicle mutual exclusivity
    if (key === "separateVehicleEntryExit" && checked) {
      next.sharedVehicleEntryExit = false;
    } else if (key === "sharedVehicleEntryExit" && checked) {
      next.separateVehicleEntryExit = false;
    }

    onChangeEntries(next);
  };

  // Real photo/doc upload via StorageApi (Point 2.2)
  const handleTriggerUpload = (key: string) => {
    activeTargetSlotRef.current = key;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = activeTargetSlotRef.current;
    if (!file || !key) {
      activeTargetSlotRef.current = null;
      return;
    }

    try {
      setUploadingSlotKey(key);
      const res = await StorageApi.uploadMedia({
        file,
        entityType: MediaTypeCategory.CLIENT,
        entityId: clientId || "new",
        clientId: clientId || null,
        subType: `entry_${key}`,
      });

      onChangeEntryImages({
        ...entryImages,
        [key]: {
          mediaId: res.id,
          fileName: res.fileName,
          url: res.presignedUrl || res.url,
        },
      });

      showSuccess(`Archivo "${file.name}" adjuntado correctamente.`);
    } catch (err: any) {
      showError(err.message || "Error al subir archivo de acceso.");
    } finally {
      setUploadingSlotKey(null);
      activeTargetSlotRef.current = null;
    }
  };

  const handleRemovePhoto = (key: string) => {
    const copy = { ...entryImages };
    delete copy[key];
    onChangeEntryImages(copy);
  };

  // Amenities updater
  const updateAmenity = (field: keyof AmenitiesData, value: any) => {
    onChangeAmenities({
      ...amenities,
      [field]: value,
    });
  };

  // Total bicycle capacity calculation (Point 4.1)
  const totalBicycleCapacity =
    amenities.hasBicycleRack
      ? (Number(amenities.bicycleRackAmount) || 0) * (Number(amenities.bicycleCapacityPerRack) || 0)
      : 0;

  return (
    <Box>
      {/* Hidden file input for real uploads */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*,application/pdf"
        onChange={handleFileSelected}
      />

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
          🏢 2. Estructura Física, Accesos y Servicios
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure la tipología del complejo, definición de torres, accesos peatonales/vehiculares y amenidades.
        </Typography>
      </Box>

      {/* Tipo de Complejo */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          Tipología del Conjunto / Inmueble
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Tipo de Estructura"
              value={structureType}
              onChange={(e) => onChangeStructureType(e.target.value)}
              disabled={disabled}
            >
              <MenuItem value="BUILDING_CLUSTER">Conjunto de Torres / Bloques</MenuItem>
              <MenuItem value="SINGLE_BUILDING">Edificio Único</MenuItem>
              <MenuItem value="HOUSE_CLUSTER">Conjunto de Casas</MenuItem>
              <MenuItem value="COMMERCIAL">Comercio / Locales / Centro Comercial</MenuItem>
              <MenuItem value="OTHER">Otro Tipo de Inmueble</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Definición de Torres para BUILDING_CLUSTER */}
      {structureType === "BUILDING_CLUSTER" && (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", sm: "center" },
              gap: 1.5,
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Definición de Torres / Edificios
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Al agregar una torre, se clonarán automáticamente los valores numéricos de la última configurada.
              </Typography>
            </Box>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTower}
              disabled={disabled}
              sx={{
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                whiteSpace: "nowrap",
                px: 2,
                py: 0.8,
                width: { xs: "100%", sm: "auto" },
                flexShrink: 0,
              }}
            >
              Agregar Torre
            </Button>
          </Box>

          <Grid container spacing={2}>
            {towers.map((tower, idx) => (
              <Grid size={{ xs: 12 }} key={idx}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "background.default" }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Nombre de Torre"
                        value={tower.towerName}
                        onChange={(e) => handleTowerFieldChange(idx, "towerName", e.target.value)}
                        disabled={disabled}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        inputProps={{ min: 1 }}
                        label="Pisos"
                        value={tower.floorsAmount === 0 ? "" : tower.floorsAmount}
                        placeholder="0"
                        onChange={(e) =>
                          handleTowerFieldChange(
                            idx,
                            "floorsAmount",
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        disabled={disabled}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        inputProps={{ min: 1 }}
                        label="Aptos por Piso"
                        value={tower.apartmentsPerFloor === 0 ? "" : tower.apartmentsPerFloor}
                        placeholder="0"
                        onChange={(e) =>
                          handleTowerFieldChange(
                            idx,
                            "apartmentsPerFloor",
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        disabled={disabled}
                      />
                    </Grid>
                    <Grid size={{ xs: 10, sm: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        inputProps={{ min: 0 }}
                        label="Ascensores"
                        value={tower.elevators === 0 ? "" : tower.elevators}
                        placeholder="0"
                        onChange={(e) =>
                          handleTowerFieldChange(
                            idx,
                            "elevators",
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        disabled={disabled}
                      />
                    </Grid>
                    <Grid size={{ xs: 2, sm: 1 }} sx={{ textAlign: "center" }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveTower(idx)}
                        disabled={disabled || towers.length <= 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Definición para SINGLE_BUILDING */}
      {structureType === "SINGLE_BUILDING" && (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Definición del Edificio Único
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 1 }}
                label="Pisos Totales"
                value={floorsAmount === 0 ? "" : floorsAmount}
                placeholder="0"
                onChange={(e) => onChangeFloorsAmount(e.target.value === "" ? 0 : Number(e.target.value))}
                disabled={disabled}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 1 }}
                label="Aptos / Oficinas por Piso"
                value={apartmentsPerFloor === 0 ? "" : apartmentsPerFloor}
                placeholder="0"
                onChange={(e) => onChangeApartmentsPerFloor(e.target.value === "" ? 0 : Number(e.target.value))}
                disabled={disabled}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0 }}
                label="Ascensores"
                value={singleElevators === 0 ? "" : singleElevators}
                placeholder="0"
                onChange={(e) => onChangeSingleElevators(e.target.value === "" ? 0 : Number(e.target.value))}
                disabled={disabled}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Definición para Casas o Comercios */}
      {(structureType === "HOUSE_CLUSTER" || structureType === "COMMERCIAL" || structureType === "OTHER") && (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Definición de Unidades e Inmuebles
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 1 }}
                label="Cantidad Total de Unidades *"
                value={unitsAmount === 0 ? "" : unitsAmount}
                placeholder="0"
                onChange={(e) => onChangeUnitsAmount(e.target.value === "" ? 0 : Number(e.target.value))}
                disabled={disabled}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Prefijo de Inmueble (Ej: Casa, Local, Bodega)"
                value={housePrefix}
                onChange={(e) => onChangeHousePrefix(e.target.value)}
                disabled={disabled}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Control de Accesos y Puntos de Entrada (Puntos 2, 2.1 y 2.2) */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          🚪 Control de Accesos y Puntos de Entrada
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          Marque los accesos disponibles en el inmueble. Cada opción activa permite adjuntar su evidencia fotográfica.
        </Typography>

        <Grid container spacing={2}>
          {/* Columna Izquierda: Accesos Principales y Vehiculares */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {/* 1. Entrada Principal Peatonal */}
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(entries.mainEntry)}
                        onChange={(e) => handleEntryToggle("mainEntry", e.target.checked)}
                        disabled={disabled}
                      />
                    }
                    label="1. Entrada Principal (Peatonal)"
                  />
                  {entries.mainEntry && (
                    <Box sx={{ ml: 4, mt: 0.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant={entryImages["mainEntry"] ? "contained" : "outlined"}
                        color={entryImages["mainEntry"] ? "success" : "primary"}
                        startIcon={entryImages["mainEntry"] ? <CheckCircleIcon /> : <CloudUploadIcon />}
                        onClick={() => handleTriggerUpload("mainEntry")}
                        disabled={disabled || uploadingSlotKey === "mainEntry"}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        {uploadingSlotKey === "mainEntry"
                          ? "Subiendo Archivo..."
                          : entryImages["mainEntry"]
                            ? "Archivo Adjuntado (Cambiar)"
                            : "Adjuntar Archivo"}
                      </Button>
                      {entryImages["mainEntry"] && (
                        <IconButton size="small" color="error" onClick={() => handleRemovePhoto("mainEntry")}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>

                {/* 2. Vehicular separada */}
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(entries.separateVehicleEntryExit)}
                        disabled={disabled || Boolean(entries.sharedVehicleEntryExit)}
                        onChange={(e) => handleEntryToggle("separateVehicleEntryExit", e.target.checked)}
                      />
                    }
                    label="2. Vehicular separada para entrada y salida"
                  />
                  {entries.separateVehicleEntryExit && (
                    <Box sx={{ ml: 4, mt: 0.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant={entryImages["separateVehicleEntryExit"] ? "contained" : "outlined"}
                        color={entryImages["separateVehicleEntryExit"] ? "success" : "primary"}
                        startIcon={entryImages["separateVehicleEntryExit"] ? <CheckCircleIcon /> : <CloudUploadIcon />}
                        onClick={() => handleTriggerUpload("separateVehicleEntryExit")}
                        disabled={disabled || uploadingSlotKey === "separateVehicleEntryExit"}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        {uploadingSlotKey === "separateVehicleEntryExit"
                          ? "Subiendo Archivo..."
                          : entryImages["separateVehicleEntryExit"]
                            ? "Archivo Adjuntado (Cambiar)"
                            : "Adjuntar Archivo"}
                      </Button>
                      {entryImages["separateVehicleEntryExit"] && (
                        <IconButton size="small" color="error" onClick={() => handleRemovePhoto("separateVehicleEntryExit")}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>

                {/* 3. Vehicular compartida */}
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(entries.sharedVehicleEntryExit)}
                        disabled={disabled || Boolean(entries.separateVehicleEntryExit)}
                        onChange={(e) => handleEntryToggle("sharedVehicleEntryExit", e.target.checked)}
                      />
                    }
                    label="3. Vehicular compartida para entrada y salida"
                  />
                  {entries.sharedVehicleEntryExit && (
                    <Box sx={{ ml: 4, mt: 0.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant={entryImages["sharedVehicleEntryExit"] ? "contained" : "outlined"}
                        color={entryImages["sharedVehicleEntryExit"] ? "success" : "primary"}
                        startIcon={entryImages["sharedVehicleEntryExit"] ? <CheckCircleIcon /> : <CloudUploadIcon />}
                        onClick={() => handleTriggerUpload("sharedVehicleEntryExit")}
                        disabled={disabled || uploadingSlotKey === "sharedVehicleEntryExit"}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        {uploadingSlotKey === "sharedVehicleEntryExit"
                          ? "Subiendo Archivo..."
                          : entryImages["sharedVehicleEntryExit"]
                            ? "Archivo Adjuntado (Cambiar)"
                            : "Adjuntar Archivo"}
                      </Button>
                      {entryImages["sharedVehicleEntryExit"] && (
                        <IconButton size="small" color="error" onClick={() => handleRemovePhoto("sharedVehicleEntryExit")}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
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
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {/* 4. Entrada exclusiva mascotas */}
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(entries.exclusivePetEntry)}
                        disabled={disabled || Boolean(entries.noExclusiveEntries) || Boolean(entries.sharedPetDeliveryEntry)}
                        onChange={(e) => handleEntryToggle("exclusivePetEntry", e.target.checked)}
                      />
                    }
                    label="4. Entrada exclusiva mascotas"
                  />
                  {entries.exclusivePetEntry && (
                    <Box sx={{ ml: 4, mt: 0.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant={entryImages["exclusivePetEntry"] ? "contained" : "outlined"}
                        color={entryImages["exclusivePetEntry"] ? "success" : "primary"}
                        startIcon={entryImages["exclusivePetEntry"] ? <CheckCircleIcon /> : <CloudUploadIcon />}
                        onClick={() => handleTriggerUpload("exclusivePetEntry")}
                        disabled={disabled || uploadingSlotKey === "exclusivePetEntry"}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        {uploadingSlotKey === "exclusivePetEntry"
                          ? "Subiendo Archivo..."
                          : entryImages["exclusivePetEntry"]
                            ? "Archivo Adjuntado (Cambiar)"
                            : "Adjuntar Archivo"}
                      </Button>
                      {entryImages["exclusivePetEntry"] && (
                        <IconButton size="small" color="error" onClick={() => handleRemovePhoto("exclusivePetEntry")}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>

                {/* 5. Entrada exclusiva domiciliarios */}
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(entries.exclusiveDeliveryEntry)}
                        disabled={disabled || Boolean(entries.noExclusiveEntries) || Boolean(entries.sharedPetDeliveryEntry)}
                        onChange={(e) => handleEntryToggle("exclusiveDeliveryEntry", e.target.checked)}
                      />
                    }
                    label="5. Entrada exclusiva domiciliarios"
                  />
                  {entries.exclusiveDeliveryEntry && (
                    <Box sx={{ ml: 4, mt: 0.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant={entryImages["exclusiveDeliveryEntry"] ? "contained" : "outlined"}
                        color={entryImages["exclusiveDeliveryEntry"] ? "success" : "primary"}
                        startIcon={entryImages["exclusiveDeliveryEntry"] ? <CheckCircleIcon /> : <CloudUploadIcon />}
                        onClick={() => handleTriggerUpload("exclusiveDeliveryEntry")}
                        disabled={disabled || uploadingSlotKey === "exclusiveDeliveryEntry"}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        {uploadingSlotKey === "exclusiveDeliveryEntry"
                          ? "Subiendo Archivo..."
                          : entryImages["exclusiveDeliveryEntry"]
                            ? "Archivo Adjuntado (Cambiar)"
                            : "Adjuntar Archivo"}
                      </Button>
                      {entryImages["exclusiveDeliveryEntry"] && (
                        <IconButton size="small" color="error" onClick={() => handleRemovePhoto("exclusiveDeliveryEntry")}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>

                {/* 6. Entrada compartida mascotas y domiciliarios */}
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(entries.sharedPetDeliveryEntry)}
                        disabled={
                          disabled ||
                          Boolean(entries.noExclusiveEntries) ||
                          (Boolean(entries.exclusivePetEntry) && Boolean(entries.exclusiveDeliveryEntry))
                        }
                        onChange={(e) => handleEntryToggle("sharedPetDeliveryEntry", e.target.checked)}
                      />
                    }
                    label="6. Entrada compartida para mascotas y domiciliarios"
                  />
                  {entries.sharedPetDeliveryEntry && (
                    <Box sx={{ ml: 4, mt: 0.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant={entryImages["sharedPetDeliveryEntry"] ? "contained" : "outlined"}
                        color={entryImages["sharedPetDeliveryEntry"] ? "success" : "primary"}
                        startIcon={entryImages["sharedPetDeliveryEntry"] ? <CheckCircleIcon /> : <CloudUploadIcon />}
                        onClick={() => handleTriggerUpload("sharedPetDeliveryEntry")}
                        disabled={disabled || uploadingSlotKey === "sharedPetDeliveryEntry"}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        {uploadingSlotKey === "sharedPetDeliveryEntry"
                          ? "Subiendo Archivo..."
                          : entryImages["sharedPetDeliveryEntry"]
                            ? "Archivo Adjuntado (Cambiar)"
                            : "Adjuntar Archivo"}
                      </Button>
                      {entryImages["sharedPetDeliveryEntry"] && (
                        <IconButton size="small" color="error" onClick={() => handleRemovePhoto("sharedPetDeliveryEntry")}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>

                {/* 7. Sin entradas exclusivas (Deshabilita 4, 5 y 6) */}
                <Divider sx={{ my: 0.5 }} />
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(entries.noExclusiveEntries)}
                        onChange={(e) => handleEntryToggle("noExclusiveEntries", e.target.checked)}
                        disabled={disabled}
                        color="warning"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "warning.main" }}>
                        7. Sin entradas exclusivas
                      </Typography>
                    }
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Áreas Comunes, Parqueaderos y Servicios */}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}>
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            🏊‍♂️ Áreas Comunes, Parqueaderos y Servicios
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Defina las áreas comunes e ingrese las cantidades o capacidades correspondientes.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* 1. Parqueadero Privado */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0 }}
              label="Parqueaderos Privados"
              placeholder="0"
              value={amenities.parkingAmount === 0 ? "" : amenities.parkingAmount}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChangeAmenities({
                  ...amenities,
                  hasParking: val > 0,
                  parkingAmount: val,
                });
              }}
              disabled={disabled}
            />
          </Grid>

          {/* 2. Parqueadero Visitantes */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0 }}
              label="Parqueaderos Visitantes"
              placeholder="0"
              value={amenities.guestParkingAmount === 0 ? "" : amenities.guestParkingAmount}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChangeAmenities({
                  ...amenities,
                  hasGuestParking: val > 0,
                  guestParkingAmount: val,
                });
              }}
              disabled={disabled}
            />
          </Grid>

          {/* 3. Parqueadero de Motos */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0 }}
              label="Parqueadero de Motos"
              placeholder="0"
              value={amenities.motorcycleParkingAmount === 0 ? "" : amenities.motorcycleParkingAmount}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChangeAmenities({
                  ...amenities,
                  hasMotorcycleParking: val > 0,
                  motorcycleParkingAmount: val,
                });
              }}
              disabled={disabled}
            />
          </Grid>

          {/* 4. Depósitos */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0 }}
              label="Depósitos"
              placeholder="0"
              value={amenities.storageRoomAmount === 0 ? "" : amenities.storageRoomAmount}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChangeAmenities({
                  ...amenities,
                  hasStorageRoom: val > 0,
                  storageRoomAmount: val,
                });
              }}
              disabled={disabled}
            />
          </Grid>

          {/* 5. Sub-bloque Dedicado: Bicicleteros Comunales con Total Integrado */}
          <Grid size={{ xs: 12 }}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 2.5,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.02)"
                    : "rgba(0, 0, 0, 0.015)",
                border: (theme) =>
                  amenities.hasBicycleRack
                    ? `1.5px solid ${theme.palette.primary.main}`
                    : `1px solid ${theme.palette.divider}`,
                transition: "all 0.2s ease-in-out",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1.5,
                  mb: amenities.hasBicycleRack ? 2 : 0,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <BikeIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Bicicleteros Comunales
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Configure los módulos (racks) físicos y su capacidad unitaria
                    </Typography>
                  </Box>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={Boolean(amenities.hasBicycleRack)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const checked = e.target.checked;
                        onChangeAmenities({
                          ...amenities,
                          hasBicycleRack: checked,
                          bicycleRackAmount: checked ? (amenities.bicycleRackAmount || 0) : 0,
                          bicycleCapacityPerRack: checked ? (amenities.bicycleCapacityPerRack || 0) : 0,
                        });
                      }}
                      disabled={disabled}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {amenities.hasBicycleRack ? "Habilitado" : "Deshabilitado"}
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Box>

              {amenities.hasBicycleRack && (
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      inputProps={{ min: 0 }}
                      label="Cantidad de Módulos (Racks)"
                      placeholder="0"
                      value={amenities.bicycleRackAmount === 0 ? "" : amenities.bicycleRackAmount}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                        onChangeAmenities({
                          ...amenities,
                          hasBicycleRack: true,
                          bicycleRackAmount: val,
                        });
                      }}
                      disabled={disabled}
                      helperText="Estructuras físicas instaladas"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      inputProps={{ min: 0 }}
                      label="Capacidad por Módulo (Bicicletas)"
                      placeholder="0"
                      value={amenities.bicycleCapacityPerRack === 0 ? "" : amenities.bicycleCapacityPerRack}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                        updateAmenity("bicycleCapacityPerRack", val);
                      }}
                      disabled={disabled}
                      helperText="Cupos de bicicletas por módulo"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(25, 118, 210, 0.12)"
                            : "rgba(25, 118, 210, 0.08)",
                        border: "1px solid",
                        borderColor: "primary.light",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <BikeIcon color="primary" />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 700, textTransform: "uppercase", display: "block" }}
                        >
                          Capacidad Total
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 800,
                            color: "primary.main",
                            wordBreak: "break-word",
                          }}
                        >
                          {totalBicycleCapacity > 0
                            ? `${totalBicycleCapacity} bicicletas (${amenities.bicycleRackAmount} racks × ${amenities.bicycleCapacityPerRack} cupos)`
                            : "0 bicicletas"}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>

          {/* 6. Salón Social */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0 }}
              label="Salón Social"
              placeholder="0"
              value={amenities.socialRoomAmount === 0 ? "" : amenities.socialRoomAmount}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChangeAmenities({
                  ...amenities,
                  hasSocialRoom: val > 0,
                  socialRoomAmount: val,
                });
              }}
              disabled={disabled}
            />
          </Grid>

          {/* 7. Gimnasio */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0 }}
              label="Gimnasio"
              placeholder="0"
              value={amenities.gymAmount === 0 ? "" : amenities.gymAmount}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChangeAmenities({
                  ...amenities,
                  hasGym: val > 0,
                  gymAmount: val,
                });
              }}
              disabled={disabled}
            />
          </Grid>

          {/* 8. Piscina */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0 }}
              label="Piscinas"
              placeholder="0"
              value={amenities.poolAmount === 0 ? "" : amenities.poolAmount}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChangeAmenities({
                  ...amenities,
                  hasPool: val > 0,
                  poolAmount: val,
                });
              }}
              disabled={disabled}
            />
          </Grid>

          {/* 9. Parque Infantil */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0 }}
              label="Parques Infantiles"
              placeholder="0"
              value={amenities.playgroundAmount === 0 ? "" : amenities.playgroundAmount}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChangeAmenities({
                  ...amenities,
                  hasPlayground: val > 0,
                  playgroundAmount: val,
                });
              }}
              disabled={disabled}
            />
          </Grid>

          {/* 10. Cancha de Squash */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0 }}
              label="Canchas de Squash"
              placeholder="0"
              value={amenities.squashCourtAmount === 0 ? "" : amenities.squashCourtAmount}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChangeAmenities({
                  ...amenities,
                  hasSquashCourt: val > 0,
                  squashCourtAmount: val,
                });
              }}
              disabled={disabled}
            />
          </Grid>

          {/* 11. Cancha de Tenis */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0 }}
              label="Canchas de Tenis"
              placeholder="0"
              value={amenities.tennisCourtAmount === 0 ? "" : amenities.tennisCourtAmount}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChangeAmenities({
                  ...amenities,
                  hasTennisCourt: val > 0,
                  tennisCourtAmount: val,
                });
              }}
              disabled={disabled}
            />
          </Grid>

          {/* 12. Cancha de Fútbol */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0 }}
              label="Canchas de Fútbol"
              placeholder="0"
              value={amenities.footballCourtAmount === 0 ? "" : amenities.footballCourtAmount}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChangeAmenities({
                  ...amenities,
                  hasFootballCourt: val > 0,
                  footballCourtAmount: val,
                });
              }}
              disabled={disabled}
            />
          </Grid>

          {/* 13. Cancha de Baloncesto */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0 }}
              label="Canchas de Baloncesto"
              placeholder="0"
              value={amenities.basketballCourtAmount === 0 ? "" : amenities.basketballCourtAmount}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChangeAmenities({
                  ...amenities,
                  hasBasketballCourt: val > 0,
                  basketballCourtAmount: val,
                });
              }}
              disabled={disabled}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
