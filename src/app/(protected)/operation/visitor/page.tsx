"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { useAuth } from "@/components/AuthContext";
import DataTable from "@/components/common/DataTable";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Switch,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Tooltip,
  IconButton,
  CircularProgress,
  InputAdornment,
  Divider,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  HomeWork as HomeWorkIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Badge as BadgeIcon,
  AccessTime as TimeIcon,
  CameraAlt as CameraIcon,
  CalendarMonth as CalendarMonthIcon,
  WarningAmber as WarningIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import ImageUploadCapture from "@/components/common/ImageUploadCapture";
import DetailDialog from "@/components/common/DetailDialog";
import UnitAutocomplete, { UnitOption } from "@/components/common/UnitAutocomplete";
import ResidentAutocomplete, { ResidentOption } from "@/components/common/ResidentAutocomplete";
import ClientAutocomplete, { ClientOption } from "@/components/common/ClientAutocomplete";
import EmployeeAutocomplete, { EmployeeOption } from "@/components/common/EmployeeAutocomplete";
import MinutaFilterBar, { MinutaFilterValues } from "@/components/common/MinutaFilterBar";
import { useTenant } from "@/providers/TenantProvider";
import { HttpClient } from "@/lib/api/client";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { formatDate, formatTime, formatDateTime, formatTimeToHHmm } from "@/lib/formatters";

interface VisitorControlPageProps {
  isInternal?: boolean;
}

export default function VisitorControlPage({ isInternal = false }: VisitorControlPageProps) {
  const [selectedClientFilter, setSelectedClientFilter] = useState<ClientOption | null>(null);
  const [filters, setFilters] = useState<MinutaFilterValues>({});

  // Form State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Autocomplete selection states for Create/Edit Form
  const [selectedUnit, setSelectedUnit] = useState<UnitOption | null>(null);
  const [selectedResident, setSelectedResident] = useState<ResidentOption | null>(null);

  // Internal employee host
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    entryTime: "",
    exitTime: "",
    visitorFullName: "",
    visitorIdNumber: "",
    visitorIdType: "CC",
    peopleCount: 1,
    mode: "PEDESTRIAN",
    ticketNumber: "",
    unitId: "",
    residentId: "",
    destinationApartment: "",
    destinationInterior: "",
    hostName: "",
    authorizedByFullName: "",
    brand: "",
    plate: "",
    observations: "",
  });

  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Exit Modal State (Two-step: Prompt Confirmation -> Modal with Optional Exit Photo)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [selectedExitVisitor, setSelectedExitVisitor] = useState<any | null>(null);
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
        "Debe escoger un cliente específico antes de generar un registro de visitante de cliente."
      );
      return;
    }
    const now = new Date();
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5);
    setEvidenceFile(null);
    setExistingMediaUrl(null);
    setSelectedUnit(null);
    setSelectedResident(null);
    setSelectedEmployee(null);
    setFormData({
      date: now.toISOString().split("T")[0],
      time: currentTime + ":00",
      entryTime: currentTime + ":00",
      exitTime: "",
      visitorFullName: "",
      visitorIdNumber: "",
      visitorIdType: "CC",
      peopleCount: 1,
      mode: "PEDESTRIAN",
      ticketNumber: "",
      unitId: "",
      residentId: "",
      destinationApartment: "",
      destinationInterior: "",
      hostName: "",
      authorizedByFullName: "",
      brand: "",
      plate: "",
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
      const data = await HttpClient.get<any>(`/operation/minuta/visitor/${id}`);
      setEditId(id);
      setIsEditing(true);
      if (data.employeeId) {
        setSelectedEmployee({
          id: data.employeeId,
          fullName: data.employeeName || (data.employee ? data.employee.fullName : "Empleado asignado"),
        });
      } else {
        setSelectedEmployee(null);
      }

      // Pre-set autocomplete options
      if (data.unit) {
        setSelectedUnit(data.unit);
      } else if (data.unitId) {
        setSelectedUnit({
          id: data.unitId,
          unitName: data.destinationApartment || data.apartment || "Unidad",
        });
      } else {
        setSelectedUnit(null);
      }

      if (data.resident) {
        setSelectedResident(data.resident);
      } else if (data.residentId) {
        setSelectedResident({
          id: data.residentId,
          firstName: data.authorizedByFullName || data.hostName || "Residente",
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
        visitorFullName: data.visitorFullName || "",
        visitorIdNumber: data.visitorIdNumber || "",
        visitorIdType: data.visitorIdType || "CC",
        peopleCount: data.peopleCount || 1,
        mode: data.mode || "PEDESTRIAN",
        ticketNumber: data.ticketNumber || "",
        unitId: data.unitId || "",
        residentId: data.residentId || "",
        destinationApartment: data.destinationApartment || data.apartment || "",
        destinationInterior: data.destinationInterior || data.block || "",
        hostName: data.hostName || data.authorizedByFullName || "",
        authorizedByFullName: data.authorizedByFullName || "",
        brand: data.brand || "",
        plate: data.plate || "",
        observations: data.observations || "",
      });

      // Load existing S3 media
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.VISITOR, id);
      if (mediaList && mediaList.length > 0) {
        const entryMedia = mediaList.find((m: any) => m.subType !== "exit") || mediaList[0];
        setExistingMediaUrl(entryMedia.presignedUrl || null);
      }

      setDialogOpen(true);
    } catch {
      showError("Error al cargar la información del visitante");
    }
  };

  // Bidirectional Autocomplete Handlers
  const handleUnitChange = (unit: UnitOption | null) => {
    setSelectedUnit(unit);
    if (!unit) {
      setFormData((prev) => ({
        ...prev,
        unitId: "",
        destinationApartment: "",
        destinationInterior: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        unitId: unit.id,
        destinationApartment: unit.unitName,
        destinationInterior: unit.tower?.towerName || prev.destinationInterior,
      }));
      // Reset resident if current resident doesn't belong to this unit
      if (selectedResident && selectedResident.unitId !== unit.id) {
        setSelectedResident(null);
        setFormData((prev) => ({ ...prev, residentId: "", hostName: "" }));
      }
    }
  };

  const handleResidentChange = (resident: ResidentOption | null) => {
    setSelectedResident(resident);
    if (!resident) {
      setFormData((prev) => ({ ...prev, residentId: "", hostName: "" }));
    } else {
      const fullName = `${resident.firstName} ${resident.lastName}`.trim();
      setFormData((prev) => ({
        ...prev,
        residentId: resident.id,
        hostName: fullName,
        authorizedByFullName: fullName,
      }));

      // If resident is linked to a unit and user hasn't selected one or it differs
      if (resident.unit && (!selectedUnit || selectedUnit.id !== resident.unit.id)) {
        const matchingUnit: UnitOption = {
          id: resident.unit.id,
          unitName: resident.unit.unitName,
          tower: resident.unit.tower,
        };
        setSelectedUnit(matchingUnit);
        setFormData((prev) => ({
          ...prev,
          unitId: matchingUnit.id,
          destinationApartment: matchingUnit.unitName,
          destinationInterior: matchingUnit.tower?.towerName || prev.destinationInterior,
        }));
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

  // Handler: Guardar (Crear o Actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.visitorFullName.trim()) {
      showError("El nombre del visitante es requerido");
      return;
    }
    if (!formData.visitorIdNumber.trim()) {
      showError("El documento del visitante es requerido");
      return;
    }

    if (isInternal && !selectedEmployee) {
      showError("Debe seleccionar el empleado anfitrión");
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
        visitorFullName: formData.visitorFullName.trim(),
        visitorIdNumber: formData.visitorIdNumber.trim(),
        visitorIdType: formData.visitorIdType,
        mode: formData.mode,
        peopleCount: Number(formData.peopleCount) || 1,
        ticketNumber: formData.ticketNumber?.trim() || null,
        isInternal: isInternal,
        employeeId: isInternal ? selectedEmployee?.id || null : null,
        destination: isInternal
          ? selectedEmployee ? `Empleado: ${selectedEmployee.fullName}` : null
          : formData.destinationApartment || null,
        apartment: isInternal ? null : formData.destinationApartment || null,
        block: isInternal ? null : formData.destinationInterior || null,
        authorizedByFullName: isInternal
          ? selectedEmployee?.fullName || null
          : formData.hostName || formData.authorizedByFullName || null,
        observations: formData.observations?.trim() || null,
        clientId: isInternal ? null : activeClientId || null,
        unitId: isInternal ? null : selectedUnit?.id || formData.unitId || null,
        residentId: isInternal ? null : selectedResident?.id || formData.residentId || null,
      };

      if (formData.mode === "VEHICLE") {
        payload.brand = formData.brand?.trim() || null;
        payload.plate = formData.plate?.trim() || null;
      }

      let savedRecord: any;
      if (isEditing && editId) {
        if (formData.exitTime) {
          payload.exitTime = formData.exitTime.length === 5 ? `${formData.exitTime}:00` : formData.exitTime;
        }
        savedRecord = await HttpClient.patch(`/operation/minuta/visitor/${editId}`, payload);
        showSuccess("Registro de visitante actualizado correctamente");
      } else {
        savedRecord = await HttpClient.post("/operation/minuta/visitor", payload);
        showSuccess("Ingreso de visitante registrado exitosamente");
      }

      const entityId = editId || savedRecord?.id;
      if (evidenceFile && entityId) {
        try {
          await StorageApi.uploadMedia({
            file: evidenceFile,
            entityType: MediaTypeCategory.VISITOR,
            entityId,
            clientId: isInternal ? null : activeClientId || null,
            subType: "visitor",
          });
          showSuccess("Fotografía/Evidencia de visitante subida a la nube");
        } catch (uploadErr) {
          console.error("S3 upload error:", uploadErr);
          showError("Registro guardado, pero ocurrió un problema al subir la foto a la nube");
        }
      }

      setDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al procesar el registro");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Salida Flow: Confirmation -> Modal with Photo ---
  const handleStartExitConfirmation = (row: any) => {
    setSelectedExitVisitor(row);
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
    if (!selectedExitVisitor) return;

    setExitSubmitting(true);
    try {
      const exitTimeFormatted = exitTime.length === 5 ? `${exitTime}:00` : exitTime;

      await HttpClient.patch(`/operation/minuta/visitor/${selectedExitVisitor.id}/exit`, {
        exitTime: exitTimeFormatted,
        observations: exitObservations.trim() || undefined,
      });

      if (exitEvidenceFile) {
        try {
          await StorageApi.uploadMedia({
            file: exitEvidenceFile,
            entityType: MediaTypeCategory.VISITOR,
            entityId: selectedExitVisitor.id,
            clientId: isInternal ? null : activeClientId || null,
            subType: "exit",
          });
        } catch (s3Err) {
          console.error("Error subiendo foto de salida:", s3Err);
          showError("Salida registrada, pero ocurrió un problema al subir la foto a S3.");
        }
      }

      showSuccess(`Salida del visitante ${selectedExitVisitor.visitorFullName} registrada`);
      setExitModalOpen(false);
      setSelectedExitVisitor(null);
      setExitEvidenceFile(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al registrar la salida");
    } finally {
      setExitSubmitting(false);
    }
  };

  // Handler: Ver Detalle
  const handleViewDetail = async (row: any) => {
    setDetailRecord(row);
    setDetailPhotos({});
    try {
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.VISITOR, row.id);
      if (mediaList && mediaList.length > 0) {
        const entryMedia = mediaList.find((m: any) => m.subType === "visitor" || !m.subType) || mediaList[0];
        const exitMedia = mediaList.find((m: any) => m.subType === "exit");
        setDetailPhotos({
          entryUrl: entryMedia?.presignedUrl || null,
          exitUrl: exitMedia?.presignedUrl || null,
        });
      }
    } catch { }
  };

  // Handler: Ver foto
  const handleViewEvidence = async (row: any) => {
    setPreviewLoading(true);
    setPreviewModalUrl(null);
    try {
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.VISITOR, row.id);
      if (mediaList && mediaList.length > 0) {
        const targetMedia = mediaList.find((m: any) => m.subType === "visitor" || !m.subType) || mediaList[0];
        setPreviewModalUrl(targetMedia.presignedUrl || null);
      } else {
        showError("No hay fotografía asociada al visitante");
      }
    } catch {
      showError("Error al obtener la imagen segura");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handler: Eliminar
  const handleDelete = async (id: string) => {
    try {
      await HttpClient.delete(`/operation/minuta/visitor/${id}`);
      showSuccess("Registro eliminado");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al eliminar el registro");
    }
  };

  const handleFilterChange = useCallback((newFilters: MinutaFilterValues) => {
    setFilters(newFilters);
  }, []);

  // Endpoint reactivo con query params de filtros
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
    return queryStr ? `/operation/minuta/visitor?${queryStr}` : "/operation/minuta/visitor";
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
      headerName: "Ingreso",
      width: 90,
      valueFormatter: (value: any) => formatTime(value),
    },
    {
      field: "visitorFullName",
      headerName: "Visitante",
      width: 190,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.15 }}>
            {params.row.visitorFullName}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", lineHeight: 1, mt: "2px", fontSize: "0.75rem" }}
          >
            {params.row.visitorIdType || "CC"} {params.row.visitorIdNumber}
          </Typography>
        </Box>
      ),
    },
    ...(isInternal
      ? [
        {
          field: "employeeName",
          headerName: "Empleado Anfitrión",
          width: 200,
          renderCell: (params: any) => {
            const emp =
              params.row.employeeName ||
              params.row.employee?.fullName ||
              params.row.authorizedByFullName ||
              params.row.hostName;
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
          width: 150,
          renderCell: (params: any) => {
            const name =
              params.row.unitName ||
              params.row.unit?.unitName ||
              params.row.destinationApartment ||
              params.row.destination ||
              "—";
            return (
              <Box sx={{ display: "flex", alignItems: "center", height: "100%", gap: 0.8 }}>
                <HomeWorkIcon sx={{ fontSize: 18, color: "primary.main" }} />
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {name}
                </Typography>
              </Box>
            );
          },
        },
        {
          field: "residentName",
          headerName: "Residente / Anfitrión",
          width: 180,
          renderCell: (params: any) => {
            const res =
              params.row.residentName ||
              (params.row.resident
                ? `${params.row.resident.firstName} ${params.row.resident.lastName}`
                : params.row.hostName || params.row.authorizedByFullName || "—");
            return (
              <Box sx={{ display: "flex", alignItems: "center", height: "100%", gap: 0.6 }}>
                <PersonIcon sx={{ fontSize: 17, color: "text.secondary" }} />
                <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                  {res}
                </Typography>
              </Box>
            );
          },
        },
      ]),
    {
      field: "mode",
      headerName: "Tipo",
      width: 120,
      renderCell: (params) => {
        const isVehicle = params.row.mode === "VEHICLE" || Boolean(params.row.plate);
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            {isVehicle ? (
              <Chip
                size="small"
                icon={<CarIcon sx={{ fontSize: 15 }} />}
                label={params.row.plate || "Vehicular"}
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: "0.72rem" }}
              />
            ) : (
              <Chip
                size="small"
                label="Peatonal"
                variant="outlined"
                sx={{ fontSize: "0.72rem" }}
              />
            )}
          </Box>
        );
      },
    },
    {
      field: "ticketNumber",
      headerName: "Ficha",
      width: 90,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          {params.value ? (
            <Chip
              size="small"
              icon={<BadgeIcon sx={{ fontSize: 14 }} />}
              label={params.value}
              sx={{ fontWeight: 600, fontSize: "0.72rem" }}
            />
          ) : (
            <Typography variant="body2" sx={{ color: "text.disabled" }}>
              —
            </Typography>
          )}
        </Box>
      ),
    },
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
      width: 150,
      valueGetter: (value: any) => value || "Sistema",
    },
  ], [isInternal]);

  return (
    <>
      {/* Selector de Cliente para usuarios globales */}
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
            ? "Buscar por visitante, documento o empleado..."
            : "Buscar por nombre, documento o placa..."
        }
        showUnitFilter={!isInternal}
        showResidentFilter={!isInternal}
      />

      <DataTable
        title={
          isInternal
            ? `Control de Visitantes e Ingresos - ${tenant?.name || "Interno"}`
            : "Control de Visitantes e Ingresos"
        }
        endpoint={endpoint}
        columns={columns}
        breadcrumbs={
          isInternal
            ? [
              { label: "Operaciones" },
              { label: `Minutas de ${tenant?.name || "la Empresa"}` },
              { label: "Control de Visitantes" },
            ]
            : [
              { label: "Operaciones" },
              { label: "Minutas del Cliente" },
              { label: "Control de Visitantes" },
            ]
        }
        onCreate={canCreate ? handleOpenCreate : undefined}
        onEdit={canEdit ? (id) => handleEdit(id) : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        confirmDelete={true}
        deleteDialogTitle="Confirmar Eliminación de Visitante"
        deleteDialogMessage="¿Estás seguro de que deseas eliminar este registro de control de visitantes? Esta acción no se puede deshacer."
        deleteActionLabel="Eliminar"
        deleteIcon={<DeleteIcon color="error" />}
        onView={handleViewDetail}
        refreshTrigger={refreshTrigger}
        infoDescription={
          isInternal
            ? "Control de accesos y permanencia de visitantes en las sedes o instalaciones corporativas internas."
            : "Control de accesos y permanencia de visitantes en el conjunto residencial o sede corporativa."
        }
        infoInstructions={
          isInternal
            ? `1. Registra el visitante vinculando al empleado anfitrión de la empresa.
2. Cuando el visitante se retire del predio, pulsa 'Marcar Salida' para cerrar el ciclo e incluir opcionalmente una fotografía de salida.`
            : `1. Registra el visitante vinculando obligatoriamente la Unidad y el Residente que autoriza su entrada.
2. Cuando el visitante se retire del predio, pulsa el botón 'Marcar Salida' en su fila correspondiente para cerrar el ciclo e incluir opcionalmente una fotografía de salida.`
        }
      />

      {/* Modal Detalle de Visitante */}
      <DetailDialog
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        title={
          isInternal
            ? "Detalles del Ingreso de Visitante Interno"
            : "Detalles del Ingreso de Visitante"
        }
        headerContent={
          (detailPhotos.entryUrl || detailPhotos.exitUrl) && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {detailPhotos.entryUrl && (
                <Grid size={detailPhotos.exitUrl ? 6 : 12}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.5, textAlign: "center" }}>
                    Foto de Ingreso
                  </Typography>
                  <Box
                    component="img"
                    src={detailPhotos.entryUrl}
                    alt="Foto Ingreso Visitante"
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
                    Foto de Salida
                  </Typography>
                  <Box
                    component="img"
                    src={detailPhotos.exitUrl}
                    alt="Foto Salida Visitante"
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
              { label: "Hora Ingreso", value: formatTime(detailRecord.entryTime || detailRecord.time) },
              {
                label: "Hora Salida",
                value: detailRecord.exitTime ? (
                  formatTime(detailRecord.exitTime)
                ) : (
                  <Chip size="small" label="Dentro del predio" color="warning" />
                ),
              },
              { label: "Visitante", value: detailRecord.visitorFullName },
              {
                label: "Documento",
                value: `${detailRecord.visitorIdType || "CC"}: ${detailRecord.visitorIdNumber}`,
              },
              { label: "N° Personas", value: detailRecord.peopleCount || 1 },
              {
                label: "Tipo Acceso",
                value: (
                  <Chip
                    size="small"
                    label={
                      detailRecord.mode === "VEHICLE" || detailRecord.plate
                        ? `Vehicular (${detailRecord.plate || "Sin Placa"})`
                        : "Peatonal"
                    }
                    color={detailRecord.mode === "VEHICLE" || detailRecord.plate ? "secondary" : "default"}
                  />
                ),
              },
              { label: "Ficha / Ticket", value: detailRecord.ticketNumber || "N/A" },
              ...(isInternal
                ? [
                  {
                    label: "Empleado Anfitrión",
                    value:
                      detailRecord.employeeName ||
                      detailRecord.employee?.fullName ||
                      detailRecord.authorizedByFullName ||
                      detailRecord.hostName ||
                      "N/A",
                  },
                ]
                : [
                  {
                    label: "Unidad / Destino",
                    value:
                      detailRecord.unitName ||
                      detailRecord.unit?.unitName ||
                      detailRecord.destinationApartment ||
                      "N/A",
                  },
                  {
                    label: "Residente Anfitrión",
                    value:
                      detailRecord.residentName ||
                      (detailRecord.resident
                        ? `${detailRecord.resident.firstName} ${detailRecord.resident.lastName}`
                        : detailRecord.hostName || detailRecord.authorizedByFullName || "N/A"),
                  },
                  { label: "Autorizado Por", value: detailRecord.authorizedByFullName || "N/A" },
                ]),
              { label: "Marca / Color Vehículo", value: detailRecord.brand ? `${detailRecord.brand}` : "N/A" },
              { label: "Creado Por", value: detailRecord.createdBy || "Sistema" },
              {
                label: "Fecha Creación",
                value: formatDateTime(detailRecord.createdAt || detailRecord.date),
              },
              { label: "Observaciones", value: detailRecord.observations || "Sin observaciones" },
            ]
            : []
        }
      />

      {/* Modal de Registro / Edición de Visitante */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 2.5 }, m: { xs: 1.5, sm: 3 } } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.25rem" }, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <PersonIcon color="primary" />
            <Box component="span">
              {isEditing
                ? isInternal
                  ? "Actualizar Visitante Interno"
                  : "Actualizar Registro de Visitante"
                : isInternal
                  ? `Nuevo Ingreso - ${tenant?.name || "Empresa"}`
                  : activeClientName
                    ? `Nuevo Registro para ${activeClientName}`
                    : "Nuevo Ingreso de Visitante"}
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
              {/* Sección 1: Destino / Anfitrión */}
              <Grid size={12}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "primary.main", fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  {isInternal ? <BadgeIcon sx={{ fontSize: 18 }} /> : <HomeWorkIcon sx={{ fontSize: 18 }} />}
                  {isInternal ? "1. Empleado Anfitrión" : "1. Destino Residencial y Residente"}
                </Typography>
              </Grid>

              {isInternal ? (
                <Grid size={12}>
                  <EmployeeAutocomplete
                    value={selectedEmployee}
                    onChange={(emp) => setSelectedEmployee(emp)}
                    label="Empleado Anfitrión"
                    placeholder="Buscar empleado por nombre o documento..."
                    required
                  />
                </Grid>
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
                      label="Residente que Autoriza / Visita"
                      placeholder="Buscar por nombre o documento..."
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Destino Manual / Apto (Snapshot)"
                      value={formData.destinationApartment}
                      onChange={(e) => setFormData({ ...formData, destinationApartment: e.target.value })}
                      placeholder="Ej: Apto 304, Torre A"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Nombre de quien autoriza (Manual)"
                      value={formData.hostName}
                      onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                    />
                  </Grid>
                </>
              )}

              {/* Sección 2: Datos del Visitante */}
              <Grid size={12} sx={{ mt: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "primary.main", fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <PersonIcon sx={{ fontSize: 18 }} /> 2. Datos del Visitante
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Nombre Completo del Visitante"
                  value={formData.visitorFullName}
                  onChange={(e) => setFormData({ ...formData, visitorFullName: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="id-type-label">Tipo Doc.</InputLabel>
                  <Select
                    labelId="id-type-label"
                    label="Tipo Doc."
                    value={formData.visitorIdType}
                    onChange={(e) => setFormData({ ...formData, visitorIdType: e.target.value })}
                  >
                    <MenuItem value="CC">Cédula Ciudadanía (CC)</MenuItem>
                    <MenuItem value="CE">Cédula Extranjería (CE)</MenuItem>
                    <MenuItem value="PASSPORT">Pasaporte</MenuItem>
                    <MenuItem value="TI">Tarjeta Identidad</MenuItem>
                    <MenuItem value="OTHER">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Número de Documento"
                  value={formData.visitorIdNumber}
                  onChange={(e) => setFormData({ ...formData, visitorIdNumber: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Cant. Personas"
                  value={formData.peopleCount}
                  onChange={(e) => setFormData({ ...formData, peopleCount: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="N° Ficha / Gafete"
                  value={formData.ticketNumber}
                  onChange={(e) => setFormData({ ...formData, ticketNumber: e.target.value })}
                  placeholder="Ej: F-12"
                />
              </Grid>

              {/* Sección 3: Fechas y Horas */}
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
                  label="Hora Ingreso"
                  value={formData.entryTime}
                  onChange={(e) => setFormData({ ...formData, entryTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="mode-select-label">Modalidad de Ingreso</InputLabel>
                  <Select
                    labelId="mode-select-label"
                    label="Modalidad de Ingreso"
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  >
                    <MenuItem value="PEDESTRIAN">Peatonal</MenuItem>
                    <MenuItem value="VEHICLE">Vehicular</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.mode === "VEHICLE" && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Marca / Modelo del Vehículo"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Ej: Renault Duster"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Placa del Vehículo"
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                      placeholder="Ej: ABC-123"
                    />
                  </Grid>
                </>
              )}

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
                  label="Observaciones"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Detalles sobre el ingreso o pertenencias..."
                />
              </Grid>

              {/* Sección 4: Evidencia Fotográfica (S3) */}
              <Grid size={12} sx={{ mt: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "primary.main", fontWeight: 700, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <CameraIcon sx={{ fontSize: 18 }} /> 4. Evidencia Fotográfica de Ingreso
                </Typography>
                <ImageUploadCapture
                  label="Fotografía del Visitante / Documento / Vehículo"
                  variant="evidence"
                  value={evidenceFile}
                  previewUrl={existingMediaUrl}
                  onChange={setEvidenceFile}
                  helperText="Toma una foto en vivo con la cámara o selecciona una imagen de tu dispositivo."
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
          <WarningIcon color="warning" /> Confirmar Salida
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            ¿Está seguro de que desea registrar la salida del visitante?
          </Typography>
          {selectedExitVisitor && (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "action.hover" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {selectedExitVisitor.visitorFullName}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Doc: {selectedExitVisitor.visitorIdType || "CC"} {selectedExitVisitor.visitorIdNumber}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Destino: {selectedExitVisitor.unitName || selectedExitVisitor.destinationApartment || "N/A"}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Hora de Entrada: {formatTime(selectedExitVisitor.entryTime || selectedExitVisitor.time)}
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

      {/* Paso 2 Salida: Modal de Salida con Fotografía y Observaciones */}
      <Dialog
        open={exitModalOpen}
        onClose={() => !exitSubmitting && setExitModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <LogoutIcon color="warning" /> Registro de Salida de Visitante
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          {selectedExitVisitor && (
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 1.5, bgcolor: "background.default" }}>
              <Grid container spacing={1}>
                <Grid size={7}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Visitante:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedExitVisitor.visitorFullName}
                  </Typography>
                </Grid>
                <Grid size={5}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Unidad:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedExitVisitor.unitName || selectedExitVisitor.destinationApartment || "N/A"}
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
              placeholder="Detalles sobre pertenencias retiradas, estado o notas de retiro..."
            />

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5 }}>
              <CameraIcon sx={{ fontSize: 18 }} /> Evidencia Fotográfica de Salida (Opcional)
            </Typography>

            <ImageUploadCapture
              label="Fotografía de Salida del Visitante"
              variant="evidence"
              value={exitEvidenceFile}
              onChange={setExitEvidenceFile}
              helperText="Toma una foto en vivo al visitante al salir o selecciona una imagen (opcional)."
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
                alt="Foto Visitante"
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
