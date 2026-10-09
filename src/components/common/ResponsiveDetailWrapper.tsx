"use client";

import React from "react";
import {
  Dialog,
  Drawer,
  Box,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  Slide,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { Close as CloseIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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
      <Dialog
        fullScreen
        open={open}
        onClose={onClose}
        TransitionComponent={Transition}
        PaperProps={{
          sx: { bgcolor: "background.paper" },
        }}
      >
        <AppBar
          position="sticky"
          elevation={1}
          sx={{
            bgcolor: "background.paper",
            color: "text.primary",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Toolbar sx={{ px: 2 }}>
            <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close" sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, flex: 1 }}>
              {title}
            </Typography>
          </Toolbar>
        </AppBar>
        <Box
          sx={{
            p: 3,
            flex: 1,
            overflowY: "auto",
            pb: actions ? 10 : 3, // padding bottom if actions exist to prevent overlap
          }}
        >
          {children}
        </Box>
        {actions && (
          <Box
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              bgcolor: "background.paper",
              borderTop: "1px solid",
              borderColor: "divider",
              zIndex: 1100,
            }}
          >
            {actions}
          </Box>
        )}
      </Dialog>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { md: "40%", lg: "30%" },
          display: "flex",
          flexDirection: "column",
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
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
            p: 2,
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
