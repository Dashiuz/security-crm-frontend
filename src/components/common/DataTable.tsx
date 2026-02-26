"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Button,
  Stack,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowId,
} from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { HttpClient, ApiError } from "@/lib/api/client";
import Link from "next/link";

interface DataTableProps {
  title: string;
  endpoint: string;
  columns: GridColDef[];
  breadcrumbs: { label: string; href?: string }[];
  onCreate?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function DataTable({
  title,
  endpoint,
  columns,
  breadcrumbs,
  onCreate,
  onEdit,
  onDelete,
}: DataTableProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await HttpClient.get<any[]>(endpoint);
      setRows(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: GridRowId) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este registro?")) {
      try {
        await HttpClient.delete(`${endpoint}/${id}`);
        setRows((prev) => prev.filter((row) => row.id !== id));
      } catch (err) {
        const apiError = err as ApiError;
        alert(apiError.message || "Error al eliminar el registro");
      }
    }
  };

  const actionsColumn: GridColDef = {
    field: "actions",
    type: "actions",
    headerName: "Acciones",
    width: 100,
    getActions: (params) => [
      <GridActionsCellItem
        key="edit"
        icon={<EditIcon color="primary" />}
        label="Editar"
        onClick={() => onEdit?.(params.id.toString())}
        showInMenu={false}
      />,
      <GridActionsCellItem
        key="delete"
        icon={<DeleteIcon color="error" />}
        label="Borrar"
        onClick={() => handleDelete(params.id)}
        showInMenu={false}
      />,
    ],
  };

  const finalColumns = [...columns, actionsColumn];

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
            <MuiLink
              component={Link}
              underline="hover"
              color="inherit"
              href="/dashboard"
            >
              Dashboard
            </MuiLink>
            {breadcrumbs.map((bc, index) =>
              index === breadcrumbs.length - 1 ? (
                <Typography key={bc.label} color="text.primary">
                  {bc.label}
                </Typography>
              ) : (
                <MuiLink
                  key={bc.label}
                  component={Link}
                  underline="hover"
                  color="inherit"
                  href={bc.href || "#"}
                >
                  {bc.label}
                </MuiLink>
              ),
            )}
          </Breadcrumbs>
          <Typography variant="h4" fontWeight="bold">
            {title}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
          >
            Refrescar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreate}
            disabled={loading}
          >
            Crear Nuevo
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 500, width: "100%", p: 2, position: "relative" }}>
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
              bgcolor: "rgba(255,255,255,0.7)",
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <DataGrid
          rows={rows}
          columns={finalColumns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection={false}
          disableRowSelectionOnClick
          localeText={{
            noRowsLabel: "No hay datos disponibles",
            columnMenuSortAsc: "Orden ascendente",
            columnMenuSortDesc: "Orden descendente",
            columnMenuFilter: "Filtrar",
            columnMenuHideColumn: "Ocultar columna",
            columnMenuShowColumns: "Mostrar columnas",
          }}
          sx={{ border: "none" }}
        />
      </Paper>
    </Box>
  );
}
