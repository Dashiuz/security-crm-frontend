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
  DrawOutlined,
  FormatPaint,
  VerifiedUser,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import {
  TenantDocumentSkin,
  DocumentTextSnippet,
  CommercialSettingsApi,
  DocumentHeaderLayout,
  AuthorizedSigner,
  DocumentEngineApi,
} from "@/lib/api/commercial-settings";
import AuthorizedSignerDrawer from "../drawers/AuthorizedSignerDrawer";
import BrandColorPicker from "../BrandColorPicker";
import HeaderLayoutPreviewCard from "../widgets/HeaderLayoutPreviewCard";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import { useNotification } from "@/providers/NotificationProvider";
import { noxiaPalette } from "@/theme/noxiaTheme";
import { DescriptionOutlined } from "@mui/icons-material";

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
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [isSavingSkin, setIsSavingSkin] = useState(false);

  // Form State para Piel de Documento
  const [skinForm, setSkinForm] = useState({
    headerLayout: documentSkin?.headerLayout || DocumentHeaderLayout.MODERN_MINIMALIST,
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
  });

  // State para Firmantes Autorizados
  const [signers, setSigners] = useState<AuthorizedSigner[]>([]);
  const [signerDrawerOpen, setSignerDrawerOpen] = useState(false);
  const [selectedSigner, setSelectedSigner] = useState<AuthorizedSigner | null>(null);
  const [deleteSignerConfirmOpen, setDeleteSignerConfirmOpen] = useState(false);
  const [signerToDelete, setSignerToDelete] = useState<AuthorizedSigner | null>(null);

  const loadSigners = async () => {
    try {
      const res = await DocumentEngineApi.getSigners();
      setSigners(res);
    } catch {
      // Ignorar si aún no hay firmantes creados
    }
  };

  React.useEffect(() => {
    loadSigners();
  }, []);

  const handleEditSigner = (s: AuthorizedSigner) => {
    setSelectedSigner(s);
    setSignerDrawerOpen(true);
  };

  const handleCreateSigner = () => {
    setSelectedSigner(null);
    setSignerDrawerOpen(true);
  };

  const handleDeleteSignerClick = (s: AuthorizedSigner) => {
    setSignerToDelete(s);
    setDeleteSignerConfirmOpen(true);
  };

  const handleConfirmDeleteSigner = async () => {
    if (!signerToDelete) return;
    try {
      await DocumentEngineApi.deleteSigner(signerToDelete.id);
      showSuccess("Firmante autorizado eliminado");
      loadSigners();
    } catch (err: any) {
      showError(err?.message || "Error al eliminar el firmante");
    } finally {
      setDeleteSignerConfirmOpen(false);
      setSignerToDelete(null);
    }
  };

  // State para Snippets
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<DocumentTextSnippet | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [snippetToDelete, setSnippetToDelete] = useState<DocumentTextSnippet | null>(null);

  const handleSaveSkin = async () => {
    try {
      setIsSavingSkin(true);
      await CommercialSettingsApi.updateDocumentSkin(skinForm);
      showSuccess("Configuraciones guardadas exitosamente");
      onRefresh();
    } catch (err: any) {
      showError(err?.message || "Error al actualizar las configuraciones");
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
            Guardar Configuraciones
          </Button>
        </Box>

        {/* Cabecera Ancha en el Tope del Box */}
        <Box sx={{ mb: 2.5 }}>
          <HeaderLayoutPreviewCard
            layout={skinForm.headerLayout}
            companyName={skinForm.companyLegalName}
            companyNit={skinForm.companyNit}
            supervigilanciaLicense={skinForm.supervigilanciaLicense}
            primaryColor={skinForm.primaryBrandColorHex}
            accentColor={skinForm.accentBrandColorHex}
            city="Bogotá D.C."
            proposalNumber="PROP-2026-0084"
          />
        </Box>

        {/* Selectores de Color */}
        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <BrandColorPicker
              label="Color Primario (Hex)"
              value={skinForm.primaryBrandColorHex}
              onChange={(hex) =>
                setSkinForm((p) => (p.primaryBrandColorHex === hex ? p : { ...p, primaryBrandColorHex: hex }))
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <BrandColorPicker
              label="Color Acento (Hex)"
              value={skinForm.accentBrandColorHex}
              onChange={(hex) =>
                setSkinForm((p) => (p.accentBrandColorHex === hex ? p : { ...p, accentBrandColorHex: hex }))
              }
            />
          </Grid>
        </Grid>

        {/* Selector de Diseño de Membrete */}
        <Box sx={{ mt: 1, mb: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", display: "block", mb: 1.5 }}>
            Diseño del Membrete y Cabecera de Documentos
          </Typography>
          <Grid container spacing={2}>
            {[
              { id: DocumentHeaderLayout.MODERN_MINIMALIST, label: "Minimalista Moderno", desc: "Barra lateral de acento y datos limpios a la derecha" },
              { id: DocumentHeaderLayout.CLASSIC_CORPORATE, label: "Clásico Corporativo", desc: "Banda superior sólida con color primario institucional" },
              { id: DocumentHeaderLayout.EDITORIAL_CENTERED, label: "Editorial Centrado", desc: "Logo superior centrado y línea doble de separación" },
              { id: DocumentHeaderLayout.FRAME_ACCREDITED, label: "Marco con Acreditaciones", desc: "Marco perimetral y sellos de certificación oficial" },
            ].map((layout) => {
              const isSelected = skinForm.headerLayout === layout.id;
              return (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={layout.id}>
                  <Card
                    onClick={() => setSkinForm((p) => ({ ...p, headerLayout: layout.id }))}
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor: isSelected ? noxiaPalette.primary.main : "divider",
                      bgcolor: isSelected ? `${noxiaPalette.primary.main}08` : "background.paper",
                      transition: "all 0.18s ease-in-out",
                      "&:hover": { borderColor: noxiaPalette.primary.main },
                    }}
                  >
                    <FormatPaint sx={{ fontSize: 22, color: isSelected ? noxiaPalette.primary.main : "text.secondary", mb: 0.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.82rem" }}>
                      {layout.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem", display: "block" }}>
                      {layout.desc}
                    </Typography>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>

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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: noxiaPalette.primary.main, textTransform: "uppercase" }}>
              Firmantes Autorizados y Estampación Digital ({signers.length})
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              Personal directivo con firma manuscrita digitalizada para estampar en propuestas y documentos comerciales (Ley 527 de 1999)
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateSigner}
            sx={{ borderRadius: 1.5, fontSize: "0.75rem", textTransform: "none", fontWeight: 700, bgcolor: noxiaPalette.primary.main }}
          >
            Agregar Firmante
          </Button>
        </Box>

        {signers.length === 0 ? (
          <Box sx={{ p: 2.5, textAlign: "center", bgcolor: "neutral.50", borderRadius: 2, border: "1px dashed", borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary">
              No hay firmantes registrados aún. Pulse &quot;Agregar Firmante&quot; para registrar al Representante Legal o Director Comercial.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {signers.map((s) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={s.id}>
                <Card sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
                        {s.fullName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        {s.jobTitle}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => handleEditSigner(s)}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteSignerClick(s)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                    <Chip
                      label={s.roleScope}
                      size="small"
                      sx={{ fontSize: "0.65rem", fontWeight: 600, height: 20 }}
                    />
                    {s.includeInCommercialProposal && (
                      <Chip
                        label="En Propuestas"
                        size="small"
                        color="primary"
                        sx={{ fontSize: "0.65rem", fontWeight: 700, height: 20 }}
                      />
                    )}
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Card>

      {/* 2. Plantillas de Texto Dinámicas & Formatos */}
      <Box>
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 2.5,
            bgcolor: "#F8FAFC",
            border: "1.5px dashed #CBD5E1",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { sm: "center" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <DescriptionOutlined sx={{ color: "primary.main" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                Motor Universal de Formatos & Variables Dinámicas
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Las plantillas de documentos, minutas y variables ahora se gestionan de forma transversal e institucional en el módulo central de formatos, con soporte completo para tablas de Word/Excel y variables por usuario.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push("/tools/formats")}
            sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none", px: 2.5, whiteSpace: "nowrap" }}
          >
            Abrir Elaboración de Formatos
          </Button>
        </Paper>
      </Box>

      {/* Drawer Firmantes */}
      <AuthorizedSignerDrawer
        open={signerDrawerOpen}
        onClose={() => setSignerDrawerOpen(false)}
        signer={selectedSigner}
        onSuccess={loadSigners}
      />

      {/* Confirmación Eliminación Firmante */}
      <PromptConfirmDialog
        open={deleteSignerConfirmOpen}
        title="Eliminar Firmante Autorizado"
        description={`Para confirmar la eliminación del firmante "${signerToDelete?.fullName}", escriba ELIMINAR:`}
        expectedValue="ELIMINAR"
        inputLabel="Confirmación"
        confirmButtonText="Eliminar Firmante"
        confirmColor="error"
        onConfirm={handleConfirmDeleteSigner}
        onClose={() => setDeleteSignerConfirmOpen(false)}
      />
    </Box>
  );
}
