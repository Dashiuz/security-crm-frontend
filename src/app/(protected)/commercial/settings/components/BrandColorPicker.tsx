"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Popover,
  Typography,
  Stack,
  Button,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  ColorizeOutlined,
  Check as CheckIcon,
  PaletteOutlined,
} from "@mui/icons-material";
import { HexColorPicker } from "react-colorful";
import { jetBrainsMono, noxiaPalette } from "@/theme/noxiaTheme";

interface BrandColorPickerProps {
  label: string;
  value: string;
  onChange: (colorHex: string) => void;
  helperText?: string;
  fullWidth?: boolean;
}

// Paletas cromáticas de referencia curadas para empresas de seguridad y blindaje
const CORPORATE_PRESETS = [
  { label: "Púrpura Noxia Profundo", hex: "#1E1B4B" },
  { label: "Púrpura Acento", hex: "#7C3AED" },
  { label: "Azul Marino Blindado", hex: "#0F172A" },
  { label: "Azul Pizarra", hex: "#1E293B" },
  { label: "Azul Institucional", hex: "#1E3A8A" },
  { label: "Azul Zafiro", hex: "#2563EB" },
  { label: "Violeta Cyber", hex: "#4C1D95" },
  { label: "Gris Acero Táctico", hex: "#334155" },
  { label: "Carbón Operativo", hex: "#18181B" },
  { label: "Verde Escuadrón", hex: "#064E3B" },
  { label: "Verde Esmeralda", hex: "#065F46" },
  { label: "Carmesí Alerta", hex: "#991B1B" },
  { label: "Borgoña Noble", hex: "#881337" },
  { label: "Dorado Ejecutivo", hex: "#92400E" },
  { label: "Ámbar Acento", hex: "#D97706" },
  { label: "Blanco Platino", hex: "#F8FAFC" },
];

export default function BrandColorPicker({
  label,
  value,
  onChange,
  helperText,
  fullWidth = true,
}: BrandColorPickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [hasEyeDropper, setHasEyeDropper] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      setHasEyeDropper(true);
    }
  }, []);

  const handleClickSwatch = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(value);
  const safePickerColor = isValidHex ? (value.length === 4 ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}` : value) : "#1E1B4B";

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (!val.startsWith("#") && val.length > 0) {
      val = `#${val}`;
    }
    const upper = val.toUpperCase();
    if (upper !== value?.toUpperCase()) {
      onChange(upper);
    }
  };

  const handlePickerChange = (newHex: string) => {
    const upper = newHex.toUpperCase();
    if (upper !== value?.toUpperCase()) {
      onChange(upper);
    }
  };

  const handleSelectPreset = (hex: string) => {
    if (hex.toUpperCase() !== value?.toUpperCase()) {
      onChange(hex.toUpperCase());
    }
  };

  // Cuentagotas nativo de pantalla (si el navegador lo soporta)
  const handleOpenEyeDropper = async () => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase();
          if (hex !== value?.toUpperCase()) {
            onChange(hex);
          }
        }
      } catch {
        // Cancelado por el usuario
      }
    }
  };

  return (
    <>
      <TextField
        fullWidth={fullWidth}
        size="small"
        label={label}
        value={value}
        onChange={handleTextChange}
        helperText={helperText}
        placeholder="#1E1B4B"
        inputProps={{
          maxLength: 7,
          style: {
            fontFamily: jetBrainsMono.style.fontFamily,
            fontWeight: 600,
            letterSpacing: "0.04em",
          },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <Tooltip title="Abrir paleta y selector de color" arrow>
                <Box
                  component="button"
                  type="button"
                  onClick={handleClickSwatch}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: isValidHex ? value : "#1E1B4B",
                    mr: 1,
                    border: "2px solid rgba(0,0,0,0.15)",
                    cursor: "pointer",
                    padding: 0,
                    outline: "none",
                    flexShrink: 0,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    "&:hover": {
                      transform: "scale(1.15)",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                    },
                  }}
                />
              </Tooltip>
            ),
          },
        }}
      />

      {/* Popover con HexColorPicker Visual Reactivo + Presets */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              width: 250,
              borderRadius: 3,
              boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
              border: "1px solid #E2E8F0",
            },
          },
        }}
      >
        <Stack spacing={1.5}>
          {/* Header del Popover */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PaletteOutlined fontSize="small" sx={{ color: noxiaPalette.primary.main }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
                Selector Cromático
              </Typography>
            </Stack>
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: 1,
                bgcolor: isValidHex ? value : "#1E1B4B",
                border: "1px solid #CBD5E1",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            />
          </Box>

          {/* Lienzo visual de react-colorful (Saturación + Matiz) */}
          <Box
            sx={{
              "& .react-colorful": {
                width: "100%",
                height: 150,
                borderRadius: 2,
              },
              "& .react-colorful__saturation": {
                borderRadius: "8px 8px 0 0",
              },
              "& .react-colorful__last-control": {
                borderRadius: "0 0 8px 8px",
              },
              "& .react-colorful__pointer": {
                width: 18,
                height: 18,
                boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
              },
            }}
          >
            <HexColorPicker
              color={safePickerColor}
              onChange={handlePickerChange}
            />
          </Box>

          {/* Fila con código HEX y Cuentagotas */}
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography
              variant="body2"
              sx={{
                fontFamily: jetBrainsMono.style.fontFamily,
                fontWeight: 700,
                color: "#1E293B",
                fontSize: "0.85rem",
              }}
            >
              {value || "#1E1B4B"}
            </Typography>

            {hasEyeDropper && (
              <Tooltip title="Cuentagotas: extraer color de cualquier parte de la pantalla" arrow>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ColorizeOutlined fontSize="small" />}
                  onClick={handleOpenEyeDropper}
                  sx={{
                    textTransform: "none",
                    borderRadius: 1.5,
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    py: 0.3,
                    px: 1,
                    minWidth: "auto",
                    color: "#334155",
                    borderColor: "#CBD5E1",
                    "&:hover": {
                      borderColor: noxiaPalette.primary.main,
                      bgcolor: "rgba(124, 58, 237, 0.04)",
                    },
                  }}
                >
                  Cuentagotas
                </Button>
              </Tooltip>
            )}
          </Stack>

          <Divider />

          {/* Presets Corporativos */}
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem", fontWeight: 600 }}>
            Paleta táctica institucional:
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)",
              gap: 0.75,
            }}
          >
            {CORPORATE_PRESETS.map((preset) => {
              const isSelected = value?.toUpperCase() === preset.hex.toUpperCase();
              return (
                <Tooltip key={preset.hex} title={`${preset.label} (${preset.hex})`} arrow placement="top">
                  <Box
                    component="button"
                    type="button"
                    onClick={() => handleSelectPreset(preset.hex)}
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "5px",
                      bgcolor: preset.hex,
                      border: isSelected ? "2px solid #7C3AED" : "1px solid rgba(0,0,0,0.15)",
                      cursor: "pointer",
                      p: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.12s ease",
                      "&:hover": {
                        transform: "scale(1.2)",
                        zIndex: 1,
                      },
                    }}
                  >
                    {isSelected && (
                      <CheckIcon
                        sx={{
                          fontSize: 12,
                          color: ["#F8FAFC", "#FFFFFF"].includes(preset.hex) ? "#0F172A" : "#FFFFFF",
                        }}
                      />
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Stack>
      </Popover>
    </>
  );
}
