"use client";

import React, { useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Close as CloseIcon,
  BuildOutlined as ToolboxIcon,
  PaletteOutlined as CanvaIcon,
  QrCode2Outlined as QrIcon,
  DescriptionOutlined as FormatsIcon,
  ReceiptLongOutlined as QuotesIcon,
  ShoppingCartOutlined as PoIcon,
  EventNoteOutlined as ScheduleIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
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

  // State for Instant QR Generator modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrText, setQrText] = useState("NOXIA-PUESTO-RONDA-01");
  const [copied, setCopied] = useState(false);

  const handleToolClick = (tool: GeneralToolItem) => {
    if (tool.id === "tool-canva") {
      router.push("/administrative/clients");
      onClose();
    } else if (tool.id === "tool-qr") {
      setQrModalOpen(true);
    } else {
      onSelectRoadmapTool(tool);
    }
  };

  const handleCopyQr = () => {
    navigator.clipboard.writeText(qrText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                Utilidades Transversales del Sistema
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
                        {tool.id === "tool-canva" && <CanvaIcon />}
                        {tool.id === "tool-qr" && <QrIcon />}
                        {tool.id === "tool-templates" && <FormatsIcon />}
                        {tool.id === "tool-quotations" && <QuotesIcon />}
                        {tool.id === "tool-purchase-orders" && <PoIcon />}
                        {tool.id === "tool-schedules" && <ScheduleIcon />}
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
            Noxia Toolbox • Utilidades compartidas para todas las direcciones
          </Typography>
        </Box>
      </Drawer>

      {/* Instant QR Code Generator Modal */}
      <Dialog
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <QrIcon color="primary" /> Generador de Código QR
          </Box>
          <IconButton size="small" onClick={() => setQrModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Genera un código QR identificador para puntos de ronda, carnés de empleados o inventario.
          </Typography>

          <TextField
            fullWidth
            size="small"
            label="Contenido o Código a Encriptar"
            value={qrText}
            onChange={(e) => setQrText(e.target.value)}
            sx={{ mb: 2.5 }}
          />

          {/* QR Visual Box using SVG/Canvas generator API */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 3,
              bgcolor: "neutral.50",
              borderRadius: 3,
              border: "1px dashed",
              borderColor: "primary.light",
            }}
          >
            {/* Direct Scalable Vector QR from standard API */}
            <Box
              component="img"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                qrText || "NOXIA",
              )}`}
              alt="Código QR Generado"
              sx={{
                width: 180,
                height: 180,
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                bgcolor: "#ffffff",
                p: 1,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                mt: 1.5,
                fontWeight: 600,
                fontFamily: "monospace",
                color: "text.secondary",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {qrText}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button
            startIcon={<CopyIcon />}
            variant="outlined"
            size="small"
            onClick={handleCopyQr}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            {copied ? "¡Copiado!" : "Copiar Texto"}
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => {
              window.open(
                `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                  qrText,
                )}`,
                "_blank",
              );
            }}
            startIcon={<DownloadIcon />}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Abrir / Descargar HD
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
