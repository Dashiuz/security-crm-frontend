"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Alert,
  Stack,
  InputAdornment,
} from "@mui/material";
import {
  WarningAmberRounded as WarningIcon,
  CheckCircleRounded as CheckCircleIcon,
  DeleteForeverRounded as DeleteIcon,
} from "@mui/icons-material";
import ResponsiveFormDrawer from "./ResponsiveFormDrawer";

export interface PromptConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  expectedValue: string;
  inputLabel: string;
  confirmButtonText?: string;
  confirmColor?: "error" | "warning" | "primary";
}

export default function PromptConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  expectedValue,
  inputLabel,
  confirmButtonText = "Confirmar Eliminación",
  confirmColor = "error",
}: PromptConfirmDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setInputValue("");
    }
  }, [open]);

  const isMatched = inputValue.trim() === (expectedValue || "").trim();

  const handleConfirm = async () => {
    if (!isMatched || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={title || "Confirmar Acción Crítica"}
      subtitle="Operación con impacto permanente en el sistema"
      headerIcon={
        confirmColor === "error" ? (
          <DeleteIcon color="error" />
        ) : (
          <WarningIcon color="warning" />
        )
      }
      isSubmitting={submitting}
      submitButtonText={confirmButtonText}
      submitButtonColor={confirmColor}
      formId="prompt-confirm-drawer-form"
      width={{ xs: "100%", md: 460 }}
    >
      <Box
        component="form"
        id="prompt-confirm-drawer-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirm();
        }}
        sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        <Alert
          severity={confirmColor === "error" ? "error" : "warning"}
          icon={<WarningIcon />}
          sx={{ fontSize: "0.85rem" }}
        >
          <strong>Atención:</strong> Esta acción es <strong>irreversible</strong>.
          Se procederá con la eliminación definitiva del registro y la
          desvinculación de sus dependencias asociadas.
        </Alert>

        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(239, 68, 68, 0.08)"
                : "rgba(239, 68, 68, 0.04)",
            border: "1px solid",
            borderColor: "rgba(239, 68, 68, 0.2)",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ fontWeight: 600, letterSpacing: "0.05em" }}
          >
            VALOR REQUERIDO PARA CONFIRMAR:
          </Typography>
          <Typography
            sx={{
              fontFamily: "monospace",
              fontWeight: 800,
              fontSize: "1.05rem",
              color: "error.main",
              mt: 0.5,
              wordBreak: "break-all",
            }}
          >
            {expectedValue || "N/A"}
          </Typography>
        </Box>

        <TextField
          autoFocus
          fullWidth
          size="small"
          label={inputLabel}
          placeholder={`Escribe exactamente: ${expectedValue}`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={submitting}
          required
          autoComplete="off"
          InputProps={{
            endAdornment: isMatched ? (
              <InputAdornment position="end">
                <CheckCircleIcon color="success" />
              </InputAdornment>
            ) : null,
          }}
          helperText={
            isMatched
              ? "Coincidencia exacta confirmada. Puedes proceder con la eliminación."
              : `Ingresa "${expectedValue}" para habilitar el botón de confirmación.`
          }
          FormHelperTextProps={{
            sx: {
              color: isMatched ? "success.main" : "text.secondary",
              fontWeight: isMatched ? 600 : 400,
            },
          }}
        />
      </Box>
    </ResponsiveFormDrawer>
  );
}

export { PromptConfirmDialog as PromptConfirmDrawer };
