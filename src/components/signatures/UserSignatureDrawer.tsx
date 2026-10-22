"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Slider,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  Card,
  CardActionArea,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import {
  DrawOutlined as DrawIcon,
  TextFieldsOutlined as TextIcon,
  UploadFileOutlined as UploadIcon,
  Undo as UndoIcon,
  DeleteOutline as ClearIcon,
  CheckCircle as CheckIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import SignaturePad from "signature_pad";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import {
  processSignatureImage,
  renderTextSignatureToDataUrl,
} from "@/utils/signatureThreshold";

export type SignatureCreationMode = "DRAW" | "TYPE" | "UPLOAD";

export interface UserSignatureDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (dataUrl: string, method: SignatureCreationMode) => Promise<void> | void;
  initialName?: string;
  title?: string;
}

export const CALLIGRAPHIC_FONTS = [
  {
    id: "Dancing Script",
    label: "Dancing Script (Formal Elegante)",
    fontFamily: "'Dancing Script', cursive, sans-serif",
    className: "font-dancing-script",
    fontSize: "2.3rem",
    preview: "Firma Elegante",
  },
  {
    id: "Caveat",
    label: "Caveat (Fluida y Moderna)",
    fontFamily: "'Caveat', cursive, sans-serif",
    className: "font-caveat",
    fontSize: "2.3rem",
    preview: "Firma Moderna",
  },
  {
    id: "Great Vibes",
    label: "Great Vibes (Clásica Notarial)",
    fontFamily: "'Great Vibes', cursive, sans-serif",
    className: "font-great-vibes",
    fontSize: "2.6rem",
    preview: "Firma Clásica",
  },
  {
    id: "Sacramento",
    label: "Sacramento (Sobria y Fina)",
    fontFamily: "'Sacramento', cursive, sans-serif",
    className: "font-sacramento",
    fontSize: "2.8rem",
    preview: "Firma Fina",
  },
];

export default function UserSignatureDrawer({
  open,
  onClose,
  onSave,
  initialName = "",
  title = "Configurar Mi Firma Digital",
}: UserSignatureDrawerProps) {
  const [tab, setTab] = useState<SignatureCreationMode>("DRAW");
  const [inkColor, setInkColor] = useState<string>("#1E3A8A"); // Azul notarial por defecto
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab 1: Draw (SignaturePad)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Tab 2: Type to sign
  const [typedName, setTypedName] = useState(initialName || "Firma Digital");
  const [selectedFont, setSelectedFont] = useState("Dancing Script");

  // Tab 3: Upload with Thresholding
  const [rawUploadedFile, setRawUploadedFile] = useState<File | null>(null);
  const [cleanUploadDataUrl, setCleanUploadDataUrl] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState<number>(75);
  const [processingUpload, setProcessingUpload] = useState(false);

  // Initialize and resize canvas for SignaturePad
  const initSignaturePad = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    if (sigPadRef.current) {
      sigPadRef.current.off();
    }

    const pad = new SignaturePad(canvas, {
      minWidth: 1.2,
      maxWidth: 3.5,
      penColor: inkColor,
      backgroundColor: "rgba(255, 255, 255, 0)",
    });

    pad.addEventListener("endStroke", () => {
      setHasDrawn(!pad.isEmpty());
    });

    sigPadRef.current = pad;
    setHasDrawn(!pad.isEmpty());
  }, [inkColor]);

  // Re-initialize pad when drawer opens or tab switches to DRAW
  useEffect(() => {
    if (open && tab === "DRAW") {
      const timer = setTimeout(() => {
        initSignaturePad();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open, tab, initSignaturePad]);

  // Update pen color dynamically
  useEffect(() => {
    if (sigPadRef.current) {
      sigPadRef.current.penColor = inkColor;
    }
  }, [inkColor]);

  // Clear Canvas
  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      setHasDrawn(false);
    }
  };

  // Undo stroke
  const handleUndo = () => {
    if (!sigPadRef.current) return;
    const data = sigPadRef.current.toData();
    if (data.length > 0) {
      data.pop();
      sigPadRef.current.fromData(data);
      setHasDrawn(!sigPadRef.current.isEmpty());
    }
  };

  // Handle file selection in Upload Tab
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRawUploadedFile(file);
    await applyThreshold(file, sensitivity);
  };

  // Apply thresholding when sensitivity changes
  const applyThreshold = async (file: File, sens: number) => {
    setProcessingUpload(true);
    setError(null);
    try {
      const cleanUrl = await processSignatureImage(file, {
        sensitivity: sens,
        targetInkColor: inkColor === "#1E3A8A" ? "blue" : null,
      });
      setCleanUploadDataUrl(cleanUrl);
    } catch {
      setError("No se pudo procesar la imagen seleccionada. Intente con otra foto.");
    } finally {
      setProcessingUpload(false);
    }
  };

  const handleSensitivityChange = (_: Event, val: number | number[]) => {
    const sens = val as number;
    setSensitivity(sens);
    if (rawUploadedFile) {
      applyThreshold(rawUploadedFile, sens);
    }
  };

  // Handle Save
  const handleSave = async () => {
    setError(null);
    let finalDataUrl = "";

    if (tab === "DRAW") {
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
        setError("Por favor dibuje su firma antes de guardar.");
        return;
      }
      finalDataUrl = sigPadRef.current.toDataURL("image/png");
    } else if (tab === "TYPE") {
      if (!typedName.trim()) {
        setError("Por favor escriba su nombre para generar la firma.");
        return;
      }
      finalDataUrl = await renderTextSignatureToDataUrl(typedName.trim(), selectedFont, inkColor);
    } else if (tab === "UPLOAD") {
      if (!cleanUploadDataUrl) {
        setError("Por favor seleccione una imagen de su firma.");
        return;
      }
      finalDataUrl = cleanUploadDataUrl;
    }

    if (!finalDataUrl) {
      setError("No se pudo generar la firma digital.");
      return;
    }

    try {
      setSaving(true);
      await onSave(finalDataUrl, tab);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Error al guardar la firma digital.");
    } finally {
      setSaving(false);
    }
  };

  // Drawer Footer Actions
  const customActions = (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        justifyContent: "flex-end",
        width: "100%",
        flexDirection: { xs: "column-reverse", sm: "row" },
      }}
    >
      <Button
        onClick={onClose}
        color="inherit"
        disabled={saving}
        sx={{
          textTransform: "none",
          width: { xs: "100%", sm: "auto" },
        }}
      >
        Cancelar
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={saving || (tab === "DRAW" && !hasDrawn) || (tab === "UPLOAD" && !cleanUploadDataUrl)}
        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
        sx={{
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 700,
          px: 3,
          width: { xs: "100%", sm: "auto" },
        }}
      >
        {saving ? "Guardando..." : "Guardar Firma Digital"}
      </Button>
    </Box>
  );

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={saving ? () => {} : onClose}
      title={title}
      subtitle="Firma digital oficial para aprobación de órdenes, contratos y minutas"
      headerIcon={<DrawIcon color="primary" sx={{ fontSize: 26 }} />}
      headerBadge={
        <Chip
          icon={<SecurityIcon sx={{ fontSize: "14px !important" }} />}
          label="Ley 527 / 1999"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: "0.72rem" }}
        />
      }
      width={{ xs: "100%", sm: 540, md: 580, lg: 620 }}
      customActions={customActions}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Mode Selector Tabs */}
      <Box
        sx={{
          mb: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "neutral.50",
          borderRadius: 2,
          p: 0.5,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{
            minHeight: 44,
            "& .MuiTab-root": {
              minHeight: 44,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              borderRadius: 1.5,
            },
          }}
        >
          <Tab icon={<DrawIcon fontSize="small" />} iconPosition="start" label="Dibujar" value="DRAW" />
          <Tab icon={<TextIcon fontSize="small" />} iconPosition="start" label="Escribir" value="TYPE" />
          <Tab icon={<UploadIcon fontSize="small" />} iconPosition="start" label="Subir Foto" value="UPLOAD" />
        </Tabs>
      </Box>

      {/* Color Picker Option for DRAW and TYPE */}
      {(tab === "DRAW" || tab === "TYPE") && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
            p: 1.5,
            bgcolor: "background.default",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
            COLOR DE TINTA OFICIAL:
          </Typography>
          <RadioGroup
            row
            value={inkColor}
            onChange={(e) => setInkColor(e.target.value)}
            sx={{ gap: 1 }}
          >
            <FormControlLabel
              value="#1E3A8A"
              control={<Radio size="small" sx={{ color: "#1E3A8A", "&.Mui-checked": { color: "#1E3A8A" } }} />}
              label={<Typography variant="caption" sx={{ fontWeight: 600 }}>Azul Notarial</Typography>}
            />
            <FormControlLabel
              value="#0F172A"
              control={<Radio size="small" sx={{ color: "#0F172A", "&.Mui-checked": { color: "#0F172A" } }} />}
              label={<Typography variant="caption" sx={{ fontWeight: 600 }}>Negro Profundo</Typography>}
            />
          </RadioGroup>
        </Box>
      )}

      {/* ============================================================== */}
      {/* TAB 1: DIBUJAR EN PANTALLA                                     */}
      {/* ============================================================== */}
      {tab === "DRAW" && (
        <Box>
          <Box
            sx={{
              width: "100%",
              height: 240,
              border: "2px dashed",
              borderColor: hasDrawn ? "primary.main" : "divider",
              borderRadius: 2.5,
              bgcolor: "#FFFFFF",
              position: "relative",
              touchAction: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.03)",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 8,
              }}
            />
            {!hasDrawn && (
              <Typography
                variant="body2"
                color="text.disabled"
                sx={{ position: "absolute", pointerEvents: "none", fontWeight: 500 }}
              >
                Firme aquí con el mouse, trackpad o pantalla táctil
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1} sx={{ mt: 1.5, justifyContent: "space-between" }}>
            <Button
              startIcon={<UndoIcon />}
              size="small"
              onClick={handleUndo}
              disabled={!hasDrawn}
              sx={{ textTransform: "none", fontWeight: 500 }}
            >
              Deshacer trazo
            </Button>
            <Button
              startIcon={<ClearIcon />}
              size="small"
              color="error"
              onClick={handleClear}
              disabled={!hasDrawn}
              sx={{ textTransform: "none", fontWeight: 500 }}
            >
              Limpiar lienzo
            </Button>
          </Stack>
        </Box>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ESCRIBIR TEXTO (TYPE TO SIGN)                           */}
      {/* ============================================================== */}
      {tab === "TYPE" && (
        <Box>
          <TextField
            fullWidth
            size="small"
            label="Escriba su nombre para generar su firma"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            sx={{ mb: 2.5 }}
          />

          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              display: "block",
              mb: 1.5,
              letterSpacing: 0.5,
            }}
          >
            SELECCIONE EL ESTILO CALIGRÁFICO:
          </Typography>

          <Stack spacing={1.5}>
            {CALLIGRAPHIC_FONTS.map((f) => {
              const isSelected = selectedFont === f.id;
              return (
                <Card
                  key={f.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 2.5,
                    borderColor: isSelected ? "primary.main" : "divider",
                    borderWidth: isSelected ? 2 : 1,
                    bgcolor: isSelected ? "primary.soft" : "background.paper",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: "primary.light",
                    },
                  }}
                >
                  <CardActionArea onClick={() => setSelectedFont(f.id)} sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ minWidth: 0, flex: 1, pr: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }} display="block">
                          {f.label}
                        </Typography>
                        <Typography
                          className={f.className}
                          sx={{
                            fontFamily: f.fontFamily,
                            fontSize: f.fontSize,
                            color: inkColor,
                            lineHeight: 1.25,
                            mt: 0.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {typedName.trim() || f.preview}
                        </Typography>
                      </Box>
                      {isSelected && (
                        <CheckIcon color="primary" sx={{ fontSize: 24, flexShrink: 0 }} />
                      )}
                    </Box>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* ============================================================== */}
      {/* TAB 3: SUBIR FOTO DE FIRMA (UMBRALIZACIÓN AUTOMÁTICA)          */}
      {/* ============================================================== */}
      {tab === "UPLOAD" && (
        <Box>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<UploadIcon />}
            sx={{
              borderRadius: 2.5,
              py: 2,
              textTransform: "none",
              mb: 2,
              fontWeight: 600,
              borderStyle: "dashed",
            }}
          >
            {rawUploadedFile ? "Cambiar foto de firma..." : "Subir foto de firma en papel blanco (PNG, JPG)"}
            <input type="file" accept="image/png, image/jpeg, image/webp" hidden onChange={handleFileChange} />
          </Button>

          {processingUpload && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} sx={{ mr: 1.5 }} />
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                Limpiando fondo blanco en tiempo real...
              </Typography>
            </Box>
          )}

          {cleanUploadDataUrl && !processingUpload && (
            <Box>
              <Box
                sx={{
                  width: "100%",
                  minHeight: 160,
                  p: 2.5,
                  borderRadius: 2.5,
                  border: "1px dashed",
                  borderColor: "primary.light",
                  bgcolor: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2.5,
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                <Box
                  component="img"
                  src={cleanUploadDataUrl}
                  alt="Firma procesada"
                  sx={{ maxHeight: 130, maxWidth: "100%", objectFit: "contain" }}
                />
              </Box>

              <Box
                sx={{
                  p: 2,
                  bgcolor: "background.default",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                  LIMPIEZA DE SOMBRAS / SENSIBILIDAD ({sensitivity}%):
                </Typography>
                <Slider
                  value={sensitivity}
                  onChange={handleSensitivityChange}
                  min={10}
                  max={95}
                  valueLabelDisplay="auto"
                  size="small"
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.75rem", mt: 0.5 }}>
                  Ajuste el control deslizante hacia la derecha si la foto tiene sombras o baja iluminación.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </ResponsiveFormDrawer>
  );
}
