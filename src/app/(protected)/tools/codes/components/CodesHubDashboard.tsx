"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Stack,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  QrCode2 as QrIcon,
  ViewWeek as BarcodeIcon,
  AddCircleOutline as SingleAddIcon,
  DynamicFeed as BatchIcon,
  TableChart as CatalogIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  CheckCircle as ActiveIcon,
  Block as InactiveIcon,
  Layers as LayersIcon,
  ArrowForward as ArrowIcon,
  CameraAlt as CameraIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  UniversalCodesApi,
  UniversalCode,
  BatchItemSummary,
} from "@/lib/api/universal-codes";

interface CodesHubDashboardProps {
  onNavigateSpoke: (spoke: "single" | "batch" | "catalog" | "print", extra?: Record<string, string>) => void;
  onOpenScanner: () => void;
}

export default function CodesHubDashboard({
  onNavigateSpoke,
  onOpenScanner,
}: CodesHubDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [totalCodes, setTotalCodes] = useState(0);
  const [activeCodes, setActiveCodes] = useState(0);
  const [inactiveCodes, setInactiveCodes] = useState(0);
  const [batches, setBatches] = useState<BatchItemSummary[]>([]);
  const [recentCodes, setRecentCodes] = useState<UniversalCode[]>([]);

  // Búsqueda rápida por pistola / input
  const [quickSearch, setQuickSearch] = useState("");
  const [resolvingCode, setResolvingCode] = useState(false);
  const [quickScanError, setQuickScanError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [stats, codesRes, batchesRes] = await Promise.all([
        UniversalCodesApi.getStats(),
        UniversalCodesApi.list({ limit: 10 }),
        UniversalCodesApi.listBatches(),
      ]);

      setTotalCodes(stats.total);
      setActiveCodes(stats.active);
      setInactiveCodes(stats.inactive);
      setRecentCodes(codesRes.data || []);
      setBatches(batchesRes || []);
    } catch {
      // Ignorar fallback silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleQuickResolve = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickSearch.trim()) return;

    try {
      setResolvingCode(true);
      setQuickScanError(null);
      try {
        const code = await UniversalCodesApi.resolve(quickSearch.trim());
        onNavigateSpoke("catalog", { search: code.code });
      } catch {
        // Si no es un código canónico directo, buscar el término en el Catálogo Maestro
        onNavigateSpoke("catalog", { search: quickSearch.trim() });
      }
    } finally {
      setResolvingCode(false);
    }
  };

  return (
    <Box>
      {/* Barra de Búsqueda Rápida / Pistola Lectora */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3.5,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <Box sx={{ flex: 1, width: "100%" }}>
            <form onSubmit={handleQuickResolve}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Disparar pistola lectora USB o escribir código (ej: LORO-QR-... / LORO-BAR-...)..."
                value={quickSearch}
                onChange={(e) => {
                  setQuickSearch(e.target.value);
                  setQuickScanError(null);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BarcodeIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: resolvingCode ? (
                    <CircularProgress size={20} />
                  ) : (
                    <InputAdornment position="end">
                      <Button
                        type="submit"
                        variant="contained"
                        size="small"
                        disabled={!quickSearch.trim()}
                        sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 700 }}
                      >
                        Localizar
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </form>
          </Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<CameraIcon />}
            onClick={onOpenScanner}
            sx={{
              height: 48,
              px: 2.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Escanear con Cámara
          </Button>
        </Stack>

        {quickScanError && (
          <Alert severity="warning" sx={{ mt: 2 }} onClose={() => setQuickScanError(null)}>
            {quickScanError}
          </Alert>
        )}
      </Paper>

      {/* Tarjetas de Métricas de Emisión */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                    Total Códigos Registrados
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "text.primary" }}>
                    {loading ? <CircularProgress size={28} /> : totalCodes}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: "primary.50", color: "primary.main", borderRadius: 2 }}>
                  <QrIcon sx={{ fontSize: 32 }} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                    Lotes de Emisión
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "secondary.main" }}>
                    {loading ? <CircularProgress size={28} /> : batches.length}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: "secondary.50", color: "secondary.main", borderRadius: 2 }}>
                  <LayersIcon sx={{ fontSize: 32 }} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                    Códigos Operativos
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "success.main" }}>
                    {loading ? <CircularProgress size={28} /> : activeCodes}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: "success.50", color: "success.main", borderRadius: 2 }}>
                  <ActiveIcon sx={{ fontSize: 32 }} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                    Inactivos / Revocados
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: "text.secondary" }}>
                    {loading ? <CircularProgress size={28} /> : inactiveCodes}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: "neutral.100", color: "text.secondary", borderRadius: 2 }}>
                  <InactiveIcon sx={{ fontSize: 32 }} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 4 Hero Cards de Acceso a los Spokes */}
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
        Módulos Especializados (Spokes)
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Spoke 1: Individual */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "primary.main",
                transform: "translateY(-3px)",
                boxShadow: "0 8px 24px rgba(99, 102, 241, 0.12)",
              },
            }}
          >
            <CardActionArea onClick={() => onNavigateSpoke("single")} sx={{ height: "100%", p: 2.5 }}>
              <Box sx={{ p: 1.5, bgcolor: "primary.50", color: "primary.main", borderRadius: 2, display: "inline-flex", mb: 2 }}>
                <SingleAddIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Emisión Individual
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Genera un código QR o de barras puntual para rondas, activos fijos o carnets con vista previa en vivo.
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "primary.main", fontWeight: 700 }}>
                <Typography variant="button">Generar Individual</Typography>
                <ArrowIcon fontSize="small" />
              </Stack>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Spoke 2: Por Lote */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "secondary.main",
                transform: "translateY(-3px)",
                boxShadow: "0 8px 24px rgba(236, 72, 153, 0.12)",
              },
            }}
          >
            <CardActionArea onClick={() => onNavigateSpoke("batch")} sx={{ height: "100%", p: 2.5 }}>
              <Box sx={{ p: 1.5, bgcolor: "secondary.50", color: "secondary.main", borderRadius: 2, display: "inline-flex", mb: 2 }}>
                <BatchIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Emisión Masiva (Lote)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Emite hasta 100 códigos simultáneos con batchId y complétalos en el editor rápido tipo hoja de cálculo.
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "secondary.main", fontWeight: 700 }}>
                <Typography variant="button">Crear por Lote</Typography>
                <ArrowIcon fontSize="small" />
              </Stack>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Spoke 3: Catálogo Maestro */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "info.main",
                transform: "translateY(-3px)",
                boxShadow: "0 8px 24px rgba(14, 165, 233, 0.12)",
              },
            }}
          >
            <CardActionArea onClick={() => onNavigateSpoke("catalog")} sx={{ height: "100%", p: 2.5 }}>
              <Box sx={{ p: 1.5, bgcolor: "info.50", color: "info.main", borderRadius: 2, display: "inline-flex", mb: 2 }}>
                <CatalogIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Catálogo Maestro
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Explorador completo con búsqueda paginada, filtros por lote, edición de seriales y control de estados.
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "info.main", fontWeight: 700 }}>
                <Typography variant="button">Explorar Registros</Typography>
                <ArrowIcon fontSize="small" />
              </Stack>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Spoke 4: Estación de Impresión */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "warning.main",
                transform: "translateY(-3px)",
                boxShadow: "0 8px 24px rgba(245, 158, 11, 0.12)",
              },
            }}
          >
            <CardActionArea onClick={() => onNavigateSpoke("print")} sx={{ height: "100%", p: 2.5 }}>
              <Box sx={{ p: 1.5, bgcolor: "warning.50", color: "warning.main", borderRadius: 2, display: "inline-flex", mb: 2 }}>
                <PrintIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Estación de Impresión
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Imprime rótulos térmicos Zebra (50x25, 50x50, 100x50), pliegos adhesivos A4 (24 stickers) y carnets CR80.
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "warning.main", fontWeight: 700 }}>
                <Typography variant="button">Diseñar e Imprimir</Typography>
                <ArrowIcon fontSize="small" />
              </Stack>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {/* Tablas de Lotes Recientes y Últimos Códigos */}
      <Grid container spacing={3}>
        {/* Lotes de Emisión Recientes */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Lotes Recientes ({batches.length})
              </Typography>
              <IconButton size="small" onClick={loadDashboardData}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Stack>

            {batches.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                <Typography variant="body2">Aún no se han generado lotes de códigos.</Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => onNavigateSpoke("batch")}
                  sx={{ mt: 1, textTransform: "none" }}
                >
                  Crear primer lote ahora
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>ID Lote</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Cantidad</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Finalidad</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batches.slice(0, 5).map((b) => (
                      <TableRow key={b.batchId} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: "primary.main" }}>
                            {b.batchId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={`${b.count} ítems`} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {b.purpose}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Completar Seriales en Fast Editor">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => onNavigateSpoke("batch", { batchId: b.batchId })}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Imprimir Rótulos del Lote">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => onNavigateSpoke("print", { batchId: b.batchId })}
                              >
                                <PrintIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Últimos Códigos Generados */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Últimos Códigos Emitidos
              </Typography>
              <Button
                size="small"
                variant="text"
                onClick={() => onNavigateSpoke("catalog")}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Ver todos
              </Button>
            </Stack>

            {recentCodes.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                <Typography variant="body2">No hay códigos emitidos aún.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Título</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentCodes.slice(0, 5).map((code) => (
                      <TableRow key={code.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                            {code.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 160, fontWeight: 600 }}>
                            {code.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={code.codeType === "QR_CODE" ? "QR" : "Barra"}
                            size="small"
                            variant="outlined"
                            color={code.codeType === "QR_CODE" ? "primary" : "default"}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={code.status === "ACTIVE" ? "Activo" : "Inactivo"}
                            size="small"
                            color={code.status === "ACTIVE" ? "success" : "default"}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
