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
  Skeleton,
  useTheme,
  Divider,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import {
  EditRounded as EditIcon,
  SaveRounded as SaveIcon,
  CloseRounded as CloseIcon,
  HomeWorkRounded as HomeWorkIcon,
  PoolRounded as PoolIcon,
  DoorFrontRounded as DoorFrontIcon,
  MapRounded as MapIcon,
  AddRounded as AddIcon,
  DeleteRounded as DeleteIcon,
  CloudUploadRounded as CloudUploadIcon,
  WarningAmberRounded as WarningIcon,
  SecurityRounded as SecurityIcon,
  ImageRounded as ImageIcon,
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

  // Amenities form
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
    hasCommercialStores: false,
    commercialStoresAmount: 0,
  });

  // Entries form
  const [entries, setEntries] = useState({
    mainEntry: true,
    separateVehicleEntryExit: false,
    sharedVehicleEntryExit: true,
    exclusivePetEntry: false,
    exclusiveDeliveryEntry: false,
    sharedPetDeliveryEntry: true,
  });
  const [entryImages, setEntryImages] = useState<Record<string, any>>({});
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({});

  // Regeneration double confirmation
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [activeImageKey, setActiveImageKey] = useState<string | null>(null);

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
        hasCommercialStores: Boolean(props.hasCommercialStores),
        commercialStoresAmount: props.commercialStoresAmount || 0,
      });

      if (props.entriesDescription) {
        setEntries((prev) => ({ ...prev, ...props.entriesDescription }));
      }
      if (props.entriesMediaFiles) {
        setEntryImages(props.entriesMediaFiles);
      }
    }
  }, [client]);

  // Tower handlers
  const handleAddTower = () => {
    const nextTowerNum = towers.length + 1;
    setTowers((prev) => [
      ...prev,
      {
        towerName: `Torre ${nextTowerNum}`,
        floorsAmount: 10,
        apartmentsPerFloor: 4,
        elevators: 1,
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
      const uploaded = await StorageApi.uploadMedia({
        file,
        entityType: MediaTypeCategory.CLIENT,
        entityId: clientId,
        clientId,
        subType: activeImageKey,
      });
      setEntryImages((prev) => ({
        ...prev,
        [activeImageKey]: {
          mediaId: uploaded.id,
          fileName: uploaded.fileName,
          url: uploaded.presignedUrl || uploaded.url,
        },
      }));
      showSuccess(`Foto ${file.name} subida.`);
    } catch (err: any) {
      showError(err.message || "Error al subir archivo");
    } finally {
      setUploadingKeys((prev) => ({
        ...prev,
        [`entry_${activeImageKey}`]: false,
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

  // Save Structure Check
  const handleInitiateSaveStructure = () => {
    const hasExistingUnits = (client?.units && client.units.length > 0) || (client?.towers && client.towers.length > 0);
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
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Page Title & Quick Actions */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Operaciones y Estructura
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure la distribución física de torres, zonas comunes y puntos de acceso.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<SecurityIcon />}
          onClick={() => router.push(`/administrative/clients/${clientId}/security-studies`)}
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
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <HomeWorkIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Estructura Física del Inmueble
            </Typography>
          </Box>
          {permissions.canEditOperations && (
            editingCard === "structure" ? (
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
            )
          )}
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
                  <MenuItem value="BUILDING_CLUSTER">Agrupación de Edificios / Torres</MenuItem>
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
                      onChange={(e) => setApartmentsPerFloor(Number(e.target.value))}
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

            {structureType !== "SINGLE_BUILDING" && structureType !== "HOUSES" && (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Listado de Torres ({towers.length})
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    variant="outlined"
                    onClick={handleAddTower}
                  >
                    Agregar Torre
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  {towers.map((tower, idx) => (
                    <Grid size={12} key={idx}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}
                      >
                        <TextField
                          size="small"
                          label="Nombre Torre"
                          value={tower.towerName}
                          onChange={(e) => handleTowerChange(idx, "towerName", e.target.value)}
                          sx={{ width: 150 }}
                        />
                        <TextField
                          size="small"
                          type="number"
                          label="Pisos"
                          value={tower.floorsAmount}
                          onChange={(e) => handleTowerChange(idx, "floorsAmount", Number(e.target.value))}
                          sx={{ width: 90 }}
                        />
                        <TextField
                          size="small"
                          type="number"
                          label="Aptos/Piso"
                          value={tower.apartmentsPerFloor}
                          onChange={(e) =>
                            handleTowerChange(idx, "apartmentsPerFloor", Number(e.target.value))
                          }
                          sx={{ width: 110 }}
                        />
                        <TextField
                          size="small"
                          type="number"
                          label="Ascensores"
                          value={tower.elevators}
                          onChange={(e) => handleTowerChange(idx, "elevators", Number(e.target.value))}
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
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
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
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  TOTAL TORRES REGISTRADAS
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {client?.towers?.length || towers.length}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  TOTAL INMUEBLES ESTIMADOS
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {client?.units?.length || client?.clientProperties?.unitsAmount || 0}
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
              Zonas Comunes y Amenidades
            </Typography>
          </Box>
          {permissions.canEditOperations && (
            editingCard === "amenities" ? (
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
            )
          )}
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
              { key: "hasParking", amountKey: "parkingAmount", label: "Parqueadero Privado" },
              { key: "hasGuestParking", amountKey: "guestParkingAmount", label: "Parqueadero Visitantes" },
              { key: "hasBicycleRack", amountKey: "bicycleRackAmount", label: "Bicicletero" },
              { key: "hasStorageRoom", amountKey: "storageRoomAmount", label: "Depósitos" },
            ].map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.key}>
                <Paper variant="outlined" sx={{ p: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={Boolean((amenities as any)[item.key])}
                        onChange={(e) =>
                          setAmenities({ ...amenities, [item.key]: e.target.checked })
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
                      sx={{ width: 75 }}
                    />
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {amenities.hasSocialRoom && <Chip label={`Salón Social (${amenities.socialRoomAmount})`} color="primary" variant="outlined" />}
            {amenities.hasGym && <Chip label={`Gimnasio (${amenities.gymAmount})`} color="primary" variant="outlined" />}
            {amenities.hasPool && <Chip label={`Piscina (${amenities.poolAmount})`} color="primary" variant="outlined" />}
            {amenities.hasPlayground && <Chip label={`Parque Infantil (${amenities.playgroundAmount})`} color="primary" variant="outlined" />}
            {amenities.hasTennisCourt && <Chip label={`Tenis (${amenities.tennisCourtAmount})`} color="primary" variant="outlined" />}
            {amenities.hasFootballCourt && <Chip label={`Fútbol (${amenities.footballCourtAmount})`} color="primary" variant="outlined" />}
            {amenities.hasParking && <Chip label={`Parqueadero Privado (${amenities.parkingAmount})`} color="success" variant="outlined" />}
            {amenities.hasGuestParking && <Chip label={`Parqueadero Visitantes (${amenities.guestParkingAmount})`} color="success" variant="outlined" />}
            {amenities.hasBicycleRack && <Chip label={`Bicicletero (${amenities.bicycleRackAmount})`} color="primary" variant="outlined" />}
            {amenities.hasStorageRoom && <Chip label={`Depósitos (${amenities.storageRoomAmount})`} color="primary" variant="outlined" />}
          </Box>
        )}
      </Paper>

      {/* Card 3: Control de Accesos */}
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
              Control de Accesos y Puntos de Entrada
            </Typography>
          </Box>
          {permissions.canEditOperations && (
            editingCard === "entries" ? (
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
            )
          )}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "entries" ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={entries.mainEntry}
                    onChange={(e) => setEntries({ ...entries, mainEntry: e.target.checked })}
                  />
                }
                label="Entrada Peatonal Principal"
              />
              <Button
                size="small"
                startIcon={<CloudUploadIcon />}
                onClick={() => triggerUpload("mainEntry")}
                sx={{ ml: 4, display: "block" }}
              >
                {entryImages.mainEntry ? "Reemplazar Foto" : "Anexar Foto"}
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={entries.sharedVehicleEntryExit}
                    onChange={(e) =>
                      setEntries({ ...entries, sharedVehicleEntryExit: e.target.checked })
                    }
                  />
                }
                label="Acceso Vehicular Compartido"
              />
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip
              label={entries.mainEntry ? "Entrada Peatonal Principal: Sí" : "Entrada Peatonal: No"}
              variant="outlined"
            />
            <Chip
              label={
                entries.sharedVehicleEntryExit
                  ? "Vehicular Compartido: Sí"
                  : "Vehicular Separado"
              }
              variant="outlined"
            />
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
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main" }}>
          <WarningIcon />
          Confirmación Destructiva
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            La regeneración de la estructura física borrará en cascada las torres, pisos, unidades y
            residentes asociados a este cliente en la base de datos.
          </Typography>
          <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 1 }}>
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
