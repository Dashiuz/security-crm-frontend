"use client";

import { createTheme, alpha } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

export const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

export const jetBrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

/**
 * Paleta Oficial Noxia: "Deep Violet Tactical Enterprise"
 * Específica para operaciones de seguridad privada, control perimetral y centros de mando.
 */
export const noxiaPalette = {
  primary: {
    main: "#7C3AED", // Violet 600 - Acción principal, marca y estado activo
    light: "#A78BFA", // Violet 400 - Focus rings y acentos
    dark: "#5B21B6", // Violet 800 - Hover de botones y alto contraste
    soft: "#F5F3FF", // Violet 50 - Fondos de selección, chips activos y tabs
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#1E1B4B", // Indigo 950 - Barra de mando, Navbar y cabeceras
    light: "#312E81", // Indigo 900 - Sidenav secundario
    dark: "#0F172A", // Slate 900 - Textos principales y fondos oscuros
    contrastText: "#FFFFFF",
  },
  error: {
    main: "#E11D48", // Rose 600 - Alerta de pánico, crítico, emergencia
    light: "#FDA4AF", // Rose 300
    dark: "#BE123C", // Rose 700
    soft: "#FFF1F2", // Rose 50
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#D97706", // Amber 600 - Novedad operativa, prioridad 4, advertencia
    light: "#FCD34D", // Amber 300
    dark: "#B45309", // Amber 700
    soft: "#FFFBEB", // Amber 50
    contrastText: "#FFFFFF",
  },
  info: {
    main: "#4F46E5", // Indigo 600 - Informativo, minutas rutinarias, mensajes
    light: "#A5B4FC", // Indigo 300
    dark: "#3730A3", // Indigo 700
    soft: "#EEF2FF", // Indigo 50
    contrastText: "#FFFFFF",
  },
  success: {
    main: "#059669", // Emerald 600 - Verificado, guardia en turno, acceso concedido
    light: "#6EE7B7", // Emerald 300
    dark: "#047857", // Emerald 700
    soft: "#ECFDF5", // Emerald 50
    contrastText: "#FFFFFF",
  },
  neutral: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
  background: {
    default: "#F8FAFC", // Slate 50 - Fondo frío y descansado para uso prolongado
    paper: "#FFFFFF", // Superficie de tarjetas y tablas
  },
  text: {
    primary: "#0F172A", // Slate 900
    secondary: "#64748B", // Slate 500
    disabled: "#94A3B8",
  },
  divider: "#E2E8F0", // Hairline border de 1px
};

/**
 * Tema Material UI Estandarizado de Noxia CRM
 */
export const noxiaTheme = createTheme({
  palette: {
    primary: noxiaPalette.primary,
    secondary: noxiaPalette.secondary,
    error: noxiaPalette.error,
    warning: noxiaPalette.warning,
    info: noxiaPalette.info,
    success: noxiaPalette.success,
    background: noxiaPalette.background,
    text: noxiaPalette.text,
    divider: noxiaPalette.divider,
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: `${plusJakartaSans.style.fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    h1: { fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.025em" },
    h2: { fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.015em" },
    h4: { fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em" },
    h5: { fontSize: "1.125rem", fontWeight: 600 },
    h6: { fontSize: "1rem", fontWeight: 600 },
    subtitle1: { fontSize: "0.9375rem", fontWeight: 600, lineHeight: 1.5 },
    subtitle2: { fontSize: "0.875rem", fontWeight: 500, lineHeight: 1.45 },
    body1: { fontSize: "0.9375rem", lineHeight: 1.5 },
    body2: { fontSize: "0.875rem", lineHeight: 1.45 },
    caption: { fontSize: "0.75rem", lineHeight: 1.35, color: noxiaPalette.text.secondary },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: noxiaPalette.background.default,
          color: noxiaPalette.text.primary,
          fontFamily: `${plusJakartaSans.style.fontFamily}, sans-serif`,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        ".noxia-mono": {
          fontFamily: `${jetBrainsMono.style.fontFamily}, monospace !important`,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.01em",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          padding: "8px 16px",
          transition: "all 0.15s ease-in-out",
        },
        containedPrimary: {
          backgroundColor: noxiaPalette.primary.main,
          color: "#FFFFFF",
          "&:hover": {
            backgroundColor: noxiaPalette.primary.dark,
            boxShadow: `0 4px 12px ${alpha(noxiaPalette.primary.main, 0.28)}`,
          },
        },
        outlinedPrimary: {
          borderColor: alpha(noxiaPalette.primary.main, 0.35),
          color: noxiaPalette.primary.dark,
          "&:hover": {
            borderColor: noxiaPalette.primary.main,
            backgroundColor: noxiaPalette.primary.soft,
          },
        },
        sizeSmall: {
          padding: "5px 10px",
          fontSize: "0.8125rem",
        },
        sizeLarge: {
          padding: "10px 20px",
          fontSize: "1rem",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${noxiaPalette.divider}`,
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.08)",
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
          "&:hover": {
            boxShadow: `0 4px 12px ${alpha(noxiaPalette.primary.main, 0.06)}, 0 1px 3px rgba(15, 23, 42, 0.05)`,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          border: `1px solid ${noxiaPalette.divider}`,
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: noxiaPalette.secondary.main,
          color: "#FFFFFF",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.18)",
          borderBottom: `1px solid ${alpha("#FFFFFF", 0.08)}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#FFFFFF",
          borderRight: `1px solid ${noxiaPalette.divider}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
        },
        sizeSmall: {
          height: 22,
          fontSize: "0.75rem",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          "&.MuiInputLabel-shrink": {
            backgroundColor: noxiaPalette.background.paper,
            padding: "0 6px",
            borderRadius: 4,
            zIndex: 2,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "#FFFFFF",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: noxiaPalette.primary.light,
          },
          "&.Mui-focused": {
            boxShadow: `0 0 0 3px ${alpha(noxiaPalette.primary.main, 0.18)}`,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: noxiaPalette.primary.main,
              borderWidth: 1.5,
            },
          },
        },
        input: {
          padding: "10px 14px",
          fontSize: "0.9375rem",
        },
        inputSizeSmall: {
          padding: "8px 12px",
          fontSize: "0.875rem",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: "3px 3px 0 0",
          backgroundColor: noxiaPalette.primary.main,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.9rem",
          minHeight: 44,
          padding: "8px 16px",
          color: noxiaPalette.text.secondary,
          "&.Mui-selected": {
            color: noxiaPalette.primary.dark,
            fontWeight: 700,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 10px 10px -5px rgba(15, 23, 42, 0.04)",
          border: `1px solid ${noxiaPalette.divider}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: noxiaPalette.secondary.dark,
          color: "#FFFFFF",
          fontSize: "0.75rem",
          borderRadius: 6,
          padding: "6px 10px",
          fontWeight: 500,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        },
        arrow: {
          color: noxiaPalette.secondary.dark,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: noxiaPalette.neutral[50],
          color: noxiaPalette.text.secondary,
          borderBottom: `1px solid ${noxiaPalette.divider}`,
          fontSize: "0.8125rem",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
        },
        body: {
          fontSize: "0.875rem",
          borderBottom: `1px solid ${noxiaPalette.divider}`,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: "none",
          "& .MuiDataGrid-columnHeaders": {
            borderBottom: "1.5px solid #CBD5E1",
            backgroundColor: noxiaPalette.neutral[50],
            color: noxiaPalette.text.secondary,
            fontSize: "0.78rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: `1px solid ${noxiaPalette.divider}`,
            fontSize: "0.82rem",
            color: noxiaPalette.text.primary,
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(124, 58, 237, 0.035)",
          },
        },
      },
    },
  },
});

export default noxiaTheme;
