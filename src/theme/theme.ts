"use client";

import { createTheme } from "@mui/material/styles";
import { Inter } from "next/font/google";

const inter = Inter({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const theme = createTheme({
  typography: {
    fontFamily: inter.style.fontFamily,
    h1: { fontSize: "2rem", fontWeight: 600 },
    h2: { fontSize: "1.75rem", fontWeight: 600 },
    h3: { fontSize: "1.5rem", fontWeight: 600 },
    button: { textTransform: "none" },
  },
  palette: {
    primary: {
      main: "#1a237e", // Deep Indigo for enterprise feel
    },
    secondary: {
      main: "#455a64", // Blue Grey
    },
    background: {
      default: "#f8f9fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#263238",
      secondary: "#546e7a",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          color: "#263238",
          boxShadow: "none",
          borderBottom: "1px solid #e0e0e0",
        },
      },
    },
  },
});

export default theme;
