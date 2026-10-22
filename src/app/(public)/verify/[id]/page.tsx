"use client";

import React, { useEffect, useState, use } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Stack,
  Alert,
} from "@mui/material";
import {
  VerifiedUser as VerifiedIcon,
  Shield as ShieldIcon,
  ErrorOutline as ErrorIcon,
  Fingerprint as FingerprintIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";

export default function PublicVerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const documentId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<any>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

  useEffect(() => {
    async function verify() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}/public/signatures/verify/${documentId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Documento no encontrado o no verificado");
        }
        const data = await res.json();
        setVerificationData(data);
      } catch (err: any) {
        setError(err.message || "No se pudo verificar el documento");
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [apiBase, documentId]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "neutral.50" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !verificationData) {
    return (
      <Box sx={{ minHeight: "100vh", py: 8, px: 2, bgcolor: "neutral.50" }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
            <ErrorIcon color="error" sx={{ fontSize: 56, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: "error.main" }}>
              Verificación No Exitosa
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              El código de verificación escaneado no coincide con ningún documento sellado en la base de datos de Noxia ERP.
            </Typography>
            <Alert severity="warning">
              Advertencia: Este documento podría ser apócrifo, haber sido revocado o haber sufrido alteraciones en sus registros.
            </Alert>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", py: 5, px: 2, bgcolor: "neutral.50" }}>
      <Container maxWidth="md">
        <Paper
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {/* Top Verified Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                width: 68,
                height: 68,
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
              <VerifiedIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "secondary.main", letterSpacing: -0.5 }}>
              DOCUMENTO OFICIAL VERIFICADO
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Acreditación de Autenticidad e Integridad Criptográfica • Noxia ERP
            </Typography>
            <Chip
              label="HUELLA DIGITAL VÁLIDA (LEY 527 DE 1999)"
              color="success"
              size="small"
              sx={{ mt: 1.5, fontWeight: 700, fontSize: "0.75rem" }}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Document & Emitting Company Info */}
          <Stack spacing={2.5}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", letterSpacing: 0.8 }}>
                  INFORMACIÓN DEL DOCUMENTO
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, color: "text.primary" }}>
                  {verificationData.documentTitle}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tipo: <strong>{verificationData.documentType}</strong> • ID de Registro: <strong>{verificationData.id}</strong>
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <BusinessIcon color="action" />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                      EMPRESA EMISORA (TENANT):
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {verificationData.tenantName}
                    </Typography>
                    {verificationData.tenantNit && (
                      <Typography variant="caption" color="text.secondary">
                        NIT: {verificationData.tenantNit}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <PersonIcon color="action" />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                      FIRMANTE AUTORIZADO:
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {verificationData.signerName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {verificationData.signerRole ? `${verificationData.signerRole} • ` : ""}
                      {verificationData.signerDocument ? `ID: ${verificationData.signerDocument}` : ""}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <CalendarIcon color="action" />
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                      FECHA Y HORA DE FIRMA (ESTAMPA CRONOLÓGICA):
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {verificationData.signedAt ? new Date(verificationData.signedAt).toLocaleString("es-CO", { timeZone: "America/Bogota" }) : "Pendiente"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      UTC: {verificationData.signedAt || "No registrada"}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Cryptographic Hashes */}
            <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: "neutral.50" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <FingerprintIcon color="primary" />
                  <Box sx={{ minWidth: 0, width: "100%" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                      HUELLA DIGITAL CRIPTOGRÁFICA (SHA-256):
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        fontFamily: "monospace",
                        fontSize: "0.78rem",
                        color: "primary.main",
                        fontWeight: 700,
                        wordBreak: "break-all",
                        mt: 0.5,
                      }}
                    >
                      {verificationData.signedDocHash || "Hash no generado"}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
