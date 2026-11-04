"use client";

import React, { useEffect, useState, use } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Stack,
  Alert,
  Divider,
} from "@mui/material";
import {
  VerifiedUser as VerifiedIcon,
  Shield as ShieldIcon,
  ErrorOutline as ErrorIcon,
  QrCode2 as QrIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { UniversalCode, UniversalCodesApi } from "@/lib/api/universal-codes";

export default function PublicCodeVerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const resolvedParams = use(params);
  const codeIdentifier = resolvedParams.code;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codeData, setCodeData] = useState<UniversalCode | null>(null);

  useEffect(() => {
    async function verify() {
      setLoading(true);
      setError(null);
      try {
        const data = await UniversalCodesApi.verifyPublic(codeIdentifier);
        setCodeData(data);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error al validar el código";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    if (codeIdentifier) {
      verify();
    }
  }, [codeIdentifier]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0f172a",
        py: { xs: 4, md: 8 },
        px: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, sm: 4.5 },
            borderRadius: 4,
            textAlign: "center",
            bgcolor: "#ffffff",
          }}
        >
          {/* Logo y Encabezado Institucional */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "inline-flex",
                p: 1.5,
                borderRadius: "50%",
                bgcolor: "primary.50",
                color: "primary.main",
                mb: 1.5,
              }}
            >
              <ShieldIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
              LORO ERP
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
              Portal Oficial de Verificación y Trazabilidad
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {loading ? (
            <Box sx={{ py: 6 }}>
              <CircularProgress size={36} />
              <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
                Consultando validez del código en la base de datos central...
              </Typography>
            </Box>
          ) : error ? (
            <Box sx={{ py: 4 }}>
              <ErrorIcon color="error" sx={{ fontSize: 56, mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "error.main", mb: 1 }}>
                Código No Verificado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {error}
              </Typography>
              <Alert severity="warning" sx={{ textAlign: "left" }}>
                El identificador escaneado no coincide con ningún registro activo o registrado en la plataforma.
              </Alert>
            </Box>
          ) : codeData ? (
            <Box>
              <Chip
                icon={<VerifiedIcon />}
                label={
                  codeData.status === "ACTIVE"
                    ? "Identificador Auténtico y Activo"
                    : "Identificador Inactivo / En Pausa"
                }
                color={codeData.status === "ACTIVE" ? "success" : "default"}
                sx={{ mb: 2.5, fontWeight: 800, py: 2, px: 1 }}
              />

              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mb: 0.5 }}>
                {codeData.title}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  fontWeight: 800,
                  letterSpacing: 1,
                  color: "primary.main",
                  mb: 2.5,
                }}
              >
                {codeData.code}
              </Typography>

              <Stack spacing={1.5} sx={{ textAlign: "left", bgcolor: "neutral.50", p: 2.5, borderRadius: 2.5, mb: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <QrIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    Finalidad: <b>{codeData.purpose}</b>
                  </Typography>
                </Stack>

                {codeData.department && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      Área Responsable: <b>{codeData.department}</b>
                    </Typography>
                  </Stack>
                )}

                {codeData.batchId && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                      Lote:
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                      {codeData.batchId}
                    </Typography>
                  </Stack>
                )}

                {codeData.metadata && Object.keys(codeData.metadata).length > 0 && (
                  <Box sx={{ pt: 1, borderTop: "1px dashed #cbd5e1" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: "block", color: "text.secondary" }}>
                      Atributos Verificados:
                    </Typography>
                    {codeData.metadata.serialNumber && (
                      <Typography variant="body2">
                        Serial: <b>{String(codeData.metadata.serialNumber)}</b>
                      </Typography>
                    )}
                    {codeData.metadata.brand && (
                      <Typography variant="body2">
                        Marca: <b>{String(codeData.metadata.brand)}</b>
                      </Typography>
                    )}
                    {codeData.metadata.floor && (
                      <Typography variant="body2">
                        Nivel/Piso: <b>{String(codeData.metadata.floor)}</b>
                      </Typography>
                    )}
                  </Box>
                )}

                <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 1 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    Fecha de Registro: {new Date(codeData.createdAt).toLocaleDateString("es-CO")}
                  </Typography>
                </Stack>
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Validado criptográficamente por la infraestructura Loro ERP Enterprise Security.
              </Typography>
            </Box>
          ) : null}
        </Paper>
      </Container>
    </Box>
  );
}

