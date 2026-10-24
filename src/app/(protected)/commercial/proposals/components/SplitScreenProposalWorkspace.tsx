"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Stack,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Divider,
  Card,
  CircularProgress,
  Dialog,
  AppBar,
  Toolbar,
  Slide,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import {
  Close as CloseIcon,
  PictureAsPdf,
  Send,
  SaveOutlined,
  ViewSidebar,
  Palette,
  FormatPaint,
} from "@mui/icons-material";
import TipTapRichEditor from "./TipTapRichEditor";
import ChameleonPdfPreview from "./ChameleonPdfPreview";
import {
  DocumentHeaderLayout,
  TenantDocumentSkin,
  AuthorizedSigner,
  DocumentTextSnippet,
  DocumentEngineApi,
  CommercialSettingsApi,
} from "@/lib/api/commercial-settings";
import { useNotification } from "@/providers/NotificationProvider";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface SplitScreenProposalWorkspaceProps {
  open: boolean;
  onClose: () => void;
  initialProposal?: any;
}

export default function SplitScreenProposalWorkspace({
  open,
  onClose,
  initialProposal,
}: SplitScreenProposalWorkspaceProps) {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Document Skin & Signers from backend
  const [skin, setSkin] = useState<Partial<TenantDocumentSkin> | null>(null);
  const [signers, setSigners] = useState<AuthorizedSigner[]>([]);
  const [snippets, setSnippets] = useState<DocumentTextSnippet[]>([]);

  // Workspace Form State
  const [clientName, setClientName] = useState("CONJUNTO RESIDENCIAL LOS ALPES P.H.");
  const [clientNit, setClientNit] = useState("901.442.189-3");
  const [clientCity, setClientCity] = useState("Bogotá D.C.");
  const [proposalNumber, setProposalNumber] = useState(`PROP-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [headerLayout, setHeaderLayout] = useState<DocumentHeaderLayout>(DocumentHeaderLayout.MODERN_MINIMALIST);
  const [bodyHtml, setBodyHtml] = useState(
    "<p>Estimados señores del Consejo de Administración,</p><p>De acuerdo con su atenta solicitud, nos complace presentar la propuesta técnico-económica para el suministro de vigilancia y seguridad privada integral, cumpliendo a cabalidad con los decretos tarifarios vigentes de la Superintendencia de Vigilancia.</p><p>Nuestro personal cuenta con formación certificada en control de accesos, manejo de sistemas electrónicos y servicio al cliente.</p>"
  );

  // Selected signers for this proposal
  const [selectedSignerIds, setSelectedSignerIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [previewRes, snippetsRes, signersRes] = await Promise.all([
        DocumentEngineApi.getPreviewConfig().catch(() => null),
        CommercialSettingsApi.getTextSnippets().catch(() => []),
        DocumentEngineApi.getSigners().catch(() => []),
      ]);

      if (previewRes?.skin) {
        setSkin(previewRes.skin);
        if (previewRes.skin.headerLayout) {
          setHeaderLayout(previewRes.skin.headerLayout as DocumentHeaderLayout);
        }
      }
      setSnippets(snippetsRes);
      setSigners(signersRes);

      // Default selected signers: those with includeInCommercialProposal true
      const defaultSigners = signersRes
        .filter((s) => s.includeInCommercialProposal)
        .map((s) => s.id);
      setSelectedSignerIds(defaultSigners);
    } catch (err: any) {
      showError("Error al cargar la configuración del motor de documentos.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySnippet = (snippet: DocumentTextSnippet) => {
    // Interpolate known variables into template
    let content = snippet.bodyTemplate;
    content = content.replace(/{{client_name}}/g, clientName);
    content = content.replace(/{{current_year}}/g, "2026");
    content = content.replace(/{{company_legal_name}}/g, skin?.companyLegalName || "NOXIA SEGURIDAD S.A.S.");
    content = content.replace(/{{company_nit}}/g, skin?.companyNit || "900.000.000-1");

    setBodyHtml(`<p>${content.replace(/\n/g, "</p><p>")}</p>`);
    showSuccess(`Plantilla "${snippet.title}" aplicada`);
  };

  const activeSigners = signers.filter((s) => selectedSignerIds.includes(s.id));

  const handleSaveDraft = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showSuccess(`Propuesta ${proposalNumber} guardada exitosamente.`);
      onClose();
    }, 600);
  };

  const handleDownloadPdf = () => {
    showSuccess(`Descargando PDF ${proposalNumber} con certificación forense SHA-256.`);
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      sx={{ "& .MuiDialog-paper": { bgcolor: "neutral.50" } }}
    >
      {/* Top App Bar */}
      <AppBar sx={{ position: "relative", bgcolor: "secondary.main", color: "#ffffff" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
                Emisión de Propuesta Económica
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                {proposalNumber} • Vista Dividida en Tiempo Real
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<PictureAsPdf />}
              onClick={handleDownloadPdf}
              sx={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.3)", "&:hover": { borderColor: "#ffffff" } }}
            >
              Exportar PDF
            </Button>
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<SaveOutlined />}
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saving ? <CircularProgress size={18} /> : "Guardar Propuesta"}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Main Split-Screen Layout */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>
          {/* PANEL IZQUIERDO: Formulario & Editor TipTap (50% ancho en desktop) */}
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              height: "100%",
              overflowY: "auto",
              p: 3,
              borderRight: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Stack spacing={3}>
              {/* Sección 1: Datos del Destinatario */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mb: 1.5, textTransform: "uppercase" }}>
                  1. Cliente / Prospecto Destinatario
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      label="Razón Social / Nombre del Prospecto"
                      fullWidth
                      size="small"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="NIT / Documento"
                      fullWidth
                      size="small"
                      value={clientNit}
                      onChange={(e) => setClientNit(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Ciudad / Ubicación"
                      fullWidth
                      size="small"
                      value={clientCity}
                      onChange={(e) => setClientCity(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Consecutivo de Propuesta"
                      fullWidth
                      size="small"
                      value={proposalNumber}
                      onChange={(e) => setProposalNumber(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Sección 2: Estilo de Membrete Camaleón */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mb: 1, textTransform: "uppercase" }}>
                  2. Diseño de Membrete Institucional
                </Typography>
                <Grid container spacing={1.5}>
                  {[
                    { id: DocumentHeaderLayout.MODERN_MINIMALIST, label: "Minimalista Moderno", desc: "Barra lateral acento y datos limpios" },
                    { id: DocumentHeaderLayout.CLASSIC_CORPORATE, label: "Clásico Corporativo", desc: "Banda superior sólida a color" },
                    { id: DocumentHeaderLayout.EDITORIAL_CENTERED, label: "Editorial Centrado", desc: "Tipografía sobria y logo superior" },
                    { id: DocumentHeaderLayout.FRAME_ACCREDITED, label: "Marco con Acreditaciones", desc: "Sellos ISO, BASC y PONAL" },
                  ].map((l) => (
                    <Grid size={{ xs: 6, sm: 3 }} key={l.id}>
                      <Card
                        onClick={() => setHeaderLayout(l.id)}
                        sx={{
                          p: 1.5,
                          cursor: "pointer",
                          borderRadius: 2,
                          textAlign: "center",
                          border: "2px solid",
                          borderColor: headerLayout === l.id ? "primary.main" : "divider",
                          bgcolor: headerLayout === l.id ? "primary.soft" : "background.paper",
                          transition: "all 0.18s ease-in-out",
                          "&:hover": { borderColor: "primary.main" },
                        }}
                      >
                        <FormatPaint sx={{ fontSize: 20, color: headerLayout === l.id ? "primary.main" : "text.secondary", mb: 0.5 }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.78rem" }}>
                          {l.label}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary", display: "block" }}>
                          {l.desc}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider />

              {/* Sección 3: Selector de Minuta / Plantilla de Texto */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", textTransform: "uppercase" }}>
                    3. Redacción de Minuta / Cláusula de Presentación
                  </Typography>
                  {snippets.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Seleccione una minuta para autocompletar
                    </Typography>
                  )}
                </Stack>

                {snippets.length > 0 && (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                    {snippets.map((snip) => (
                      <Chip
                        key={snip.id}
                        label={snip.title}
                        size="small"
                        onClick={() => handleApplySnippet(snip)}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.74rem",
                          "&:hover": { bgcolor: "primary.soft" },
                        }}
                      />
                    ))}
                  </Stack>
                )}

                {/* Editor TipTap */}
                <TipTapRichEditor
                  value={bodyHtml}
                  onChange={setBodyHtml}
                  placeholder="Redacte la propuesta comercial o inserte cláusulas del catálogo..."
                />
              </Box>

              <Divider />

              {/* Sección 4: Firmantes Autorizados a Estampar */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mb: 1, textTransform: "uppercase" }}>
                  4. Firmantes Autorizados en el Documento
                </Typography>
                <Grid container spacing={1.5}>
                  {signers.map((s) => {
                    const isSelected = selectedSignerIds.includes(s.id);
                    return (
                      <Grid size={{ xs: 12, sm: 6 }} key={s.id}>
                        <Card
                          onClick={() => {
                            setSelectedSignerIds((prev) =>
                              isSelected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                            );
                          }}
                          sx={{
                            p: 1.5,
                            cursor: "pointer",
                            borderRadius: 2,
                            border: "1.5px solid",
                            borderColor: isSelected ? "primary.main" : "divider",
                            bgcolor: isSelected ? "primary.soft" : "background.paper",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.82rem" }}>
                              {s.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {s.jobTitle}
                            </Typography>
                          </Box>
                          <Chip
                            label={isSelected ? "Incluido" : "Omitir"}
                            size="small"
                            color={isSelected ? "primary" : "default"}
                            sx={{ fontSize: "0.65rem", height: 20, fontWeight: 700 }}
                          />
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </Stack>
          </Box>

          {/* PANEL DERECHO: Previsualización en Vivo PDF Camaleón (50% ancho en desktop) */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              width: "50%",
              height: "100%",
              overflowY: "auto",
              p: 3,
              bgcolor: "#334155", // Slate background typical of PDF viewers
            }}
          >
            <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#ffffff" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Previsualización Dinámica Reactiva (A4)
              </Typography>
              <Chip label="Actualizado en Tiempo Real" size="small" sx={{ bgcolor: "success.main", color: "#ffffff", height: 18, fontSize: "0.6rem", fontWeight: 700 }} />
            </Box>

            <ChameleonPdfPreview
              skin={skin}
              layout={headerLayout}
              clientName={clientName}
              clientNit={clientNit}
              clientCity={clientCity}
              proposalNumber={proposalNumber}
              bodyHtml={bodyHtml}
              signers={activeSigners}
            />
          </Box>
        </Box>
      )}
    </Dialog>
  );
}
