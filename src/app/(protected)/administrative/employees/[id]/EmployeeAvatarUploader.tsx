"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Tooltip,
  Divider,
  useTheme,
} from "@mui/material";
import {
  CameraAltRounded as CameraIcon,
  UploadFileRounded as UploadIcon,
  CameraswitchRounded as SwitchCameraIcon,
  CloseRounded as CloseIcon,
  DeleteOutlineRounded as DeleteIcon,
  CheckRounded as CheckIcon,
  RefreshRounded as RefreshIcon,
  VisibilityRounded as VisibilityIcon,
  OpenInNewRounded as OpenInNewIcon,
} from "@mui/icons-material";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";

interface EmployeeAvatarUploaderProps {
  employeeId: string;
  fullName?: string;
  avatarUrl?: string | null;
  initials: string;
  size?: number;
  mediaAttachments?: Array<{ id: string; s3Key: string }>;
  onPhotoUpdated?: () => Promise<void> | void;
}

export default function EmployeeAvatarUploader({
  employeeId,
  fullName,
  avatarUrl,
  initials,
  size = 144,
  mediaAttachments,
  onPhotoUpdated,
}: EmployeeAvatarUploaderProps) {
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();

  // Menu anchor
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  // States
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // 1. File Upload
  const handleTriggerFileInput = () => {
    handleCloseMenu();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError("La imagen no debe superar los 10 MB.");
      return;
    }

    setUploading(true);
    try {
      await StorageApi.uploadMedia({
        file,
        entityType: MediaTypeCategory.EMPLOYEE,
        entityId: employeeId,
        subType: "avatar",
      });
      showSuccess("Foto de perfil actualizada exitosamente");
      if (onPhotoUpdated) await onPhotoUpdated();
    } catch (err: any) {
      showError(err.message || "Error al subir la imagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 2. Camera Handling
  const handleOpenLiveCamera = () => {
    handleCloseMenu();
    setCapturedImage(null);
    setCameraOpen(true);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startCamera = async (mode: "user" | "environment") => {
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      showError("No se pudo acceder a la cámara. Por favor autoriza los permisos en tu navegador.");
    }
  };

  useEffect(() => {
    if (cameraOpen && !capturedImage) {
      startCamera(facingMode);
    }
    return () => {
      stopCamera();
    };
  }, [cameraOpen, facingMode]);

  const handleCloseCamera = () => {
    stopCamera();
    setCameraOpen(false);
    setCapturedImage(null);
  };

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;
    const cropSize = Math.min(vWidth, vHeight);
    const startX = (vWidth - cropSize) / 2;
    const startY = (vHeight - cropSize) / 2;

    canvas.width = 400;
    canvas.height = 400;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (facingMode === "user") {
        // Mirror image for natural selfie feel
        ctx.translate(400, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, startX, startY, cropSize, cropSize, 0, 0, 400, 400);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const handleSaveCaptured = async () => {
    if (!capturedImage) return;
    setUploading(true);
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], `avatar-${employeeId}-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      await StorageApi.uploadMedia({
        file,
        entityType: MediaTypeCategory.EMPLOYEE,
        entityId: employeeId,
        subType: "avatar",
      });

      showSuccess("Foto de perfil actualizada exitosamente");
      handleCloseCamera();
      if (onPhotoUpdated) await onPhotoUpdated();
    } catch (err: any) {
      showError(err.message || "Error al guardar la foto tomada");
    } finally {
      setUploading(false);
    }
  };

  // 3. Remove Photo
  const handleRemovePhoto = async () => {
    handleCloseMenu();
    if (!mediaAttachments || mediaAttachments.length === 0) {
      showError("No hay una foto almacenada para eliminar");
      return;
    }

    setUploading(true);
    try {
      // Delete the first media attachment
      const target = mediaAttachments[0];
      await HttpClient.delete(`/storage/${target.id}`);
      showSuccess("Foto de perfil eliminada");
      if (onPhotoUpdated) await onPhotoUpdated();
    } catch (err: any) {
      showError(err.message || "Error al eliminar la foto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Large GitHub-style Avatar Container */}
      <Box
        sx={{
          position: "relative",
          display: "inline-block",
          borderRadius: "50%",
          cursor: "pointer",
          "&:hover .avatar-overlay": {
            opacity: 1,
          },
        }}
        onClick={handleOpenMenu}
      >
        <Avatar
          src={avatarUrl || undefined}
          alt={fullName || "Empleado"}
          sx={{
            width: size,
            height: size,
            bgcolor: "primary.main",
            fontSize: `${size * 0.38}px`,
            fontWeight: 700,
            border: "4px solid",
            borderColor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(0, 0, 0, 0.08)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 24px rgba(0, 0, 0, 0.4)"
                : "0 8px 24px rgba(0, 0, 0, 0.12)",
            transition: "all 0.2s ease-in-out",
          }}
        >
          {initials}
        </Avatar>

        {/* Loading Spinner Overlay */}
        {uploading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              bgcolor: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 3,
            }}
          >
            <CircularProgress size={32} color="inherit" sx={{ color: "#fff" }} />
          </Box>
        )}

        {/* Hover Camera Icon Overlay */}
        <Box
          className="avatar-overlay"
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            bgcolor: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            transition: "opacity 0.2s ease-in-out",
            zIndex: 2,
          }}
        >
          <CameraIcon sx={{ color: "#ffffff", fontSize: size * 0.32 }} />
        </Box>

        {/* Badge Action Button (Bottom Right) */}
        <Tooltip title="Opciones de foto de perfil">
          <IconButton
            size="small"
            onClick={handleOpenMenu}
            sx={{
              position: "absolute",
              bottom: 4,
              right: 4,
              bgcolor: "primary.main",
              color: "#ffffff",
              border: `3px solid ${theme.palette.background.paper}`,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
              p: 0.9,
              zIndex: 4,
              "&:hover": {
                bgcolor: "primary.dark",
                transform: "scale(1.08)",
              },
              transition: "all 0.2s ease-in-out",
            }}
          >
            <CameraIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: "center", vertical: "top" }}
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 2.5,
              minWidth: 220,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
              border: `1px solid ${theme.palette.divider}`,
            },
          },
        }}
      >
        {avatarUrl && (
          <MenuItem
            onClick={() => {
              handleCloseMenu();
              setPreviewOpen(true);
            }}
          >
            <ListItemIcon>
              <VisibilityIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Ver foto de perfil"
              secondary="Ampliar a tamaño original"
              primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: "0.72rem" }}
            />
          </MenuItem>
        )}
        {avatarUrl && <Divider sx={{ my: 0.5 }} />}

        <MenuItem onClick={handleTriggerFileInput}>
          <ListItemIcon>
            <UploadIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Subir archivo"
            secondary="Desde tu computador"
            primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }}
            secondaryTypographyProps={{ fontSize: "0.72rem" }}
          />
        </MenuItem>

        <MenuItem onClick={handleOpenLiveCamera}>
          <ListItemIcon>
            <CameraIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Tomar foto en vivo"
            secondary="Con la cámara web"
            primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }}
            secondaryTypographyProps={{ fontSize: "0.72rem" }}
          />
        </MenuItem>

        {avatarUrl && <Divider sx={{ my: 0.5 }} />}
        {avatarUrl && (
          <MenuItem onClick={handleRemovePhoto} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Eliminar foto"
              primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }}
            />
          </MenuItem>
        )}
      </Menu>

      {/* Hidden Canvas for capture processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Live Camera Dialog */}
      <Dialog
        open={cameraOpen}
        onClose={handleCloseCamera}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "background.paper",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Tomar Foto en Vivo
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Alinea el rostro del empleado dentro del encuadre
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCloseCamera}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {capturedImage ? (
            /* Snapshot Preview */
            <Box
              sx={{
                width: 280,
                height: 280,
                borderRadius: "50%",
                overflow: "hidden",
                border: "4px solid",
                borderColor: "primary.main",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                my: 1,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Foto capturada"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          ) : (
            /* Live Camera Stream with Viewfinder */
            <Box
              sx={{
                position: "relative",
                width: 280,
                height: 280,
                borderRadius: "50%",
                overflow: "hidden",
                bgcolor: "#000000",
                border: "4px solid",
                borderColor: "primary.main",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                my: 1,
              }}
            >
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: facingMode === "user" ? "scaleX(-1)" : "none",
                }}
              />
              <IconButton
                size="small"
                onClick={handleToggleFacingMode}
                title="Cambiar cámara"
                sx={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  bgcolor: "rgba(0,0,0,0.6)",
                  color: "#ffffff",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                }}
              >
                <SwitchCameraIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "space-between" }}>
          <Button onClick={handleCloseCamera} color="inherit" disabled={uploading}>
            Cancelar
          </Button>

          {capturedImage ? (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRetake}
                disabled={uploading}
              >
                Repetir
              </Button>
              <Button
                variant="contained"
                startIcon={
                  uploading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <CheckIcon />
                  )
                }
                onClick={handleSaveCaptured}
                disabled={uploading}
                sx={{ fontWeight: 700 }}
              >
                Guardar Foto
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              startIcon={<CameraIcon />}
              onClick={handleCapturePhoto}
              sx={{ fontWeight: 700, px: 3 }}
            >
              Capturar Foto
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Lightbox / Expanded Original Size Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "background.paper",
            p: 0,
            maxWidth: 680,
            width: "100%",
            boxShadow: "0 24px 64px rgba(0, 0, 0, 0.4)",
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(6px)",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Foto de Perfil
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {fullName || "Empleado"} • Tamaño original
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {avatarUrl && (
              <Tooltip title="Abrir en pestaña nueva">
                <IconButton
                  size="small"
                  onClick={() => window.open(avatarUrl, "_blank")}
                  sx={{ color: "text.secondary" }}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton size="small" onClick={() => setPreviewOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(0, 0, 0, 0.5)"
                : "rgba(0, 0, 0, 0.04)",
            minHeight: 280,
          }}
        >
          {avatarUrl ? (
            <Box
              component="img"
              src={avatarUrl}
              alt={fullName || "Foto de perfil"}
              sx={{
                maxWidth: "100%",
                maxHeight: "75vh",
                borderRadius: 2,
                objectFit: "contain",
                boxShadow: "0 12px 36px rgba(0, 0, 0, 0.25)",
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay imagen disponible.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

