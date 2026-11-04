"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
  Paper,
  Chip,
  TextField,
  Collapse,
  useTheme,
  alpha,
} from "@mui/material";
import {
  CloudUploadRounded as UploadIcon,
  DeleteOutlineRounded as DeleteIcon,
  LinkRounded as LinkIcon,
  CheckCircleRounded as CheckIcon,
  ImageRounded as ImageIcon,
  OpenInNewRounded as OpenInNewIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";

interface TenantLogoUploaderProps {
  tenantId: string;
  value?: string | null;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export default function TenantLogoUploader({
  tenantId,
  value,
  onChange,
  disabled = false,
}: TenantLogoUploaderProps) {
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState(value || "");
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setManualUrlInput(value || "");
    setImageError(false);
  }, [value]);

  React.useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const handleFileProcess = useCallback(
    async (file: File) => {
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showError("Por favor selecciona un archivo de imagen válido (PNG, SVG, JPG, WebP).");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showError("La imagen excede el tamaño máximo permitido de 5 MB.");
        return;
      }

      // Generate instant local blob preview for immediate UI feedback
      const localBlob = URL.createObjectURL(file);
      setLocalPreview(localBlob);
      setImageError(false);

      setUploading(true);
      try {
        if (tenantId && tenantId !== "new") {
          const formData = new FormData();
          formData.append("file", file);
          const res = await HttpClient.upload<{ success: boolean; logoUrl: string }>(
            `/tenants/${tenantId}/logo`,
            formData
          );

          onChange(res.logoUrl);
          showSuccess("Logotipo subido y optimizado exitosamente.");
        } else {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            onChange(dataUrl);
            showSuccess("Logotipo cargado localmente.");
          };
          reader.readAsDataURL(file);
        }
      } catch (err: any) {
        showError(err?.message || "Error al subir el logotipo.");
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [tenantId, onChange, showError, showSuccess]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleRemove = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    setImageError(false);
    onChange("");
    setManualUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    showSuccess("Logotipo removido.");
  };

  const handleApplyManualUrl = () => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    setImageError(false);
    onChange(manualUrlInput.trim());
    showSuccess("URL de logotipo actualizada.");
  };

  const displaySrc = localPreview || value || "";
  const hasLogo = Boolean(displaySrc && displaySrc.trim().length > 0 && !imageError);

  // Checkerboard pattern for transparent logo preview
  const checkerboardStyle = {
    backgroundImage: `linear-gradient(45deg, ${alpha(theme.palette.grey[400], 0.25)} 25%, transparent 25%), 
      linear-gradient(-45deg, ${alpha(theme.palette.grey[400], 0.25)} 25%, transparent 25%), 
      linear-gradient(45deg, transparent 75%, ${alpha(theme.palette.grey[400], 0.25)} 75%), 
      linear-gradient(-45deg, transparent 75%, ${alpha(theme.palette.grey[400], 0.25)} 75%)`,
    backgroundSize: "14px 14px",
    backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0px",
    backgroundColor: theme.palette.mode === "dark" ? "#1e293b" : "#f8fafc",
  };

  return (
    <Box sx={{ width: "100%" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />

      {/* Elegant Horizontal Brand Asset Card */}
      <Paper
        variant="outlined"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 2.2,
          borderRadius: 2.5,
          border: isDragging ? "2px dashed" : "1px solid",
          borderColor: isDragging
            ? theme.palette.primary.main
            : theme.palette.divider,
          bgcolor: isDragging
            ? alpha(theme.palette.primary.main, 0.04)
            : "background.paper",
          transition: "all 0.2s ease-in-out",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {uploading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: alpha(theme.palette.background.paper, 0.88),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 3,
              gap: 1.5,
            }}
          >
            <CircularProgress size={22} />
            <Typography variant="body2" fontWeight={600}>
              Subiendo y optimizando logotipo...
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: { xs: "wrap", md: "nowrap" },
            gap: 2.5,
          }}
        >
          {/* Left: Thumbnail & Brand Identity Text */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              minWidth: 0,
              flex: 1,
            }}
          >
            {/* Square/Rect Preview Box */}
            <Tooltip title={hasLogo ? "Clic para ver en tamaño completo" : ""} arrow>
              <Box
                sx={{
                  width: 90,
                  height: 64,
                  borderRadius: 2,
                  border: `1px solid ${imageError ? theme.palette.error.main : theme.palette.divider}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  p: 0.8,
                  flexShrink: 0,
                  cursor: hasLogo ? "pointer" : "default",
                  position: "relative",
                  ...checkerboardStyle,
                }}
                onClick={() => {
                  if (hasLogo && displaySrc) {
                    window.open(displaySrc, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                {hasLogo ? (
                  <Box
                    component="img"
                    src={displaySrc}
                    alt="Logotipo Corporativo"
                    sx={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "scale(1.05)" },
                    }}
                    onError={() => {
                      setImageError(true);
                    }}
                  />
                ) : (
                  <Box sx={{ textAlign: "center", color: imageError ? "error.main" : "text.disabled" }}>
                    {imageError ? (
                      <>
                        <ImageIcon sx={{ fontSize: 24, opacity: 0.8 }} />
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            fontSize: "0.62rem",
                            fontWeight: 600,
                            lineHeight: 1,
                          }}
                        >
                          Error imagen
                        </Typography>
                      </>
                    ) : (
                      <>
                        <ImageIcon sx={{ fontSize: 28, opacity: 0.5 }} />
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            fontSize: "0.62rem",
                            fontWeight: 600,
                            lineHeight: 1,
                          }}
                        >
                          Sin logo
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            </Tooltip>

            {/* Description Text */}
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Logotipo Corporativo
                </Typography>
                {hasLogo ? (
                  <Chip
                    icon={<CheckIcon sx={{ fontSize: "12px !important" }} />}
                    label="Configurado"
                    color="success"
                    size="small"
                    sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }}
                  />
                ) : (
                  <Chip
                    label="Opcional"
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, color: "text.secondary" }}
                  />
                )}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  lineHeight: 1.35,
                  maxWidth: { xs: "100%", md: 480 },
                }}
              >
                Visible en membretes, reportes PDF y barra lateral.
                Arrastre un archivo aquí o explore en su equipo (PNG, SVG, WebP, JPG máx. 5 MB).
              </Typography>
            </Box>
          </Box>

          {/* Right: Actions */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              flexShrink: 0,
              ml: { xs: 0, md: "auto" },
            }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 1.8,
                px: 2,
                py: 0.7,
              }}
            >
              {hasLogo ? "Cambiar Imagen" : "Subir Logotipo"}
            </Button>

            {hasLogo && (
              <Tooltip title="Ver logotipo en tamaño completo">
                <IconButton
                  color="primary"
                  size="small"
                  onClick={() => {
                    if (displaySrc) {
                      window.open(displaySrc, "_blank", "noopener,noreferrer");
                    }
                  }}
                  disabled={disabled || uploading}
                  sx={{
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                    borderRadius: 1.8,
                    p: 0.7,
                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                  }}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {hasLogo && (
              <Tooltip title="Eliminar logotipo">
                <IconButton
                  color="error"
                  size="small"
                  onClick={handleRemove}
                  disabled={disabled || uploading}
                  sx={{
                    border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
                    borderRadius: 1.8,
                    p: 0.7,
                    "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.08) },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Collapsible Manual URL */}
        <Box sx={{ mt: 1.2, pt: 1, borderTop: `1px dashed ${theme.palette.divider}` }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Button
              size="small"
              variant="text"
              startIcon={<LinkIcon sx={{ fontSize: "14px !important" }} />}
              onClick={() => setShowManualUrl((prev) => !prev)}
              sx={{
                textTransform: "none",
                fontSize: "0.72rem",
                color: "text.secondary",
                p: 0,
                minWidth: "auto",
                "&:hover": { color: "primary.main" },
              }}
            >
              {showManualUrl ? "Ocultar entrada de URL manual" : "O ingresar URL manual..."}
            </Button>

            {hasLogo && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: "0.7rem",
                  maxWidth: 300,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {value}
              </Typography>
            )}
          </Box>

          <Collapse in={showManualUrl}>
            <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="https://ejemplo.com/logotipo.png"
                value={manualUrlInput}
                onChange={(e) => setManualUrlInput(e.target.value)}
                disabled={disabled || uploading}
                sx={{ "& .MuiInputBase-input": { fontSize: "0.8rem", py: 0.7 } }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleApplyManualUrl}
                disabled={disabled || uploading || manualUrlInput.trim() === value}
                sx={{ textTransform: "none", whiteSpace: "nowrap", fontWeight: 600, px: 2 }}
              >
                Aplicar
              </Button>
            </Box>
          </Collapse>
        </Box>
      </Paper>
    </Box>
  );
}
