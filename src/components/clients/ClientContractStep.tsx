"use client";

import React, { useRef, useState } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  Box,
  Paper,
  Button,
  IconButton,
  FormControlLabel,
  Switch,
  InputAdornment,
  Link,
} from "@mui/material";
import {
  CloudUploadOutlined as CloudUploadIcon,
  CheckCircleRounded as CheckCircleIcon,
  DeleteOutlineRounded as DeleteIcon,
  CalendarMonth as CalendarMonthIcon,
  InsertDriveFileOutlined as FileIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import UserAutocomplete, { UserOption } from "@/components/common/UserAutocomplete";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { useNotification } from "@/providers/NotificationProvider";

export interface ContractFormData {
  contractNumber: string;
  contractStatus?: string;
  renewedContract: boolean;
  contractDate: string;
  lastContractDate: string;
  coordinatorInChargeId: string;
  commercialContactId: string;
  installedTech: boolean;
  weaponsAmount: number;
  securityStudy: string;
}

export interface ClientContractStepProps {
  clientId?: string;
  contractForm: ContractFormData;
  onChangeContractForm: (data: ContractFormData) => void;
  coordinatorUser: UserOption | null;
  onChangeCoordinatorUser: (user: UserOption | null) => void;
  commercialUser: UserOption | null;
  onChangeCommercialUser: (user: UserOption | null) => void;
  contractMediaFiles: Record<string, any>;
  onChangeContractMediaFiles: (files: Record<string, any>) => void;
  disabled?: boolean;
}

const CONTRACT_DOC_TYPES = [
  { key: "financialStatements", label: "Estados Financieros" },
  { key: "legalRepresentation", label: "Representación Jurídica" },
  { key: "serviceOrder", label: "Orden de Servicio" },
  { key: "contractDoc", label: "Documento de Contrato" },
  { key: "otroSi", label: "Otro Sí" },
  { key: "basc", label: "Certificación BASC" },
  { key: "insurancePolicy", label: "Pólizas de Seguro" },
  { key: "techContract", label: "Contratos de Tecnología" },
];

export default function ClientContractStep({
  clientId,
  contractForm,
  onChangeContractForm,
  coordinatorUser,
  onChangeCoordinatorUser,
  commercialUser,
  onChangeCommercialUser,
  contractMediaFiles,
  onChangeContractMediaFiles,
  disabled = false,
}: ClientContractStepProps) {
  const { showError, showSuccess } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTargetDocKeyRef = useRef<string | null>(null);
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);

  React.useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;
    const handleCancel = () => {
      activeTargetDocKeyRef.current = null;
      setUploadingDocKey(null);
    };
    input.addEventListener("cancel", handleCancel);
    return () => {
      input.removeEventListener("cancel", handleCancel);
    };
  }, []);

  const updateField = (field: keyof ContractFormData, val: any) => {
    onChangeContractForm({
      ...contractForm,
      [field]: val,
    });
  };

  const handleTriggerUpload = (docKey: string) => {
    activeTargetDocKeyRef.current = docKey;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const docKey = activeTargetDocKeyRef.current;
    if (!file || !docKey) {
      activeTargetDocKeyRef.current = null;
      return;
    }

    try {
      setUploadingDocKey(docKey);
      const res = await StorageApi.uploadMedia({
        file,
        entityType: MediaTypeCategory.DOCUMENT,
        entityId: clientId || "new",
        clientId: clientId || null,
        subType: `contract_${docKey}`,
      });

      onChangeContractMediaFiles({
        ...contractMediaFiles,
        [docKey]: {
          mediaId: res.id,
          fileName: res.fileName,
          url: res.presignedUrl || res.url,
          sizeBytes: res.sizeBytes,
        },
      });

      showSuccess(`Documento "${file.name}" cargado exitosamente.`);
    } catch (err: any) {
      showError(err.message || "Error al subir documento contractual.");
    } finally {
      setUploadingDocKey(null);
      activeTargetDocKeyRef.current = null;
    }
  };

  const handleRemoveDoc = (docKey: string) => {
    const copy = { ...contractMediaFiles };
    delete copy[docKey];
    onChangeContractMediaFiles(copy);
  };

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx"
        onChange={handleFileSelected}
      />

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
          📜 3. Información Contractual y Documentación
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Establezca los parámetros del contrato, personal a cargo y adjunte los soportes contractuales reales.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              required
              label="Número de Contrato"
              value={contractForm.contractNumber}
              onChange={(e) => updateField("contractNumber", e.target.value)}
              disabled={disabled}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={contractForm.renewedContract}
                  onChange={(e) => updateField("renewedContract", e.target.checked)}
                  disabled={disabled}
                />
              }
              label="Prórroga Automática"
              sx={{ mt: 0.5 }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Fecha Inicial del Contrato"
              InputLabelProps={{ shrink: true }}
              value={contractForm.contractDate}
              onChange={(e) => updateField("contractDate", e.target.value)}
              disabled={disabled}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Fecha Final del Contrato"
              InputLabelProps={{ shrink: true }}
              value={contractForm.lastContractDate}
              onChange={(e) => updateField("lastContractDate", e.target.value)}
              disabled={disabled}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <UserAutocomplete
              type="coordinators"
              label="Coordinador a Cargo"
              value={coordinatorUser}
              onChange={(u) => {
                onChangeCoordinatorUser(u);
                updateField("coordinatorInChargeId", u?.id || "");
              }}
              disabled={disabled}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <UserAutocomplete
              type="commercials"
              label="Contacto Comercial Asignado"
              value={commercialUser}
              onChange={(u) => {
                onChangeCommercialUser(u);
                updateField("commercialContactId", u?.id || "");
              }}
              disabled={disabled}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0 }}
              label="Cantidad de Armas Asignadas"
              value={contractForm.weaponsAmount}
              onChange={(e) => updateField("weaponsAmount", Number(e.target.value))}
              disabled={disabled}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={contractForm.installedTech}
                  onChange={(e) => updateField("installedTech", e.target.checked)}
                  disabled={disabled}
                />
              }
              label="Tecnología Instalada"
              sx={{ mt: 0.5 }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Estudio de Seguridad (Código / Ref)"
              value={contractForm.securityStudy}
              onChange={(e) => updateField("securityStudy", e.target.value)}
              disabled={disabled}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Adjuntos y Soportes Contractuales Reales (Punto 5) */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          📎 Adjuntos y Soportes Contractuales
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          Cargue los documentos de respaldo en PDF o imagen para el expediente digital del cliente.
        </Typography>

        <Grid container spacing={2}>
          {CONTRACT_DOC_TYPES.map((doc) => {
            const uploaded = contractMediaFiles[doc.key];
            const isUploading = uploadingDocKey === doc.key;

            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={doc.key}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    textAlign: "center",
                    bgcolor: uploaded ? "rgba(46, 125, 50, 0.04)" : "background.default",
                    borderColor: uploaded ? "success.main" : "divider",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                      <FileIcon color={uploaded ? "success" : "action"} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {doc.label}
                    </Typography>
                    {uploaded ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        display="block"
                        sx={{ mb: 1.5 }}
                        title={uploaded.fileName}
                      >
                        {uploaded.fileName}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 1.5 }}>
                        Pendiente de carga
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                    <Button
                      size="small"
                      variant={uploaded ? "contained" : "outlined"}
                      color={uploaded ? "success" : "primary"}
                      startIcon={uploaded ? <CheckCircleIcon /> : <CloudUploadIcon />}
                      onClick={() => handleTriggerUpload(doc.key)}
                      disabled={disabled || isUploading}
                      sx={{ fontSize: "0.78rem", textTransform: "none", borderRadius: 2 }}
                    >
                      {isUploading
                        ? "Subiendo Archivo..."
                        : uploaded
                        ? "Archivo Adjuntado (Cambiar)"
                        : "Adjuntar Archivo"}
                    </Button>
                    {uploaded && (
                      <>
                        {uploaded.url && (
                          <IconButton
                            size="small"
                            component={Link}
                            href={uploaded.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            color="primary"
                            title="Ver documento"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveDoc(doc.key)}
                          disabled={disabled}
                          title="Eliminar"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Box>
  );
}
