"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Chip,
  Stack,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  CheckCircleOutline as CheckIcon,
  AccountTreeOutlined as DepIcon,
} from "@mui/icons-material";
import NavigationIcon from "./NavigationIcon";
import { NavigationSubItem, ErpDirection } from "@/config/navigationRegistry";

interface RoadmapFeatureDialogProps {
  open: boolean;
  onClose: () => void;
  item: NavigationSubItem | null;
  direction: ErpDirection | null;
}

export default function RoadmapFeatureDialog({
  open,
  onClose,
  item,
  direction,
}: RoadmapFeatureDialogProps) {
  if (!item) return null;

  const details = item.roadmapDetails;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: 1,
            boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.2)",
            border: "1px solid",
            borderColor: "divider",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          pb: 1,
          pt: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: "primary.soft",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid",
              borderColor: "primary.light",
            }}
          >
            <NavigationIcon name={item.iconName} fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {item.title}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              <Chip
                label={direction?.title || "ERP Noxia"}
                size="small"
                sx={{
                  bgcolor: "secondary.main",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.72rem",
                  height: 22,
                }}
              />
              <Chip
                icon={<ScheduleIcon sx={{ fontSize: "0.85rem !important", color: "inherit" }} />}
                label="En Planificación SDD"
                size="small"
                sx={{
                  bgcolor: "warning.soft",
                  color: "warning.dark",
                  fontWeight: 600,
                  fontSize: "0.72rem",
                  height: 22,
                  border: "1px solid",
                  borderColor: "warning.light",
                }}
              />
            </Stack>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ my: 1 }} />

      <DialogContent sx={{ py: 1.5 }}>
        <Typography variant="body1" sx={{ color: "text.primary", fontWeight: 500, mb: 2 }}>
          {details?.overview || item.description}
        </Typography>

        {details?.keyPoints && details.keyPoints.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: "text.secondary",
                display: "block",
                mb: 1,
              }}
            >
              Objetivos Clave de la Funcionalidad:
            </Typography>
            <Stack spacing={1}>
              {details.keyPoints.map((point, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.2,
                    bgcolor: "neutral.50",
                    p: 1.2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <CheckIcon sx={{ fontSize: "1.1rem", color: "primary.main", mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: "text.primary", lineHeight: 1.4 }}>
                    {point}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {details?.dependencies && details.dependencies.length > 0 && (
          <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px dashed", borderColor: "divider" }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: "text.secondary",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mb: 1,
              }}
            >
              <DepIcon sx={{ fontSize: "1rem" }} /> Dependencias del Sistema:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
              {details.dependencies.map((dep, index) => (
                <Chip
                  key={index}
                  label={dep}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    borderColor: "neutral.300",
                    bgcolor: "background.paper",
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        <Box
          sx={{
            mt: 2.5,
            p: 1.5,
            bgcolor: "primary.soft",
            borderRadius: 2,
            borderLeft: "3px solid",
            borderColor: "primary.main",
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            💡 <strong>Alineación Metodológica SDD</strong>: Esta vista forma parte del roadmap
            oficial de Noxia ERP. Se construirá con pruebas unitarias (&gt;= 80%) y modelos
            Prisma dedicados al iniciar su ciclo de desarrollo.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          sx={{
            borderRadius: 2,
            px: 3,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
}
