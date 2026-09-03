"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  ToggleButton,
  ToggleButtonGroup,
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
  RemoveCircle as RemoveCircleIcon,
  InfoOutlined as InfoIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { HttpClient, ApiError } from "@/lib/api/client";
import Link from "next/link";

interface DataTableProps {
  title: string;
  endpoint?: string;
  columns: GridColDef[];
  breadcrumbs?: { label: string; href?: string }[];
  onCreate?: () => void;
  onEdit?: (id: string, row: any) => void;
  onDelete?: (id: string, row?: any) => void;
  onView?: (row: any) => void;
  customActions?: (row: any) => React.ReactElement<GridActionsCellItemProps>[];
  deleteIcon?: React.ReactElement;
  refreshTrigger?: number;
  checkboxSelection?: boolean;
  onRowSelectionModelChange?: (newSelection: any) => void;
  getRowId?: (row: any) => GridRowId;
  infoDescription?: string;
  infoInstructions?: string;
  rows?: any[];
  hideCreateButton?: boolean;
  hideStatusFilter?: boolean;
  extraHeaderActions?: React.ReactNode;
}

export default function DataTable({
  title,
  endpoint,
  columns,
  breadcrumbs,
  onCreate,
  onEdit,
  onDelete,
  onView,
  customActions,
  deleteIcon,
  refreshTrigger,
  checkboxSelection = false,
  onRowSelectionModelChange,
  getRowId,
  infoDescription,
  infoInstructions,
  rows: externalRows,
  hideCreateButton = false,
  hideStatusFilter = false,
  extraHeaderActions,
}: DataTableProps) {
  const [internalRows, setInternalRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] =
    useState<GridRowId | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  const activeRows = externalRows !== undefined ? externalRows : internalRows;

  const fetchData = useCallback(async () => {
    if (externalRows !== undefined || !endpoint) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await HttpClient.get<any[]>(endpoint);
      setInternalRows(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [endpoint, externalRows]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const filteredRows = useMemo(() => {
    if (hideStatusFilter) return activeRows;
    if (statusFilter === "ACTIVE") {
      return activeRows.filter((r) => r.isActive !== false && r.isRetired !== true);
    }
    if (statusFilter === "INACTIVE") {
      return activeRows.filter((r) => r.isActive === false || r.isRetired === true);
    }
    return activeRows;
  }, [activeRows, statusFilter, hideStatusFilter]);

  const handleDeleteClick = (id: GridRowId, row: any) => {
    if (onDelete) {
      onDelete(id.toString(), row);
      return;
    }
    setSelectedIdToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedIdToDelete) return;

    try {
      await HttpClient.delete(`${endpoint}/${selectedIdToDelete}`);
      setInternalRows((prev) => prev.filter((row) => row.id !== selectedIdToDelete));
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
    width: 120,
    getActions: (params) => {
      const actions: React.ReactElement<GridActionsCellItemProps>[] = [];

      if (customActions) {
        actions.push(...customActions(params.row));
      }

      if (onView) {
        actions.push(
          <GridActionsCellItem
            key="view"
            icon={<VisibilityIcon color="info" />}
            label="Ver Detalle"
            title="Ver Detalle"
            onClick={() => onView(params.row)}
            showInMenu={false}
          />
        );
      }

      if (onEdit) {
        actions.push(
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon color="primary" />}
            label="Editar"
            title="Editar"
            onClick={() => onEdit(params.id.toString(), params.row)}
            showInMenu={false}
          />
        );
      }

      const isRowInactive = params.row?.isActive === false || params.row?.isRetired === true;
      if (onDelete && !isRowInactive && params.row?.slug !== "system" && params.row?.id !== "system") {
        actions.push(
          <GridActionsCellItem
            key="delete"
            icon={deleteIcon || <RemoveCircleIcon color="error" />}
            label="Inhabilitar"
            title="Inhabilitar"
            onClick={() => handleDeleteClick(params.id, params.row)}
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
        direction={{ xs: "column", lg: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", lg: "flex-end" }}
        spacing={2.5}
        sx={{ mb: { xs: 2, sm: 3 } }}
      >
        <Box sx={{ width: { xs: "100%", lg: "auto" } }}>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs
              aria-label="breadcrumb"
              sx={{ mb: 0.5, "& .MuiBreadcrumbs-li": { fontSize: { xs: "0.75rem", sm: "0.85rem" } } }}
            >
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
                  <Typography key={bc.label} color="text.primary" sx={{ fontSize: { xs: "0.75rem", sm: "0.85rem" } }}>
                    {bc.label}
                  </Typography>
                ) : (
                  <MuiLink
                    key={bc.label}
                    component={Link}
                    underline="hover"
                    color="inherit"
                    href={bc.href || "#"}
                    sx={{ fontSize: { xs: "0.75rem", sm: "0.85rem" } }}
                  >
                    {bc.label}
                  </MuiLink>
                ),
              )}
            </Breadcrumbs>
          )}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "1.25rem", sm: "1.55rem", md: "1.9rem" },
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </Typography>
            {(infoDescription || infoInstructions) && (
              <Tooltip title="Información de la vista">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => setInfoDialogOpen(true)}
                  sx={{ mt: 0.2 }}
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.2, sm: 1.5 }}
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ width: { xs: "100%", lg: "auto" }, flexWrap: "wrap", gap: { xs: 1, sm: 1.5 } }}
        >
          {!hideStatusFilter && (
            <ToggleButtonGroup
              size="small"
              value={statusFilter}
              exclusive
              onChange={(_, newStatus) => {
                if (newStatus !== null) setStatusFilter(newStatus);
              }}
              color="primary"
              sx={{
                width: { xs: "100%", sm: "auto" },
                display: "flex",
                bgcolor: "background.paper",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                "& .MuiToggleButton-root": {
                  border: "none",
                  px: { xs: 1.5, sm: 2 },
                  py: 0.65,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  },
                },
              }}
            >
              <ToggleButton value="ALL" sx={{ flex: { xs: 1, sm: "initial" } }}>
                Todos
              </ToggleButton>
              <ToggleButton value="ACTIVE" sx={{ flex: { xs: 1, sm: "initial" } }}>
                Activos
              </ToggleButton>
              <ToggleButton value="INACTIVE" sx={{ flex: { xs: 1, sm: "initial" } }}>
                Inactivos
              </ToggleButton>
            </ToggleButtonGroup>
          )}

          <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              disabled={loading}
              sx={{
                flex: { xs: 1, sm: "initial" },
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.8rem", sm: "0.85rem" },
                py: { xs: 0.75, sm: 0.65 },
                px: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                bgcolor: "background.paper",
                borderColor: "divider",
                color: "text.primary",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "action.hover",
                },
                whiteSpace: "nowrap",
              }}
            >
              Refrescar
            </Button>
            {onCreate && !hideCreateButton && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onCreate}
                disabled={loading}
                sx={{
                  flex: { xs: 1, sm: "initial" },
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: { xs: "0.8rem", sm: "0.85rem" },
                  py: { xs: 0.75, sm: 0.65 },
                  px: { xs: 1.8, sm: 2.2 },
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(25, 118, 210, 0.25)",
                  whiteSpace: "nowrap",
                }}
              >
                Crear Nuevo
              </Button>
            )}
            {extraHeaderActions}
          </Stack>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          height: { xs: 460, sm: 520, md: 580 },
          width: "100%",
          p: { xs: 0.5, sm: 1.5, md: 2 },
          position: "relative",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflowX: "auto",
        }}
      >
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
          rows={filteredRows}
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
          sx={{
            border: "none",
            "& .MuiDataGrid-cell": {
              display: "flex",
              alignItems: "center",
            },
          }}
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
