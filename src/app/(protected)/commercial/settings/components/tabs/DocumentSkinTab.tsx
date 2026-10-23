"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Divider,
  Stack,
  Chip,
  IconButton,
  CircularProgress,
  Paper,
} from "@mui/material";
import {
  SaveOutlined,
  Add as AddIcon,
  EditOutlined,
  DeleteOutline,
} from "@mui/icons-material";
import {
  TenantDocumentSkin,
  DocumentTextSnippet,
  CommercialSettingsApi,
} from "@/lib/api/commercial-settings";
import SnippetEditorDrawer from "../drawers/SnippetEditorDrawer";
import BrandColorPicker from "../BrandColorPicker";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import { useNotification } from "@/providers/NotificationProvider";
import { noxiaPalette } from "@/theme/noxiaTheme";

interface DocumentSkinTabProps {
  documentSkin?: TenantDocumentSkin | null;
  snippets: DocumentTextSnippet[];
  onRefresh: () => void;
}

export default function DocumentSkinTab({
  documentSkin,
  snippets,
  onRefresh,
}: DocumentSkinTabProps) {
  const { showSuccess, showError } = useNotification();
  const [isSavingSkin, setIsSavingSkin] = useState(false);

  // Form State para Piel de Documento
  const [skinForm, setSkinForm] = useState({
    primaryBrandColorHex: documentSkin?.primaryBrandColorHex || "#1E1B4B",
    accentBrandColorHex: documentSkin?.accentBrandColorHex || "#7C3AED",
    companyLegalName: documentSkin?.companyLegalName || "NOXIA SEGURIDAD PRIVADA S.A.S.",
    companyNit: documentSkin?.companyNit || "900.000.000-1",
    commercialRegisterNum: documentSkin?.commercialRegisterNum || "0029384-01",
    supervigilanciaLicense: documentSkin?.supervigilanciaLicense || "RES-2024-SVSP-004921",
    minTicLicenseNum: documentSkin?.minTicLicenseNum || "TIC-00918-2023",
    uniformsResolutionNum: documentSkin?.uniformsResolutionNum || "RES-UNI-2023-11",
    overtimeResolutionNum: documentSkin?.overtimeResolutionNum || "RES-EXT-2023-45",
    sstImplementationPct: documentSkin?.sstImplementationPct ? Number(documentSkin.sstImplementationPct) : 99.5,
    hasIso9001Certified: documentSkin?.hasIso9001Certified ?? true,
    hasBascCertified: documentSkin?.hasBascCertified ?? true,
    hasPoliceSupportNetwork: documentSkin?.hasPoliceSupportNetwork ?? true,
    hasDijinEnterpriseFront: documentSkin?.hasDijinEnterpriseFront ?? true,
    commercialDirectorName: documentSkin?.commercialDirectorName || "",
    commercialDirectorEmail: documentSkin?.commercialDirectorEmail || "",
    commercialDirectorPhone: documentSkin?.commercialDirectorPhone || "",
    legalRepName: documentSkin?.legalRepName || "",
    legalRepEmail: documentSkin?.legalRepEmail || "",
    legalRepPhone: documentSkin?.legalRepPhone || "",
  });

  // State para Snippets
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<DocumentTextSnippet | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [snippetToDelete, setSnippetToDelete] = useState<DocumentTextSnippet | null>(null);

  const handleSaveSkin = async () => {
    try {
      setIsSavingSkin(true);
      await CommercialSettingsApi.updateDocumentSkin(skinForm);
      showSuccess("Piel de marca y resoluciones actualizadas exitosamente");
      onRefresh();
    } catch (err: any) {
      showError(err?.message || "Error al actualizar la piel del documento");
    } finally {
      setIsSavingSkin(false);
    }
  };

  const handleEditSnippet = (s: DocumentTextSnippet) => {
    setSelectedSnippet(s);
    setDrawerOpen(true);
  };

  const handleCreateSnippet = () => {
    setSelectedSnippet(null);
    setDrawerOpen(true);
  };

  const handleDeleteSnippetClick = (s: DocumentTextSnippet) => {
    setSnippetToDelete(s);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteSnippet = async () => {
    if (!snippetToDelete) return;
    try {
      await CommercialSettingsApi.deleteTextSnippet(snippetToDelete.id);
      showSuccess("Plantilla de texto eliminada");
      onRefresh();
    } catch (err: any) {
      showError(err?.message || "Error al eliminar la plantilla");
    } finally {
      setDeleteConfirmOpen(false);
      setSnippetToDelete(null);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* 1. Identidad Visual Camaleón y Vista Previa */}
      <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid rgba(0,0,0,0.08)", bgcolor: "#FFFFFF" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 1.5, sm: 2 },
            mb: 2.5,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: noxiaPalette.secondary.main }}>
              Identidad Visual Corporativa
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              Colores de marca que tiñen membretes, encabezados y firmas en propuestas PDF exportadas
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={isSavingSkin ? <CircularProgress size={14} color="inherit" /> : <SaveOutlined />}
            onClick={handleSaveSkin}
            disabled={isSavingSkin}
            sx={{
              bgcolor: noxiaPalette.primary.main,
              "&:hover": {
                bgcolor: noxiaPalette.primary.dark,
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.35)",
              },
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.82rem",
              px: 2.2,
              height: 36,
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(124, 58, 237, 0.2)",
            }}
          >
            Guardar Piel y Resoluciones
          </Button>
        </Box>

        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <BrandColorPicker
              label="Color Primario (Hex)"
              value={skinForm.primaryBrandColorHex}
              onChange={(hex) =>
                setSkinForm((p) => (p.primaryBrandColorHex === hex ? p : { ...p, primaryBrandColorHex: hex }))
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <BrandColorPicker
              label="Color Acento (Hex)"
              value={skinForm.accentBrandColorHex}
              onChange={(hex) =>
                setSkinForm((p) => (p.accentBrandColorHex === hex ? p : { ...p, accentBrandColorHex: hex }))
              }
            />
          </Grid>

          {/* Miniatura Previsualizador */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: skinForm.primaryBrandColorHex,
                color: "#FFFFFF",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderLeft: `6px solid ${skinForm.accentBrandColorHex}`,
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {skinForm.companyLegalName}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  NIT: {skinForm.companyNit} | SVSP: {skinForm.supervigilanciaLicense}
                </Typography>
              </Box>
              <Chip label="VISTA PREVIA" size="small" sx={{ bgcolor: skinForm.accentBrandColorHex, color: "#FFFFFF", fontWeight: 700 }} />
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        {/* Resoluciones Legales y Habilitaciones SVSP */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", display: "block", mb: 2 }}>
          Credenciales Legales y Resoluciones SuperVigilancia
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Razón Social Legal"
              value={skinForm.companyLegalName}
              onChange={(e) => setSkinForm((p) => ({ ...p, companyLegalName: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="NIT Empresa"
              value={skinForm.companyNit}
              onChange={(e) => setSkinForm((p) => ({ ...p, companyNit: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Registro Mercantil"
              value={skinForm.commercialRegisterNum}
              onChange={(e) => setSkinForm((p) => ({ ...p, commercialRegisterNum: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Licencia SuperVigilancia"
              value={skinForm.supervigilanciaLicense}
              onChange={(e) => setSkinForm((p) => ({ ...p, supervigilanciaLicense: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Licencia MinTIC"
              value={skinForm.minTicLicenseNum}
              onChange={(e) => setSkinForm((p) => ({ ...p, minTicLicenseNum: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Resolución Uniformes"
              value={skinForm.uniformsResolutionNum}
              onChange={(e) => setSkinForm((p) => ({ ...p, uniformsResolutionNum: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="% SG-SST Implementado"
              value={skinForm.sstImplementationPct}
              onChange={(e) => setSkinForm((p) => ({ ...p, sstImplementationPct: parseFloat(e.target.value) || 0 }))}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        {/* Certificaciones y Sellos */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", display: "block", mb: 1.5 }}>
          Sellos Institucionales para Propuestas
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={skinForm.hasIso9001Certified}
                  onChange={(e) => setSkinForm((p) => ({ ...p, hasIso9001Certified: e.target.checked }))}
                />
              }
              label="Certificado ISO 9001"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={skinForm.hasBascCertified}
                  onChange={(e) => setSkinForm((p) => ({ ...p, hasBascCertified: e.target.checked }))}
                />
              }
              label="Certificado BASC"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={skinForm.hasPoliceSupportNetwork}
                  onChange={(e) => setSkinForm((p) => ({ ...p, hasPoliceSupportNetwork: e.target.checked }))}
                />
              }
              label="Red de Apoyo Policía"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={skinForm.hasDijinEnterpriseFront}
                  onChange={(e) => setSkinForm((p) => ({ ...p, hasDijinEnterpriseFront: e.target.checked }))}
                />
              }
              label="Frente Empresarial DIJIN"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        {/* Firmantes Autorizados */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", display: "block", mb: 1.5 }}>
          Firmantes Oficiales de la Propuesta
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Director Comercial"
              value={skinForm.commercialDirectorName}
              onChange={(e) => setSkinForm((p) => ({ ...p, commercialDirectorName: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Email Director Comercial"
              value={skinForm.commercialDirectorEmail}
              onChange={(e) => setSkinForm((p) => ({ ...p, commercialDirectorEmail: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Teléfono Director Comercial"
              value={skinForm.commercialDirectorPhone}
              onChange={(e) => setSkinForm((p) => ({ ...p, commercialDirectorPhone: e.target.value }))}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Representante Legal / Gerente"
              value={skinForm.legalRepName}
              onChange={(e) => setSkinForm((p) => ({ ...p, legalRepName: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Email Representante Legal"
              value={skinForm.legalRepEmail}
              onChange={(e) => setSkinForm((p) => ({ ...p, legalRepEmail: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Teléfono Representante Legal"
              value={skinForm.legalRepPhone}
              onChange={(e) => setSkinForm((p) => ({ ...p, legalRepPhone: e.target.value }))}
            />
          </Grid>
        </Grid>
      </Card>

      {/* 2. Plantillas de Texto Dinámicas */}
      <Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 1.5, sm: 2 },
            mb: 2.5,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: noxiaPalette.secondary.main }}>
              Cláusulas y Plantillas Dinámicas ({snippets.length})
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              Cartas de presentación, notas aclaratorias de bienestar y párrafos estándar de propuesta
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleCreateSnippet}
            sx={{
              bgcolor: noxiaPalette.primary.main,
              "&:hover": {
                bgcolor: noxiaPalette.primary.dark,
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.35)",
              },
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.82rem",
              px: 2.2,
              height: 36,
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(124, 58, 237, 0.2)",
            }}
          >
            Nueva Plantilla
          </Button>
        </Box>

        <Grid container spacing={2}>
          {snippets.map((s) => (
            <Grid size={{ xs: 12, md: 6 }} key={s.id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: "1px solid rgba(0,0,0,0.08)",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: noxiaPalette.primary.light },
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={s.category} size="small" sx={{ fontSize: "0.65rem", fontWeight: 700 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                        {s.key}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => handleEditSnippet(s)}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteSnippetClick(s)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    {s.title}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      bgcolor: "rgba(0,0,0,0.02)",
                      p: 1.5,
                      borderRadius: 1.5,
                    }}
                  >
                    {s.bodyTemplate}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Drawer */}
      <SnippetEditorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        snippet={selectedSnippet}
        onSuccess={onRefresh}
      />

      {/* Confirmación Eliminación */}
      <PromptConfirmDialog
        open={deleteConfirmOpen}
        title="Eliminar Plantilla de Texto"
        description={`Para confirmar la eliminación de la plantilla "${snippetToDelete?.title}", escriba ELIMINAR:`}
        expectedValue="ELIMINAR"
        inputLabel="Confirmación"
        confirmButtonText="Eliminar Plantilla"
        confirmColor="error"
        onConfirm={handleConfirmDeleteSnippet}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
}
