"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import {
  DynamicFeed as BatchIcon,
  Save as SaveIcon,
  FileDownload as DownloadIcon,
  Print as PrintIcon,
  CheckCircle as SuccessIcon,
  Layers as LayersIcon,
  Edit as EditIcon,
  DriveFileRenameOutline as RenameIcon,
  SwapHoriz as SwapIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import {
  UniversalCodesApi,
  UniversalCode,
  CodeType,
  CodePurpose,
  BatchItemSummary,
  BatchUpdateItemPayload,
} from "@/lib/api/universal-codes";
import DepartmentAutocomplete from "./DepartmentAutocomplete";

interface BatchCodeSpokeProps {
  initialBatchId?: string;
  onSendBatchToPrintStation: (batchId: string, codes: UniversalCode[]) => void;
}

const PURPOSE_OPTIONS: { value: CodePurpose; label: string; recommendedType: CodeType; defaultTitle: string }[] = [
  { value: "INVENTORY_ASSET", label: "Activo / Radio / Dotación de Seguridad", recommendedType: "BARCODE_128", defaultTitle: "Cámara Domo Almacén" },
  { value: "PATROL_CHECKPOINT", label: "Punto de Marcación / Ronda Física", recommendedType: "QR_CODE", defaultTitle: "Punto Ronda Perímetro" },
  { value: "RESIDENT_VEHICLE", label: "Bicicleta / Vehículo de Residente", recommendedType: "QR_CODE", defaultTitle: "Rótulo Vehicular Residente" },
  { value: "EMPLOYEE_CREDENTIAL", label: "Carnet de Guardia / Empleado", recommendedType: "QR_CODE", defaultTitle: "Credencial Guardia Seguridad" },
  { value: "VISITOR_PASS", label: "Pase / Escarapela de Visitante", recommendedType: "BARCODE_128", defaultTitle: "Pase Visitante Control" },
  { value: "CORRESPONDENCE_PACKAGE", label: "Paquete de Correspondencia", recommendedType: "BARCODE_128", defaultTitle: "Rótulo Encomienda" },
  { value: "DOCUMENT_VERIFICATION", label: "Radicado / Verificación de Documento", recommendedType: "QR_CODE", defaultTitle: "Radicado Acta Turno" },
  { value: "OTHER_CUSTOM", label: "Finalidad Personalizada", recommendedType: "QR_CODE", defaultTitle: "Lote Especial Operativo" },
];

interface RowEditData {
  title: string;
  // Campos adaptables según la finalidad
  serialNumber?: string;
  brand?: string;
  internalAssetId?: string;
  floor?: string;
  targetIntervalMinutes?: string;
  postOrder?: string;
  documentNumber?: string;
  operationalRole?: string;
  bloodType?: string;
  unitNumber?: string;
  plateOrSerial?: string;
  parkingSpot?: string;
}

export default function BatchCodeSpoke({
  initialBatchId,
  onSendBatchToPrintStation,
}: BatchCodeSpokeProps) {
  // Parámetros de Generación de Lote
  const [codeType, setCodeType] = useState<CodeType>("BARCODE_128");
  const [purpose, setPurpose] = useState<CodePurpose>("INVENTORY_ASSET");
  const [quantity, setQuantity] = useState<number>(20);
  const [titlePattern, setTitlePattern] = useState("Cámara Domo Almacén");
  const [department, setDepartment] = useState("Almacén");
  const [customBatchId, setCustomBatchId] = useState("");

  // Estado del flujo y Fast Batch Editor
  const [activeBatchId, setActiveBatchId] = useState<string | null>(initialBatchId || null);
  const [batchItems, setBatchItems] = useState<UniversalCode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [availableBatches, setAvailableBatches] = useState<BatchItemSummary[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cargar lista de lotes registrados para selección rápida
  useEffect(() => {
    UniversalCodesApi.listBatches()
      .then((data) => setAvailableBatches(data || []))
      .catch(() => {});
  }, []);

  // Estados editables en línea por cada ítem
  const [editedData, setEditedData] = useState<Record<string, RowEditData>>({});

  // Estados para Renombrado Masivo Secuencial
  const [renameOpen, setRenameOpen] = useState(false);
  const [renamePrefix, setRenamePrefix] = useState("");
  const [keepNumbering, setKeepNumbering] = useState(true);

  const handleApplyBulkRename = () => {
    const prefix = renamePrefix.trim();
    if (!prefix) return;

    setEditedData((prev) => {
      const updated = { ...prev };
      batchItems.forEach((item, index) => {
        const current = updated[item.id] || { title: item.title };
        const num = index + 1;
        const newTitle = keepNumbering ? `${prefix} #${num}` : prefix;
        updated[item.id] = { ...current, title: newTitle };
      });
      return updated;
    });

    setRenameOpen(false);
    setFeedbackMessage({
      type: "success",
      text: `¡Títulos renombrados exitosamente a '${prefix}${keepNumbering ? " #1, #2..." : ""}'! Presiona 'Guardar Todos los Cambios' para persistir.`,
    });
  };

  const handlePurposeChange = (newPurpose: CodePurpose) => {
    setPurpose(newPurpose);
    const target = PURPOSE_OPTIONS.find((p) => p.value === newPurpose);
    if (target) {
      setCodeType(target.recommendedType);
      setTitlePattern(target.defaultTitle);
    }
  };

  const loadBatchItems = useCallback(async (bId: string) => {
    try {
      setIsLoadingExisting(true);
      setFeedbackMessage(null);
      const res = await UniversalCodesApi.list({ batchId: bId, limit: 100 });
      setBatchItems(res.data || []);

      // Poblar el estado editable dinámico
      const initialMap: Record<string, RowEditData> = {};
      for (const item of res.data) {
        initialMap[item.id] = {
          title: item.title,
          serialNumber: (item.metadata?.serialNumber as string) || (item.metadata?.plateOrSerial as string) || "",
          brand: (item.metadata?.brand as string) || "",
          internalAssetId: (item.metadata?.internalAssetId as string) || "",
          floor: (item.metadata?.floor as string) || "",
          targetIntervalMinutes: item.metadata?.targetIntervalMinutes ? String(item.metadata.targetIntervalMinutes) : "",
          postOrder: (item.metadata?.postOrder as string) || "",
          documentNumber: (item.metadata?.documentNumber as string) || "",
          operationalRole: (item.metadata?.operationalRole as string) || "",
          bloodType: (item.metadata?.bloodType as string) || "",
          unitNumber: (item.metadata?.unitNumber as string) || "",
          plateOrSerial: (item.metadata?.plateOrSerial as string) || (item.metadata?.serialNumber as string) || "",
          parkingSpot: (item.metadata?.parkingSpot as string) || "",
        };
      }
      setEditedData(initialMap);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar el lote.";
      setFeedbackMessage({ type: "error", text: msg });
    } finally {
      setIsLoadingExisting(false);
    }
  }, []);

  useEffect(() => {
    if (initialBatchId) {
      setActiveBatchId(initialBatchId);
      loadBatchItems(initialBatchId);
    }
  }, [initialBatchId, loadBatchItems]);

  const handleGenerateBatch = async () => {
    if (!titlePattern.trim()) {
      setFeedbackMessage({ type: "error", text: "Por favor define un patrón o título base para el lote." });
      return;
    }

    try {
      setIsGenerating(true);
      setFeedbackMessage(null);

      const items = await UniversalCodesApi.createBatch({
        codeType,
        purpose,
        quantity: Math.min(Math.max(quantity, 1), 100),
        titlePattern: titlePattern.trim(),
        department: department.trim() || undefined,
        batchId: customBatchId.trim() ? customBatchId.trim().toUpperCase() : undefined,
      });

      if (items.length > 0) {
        const generatedBId = items[0].batchId || "LOTE-AUTOGENERADO";
        setActiveBatchId(generatedBId);
        setBatchItems(items);

        // Inicializar filas editables adaptativas
        const initialMap: Record<string, RowEditData> = {};
        for (const item of items) {
          initialMap[item.id] = {
            title: item.title,
            serialNumber: "",
            brand: "",
            internalAssetId: "",
            floor: "1",
            targetIntervalMinutes: "60",
            postOrder: "",
            documentNumber: "",
            operationalRole: "Guarda de Seguridad",
            bloodType: "O+",
            unitNumber: "",
            plateOrSerial: "",
            parkingSpot: "",
          };
        }
        setEditedData(initialMap);
        setFeedbackMessage({
          type: "success",
          text: `¡Lote '${generatedBId}' generado con éxito (${items.length} códigos)! Completa las preguntas operacionales a continuación.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar el lote masivo.";
      setFeedbackMessage({ type: "error", text: msg });
    } finally {
      setIsGenerating(false);
    }
  };

  const activePurpose: CodePurpose = batchItems[0]?.purpose || purpose;

  const handleSaveAllSerials = async () => {
    if (!activeBatchId || batchItems.length === 0) return;

    try {
      setIsSavingBatch(true);
      setFeedbackMessage(null);

      const payloadItems: BatchUpdateItemPayload[] = batchItems.map((item) => {
        const edits = editedData[item.id] || { title: item.title };
        const updatedMetadata: Record<string, unknown> = { ...(item.metadata || {}) };

        if (activePurpose === "INVENTORY_ASSET") {
          if (edits.serialNumber) updatedMetadata.serialNumber = edits.serialNumber.trim();
          if (edits.brand) updatedMetadata.brand = edits.brand.trim();
          if (edits.internalAssetId) updatedMetadata.internalAssetId = edits.internalAssetId.trim();
        } else if (activePurpose === "PATROL_CHECKPOINT") {
          if (edits.floor) updatedMetadata.floor = edits.floor.trim();
          if (edits.targetIntervalMinutes) updatedMetadata.targetIntervalMinutes = parseInt(edits.targetIntervalMinutes, 10) || 60;
          if (edits.postOrder) updatedMetadata.postOrder = edits.postOrder.trim();
        } else if (activePurpose === "EMPLOYEE_CREDENTIAL") {
          if (edits.documentNumber) updatedMetadata.documentNumber = edits.documentNumber.trim();
          if (edits.operationalRole) updatedMetadata.operationalRole = edits.operationalRole.trim();
          if (edits.bloodType) updatedMetadata.bloodType = edits.bloodType.trim();
        } else if (activePurpose === "RESIDENT_VEHICLE") {
          if (edits.unitNumber) updatedMetadata.unitNumber = edits.unitNumber.trim();
          if (edits.plateOrSerial) {
            updatedMetadata.plateOrSerial = edits.plateOrSerial.trim();
            updatedMetadata.serialNumber = edits.plateOrSerial.trim();
          }
          if (edits.parkingSpot) updatedMetadata.parkingSpot = edits.parkingSpot.trim();
        } else {
          if (edits.serialNumber) updatedMetadata.serialNumber = edits.serialNumber.trim();
          if (edits.brand) updatedMetadata.brand = edits.brand.trim();
        }

        return {
          id: item.id,
          title: edits.title.trim() || item.title,
          metadata: updatedMetadata,
        };
      });

      const updated = await UniversalCodesApi.updateBatch({ items: payloadItems });
      setBatchItems(updated);
      setFeedbackMessage({
        type: "success",
        text: `¡Todos los datos operativos del lote '${activeBatchId}' fueron guardados exitosamente!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar los datos del lote.";
      setFeedbackMessage({ type: "error", text: msg });
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handleExportCsv = () => {
    if (batchItems.length === 0) return;

    let headers: string[] = [];
    if (activePurpose === "PATROL_CHECKPOINT") {
      headers = ["ID", "Código Canónico", "Lote", "Punto Ronda (Título)", "Piso / Nivel", "Frecuencia (min)", "Consigna", "Departamento", "Estado"];
    } else if (activePurpose === "EMPLOYEE_CREDENTIAL") {
      headers = ["ID", "Código Canónico", "Lote", "Nombre Guardia (Título)", "Cédula", "Cargo", "RH", "Departamento", "Estado"];
    } else if (activePurpose === "RESIDENT_VEHICLE") {
      headers = ["ID", "Código Canónico", "Lote", "Unidad / Apto (Título)", "Placa / Marco", "Celda Parqueadero", "Departamento", "Estado"];
    } else {
      headers = ["ID", "Código Canónico", "Lote", "Título Activo", "Serial Fábrica", "Marca / Modelo", "Plaqueta Interna", "Departamento", "Estado"];
    }

    const rows = batchItems.map((item) => {
      const edits = editedData[item.id] || { title: item.title };
      if (activePurpose === "PATROL_CHECKPOINT") {
        return [
          item.id,
          item.code,
          item.batchId || "",
          `"${(edits.title || item.title).replace(/"/g, '""')}"`,
          `"${(edits.floor || (item.metadata?.floor as string) || "").replace(/"/g, '""')}"`,
          edits.targetIntervalMinutes || String(item.metadata?.targetIntervalMinutes || "60"),
          `"${(edits.postOrder || (item.metadata?.postOrder as string) || "").replace(/"/g, '""')}"`,
          item.department || "",
          item.status,
        ];
      } else if (activePurpose === "EMPLOYEE_CREDENTIAL") {
        return [
          item.id,
          item.code,
          item.batchId || "",
          `"${(edits.title || item.title).replace(/"/g, '""')}"`,
          `"${(edits.documentNumber || (item.metadata?.documentNumber as string) || "").replace(/"/g, '""')}"`,
          `"${(edits.operationalRole || (item.metadata?.operationalRole as string) || "").replace(/"/g, '""')}"`,
          edits.bloodType || (item.metadata?.bloodType as string) || "",
          item.department || "",
          item.status,
        ];
      } else if (activePurpose === "RESIDENT_VEHICLE") {
        return [
          item.id,
          item.code,
          item.batchId || "",
          `"${(edits.title || item.title).replace(/"/g, '""')}"`,
          `"${(edits.plateOrSerial || (item.metadata?.plateOrSerial as string) || "").replace(/"/g, '""')}"`,
          `"${(edits.parkingSpot || (item.metadata?.parkingSpot as string) || "").replace(/"/g, '""')}"`,
          item.department || "",
          item.status,
        ];
      } else {
        return [
          item.id,
          item.code,
          item.batchId || "",
          `"${(edits.title || item.title).replace(/"/g, '""')}"`,
          `"${(edits.serialNumber || (item.metadata?.serialNumber as string) || "").replace(/"/g, '""')}"`,
          `"${(edits.brand || (item.metadata?.brand as string) || "").replace(/"/g, '""')}"`,
          `"${(edits.internalAssetId || (item.metadata?.internalAssetId as string) || "").replace(/"/g, '""')}"`,
          item.department || "",
          item.status,
        ];
      }
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lote_${activeBatchId || "export"}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      {/* Selector de Lotes Existentes para Re-edición Rápida */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3.5, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "neutral.50" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <LayersIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                ¿Deseas completar o editar un lote emitido anteriormente?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Selecciona cualquier lote de la lista para cargarlo en el Fast Batch Editor interactivo.
              </Typography>
            </Box>
          </Stack>

          <TextField
            select
            size="small"
            label="Editar lote existente"
            value={activeBatchId || ""}
            onChange={(e) => {
              const bId = e.target.value;
              if (bId) {
                setActiveBatchId(bId);
                loadBatchItems(bId);
              }
            }}
            sx={{ minWidth: 260, bgcolor: "background.paper" }}
          >
            <MenuItem value="">
              <em>-- Seleccionar lote a editar --</em>
            </MenuItem>
            {availableBatches.map((b) => (
              <MenuItem key={b.batchId} value={b.batchId}>
                {b.batchId} ({b.count} ítems) • {b.purpose}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {/* Formulario de Emisión Masiva (visible solo si no estamos editando un lote activo) */}
      {!activeBatchId && (
        <Paper elevation={0} sx={{ p: 3.5, mb: 4, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <BatchIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Generador Masivo de Códigos por Lote
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Emite bloques de hasta 100 códigos con un identificador de lote inmutable y autocompleta sus preguntas operativas en el Fast Editor.
          </Typography>

          {feedbackMessage && (
            <Alert severity={feedbackMessage.type} sx={{ mb: 3 }} onClose={() => setFeedbackMessage(null)}>
              {feedbackMessage.text}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Finalidad Operativa del Lote"
                value={purpose}
                onChange={(e) => handlePurposeChange(e.target.value as CodePurpose)}
              >
                {PURPOSE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Tipo de Simbología"
                value={codeType}
                onChange={(e) => setCodeType(e.target.value as CodeType)}
              >
                <MenuItem value="QR_CODE">Código QR Bidimensional</MenuItem>
                <MenuItem value="BARCODE_128">Código de Barras Lineal (Code 128)</MenuItem>
                <MenuItem value="BARCODE_EAN13">Código de Barras EAN-13 (13 dígitos)</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                fullWidth
                size="small"
                required
                label="Patrón o Título Base *"
                placeholder="Ej: Cámara Domo Almacén, Punto Ronda Sector, Credencial Guardia"
                value={titlePattern}
                onChange={(e) => setTitlePattern(e.target.value)}
                helperText="Se generarán títulos secuenciales automáticamente (ej: 'Cámara Domo Almacén #01', '#02', etc.)"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Cantidad de Códigos"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                helperText="Máximo 100 códigos por tanda"
                InputProps={{ inputProps: { min: 1, max: 100 } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <DepartmentAutocomplete
                value={department}
                onChange={setDepartment}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Identificador de Lote (Opcional)"
                placeholder="Ej: LOTE-202611-CAMARAS (Se autogenera si se omite)"
                value={customBatchId}
                onChange={(e) => setCustomBatchId(e.target.value)}
                helperText="Identificador único para filtrar e imprimir todo el lote junto."
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleGenerateBatch}
                disabled={isGenerating}
                sx={{
                  py: 1.5,
                  borderRadius: 2.5,
                  fontWeight: 800,
                  textTransform: "none",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                }}
              >
                {isGenerating ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  `Generar Lote de ${quantity} Códigos y Abrir Fast Editor`
                )}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Spoke Fast Batch Editor */}
      {activeBatchId && (
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "primary.light",
              bgcolor: "primary.50",
            }}
          >
            {/* Fila 1: Cabecera Informativa con Badges a la izquierda y Botón de Salida a la derecha */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
              sx={{ mb: 1.5 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <Chip
                  label={`LOTE ACTIVO: ${activeBatchId}`}
                  color="primary"
                  sx={{ fontWeight: 800, fontFamily: "monospace", fontSize: "0.85rem" }}
                />
                <Chip
                  label={`${batchItems.length} ítems`}
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`Finalidad: ${activePurpose}`}
                  size="small"
                  color="secondary"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>

              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<SwapIcon />}
                onClick={() => {
                  setActiveBatchId(null);
                  setBatchItems([]);
                  setEditedData({});
                  setRenameOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                }}
              >
                Cambiar Lote / Nuevo
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Edita directamente en las celdas operativas o utiliza las herramientas en bloque. Presiona <b>Guardar Todos los Cambios</b> para persistirlos.
            </Typography>

            {/* Fila 2: Barra de Herramientas y Acciones Equilibrada */}
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: "#ffffff",
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "stretch", md: "center" },
                gap: 2,
              }}
            >
              {/* Lado Izquierdo: Herramientas de Edición en Bloque */}
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  variant={renameOpen ? "contained" : "outlined"}
                  color="primary"
                  size="medium"
                  startIcon={<RenameIcon />}
                  onClick={() => {
                    if (!renameOpen) {
                      const firstTitle = batchItems[0]?.title || "";
                      const stripped = firstTitle.replace(/\s*#\d+.*$/, "");
                      setRenamePrefix(stripped || "Sensor");
                    }
                    setRenameOpen((prev) => !prev);
                  }}
                  sx={{ height: 38, textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  {renameOpen ? "Cerrar Renombrador" : "Renombrar Títulos en Masa"}
                </Button>
              </Stack>

              {/* Lado Derecho: Acciones de Salida y Guardado Simétricas */}
              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={{ xs: "flex-start", md: "flex-end" }} flexWrap="wrap">
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportCsv}
                  disabled={batchItems.length === 0}
                  sx={{ height: 38, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                >
                  Exportar CSV
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  size="medium"
                  startIcon={<PrintIcon />}
                  onClick={() => onSendBatchToPrintStation(activeBatchId, batchItems)}
                  disabled={batchItems.length === 0}
                  sx={{ height: 38, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                >
                  Imprimir Lote
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  size="medium"
                  startIcon={isSavingBatch ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveAllSerials}
                  disabled={isSavingBatch || batchItems.length === 0}
                  sx={{ height: 38, borderRadius: 2, textTransform: "none", fontWeight: 800, px: 2.5 }}
                >
                  Guardar Todos los Cambios
                </Button>
              </Stack>
            </Paper>

            {/* Panel Desplegable Integrado: Renombrado Masivo Secuencial */}
            {renameOpen && (
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: "#ffffff",
                  border: "1.5px solid",
                  borderColor: "primary.main",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.12)",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                  <RenameIcon color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    Renombrado Secuencial Masivo de Títulos ({batchItems.length} ítems)
                  </Typography>
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Escribe el nuevo nombre base. El sistema conservará el diferenciador numérico correlativo (#1, #2, ...) para cada uno de los ítems de este lote.
                </Typography>

                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Nuevo Nombre Base / Prefijo *"
                      placeholder="Ej: Sensor Domo Almacén, Cámara PTZ, Radio Motorola"
                      value={renamePrefix}
                      onChange={(e) => setRenamePrefix(e.target.value)}
                      autoFocus
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Chip
                      variant="outlined"
                      color="primary"
                      label={`Vista previa: "${renamePrefix.trim() || 'Ítem'}${keepNumbering ? ' #1' : ''}", "${renamePrefix.trim() || 'Ítem'}${keepNumbering ? ' #2' : ''}"...`}
                      sx={{ fontWeight: 700 }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center">
                      <Button
                        size="small"
                        onClick={() => setRenameOpen(false)}
                        sx={{ textTransform: "none", fontWeight: 700 }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<CheckIcon />}
                        disabled={!renamePrefix.trim()}
                        onClick={handleApplyBulkRename}
                        sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 700, px: 2 }}
                      >
                        Aplicar a los {batchItems.length} Ítems
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Paper>

          {feedbackMessage && (
            <Alert severity={feedbackMessage.type} sx={{ mb: 3 }} onClose={() => setFeedbackMessage(null)}>
              {feedbackMessage.text}
            </Alert>
          )}

          {/* Cuadrícula Interactiva Tipo Hoja de Cálculo Adaptativa */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
            {isLoadingExisting ? (
              <Box sx={{ p: 6, textAlign: "center" }}>
                <CircularProgress size={32} />
                <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
                  Cargando ítems del lote...
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 620 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, width: 60 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 800, width: 180 }}>Código Canónico</TableCell>

                      {/* Encabezados Dinámicos según la Finalidad */}
                      {activePurpose === "PATROL_CHECKPOINT" ? (
                        <>
                          <TableCell sx={{ fontWeight: 800, minWidth: 220 }}>Punto / Sector de Ronda (Título) *</TableCell>
                          <TableCell sx={{ fontWeight: 800, width: 140 }}>Piso / Nivel</TableCell>
                          <TableCell sx={{ fontWeight: 800, width: 150 }}>Frecuencia (min)</TableCell>
                          <TableCell sx={{ fontWeight: 800, minWidth: 260 }}>Consigna de Verificación</TableCell>
                        </>
                      ) : activePurpose === "EMPLOYEE_CREDENTIAL" ? (
                        <>
                          <TableCell sx={{ fontWeight: 800, minWidth: 220 }}>Nombre del Guardia (Título) *</TableCell>
                          <TableCell sx={{ fontWeight: 800, width: 170 }}>Cédula / Documento *</TableCell>
                          <TableCell sx={{ fontWeight: 800, width: 190 }}>Cargo Operativo</TableCell>
                          <TableCell sx={{ fontWeight: 800, width: 120 }}>Grupo RH</TableCell>
                        </>
                      ) : activePurpose === "RESIDENT_VEHICLE" ? (
                        <>
                          <TableCell sx={{ fontWeight: 800, minWidth: 200 }}>Unidad / Apartamento (Título) *</TableCell>
                          <TableCell sx={{ fontWeight: 800, width: 180 }}>Placa o Serial Marco *</TableCell>
                          <TableCell sx={{ fontWeight: 800, width: 180 }}>Celda Parqueadero</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell sx={{ fontWeight: 800, minWidth: 220 }}>Nombre del Activo (Título) *</TableCell>
                          <TableCell sx={{ fontWeight: 800, minWidth: 220 }}>Número de Serie de Fábrica *</TableCell>
                          <TableCell sx={{ fontWeight: 800, minWidth: 180 }}>Marca / Modelo</TableCell>
                          <TableCell sx={{ fontWeight: 800, width: 180 }}>Plaqueta Interna</TableCell>
                        </>
                      )}

                      <TableCell align="right" sx={{ fontWeight: 800, width: 90 }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batchItems.map((item, index) => {
                      const edits = editedData[item.id] || { title: item.title };
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                              #{index + 1}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: "primary.main" }}>
                              {item.code}
                            </Typography>
                          </TableCell>

                          {/* Celdas Dinámicas: PUNTOS DE RONDA */}
                          {activePurpose === "PATROL_CHECKPOINT" ? (
                            <>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={edits.title}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), title: val },
                                    }));
                                  }}
                                  sx={{ "& input": { py: 0.8, fontSize: "0.875rem" } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Ej: Sótano 2"
                                  value={edits.floor || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), floor: val },
                                    }));
                                  }}
                                  sx={{ "& input": { py: 0.8, fontSize: "0.875rem" } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  placeholder="60"
                                  value={edits.targetIntervalMinutes || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), targetIntervalMinutes: val },
                                    }));
                                  }}
                                  sx={{ "& input": { py: 0.8, fontSize: "0.875rem" } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Consigna obligatoria de marcación..."
                                  value={edits.postOrder || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), postOrder: val },
                                    }));
                                  }}
                                  sx={{ "& input": { py: 0.8, fontSize: "0.875rem" } }}
                                />
                              </TableCell>
                            </>
                          ) : activePurpose === "EMPLOYEE_CREDENTIAL" ? (
                            <>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={edits.title}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), title: val },
                                    }));
                                  }}
                                  sx={{ "& input": { py: 0.8, fontSize: "0.875rem" } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Ej: 102049281"
                                  value={edits.documentNumber || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), documentNumber: val },
                                    }));
                                  }}
                                  sx={{
                                    "& input": {
                                      py: 0.8,
                                      fontSize: "0.875rem",
                                      fontWeight: 600,
                                      bgcolor: edits.documentNumber ? "success.50" : "transparent",
                                    },
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Guarda de Seguridad"
                                  value={edits.operationalRole || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), operationalRole: val },
                                    }));
                                  }}
                                  sx={{ "& input": { py: 0.8, fontSize: "0.875rem" } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="O+"
                                  value={edits.bloodType || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), bloodType: val },
                                    }));
                                  }}
                                  sx={{ "& input": { py: 0.8, fontSize: "0.875rem" } }}
                                />
                              </TableCell>
                            </>
                          ) : activePurpose === "RESIDENT_VEHICLE" ? (
                            <>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={edits.title}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), title: val },
                                    }));
                                  }}
                                  sx={{ "& input": { py: 0.8, fontSize: "0.875rem" } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Ej: ABC-123 / GW-99"
                                  value={edits.plateOrSerial || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), plateOrSerial: val },
                                    }));
                                  }}
                                  sx={{
                                    "& input": {
                                      py: 0.8,
                                      fontSize: "0.875rem",
                                      fontWeight: 600,
                                      bgcolor: edits.plateOrSerial ? "success.50" : "transparent",
                                    },
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Bahía 14"
                                  value={edits.parkingSpot || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), parkingSpot: val },
                                    }));
                                  }}
                                  sx={{ "& input": { py: 0.8, fontSize: "0.875rem" } }}
                                />
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={edits.title}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), title: val },
                                    }));
                                  }}
                                  sx={{ "& input": { py: 0.8, fontSize: "0.875rem" } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Ej: SN-998234 (Escanear o teclear)..."
                                  value={edits.serialNumber || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), serialNumber: val },
                                    }));
                                  }}
                                  sx={{
                                    "& input": {
                                      py: 0.8,
                                      fontSize: "0.875rem",
                                      fontWeight: 600,
                                      bgcolor: edits.serialNumber ? "success.50" : "transparent",
                                    },
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Ej: Motorola / Hikvision"
                                  value={edits.brand || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), brand: val },
                                    }));
                                  }}
                                  sx={{ "& input": { py: 0.8, fontSize: "0.875rem" } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Ej: ACT-002"
                                  value={edits.internalAssetId || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditedData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...(prev[item.id] || edits), internalAssetId: val },
                                    }));
                                  }}
                                  sx={{ "& input": { py: 0.8, fontSize: "0.875rem" } }}
                                />
                              </TableCell>
                            </>
                          )}

                          <TableCell align="right">
                            <Chip
                              label={item.status === "ACTIVE" ? "Activo" : "Inactivo"}
                              size="small"
                              color={item.status === "ACTIVE" ? "success" : "default"}
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
