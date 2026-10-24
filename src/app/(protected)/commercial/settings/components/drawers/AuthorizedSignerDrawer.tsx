"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Typography,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import { DrawOutlined, CloudUpload } from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import {
  AuthorizedSigner,
  SignerRoleScope,
  DocumentEngineApi,
} from "@/lib/api/commercial-settings";
import { useNotification } from "@/providers/NotificationProvider";

interface AuthorizedSignerDrawerProps {
  open: boolean;
  onClose: () => void;
  signer?: AuthorizedSigner | null;
  onSuccess: () => void;
}

export default function AuthorizedSignerDrawer({
  open,
  onClose,
  signer,
  onSuccess,
}: AuthorizedSignerDrawerProps) {
  const { showSuccess, showError } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    jobTitle: "",
    documentNumber: "",
    professionalCardNum: "",
    email: "",
    phone: "",
    roleScope: SignerRoleScope.LEGAL_REPRESENTATIVE,
    includeInCommercialProposal: true,
    priorityOrder: 1,
    signatureUrl: "",
  });

  useEffect(() => {
    if (signer) {
      setFormData({
        fullName: signer.fullName,
        jobTitle: signer.jobTitle,
        documentNumber: signer.documentNumber || "",
        professionalCardNum: signer.professionalCardNum || "",
        email: signer.email || "",
        phone: signer.phone || "",
        roleScope: signer.roleScope,
        includeInCommercialProposal: signer.includeInCommercialProposal,
        priorityOrder: signer.priorityOrder,
        signatureUrl: signer.signatureUrl || "",
      });
    } else {
      setFormData({
        fullName: "",
        jobTitle: "",
        documentNumber: "",
        professionalCardNum: "",
        email: "",
        phone: "",
        roleScope: SignerRoleScope.LEGAL_REPRESENTATIVE,
        includeInCommercialProposal: true,
        priorityOrder: 1,
        signatureUrl: "",
      });
    }
  }, [signer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (signer?.id) {
        await DocumentEngineApi.updateSigner(signer.id, formData);
        showSuccess("Firmante autorizado actualizado");
      } else {
        await DocumentEngineApi.createSigner(formData);
        showSuccess("Firmante autorizado registrado exitosamente");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err?.message || "Error al guardar el firmante");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={onClose}
      title={signer ? "Editar Firmante Autorizado" : "Registrar Firmante Autorizado"}
      headerIcon={<DrawOutlined />}
      isSubmitting={isSubmitting}
      submitButtonText={signer ? "Actualizar Firmante" : "Registrar Firmante"}
      formId="signer-form"
    >
      <form id="signer-form" onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
        <TextField
          fullWidth
          required
          size="small"
          label="Nombre Completo"
          value={formData.fullName}
          onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
          placeholder="Ej: Dr. Carlos Alberto Gómez"
        />

        <TextField
          fullWidth
          required
          size="small"
          label="Cargo Institucional"
          value={formData.jobTitle}
          onChange={(e) => setFormData((p) => ({ ...p, jobTitle: e.target.value }))}
          placeholder="Ej: Representante Legal / Director de Operaciones"
        />

        <TextField
          select
          fullWidth
          size="small"
          label="Alcance / Rol en la Empresa"
          value={formData.roleScope}
          onChange={(e) => setFormData((p) => ({ ...p, roleScope: e.target.value as SignerRoleScope }))}
        >
          <MenuItem value={SignerRoleScope.LEGAL_REPRESENTATIVE}>Representante Legal</MenuItem>
          <MenuItem value={SignerRoleScope.COMMERCIAL_DIRECTOR}>Director Comercial</MenuItem>
          <MenuItem value={SignerRoleScope.TECHNICAL_DIRECTOR}>Director Técnico</MenuItem>
          <MenuItem value={SignerRoleScope.OPERATIONS_MANAGER}>Gerente / Director de Operaciones</MenuItem>
          <MenuItem value={SignerRoleScope.CUSTOM_SIGNER}>Firmante Especial / Apoderado</MenuItem>
        </TextField>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            size="small"
            label="Cédula / Documento"
            value={formData.documentNumber}
            onChange={(e) => setFormData((p) => ({ ...p, documentNumber: e.target.value }))}
          />
          <TextField
            fullWidth
            size="small"
            label="Tarjeta Profesional / Matrícula"
            value={formData.professionalCardNum}
            onChange={(e) => setFormData((p) => ({ ...p, professionalCardNum: e.target.value }))}
            placeholder="Ej: TP-84920-C"
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            size="small"
            label="Correo Electrónico"
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
          />
          <TextField
            fullWidth
            size="small"
            label="Teléfono / Celular"
            value={formData.phone}
            onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
          />
        </Stack>

        <TextField
          fullWidth
          size="small"
          type="number"
          label="Orden Jerárquico de Aparición (1 = Primero)"
          value={formData.priorityOrder}
          onChange={(e) => setFormData((p) => ({ ...p, priorityOrder: parseInt(e.target.value, 10) || 1 }))}
        />

        <Box sx={{ p: 2, bgcolor: "neutral.50", borderRadius: 2, border: "1px dashed", borderColor: "divider" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary", display: "block", mb: 1 }}>
            Firma Manuscrita Digitalizada
          </Typography>
          <Alert severity="info" sx={{ fontSize: "0.75rem", mb: 1.5 }}>
            El motor del backend recortará automáticamente los bordes blancos con <strong>sharp.trim()</strong> y optimizará el canal alfa transparente para compresión estricta (&lt; 18 KB).
          </Alert>
          <TextField
            fullWidth
            size="small"
            label="URL de Imagen o DataURL de Firma"
            value={formData.signatureUrl}
            onChange={(e) => setFormData((p) => ({ ...p, signatureUrl: e.target.value }))}
            placeholder="data:image/png;base64,... o https://s3.amazonaws.com/..."
          />
          {formData.signatureUrl && (
            <Box sx={{ mt: 1.5, p: 1, bgcolor: "#ffffff", borderRadius: 1, textAlign: "center" }}>
              <Box component="img" src={formData.signatureUrl} alt="Vista previa de firma" sx={{ maxHeight: 60, objectFit: "contain" }} />
            </Box>
          )}
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={formData.includeInCommercialProposal}
              onChange={(e) => setFormData((p) => ({ ...p, includeInCommercialProposal: e.target.checked }))}
            />
          }
          label="Estampar por defecto en propuestas y cotizaciones comerciales"
        />
        </Stack>
      </form>
    </ResponsiveFormDrawer>
  );
}
