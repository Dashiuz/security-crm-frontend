"use client";

import React, { useEffect, useState, use } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import {
  CheckCircle as SuccessIcon,
  Shield as ShieldIcon,
  DrawOutlined as SignatureIcon,
  Download as DownloadIcon,
  AccessTime as TimeIcon,
  WarningAmber as WarningIcon,
  VerifiedUser as VerifiedIcon,
} from "@mui/icons-material";
import UserSignatureDrawer, { SignatureCreationMode } from "@/components/signatures/UserSignatureDrawer";

export default function PublicSignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<any>(null);

  // Signature state
  const [signatureDrawerOpen, setSignatureDrawerOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureMethod, setSignatureMethod] = useState<SignatureCreationMode>("DRAW");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [signSuccessResult, setSignSuccessResult] = useState<any>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

  // Load document on mount
  useEffect(() => {
    async function loadDocument() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}/public/signatures/${token}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Enlace no válido o expirado");
        }
        const data = await res.json();
        setDocumentData(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar el documento");
      } finally {
        setLoading(false);
      }
    }
    loadDocument();
  }, [apiBase, token]);

  const handleSignatureCaptured = (dataUrl: string, method: SignatureCreationMode) => {
    setSignatureDataUrl(dataUrl);
    setSignatureMethod(method);
    setSignatureDrawerOpen(false);
  };

  const handleSubmitSignature = async () => {
    if (!signatureDataUrl) {
      setError("Por favor estampe su firma antes de enviar.");
      return;
    }
    if (!acceptedTerms) {
      setError("Debe aceptar los términos legales de la Ley 527 de 1999.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/public/signatures/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureDataUrl,
          method: signatureMethod,
          acceptedTerms: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Error al procesar la firma");
      }

      const result = await res.json();
      setSignSuccessResult(result);
    } catch (err: any) {
      setError(err.message || "Error al firmar el documento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!signSuccessResult?.pdfBase64) return;
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${signSuccessResult.pdfBase64}`;
    link.download = `${documentData?.documentTitle || "documento_firmado"}.pdf`;
    link.click();
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "neutral.50" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Success screen
  if (signSuccessResult) {
    return (
      <Box sx={{ minHeight: "100vh", py: 6, px: 2, bgcolor: "neutral.50" }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center", boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "success.soft",
                color: "success.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <SuccessIcon sx={{ fontSize: 36 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: "secondary.main" }}>
              ¡Documento Firmado Exitosamente!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Su firma ha sido estampada y certificada bajo la <strong>Ley 527 de 1999</strong> con huella digital criptográfica inalterable.
            </Typography>

            <Card variant="outlined" sx={{ mb: 3, textAlign: "left", borderRadius: 2, bgcolor: "neutral.50" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  DOCUMENTO:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  {documentData?.documentTitle}
                </Typography>

                <Typography variant="caption" color="text.secondary" display="block">
                  HUELLA DIGITAL (HASH SHA-256):
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    wordBreak: "break-all",
                    color: "primary.main",
                    fontWeight: 600,
                  }}
                >
                  {signSuccessResult.signedDocHash}
                </Typography>
              </CardContent>
            </Card>

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPdf}
              sx={{ borderRadius: 2, py: 1.25, fontWeight: 700, textTransform: "none" }}
            >
              Descargar Copia Oficial Firmada (PDF)
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Error screen (expired or revoked)
  if (error && !documentData) {
    return (
      <Box sx={{ minHeight: "100vh", py: 8, px: 2, bgcolor: "neutral.50" }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
            <WarningIcon color="warning" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Enlace No Disponible
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", py: 4, px: 2, bgcolor: "neutral.50" }}>
      <Container maxWidth="md">
        {/* Header Bar */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {documentData?.tenantName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Portal Oficial de Firma Electrónica Segura
              </Typography>
            </Box>
          </Box>

          <Chip
            icon={<TimeIcon fontSize="small" />}
            label="Válido por 15 días"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Main Document Details Paper */}
        <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, mb: 3 }}>
          <Box sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2, mb: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", letterSpacing: 0.8 }}>
              REVISIÓN Y ACEPTACIÓN DE DOCUMENTO
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary", mt: 0.5 }}>
              {documentData?.documentTitle}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Destinatario: <strong>{documentData?.signerName}</strong> • {documentData?.signerEmail}
            </Typography>
          </Box>

          {/* Structured Document Data View */}
          <Box sx={{ bgcolor: "neutral.50", p: 2.5, borderRadius: 2, mb: 3, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Resumen del Trámite:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Tipo: <strong>{documentData?.documentType}</strong> | Versión: <strong>v{documentData?.documentVersion}</strong>
            </Typography>

            {documentData?.draftSnapshot && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px dashed", borderColor: "divider" }}>
                {documentData.draftSnapshot.total && (
                  <Typography variant="body1" sx={{ fontWeight: 700, color: "primary.main" }}>
                    Total: ${Number(documentData.draftSnapshot.total).toLocaleString("es-CO")} COP
                  </Typography>
                )}
                {documentData.draftSnapshot.notes && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Notas: {documentData.draftSnapshot.notes}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Signature Action Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Firma Electrónica del Destinatario:
            </Typography>

            {signatureDataUrl ? (
              <Box
                sx={{
                  p: 2,
                  border: "2px solid",
                  borderColor: "primary.main",
                  borderRadius: 2,
                  bgcolor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box component="img" src={signatureDataUrl} alt="Firma estampada" sx={{ maxHeight: 60, maxWidth: 200 }} />
                <Button size="small" onClick={() => setSignatureDrawerOpen(true)} sx={{ textTransform: "none" }}>
                  Modificar Firma
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                startIcon={<SignatureIcon />}
                onClick={() => setSignatureDrawerOpen(true)}
                sx={{
                  py: 2,
                  borderRadius: 2,
                  borderStyle: "dashed",
                  borderWidth: 2,
                  fontWeight: 700,
                  textTransform: "none",
                  "&:hover": { borderStyle: "dashed", borderWidth: 2 },
                }}
              >
                Haga clic aquí para firmar (Dibujar, Escribir o Subir)
              </Button>
            )}
          </Box>

          {/* Legal Acceptance Checkbox */}
          <Box sx={{ bgcolor: "primary.soft", p: 2, borderRadius: 2, mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: "0.82rem", lineHeight: 1.35 }}>
                  Acepto firmar electrónicamente este documento y reconozco su plena validez jurídica y probatoria
                  conforme a lo dispuesto en la <strong>Ley 527 de 1999</strong> y el <strong>Decreto 2364 de 2012</strong> de la República de Colombia.
                </Typography>
              }
            />
          </Box>

          {/* Submit Button */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={handleSubmitSignature}
            disabled={submitting || !signatureDataUrl || !acceptedTerms}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <VerifiedIcon />}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: "1rem",
              textTransform: "none",
            }}
          >
            {submitting ? "Procesando y Sellando Documento..." : "Aceptar y Firmar Documento"}
          </Button>
        </Paper>
      </Container>

      {/* Signature Drawer */}
      <UserSignatureDrawer
        open={signatureDrawerOpen}
        onClose={() => setSignatureDrawerOpen(false)}
        onSave={handleSignatureCaptured}
        initialName={documentData?.signerName}
        title="Estampar Firma Electrónica"
      />
    </Box>
  );
}
