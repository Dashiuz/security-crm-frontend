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
  Switch,
  Checkbox,
  Skeleton,
  useTheme,
  Divider,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  Tooltip,
} from "@mui/material";
import {
  EditRounded as EditIcon,
  SaveRounded as SaveIcon,
  CloseRounded as CloseIcon,
  HomeWorkRounded as HomeWorkIcon,
  PoolRounded as PoolIcon,
  DoorFrontRounded as DoorFrontIcon,
  AddRounded as AddIcon,
  DeleteRounded as DeleteIcon,
  CloudUploadRounded as CloudUploadIcon,
  WarningAmberRounded as WarningIcon,
  SecurityRounded as SecurityIcon,
  DirectionsBikeRounded as BikeIcon,
  TwoWheelerRounded as MotorcycleIcon,
  PhotoCameraRounded as CameraIcon,
  CheckCircleRounded as CheckCircleIcon,
  OpenInNewRounded as OpenInNewIcon,
  FitnessCenterRounded as GymIcon,
  SportsTennisRounded as TennisIcon,
  SportsSoccerRounded as SoccerIcon,
  SportsBasketballRounded as BasketballIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useClientDetail } from "../ClientContext";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { useNotification } from "@/providers/NotificationProvider";

interface TowerInput {
  id?: string;
  towerName: string;
  floorsAmount: number;
  apartmentsPerFloor: number;
  elevators: number;
}

export default function ClientOperationsPage() {
  const { clientId, client, loading, saving, updateOperations, permissions } =
    useClientDetail();
  const router = useRouter();
  const theme = useTheme();
  const { showError, showSuccess } = useNotification();

  const [editingCard, setEditingCard] = useState<string | null>(null);

  // Structure form
  const [structureType, setStructureType] = useState<string>("BUILDING_CLUSTER");
  const [floorsAmount, setFloorsAmount] = useState<number>(5);
  const [apartmentsPerFloor, setApartmentsPerFloor] = useState<number>(4);
  const [singleElevators, setSingleElevators] = useState<number>(1);
  const [towers, setTowers] = useState<TowerInput[]>([
    { towerName: "Torre 1", floorsAmount: 10, apartmentsPerFloor: 4, elevators: 2 },
  ]);
  const [unitsAmount, setUnitsAmount] = useState<number>(50);

  // Amenities form (13 full amenities with motorcycle & bicycle capacity breakdown)
  const [amenities, setAmenities] = useState({
    hasSocialRoom: false,
    socialRoomAmount: 0,
    hasGym: false,
    gymAmount: 0,
    hasPool: false,
    poolAmount: 0,
    hasPlayground: false,
    playgroundAmount: 0,
    hasTennisCourt: false,
    tennisCourtAmount: 0,
    hasFootballCourt: false,
    footballCourtAmount: 0,
    hasBasketballCourt: false,
    basketballCourtAmount: 0,
    hasVolleyballCourt: false,
    volleyballCourtAmount: 0,
    hasSquashCourt: false,
    squashCourtAmount: 0,
    hasParking: true,
    parkingAmount: 50,
    hasGuestParking: true,
    guestParkingAmount: 15,
    hasMotorcycleParking: false,
    motorcycleParkingAmount: 0,
    hasBicycleRack: true,
    bicycleRackAmount: 20,
    bicycleCapacityPerRack: 1,
    hasStorageRoom: false,
    storageRoomAmount: 0,
    hasCommercialStores: false,
    commercialStoresAmount: 0,
  });

  // Entries form (7 full access options with real photo evidence)
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
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({});

  // Regeneration double confirmation
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

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

  // Sync client properties
  useEffect(() => {
    if (client) {
      const props = client.clientProperties || {};
      const sType = props.structureType || "BUILDING_CLUSTER";
      setStructureType(sType);
      setUnitsAmount(props.unitsAmount || 50);

      const sqlTowers = client.towers || [];
      const configTowers = props.structureConfig?.towers || [];

      if (sqlTowers.length > 0) {
        setTowers(
          sqlTowers.map((t: any) => {
            const cfg = configTowers.find(
              (ct: any) =>
                ct.id === t.id ||
                ct.towerName?.trim().toLowerCase() ===
                t.towerName?.trim().toLowerCase(),
            );
            return {
              id: t.id,
              towerName: t.towerName || "Torre",
              floorsAmount: t.floorsAmount || cfg?.floorsAmount || 10,
              apartmentsPerFloor: cfg?.apartmentsPerFloor || 4,
              elevators: t.elevators ?? cfg?.elevators ?? 1,
            };
          }),
        );
        if (sType === "SINGLE_BUILDING") {
          setFloorsAmount(sqlTowers[0]?.floorsAmount || 5);
          setApartmentsPerFloor(configTowers[0]?.apartmentsPerFloor || 4);
          setSingleElevators(sqlTowers[0]?.elevators || 1);
        }
      }

      setAmenities({
        hasSocialRoom: Boolean(props.hasSocialRoom),
        socialRoomAmount: props.socialRoomAmount || 0,
        hasGym: Boolean(props.hasGym),
        gymAmount: props.gymAmount || 0,
        hasPool: Boolean(props.hasPool),
        poolAmount: props.poolAmount || 0,
        hasPlayground: Boolean(props.hasPlayground),
        playgroundAmount: props.playgroundAmount || 0,
        hasTennisCourt: Boolean(props.hasTennisCourt),
        tennisCourtAmount: props.tennisCourtAmount || 0,
        hasFootballCourt: Boolean(props.hasFootballCourt),
        footballCourtAmount: props.footballCourtAmount || 0,
        hasBasketballCourt: Boolean(props.hasBasketballCourt),
        basketballCourtAmount: props.basketballCourtAmount || 0,
        hasVolleyballCourt: Boolean(props.hasVolleyballCourt),
        volleyballCourtAmount: props.volleyballCourtAmount || 0,
        hasSquashCourt: Boolean(props.hasSquashCourt),
        squashCourtAmount: props.squashCourtAmount || 0,
        hasParking: Boolean(props.hasParking),
        parkingAmount: props.parkingAmount || 0,
        hasGuestParking: Boolean(props.hasGuestParking),
        guestParkingAmount: props.guestParkingAmount || 0,
        hasMotorcycleParking: Boolean(props.hasMotorcycleParking),
        motorcycleParkingAmount: props.motorcycleParkingAmount || 0,
        hasBicycleRack: Boolean(props.hasBicycleRack),
        bicycleRackAmount: props.bicycleRackAmount || 0,
        bicycleCapacityPerRack: props.bicycleCapacityPerRack || 0,
        hasStorageRoom: Boolean(props.hasStorageRoom),
        storageRoomAmount: props.storageRoomAmount || 0,
        hasCommercialStores: Boolean(props.hasCommercialStores),
        commercialStoresAmount: props.commercialStoresAmount || 0,
      });

      if (props.entriesDescription) {
        setEntries((prev) => ({
          ...prev,
          ...props.entriesDescription,
          noExclusiveEntries: Boolean(props.entriesDescription.noExclusiveEntries),
        }));
      }
      if (props.entriesMediaFiles) {
        setEntryImages(props.entriesMediaFiles);
      }
    }
  }, [client]);

  // Tower handlers with auto-cloning from last tower
  const handleAddTower = () => {
    const lastTower = towers[towers.length - 1];
    const nextTowerNum = towers.length + 1;
    setTowers((prev) => [
      ...prev,
      {
        towerName: `Torre ${nextTowerNum}`,
        floorsAmount: lastTower ? Number(lastTower.floorsAmount) || 10 : 10,
        apartmentsPerFloor: lastTower ? Number(lastTower.apartmentsPerFloor) || 4 : 4,
        elevators: lastTower ? Number(lastTower.elevators) || 1 : 1,
      },
    ]);
  };

  const handleRemoveTower = (index: number) => {
    setTowers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTowerChange = (
    index: number,
    field: keyof TowerInput,
    value: any,
  ) => {
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
        entityId: clientId,
        clientId,
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
      }
      if (
        (key === "exclusivePetEntry" ||
          key === "exclusiveDeliveryEntry" ||
          key === "sharedPetDeliveryEntry") &&
        checked
      ) {
        next.noExclusiveEntries = false;
      }

      // Vehicle mutual exclusivity
      if (key === "separateVehicleEntryExit" && checked) {
        next.sharedVehicleEntryExit = false;
      } else if (key === "sharedVehicleEntryExit" && checked) {
        next.separateVehicleEntryExit = false;
      }
      return next;
    });
  };

  // Total bicycle capacity calculation
  const totalBicycleCapacity =
    amenities.hasBicycleRack
      ? (Number(amenities.bicycleRackAmount) || 0) *
      (Number(amenities.bicycleCapacityPerRack) || 0)
      : 0;

  // Save Structure Check
  const handleInitiateSaveStructure = () => {
    const hasExistingUnits =
      (client?.units && client.units.length > 0) ||
      (client?.towers && client.towers.length > 0);
    if (hasExistingUnits) {
      setConfirmModalOpen(true);
      setConfirmInput("");
    } else {
      executeSaveStructure();
    }
  };

  const executeSaveStructure = async (code?: string) => {
    const structureConfig = {
      structureType,
      floorsAmount: Number(floorsAmount),
      apartmentsPerFloor: Number(apartmentsPerFloor),
      towersAmount: structureType === "SINGLE_BUILDING" ? 1 : towers.length,
      unitsAmount:
        structureType === "SINGLE_BUILDING"
          ? Number(floorsAmount) * Number(apartmentsPerFloor)
          : structureType === "HOUSES"
            ? Number(unitsAmount)
            : towers.reduce(
              (acc, t) =>
                acc + Number(t.floorsAmount) * Number(t.apartmentsPerFloor),
              0,
            ),
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
            id: t.id,
            towerName: t.towerName,
            floorsAmount: Number(t.floorsAmount),
            apartmentsPerFloor: Number(t.apartmentsPerFloor),
            elevators: Number(t.elevators),
          })),
    };

    const success = await updateOperations({
      structureConfig,
      confirmationCode: code,
      confirmRegenerate: code === "REGENERAR",
    });

    if (success) {
      setConfirmModalOpen(false);
      setEditingCard(null);
    }
  };

  const handleSaveAmenities = async () => {
    const success = await updateOperations({
      ...amenities,
    });
    if (success) setEditingCard(null);
  };

  const handleSaveEntries = async () => {
    const success = await updateOperations({
      entriesDescription: entries,
      entriesMediaFiles: entryImages,
    });
    if (success) setEditingCard(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Skeleton variant="rounded" height={180} />
        <Skeleton variant="rounded" height={220} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <input
        type="file"
        ref={imageInputRef}
        style={{ display: "none" }}
        accept="image/*,application/pdf"
        onChange={handleFileChange}
      />

      {/* Page Title & Quick Actions */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Operaciones y Estructura
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure la distribución física de torres, zonas comunes y puntos de acceso con soporte de evidencia fotográfica.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<SecurityIcon />}
          onClick={() =>
            router.push(`/administrative/clients/${clientId}/security-studies`)
          }
        >
          Ver Estudios de Seguridad
        </Button>
      </Box>

      {/* Card 1: Estructura Física */}
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
            <HomeWorkIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Estructura Física del Inmueble
            </Typography>
          </Box>
          {permissions.canEditOperations &&
            (editingCard === "structure" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={() => setEditingCard(null)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleInitiateSaveStructure}
                  disabled={saving}
                >
                  Guardar Estructura
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingCard("structure")}
              >
                Editar
              </Button>
            ))}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "structure" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Tipo de Conjunto"
                  value={structureType}
                  onChange={(e) => setStructureType(e.target.value)}
                >
                  <MenuItem value="BUILDING_CLUSTER">
                    Agrupación de Edificios / Torres
                  </MenuItem>
                  <MenuItem value="SINGLE_BUILDING">Edificio Único</MenuItem>
                  <MenuItem value="HOUSES">Casas / Condominio Horizontal</MenuItem>
                  <MenuItem value="MIXED">Mixto</MenuItem>
                </TextField>
              </Grid>
              {structureType === "SINGLE_BUILDING" && (
                <>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      label="Pisos"
                      value={floorsAmount}
                      onChange={(e) => setFloorsAmount(Number(e.target.value))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      label="Aptos / Piso"
                      value={apartmentsPerFloor}
                      onChange={(e) =>
                        setApartmentsPerFloor(Number(e.target.value))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      label="Ascensores"
                      value={singleElevators}
                      onChange={(e) => setSingleElevators(Number(e.target.value))}
                    />
                  </Grid>
                </>
              )}
            </Grid>

            {structureType !== "SINGLE_BUILDING" &&
              structureType !== "HOUSES" && (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "stretch", sm: "center" },
                      justifyContent: "space-between",
                      gap: 1.5,
                      mb: 1.5,
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      Listado de Torres ({towers.length})
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      variant="outlined"
                      onClick={handleAddTower}
                      sx={{
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
                      <Grid size={12} key={idx}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            flexWrap: "wrap",
                          }}
                        >
                          <TextField
                            size="small"
                            label="Nombre Torre"
                            value={tower.towerName}
                            onChange={(e) =>
                              handleTowerChange(idx, "towerName", e.target.value)
                            }
                            sx={{ width: 150 }}
                          />
                          <TextField
                            size="small"
                            type="number"
                            label="Pisos"
                            value={tower.floorsAmount}
                            onChange={(e) =>
                              handleTowerChange(
                                idx,
                                "floorsAmount",
                                Number(e.target.value),
                              )
                            }
                            sx={{ width: 90 }}
                          />
                          <TextField
                            size="small"
                            type="number"
                            label="Aptos/Piso"
                            value={tower.apartmentsPerFloor}
                            onChange={(e) =>
                              handleTowerChange(
                                idx,
                                "apartmentsPerFloor",
                                Number(e.target.value),
                              )
                            }
                            sx={{ width: 110 }}
                          />
                          <TextField
                            size="small"
                            type="number"
                            label="Ascensores"
                            value={tower.elevators}
                            onChange={(e) =>
                              handleTowerChange(
                                idx,
                                "elevators",
                                Number(e.target.value),
                              )
                            }
                            sx={{ width: 100 }}
                          />
                          {towers.length > 1 && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveTower(idx)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
          </Box>
        ) : (
          <Box>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  TIPO DE ESTRUCTURA
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {structureType === "SINGLE_BUILDING"
                    ? "Edificio Único"
                    : structureType === "HOUSES"
                      ? "Casas / Condominio"
                      : "Agrupación de Torres"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  TOTAL TORRES REGISTRADAS
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {client?.towers?.length || towers.length}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  TOTAL INMUEBLES ESTIMADOS
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {client?.units?.length ||
                    client?.clientProperties?.unitsAmount ||
                    0}
                </Typography>
              </Grid>
            </Grid>

            {client?.towers && client.towers.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {client.towers.map((t: any) => (
                  <Chip
                    key={t.id}
                    label={`${t.towerName}: ${t.floorsAmount} pisos`}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Card 2: Amenidades y Zonas Comunes (13 Opciones con Paridad Total) */}
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
            <PoolIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Zonas Comunes y Amenidades
            </Typography>
          </Box>
          {permissions.canEditOperations &&
            (editingCard === "amenities" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={() => setEditingCard(null)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAmenities}
                  disabled={saving}
                >
                  Guardar Amenidades
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingCard("amenities")}
              >
                Editar
              </Button>
            ))}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "amenities" ? (
          <Grid container spacing={2}>
            {[
              { key: "hasSocialRoom", amountKey: "socialRoomAmount", label: "Salón Social" },
              { key: "hasGym", amountKey: "gymAmount", label: "Gimnasio" },
              { key: "hasPool", amountKey: "poolAmount", label: "Piscina" },
              { key: "hasPlayground", amountKey: "playgroundAmount", label: "Parque Infantil" },
              { key: "hasTennisCourt", amountKey: "tennisCourtAmount", label: "Cancha de Tenis" },
              { key: "hasFootballCourt", amountKey: "footballCourtAmount", label: "Cancha de Fútbol" },
              { key: "hasBasketballCourt", amountKey: "basketballCourtAmount", label: "Cancha de Baloncesto" },
              { key: "hasVolleyballCourt", amountKey: "volleyballCourtAmount", label: "Cancha de Voleibol" },
              { key: "hasSquashCourt", amountKey: "squashCourtAmount", label: "Cancha de Squash" },
              { key: "hasParking", amountKey: "parkingAmount", label: "Parqueadero Privado" },
              { key: "hasGuestParking", amountKey: "guestParkingAmount", label: "Parqueadero Visitantes" },
              { key: "hasMotorcycleParking", amountKey: "motorcycleParkingAmount", label: "Parqueadero de Motos" },
              { key: "hasStorageRoom", amountKey: "storageRoomAmount", label: "Depósitos" },
              { key: "hasCommercialStores", amountKey: "commercialStoresAmount", label: "Locales Comerciales" },
            ].map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.key}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={Boolean((amenities as any)[item.key])}
                        onChange={(e) =>
                          setAmenities({
                            ...amenities,
                            [item.key]: e.target.checked,
                          })
                        }
                      />
                    }
                    label={item.label}
                  />
                  {(amenities as any)[item.key] && (
                    <TextField
                      size="small"
                      type="number"
                      label="Cant."
                      value={(amenities as any)[item.amountKey] || 0}
                      onChange={(e) =>
                        setAmenities({
                          ...amenities,
                          [item.amountKey]: Number(e.target.value),
                        })
                      }
                      sx={{ width: 80 }}
                    />
                  )}
                </Paper>
              </Grid>
            ))}

            {/* Bicicleteros Especial con Módulos y Capacidad por Módulo */}
            <Grid size={{ xs: 12 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.02)"
                      : "rgba(0, 0, 0, 0.01)",
                  border: (theme) =>
                    amenities.hasBicycleRack
                      ? `1.5px solid ${theme.palette.primary.main}`
                      : `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={amenities.hasBicycleRack}
                          onChange={(e) =>
                            setAmenities({
                              ...amenities,
                              hasBicycleRack: e.target.checked,
                            })
                          }
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight={700}>
                          Bicicletero Comunal
                        </Typography>
                      }
                    />
                  </Grid>

                  {amenities.hasBicycleRack && (
                    <>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Módulos (Racks)"
                          value={amenities.bicycleRackAmount}
                          onChange={(e) =>
                            setAmenities({
                              ...amenities,
                              bicycleRackAmount: Number(e.target.value),
                            })
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Capacidad / Módulo"
                          value={amenities.bicycleCapacityPerRack}
                          onChange={(e) =>
                            setAmenities({
                              ...amenities,
                              bicycleCapacityPerRack: Number(e.target.value),
                            })
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <Chip
                          icon={<BikeIcon />}
                          label={`Total: ${totalBicycleCapacity} bicis`}
                          color="primary"
                          variant="filled"
                          sx={{ fontWeight: 700, width: "100%", height: 38 }}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {amenities.hasSocialRoom && (
              <Chip
                label={`Salón Social (${amenities.socialRoomAmount})`}
                color="primary"
                variant="outlined"
              />
            )}
            {amenities.hasGym && (
              <Chip
                label={`Gimnasio (${amenities.gymAmount})`}
                color="primary"
                variant="outlined"
              />
            )}
            {amenities.hasPool && (
              <Chip
                label={`Piscina (${amenities.poolAmount})`}
                color="primary"
                variant="outlined"
              />
            )}
            {amenities.hasPlayground && (
              <Chip
                label={`Parque Infantil (${amenities.playgroundAmount})`}
                color="primary"
                variant="outlined"
              />
            )}
            {amenities.hasTennisCourt && (
              <Chip
                label={`Tenis (${amenities.tennisCourtAmount})`}
                color="primary"
                variant="outlined"
              />
            )}
            {amenities.hasFootballCourt && (
              <Chip
                label={`Fútbol (${amenities.footballCourtAmount})`}
                color="primary"
                variant="outlined"
              />
            )}
            {amenities.hasBasketballCourt && (
              <Chip
                label={`Baloncesto (${amenities.basketballCourtAmount})`}
                color="primary"
                variant="outlined"
              />
            )}
            {amenities.hasVolleyballCourt && (
              <Chip
                label={`Voleibol (${amenities.volleyballCourtAmount})`}
                color="primary"
                variant="outlined"
              />
            )}
            {amenities.hasSquashCourt && (
              <Chip
                label={`Squash (${amenities.squashCourtAmount})`}
                color="primary"
                variant="outlined"
              />
            )}
            {amenities.hasParking && (
              <Chip
                label={`Parqueadero Privado (${amenities.parkingAmount})`}
                color="success"
                variant="outlined"
              />
            )}
            {amenities.hasGuestParking && (
              <Chip
                label={`Parqueadero Visitantes (${amenities.guestParkingAmount})`}
                color="success"
                variant="outlined"
              />
            )}
            {amenities.hasMotorcycleParking && (
              <Chip
                icon={<MotorcycleIcon />}
                label={`Motos (${amenities.motorcycleParkingAmount})`}
                color="success"
                variant="outlined"
              />
            )}
            {amenities.hasBicycleRack && (
              <Chip
                icon={<BikeIcon />}
                label={`Bicicletero: ${amenities.bicycleRackAmount} módulos (${totalBicycleCapacity} cupos)`}
                color="primary"
                variant="outlined"
              />
            )}
            {amenities.hasStorageRoom && (
              <Chip
                label={`Depósitos (${amenities.storageRoomAmount})`}
                color="primary"
                variant="outlined"
              />
            )}
            {amenities.hasCommercialStores && (
              <Chip
                label={`Locales Comerciales (${amenities.commercialStoresAmount})`}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Card 3: Control de Accesos (7 Opciones con Subida Real de Evidencia Fotográfica) */}
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
          {permissions.canEditOperations &&
            (editingCard === "entries" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={() => setEditingCard(null)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveEntries}
                  disabled={saving}
                >
                  Guardar Accesos
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingCard("entries")}
              >
                Editar
              </Button>
            ))}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "entries" ? (
          <Grid container spacing={2.5}>
            {/* Columna Izquierda: Accesos Principales y Vehiculares */}
            <Grid size={{ xs: 12, md: 6 }}>
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
                                href={entryImages["mainEntry"].url}
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
                                  entryImages["separateVehicleEntryExit"].url
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
                                  entryImages["sharedVehicleEntryExit"].url
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
                                href={entryImages["exclusivePetEntry"].url}
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
                                  entryImages["exclusiveDeliveryEntry"].url
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
                                  entryImages["sharedPetDeliveryEntry"].url
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
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2 }}>
            <Chip
              icon={entryImages.mainEntry ? <CheckCircleIcon /> : undefined}
              label={
                entries.mainEntry
                  ? entryImages.mainEntry
                    ? "1. Peatonal Principal (Foto adjunta)"
                    : "1. Peatonal Principal: Sí"
                  : "1. Peatonal Principal: No"
              }
              variant="outlined"
              color={entries.mainEntry ? "primary" : "default"}
            />
            {entries.separateVehicleEntryExit && (
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
            {entries.sharedVehicleEntryExit && (
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
            {entries.exclusivePetEntry && (
              <Chip
                icon={
                  entryImages.exclusivePetEntry ? (
                    <CheckCircleIcon />
                  ) : undefined
                }
                label={
                  entryImages.exclusivePetEntry
                    ? "4. Mascotas Exclusivo (Foto adjunta)"
                    : "4. Mascotas Exclusivo"
                }
                variant="outlined"
                color="info"
              />
            )}
            {entries.exclusiveDeliveryEntry && (
              <Chip
                icon={
                  entryImages.exclusiveDeliveryEntry ? (
                    <CheckCircleIcon />
                  ) : undefined
                }
                label={
                  entryImages.exclusiveDeliveryEntry
                    ? "5. Domiciliarios Exclusivo (Foto adjunta)"
                    : "5. Domiciliarios Exclusivo"
                }
                variant="outlined"
                color="info"
              />
            )}
            {entries.sharedPetDeliveryEntry && (
              <Chip
                icon={
                  entryImages.sharedPetDeliveryEntry ? (
                    <CheckCircleIcon />
                  ) : undefined
                }
                label={
                  entryImages.sharedPetDeliveryEntry
                    ? "6. Mascotas y Domiciliarios Compartido (Foto adjunta)"
                    : "6. Mascotas y Domiciliarios Compartido"
                }
                variant="outlined"
                color="info"
              />
            )}
            {entries.noExclusiveEntries && (
              <Chip
                label="7. Sin entradas exclusivas"
                variant="outlined"
                color="warning"
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Confirmation Modal for Structure Regeneration */}
      <Dialog
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main" }}
        >
          <WarningIcon />
          Confirmación Destructiva
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            La regeneración de la estructura física borrará en cascada las torres, pisos, unidades y
            residentes asociados a este cliente en la base de datos.
          </Typography>
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{ display: "block", mb: 1 }}
          >
            Para proceder, escriba exactamente &quot;REGENERAR&quot;:
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="REGENERAR"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmModalOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            disabled={confirmInput !== "REGENERAR" || saving}
            onClick={() => executeSaveStructure("REGENERAR")}
          >
            Confirmar y Regenerar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
