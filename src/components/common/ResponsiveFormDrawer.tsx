"use client";

import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Button,
  CircularProgress,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

export interface ResponsiveFormDrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  headerIcon?: React.ReactNode;
  headerBadge?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  customActions?: React.ReactNode;
  width?: number | string | { xs?: any; sm?: any; md?: any; lg?: any };
  isSubmitting?: boolean;
  submitButtonText?: string;
  submitButtonColor?: "primary" | "secondary" | "warning" | "error" | "info" | "success" | "inherit";
  formId?: string;
  zIndex?: number;
}

export default function ResponsiveFormDrawer({
  open,
  onClose,
  title,
  subtitle,
  headerIcon,
  headerBadge,
  children,
  actions,
  customActions,
  width,
  isSubmitting = false,
  submitButtonText,
  submitButtonColor = "primary",
  formId,
  zIndex,
}: ResponsiveFormDrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const actionContent = customActions || actions;
  const renderedActions = actionContent || (submitButtonText || formId ? (
    <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%", flexDirection: { xs: "column-reverse", sm: "row" } }}>
      <Button onClick={onClose} color="inherit" disabled={isSubmitting} sx={{ width: { xs: "100%", sm: "auto" } }}>
        Cancelar
      </Button>
      <Button
        type="submit"
        form={formId}
        variant="contained"
        color={submitButtonColor}
        disabled={isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
        sx={{ fontWeight: 600, minWidth: 120, width: { xs: "100%", sm: "auto" } }}
      >
        {isSubmitting ? "Guardando..." : submitButtonText || "Guardar"}
      </Button>
    </Box>
  ) : null);

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        sx={{
          zIndex: (theme) => zIndex || theme.zIndex.drawer + 50,
          "& .MuiDrawer-paper": {
            zIndex: (theme) => zIndex || theme.zIndex.drawer + 50,
          },
        }}
        PaperProps={{
          sx: {
            maxHeight: "92vh",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.2)",
          },
        }}
      >
        {/* Mobile Drag Indicator Handle */}
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center", pt: 1.5, pb: 0.5 }}>
          <Box
            sx={{
              width: 40,
              height: 5,
              borderRadius: 3,
              bgcolor: "divider",
            }}
          />
        </Box>

        {/* Mobile Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1, pr: 1 }}>
            {headerIcon}
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                noWrap
                sx={{ fontWeight: 700, fontSize: "1.05rem" }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {subtitle}
                </Typography>
              )}
            </Box>
            {headerBadge && <Box sx={{ ml: "auto" }}>{headerBadge}</Box>}
          </Box>
          <IconButton onClick={onClose} edge="end" size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Mobile Form Body */}
        <Box
          sx={{
            p: 2.5,
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </Box>

        {/* Mobile Actions Footer */}
        {renderedActions && (
          <Box
            sx={{
              p: 2,
              bgcolor: "background.paper",
              borderTop: "1px solid",
              borderColor: "divider",
              pb: "calc(16px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            {renderedActions}
          </Box>
        )}
      </Drawer>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: (theme) => zIndex || theme.zIndex.drawer + 50,
        "& .MuiDrawer-paper": {
          zIndex: (theme) => zIndex || theme.zIndex.drawer + 50,
        },
      }}
      PaperProps={{
        sx: {
          width: width || { md: 540, lg: 620, xl: 680 },
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
        },
      }}
    >
      {/* Desktop Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1, pr: 2 }}>
          {headerIcon}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.15rem" }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {headerBadge && <Box sx={{ ml: "auto" }}>{headerBadge}</Box>}
        </Box>
        <IconButton onClick={onClose} edge="end" size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Desktop Form Body */}
      <Box sx={{ p: 3, flex: 1, overflowY: "auto" }}>
        {children}
      </Box>

      {/* Desktop Actions Footer */}
      {renderedActions && (
        <Box
          sx={{
            p: 2.5,
            bgcolor: "background.default",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          {renderedActions}
        </Box>
      )}
    </Drawer>
  );
}
