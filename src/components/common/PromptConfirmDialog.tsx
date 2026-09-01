import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

interface PromptConfirmDialogProps {
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
  confirmButtonText = "Confirmar",
  confirmColor = "error",
}: PromptConfirmDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setInputValue("");
    }
  }, [open]);

  const handleConfirm = async () => {
    if (inputValue.trim() !== expectedValue.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const isMatched = inputValue.trim() === expectedValue.trim();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: "bold" }}>{title}</DialogTitle>
      <DialogContent dividers>
        <DialogContentText sx={{ mb: 2 }}>{description}</DialogContentText>
        <TextField
          autoFocus
          fullWidth
          label={inputLabel}
          placeholder={expectedValue}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={submitting}
          size="small"
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          color={confirmColor}
          variant="contained"
          disabled={!isMatched || submitting}
        >
          {submitting ? "Procesando..." : confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
