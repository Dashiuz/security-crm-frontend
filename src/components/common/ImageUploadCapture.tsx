"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Paper,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  CameraAlt as CameraIcon,
  UploadFile as UploadIcon,
  DeleteOutline as DeleteIcon,
  Cameraswitch as SwitchCameraIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  CloudUpload as CloudUploadIcon,
  PhotoCamera as PhotoCameraIcon,
} from "@mui/icons-material";
import { useNotification } from "@/providers/NotificationProvider";

export interface ImageUploadCaptureProps {
  label?: string;
  variant?: "avatar" | "evidence" | "compact";
  value?: File | string | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  aspectRatio?: string;
  previewUrl?: string | null;
  helperText?: string;
}

export default function ImageUploadCapture({
  label = "Evidencia Fotográfica",
  variant = "evidence",
  value,
  onChange,
  disabled = false,
  aspectRatio = "16/9",
  previewUrl: externalPreviewUrl,
  helperText,
}: ImageUploadCaptureProps) {
  const { showError, showSuccess } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // States
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);

  // Sync initial / external preview
  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setLocalPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof value === "string") {
      setLocalPreview(value);
    } else if (externalPreviewUrl) {
      setLocalPreview(externalPreviewUrl);
    } else {
      setLocalPreview(null);
    }
  }, [value, externalPreviewUrl]);

  // Safely stop stream and release hardware camera
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch {}
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Start Camera Stream with resilient fallback
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    setCameraLoading(true);
    setCameraError(null);

    // Stop any existing stream before starting a new one
    stopStream();

    let stream: MediaStream | null = null;

    try {
      // 1. First attempt: with requested facingMode and resolution
      const idealConstraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      stream = await navigator.mediaDevices.getUserMedia(idealConstraints);
    } catch (firstErr) {
      // 2. Fallback attempt: simple video constraints (useful for webcams on PC / virtual cameras)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (fallbackErr: any) {
        let message = "No se pudo acceder a la cámara.";
        if (fallbackErr.name === "NotReadableError") {
          message = "La cámara está en uso por otra aplicación o pestaña del navegador.";
        } else if (fallbackErr.name === "NotAllowedError" || fallbackErr.name === "PermissionDeniedError") {
          message = "Permiso de acceso a la cámara denegado en el navegador.";
        } else if (fallbackErr.name === "NotFoundError" || fallbackErr.name === "DevicesNotFoundError") {
          message = "No se detectó ningún dispositivo de cámara conectado.";
        }
        setCameraError(message);
        setCameraLoading(false);
        return;
      }
    }

    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {}
      }
      setCameraLoading(false);
    }
  }, [stopStream]);

  // Trigger camera startup whenever modal opens
  useEffect(() => {
    if (cameraModalOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
    }
  }, [cameraModalOpen, facingMode, startCamera, stopStream]);

  // Handle open camera
  const handleOpenCamera = () => {
    if (disabled) return;
    setCameraError(null);
    setCameraModalOpen(true);
  };

  // Switch between front/back camera
  const handleToggleCamera = () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
  };

  // Close Camera
  const handleCloseCamera = () => {
    stopStream();
    setCameraModalOpen(false);
  };

  // Capture Frame from Video
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to File
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const capturedFile = new File(
          [blob],
          `foto_${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );
        onChange(capturedFile);
        handleCloseCamera();
        showSuccess("Fotografía capturada correctamente");
      },
      "image/jpeg",
      0.85
    );
  };

  // Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        showError("El archivo excede el tamaño máximo permitido (15MB)");
        return;
      }
      onChange(file);
      showSuccess("Archivo seleccionado");
    }
  };

  // Remove current selection
  const handleRemove = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(null);
    setLocalPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 1. Variant: AVATAR (Circular, Profile photo for Employee)
  if (variant === "avatar") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, my: 1 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
          disabled={disabled}
        />
        <Box sx={{ position: "relative" }}>
          <Avatar
            src={localPreview || undefined}
            sx={{
              width: 100,
              height: 100,
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              border: "3px solid",
              borderColor: localPreview ? "primary.main" : "divider",
              bgcolor: "background.paper",
            }}
          >
            <PhotoCameraIcon sx={{ fontSize: 40, color: "text.secondary" }} />
          </Avatar>

          {localPreview && (
            <Tooltip title="Eliminar foto">
              <IconButton
                size="small"
                onClick={handleRemove}
                disabled={disabled}
                sx={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  bgcolor: "error.main",
                  color: "white",
                  "&:hover": { bgcolor: "error.dark" },
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CameraIcon />}
            onClick={handleOpenCamera}
            disabled={disabled}
            sx={{ textTransform: "none", fontSize: "0.8rem", borderRadius: 2 }}
          >
            Cámara
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            sx={{ textTransform: "none", fontSize: "0.8rem", borderRadius: 2 }}
          >
            Galería
          </Button>
        </Stack>
        {helperText && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {helperText}
          </Typography>
        )}

        {/* Camera Modal */}
        {renderCameraModal()}
      </Box>
    );
  }

  // 2. Variant: EVIDENCE (Card with preview for Minutas)
  return (
    <Box sx={{ my: 1.5 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
        disabled={disabled}
      />

      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
        {label}
      </Typography>

      {localPreview ? (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "primary.main",
            bgcolor: "action.hover",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              component="img"
              src={localPreview}
              alt="Preview"
              sx={{
                width: 68,
                height: 52,
                objectFit: "cover",
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "divider",
                cursor: "pointer",
              }}
              onClick={() => setZoomModalOpen(true)}
            />
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleIcon color="success" sx={{ fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {value instanceof File ? value.name : "Fotografía cargada"}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {value instanceof File
                  ? `${(value.size / 1024).toFixed(1)} KB`
                  : "Archivo listo"}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Ver imagen completa">
              <IconButton size="small" color="primary" onClick={() => setZoomModalOpen(true)}>
                <VisibilityIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar / Cambiar">
              <IconButton size="small" color="error" onClick={handleRemove} disabled={disabled}>
                <DeleteIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            border: "1.5px dashed",
            borderColor: "divider",
            bgcolor: "background.default",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            textAlign: "center",
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 36, color: "text.secondary" }} />
          <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 360 }}>
            {helperText || "Toma una fotografía en vivo desde la cámara o adjunta una imagen desde tu dispositivo."}
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<CameraIcon />}
              onClick={handleOpenCamera}
              disabled={disabled}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                minHeight: 40,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              Tomar Foto en Vivo
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                minHeight: 40,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              Subir Archivo
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Modal Zoom Preview */}
      <Dialog open={zoomModalOpen} onClose={() => setZoomModalOpen(false)} maxWidth="md">
        <DialogContent sx={{ p: 1, bgcolor: "black", textAlign: "center" }}>
          {localPreview && (
            <Box
              component="img"
              src={localPreview}
              alt="Zoom Preview"
              sx={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: "background.paper", px: 2, py: 1 }}>
          <Button onClick={() => setZoomModalOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Camera Live Modal */}
      {renderCameraModal()}
    </Box>
  );

  function renderCameraModal() {
    return (
      <Dialog
        open={cameraModalOpen}
        onClose={handleCloseCamera}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: "background.paper", overflow: "hidden" } }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CameraIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Capturar Fotografía
            </Typography>
          </Stack>
          <Tooltip title="Cambiar Cámara (Frontal / Trasera)">
            <IconButton onClick={handleToggleCamera} size="small" color="primary">
              <SwitchCameraIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: "black", position: "relative", minHeight: 320, display: "flex", justifyContent: "center", alignItems: "center" }}>
          {cameraLoading && (
            <Box sx={{ position: "absolute", zIndex: 2, textAlign: "center", color: "white" }}>
              <CircularProgress color="inherit" size={36} />
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Iniciando cámara...
              </Typography>
            </Box>
          )}

          {cameraError ? (
            <Box sx={{ p: 3, textAlign: "center", width: "100%" }}>
              <Alert severity="warning" sx={{ mb: 2, textAlign: "left" }}>
                {cameraError}
              </Alert>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => {
                  handleCloseCamera();
                  fileInputRef.current?.click();
                }}
                sx={{ textTransform: "none" }}
              >
                Seleccionar archivo desde el equipo
              </Button>
            </Box>
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "65vh",
                objectFit: "cover",
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />
          )}

          {/* Grid overlay for framing */}
          {!cameraError && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: "none",
                border: "2px dashed rgba(255,255,255,0.25)",
                margin: 3,
                borderRadius: 2,
              }}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "space-between", bgcolor: "background.paper" }}>
          <Button onClick={handleCloseCamera} color="inherit">
            Cancelar
          </Button>

          {!cameraError && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<PhotoCameraIcon />}
              onClick={handleCapturePhoto}
              disabled={cameraLoading}
              sx={{
                px: 4,
                py: 1,
                fontWeight: 700,
                borderRadius: 3,
                boxShadow: "0 4px 14px rgba(25, 118, 210, 0.4)",
              }}
            >
              Capturar Foto
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  }
}
