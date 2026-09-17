"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { useAuth } from "@/components/AuthContext";
import DataTable from "@/components/common/DataTable";
import DetailDialog from "@/components/common/DetailDialog";
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
  Card,
  CardContent,
  CircularProgress,
  Tabs,
  Tab,
  InputAdornment,
} from "@mui/material";
import {
  LocalShipping as LocalShippingIcon,
  HomeWork as HomeWorkIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  CameraAlt as CameraIcon,
  Inventory as PackageIcon,
  CalendarMonth as CalendarMonthIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import ImageUploadCapture from "@/components/common/ImageUploadCapture";
import UnitAutocomplete, { UnitOption } from "@/components/common/UnitAutocomplete";
import ResidentAutocomplete, { ResidentOption } from "@/components/common/ResidentAutocomplete";
import ClientAutocomplete, { ClientOption } from "@/components/common/ClientAutocomplete";
import EmployeeAutocomplete, { EmployeeOption } from "@/components/common/EmployeeAutocomplete";
import MinutaFilterBar, { MinutaFilterValues } from "@/components/common/MinutaFilterBar";
import { useTenant } from "@/providers/TenantProvider";
import { HttpClient } from "@/lib/api/client";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { formatDate, formatTime, formatDateTime, formatTimeToHHmm } from "@/lib/formatters";

interface CorrespondencePageProps {
  isInternal?: boolean;
}

export default function CorrespondencePage({ isInternal = false }: CorrespondencePageProps) {
  const [selectedClientFilter, setSelectedClientFilter] = useState<ClientOption | null>(null);
  const [filters, setFilters] = useState<MinutaFilterValues>({});

  // Form de Nuevo Registro
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Autocomplete state
  const [selectedUnit, setSelectedUnit] = useState<UnitOption | null>(null);
  const [selectedResident, setSelectedResident] = useState<ResidentOption | null>(null);

  // Internal employee destination
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    receivedTime: "",
    destination: "",
    unitId: "",
    recipientResidentId: "",
    sender: "",
    courierCompany: "",
    trackingNumber: "",
    receivedByName: "",
    correspondenceType: "BOX",
    observations: "",
  });

  // Modal de Entrega con Evidencias Fotográficas
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [selectedRecordForDelivery, setSelectedRecordForDelivery] = useState<any>(null);
  const [deliveredToName, setDeliveredToName] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [receptionPhotoUrlForDelivery, setReceptionPhotoUrlForDelivery] = useState<string | null>(null);
  const [evidenceDeliveryFile, setEvidenceDeliveryFile] = useState<File | null>(null);
  const [existingDeliveryMediaUrl, setExistingDeliveryMediaUrl] = useState<string | null>(null);
  const [evidenceReceptionFile, setEvidenceReceptionFile] = useState<File | null>(null);
  const [existingReceptionMediaUrl, setExistingReceptionMediaUrl] = useState<string | null>(null);
  const [delivering, setDelivering] = useState(false);

  // Modal de Detalle
  const [detailRecord, setDetailRecord] = useState<any | null>(null);
  const [detailPhotos, setDetailPhotos] = useState<{ receptionUrl?: string | null; deliveryUrl?: string | null }>({});

  // Modal de Vista Previa de Evidencia
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewPhotos, setPreviewPhotos] = useState<{ receptionUrl?: string | null; deliveryUrl?: string | null }>({});
  const [previewTab, setPreviewTab] = useState<number>(0);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  // Handler: Abrir modal de nuevo paquete
  const handleOpenCreate = () => {
    if (!isInternal && isGlobalUser && !activeClientId) {
      showError(
        "Debe escoger un cliente específico antes de generar un registro de correspondencia de cliente."
      );
      return;
    }
    const now = new Date();
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5);
    setEvidenceReceptionFile(null);
    setExistingReceptionMediaUrl(null);
    setSelectedUnit(null);
    setSelectedResident(null);
    setSelectedEmployee(null);
    setEditId(null);
    setIsEditing(false);
    setFormData({
      date: now.toISOString().split("T")[0],
      time: currentTime + ":00",
      receivedTime: currentTime + ":00",
      destination: "",
      unitId: "",
      recipientResidentId: "",
      sender: "",
      courierCompany: "",
      trackingNumber: "",
      receivedByName: session?.user?.fullName || "",
      correspondenceType: "BOX",
      observations: "",
    });
    setDialogOpen(true);
  };

  // Handler: Editar paquete
  const handleEdit = async (id: string) => {
    try {
      setEvidenceReceptionFile(null);
      setExistingReceptionMediaUrl(null);
      const data = await HttpClient.get<any>(`/operation/minuta/correspondence/${id}`);
      setEditId(id);
      setIsEditing(true);

      if (data.recipientEmployeeId) {
        setSelectedEmployee({
          id: data.recipientEmployeeId,
          fullName: data.recipientEmployeeName || (data.recipientEmployee ? data.recipientEmployee.fullName : "Empleado destinatario"),
        });
      } else {
        setSelectedEmployee(null);
      }

      if (data.unit) {
        setSelectedUnit(data.unit);
      } else if (data.unitId) {
        setSelectedUnit({
          id: data.unitId,
          unitName: data.destination || "Unidad",
        });
      } else {
        setSelectedUnit(null);
      }

      if (data.recipientResident) {
        setSelectedResident(data.recipientResident);
      } else if (data.recipientResidentId) {
        setSelectedResident({
          id: data.recipientResidentId,
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
        receivedTime: data.receivedTime ? formatTimeToHHmm(data.receivedTime) : (data.time ? formatTimeToHHmm(data.time) : ""),
        destination: data.destination || "",
        unitId: data.unitId || "",
        recipientResidentId: data.recipientResidentId || "",
        sender: data.sender || "",
        courierCompany: data.courierCompany || "",
        trackingNumber: data.trackingNumber || "",
        receivedByName: data.receivedByName || "",
        correspondenceType: data.correspondenceType || "BOX",
        observations: data.observations || "",
      });

      // Cargar adjuntos de recepción existentes
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.CORRESPONDENCE, id);
      if (mediaList && mediaList.length > 0) {
        const reception = mediaList.find((m: any) => m.s3Key?.includes("reception")) || mediaList[0];
        setExistingReceptionMediaUrl(reception.presignedUrl || null);
      }

      setDialogOpen(true);
    } catch {
      showError("Error al cargar la información del paquete");
    }
  };

  // Bidirectional Autocomplete Handlers
  const handleUnitChange = (unit: UnitOption | null) => {
    setSelectedUnit(unit);
    if (!unit) {
      setFormData((prev) => ({
        ...prev,
        unitId: "",
        destination: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        unitId: unit.id,
        destination: unit.unitName,
      }));
      if (selectedResident && selectedResident.unitId !== unit.id) {
        setSelectedResident(null);
        setFormData((prev) => ({ ...prev, recipientResidentId: "" }));
      }
    }
  };

  const handleResidentChange = (resident: ResidentOption | null) => {
    setSelectedResident(resident);
    if (!resident) {
      setFormData((prev) => ({ ...prev, recipientResidentId: "" }));
    } else {
      setFormData((prev) => ({
        ...prev,
        recipientResidentId: resident.id,
      }));

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
          destination: matchingUnit.unitName,
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

  // Handler: Guardar Recepción
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dest = isInternal
      ? selectedEmployee ? `Empleado: ${selectedEmployee.fullName}` : "Uso Interno"
      : formData.destination.trim() || selectedUnit?.unitName;
    if (!isInternal && !dest) {
      showError("Debes especificar el destino (Unidad o Apartamento)");
      return;
    }
    if (isInternal && !selectedEmployee) {
      showError("Debes seleccionar el empleado destinatario");
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const timeVal = formData.time.length === 5 ? `${formData.time}:00` : formData.time;
      const receivedTimeVal = formData.receivedTime.length === 5 ? `${formData.receivedTime}:00` : formData.receivedTime;
      const dateVal = formData.date || now.toISOString().split("T")[0];

      const payload: any = {
        date: dateVal,
        time: timeVal,
        occurredAt: `${dateVal}T${timeVal}Z`,
        receivedTime: receivedTimeVal,
        destination: dest,
        sender: formData.sender?.trim() || null,
        courierCompany: formData.courierCompany?.trim() || null,
        trackingNumber: formData.trackingNumber?.trim() || null,
        receivedByName: formData.receivedByName?.trim() || null,
        correspondenceType: formData.correspondenceType,
        observations: formData.observations?.trim() || null,
        isInternal: isInternal,
        recipientEmployeeId: isInternal ? selectedEmployee?.id || null : null,
        clientId: isInternal ? null : activeClientId || null,
        unitId: isInternal ? null : selectedUnit?.id || formData.unitId || null,
        recipientResidentId: isInternal ? null : selectedResident?.id || formData.recipientResidentId || null,
      };

      let savedRecord: any;
      if (isEditing && editId) {
        savedRecord = await HttpClient.patch(`/operation/minuta/correspondence/${editId}`, payload);
        showSuccess("Correspondencia actualizada exitosamente");
      } else {
        savedRecord = await HttpClient.post("/operation/minuta/correspondence", payload);
        showSuccess("Correspondencia/domicilio registrado");
      }

      const entityId = editId || savedRecord?.id;
      if (evidenceReceptionFile && entityId) {
        try {
          await StorageApi.uploadMedia({
            file: evidenceReceptionFile,
            entityType: MediaTypeCategory.CORRESPONDENCE,
            entityId,
            clientId: isInternal ? null : activeClientId || null,
            subType: "reception",
          });
          showSuccess("Foto del paquete en recepción guardada");
        } catch (uploadErr) {
          console.error("Upload error:", uploadErr);
        }
      }

      setDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al registrar la correspondencia");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Abrir Modal de Entrega
  const handleOpenDelivery = async (row: any) => {
    setSelectedRecordForDelivery(row);
    setDeliveredToName(
      isInternal
        ? row.recipientEmployeeName || (row.recipientEmployee ? row.recipientEmployee.fullName : "")
        : row.recipientResidentName ||
        (row.recipientResident ? `${row.recipientResident.firstName} ${row.recipientResident.lastName}` : "")
    );
    setDeliveryNotes("");
    setEvidenceDeliveryFile(null);
    setExistingDeliveryMediaUrl(null);
    setReceptionPhotoUrlForDelivery(null);

    // Cargar fotos asociadas al paquete
    try {
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.CORRESPONDENCE, row.id);
      if (mediaList && mediaList.length > 0) {
        const reception = mediaList.find((m: any) => m.s3Key?.includes("reception")) || mediaList[0];
        const delivery = mediaList.find((m: any) => m.s3Key?.includes("delivery"));
        if (reception) setReceptionPhotoUrlForDelivery(reception.presignedUrl || null);
        if (delivery) setExistingDeliveryMediaUrl(delivery.presignedUrl || null);
      } else if (row.deliveryEvidenceUrl && row.deliveryEvidenceUrl.startsWith("http")) {
        setExistingDeliveryMediaUrl(row.deliveryEvidenceUrl);
      }
    } catch { }

    setDeliveryDialogOpen(true);
  };

  // Handler: Confirmar Entrega
  const handleConfirmDelivery = async () => {
    if (!deliveredToName.trim()) {
      showError("Debes especificar el nombre de la persona que reclama el paquete");
      return;
    }

    setDelivering(true);
    try {
      let uploadedUrl: string | undefined = undefined;

      // 1. Subir fotografía de entrega si se adjuntó
      if (evidenceDeliveryFile) {
        try {
          const media = await StorageApi.uploadMedia({
            file: evidenceDeliveryFile,
            entityType: MediaTypeCategory.CORRESPONDENCE,
            entityId: selectedRecordForDelivery.id,
            clientId: isInternal ? null : activeClientId || null,
            subType: "delivery",
          });
          uploadedUrl = media.url;
        } catch (s3Err) {
          console.error("Error subiendo foto de entrega:", s3Err);
        }
      }

      const payload = {
        deliveredToName: deliveredToName.trim(),
        deliveryEvidenceUrl: uploadedUrl || selectedRecordForDelivery.deliveryEvidenceUrl || null,
        deliveryNotes: deliveryNotes.trim() || null,
      };

      await HttpClient.patch(
        `/operation/minuta/correspondence/${selectedRecordForDelivery.id}/deliver`,
        payload
      );

      showSuccess(
        isInternal
          ? "¡Paquete entregado al colaborador exitosamente!"
          : "¡Paquete entregado al residente exitosamente!"
      );
      setDeliveryDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al registrar la entrega");
    } finally {
      setDelivering(false);
    }
  };

  // Handler: Ver detalle completo del registro
  const handleViewDetail = async (row: any) => {
    setDetailRecord(row);
    setDetailPhotos({});
    try {
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.CORRESPONDENCE, row.id);
      if (mediaList && mediaList.length > 0) {
        const reception = mediaList.find((m: any) => m.s3Key?.includes("reception")) || mediaList[0];
        const delivery = mediaList.find((m: any) => m.s3Key?.includes("delivery"));
        setDetailPhotos({
          receptionUrl: reception?.presignedUrl || null,
          deliveryUrl: delivery?.presignedUrl || null,
        });
      } else if (row.deliveryEvidenceUrl && row.deliveryEvidenceUrl.startsWith("http")) {
        setDetailPhotos({
          receptionUrl: null,
          deliveryUrl: row.deliveryEvidenceUrl,
        });
      }
    } catch { }
  };

  // Handler: Ver foto
  const handleViewEvidence = async (row: any) => {
    setPreviewLoading(true);
    setPreviewPhotos({});
    setPreviewTab(0);
    setPreviewModalOpen(true);
    try {
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.CORRESPONDENCE, row.id);
      if (mediaList && mediaList.length > 0) {
        const reception = mediaList.find((m: any) => m.s3Key?.includes("reception")) || mediaList[0];
        const delivery = mediaList.find((m: any) => m.s3Key?.includes("delivery"));
        setPreviewPhotos({
          receptionUrl: reception?.presignedUrl || null,
          deliveryUrl: delivery?.presignedUrl || row.deliveryEvidenceUrl || null,
        });
      } else if (row.deliveryEvidenceUrl) {
        setPreviewPhotos({
          receptionUrl: null,
          deliveryUrl: row.deliveryEvidenceUrl,
        });
        setPreviewTab(1);
      }
    } catch {
      showError("Error al cargar las evidencias fotográficas");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handler: Eliminar
  const handleDelete = async (id: string) => {
    try {
      await HttpClient.delete(`/operation/minuta/correspondence/${id}`);
      showSuccess("Registro de correspondencia eliminado");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al eliminar el registro");
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
    return queryStr ? `/operation/minuta/correspondence?${queryStr}` : "/operation/minuta/correspondence";
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
      field: "receivedTime",
      headerName: "Hora",
      width: 85,
      valueFormatter: (value: any) => formatTime(value),
    },
    ...(isInternal
      ? [
        {
          field: "recipientEmployeeName",
          headerName: "Empleado Destinatario",
          width: 200,
          renderCell: (params: any) => {
            const emp =
              params.row.recipientEmployeeName ||
              params.row.recipientEmployee?.fullName ||
              params.row.deliveredToName;
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
          field: "destination",
          headerName: "Unidad / Destino",
          width: 150,
          renderCell: (params: any) => {
            const dest =
              params.row.unitName ||
              params.row.unit?.unitName ||
              params.row.destination ||
              "—";
            return (
              <Box sx={{ display: "flex", alignItems: "center", height: "100%", gap: 0.8 }}>
                <HomeWorkIcon sx={{ fontSize: 18, color: "primary.main" }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {dest}
                </Typography>
              </Box>
            );
          },
        },
        {
          field: "recipientResidentName",
          headerName: "Destinatario",
          width: 170,
          renderCell: (params: any) => {
            const res =
              params.row.recipientResidentName ||
              (params.row.recipientResident
                ? `${params.row.recipientResident.firstName} ${params.row.recipientResident.lastName}`
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
    {
      field: "correspondenceType",
      headerName: "Tipo",
      width: 110,
      renderCell: (params) => {
        const typeMap: Record<string, string> = {
          BOX: "Caja",
          ENVELOPE: "Sobre",
          DOCUMENT: "Documento",
          LETTER: "Carta",
          PACKAGE: "Paquete",
          FOOD_DELIVERY: "Comida / Domicilio",
          OTHER: "Otro",
        };
        return (
          <Chip
            size="small"
            label={typeMap[params.value] || params.value || "Paquete"}
            variant="outlined"
            icon={<PackageIcon sx={{ fontSize: 14 }} />}
            sx={{ fontWeight: 500, fontSize: "0.75rem" }}
          />
        );
      },
    },
    {
      field: "courierCompany",
      headerName: "Empresa",
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%", gap: 0.5 }}>
          <LocalShippingIcon sx={{ fontSize: 16, color: "text.disabled" }} />
          <Typography variant="body2">{params.value || "Directa"}</Typography>
        </Box>
      ),
    },
    {
      field: "trackingNumber",
      headerName: "N° Guía",
      width: 110,
      valueGetter: (value: any) => value || "—",
    },
    {
      field: "evidence",
      headerName: "Evidencia",
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const hasEvidence =
          (params.row.mediaAttachments && params.row.mediaAttachments.length > 0) ||
          Boolean(params.row.deliveryEvidenceUrl);
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            {!hasEvidence ? (
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
      field: "deliveryAction",
      headerName: "Estado / Entrega",
      width: 180,
      sortable: false,
      renderCell: (params) => {
        const isDelivered = params.row.status === "DELIVERED";
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            {isDelivered ? (
              <Chip
                size="small"
                icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                label="Entregado"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: "0.75rem" }}
              />
            ) : (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<CheckCircleIcon sx={{ fontSize: 15 }} />}
                onClick={() => handleOpenDelivery(params.row)}
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
                {isInternal ? "Entregar al Empleado" : "Entregar al Residente"}
              </Button>
            )}
          </Box>
        );
      },
    },
    {
      field: "receivedByName",
      headerName: "Recepcionado Por",
      width: 140,
      valueGetter: (value: any, row: any) => value || row.createdBy || "Guardia",
    },
  ], [isInternal]);

  return (
    <>
      {/* Selector de Cliente con ClientAutocomplete para usuarios globales en vista de cliente */}
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
            Cliente / Puesto de Seguridad:
          </Typography>
          <Box sx={{ flex: 1, maxWidth: 450 }}>
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
        showUnitFilter={!isInternal}
        showResidentFilter={!isInternal}
        onFilterChange={handleFilterChange}
        searchPlaceholder={
          isInternal
            ? "Buscar por guía, empleado destinatario, remitente o empresa..."
            : "Buscar por guía, destinatario, remitente o empresa..."
        }
      />

      <DataTable
        title={
          isInternal
            ? `Correspondencia de ${tenant?.name || "la Empresa"}`
            : "Control de Correspondencia y Paquetería"
        }
        endpoint={endpoint}
        columns={columns}
        breadcrumbs={[
          { label: "Operaciones" },
          {
            label: isInternal
              ? `Minutas de ${tenant?.name || "la Empresa"}`
              : "Minutas del Cliente",
          },
          { label: "Correspondencia" },
        ]}
        onCreate={canCreate ? handleOpenCreate : undefined}
        onEdit={canEdit ? (id) => handleEdit(id) : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        confirmDelete={true}
        deleteDialogTitle="Confirmar Eliminación de Correspondencia"
        deleteDialogMessage="¿Estás seguro de que deseas eliminar este registro de correspondencia? Esta acción no se puede deshacer."
        deleteActionLabel="Eliminar"
        deleteIcon={<DeleteIcon color="error" />}
        onView={handleViewDetail}
        refreshTrigger={refreshTrigger}
        infoDescription={
          isInternal
            ? "Control integral de paquetes, encomiendas y correspondencia interna recibida y entregada al personal de la empresa."
            : "Control integral de paquetes, encomiendas y correspondencia recibida en portería y entregada a residentes."
        }
        infoInstructions={
          isInternal
            ? `1. Registra el paquete asociándolo al empleado destinatario de la empresa con fotografía en recepción.
2. Al entregar al empleado, pulsa 'Entregar al Empleado' para capturar la fotografía de entrega y registrar la firma de recepción.`
            : `1. Registra el paquete asociándolo a una Unidad/Apartamento con fotografía en recepción.
2. Al entregar al residente, pulsa 'Entregar al Residente' para capturar la fotografía de entrega y registrar la firma de recepción.`
        }
      />

      {/* Modal Detalle de Correspondencia */}
      <DetailDialog
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        title={
          isInternal
            ? "Detalles del Paquete / Correspondencia Interna"
            : "Detalles del Paquete / Correspondencia"
        }
        headerContent={
          (detailPhotos.receptionUrl || detailPhotos.deliveryUrl) && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {detailPhotos.receptionUrl && (
                <Grid size={detailPhotos.deliveryUrl ? 6 : 12}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.5, textAlign: "center" }}>
                    Foto en Recepción
                  </Typography>
                  <Box
                    component="img"
                    src={detailPhotos.receptionUrl}
                    alt="Foto Recepción"
                    sx={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "black" }}
                  />
                </Grid>
              )}
              {detailPhotos.deliveryUrl && (
                <Grid size={detailPhotos.receptionUrl ? 6 : 12}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.5, textAlign: "center" }}>
                    Foto en Entrega
                  </Typography>
                  <Box
                    component="img"
                    src={detailPhotos.deliveryUrl}
                    alt="Foto Entrega"
                    sx={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "black" }}
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
              { label: "Fecha Recepción", value: formatDate(detailRecord.date) },
              { label: "Hora Recepción", value: formatTime(detailRecord.receivedTime || detailRecord.time) },
              ...(isInternal
                ? [
                  {
                    label: "Empleado Destinatario",
                    value: detailRecord.recipientEmployeeName || detailRecord.recipientEmployee?.fullName || "Sin asignar",
                  },
                ]
                : [
                  {
                    label: "Destino (Unidad)",
                    value: detailRecord.unitName || detailRecord.unit?.unitName || detailRecord.destination || "N/A",
                  },
                  {
                    label: "Destinatario",
                    value: detailRecord.recipientResidentName || "Sin especificar",
                  },
                ]),
              {
                label: "Tipo de Correspondencia",
                value:
                  ({
                    BOX: "Caja",
                    ENVELOPE: "Sobre",
                    DOCUMENT: "Documento",
                    LETTER: "Carta",
                    PACKAGE: "Paquete",
                    FOOD_DELIVERY: "Comida / Domicilio",
                    OTHER: "Otro",
                  } as Record<string, string>)[detailRecord.correspondenceType] ||
                  detailRecord.correspondenceType ||
                  "Sin especificar",
              },
              { label: "Remitente", value: detailRecord.sender || "N/A" },
              { label: "Empresa de Mensajería", value: detailRecord.courierCompany || "Directa" },
              { label: "Número de Guía", value: detailRecord.trackingNumber || "Sin N°" },
              {
                label: "Estado",
                value: (
                  <Chip
                    size="small"
                    label={detailRecord.status === "DELIVERED" ? "Entregado" : "En Portería"}
                    color={detailRecord.status === "DELIVERED" ? "success" : "warning"}
                  />
                ),
              },
              {
                label: isInternal ? "Entregado a" : "Reclamado / Recibido Por",
                value: detailRecord.deliveredToName || "Pendiente de entrega",
              },
              {
                label: "Fecha de Entrega",
                value: detailRecord.deliveredAt ? formatDateTime(detailRecord.deliveredAt) : "No entregado",
              },
              { label: "Recepcionado Por (Guardia)", value: detailRecord.receivedByName || detailRecord.createdBy || "Sistema" },
              { label: "Observaciones / Estado del Paquete", value: detailRecord.observations || "Sin observaciones" },
              { label: "Notas de Entrega", value: detailRecord.deliveryNotes || "Sin notas" },
            ]
            : []
        }
      />

      {/* Modal de Registro / Edición de Recepción de Paquete */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 2.5 }, m: { xs: 1.5, sm: 3 } } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.25rem" }, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Box component="span">
              {isEditing
                ? "Actualizar Paquete"
                : isInternal
                  ? `Nuevo Paquete - ${tenant?.name || "Empresa"}`
                  : activeClientName
                    ? `Nuevo Paquete para ${activeClientName}`
                    : "Nuevo Ingreso de Paquete / Domicilio"}
            </Box>
            {isInternal ? (
              <Chip
                size="small"
                label="Uso Interno"
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 600, ml: "auto" }}
              />
            ) : isGlobalUser && !isEditing && activeClientName ? (
              <Chip
                size="small"
                label={activeClientName}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600, ml: "auto" }}
              />
            ) : null}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2, px: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
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
                  InputLabelProps={{ shrink: true }}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="time"
                  label="Hora de Recepción"
                  InputLabelProps={{ shrink: true }}
                  value={formData.receivedTime || formData.time}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      time: e.target.value,
                      receivedTime: e.target.value,
                    })
                  }
                  required
                />
              </Grid>

              {isInternal ? (
                <Grid size={{ xs: 12, sm: 12 }}>
                  <EmployeeAutocomplete
                    value={selectedEmployee}
                    onChange={(emp) => {
                      setSelectedEmployee(emp);
                      setFormData((prev) => ({
                        ...prev,
                        recipientEmployeeId: emp?.id || "",
                        recipientEmployeeName: emp?.fullName || "",
                      }));
                    }}
                    label="Empleado Destinatario"
                    placeholder="Buscar empleado de la empresa..."
                    required
                  />
                </Grid>
              ) : (
                <>
                  {/* Selector de Unidad con Autocomplete */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <UnitAutocomplete
                      clientId={activeClientId}
                      value={selectedUnit}
                      onChange={handleUnitChange}
                      label="Unidad / Apartamento"
                      placeholder="Buscar torre, apto o casa..."
                      required
                    />
                  </Grid>

                  {/* Selector de Residente Destinatario con Autocomplete */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <ResidentAutocomplete
                      clientId={activeClientId}
                      unitId={selectedUnit?.id}
                      preloadedResidents={preloadedResidents}
                      value={selectedResident}
                      onChange={handleResidentChange}
                      label="Residente Destinatario (Opcional)"
                      placeholder="Buscar por nombre o documento..."
                    />
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="type-select-label">Tipo de Correspondencia</InputLabel>
                  <Select
                    labelId="type-select-label"
                    label="Tipo de Correspondencia"
                    value={formData.correspondenceType}
                    onChange={(e) => setFormData({ ...formData, correspondenceType: e.target.value })}
                  >
                    <MenuItem value="BOX">Caja</MenuItem>
                    <MenuItem value="ENVELOPE">Sobre</MenuItem>
                    <MenuItem value="DOCUMENT">Documento</MenuItem>
                    <MenuItem value="LETTER">Carta</MenuItem>
                    <MenuItem value="PACKAGE">Paquete</MenuItem>
                    <MenuItem value="FOOD_DELIVERY">Comida / Domicilio</MenuItem>
                    <MenuItem value="OTHER">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Empresa de Mensajería"
                  placeholder="Ej: Servientrega, Interrapidísimo, Envia..."
                  value={formData.courierCompany}
                  onChange={(e) => setFormData({ ...formData, courierCompany: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Número de Guía / Tracking"
                  placeholder="Ej: 1234567890"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Remitente / Tienda (Opcional)"
                  placeholder="Ej: Mercado Libre, Amazon, Éxito..."
                  value={formData.sender}
                  onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Observaciones / Estado del Paquete"
                  placeholder="Detalles sobre averías visibles, sello de seguridad, etc..."
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                />
              </Grid>

              <Grid size={12} sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ color: "primary.main", fontWeight: 700, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CameraIcon sx={{ fontSize: 18 }} /> Fotografía del Paquete al Recibir
                </Typography>
                <ImageUploadCapture
                  label="Foto del Paquete / Guía en Recepción"
                  variant="evidence"
                  value={evidenceReceptionFile}
                  previewUrl={existingReceptionMediaUrl}
                  onChange={setEvidenceReceptionFile}
                  helperText="Toma una foto en vivo al paquete con su número de guía visible."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, flexDirection: { xs: "column-reverse", sm: "row" }, gap: { xs: 1, sm: 0 } }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={submitting} sx={{ width: { xs: "100%", sm: "auto" } }}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={submitting} sx={{ fontWeight: 600, width: { xs: "100%", sm: "auto" } }}>
              {submitting ? "Guardando..." : isEditing ? "Actualizar Paquete" : "Registrar Recepción"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal de Entrega a Residente con Evidencia */}
      <Dialog
        open={deliveryDialogOpen}
        onClose={() => !delivering && setDeliveryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 2.5 }, m: { xs: 1.5, sm: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
          {isInternal ? "Entregar Paquete al Empleado" : "Entregar Paquete al Residente"}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2, px: { xs: 2, sm: 3 } }}>
          {selectedRecordForDelivery && (
            <Card variant="outlined" sx={{ mb: 2, bgcolor: "background.default" }}>
              <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                <Grid container spacing={1}>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {isInternal ? "Empleado Destinatario:" : "Destino:"}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {isInternal
                        ? selectedRecordForDelivery.recipientEmployeeName || selectedRecordForDelivery.destination || "N/A"
                        : selectedRecordForDelivery.unitName || selectedRecordForDelivery.destination || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Guía / Tracking:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedRecordForDelivery.trackingNumber || "Sin N°"}
                    </Typography>
                  </Grid>
                  {receptionPhotoUrlForDelivery && (
                    <Grid size={12} sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Foto al recibir en portería:
                      </Typography>
                      <Box
                        component="img"
                        src={receptionPhotoUrlForDelivery}
                        alt="Foto Recepción"
                        sx={{ maxHeight: 120, maxWidth: "100%", objectFit: "contain", borderRadius: 1, border: "1px solid", borderColor: "divider" }}
                      />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}

          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              required
              label="Nombre de Quien Recibe / Reclama"
              placeholder={isInternal ? "Ej: Juan Pérez" : "Ej: Carlos Gómez (Hermano del residente)"}
              value={deliveredToName}
              onChange={(e) => setDeliveredToName(e.target.value)}
            />

            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Notas o Constancia de Entrega (Opcional)"
              placeholder="Ej: Se entregó con documento de identidad verificado..."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ color: "primary.main", fontWeight: 700, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                <CameraIcon sx={{ fontSize: 18 }} /> Fotografía de Evidencia de Entrega
              </Typography>
              <ImageUploadCapture
                label={isInternal ? "Foto al Empleado Recibiendo el Paquete" : "Foto al Residente Recibiendo el Paquete"}
                variant="evidence"
                value={evidenceDeliveryFile}
                previewUrl={existingDeliveryMediaUrl}
                onChange={setEvidenceDeliveryFile}
                helperText="Captura una foto de entrega para constancia y evitar reclamos posteriores."
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, flexDirection: { xs: "column-reverse", sm: "row" }, gap: { xs: 1, sm: 0 } }}>
          <Button onClick={() => setDeliveryDialogOpen(false)} color="inherit" disabled={delivering} sx={{ width: { xs: "100%", sm: "auto" } }}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelivery}
            variant="contained"
            color="success"
            disabled={delivering}
            startIcon={delivering ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
            sx={{ fontWeight: 600, width: { xs: "100%", sm: "auto" } }}
          >
            {delivering ? "Registrando Entrega..." : "Confirmar Entrega"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Visor de Evidencias (Recepción y Entrega en Pestañas) */}
      <Dialog
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 2.5 }, m: { xs: 1.5, sm: 3 } } }}
      >
        <DialogTitle sx={{ pb: 0, pt: 1.5 }}>
          <Tabs value={previewTab} onChange={(_, v) => setPreviewTab(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tab label="Foto Recepción" disabled={!previewPhotos.receptionUrl} />
            <Tab label="Foto Entrega" disabled={!previewPhotos.deliveryUrl} />
          </Tabs>
        </DialogTitle>
        <DialogContent sx={{ p: 1, bgcolor: "black", textAlign: "center", minWidth: { xs: 260, sm: 320 }, minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {previewLoading ? (
            <CircularProgress color="primary" />
          ) : previewTab === 0 && previewPhotos.receptionUrl ? (
            <Box
              component="img"
              src={previewPhotos.receptionUrl}
              alt="Foto Recepción"
              sx={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: 1 }}
            />
          ) : previewTab === 1 && previewPhotos.deliveryUrl ? (
            <Box
              component="img"
              src={previewPhotos.deliveryUrl}
              alt="Foto Entrega"
              sx={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: 1 }}
            />
          ) : (
            <Typography variant="body2" sx={{ color: "white" }}>
              Sin imagen para esta categoría
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: "background.paper", px: 2, py: 1 }}>
          <Button onClick={() => setPreviewModalOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
