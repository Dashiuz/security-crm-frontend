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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridActionsCellItemProps,
  GridRowId,
} from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";
import { HttpClient, ApiError } from "@/lib/api/client";
import Link from "next/link";

interface DataTableProps {
  title: string;
  endpoint: string;
  columns: GridColDef[];
  breadcrumbs: { label: string; href?: string }[];
  onCreate?: () => void;
  onEdit?: (id: string, row: any) => void;
  onDelete?: (id: string) => void;
  customActions?: (row: any) => React.ReactElement<GridActionsCellItemProps>[];
  refreshTrigger?: number;
  checkboxSelection?: boolean;
  onRowSelectionModelChange?: (newSelection: any) => void;
  getRowId?: (row: any) => GridRowId;
  infoDescription?: string;
  infoInstructions?: string;
}

export default function DataTable({
  title,
  endpoint,
  columns,
  breadcrumbs,
  onCreate,
  onEdit,
  onDelete,
  customActions,
  refreshTrigger,
  checkboxSelection = false,
  onRowSelectionModelChange,
  getRowId,
  infoDescription,
  infoInstructions,
}: DataTableProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] =
    useState<GridRowId | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

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
  }, [fetchData, refreshTrigger]);

  const handleDeleteClick = (id: GridRowId) => {
    setSelectedIdToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedIdToDelete) return;

    try {
      if (onDelete) {
        await onDelete?.(selectedIdToDelete.toString());
      } else {
        await HttpClient.delete(`${endpoint}/${selectedIdToDelete}`);
      }
      setRows((prev) => prev.filter((row) => row.id !== selectedIdToDelete));
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || "Error al eliminar el registro");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedIdToDelete(null);
    }
  };

  const actionsColumn: GridColDef = {
    field: "actions",
    type: "actions",
    headerName: "Acciones",
    width: 100,
    getActions: (params) => {
      const actions: React.ReactElement<GridActionsCellItemProps>[] = [];

      if (customActions) {
        actions.push(...customActions(params.row));
      }

      if (onEdit) {
        actions.push(
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon color="primary" />}
            label="Editar"
            onClick={() => onEdit(params.id.toString(), params.row)}
            showInMenu={false}
          />
        );
      }

      if (onDelete) {
        actions.push(
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon color="error" />}
            label="Borrar"
            onClick={() => handleDeleteClick(params.id)}
            showInMenu={false}
          />
        );
      }

      return actions;
    },
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
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h4" fontWeight="bold">
              {title}
            </Typography>
            {(infoDescription || infoInstructions) && (
              <Tooltip title="Información de la vista">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => setInfoDialogOpen(true)}
                  sx={{ mt: 0.5 }}
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
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
          getRowId={getRowId}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection={checkboxSelection}
          onRowSelectionModelChange={onRowSelectionModelChange}
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

      {/* Confimation Dialog for Delete */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            ¿Estás seguro de que deseas eliminar este registro? Esta acción no
            se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={loading}
            autoFocus
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info/Help Dialog */}
      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <InfoIcon color="primary" />
          Información: {title}
        </DialogTitle>
        <DialogContent dividers>
          {infoDescription && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Finalidad
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {infoDescription}
              </Typography>
            </Box>
          )}
          {infoInstructions && (
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Instrucciones de Uso
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                component="div"
              >
                <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                  {infoInstructions.split("\n").map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setInfoDialogOpen(false)}
            variant="contained"
            autoFocus
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
