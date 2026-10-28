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
  Stack,
  Alert,
} from "@mui/material";
import {
  GppMaybeOutlined,
  WarningAmberOutlined,
  RestoreOutlined,
  CheckCircleOutline,
} from "@mui/icons-material";
import { noxiaPalette, jetBrainsMono } from "@/theme/noxiaTheme";

interface RegulatoryExemptionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirmExemption: () => void;
  onResetToLegalFloor: () => void;
  deviationTitle?: string;
  deviationDescription?: string;
  currentValueLabel?: string;
  legalFloorLabel?: string;
  isSubmitting?: boolean;
}

export default function RegulatoryExemptionDialog({
  open,
  onClose,
  onConfirmExemption,
  onResetToLegalFloor,
  deviationTitle = "Desviación del Piso Mínimo Regulatorio SVSP",
  deviationDescription = "La tarifa o parámetro comercial configurado se encuentra por debajo de los valores mínimos regulados por la Superintendencia de Vigilancia y Seguridad Privada.",
  currentValueLabel,
  legalFloorLabel,
  isSubmitting = false,
}: RegulatoryExemptionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          border: `1.5px solid ${noxiaPalette.warning.main}80`,
          boxShadow: "0 12px 36px rgba(245, 158, 11, 0.18)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2.5,
              bgcolor: `${noxiaPalette.warning.main}18`,
              color: noxiaPalette.warning.dark,
              display: "flex",
            }}
          >
            <GppMaybeOutlined />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main }}>
              Confirmación de Excepción Regulatoria SVSP
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              Régimen de Inspección, Vigilancia y Control de Tarifas Mínimas
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: 2 }}>
        <Alert
          severity="warning"
          icon={<WarningAmberOutlined fontSize="inherit" />}
          sx={{
            mb: 2.5,
            borderRadius: 2,
            bgcolor: `${noxiaPalette.warning.main}12`,
            color: noxiaPalette.warning.dark,
            border: `1px solid ${noxiaPalette.warning.main}40`,
            "& .MuiAlert-message": { fontSize: "0.85rem", fontWeight: 500 },
          }}
        >
          {deviationTitle}
        </Alert>

        <Typography variant="body2" sx={{ color: "text.primary", mb: 2, lineHeight: 1.6 }}>
          {deviationDescription}
        </Typography>

        {(currentValueLabel || legalFloorLabel) && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "rgba(0, 0, 0, 0.03)",
              border: "1px solid rgba(0, 0, 0, 0.07)",
              mb: 2,
            }}
          >
            <Stack direction="row" spacing={3} justifyContent="space-around">
              {legalFloorLabel && (
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontWeight: 600 }}>
                    Piso Legal Oficial
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      color: noxiaPalette.success.dark,
                      fontFamily: jetBrainsMono.style.fontFamily,
                    }}
                  >
                    {legalFloorLabel}
                  </Typography>
                </Box>
              )}

              {currentValueLabel && (
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontWeight: 600 }}>
                    Parámetro Solicitado
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      color: noxiaPalette.warning.dark,
                      fontFamily: jetBrainsMono.style.fontFamily,
                    }}
                  >
                    {currentValueLabel}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontStyle: "italic" }}>
          * Nota de Auditoría: La prestación de servicios de vigilancia por debajo de la tarifa legal puede acarrear investigaciones sancionatorias por parte de la SuperVigilancia (Art. 92 Decreto Ley 356/1994). Si aplica una excepción justificada (ej. licitación pública con régimen especial o estratos 1-3), confirme explícitamente.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<RestoreOutlined />}
          onClick={onResetToLegalFloor}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            color: "text.secondary",
          }}
        >
          Restablecer Piso Oficial
        </Button>

        <Button
          variant="contained"
          onClick={onConfirmExemption}
          disabled={isSubmitting}
          startIcon={<CheckCircleOutline />}
          sx={{
            bgcolor: noxiaPalette.warning.dark,
            "&:hover": { bgcolor: "#B45309" },
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            px: 2.5,
          }}
        >
          Entiendo el Marco Legal y Aplico Excepción
        </Button>
      </DialogActions>
    </Dialog>
  );
}
