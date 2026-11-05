"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Stack,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  CameraAlt as CameraIcon,
  Cameraswitch as SwitchCameraIcon,
  FlashOn as FlashOnIcon,
  FlashOff as FlashOffIcon,
  ViewWeek as BarcodeIcon,
  CheckCircle as ActiveIcon,
  QrCodeScanner as QrScanIcon,
  OpenInNew as OpenIcon,
  Videocam as VideoIcon,
} from "@mui/icons-material";
import {
  UniversalCodesApi,
  UniversalCode,
} from "@/lib/api/universal-codes";

interface QuickScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectCode: (code: UniversalCode) => void;
}

interface VideoDeviceOption {
  deviceId: string;
  label: string;
}

export default function QuickScannerDialog({
  open,
  onClose,
  onSelectCode,
}: QuickScannerDialogProps) {
  const [scanMode, setScanMode] = useState<"camera" | "manual">("camera");
  const [scannedText, setScannedText] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolvedItem, setResolvedItem] = useState<UniversalCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados de Hardware de Cámara y Diagnóstico
  const [videoDevices, setVideoDevices] = useState<VideoDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamResolution, setStreamResolution] = useState<{ width: number; height: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pitido sintetizado agradable al detectar código
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(920, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignorar si el navegador bloquea audio sin interacción previa
    }
  }, []);

  const handleResolveCode = useCallback(async (codeString: string) => {
    const clean = codeString.trim();
    if (!clean) return;

    try {
      setResolving(true);
      setErrorMessage(null);
      playBeep();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(100);
      }
      const res = await UniversalCodesApi.resolve(clean);
      setResolvedItem(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Código no registrado o no válido.";
      setErrorMessage(msg);
      setResolvedItem(null);
    } finally {
      setResolving(false);
    }
  }, [playBeep]);

  // Detener flujo de cámara
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setTorchOn(false);
    setStreamResolution(null);
  }, []);

  // Iniciar flujo de cámara con fallback robusto
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Tu navegador no soporta captura de video por cámara.");
      setScanMode("manual");
      return;
    }

    try {
      // 1. Obtener lista de dispositivos de video disponibles
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setVideoDevices(
          videoInputs.map((d, index) => ({
            deviceId: d.deviceId,
            label: d.label || `Cámara ${index + 1}`,
          }))
        );
      } catch {
        // Fallback silencioso en enumeración
      }

      // 2. Construir restricciones adaptativas
      let stream: MediaStream | null = null;
      try {
        // Primer intento: dispositivo seleccionado o facingMode
        const primaryConstraints: MediaStreamConstraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId } }
            : { facingMode: { ideal: facingMode } },
          audio: false,
        };
        stream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
      } catch {
        // Fallback universal: cualquier cámara disponible sin restricciones estrictas
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (!stream) {
        throw new Error("No se pudo obtener el flujo de video.");
      }

      streamRef.current = stream;

      // 3. Conectar a elemento <video> con muting directo a nivel DOM para cumplir Autoplay Policy
      if (videoRef.current) {
        const videoEl = videoRef.current;
        videoEl.srcObject = stream;
        videoEl.muted = true;
        videoEl.defaultMuted = true;
        videoEl.playsInline = true;
        videoEl.setAttribute("playsinline", "true");
        videoEl.setAttribute("webkit-playsinline", "true");

        // Reproducir de manera segura una vez cargados los metadatos
        videoEl.onloadedmetadata = () => {
          videoEl
            .play()
            .then(() => {
              setIsStreaming(true);
              if (videoEl.videoWidth && videoEl.videoHeight) {
                setStreamResolution({ width: videoEl.videoWidth, height: videoEl.videoHeight });
              }
            })
            .catch((err) => {
              console.warn("Autoplay bloqueado:", err);
            });
        };
      }

      // 4. Evaluar capacidades de linterna / flash (torch)
      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities ? (track.getCapabilities() as { torch?: boolean }) : {};
      setHasTorch(Boolean(capabilities?.torch));

      // 5. Loop de escaneo óptico mediante BarcodeDetector nativo
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({
          formats: ["qr_code", "code_128", "ean_13", "code_39"],
        });

        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2 || resolving || resolvedItem) {
            return;
          }

          try {
            const detectedBarcodes = await detector.detect(videoRef.current);
            if (detectedBarcodes && detectedBarcodes.length > 0) {
              const detected = detectedBarcodes[0].rawValue;
              if (detected) {
                stopCamera();
                setScannedText(detected);
                handleResolveCode(detected);
              }
            }
          } catch {
            // Ignorar excepciones momentáneas de cuadro de video
          }
        }, 180);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No fue posible acceder a la cámara.";
      setCameraError(msg);
    }
  }, [facingMode, handleResolveCode, resolving, resolvedItem, selectedDeviceId, stopCamera]);

  // Manejar apertura/cierre del diálogo
  useEffect(() => {
    if (open) {
      setResolvedItem(null);
      setErrorMessage(null);
      setScannedText("");
      if (scanMode === "camera") {
        startCamera();
      } else {
        setTimeout(() => inputRef.current?.focus(), 200);
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, scanMode, startCamera, stopCamera]);

  // Alternar linterna
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      const nextTorch = !torchOn;
      try {
        await track.applyConstraints({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          advanced: [{ torch: nextTorch } as any],
        });
        setTorchOn(nextTorch);
      } catch {
        // Fallback silencioso
      }
    }
  };

  // Alternar cámara frontal/trasera
  const handleToggleFacingMode = () => {
    setSelectedDeviceId("");
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <QrScanIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Lector y Escáner Óptico de Códigos
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        {/* Selector de Modo: Cámara vs Pistola USB */}
        <Tabs
          value={scanMode}
          onChange={(_, val) => {
            setScanMode(val);
            if (val === "manual") {
              stopCamera();
            }
          }}
          variant="fullWidth"
          sx={{ mb: 2.5, minHeight: 40 }}
        >
          <Tab
            value="camera"
            icon={<CameraIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="Cámara en Vivo"
            sx={{ textTransform: "none", fontWeight: 700, minHeight: 40 }}
          />
          <Tab
            value="manual"
            icon={<BarcodeIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="Pistola Láser USB / Teclado"
            sx={{ textTransform: "none", fontWeight: 700, minHeight: 40 }}
          />
        </Tabs>

        {/* 1. Modo Cámara en Vivo */}
        {scanMode === "camera" && (
          <Box>
            {cameraError ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {cameraError} — Puedes alternar al modo <b>Pistola Láser USB / Teclado</b> o seleccionar otro dispositivo de cámara abajo.
              </Alert>
            ) : null}

            {/* Contenedor del Visor Óptico */}
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: 290,
                bgcolor: "#000000",
                borderRadius: 3,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Elemento de Video HTML5 */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              {/* Visor Óptico con 4 Paneles Translúcidos (Sin interferir con aceleración de GPU) */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Cuadrante Superior */}
                <Box sx={{ flex: 1, bgcolor: "rgba(0, 0, 0, 0.52)" }} />

                <Box sx={{ display: "flex", height: 210 }}>
                  {/* Cuadrante Izquierdo */}
                  <Box sx={{ flex: 1, bgcolor: "rgba(0, 0, 0, 0.52)" }} />

                  {/* Recuadro de Enfoque Central */}
                  <Box
                    sx={{
                      width: 210,
                      height: 210,
                      position: "relative",
                      border: "2px solid #6366f1",
                      borderRadius: 2.5,
                      boxShadow: "0 0 16px rgba(99, 102, 241, 0.5)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Haz Láser Animado */}
                    <Box
                      sx={{
                        position: "absolute",
                        width: "100%",
                        height: "3px",
                        bgcolor: "#ef4444",
                        boxShadow: "0 0 10px #ef4444, 0 0 4px #ffffff",
                        animation: "laserScan 2.2s ease-in-out infinite alternate",
                        "@keyframes laserScan": {
                          "0%": { top: "5%" },
                          "100%": { top: "95%" },
                        },
                      }}
                    />
                  </Box>

                  {/* Cuadrante Derecho */}
                  <Box sx={{ flex: 1, bgcolor: "rgba(0, 0, 0, 0.52)" }} />
                </Box>

                {/* Cuadrante Inferior */}
                <Box sx={{ flex: 1, bgcolor: "rgba(0, 0, 0, 0.52)" }} />
              </Box>

              {/* Indicador de Estado Superior */}
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  position: "absolute",
                  top: 12,
                  bgcolor: "rgba(0, 0, 0, 0.7)",
                  backdropFilter: "blur(4px)",
                  color: "#ffffff",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1.5,
                }}
              >
                {isStreaming ? (
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#4ade80" }}>
                    ● Cámara Activa {streamResolution ? `(${streamResolution.width}x${streamResolution.height})` : ""}
                  </Typography>
                ) : (
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#facc15" }}>
                    ● Conectando sensor óptico...
                  </Typography>
                )}
              </Stack>

              {/* Controles Flotantes de Cámara */}
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  bgcolor: "rgba(0, 0, 0, 0.65)",
                  backdropFilter: "blur(4px)",
                  borderRadius: 2,
                  p: 0.5,
                }}
              >
                {hasTorch && (
                  <Tooltip title={torchOn ? "Apagar Linterna" : "Encender Linterna"}>
                    <IconButton size="small" onClick={handleToggleTorch} sx={{ color: "#ffffff" }}>
                      {torchOn ? <FlashOffIcon fontSize="small" /> : <FlashOnIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Alternar Cámara Frontal / Trasera">
                  <IconButton size="small" onClick={handleToggleFacingMode} sx={{ color: "#ffffff" }}>
                    <SwitchCameraIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {/* Selector de Dispositivos de Cámara (si hay más de 1 en el sistema) */}
            {videoDevices.length > 1 && (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
                <VideoIcon fontSize="small" color="action" />
                <FormControl size="small" fullWidth>
                  <InputLabel id="select-camera-label">Dispositivo de Video Activo</InputLabel>
                  <Select
                    labelId="select-camera-label"
                    label="Dispositivo de Video Activo"
                    value={selectedDeviceId || (videoDevices[0]?.deviceId ?? "")}
                    onChange={(e) => {
                      setSelectedDeviceId(e.target.value);
                      setTimeout(() => startCamera(), 100);
                    }}
                  >
                    {videoDevices.map((dev) => (
                      <MenuItem key={dev.deviceId} value={dev.deviceId}>
                        {dev.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            )}
          </Box>
        )}

        {/* 2. Modo Pistola Láser USB / Entrada Manual */}
        {scanMode === "manual" && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Conecta una pistola lectora USB o escribe el código canónico. El escáner detectará el código automáticamente al disparar.
            </Typography>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleResolveCode(scannedText);
              }}
            >
              <TextField
                inputRef={inputRef}
                fullWidth
                autoFocus
                size="medium"
                placeholder="Esperando lectura de pistola USB o teclado..."
                value={scannedText}
                onChange={(e) => setScannedText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BarcodeIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: resolving ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Button
                      type="submit"
                      variant="contained"
                      size="small"
                      disabled={!scannedText.trim()}
                      sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 700 }}
                    >
                      Resolver
                    </Button>
                  ),
                }}
              />
            </form>
          </Box>
        )}

        {errorMessage && (
          <Alert severity="warning" sx={{ mt: 2 }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        {/* Ficha Resuelta del Código Escaneado */}
        {resolvedItem && (
          <Paper
            elevation={0}
            sx={{
              mt: 2.5,
              p: 2.5,
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: "primary.light",
              bgcolor: "primary.50",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Chip
                label={resolvedItem.code}
                color="primary"
                size="small"
                sx={{ fontFamily: "monospace", fontWeight: 800 }}
              />
              <Chip
                label={resolvedItem.status === "ACTIVE" ? "Operativo" : "Inactivo"}
                color={resolvedItem.status === "ACTIVE" ? "success" : "default"}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Stack>

            <Typography variant="h6" sx={{ fontWeight: 800, mt: 1 }}>
              {resolvedItem.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Finalidad: <b>{resolvedItem.purpose}</b> {resolvedItem.department ? `• Área: ${resolvedItem.department}` : ""}
            </Typography>

            {resolvedItem.metadata && Object.keys(resolvedItem.metadata).length > 0 && (
              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "#ffffff", borderRadius: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                  Datos Operativos Registrados:
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                  {JSON.stringify(resolvedItem.metadata, null, 2)}
                </Typography>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              startIcon={<OpenIcon />}
              onClick={() => {
                onSelectCode(resolvedItem);
                onClose();
              }}
              sx={{ mt: 2, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              Ver en Catálogo Maestro y Editar
            </Button>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 700 }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
