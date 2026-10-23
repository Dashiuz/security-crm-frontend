"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Typography,
  Chip,
  Stack,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { NotesOutlined } from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import {
  DocumentTextSnippet,
  CommercialSettingsApi,
} from "@/lib/api/commercial-settings";
import { useNotification } from "@/providers/NotificationProvider";
import { noxiaPalette } from "@/theme/noxiaTheme";

interface SnippetEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  snippet?: DocumentTextSnippet | null;
  onSuccess: () => void;
}

const TEMPLATE_VARIABLES = [
  { label: "Nombre Cliente", token: "{{client_name}}" },
  { label: "NIT Cliente", token: "{{nit}}" },
  { label: "Representante Legal", token: "{{legal_rep}}" },
  { label: "Ciudad", token: "{{city}}" },
  { label: "Días Validez", token: "{{validity_days}}" },
  { label: "Monto Póliza Hurto", token: "{{policy_amount}}" },
];

export default function SnippetEditorDrawer({
  open,
  onClose,
  snippet,
  onSuccess,
}: SnippetEditorDrawerProps) {
  const { showSuccess, showError } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    key: "",
    title: "",
    category: "LETTERS",
    bodyTemplate: "",
    isDefault: false,
  });

  useEffect(() => {
    if (snippet) {
      setFormData({
        key: snippet.key,
        title: snippet.title,
        category: snippet.category,
        bodyTemplate: snippet.bodyTemplate,
        isDefault: snippet.isDefault,
      });
    } else {
      setFormData({
        key: "",
        title: "",
        category: "LETTERS",
        bodyTemplate: "",
        isDefault: false,
      });
    }
  }, [snippet, open]);

  const insertVariable = (token: string) => {
    setFormData((prev) => ({
      ...prev,
      bodyTemplate: prev.bodyTemplate + ` ${token} `,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (snippet?.id) {
        await CommercialSettingsApi.updateTextSnippet(snippet.id, formData);
        showSuccess("Plantilla de texto actualizada");
      } else {
        await CommercialSettingsApi.createTextSnippet(formData);
        showSuccess("Plantilla de texto creada exitosamente");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err?.message || "Error al guardar la plantilla");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={onClose}
      title={snippet ? "Editar Plantilla Dinámica" : "Nueva Cláusula / Plantilla"}
      subtitle="Texto estándar con etiquetas de reemplazo automatizado"
      headerIcon={<NotesOutlined />}
      width={{ xs: "100%", sm: 540 }}
      isSubmitting={isSubmitting}
      submitButtonText={snippet ? "Actualizar Plantilla" : "Crear Plantilla"}
      formId="snippet-form"
    >
      <Box component="form" id="snippet-form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5, py: 1 }}>
        <TextField
          fullWidth
          required
          size="small"
          label="Título de la Plantilla"
          value={formData.title}
          onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
          placeholder="Ej: Carta de Presentación Sector Comercial"
        />

        <TextField
          fullWidth
          required
          size="small"
          label="Clave Única (Código)"
          value={formData.key}
          onChange={(e) => setFormData((p) => ({ ...p, key: e.target.value.toUpperCase().replace(/\s+/g, "_") }))}
          placeholder="Ej: COVER_LETTER_COMMERCIAL"
          disabled={!!snippet}
        />

        <TextField
          fullWidth
          required
          size="small"
          label="Categoría"
          value={formData.category}
          onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
          placeholder="LETTERS, LEGAL_NOTES, WELFARE, SLA"
        />

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", display: "block", mb: 1 }}>
            Variables Disponibles (Clic para insertar en el texto):
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {TEMPLATE_VARIABLES.map((v) => (
              <Chip
                key={v.token}
                label={v.label}
                size="small"
                onClick={() => insertVariable(v.token)}
                sx={{
                  bgcolor: `${noxiaPalette.primary.main}10`,
                  color: noxiaPalette.primary.main,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: `${noxiaPalette.primary.main}25`,
                  },
                }}
              />
            ))}
          </Stack>
        </Box>

        <TextField
          fullWidth
          required
          multiline
          rows={8}
          size="small"
          label="Cuerpo del Texto (Plantilla)"
          value={formData.bodyTemplate}
          onChange={(e) => setFormData((p) => ({ ...p, bodyTemplate: e.target.value }))}
          placeholder="Estimados señores {{client_name}}, mediante la presente nos permitimos remitir la propuesta..."
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.isDefault}
              onChange={(e) => setFormData((p) => ({ ...p, isDefault: e.target.checked }))}
            />
          }
          label="Establecer como plantilla predeterminada de su categoría"
        />
      </Box>
    </ResponsiveFormDrawer>
  );
}
