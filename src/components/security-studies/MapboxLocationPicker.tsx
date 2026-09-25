"use client";

import { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Slider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Stack,
  Card,
  CardMedia,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  CameraAlt as CameraAltIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  FilterCenterFocus as CenterFocusIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";

interface MapboxLocationPickerProps {
  clientId: string;
  clientName: string;
  initialAddress?: string;
  onBaseGenerated: (baseData: {
    baseImageS3Key: string;
    presignedUrl: string;
    center: { lat: number; lng: number };
    zoom: number;
    bbox: {
      minLat: number;
      minLng: number;
      maxLat: number;
      maxLng: number;
    };
    width: number;
    height: number;
  }) => void;
  onCancel?: () => void;
}

export default function MapboxLocationPicker({
  clientId,
  clientName,
  initialAddress = "",
  onBaseGenerated,
  onCancel,
}: MapboxLocationPickerProps) {
  const [address, setAddress] = useState(initialAddress);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);

  const [lat, setLat] = useState<number>(4.674062);
  const [lng, setLng] = useState<number>(-74.065258);
  const [zoom, setZoom] = useState<number>(17);
  const [style, setStyle] = useState<string>("mapbox/satellite-streets-v12");
  const [generating, setGenerating] = useState(false);

  // Drag-to-pan states
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; lat: number; lng: number } | null>(null);

  const { showError, showSuccess } = useNotification();
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Auto-search on mount if address is present
  useEffect(() => {
    if (initialAddress && initialAddress.trim().length > 3) {
      handleSearchGeocode(initialAddress);
    }
  }, [initialAddress]);

  const handleSearchGeocode = async (queryText?: string) => {
    const q = queryText || address;
    if (!q.trim()) return;

    setSearching(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        q,
      )}.json?access_token=${mapboxToken}&limit=5`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        setSearchResults(data.features);
        selectLocation(data.features[0]);
      } else {
        showError("No se encontraron coordenadas para la dirección ingresada.");
      }
    } catch (err: any) {
      showError(err.message || "Error al geocodificar dirección.");
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (feature: any) => {
    setSelectedPlace(feature);
    const [featureLng, featureLat] = feature.center;
    setLng(Number(featureLng.toFixed(6)));
    setLat(Number(featureLat.toFixed(6)));
    setIsAddressConfirmed(true);
  };

  // Nudge pan helper
  const handleNudge = (deltaX: number, deltaY: number) => {
    const scale = 512 * Math.pow(2, zoom);
    const deltaLng = (deltaX / scale) * 360;
    const deltaLat = -(deltaY / scale) * 360 * Math.cos((lat * Math.PI) / 180);

    setLng((prev) => Number((prev + deltaLng).toFixed(6)));
    setLat((prev) => Number((prev + deltaLat).toFixed(6)));
  };

  // Mouse drag handlers on the map preview
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      lat,
      lng,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const scale = 512 * Math.pow(2, zoom);
    const deltaLng = -(dx / scale) * 360;
    const deltaLat = (dy / scale) * 360 * Math.cos((dragStartRef.current.lat * Math.PI) / 180);

    setLng(Number((dragStartRef.current.lng + deltaLng).toFixed(6)));
    setLat(Number((dragStartRef.current.lat + deltaLat).toFixed(6)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleGenerateBase = async () => {
    setGenerating(true);
    try {
      const response = await HttpClient.post<any>(
        "/administrative/security-studies/generate-base",
        {
          clientId,
          lat,
          lng,
          zoom,
          width: 1920,
          height: 1080,
          style,
        },
      );

      showSuccess("¡Fotografía satelital Full HD (1920x1080) capturada con éxito!");
      onBaseGenerated(response);
    } catch (err: any) {
      showError(err.message || "Error al generar imagen satelital base.");
    } finally {
      setGenerating(false);
    }
  };

  // Static preview URL (16:9 ratio, 640x360@2x)
  const previewUrl = `https://api.mapbox.com/styles/v1/${style}/static/${lng},${lat},${zoom},0,0/640x360@2x?access_token=${mapboxToken}`;

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Configuración Satelital y Encuadre del Cliente
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {clientName}: Ubica y encuadra la infraestructura física del conjunto
          moviendo el mapa o ajustando el zoom.
        </Typography>
      </Box>

      {/* Step 1: Confirm or Edit Address */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          1. Dirección del Conjunto / Inmueble
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            size="small"
            label="Dirección Física"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej: Calle 85a bis #28c-50, Bogotá"
            disabled={searching || generating}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchGeocode();
            }}
          />
          <Button
            variant="contained"
            startIcon={
              searching ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <SearchIcon />
              )
            }
            onClick={() => handleSearchGeocode()}
            disabled={searching || generating || !address.trim()}
            sx={{ px: 3, whiteSpace: "nowrap", fontWeight: 600 }}
          >
            Buscar en Mapa
          </Button>
        </Stack>

        {searchResults.length > 1 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Resultados coincidentes encontrados:
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 0.5 }}>
              {searchResults.map((item) => (
                <Button
                  key={item.id}
                  size="small"
                  variant={
                    selectedPlace?.id === item.id ? "contained" : "outlined"
                  }
                  color={selectedPlace?.id === item.id ? "primary" : "inherit"}
                  onClick={() => selectLocation(item)}
                  sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.2 }}
                >
                  {item.place_name.slice(0, 45)}...
                </Button>
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* Step 2: Map Tuning & Interactive Preview */}
      {isAddressConfirmed && (
        <Box sx={{ mt: 3, pt: 2, borderTop: "1px dashed", borderColor: "divider" }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={3}
            alignItems="flex-start"
          >
            {/* Left Controls */}
            <Box sx={{ flex: 1, width: "100%" }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                2. Ajuste de Zoom, Ángulo y Posicionamiento
              </Typography>

              <Alert severity="info" sx={{ mb: 2, fontSize: "0.82rem" }}>
                💡 <strong>Consejo de encuadre:</strong> Puedes arrastrar la imagen directamente
                en el recuadro de la derecha con el mouse, o usar los botones de flechas para centrar
                exactamente el conjunto residencial.
              </Alert>

              <Stack spacing={2.5}>
                <Box>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" fontWeight={600}>
                      Nivel de Zoom: {zoom} (Recomendado: 16 - 19)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {zoom < 16 ? "Vista amplia" : zoom > 18 ? "Detalle muy cercano" : "Encuadre óptimo"}
                    </Typography>
                  </Stack>
                  <Slider
                    value={zoom}
                    min={14}
                    max={20}
                    step={0.5}
                    onChange={(_, val) => setZoom(val as number)}
                    valueLabelDisplay="auto"
                  />
                </Box>

                <FormControl size="small" fullWidth>
                  <InputLabel>Estilo de Vista</InputLabel>
                  <Select
                    value={style}
                    label="Estilo de Vista"
                    onChange={(e) => setStyle(e.target.value)}
                  >
                    <MenuItem value="mapbox/satellite-streets-v12">
                      Satelital con Nombres de Calles y Límites
                    </MenuItem>
                    <MenuItem value="mapbox/satellite-v9">
                      Satelital Limpio (Fotografía Aérea Pura)
                    </MenuItem>
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={2}>
                  <TextField
                    size="small"
                    label="Latitud Central"
                    type="number"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Longitud Central"
                    type="number"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                    fullWidth
                  />
                </Stack>
              </Stack>
            </Box>

            {/* Right: Live Interactive Map Preview */}
            <Box sx={{ flex: 1.3, width: "100%" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Vista Previa Interactiva (Full HD 1920x1080)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  🖱️ Arrastra sobre la imagen para mover el encuadre
                </Typography>
              </Stack>

              <Card
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                sx={{
                  position: "relative",
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "2px solid",
                  borderColor: isDragging ? "secondary.main" : "primary.main",
                  bgcolor: "black",
                  cursor: isDragging ? "grabbing" : "grab",
                  userSelect: "none",
                }}
              >
                <CardMedia
                  component="img"
                  image={previewUrl}
                  alt="Vista Satelital Mapbox"
                  sx={{
                    width: "100%",
                    height: 280,
                    objectFit: "cover",
                    pointerEvents: "none",
                  }}
                />

                {/* Center Crosshair Indicator */}
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                    color: "rgba(255, 255, 255, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CenterFocusIcon sx={{ fontSize: 36, filter: "drop-shadow(0 0 2px black)" }} />
                </Box>

                {/* Directional Nudge Pad (Overlaid Controls) */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    bgcolor: "rgba(0,0,0,0.65)",
                    backdropFilter: "blur(4px)",
                    borderRadius: 2,
                    p: 0.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    zIndex: 5,
                  }}
                >
                  <Tooltip title="Mover hacia el Norte (Arriba)">
                    <IconButton
                      size="small"
                      sx={{ color: "white", p: 0.3 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNudge(0, -60);
                      }}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Mover hacia el Oeste (Izquierda)">
                      <IconButton
                        size="small"
                        sx={{ color: "white", p: 0.3 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNudge(-60, 0);
                        }}
                      >
                        <ArrowBackIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Mover hacia el Este (Derecha)">
                      <IconButton
                        size="small"
                        sx={{ color: "white", p: 0.3 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNudge(60, 0);
                        }}
                      >
                        <ArrowForwardIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Tooltip title="Mover hacia el Sur (Abajo)">
                    <IconButton
                      size="small"
                      sx={{ color: "white", p: 0.3 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNudge(0, 60);
                      }}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Zoom Buttons Overlay */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    bgcolor: "rgba(0,0,0,0.65)",
                    backdropFilter: "blur(4px)",
                    borderRadius: 2,
                    p: 0.5,
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 5,
                  }}
                >
                  <Tooltip title="Acercar Zoom">
                    <IconButton
                      size="small"
                      sx={{ color: "white", p: 0.4 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoom((z) => Math.min(z + 0.5, 20));
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Alejar Zoom">
                    <IconButton
                      size="small"
                      sx={{ color: "white", p: 0.4 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoom((z) => Math.max(z - 0.5, 14));
                      }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Resolution Badge */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    bgcolor: "rgba(0,0,0,0.75)",
                    color: "#00E676",
                    fontWeight: 700,
                    px: 1.2,
                    py: 0.4,
                    borderRadius: 1,
                    fontSize: "0.72rem",
                    border: "1px solid rgba(0, 230, 118, 0.4)",
                  }}
                >
                  FULL HD 1920x1080 px
                </Box>
              </Card>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                Ubicación central: <strong>{lat.toFixed(6)}, {lng.toFixed(6)}</strong> • {selectedPlace?.place_name || address}
              </Typography>
            </Box>
          </Stack>

          {/* Action Footer */}
          <Box
            sx={{
              mt: 4,
              pt: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {onCancel && (
              <Button onClick={onCancel} disabled={generating}>
                Cancelar
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={
                generating ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CameraAltIcon />
                )
              }
              onClick={handleGenerateBase}
              disabled={generating}
              sx={{
                ml: "auto",
                fontWeight: 700,
                px: 4,
                borderRadius: 2,
                boxShadow: 3,
              }}
            >
              {generating
                ? "Capturando en Full HD y Almacenando en AWS S3..."
                : "Capturar e Inicializar Canva (1920x1080)"}
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
