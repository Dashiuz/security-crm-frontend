"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

interface CsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  templateColumns: string[];
  onImport: (
    data: Array<Record<string, string>>,
    fileName: string,
  ) => Promise<{
    status: string;
    totalRows: number;
    successRows: number;
    errorRows: number;
    errors?: Array<{ row: number; reason: string }>;
  }>;
  onSuccessRedirect?: () => void;
}

export default function CsvImportDialog({
  open,
  onClose,
  title,
  templateColumns,
  onImport,
  onSuccessRedirect,
}: CsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Array<Record<string, string>>>([]);
  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    status: string;
    totalRows: number;
    successRows: number;
    errorRows: number;
    errors?: Array<{ row: number; reason: string }>;
  } | null>(null);

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setColumns([]);
    setLoading(false);
    setErrorMsg(null);
    setImportResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parseCsvContent = (text: string) => {
    const lines = text
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new Error("El archivo CSV debe contener al menos la fila de cabeceras y un registro.");
    }

    // Determine delimiter (comma, semicolon, or tab)
    const firstLine = lines[0];
    let delimiter = ",";
    if (firstLine.includes(";")) delimiter = ";";
    else if (firstLine.includes("\t")) delimiter = "\t";

    const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ""));

    const rows: Array<Record<string, string>> = [];
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      const values = currentLine.split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ""));
      const rowObj: Record<string, string> = { id: String(i) };
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || "";
      });
      rows.push(rowObj);
    }

    const gridCols: GridColDef[] = headers.map((h) => ({
      field: h,
      headerName: h,
      flex: 1,
      minWidth: 130,
    }));

    return { rows, gridCols };
  };

  const [isDragging, setIsDragging] = useState(false);

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv") && !selectedFile.name.endsWith(".txt")) {
      setErrorMsg("Por favor seleccione un archivo en formato .csv");
      return;
    }

    setFile(selectedFile);
    setErrorMsg(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { rows, gridCols } = parseCsvContent(text);
        setParsedData(rows);
        setColumns(gridCols);
      } catch (err: any) {
        setErrorMsg(err.message || "Error al procesar la estructura del archivo CSV.");
      }
    };
    reader.onerror = () => {
      setErrorMsg("Error al leer el archivo.");
    };
    reader.readAsText(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleProcessImport = async () => {
    if (!parsedData.length || !file) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await onImport(parsedData, file.name);
      setImportResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || "Error durante el procesamiento del archivo en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const previewData = parsedData.slice(0, 100);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: 400 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {!file && !importResult && (
          <Box sx={{ py: 4, textAlign: "center", width: "100%" }}>
            <Paper
              variant="outlined"
              component="label"
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                boxSizing: "border-box",
                p: { xs: 4, sm: 6 },
                borderStyle: "dashed",
                borderWidth: 2,
                borderColor: isDragging ? "primary.dark" : "primary.main",
                bgcolor: isDragging ? "action.hover" : "background.default",
                cursor: "pointer",
                borderRadius: 3,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  bgcolor: "action.hover",
                  borderColor: "primary.dark",
                },
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input type="file" accept=".csv, .txt" hidden onChange={handleFileChange} />
              <CloudUploadIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Selecciona o arrastra un archivo .CSV
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                La estructura del archivo debe coincidir con los campos requeridos:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                {templateColumns.map((col) => (
                  <Chip key={col} label={col} size="small" variant="outlined" />
                ))}
              </Box>
            </Paper>
          </Box>
        )}

        {file && !importResult && (
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
                bgcolor: "primary.50",
                p: 1.5,
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Archivo: <strong>{file.name}</strong> ({parsedData.length} registros encontrados)
              </Typography>
              {parsedData.length > 100 && (
                <Chip
                  label="Mostrando vista previa de los primeros 100 registros"
                  color="warning"
                  size="small"
                />
              )}
            </Box>

            <Box sx={{ height: 350, width: "100%" }}>
              <DataGrid
                rows={previewData}
                columns={columns}
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                density="compact"
                disableRowSelectionOnClick
              />
            </Box>
          </Box>
        )}

        {importResult && (
          <Box sx={{ py: 3, textAlign: "center" }}>
            {importResult.status === "SUCCESS" && (
              <Box>
                <CheckCircleIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: "success.dark", mb: 1 }}>
                  ¡Carga Masiva Exitosa!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Se cargaron satisfactoriamente <strong>{importResult.successRows}</strong> registros en la base de datos.
                </Typography>
              </Box>
            )}

            {importResult.status === "PARTIAL" && (
              <Box>
                <ErrorIcon sx={{ fontSize: 64, color: "warning.main", mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: "warning.dark", mb: 1 }}>
                  Carga Completada con Advertencias
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Se procesaron <strong>{importResult.successRows}</strong> registros exitosos y <strong>{importResult.errorRows}</strong> con error.
                </Typography>
              </Box>
            )}

            {importResult.status === "FAILED" && (
              <Box>
                <ErrorIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: "error.dark", mb: 1 }}>
                  Error al Procesar el Archivo
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  No se pudo procesar la carga. A continuación los detalles:
                </Typography>
              </Box>
            )}

            {importResult.errors && importResult.errors.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 180, overflowY: "auto", textAlign: "left", bgcolor: "grey.50" }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 1 }}>
                  Reporte de Errores:
                </Typography>
                {importResult.errors.map((err, idx) => (
                  <Typography key={idx} variant="body2" color="error.main" sx={{ fontSize: "0.85rem", mb: 0.5 }}>
                    • Fila {err.row}: {err.reason}
                  </Typography>
                ))}
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {!importResult ? (
          <>
            <Button onClick={handleClose} color="inherit" disabled={loading}>
              Descartar
            </Button>
            {file && (
              <Button
                variant="contained"
                onClick={handleProcessImport}
                disabled={loading || parsedData.length === 0}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
              >
                {loading ? "Procesando Carga..." : "Proceder con la Carga"}
              </Button>
            )}
          </>
        ) : (
          <>
            {importResult.status !== "SUCCESS" && (
              <>
                <Button onClick={resetState} startIcon={<RefreshIcon />}>
                  Cargar Archivo Nuevo
                </Button>
                <Button onClick={handleProcessImport} variant="outlined" disabled={loading}>
                  Reintentar en Memoria
                </Button>
              </>
            )}
            <Button
              variant="contained"
              color={importResult.status === "SUCCESS" ? "success" : "primary"}
              onClick={() => {
                handleClose();
                if (onSuccessRedirect) onSuccessRedirect();
              }}
            >
              {importResult.status === "SUCCESS" ? "Ver Registros" : "Cerrar"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
