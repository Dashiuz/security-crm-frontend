"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { useAuth } from "@/components/AuthContext";
import DataTable from "@/components/common/DataTable";
import DetailDialog from "@/components/common/DetailDialog";
import ImageUploadCapture from "@/components/common/ImageUploadCapture";
import UnitAutocomplete, { UnitOption } from "@/components/common/UnitAutocomplete";
import ResidentAutocomplete, { ResidentOption } from "@/components/common/ResidentAutocomplete";
import ClientAutocomplete, { ClientOption } from "@/components/common/ClientAutocomplete";
import EmployeeAutocomplete, { EmployeeOption } from "@/components/common/EmployeeAutocomplete";
import MinutaFilterBar, { MinutaFilterValues } from "@/components/common/MinutaFilterBar";
import { useTenant } from "@/providers/TenantProvider";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  MenuItem,
  Paper,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Button,
  Chip,
  CircularProgress,
  Grid,
  TextField,
  InputLabel,
  Stack,
  Divider,
  InputAdornment,
} from "@mui/material";
import {
  CameraAlt as CameraIcon,
  Logout as LogoutIcon,
  DirectionsCar as CarIcon,
  HomeWork as HomeWorkIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  AccessTime as TimeIcon,
  WarningAmber as WarningIcon,
  LocalParking as ParkingIcon,
  CalendarMonth as CalendarMonthIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { formatDate, formatTime, formatDateTime, formatTimeToHHmm } from "@/lib/formatters";

interface ParkingPageProps {
  isInternal?: boolean;
}

export default function ParkingPage({ isInternal = false }: ParkingPageProps) {
  const [selectedClientFilter, setSelectedClientFilter] = useState<ClientOption | null>(null);
  const [filters, setFilters] = useState<MinutaFilterValues>({});

  // Form State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Autocomplete selections
  const [selectedUnit, setSelectedUnit] = useState<UnitOption | null>(null);
  const [selectedResident, setSelectedResident] = useState<ResidentOption | null>(null);

  // Internal employee selection
  const [isEmployeeLinked, setIsEmployeeLinked] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    entryTime: "",
    exitTime: "",
    parkingNumber: "",
    plate: "",
    brand: "",
    color: "",
    condition: "GOOD",
    unitId: "",
    residentId: "",
    observations: "",
  });

  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Exit Modal State (Confirmation -> Modal with optional exit photo)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [selectedExitRecord, setSelectedExitRecord] = useState<any | null>(null);
  const [exitTime, setExitTime] = useState("");
  const [exitObservations, setExitObservations] = useState("");
  const [exitEvidenceFile, setExitEvidenceFile] = useState<File | null>(null);
  const [exitSubmitting, setExitSubmitting] = useState(false);

  // Detail Modal State
  const [detailRecord, setDetailRecord] = useState<any | null>(null);
  const [detailPhotos, setDetailPhotos] = useState<{ entryUrl?: string | null; exitUrl?: string | null }>({});

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showError, showSuccess } = useNotification();
  const { session } = useAuth();
  const { tenant } = useTenant();

  const isGlobalUser = !session?.user?.clientId;
  const activeClientId = isGlobalUser
    ? isInternal
      ? undefined
      : selectedClientFilter?.id || undefined
    : session?.user?.clientId || undefined;
  const activeClientName = isGlobalUser
    ? selectedClientFilter?.name
    : undefined;

  const permissions = session?.permissions || [];
  const canDelete =
    permissions.includes("godlike:manage") ||
    permissions.includes("minuta:manage") ||
    permissions.includes("minuta:delete");
  const canEdit =
    permissions.includes("godlike:manage") ||
    permissions.includes("minuta:manage") ||
    permissions.includes("minuta:update");
  const canCreate =
    permissions.includes("godlike:manage") ||
    permissions.includes("minuta:manage") ||
    permissions.includes("minuta:create");

  // Handler: Abrir modal de nuevo registro
  const handleOpenCreate = () => {
    if (!isInternal && isGlobalUser && !activeClientId) {
      showError(
        "Debe escoger un cliente específico antes de generar un registro de parqueadero de cliente."
      );
      return;
    }
    const now = new Date();
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5);
    setEvidenceFile(null);
    setExistingMediaUrl(null);
    setSelectedUnit(null);
    setSelectedResident(null);
    setIsEmployeeLinked(false);
    setSelectedEmployee(null);
    setFormData({
      date: now.toISOString().split("T")[0],
      time: currentTime + ":00",
      entryTime: currentTime + ":00",
      exitTime: "",
      parkingNumber: "",
      plate: "",
      brand: "",
      color: "",
      condition: "GOOD",
      unitId: "",
      residentId: "",
      observations: "",
    });
    setIsEditing(false);
    setEditId(null);
    setDialogOpen(true);
  };

  // Handler: Editar registro
  const handleEdit = async (id: string) => {
    try {
      setEvidenceFile(null);
      setExistingMediaUrl(null);
      const data = await HttpClient.get<any>(`/operation/minuta/parking/${id}`);
      setEditId(id);
      setIsEditing(true);

      if (data.employeeId) {
        setIsEmployeeLinked(true);
        setSelectedEmployee({
          id: data.employeeId,
          fullName: data.employeeName || data.employee?.fullName || "Empleado asignado",
        });
      } else {
        setIsEmployeeLinked(false);
        setSelectedEmployee(null);
      }

      if (data.unit) {
        setSelectedUnit(data.unit);
      } else if (data.unitId) {
        setSelectedUnit({
          id: data.unitId,
          unitName: "Unidad",
        });
      } else {
        setSelectedUnit(null);
      }

      if (data.resident) {
        setSelectedResident(data.resident);
      } else if (data.residentId) {
        setSelectedResident({
          id: data.residentId,
          firstName: "Residente",
          lastName: "",
          unitId: data.unitId,
        });
      } else {
        setSelectedResident(null);
      }

      setFormData({
        date: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
        time: data.time ? formatTimeToHHmm(data.time) : "",
        entryTime: data.entryTime ? formatTimeToHHmm(data.entryTime) : (data.time ? formatTimeToHHmm(data.time) : ""),
        exitTime: data.exitTime ? formatTimeToHHmm(data.exitTime) : "",
        parkingNumber: data.parkingNumber || "",
        plate: data.plate || "",
        brand: data.brand || "",
        color: data.color || "",
        condition: data.condition || "GOOD",
        unitId: data.unitId || "",
        residentId: data.residentId || "",
        observations: data.observations || "",
      });

      // Load existing attachments
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.PARKING, id);
      if (mediaList && mediaList.length > 0) {
        const entryMedia = mediaList.find((m: any) => m.subType !== "exit") || mediaList[0];
        setExistingMediaUrl(entryMedia.presignedUrl || null);
      }

      setDialogOpen(true);
    } catch {
      showError("Error al cargar el registro de parqueadero");
    }
  };

  // Autocomplete change handlers
  const handleUnitChange = (unit: UnitOption | null) => {
    setSelectedUnit(unit);
    if (!unit) {
      setFormData((prev) => ({ ...prev, unitId: "" }));
    } else {
      setFormData((prev) => ({ ...prev, unitId: unit.id }));
      if (selectedResident && selectedResident.unitId !== unit.id) {
        setSelectedResident(null);
        setFormData((prev) => ({ ...prev, residentId: "" }));
      }
    }
  };

  const handleResidentChange = (resident: ResidentOption | null) => {
    setSelectedResident(resident);
    if (!resident) {
      setFormData((prev) => ({ ...prev, residentId: "" }));
    } else {
      setFormData((prev) => ({ ...prev, residentId: resident.id }));
      if (resident.unit && (!selectedUnit || selectedUnit.id !== resident.unit.id)) {
        const matchingUnit: UnitOption = {
          id: resident.unit.id,
          unitName: resident.unit.unitName,
          tower: resident.unit.tower,
        };
        setSelectedUnit(matchingUnit);
        setFormData((prev) => ({ ...prev, unitId: matchingUnit.id }));
      }
    }
  };

  // Preloaded residents from selected unit
  const preloadedResidents: ResidentOption[] = useMemo(() => {
    if (!selectedUnit || !selectedUnit.residents) return [];
    return selectedUnit.residents.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      document: r.document,
      phoneNumber: r.phoneNumber,
      unitId: selectedUnit.id,
      unit: {
        id: selectedUnit.id,
        unitName: selectedUnit.unitName,
        tower: selectedUnit.tower,
      },
    }));
  }, [selectedUnit]);

  // Handler: Guardar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.parkingNumber.trim()) {
      showError("El número de parqueadero es requerido");
      return;
    }
    if (!formData.plate.trim()) {
      showError("La placa del vehículo es requerida");
      return;
    }

    if (isInternal && isEmployeeLinked && !selectedEmployee) {
      showError("Ha seleccionado vincular a un empleado; por favor elija uno de la lista.");
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const timeVal = formData.time.length === 5 ? `${formData.time}:00` : formData.time;
      const entryTimeVal = formData.entryTime.length === 5 ? `${formData.entryTime}:00` : formData.entryTime;
      const dateVal = formData.date || now.toISOString().split("T")[0];

      const payload: any = {
        date: dateVal,
        time: timeVal,
        occurredAt: `${dateVal}T${timeVal}Z`,
        entryTime: entryTimeVal,
        parkingNumber: formData.parkingNumber.trim(),
        plate: formData.plate.trim().toUpperCase(),
        brand: formData.brand?.trim() || null,
        color: formData.color?.trim() || null,
        condition: formData.condition,
        isInternal: isInternal,
        employeeId: isInternal ? (isEmployeeLinked ? selectedEmployee?.id || null : null) : null,
        unitId: isInternal ? null : selectedUnit?.id || formData.unitId || null,
        residentId: isInternal ? null : selectedResident?.id || formData.residentId || null,
        observations: formData.observations?.trim() || null,
        clientId: isInternal ? null : activeClientId || null,
      };

      let savedRecord: any;
      if (isEditing && editId) {
        if (formData.exitTime) {
          payload.exitTime = formData.exitTime.length === 5 ? `${formData.exitTime}:00` : formData.exitTime;
        }
        savedRecord = await HttpClient.patch(`/operation/minuta/parking/${editId}`, payload);
        showSuccess("Control de parqueadero actualizado correctamente");
      } else {
        savedRecord = await HttpClient.post("/operation/minuta/parking", payload);
        showSuccess("Ingreso a parqueadero registrado exitosamente");
      }

      const entityId = editId || savedRecord?.id;
      if (evidenceFile && entityId) {
        try {
          await StorageApi.uploadMedia({
            file: evidenceFile,
            entityType: MediaTypeCategory.PARKING,
            entityId,
            clientId: isInternal ? null : activeClientId || null,
            subType: "parking",
          });
          showSuccess("Fotografía del vehículo guardada en S3");
        } catch (uploadErr) {
          console.error("S3 upload error:", uploadErr);
          showError("Registro guardado, pero ocurrió un problema al subir la foto a S3");
        }
      }

      setDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al procesar el registro de parqueadero");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Salida Flow: Confirmation -> Modal with Optional Photo ---
  const handleStartExitConfirmation = (row: any) => {
    setSelectedExitRecord(row);
    setExitConfirmOpen(true);
  };

  const handleProceedToExitModal = () => {
    const now = new Date();
    setExitTime(formatTimeToHHmm(now));
    setExitObservations("");
    setExitEvidenceFile(null);
    setExitConfirmOpen(false);
    setExitModalOpen(true);
  };

  const handleConfirmExit = async () => {
    if (!selectedExitRecord) return;

    setExitSubmitting(true);
    try {
      const exitTimeFormatted = exitTime.length === 5 ? `${exitTime}:00` : exitTime;

      await HttpClient.patch(`/operation/minuta/parking/${selectedExitRecord.id}/exit`, {
        exitTime: exitTimeFormatted,
        observations: exitObservations.trim() || undefined,
      });

      if (exitEvidenceFile) {
        try {
          await StorageApi.uploadMedia({
            file: exitEvidenceFile,
            entityType: MediaTypeCategory.PARKING,
            entityId: selectedExitRecord.id,
            clientId: isInternal ? null : activeClientId || null,
            subType: "exit",
          });
        } catch (s3Err) {
          console.error("Error subiendo foto de salida:", s3Err);
          showError("Salida registrada, pero ocurrió un problema al subir la foto a S3.");
        }
      }

      showSuccess(`Salida del vehículo ${selectedExitRecord.plate} registrada exitosamente`);
      setExitModalOpen(false);
      setSelectedExitRecord(null);
      setExitEvidenceFile(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al registrar la salida");
    } finally {
      setExitSubmitting(false);
    }
  };

  // Handler: Ver Detalle
  const handleView = async (row: any) => {
    setDetailRecord(row);
    setDetailPhotos({});
    try {
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.PARKING, row.id);
      if (mediaList && mediaList.length > 0) {
        const entryMedia = mediaList.find((m: any) => m.subType === "parking" || !m.subType) || mediaList[0];
        const exitMedia = mediaList.find((m: any) => m.subType === "exit");
        setDetailPhotos({
          entryUrl: entryMedia?.presignedUrl || null,
          exitUrl: exitMedia?.presignedUrl || null,
        });
      }
    } catch { }
  };

  // Handler: Ver evidencia fotográfica modal
  const handleViewEvidence = async (row: any) => {
    setPreviewLoading(true);
    setPreviewModalUrl(null);
    try {
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.PARKING, row.id);
      if (mediaList && mediaList.length > 0) {
        const targetMedia = mediaList.find((m: any) => m.subType === "parking" || !m.subType) || mediaList[0];
        setPreviewModalUrl(targetMedia.presignedUrl || null);
      } else {
        showError("No hay fotografía del vehículo asociada");
      }
    } catch {
      showError("Error al obtener la imagen segura");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await HttpClient.delete(`/operation/minuta/parking/${id}`);
      showSuccess("Registro eliminado");
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al eliminar el registro de parqueadero");
    }
  };

  const handleFilterChange = useCallback((newFilters: MinutaFilterValues) => {
    setFilters(newFilters);
  }, []);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    params.append("isInternal", isInternal ? "true" : "false");
    if (!isInternal && activeClientId) {
      params.append("clientId", activeClientId);
    }
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.search) params.append("search", filters.search);
    if (!isInternal) {
      if (filters.unitId) params.append("unitId", filters.unitId);
      if (filters.residentId) params.append("residentId", filters.residentId);
    }

    const queryStr = params.toString();
    return queryStr ? `/operation/minuta/parking?${queryStr}` : "/operation/minuta/parking";
  }, [activeClientId, isInternal, filters]);

  const columns: GridColDef[] = useMemo(() => [
    { field: "id", headerName: "ID", width: 60 },
    {
      field: "date",
      headerName: "Fecha",
      width: 105,
      valueFormatter: (value: any) => formatDate(value),
    },
    {
      field: "entryTime",
      headerName: "Entrada",
      width: 90,
      valueFormatter: (value: any) => formatTime(value),
    },
    {
      field: "plate",
      headerName: "Placa",
      width: 120,
      renderCell: (params) => (
        <Chip
          size="small"
          icon={<CarIcon sx={{ fontSize: 15 }} />}
          label={params.value || "Sin Placa"}
          color="secondary"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: "0.78rem" }}
        />
      ),
    },
    {
      field: "parkingNumber",
      headerName: "N° Parqueadero",
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%", gap: 0.8 }}>
          <ParkingIcon sx={{ fontSize: 18, color: "primary.main" }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    ...(isInternal
      ? [
        {
          field: "employeeName",
          headerName: "Empleado / Responsable",
          width: 200,
          renderCell: (params: any) => {
            const emp = params.row.employeeName || params.row.employee?.fullName;
            if (!emp) {
              return (
                <Typography variant="body2" color="text.secondary">
                  Uso Interno / General
                </Typography>
              );
            }
            return (
              <Box sx={{ display: "flex", alignItems: "center", height: "100%", gap: 0.6 }}>
                <BadgeIcon sx={{ fontSize: 17, color: "secondary.main" }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                  {emp}
                </Typography>
              </Box>
            );
          },
        },
      ]
      : [
        {
          field: "unitName",
          headerName: "Unidad / Apto",
          width: 140,
          renderCell: (params: any) => {
            const name = params.row.unitName || params.row.unit?.unitName || "—";
            return (
              <Box sx={{ display: "flex", alignItems: "center", height: "100%", gap: 0.8 }}>
                <HomeWorkIcon sx={{ fontSize: 17, color: "text.secondary" }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {name}
                </Typography>
              </Box>
            );
          },
        },
        {
          field: "residentName",
          headerName: "Residente / Conductor",
          width: 180,
          renderCell: (params: any) => {
            const res =
              params.row.residentName ||
              (params.row.resident
                ? `${params.row.resident.firstName} ${params.row.resident.lastName}`
                : "—");
            return (
              <Box sx={{ display: "flex", alignItems: "center", height: "100%", gap: 0.6 }}>
                <PersonIcon sx={{ fontSize: 17, color: "text.secondary" }} />
                <Typography variant="body2">{res}</Typography>
              </Box>
            );
          },
        },
      ]),
    { field: "brand", headerName: "Marca", width: 120 },
    { field: "color", headerName: "Color", width: 100 },
    {
      field: "evidence",
      headerName: "Evidencia",
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const hasMedia = params.row.mediaAttachments?.length > 0;
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            {!hasMedia ? (
              <Typography variant="caption" sx={{ color: "text.disabled" }}>
                —
              </Typography>
            ) : (
              <Tooltip title="Ver evidencia fotográfica">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleViewEvidence(params.row)}
                >
                  <CameraIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
    {
      field: "exitAction",
      headerName: "Estado / Salida",
      width: 175,
      sortable: false,
      renderCell: (params) => {
        const hasExit = Boolean(params.row.exitTime || params.row.exitAt);
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            {hasExit ? (
              <Chip
                size="small"
                icon={<TimeIcon sx={{ fontSize: 15 }} />}
                label={`Salió: ${formatTime(params.row.exitTime || params.row.exitAt)}`}
                color="default"
                variant="outlined"
                sx={{ fontWeight: 500, fontSize: "0.75rem", bgcolor: "action.hover" }}
              />
            ) : (
              <Button
                size="small"
                variant="contained"
                color="warning"
                startIcon={<LogoutIcon sx={{ fontSize: 15 }} />}
                onClick={() => handleStartExitConfirmation(params.row)}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  py: 0.3,
                  px: 1.2,
                  borderRadius: 1.5,
                  boxShadow: "none",
                }}
              >
                Marcar Salida
              </Button>
            )}
          </Box>
        );
      },
    },
    {
      field: "createdBy",
      headerName: "Registrado Por",
      width: 140,
      valueGetter: (value: any) => value || "Sistema",
    },
  ], [isInternal]);

  return (
    <>
      {!isInternal && isGlobalUser && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "0.85rem", sm: "0.9rem" },
              whiteSpace: "nowrap",
            }}
          >
            Conjunto / Cliente Activo:
          </Typography>
          <Box sx={{ width: { xs: "100%", sm: 380 } }}>
            <ClientAutocomplete
              value={selectedClientFilter}
              onChange={(client) => setSelectedClientFilter(client)}
              allowAllOption={true}
              allOptionLabel="Todos los Clientes / Conjuntos"
              placeholder="Buscar cliente o puesto de seguridad..."
              size="small"
            />
          </Box>
        </Paper>
      )}

      {/* Barra de Búsqueda y Filtros Avanzados */}
      <MinutaFilterBar
        clientId={activeClientId}
        onFilterChange={handleFilterChange}
        searchPlaceholder={
          isInternal
            ? "Buscar por placa, n° parqueadero, marca o empleado..."
            : "Buscar por placa, n° parqueadero, marca o color..."
        }
        showUnitFilter={!isInternal}
        showResidentFilter={!isInternal}
      />

      <DataTable
        title={
          isInternal
            ? `Control de Parqueadero - ${tenant?.name || "Interno"}`
            : "Control de Parqueadero"
        }
        endpoint={endpoint}
        columns={columns}
        breadcrumbs={
          isInternal
            ? [
              { label: "Operaciones" },
              { label: `Minutas de ${tenant?.name || "la Empresa"}` },
              { label: "Control de Parqueadero" },
            ]
            : [
              { label: "Operaciones" },
              { label: "Minutas del Cliente" },
              { label: "Control de Parqueadero" },
            ]
        }
        onCreate={canCreate ? handleOpenCreate : undefined}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        confirmDelete={true}
        deleteDialogTitle="Confirmar Eliminación de Parqueadero"
        deleteDialogMessage="¿Estás seguro de que deseas eliminar este registro de control de parqueadero? Esta acción no se puede deshacer."
        deleteActionLabel="Eliminar"
        deleteIcon={<DeleteIcon color="error" />}
        onView={handleView}
        refreshTrigger={refreshTrigger}
        infoDescription={
          isInternal
            ? "Control y monitoreo de ingreso/salida de vehículos en las instalaciones internas de la empresa/tenant."
            : "Sistema de control para el ingreso y salida de vehículos, asegurando el monitoreo de placas y tiempos de permanencia."
        }
        infoInstructions={
          isInternal
            ? `1. Registra la placa del vehículo, asignación de bahía o puesto, y vinculación opcional a un empleado del tenant.
2. Al retirarse el vehículo, pulsa 'Marcar Salida' para registrar la hora de salida e incluir opcionalmente una fotografía de salida.`
            : `1. Registra la placa del vehículo, asignación de puesto y vinculación opcional a Unidad/Residente.
2. Al retirarse el vehículo, pulsa 'Marcar Salida' para registrar la hora de salida e incluir opcionalmente una fotografía de salida.`
        }
      />

      {/* Modal Detalle de Parqueadero */}
      <DetailDialog
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        title={
          isInternal
            ? "Detalles del Registro de Parqueadero Interno"
            : "Detalles del Registro de Parqueadero"
        }
        headerContent={
          (detailPhotos.entryUrl || detailPhotos.exitUrl) && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {detailPhotos.entryUrl && (
                <Grid size={detailPhotos.exitUrl ? 6 : 12}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.5, textAlign: "center" }}>
                    Foto de Ingreso Vehículo
                  </Typography>
                  <Box
                    component="img"
                    src={detailPhotos.entryUrl}
                    alt="Foto Ingreso Vehículo"
                    sx={{
                      width: "100%",
                      maxHeight: 180,
                      objectFit: "contain",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "black",
                    }}
                  />
                </Grid>
              )}
              {detailPhotos.exitUrl && (
                <Grid size={detailPhotos.entryUrl ? 6 : 12}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.5, textAlign: "center" }}>
                    Foto de Salida Vehículo
                  </Typography>
                  <Box
                    component="img"
                    src={detailPhotos.exitUrl}
                    alt="Foto Salida Vehículo"
                    sx={{
                      width: "100%",
                      maxHeight: 180,
                      objectFit: "contain",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "black",
                    }}
                  />
                </Grid>
              )}
            </Grid>
          )
        }
        fields={
          detailRecord
            ? [
              { label: "ID Registro", value: detailRecord.id },
              { label: "Fecha", value: formatDate(detailRecord.date) },
              { label: "Placa", value: detailRecord.plate },
              { label: "N° Parqueadero", value: detailRecord.parkingNumber },
              ...(isInternal
                ? [
                  {
                    label: "¿Vinculado a Empleado?",
                    value: detailRecord.employeeId ? "Sí" : "No",
                  },
                  ...(detailRecord.employeeId
                    ? [
                      {
                        label: "Empleado Responsable",
                        value:
                          detailRecord.employeeName ||
                          detailRecord.employee?.fullName ||
                          detailRecord.employeeId,
                      },
                    ]
                    : []),
                ]
                : [
                  {
                    label: "Unidad / Apto",
                    value: detailRecord.unitName || detailRecord.unit?.unitName || "N/A",
                  },
                  {
                    label: "Residente / Conductor",
                    value:
                      detailRecord.residentName ||
                      (detailRecord.resident
                        ? `${detailRecord.resident.firstName} ${detailRecord.resident.lastName}`
                        : "N/A"),
                  },
                ]),
              { label: "Hora Entrada", value: formatTime(detailRecord.entryTime || detailRecord.time) },
              {
                label: "Hora Salida",
                value: detailRecord.exitTime ? (
                  formatTime(detailRecord.exitTime)
                ) : (
                  <Chip size="small" label="En Parqueadero" color="warning" />
                ),
              },
              { label: "Marca", value: detailRecord.brand || "N/A" },
              { label: "Color", value: detailRecord.color || "N/A" },
              {
                label: "Estado General",
                value: (
                  <Chip
                    size="small"
                    label={detailRecord.condition === "GOOD" ? "Bueno" : "Malo / Con Observaciones"}
                    color={detailRecord.condition === "GOOD" ? "success" : "warning"}
                  />
                ),
              },
              { label: "Creado Por", value: detailRecord.createdBy || "Sistema" },
              {
                label: "Fecha Registro",
                value: formatDateTime(detailRecord.createdAt || detailRecord.date),
              },
              { label: "Observaciones", value: detailRecord.observations || "Sin observaciones" },
            ]
            : []
        }
      />

      {/* Modal de Registro / Edición de Parqueadero */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 2.5 }, m: { xs: 1.5, sm: 3 } } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.25rem" }, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <ParkingIcon color="primary" />
            <Box component="span">
              {isEditing
                ? isInternal
                  ? "Actualizar Parqueadero Interno"
                  : "Actualizar Registro de Parqueadero"
                : isInternal
                  ? `Nuevo Ingreso - ${tenant?.name || "Empresa"}`
                  : activeClientName
                    ? `Nuevo Ingreso para ${activeClientName}`
                    : "Nuevo Ingreso a Parqueadero"}
            </Box>
            {isInternal && (
              <Chip
                size="small"
                label="Uso Interno"
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 600, ml: "auto" }}
              />
            )}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2, px: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2}>
              {/* Sección 1: Datos Principales del Vehículo */}
              <Grid size={12}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "primary.main", fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <CarIcon sx={{ fontSize: 18 }} /> 1. Datos del Vehículo y Bahía
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Placa del Vehículo"
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                  placeholder="Ej: ABC-123"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="N° Parqueadero / Bahía"
                  value={formData.parkingNumber}
                  onChange={(e) => setFormData({ ...formData, parkingNumber: e.target.value })}
                  placeholder="Ej: P-14, Sótano 1"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Marca / Modelo"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Ej: Mazda CX-30"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Color del Vehículo"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Ej: Gris Titanio"
                />
              </Grid>

              {/* Sección 2: Vinculación */}
              <Grid size={12} sx={{ mt: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "primary.main", fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  {isInternal ? <BadgeIcon sx={{ fontSize: 18 }} /> : <HomeWorkIcon sx={{ fontSize: 18 }} />}
                  {isInternal ? "2. Vinculación con Empleado (Opcional)" : "2. Unidad y Residente Responsable (Opcional)"}
                </Typography>
              </Grid>

              {isInternal ? (
                <>
                  <Grid size={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isEmployeeLinked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsEmployeeLinked(checked);
                            if (!checked) setSelectedEmployee(null);
                          }}
                          color="primary"
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ¿Vinculado a un empleado?
                        </Typography>
                      }
                    />
                  </Grid>
                  {isEmployeeLinked && (
                    <Grid size={12}>
                      <EmployeeAutocomplete
                        value={selectedEmployee}
                        onChange={(emp) => setSelectedEmployee(emp)}
                        label="Empleado Conductor / Responsable"
                        placeholder="Buscar empleado por nombre o documento..."
                        required
                      />
                    </Grid>
                  )}
                </>
              ) : (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <UnitAutocomplete
                      clientId={activeClientId}
                      value={selectedUnit}
                      onChange={handleUnitChange}
                      label="Apartamento / Unidad Residencial"
                      placeholder="Buscar torre, apto o casa..."
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <ResidentAutocomplete
                      clientId={activeClientId}
                      unitId={selectedUnit?.id}
                      preloadedResidents={preloadedResidents}
                      value={selectedResident}
                      onChange={handleResidentChange}
                      label="Residente / Propietario del Vehículo"
                      placeholder="Buscar por nombre o documento..."
                    />
                  </Grid>
                </>
              )}

              {/* Sección 3: Fechas y Estado */}
              <Grid size={12} sx={{ mt: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "primary.main", fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <TimeIcon sx={{ fontSize: 18 }} /> 3. Fechas y Estado del Vehículo
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <CalendarMonthIcon sx={{ color: "action.active", pointerEvents: "none" }} />
                      </InputAdornment>
                    ),
                  }}
                  label="Fecha"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="time"
                  label="Hora Entrada"
                  value={formData.entryTime}
                  onChange={(e) => setFormData({ ...formData, entryTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="condition-select-label">Estado Físico</InputLabel>
                  <Select
                    labelId="condition-select-label"
                    label="Estado Físico"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  >
                    <MenuItem value="GOOD">Bueno / Sin Novedad</MenuItem>
                    <MenuItem value="BAD">Con Rayones / Golpes / Averías</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {isEditing && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="time"
                    label="Hora Salida (Opcional)"
                    value={formData.exitTime}
                    onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}

              <Grid size={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Observaciones / Novedades de Ingreso"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Detalles sobre pertenencias visibles, estado de carrocería, etc..."
                />
              </Grid>

              {/* Sección 4: Evidencia Fotográfica */}
              <Grid size={12} sx={{ mt: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "primary.main", fontWeight: 700, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <CameraIcon sx={{ fontSize: 18 }} /> 4. Evidencia Fotográfica de Ingreso
                </Typography>
                <ImageUploadCapture
                  label="Fotografía del Vehículo / Placa / Estado"
                  variant="evidence"
                  value={evidenceFile}
                  previewUrl={existingMediaUrl}
                  onChange={setEvidenceFile}
                  helperText="Toma una foto en vivo del vehículo/placa al ingresar para evidencia física."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, flexDirection: { xs: "column-reverse", sm: "row" }, gap: { xs: 1, sm: 0 } }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={submitting} sx={{ width: { xs: "100%", sm: "auto" } }}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={submitting} sx={{ fontWeight: 600, width: { xs: "100%", sm: "auto" } }}>
              {submitting ? "Guardando..." : isEditing ? "Actualizar Registro" : "Registrar Ingreso"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Paso 1 Salida: Diálogo de Confirmación */}
      <Dialog
        open={exitConfirmOpen}
        onClose={() => setExitConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5, p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <WarningIcon color="warning" /> Confirmar Salida del Vehículo
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            ¿Está seguro de que desea registrar la salida de este vehículo?
          </Typography>
          {selectedExitRecord && (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "action.hover" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Placa: {selectedExitRecord.plate}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Parqueadero: {selectedExitRecord.parkingNumber}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Unidad: {selectedExitRecord.unitName || selectedExitRecord.unit?.unitName || "N/A"}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Hora de Entrada: {formatTime(selectedExitRecord.entryTime || selectedExitRecord.time)}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setExitConfirmOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleProceedToExitModal}
            startIcon={<LogoutIcon />}
            sx={{ fontWeight: 600 }}
          >
            Continuar con Salida
          </Button>
        </DialogActions>
      </Dialog>

      {/* Paso 2 Salida: Modal de Salida con Fotografía Opcional y Observaciones */}
      <Dialog
        open={exitModalOpen}
        onClose={() => !exitSubmitting && setExitModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <LogoutIcon color="warning" /> Registro de Salida de Vehículo
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          {selectedExitRecord && (
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 1.5, bgcolor: "background.default" }}>
              <Grid container spacing={1}>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Placa:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {selectedExitRecord.plate}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Parqueadero:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedExitRecord.parkingNumber}
                  </Typography>
                </Grid>
                <Grid size={12}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Unidad / Residente:
                  </Typography>
                  <Typography variant="body2">
                    {selectedExitRecord.unitName || selectedExitRecord.unit?.unitName || "Sin unidad vinculada"}
                    {selectedExitRecord.residentName ? ` (${selectedExitRecord.residentName})` : ""}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              type="time"
              label="Hora de Salida"
              value={exitTime}
              onChange={(e) => setExitTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Observaciones de Salida (Opcional)"
              value={exitObservations}
              onChange={(e) => setExitObservations(e.target.value)}
              placeholder="Detalles sobre el estado del vehículo o notas de salida..."
            />

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5 }}>
              <CameraIcon sx={{ fontSize: 18 }} /> Evidencia Fotográfica de Salida (Opcional)
            </Typography>

            <ImageUploadCapture
              label="Fotografía de Salida del Vehículo"
              variant="evidence"
              value={exitEvidenceFile}
              onChange={setExitEvidenceFile}
              helperText="Toma una foto en vivo al vehículo al retirarse del parqueadero (opcional)."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setExitModalOpen(false)} color="inherit" disabled={exitSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={exitSubmitting}
            onClick={handleConfirmExit}
            startIcon={exitSubmitting ? <CircularProgress size={16} color="inherit" /> : <LogoutIcon />}
            sx={{ fontWeight: 600 }}
          >
            {exitSubmitting ? "Registrando..." : "Registrar Salida"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Visor de Evidencia */}
      <Dialog
        open={Boolean(previewModalUrl || previewLoading)}
        onClose={() => setPreviewModalUrl(null)}
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 2.5 }, m: { xs: 1.5, sm: 3 } } }}
      >
        <DialogContent sx={{ p: 1, bgcolor: "black", textAlign: "center", minWidth: { xs: 260, sm: 320 }, minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {previewLoading ? (
            <CircularProgress color="primary" />
          ) : (
            previewModalUrl && (
              <Box
                component="img"
                src={previewModalUrl}
                alt="Foto Vehículo"
                sx={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 1 }}
              />
            )
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: "background.paper", px: 2, py: 1 }}>
          <Button onClick={() => setPreviewModalUrl(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
