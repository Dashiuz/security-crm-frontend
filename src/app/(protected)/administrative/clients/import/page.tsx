"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Breadcrumbs,
  Link,
  Paper,
  Alert,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  Business as ClientIcon,
} from "@mui/icons-material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";

const templateColumns = [
  "nit",
  "name",
  "email",
  "phone",
  "address",
  "city",
  "sector",
  "internalCode",
  "contractNumber",
];

export default function ImportClientsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

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

  const parseCsvContent = (text: string) => {
    const lines = text
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new Error("El archivo CSV debe contener al menos la fila de cabeceras y un registro.");
    }

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
      minWidth: 140,
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
        setErrorMsg(err.message || "Error al procesar el archivo CSV.");
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
      const res = await HttpClient.post<{
        status: string;
        totalRows: number;
        successRows: number;
        errorRows: number;
        errors?: Array<{ row: number; reason: string }>;
      }>("/client/import/csv", {
        data: parsedData,
        fileName: file.name,
      });

      setImportResult(res);
      if (res.status === "SUCCESS") {
        showSuccess(`Se importaron ${res.successRows} clientes con éxito.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error durante el procesamiento del archivo.");
    } finally {
      setLoading(false);
    }
  };

  const previewData = parsedData.slice(0, 100);

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            router.push("/administrative/clients");
          }}
          sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
        >
          Mis Clientes
        </Link>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            router.push("/administrative/clients");
          }}
          sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
        >
          Clientes
        </Link>
        <Typography color="text.primary">Cargar Clientes Existentes</Typography>
      </Breadcrumbs>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/administrative/clients")}
            sx={{ borderRadius: 2 }}
          >
            Volver a Clientes
          </Button>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Carga Masiva de Clientes (.CSV)
          </Typography>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <CardContent sx={{ p: 4 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMsg}
            </Alert>
          )}

          {!file && !importResult && (
            <Box sx={{ py: 6, textAlign: "center", width: "100%" }}>
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
                <CloudUploadIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Selecciona o arrastra el archivo CSV de Clientes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  El archivo debe contener las cabeceras recomendadas para la importación:
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
                  bgcolor: "grey.100",
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Archivo: <strong>{file.name}</strong> ({parsedData.length} registros listos para procesar)
                </Typography>
                {parsedData.length > 100 && (
                  <Chip
                    label="Previsualizando primeros 100 registros"
                    color="warning"
                    size="small"
                  />
                )}
              </Box>

              <Box sx={{ height: 420, width: "100%", mb: 3 }}>
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

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button onClick={resetState} color="inherit" disabled={loading}>
                  Descartar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleProcessImport}
                  disabled={loading || parsedData.length === 0}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  {loading ? "Procesando Importación..." : "Proceder con la Carga"}
                </Button>
              </Box>
            </Box>
          )}

          {importResult && (
            <Box sx={{ py: 4, textAlign: "center" }}>
              {importResult.status === "SUCCESS" && (
                <Box>
                  <CheckCircleIcon sx={{ fontSize: 72, color: "success.main", mb: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 600, color: "success.dark", mb: 1 }}>
                    ¡Carga de Clientes Completada!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Se procesaron y crearon <strong>{importResult.successRows}</strong> clientes satisfactoriamente.
                  </Typography>
                </Box>
              )}

              {importResult.status === "PARTIAL" && (
                <Box>
                  <ErrorIcon sx={{ fontSize: 72, color: "warning.main", mb: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 600, color: "warning.dark", mb: 1 }}>
                    Carga Parcial de Clientes
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Se cargaron <strong>{importResult.successRows}</strong> clientes con éxito y <strong>{importResult.errorRows}</strong> fallaron.
                  </Typography>
                </Box>
              )}

              {importResult.status === "FAILED" && (
                <Box>
                  <ErrorIcon sx={{ fontSize: 72, color: "error.main", mb: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 600, color: "error.dark", mb: 1 }}>
                    Falló la Carga del Archivo
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Ningún registro pudo ser cargado. Revisa los motivos a continuación:
                  </Typography>
                </Box>
              )}

              {importResult.errors && importResult.errors.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2.5, maxHeight: 200, overflowY: "auto", textAlign: "left", bgcolor: "grey.50", mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Detalle de Errores:
                  </Typography>
                  {importResult.errors.map((err, idx) => (
                    <Typography key={idx} variant="body2" color="error.main" sx={{ mb: 0.5 }}>
                      • Fila {err.row}: {err.reason}
                    </Typography>
                  ))}
                </Paper>
              )}

              <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                {importResult.status !== "SUCCESS" && (
                  <>
                    <Button onClick={resetState} startIcon={<RefreshIcon />} variant="outlined">
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
                  onClick={() => router.push("/administrative/clients")}
                  sx={{ borderRadius: 2 }}
                >
                  Ir al Listado de Clientes
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
