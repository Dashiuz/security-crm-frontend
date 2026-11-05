"use client";

import React, { useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Card,
  CardActionArea,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Close as CloseIcon,
  BuildOutlined as ToolboxIcon,
  ViewWeekOutlined as BarcodeIcon,
  QrCode2Outlined as QrIcon,
  DynamicFormOutlined as FormsIcon,
  DescriptionOutlined as FormatsIcon,
  ReceiptLongOutlined as QuotesIcon,
  ShoppingCartOutlined as PoIcon,
  EventNoteOutlined as ScheduleIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { GENERAL_TOOLS, GeneralToolItem } from "@/config/navigationRegistry";

interface GeneralToolsDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelectRoadmapTool: (tool: GeneralToolItem) => void;
}

export default function GeneralToolsDrawer({
  open,
  onClose,
  onSelectRoadmapTool,
}: GeneralToolsDrawerProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleToolClick = (tool: GeneralToolItem) => {
    if (tool.id === "tool-barcodes") {
      router.push("/tools/codes?type=BARCODE_128");
      onClose();
    } else if (tool.id === "tool-qr") {
      router.push("/tools/codes?type=QR_CODE");
      onClose();
    } else if (tool.id === "tool-templates") {
      router.push("/tools/formats");
      onClose();
    } else if (tool.id === "tool-forms") {
      onSelectRoadmapTool(tool);
    } else {
      onSelectRoadmapTool(tool);
    }
  };

  const getToolIcon = (toolId: string) => {
    switch (toolId) {
      case "tool-barcodes":
        return <BarcodeIcon />;
      case "tool-qr":
        return <QrIcon />;
      case "tool-forms":
        return <FormsIcon />;
      case "tool-templates":
        return <FormatsIcon />;
      case "tool-quotations":
        return <QuotesIcon />;
      case "tool-purchase-orders":
        return <PoIcon />;
      case "tool-schedules":
        return <ScheduleIcon />;
      default:
        return <ToolboxIcon />;
    }
  };

  return (
    <>
      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={open}
        onClose={onClose}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 50,
        }}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : 440,
            maxHeight: isMobile ? "90vh" : "100vh",
            borderTopLeftRadius: isMobile ? 20 : 0,
            borderTopRightRadius: isMobile ? 20 : 0,
            p: 0,
            bgcolor: "background.paper",
            boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.25)",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "secondary.main",
            color: "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: "rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <ToolboxIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#ffffff" }}>
                Herramientas Generales
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.75)" }}>
                Loro Toolbox • Utilidades Transversales del Sistema
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: "#ffffff" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Content List */}
        <Box sx={{ p: 2, overflowY: "auto", flexGrow: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "text.secondary",
              display: "block",
              mb: 1.5,
            }}
          >
            Servicios y Generadores Disponibles:
          </Typography>

          <Stack spacing={1.5}>
            {GENERAL_TOOLS.map((tool) => {
              const isActive = tool.status === "ACTIVE";

              return (
                <Card
                  key={tool.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 2.5,
                    borderColor: isActive ? "primary.light" : "divider",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: "0 4px 12px rgba(124, 58, 237, 0.08)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <CardActionArea onClick={() => handleToolClick(tool)} sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: isActive ? "primary.soft" : "neutral.100",
                          color: isActive ? "primary.main" : "text.secondary",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          border: "1px solid",
                          borderColor: isActive ? "primary.light" : "divider",
                        }}
                      >
                        {getToolIcon(tool.id)}
                      </Box>

                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {tool.title}
                          </Typography>
                          <Chip
                            label={isActive ? "Activo" : "Planificado"}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              bgcolor: isActive ? "success.soft" : "neutral.100",
                              color: isActive ? "success.dark" : "text.secondary",
                              border: "1px solid",
                              borderColor: isActive ? "success.light" : "divider",
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: "0.82rem" }}>
                          {tool.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "neutral.50" }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Loro Toolbox • Utilidades compartidas para todas las direcciones
          </Typography>
        </Box>
      </Drawer>
    </>
  );
}
