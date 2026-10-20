"use client";

import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

export interface ResponsiveDetailWrapperProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function ResponsiveDetailWrapper({
  open,
  onClose,
  title,
  children,
  actions,
}: ResponsiveDetailWrapperProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 50,
          "& .MuiDrawer-paper": {
            zIndex: (theme) => theme.zIndex.drawer + 50,
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
            boxShadow: "0 -8px 32px rgba(0,0,0,0.18)",
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
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
            {title}
          </Typography>
          <IconButton onClick={onClose} edge="end" size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Mobile Scrollable Body */}
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

        {/* Mobile Actions */}
        {actions && (
          <Box
            sx={{
              p: 2,
              bgcolor: "background.paper",
              borderTop: "1px solid",
              borderColor: "divider",
              pb: "calc(16px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            {actions}
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
        zIndex: (theme) => theme.zIndex.drawer + 50,
        "& .MuiDrawer-paper": {
          zIndex: (theme) => theme.zIndex.drawer + 50,
        },
      }}
      PaperProps={{
        sx: {
          width: { md: 540, lg: 600, xl: 640 },
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
        },
      }}
    >
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
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} edge="end" size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, flex: 1, overflowY: "auto" }}>
        {children}
      </Box>

      {actions && (
        <Box
          sx={{
            p: 2.5,
            bgcolor: "background.default",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          {actions}
        </Box>
      )}
    </Drawer>
  );
}
