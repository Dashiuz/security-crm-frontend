"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  ToggleButton,
  ToggleButtonGroup,
  TablePagination,
  Skeleton,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ResponsiveFormDrawer from "./ResponsiveFormDrawer";
import ResponsiveDetailWrapper from "./ResponsiveDetailWrapper";
import UniversalMobileCard from "./UniversalMobileCard";
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
  DeleteForever as DeleteForeverIcon,
  RemoveCircle as RemoveCircleIcon,
  InfoOutlined as InfoIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { HttpClient, ApiError } from "@/lib/api/client";
import Link from "next/link";

export interface DataTableProps {
  title: string;
  endpoint?: string;
  columns: GridColDef[];
  breadcrumbs?: { label: string; href?: string }[];
  onCreate?: () => void;
  onEdit?: (id: string, row: any) => void;
  editActionLabel?: string;
  onDelete?: (id: string, row?: any) => void | Promise<void>;
  onView?: (row: any) => void;
  customActions?: (row: any) => React.ReactElement<GridActionsCellItemProps>[];
  deleteIcon?: React.ReactElement;
  deleteActionLabel?: string;
  confirmDelete?: boolean;
  deleteDialogTitle?: string;
  deleteDialogMessage?: string;
  actionsColumnWidth?: number;
  refreshTrigger?: number;
  onRefresh?: () => void;
  checkboxSelection?: boolean;
  onRowSelectionModelChange?: (newSelection: any) => void;
  getRowId?: (row: any) => GridRowId;
  infoDescription?: string;
  infoInstructions?: string;
  rows?: any[];
  loading?: boolean;
  hideHeader?: boolean;
  hideCreateButton?: boolean;
  hideStatusFilter?: boolean;
  extraHeaderActions?: React.ReactNode;
  renderMobile?: (rows: any[]) => React.ReactNode;
}

export default function DataTable({
  title,
  endpoint,
  columns,
  breadcrumbs,
  onCreate,
  onEdit,
  editActionLabel,
  onDelete,
  onView,
  customActions,
  deleteIcon,
  deleteActionLabel,
  confirmDelete = false,
  deleteDialogTitle,
  deleteDialogMessage,
  actionsColumnWidth,
  refreshTrigger,
  onRefresh,
  checkboxSelection = false,
  onRowSelectionModelChange,
  getRowId,
  infoDescription,
  infoInstructions,
  rows: externalRows,
  loading: externalLoading,
  hideHeader = false,
  hideCreateButton = false,
  hideStatusFilter = false,
  extraHeaderActions,
  renderMobile,
}: DataTableProps) {
  const theme = useTheme();
  const isMobileMatch = useMediaQuery(theme.breakpoints.down("md"));
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isMobile = mounted ? isMobileMatch : false;

  const [internalRows, setInternalRows] = useState<any[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] =
    useState<GridRowId | null>(null);
  const [selectedRowToDelete, setSelectedRowToDelete] = useState<any>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  const activeRows = externalRows !== undefined ? externalRows : internalRows;

  const fetchData = useCallback(
    async (isSilent = false) => {
      if (externalRows !== undefined || !endpoint) {
        setInternalLoading(false);
        return;
      }
      if (!isSilent) {
        setInternalLoading(true);
      }
      setError(null);
      try {
        const data = await HttpClient.get<any>(endpoint);
        setInternalRows(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || "Error al cargar los datos");
      } finally {
        setInternalLoading(false);
      }
    },
    [endpoint, externalRows],
  );

  useEffect(() => {
    // Si ya tenemos filas cargadas, refrescar de forma silenciosa para evitar parpadeos
    const isSilent = internalRows.length > 0;
    fetchData(isSilent);
  }, [fetchData, refreshTrigger]);

  const [mobilePage, setMobilePage] = useState(0);
  const [mobileRowsPerPage, setMobileRowsPerPage] = useState(10);

  useEffect(() => {
    setMobilePage(0);
  }, [statusFilter, endpoint, externalRows, refreshTrigger]);

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

  const paginatedMobileRows = useMemo(() => {
    const start = mobilePage * mobileRowsPerPage;
    return filteredRows.slice(start, start + mobileRowsPerPage);
  }, [filteredRows, mobilePage, mobileRowsPerPage]);

  const handleDeleteClick = (id: GridRowId, row: any) => {
    setSelectedIdToDelete(id);
    setSelectedRowToDelete(row);

    if (confirmDelete) {
      setDeleteDialogOpen(true);
      return;
    }

    if (onDelete) {
      onDelete(id.toString(), row);
      return;
    }

    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedIdToDelete) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(selectedIdToDelete.toString(), selectedRowToDelete);
      } else if (endpoint) {
        await HttpClient.delete(`${endpoint}/${selectedIdToDelete}`);
        setInternalRows((prev) => prev.filter((row) => row.id !== selectedIdToDelete));
      }
    } catch (err: any) {
      const apiError = err as ApiError;
      alert(apiError.message || "Error al eliminar el registro");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedIdToDelete(null);
      setSelectedRowToDelete(null);
    }
  };

  const actionsColumn: GridColDef = {
    field: "actions",
    type: "actions",
    headerName: "",
    width: actionsColumnWidth || 54,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: "center",
    headerAlign: "center",
    getActions: (params) => {
      const actions: React.ReactElement<GridActionsCellItemProps>[] = [];

      if (customActions) {
        const rawActions = customActions(params.row) || [];
        rawActions.forEach((item, index) => {
          if (React.isValidElement(item)) {
            actions.push(
              React.cloneElement(item as React.ReactElement<GridActionsCellItemProps>, {
                key: item.key || `custom-action-${index}`,
                showInMenu: true,
              })
            );
          }
        });
      }

      if (onView) {
        actions.push(
          <GridActionsCellItem
            key="view"
            icon={<VisibilityIcon color="info" />}
            label="Ver Detalle"
            onClick={() => onView(params.row)}
            showInMenu={true}
          />
        );
      }

      if (onEdit) {
        actions.push(
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon color="primary" />}
            label={editActionLabel || "Editar"}
            onClick={() => onEdit(params.id.toString(), params.row)}
            showInMenu={true}
          />
        );
      }

      const isRowInactive = params.row?.isActive === false || params.row?.isRetired === true;
      if (onDelete && !isRowInactive && params.row?.slug !== "system" && params.row?.id !== "system") {
        actions.push(
          <GridActionsCellItem
            key="delete"
            icon={deleteIcon || <DeleteForeverIcon color="error" />}
            label={deleteActionLabel || "Eliminar..."}
            onClick={() => handleDeleteClick(params.id, params.row)}
            showInMenu={true}
          />
        );
      }

      return actions;
    },
  };

  const hasActionsColumn = columns.some((col) => col.field === "actions");
  const hasAnyActions = Boolean(customActions || onView || onEdit || onDelete);
  const finalColumns = hasActionsColumn || !hasAnyActions ? columns : [...columns, actionsColumn];

  return (
    <Box>
      {!hideHeader && (
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
              onClick={() => {
                fetchData();
                onRefresh?.();
              }}
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
    )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {renderMobile && isMobile ? (
        <Box sx={{ width: "100%", position: "relative" }}>
          {loading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 4,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          {renderMobile(filteredRows)}
        </Box>
      ) : isMobile ? (
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>
          {loading && filteredRows.length === 0 ? (
            Array.from(new Array(4)).map((_, idx) => (
              <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Skeleton width={110} height={24} />
                    <Skeleton width={70} height={24} />
                  </Stack>
                  <Skeleton width="85%" height={22} />
                  <Skeleton width="55%" height={16} />
                  <Stack direction="row" spacing={1}>
                    <Skeleton width={60} height={22} />
                    <Skeleton width={80} height={22} />
                  </Stack>
                  <Divider sx={{ my: 0.5 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Skeleton width={100} height={18} />
                    <Skeleton width={70} height={18} />
                  </Stack>
                </Stack>
              </Paper>
            ))
          ) : filteredRows.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 2,
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                No hay datos disponibles
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                No se encontraron registros para mostrar.
              </Typography>
            </Paper>
          ) : (
            <>
              {paginatedMobileRows.map((row, index) => {
                const rowId = getRowId ? getRowId(row) : (row.id || index);
                return (
                  <UniversalMobileCard
                    key={String(rowId)}
                    row={row}
                    columns={columns}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    customActions={customActions}
                    deleteIcon={deleteIcon}
                    deleteActionLabel={deleteActionLabel}
                    onDeleteClick={handleDeleteClick}
                  />
                );
              })}

              {filteredRows.length > 5 && (
                <TablePagination
                  component="div"
                  count={filteredRows.length}
                  page={mobilePage}
                  onPageChange={(_, newPage) => setMobilePage(newPage)}
                  rowsPerPage={mobileRowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setMobileRowsPerPage(parseInt(e.target.value, 10));
                    setMobilePage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Filas:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
                  }
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    borderRadius: 2,
                    mt: 0.5,
                    "& .MuiTablePagination-toolbar": {
                      px: 1,
                      minHeight: 48,
                    },
                    "& .MuiTablePagination-displayedRows": {
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    },
                    "& .MuiTablePagination-selectLabel": {
                      fontSize: "0.8rem",
                    },
                  }}
                />
              )}
            </>
          )}
        </Box>
      ) : (
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
            columnBufferPx={2000}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            checkboxSelection={checkboxSelection}
            onRowSelectionModelChange={onRowSelectionModelChange}
            disableRowSelectionOnClick
            onRowClick={(params, event) => {
              const target = event.target as HTMLElement | null;
              if (
                target?.closest("button") ||
                target?.closest(".MuiCheckbox-root") ||
                target?.closest("a") ||
                target?.closest(".MuiIconButton-root") ||
                target?.closest("[data-field='actions']") ||
                target?.closest(".MuiDataGrid-cell--withRenderer")?.getAttribute("data-field") === "actions"
              ) {
                return;
              }
              if (onView) {
                onView(params.row);
              }
            }}
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
              "& .MuiDataGrid-columnHeaders": {
                borderBottom: "1.5px solid #CBD5E1",
                backgroundColor: "#F8FAFC",
                color: "#475569",
                fontSize: "0.78rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              },
              "& .MuiDataGrid-row": {
                cursor: onView ? "pointer" : "default",
                transition: "background-color 0.15s ease",
                "&:hover": {
                  backgroundColor: "rgba(124, 58, 237, 0.035)",
                },
                "&.Mui-selected": {
                  backgroundColor: "rgba(124, 58, 237, 0.08)",
                  "&:hover": {
                    backgroundColor: "rgba(124, 58, 237, 0.12)",
                  },
                },
              },
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid #E2E8F0",
                fontSize: "0.82rem",
                color: "#1E293B",
              },
              // Columna de Acciones Compacta, Suave y Unificada (Estilo Stripe / Linear)
              "& .MuiDataGrid-columnHeader[data-field='actions']": {
                position: "sticky",
                right: 0,
                zIndex: 5,
                backgroundColor: "#F8FAFC",
                borderLeft: "1px solid #E2E8F0",
                boxShadow: "-3px 0 6px rgba(15, 23, 42, 0.025)",
                padding: 0,
              },
              "& .MuiDataGrid-cell[data-field='actions']": {
                position: "sticky",
                right: 0,
                zIndex: 3,
                backgroundColor: "#FFFFFF",
                borderLeft: "1px solid #E2E8F0",
                boxShadow: "-3px 0 6px rgba(15, 23, 42, 0.025)",
                padding: 0,
                justifyContent: "center",
              },
              "& .MuiDataGrid-cell[data-field='actions'] .MuiIconButton-root": {
                color: "#64748B",
                width: 32,
                height: 32,
                transition: "all 0.15s ease",
                "&:hover": {
                  color: "primary.main",
                  backgroundColor: "rgba(124, 58, 237, 0.08)",
                },
              },
              "& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field='actions']": {
                backgroundColor: "#FAF8FF",
              },
              "& .MuiDataGrid-row.Mui-selected .MuiDataGrid-cell[data-field='actions']": {
                backgroundColor: "#F3EEFF",
              },
              "& .MuiDataGrid-row.Mui-selected:hover .MuiDataGrid-cell[data-field='actions']": {
                backgroundColor: "#ECE5FF",
              },
            }}
          />
        </Paper>
      )}

      {/* Confirmation Drawer for Delete */}
      <ResponsiveFormDrawer
        open={deleteDialogOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteDialogOpen(false);
            setSelectedIdToDelete(null);
            setSelectedRowToDelete(null);
          }
        }}
        title={deleteDialogTitle || "Confirmar Eliminación"}
        subtitle="Operación de eliminación de registro"
        customActions={
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%", flexWrap: "wrap" }}>
            <Button
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedIdToDelete(null);
                setSelectedRowToDelete(null);
              }}
              color="inherit"
              disabled={isDeleting || loading}
              sx={{ borderRadius: 2 }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              disabled={isDeleting || loading}
              startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteForeverIcon />}
              sx={{ fontWeight: 600, borderRadius: 2 }}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </Box>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Esta acción es irreversible y afectará los registros vinculados en el sistema.
          </Alert>
          <Typography variant="body1">
            {deleteDialogMessage ||
              "¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."}
          </Typography>
        </Box>
      </ResponsiveFormDrawer>

      {/* Info/Help Drawer */}
      <ResponsiveDetailWrapper
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        title={`Información: ${title}`}
        actions={
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              onClick={() => setInfoDialogOpen(false)}
              variant="contained"
              sx={{ borderRadius: 2, px: 3 }}
            >
              Entendido
            </Button>
          </Box>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {infoDescription && (
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, bgcolor: "action.hover" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase", fontSize: "0.75rem", color: "primary.main" }}>
                Finalidad
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {infoDescription}
              </Typography>
            </Paper>
          )}

          {infoInstructions && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textTransform: "uppercase", fontSize: "0.75rem", color: "text.primary" }}>
                Instrucciones de Uso
              </Typography>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
                <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                  {infoInstructions.split("\n").map((line, i) => (
                    <li key={i} style={{ marginBottom: "0.5rem" }}>
                      <Typography variant="body2" color="text.secondary">
                        {line}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Paper>
            </Box>
          )}
        </Box>
      </ResponsiveDetailWrapper>
    </Box>
  );
}
