"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Print as PrintIcon,
  FileDownload as CsvIcon,
  CheckCircle as SuccessIcon,
  FormatShapes as FormatIcon,
  AspectRatio as RatioIcon,
} from "@mui/icons-material";
import { UniversalCode, BatchItemSummary, UniversalCodesApi } from "@/lib/api/universal-codes";
import {
  LABEL_STANDARD_FORMATS,
  LabelStandardFormat,
  generateBarcode128Svg,
  getQrCodeImageUrl,
} from "@/utils/barcode-generator";

interface PrintStationSpokeProps {
  initialCodes?: UniversalCode[];
  initialBatchId?: string;
}

export default function PrintStationSpoke({
  initialCodes = [],
  initialBatchId = "",
}: PrintStationSpokeProps) {
  const [selectedFormatId, setSelectedFormatId] = useState<LabelStandardFormat>("THERMAL_50x25");
  const [printCodes, setPrintCodes] = useState<UniversalCode[]>(initialCodes);
  const [activeBatchId, setActiveBatchId] = useState<string>(initialBatchId);
  const [batchOptions, setBatchOptions] = useState<BatchItemSummary[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Opciones de Rótulo
  const [showBrand, setShowBrand] = useState(true);
  const [showDepartment, setShowDepartment] = useState(true);
  const [showDate, setShowDate] = useState(false);

  // Sincronizar initialBatchId si viene de navegación
  useEffect(() => {
    if (initialBatchId) {
      setActiveBatchId(initialBatchId);
    }
  }, [initialBatchId]);

  // Cargar lista de lotes disponibles
  useEffect(() => {
    UniversalCodesApi.listBatches().then(setBatchOptions).catch(() => { });
  }, []);

  // Cargar códigos del lote seleccionado si cambia
  useEffect(() => {
    if (activeBatchId) {
      setLoadingPreview(true);
      UniversalCodesApi.list({ batchId: activeBatchId, limit: 100 })
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setPrintCodes(res.data);
          }
        })
        .catch((err) => {
          console.error("Error cargando lote en estación de impresión:", err);
        })
        .finally(() => setLoadingPreview(false));
    } else if (initialCodes.length > 0) {
      setPrintCodes(initialCodes);
    } else {
      setLoadingPreview(true);
      UniversalCodesApi.list({ status: "ACTIVE", limit: 24 })
        .then((res) => setPrintCodes(res.data || []))
        .catch((err) => {
          console.error("Error cargando códigos activos:", err);
        })
        .finally(() => setLoadingPreview(false));
    }
  }, [activeBatchId]);

  const currentFormat = LABEL_STANDARD_FORMATS.find((f) => f.id === selectedFormatId) || LABEL_STANDARD_FORMATS[0];

  const handleTriggerPrint = () => {
    if (printCodes.length === 0) return;

    const printWindow = window.open("", "_blank", "width=850,height=700");
    if (!printWindow) return;

    const isGrid = currentFormat.isGrid;
    const isThermal = currentFormat.category === "thermal";

    // Estilos de impresión milimétricos según el formato
    let pageCss = "";
    if (isThermal) {
      pageCss = `@page { size: ${currentFormat.widthMm}mm ${currentFormat.heightMm}mm; margin: 0; }`;
    } else if (isGrid) {
      pageCss = `@page { size: A4 portrait; margin: 8mm 6mm; }`;
    } else {
      pageCss = `@page { size: ${currentFormat.widthMm}mm ${currentFormat.heightMm}mm; margin: 0; }`;
    }

    const itemsHtml = printCodes.map((code) => {
      const isQr = code.codeType === "QR_CODE";
      const serial = (code.metadata?.serialNumber as string) || (code.metadata?.plateOrSerial as string);

      let visualHtml = "";
      if (isQr) {
        visualHtml = `<img src="${getQrCodeImageUrl(code.code, 180)}" style="width: ${selectedFormatId === 'THERMAL_50x25' ? '18mm' : '26mm'}; height: ${selectedFormatId === 'THERMAL_50x25' ? '18mm' : '26mm'};" alt="${code.code}" />`;
      } else {
        visualHtml = generateBarcode128Svg(code.code, {
          width: selectedFormatId === "THERMAL_50x25" ? 170 : 220,
          height: selectedFormatId === "THERMAL_50x25" ? 48 : 65,
          showText: true,
        });
      }

      return `
        <div class="label-card ${selectedFormatId}">
          ${showBrand ? `<div class="brand">LORO ERP • CONTROL</div>` : ""}
          <div class="title">${code.title}</div>
          <div class="visual-wrap">${visualHtml}</div>
          <div class="footer-meta">
            ${showDepartment && code.department ? `<span class="dept">${code.department}</span>` : ""}
            ${serial ? `<span class="serial">SN: ${serial}</span>` : ""}
            ${showDate ? `<span class="date">${new Date().toLocaleDateString("es-CO")}</span>` : ""}
          </div>
        </div>
      `;
    }).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impresión de Rótulos - ${printCodes.length} Etiquetas</title>
          <style>
            ${pageCss}
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { background: #fff; }

            /* Grilla de Pliego A4 (3 columnas x 8 filas) */
            .grid-container {
              display: grid;
              grid-template-columns: repeat(3, 66mm);
              grid-auto-rows: 34mm;
              gap: 2mm 3mm;
              justify-content: center;
              padding: 2mm 0;
            }

            /* Contenedor Térmico / Continuo */
            .thermal-container {
              display: flex;
              flex-direction: column;
              align-items: center;
            }

            .label-card {
              border: 1px dashed #cbd5e1;
              border-radius: 4px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 2mm;
              overflow: hidden;
            }

            .THERMAL_50x25 {
              width: 50mm;
              height: 25mm;
              page-break-after: always;
              border: none;
              padding: 1.5mm 2mm;
            }
            .THERMAL_50x50 {
              width: 50mm;
              height: 50mm;
              page-break-after: always;
              border: none;
              padding: 3mm;
            }
            .THERMAL_100x50 {
              width: 100mm;
              height: 50mm;
              page-break-after: always;
              border: none;
              padding: 4mm;
            }
            .BADGE_CR80 {
              width: 85.6mm;
              height: 54mm;
              page-break-after: always;
              border: 1px solid #94a3b8;
              border-radius: 8px;
              padding: 4mm;
            }
            .SHEET_A4_24UP {
              width: 66mm;
              height: 34mm;
              border: 1px dashed #e2e8f0;
              border-radius: 4px;
              padding: 1.5mm;
            }

            .brand { font-size: 7pt; font-weight: 800; letter-spacing: 0.5px; color: #4338ca; text-transform: uppercase; margin-bottom: 1mm; }
            .title { font-size: 8pt; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95%; margin-bottom: 1mm; }
            .visual-wrap { display: flex; align-items: center; justify-content: center; margin: 0.5mm 0; }
            .footer-meta { font-size: 6pt; color: #64748b; display: flex; gap: 3mm; margin-top: 0.5mm; }
            .serial { font-weight: 700; color: #1e293b; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="${isGrid ? 'grid-container' : 'thermal-container'}">
            ${itemsHtml}
          </div>
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 300);
            });
            window.addEventListener('afterprint', function() {
              window.close();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportCsv = () => {
    if (printCodes.length === 0) return;

    const headers = [
      "ID",
      "Código Canónico",
      "Lote",
      "Título",
      "Simbología",
      "Finalidad",
      "Departamento",
      "Serial / Placa",
      "Estado",
      "Fecha Creación",
    ];

    const rows = printCodes.map((c) => [
      c.id,
      c.code,
      c.batchId || "",
      `"${(c.title || "").replace(/"/g, '""')}"`,
      c.codeType,
      c.purpose,
      `"${(c.department || "").replace(/"/g, '""')}"`,
      `"${((c.metadata?.serialNumber as string) || (c.metadata?.plateOrSerial as string) || "").replace(/"/g, '""')}"`,
      c.status,
      c.createdAt ? new Date(c.createdAt).toLocaleDateString("es-CO") : "",
    ].join(","));

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const downloadName = activeBatchId
      ? `Lote_${activeBatchId}.csv`
      : `Rotulos_${currentFormat.id}_Export.csv`;
    link.setAttribute("download", downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Grid container spacing={3.5}>
        {/* Panel de Configuración de Impresión */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
              Estación de Impresión de Rótulos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Selecciona el estándar de papel o rollo térmico según el destino físico del código.
            </Typography>

            <Stack spacing={2.5}>
              {/* Selector de Lote / Origen de Códigos */}
              <TextField
                select
                fullWidth
                size="small"
                label="Origen de los Códigos"
                value={activeBatchId}
                onChange={(e) => setActiveBatchId(e.target.value)}
              >
                <MenuItem value="">
                  {initialCodes.length > 0
                    ? `Selección / Códigos previos (${initialCodes.length})`
                    : "Todos los códigos activos recientes"}
                </MenuItem>
                {batchOptions.map((b) => (
                  <MenuItem key={b.batchId} value={b.batchId}>
                    Lote: {b.batchId} ({b.count} ítems)
                  </MenuItem>
                ))}
              </TextField>

              {/* Selector de Formatos de Mercado */}
              <TextField
                select
                fullWidth
                size="small"
                label="Tamaño y Formato de Etiqueta"
                value={selectedFormatId}
                onChange={(e) => setSelectedFormatId(e.target.value as LabelStandardFormat)}
              >
                {LABEL_STANDARD_FORMATS.map((fmt) => (
                  <MenuItem key={fmt.id} value={fmt.id}>
                    {fmt.name}
                  </MenuItem>
                ))}
              </TextField>

              {/* Tarjeta de Especificación del Formato Seleccionado */}
              <Box sx={{ p: 2, bgcolor: "neutral.50", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", textTransform: "uppercase" }}>
                  Especificación de Salida
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {currentFormat.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {currentFormat.description}
                </Typography>
                <Chip
                  icon={<RatioIcon sx={{ fontSize: "14px !important" }} />}
                  label={`Dimensiones: ${currentFormat.widthMm}mm × ${currentFormat.heightMm}mm ${currentFormat.isGrid ? "(Pliego 3×8)" : ""}`}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1.5, fontWeight: 700 }}
                />
              </Box>

              {/* Opciones de Personalización Visual */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: "block" }}>
                  Elementos Visibles en el Rótulo:
                </Typography>
                <Stack spacing={0.5}>
                  <FormControlLabel
                    control={<Switch checked={showBrand} onChange={(e) => setShowBrand(e.target.checked)} size="small" />}
                    label={<Typography variant="body2">Encabezado Loro ERP</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={showDepartment} onChange={(e) => setShowDepartment(e.target.checked)} size="small" />}
                    label={<Typography variant="body2">Área / Departamento</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={showDate} onChange={(e) => setShowDate(e.target.checked)} size="small" />}
                    label={<Typography variant="body2">Fecha de Emisión</Typography>}
                  />
                </Stack>
              </Box>

              <Divider />

              {/* Botones de Acción */}
              <Button
                variant="contained"
                color="warning"
                size="large"
                startIcon={<PrintIcon />}
                onClick={handleTriggerPrint}
                disabled={printCodes.length === 0}
                sx={{
                  py: 1.4,
                  borderRadius: 2.5,
                  fontWeight: 800,
                  textTransform: "none",
                  boxShadow: "0 4px 14px rgba(245, 158, 11, 0.3)",
                }}
              >
                Imprimir {printCodes.length} Rótulo(s) Ahora
              </Button>

              <Button
                variant="outlined"
                startIcon={<CsvIcon />}
                onClick={handleExportCsv}
                disabled={printCodes.length === 0}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
              >
                Exportar Lote a Excel / CSV
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Panel de Previsualización WYSIWYG de la Hoja / Rótulo */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "neutral.50",
              minHeight: 520,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Previsualización en Pantalla
              </Typography>
              <Chip
                label={`${printCodes.length} Rótulo(s) a Imprimir`}
                size="small"
                color="warning"
                sx={{ fontWeight: 700 }}
              />
            </Stack>

            {loadingPreview ? (
              <Box sx={{ py: 14, textAlign: "center" }}>
                <CircularProgress size={38} sx={{ mb: 2, color: "primary.main" }} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Cargando rótulos del lote...
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Generando representaciones visuales de alta fidelidad
                </Typography>
              </Box>
            ) : printCodes.length === 0 ? (
              <Box sx={{ py: 10, textAlign: "center", color: "text.secondary" }}>
                <Typography variant="body2">No hay códigos cargados para imprimir.</Typography>
                <Typography variant="caption">Selecciona un lote o emite códigos en la sección de Lotes.</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  p: 3,
                  bgcolor: "#ffffff",
                  borderRadius: 2.5,
                  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)",
                  border: "1px solid",
                  borderColor: "divider",
                  maxHeight: 560,
                  overflowY: "auto",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  justifyContent: "center",
                }}
              >
                {printCodes.slice(0, currentFormat.isGrid ? 24 : 6).map((code) => {
                  const isQr = code.codeType === "QR_CODE";
                  const serial = (code.metadata?.serialNumber as string) || (code.metadata?.plateOrSerial as string);

                  return (
                    <Box
                      key={code.id}
                      sx={{
                        border: "1px dashed #cbd5e1",
                        borderRadius: 1.5,
                        p: 1.5,
                        width: currentFormat.id === "THERMAL_50x25" ? 200 : currentFormat.id === "BADGE_CR80" ? 280 : 220,
                        minHeight: currentFormat.id === "THERMAL_50x25" ? 100 : 130,
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "#ffffff",
                      }}
                    >
                      {showBrand && (
                        <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, color: "primary.main", letterSpacing: 0.5, textTransform: "uppercase" }}>
                          LORO ERP • CONTROL
                        </Typography>
                      )}
                      <Typography noWrap variant="body2" sx={{ fontWeight: 700, fontSize: "0.75rem", maxWidth: "100%", mt: 0.3 }}>
                        {code.title}
                      </Typography>

                      <Box sx={{ my: 0.5 }}>
                        {isQr ? (
                          <Box
                            component="img"
                            src={getQrCodeImageUrl(code.code, 120)}
                            alt={code.code}
                            sx={{ width: 68, height: 68 }}
                          />
                        ) : (
                          <Box
                            dangerouslySetInnerHTML={{
                              __html: generateBarcode128Svg(code.code, {
                                width: 170,
                                height: 45,
                                showText: true,
                              }),
                            }}
                          />
                        )}
                      </Box>

                      <Stack direction="row" spacing={1} sx={{ mt: 0.3 }} alignItems="center">
                        {showDepartment && code.department && (
                          <Typography sx={{ fontSize: "0.6rem", color: "text.secondary" }}>
                            {code.department}
                          </Typography>
                        )}
                        {serial && (
                          <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, fontFamily: "monospace", color: "text.primary" }}>
                            SN: {serial}
                          </Typography>
                        )}
                        {showDate && (
                          <Typography sx={{ fontSize: "0.58rem", color: "text.secondary" }}>
                            {new Date().toLocaleDateString("es-CO")}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
