"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Typography,
  Stack,
  IconButton,
  Paper,
  LinearProgress,
  Grid,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  CameraAlt as CameraIcon,
  Videocam as VideoIcon,
  DeleteOutline as DeleteIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Stop as StopIcon,
  Cameraswitch as SwitchCameraIcon,
  Close as CloseIcon,
  UploadFile as UploadFileIcon,
  PhotoCamera as PhotoCameraIcon,
} from "@mui/icons-material";

interface MultiMediaEvidencePickerProps {
  priority: number;
  photoFiles: File[];
  onPhotosChange: (files: File[]) => void;
  videoFile: File | null;
  onVideoChange: (file: File | null) => void;
  disabled?: boolean;
}

function PhotoThumbnail({
  file,
  index,
  onRemove,
}: {
  file: File;
  index: number;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "grey.100",
        height: 92,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {previewUrl && (
        <img
          src={previewUrl}
          alt={`Evidencia ${index + 1}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      <IconButton
        size="small"
        onClick={onRemove}
        sx={{
          position: "absolute",
          top: 4,
          right: 4,
          bgcolor: "rgba(0,0,0,0.6)",
          color: "white",
          "&:hover": { bgcolor: "error.main" },
          p: 0.5,
        }}
      >
        <DeleteIcon sx={{ fontSize: 15 }} />
      </IconButton>
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "rgba(0,0,0,0.55)",
          color: "white",
          px: 0.8,
          py: 0.2,
        }}
      >
        <Typography variant="caption" noWrap sx={{ fontSize: 10, display: "block" }}>
          Foto #{index + 1}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function MultiMediaEvidencePicker({
  priority,
  photoFiles,
  onPhotosChange,
  videoFile,
  onVideoChange,
  disabled = false,
}: MultiMediaEvidencePickerProps) {
  const maxPhotos = priority >= 4 ? 5 : 2;
  const isHighOrCritical = priority >= 4;

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Camera & Video recording states (Inline Viewfinder)
  const [cameraMode, setCameraMode] = useState<"idle" | "photo" | "video">("idle");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const [videoRecording, setVideoRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const videoPreviewUrl = useMemo(() => {
    return videoFile ? URL.createObjectURL(videoFile) : null;
  }, [videoFile]);

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  // Handle media error helper
  const handleMediaError = (err: any) => {
    let msg = "No se pudo acceder a la cámara del dispositivo.";
    if (err?.name === "NotReadableError") {
      msg = "La cámara está siendo utilizada por otra aplicación o pestaña.";
    } else if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
      msg = "Permiso denegado para acceder a la cámara en el navegador.";
    } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
      msg = "No se detectó ninguna cámara disponible en el equipo.";
    }
    setCameraError(msg);
    setCameraLoading(false);
  };

  // Start Hardware Camera Stream
  const startCameraStream = useCallback(
    async (mode: "photo" | "video", facing: "environment" | "user") => {
      setCameraLoading(true);
      setCameraError(null);

      // Stop existing stream tracks
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = null;
      }

      const wantAudio = mode === "video";
      let stream: MediaStream | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: wantAudio,
        });
      } catch (err1) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: wantAudio,
          });
        } catch (err2) {
          if (wantAudio) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
            } catch (err3) {
              handleMediaError(err3);
              return;
            }
          } else {
            handleMediaError(err2);
            return;
          }
        }
      }

      if (stream) {
        videoStreamRef.current = stream;
        if (videoElementRef.current) {
          videoElementRef.current.srcObject = stream;
          try {
            await videoElementRef.current.play();
          } catch {}
        }
        setCameraLoading(false);
      }
    },
    []
  );

  // Close Camera and release hardware
  const closeCamera = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
    setCameraMode("idle");
    setVideoRecording(false);
    setRecordingSeconds(0);
    setCameraError(null);
    setCameraLoading(false);
  }, []);

  // Sync camera startup when mode or facing changes
  useEffect(() => {
    if (cameraMode !== "idle") {
      startCameraStream(cameraMode, facingMode);
    } else {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
    }
  }, [cameraMode, facingMode, startCameraStream]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      closeCamera();
    };
  }, [closeCamera]);

  // Revert video / slice photos if priority drops below 4 (Baja / Normal / Muy baja)
  useEffect(() => {
    if (priority < 4) {
      if (cameraMode === "video") {
        closeCamera();
      }
      if (videoFile) {
        onVideoChange(null);
      }
      if (photoFiles.length > 2) {
        onPhotosChange(photoFiles.slice(0, 2));
      }
    }
  }, [priority, cameraMode, videoFile, photoFiles, closeCamera, onVideoChange, onPhotosChange]);

  const openCamera = (mode: "photo" | "video") => {
    if (disabled) return;
    setCameraMode(mode);
    setRecordingSeconds(0);
    setVideoRecording(false);
  };

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const switchCameraMode = (mode: "photo" | "video") => {
    if (videoRecording || cameraMode === mode) return;
    setCameraMode(mode);
  };

  // Live Photo Snapshot
  const handleCapturePhoto = () => {
    if (!videoElementRef.current) return;
    const video = videoElementRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `foto_evidencia_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const updated = [...photoFiles, file];
        onPhotosChange(updated);

        // Flash visual feedback
        setFlash(true);
        setTimeout(() => setFlash(false), 220);

        // If slots are full, auto close camera
        if (updated.length >= maxPhotos) {
          closeCamera();
        }
      },
      "image/jpeg",
      0.88
    );
  };

  // Video Recording Controls
  const stopVideoRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setVideoRecording(false);
  }, []);

  const startVideoRecording = () => {
    if (!videoStreamRef.current) return;
    recordedChunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

    const recorder = new MediaRecorder(videoStreamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      if (recordedChunksRef.current.length > 0) {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `clip_evidencia_${Date.now()}.${ext}`, { type: mimeType });
        onVideoChange(file);
      }
      closeCamera();
    };

    recorder.start(500);
    setVideoRecording(true);
    setRecordingSeconds(0);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 29) {
          stopVideoRecording();
          return 30;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Handle adding photos from file browser
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    const availableSlots = maxPhotos - photoFiles.length;
    const allowed = incoming.slice(0, availableSlots);

    onPhotosChange([...photoFiles, ...allowed]);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    const updated = photoFiles.filter((_, i) => i !== index);
    onPhotosChange(updated);
  };

  // Video file upload browse
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    onVideoChange(file);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleRemoveVideo = () => {
    onVideoChange(null);
  };

  return (
    <Box sx={{ width: "100%", mt: 1 }}>
      {/* Hidden file inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={handlePhotoSelect}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm"
        hidden
        onChange={handleVideoSelect}
      />

      {/* Section Header */}
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          mb: 1,
          display: "block",
        }}
      >
        Evidencias Fotográficas y Video
      </Typography>

      {/* VISOR EMBEBIDO INLINE (Sin Modales Flotantes) */}
      {cameraMode !== "idle" && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: 2.5,
            border: "1.5px solid",
            borderColor:
              cameraMode === "video" && videoRecording
                ? "error.main"
                : (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(59, 130, 246, 0.4)"
                      : "rgba(37, 99, 235, 0.35)",
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "#f8fafc",
            overflow: "hidden",
            transition: "all 0.25s ease",
          }}
        >
          {/* Header del Visor */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.2,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              {cameraMode === "photo" ? (
                <CameraIcon color="primary" sx={{ fontSize: 19 }} />
              ) : (
                <VideoIcon color="error" sx={{ fontSize: 19 }} />
              )}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.82rem" }}>
                {cameraMode === "photo"
                  ? `Cámara en Vivo — Foto (${photoFiles.length}/${maxPhotos})`
                  : "Cámara en Vivo — Clip de Video"}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.5} alignItems="center">
              {/* Cambiar entre modo Foto y modo Video si prioridad >= 4 */}
              {isHighOrCritical && (
                <ButtonGroup size="small" sx={{ mr: 0.5 }}>
                  <Button
                    variant={cameraMode === "photo" ? "contained" : "outlined"}
                    onClick={() => switchCameraMode("photo")}
                    disabled={videoRecording}
                    sx={{ textTransform: "none", fontSize: "0.7rem", py: 0.25, px: 0.9 }}
                  >
                    Foto
                  </Button>
                  <Button
                    variant={cameraMode === "video" ? "contained" : "outlined"}
                    color="error"
                    onClick={() => switchCameraMode("video")}
                    disabled={videoRecording}
                    sx={{ textTransform: "none", fontSize: "0.7rem", py: 0.25, px: 0.9 }}
                  >
                    Video 30s
                  </Button>
                </ButtonGroup>
              )}

              {/* Alternar cámara frontal / trasera */}
              <Tooltip title="Cambiar cámara">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleToggleFacingMode}
                    disabled={videoRecording}
                    sx={{ p: 0.5 }}
                  >
                    <SwitchCameraIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </span>
              </Tooltip>

              {/* Botón cerrar visor inline */}
              <Tooltip title="Cerrar cámara">
                <span>
                  <IconButton
                    size="small"
                    onClick={closeCamera}
                    disabled={videoRecording}
                    sx={{ p: 0.5 }}
                  >
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Box>

          {/* Viewfinder Video Container */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: { xs: 220, sm: 260 },
              bgcolor: "black",
              borderRadius: 2,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {cameraLoading && (
              <Box sx={{ position: "absolute", zIndex: 3, textAlign: "center", color: "white" }}>
                <CircularProgress color="inherit" size={30} />
                <Typography variant="caption" display="block" sx={{ mt: 0.8, opacity: 0.85 }}>
                  Iniciando cámara...
                </Typography>
              </Box>
            )}

            {cameraError ? (
              <Box sx={{ p: 2, textAlign: "center", color: "white", zIndex: 3, maxWidth: 360 }}>
                <Typography
                  variant="caption"
                  sx={{ color: "warning.light", display: "block", mb: 1.5, lineHeight: 1.3 }}
                >
                  {cameraError}
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    closeCamera();
                    if (cameraMode === "photo") photoInputRef.current?.click();
                    else videoInputRef.current?.click();
                  }}
                  sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: 1.5 }}
                >
                  Subir archivo desde el equipo
                </Button>
              </Box>
            ) : (
              <video
                ref={videoElementRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: facingMode === "user" ? "scaleX(-1)" : "none",
                }}
              />
            )}

            {/* Micro-flash blanco animado al capturar foto */}
            {flash && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  bgcolor: "white",
                  zIndex: 10,
                  animation: "flashAnim 0.22s ease-out",
                  "@keyframes flashAnim": {
                    "0%": { opacity: 0.9 },
                    "100%": { opacity: 0 },
                  },
                }}
              />
            )}

            {/* Badge de contador / temporizador en Video */}
            {cameraMode === "video" && (
              <Box
                sx={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  bgcolor: "rgba(0,0,0,0.65)",
                  color: "white",
                  px: 1.2,
                  py: 0.35,
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.8,
                  zIndex: 2,
                }}
              >
                {videoRecording && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "error.main",
                      animation: "pulseDot 1s infinite",
                      "@keyframes pulseDot": {
                        "0%": { opacity: 1 },
                        "50%": { opacity: 0.3 },
                        "100%": { opacity: 1 },
                      },
                    }}
                  />
                )}
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                  {recordingSeconds}s / 30s
                </Typography>
              </Box>
            )}

            {/* Barra de progreso de video */}
            {cameraMode === "video" && videoRecording && (
              <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={(recordingSeconds / 30) * 100}
                  color="error"
                  sx={{ height: 4 }}
                />
              </Box>
            )}
          </Box>

          {/* Action Footer del Visor */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pt: 1.2,
            }}
          >
            <Button
              size="small"
              onClick={closeCamera}
              disabled={videoRecording}
              sx={{ textTransform: "none", color: "text.secondary", fontSize: "0.78rem" }}
            >
              Finalizar / Salir
            </Button>

            {cameraMode === "photo" ? (
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<PhotoCameraIcon />}
                onClick={handleCapturePhoto}
                disabled={cameraLoading || Boolean(cameraError) || photoFiles.length >= maxPhotos}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 2.5,
                  fontSize: "0.8rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                Capturar Foto ({photoFiles.length}/{maxPhotos})
              </Button>
            ) : !videoRecording ? (
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<VideoIcon />}
                onClick={startVideoRecording}
                disabled={cameraLoading || Boolean(cameraError)}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 2.5,
                  fontSize: "0.8rem",
                }}
              >
                Iniciar Grabación
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<StopIcon />}
                onClick={stopVideoRecording}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 2.5,
                  fontSize: "0.8rem",
                }}
              >
                Finalizar y Guardar
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* Symmetrical Media Grid */}
      <Grid container spacing={1.5} alignItems="stretch">
        {photoFiles.map((file, idx) => (
          <Grid
            size={{ xs: 6, sm: isHighOrCritical ? 3 : 4, md: isHighOrCritical ? 2.4 : 3 }}
            key={idx}
          >
            <PhotoThumbnail
              file={file}
              index={idx}
              onRemove={() => handleRemovePhoto(idx)}
            />
          </Grid>
        ))}

        {/* Botón / Tarjeta Añadir Foto (Cámara en Vivo o Subir Archivo) */}
        {photoFiles.length < maxPhotos && (
          <Grid size={{ xs: 6, sm: isHighOrCritical ? 3 : 4, md: isHighOrCritical ? 2.4 : 3 }}>
            <Paper
              elevation={0}
              sx={{
                height: "100%",
                minHeight: 92,
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                bgcolor: "background.paper",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 1,
                gap: 0.4,
                transition: "all 0.2s ease",
                "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
              }}
            >
              <Stack direction="row" spacing={0.6}>
                <Tooltip title="Tomar Fotografía en Vivo">
                  <span>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => openCamera("photo")}
                      disabled={disabled}
                      sx={{
                        p: 0.6,
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                      }}
                    >
                      <CameraIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Subir desde Galería o Archivo">
                  <span>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={disabled}
                      sx={{
                        p: 0.6,
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                      }}
                    >
                      <AddPhotoIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  textAlign: "center",
                  fontSize: "0.72rem",
                  lineHeight: 1.15,
                }}
              >
                Añadir foto
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.65rem",
                  color: "text.secondary",
                  lineHeight: 1,
                }}
              >
                ({photoFiles.length}/{maxPhotos})
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* Slot de Video: Symmetrical con Añadir Foto (solo para prioridad >= 4) */}
        {isHighOrCritical &&
          (!videoFile ? (
            <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
              <Paper
                elevation={0}
                sx={{
                  height: "100%",
                  minHeight: 92,
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 1,
                  gap: 0.4,
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                }}
              >
                <Stack direction="row" spacing={0.6}>
                  <Tooltip title="Grabar con Cámara (30s)">
                    <span>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => openCamera("video")}
                        disabled={disabled}
                        sx={{
                          p: 0.6,
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                        }}
                      >
                        <VideoIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Subir Archivo de Video">
                    <span>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={disabled}
                        sx={{
                          p: 0.6,
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                        }}
                      >
                        <UploadFileIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    textAlign: "center",
                    fontSize: "0.72rem",
                    lineHeight: 1.15,
                  }}
                >
                  Añadir video opcional
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.65rem",
                    color: "text.secondary",
                    lineHeight: 1,
                  }}
                >
                  (Máx. 30s)
                </Typography>
              </Paper>
            </Grid>
          ) : (
            <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
              <Paper
                elevation={0}
                sx={{
                  position: "relative",
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "black",
                  height: "100%",
                  minHeight: 92,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {videoPreviewUrl && (
                  <video
                    src={videoPreviewUrl}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
                <IconButton
                  size="small"
                  onClick={handleRemoveVideo}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "white",
                    "&:hover": { bgcolor: "error.main" },
                    p: 0.5,
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 15 }} />
                </IconButton>
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: "rgba(0,0,0,0.65)",
                    color: "white",
                    px: 0.8,
                    py: 0.25,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600 }}>
                    Video 30s
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: 9, opacity: 0.85 }}>
                    {videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(1)}MB` : ""}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
      </Grid>
    </Box>
  );
}
