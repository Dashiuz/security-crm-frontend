"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "@mui/material";
import {
  Logout as LogoutIcon,
  HomeWork as HomeWorkIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Badge as BadgeIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { formatDate, formatTime } from "@/lib/formatters";

interface UnitOption {
  id: string;
  unitName: string;
  unitType?: string;
  tower?: { towerName: string };
  floor?: { floorNumber: number };
}

interface ResidentOption {
  id: string;
  unitId: string;
  firstName: string;
  lastName: string;
  document: string;
  phoneNumber?: string;
  unit?: { unitName: string };
}

export default function VisitorControlPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Form State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showError, showSuccess } = useNotification();
  const { session } = useAuth();

  const isGlobalUser = !session?.user?.clientId;
  const activeClientId = session?.user?.clientId || selectedClientId;

  // 1. Load clients for global user
  useEffect(() => {
    if (isGlobalUser) {
      HttpClient.get<any[]>("/client")
        .then((data) => {
          const list = data || [];
          setClients(list);
          if (list.length > 0 && !selectedClientId) {
            setSelectedClientId(list[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isGlobalUser, selectedClientId]);

  // 2. Load units and residents whenever active client changes
  const loadCatalogs = useCallback(async (clientId: string) => {
    if (!clientId) {
      setUnits([]);
      setResidents([]);
      return;
    }
    setLoadingCatalog(true);
    try {
      const [clientData, residentsData] = await Promise.all([
        HttpClient.get<any>(`/client/${clientId}`).catch(() => null),
        HttpClient.get<any[]>(`/resident/by-client/${clientId}`).catch(() => []),
      ]);

      setUnits(clientData?.units || []);
      setResidents(residentsData || []);
    } catch {
      // Ignorar fallo de carga de catálogos secundarios
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    if (activeClientId) {
      loadCatalogs(activeClientId);
    }
  }, [activeClientId, loadCatalogs]);

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
    const now = new Date();
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5);
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
      const data = await HttpClient.get<any>(`/operation/minuta/visitor/${id}`);
      setEditId(id);
      setIsEditing(true);
      setFormData({
        date: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
        time: data.time ? formatTime(data.time) : "",
        entryTime: data.entryTime ? formatTime(data.entryTime) : "",
        exitTime: data.exitTime ? formatTime(data.exitTime) : "",
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
      setDialogOpen(true);
    } catch {
      showError("Error al cargar la información del visitante");
    }
  };

  // Handler: Selección de Unidad
  const handleSelectUnit = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    setFormData((prev) => ({
      ...prev,
      unitId,
      destinationApartment: unit ? unit.unitName : prev.destinationApartment,
      destinationInterior: unit?.tower?.towerName || prev.destinationInterior,
      residentId: "", // reset resident if unit changes
    }));
  };

  // Handler: Selección de Residente
  const handleSelectResident = (residentId: string) => {
    const resident = residents.find((r) => r.id === residentId);
    setFormData((prev) => ({
      ...prev,
      residentId,
      hostName: resident ? `${resident.firstName} ${resident.lastName}` : prev.hostName,
      unitId: resident?.unitId || prev.unitId,
      destinationApartment: resident?.unit?.unitName || prev.destinationApartment,
    }));
  };

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

    setSubmitting(true);
    try {
      const now = new Date();
      const payload: any = {
        date: formData.date || now.toISOString().split("T")[0],
        time: formData.time.length === 5 ? `${formData.time}:00` : formData.time,
        occurredAt: `${formData.date || now.toISOString().split("T")[0]}T${formData.time.length === 5 ? `${formData.time}:00` : formData.time}Z`,
        entryTime: formData.entryTime.length === 5 ? `${formData.entryTime}:00` : formData.entryTime,
        visitorFullName: formData.visitorFullName.trim(),
        visitorIdNumber: formData.visitorIdNumber.trim(),
        visitorIdType: formData.visitorIdType,
        mode: formData.mode,
        peopleCount: Number(formData.peopleCount) || 1,
        ticketNumber: formData.ticketNumber?.trim() || null,
        destination: formData.destinationApartment || null,
        apartment: formData.destinationApartment || null,
        block: formData.destinationInterior || null,
        authorizedByFullName: formData.hostName || formData.authorizedByFullName || null,
        observations: formData.observations?.trim() || null,
        clientId: activeClientId || null,
        unitId: formData.unitId || null,
        residentId: formData.residentId || null,
      };

      if (formData.mode === "VEHICLE") {
        payload.brand = formData.brand?.trim() || null;
        payload.plate = formData.plate?.trim() || null;
      }

      if (isEditing && editId) {
        if (formData.exitTime) {
          payload.exitTime = formData.exitTime.length === 5 ? `${formData.exitTime}:00` : formData.exitTime;
        }
        await HttpClient.patch(`/operation/minuta/visitor/${editId}`, payload);
        showSuccess("Registro de visitante actualizado correctamente");
      } else {
        await HttpClient.post("/operation/minuta/visitor", payload);
        showSuccess("Ingreso de visitante registrado exitosamente");
      }

      setDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al procesar el registro");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Marcar Salida Rápida
  const handleMarkExit = async (id: string) => {
    try {
      await HttpClient.patch(`/operation/minuta/visitor/${id}/exit`, {});
      showSuccess("Salida de visitante registrada exitosamente");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al registrar la salida");
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

  // Filtrar residentes según la unidad seleccionada
  const availableResidents = formData.unitId
    ? residents.filter((r) => r.unitId === formData.unitId)
    : residents;

  const endpoint = activeClientId
    ? `/operation/minuta/visitor?clientId=${activeClientId}`
    : "/operation/minuta/visitor";

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 80 },
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
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {params.row.visitorFullName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {params.row.visitorIdType || "CC"} {params.row.visitorIdNumber}
          </Typography>
        </Box>
      ),
    },
    {
      field: "unitName",
      headerName: "Unidad / Apto",
      width: 150,
      renderCell: (params) => {
        const name =
          params.row.unitName ||
          params.row.unit?.unitName ||
          params.row.destinationApartment ||
          params.row.destination ||
          "—";
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <HomeWorkIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
      renderCell: (params) => {
        const res =
          params.row.residentName ||
          (params.row.resident
            ? `${params.row.resident.firstName} ${params.row.resident.lastName}`
            : params.row.hostName || params.row.authorizedByFullName || "—");
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <PersonIcon sx={{ fontSize: 17, color: "text.secondary" }} />
            <Typography variant="body2">{res}</Typography>
          </Box>
        );
      },
    },
    {
      field: "mode",
      headerName: "Tipo",
      width: 120,
      renderCell: (params) => {
        const isVehicle = params.row.mode === "VEHICLE" || Boolean(params.row.plate);
        return isVehicle ? (
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
        );
      },
    },
    {
      field: "ticketNumber",
      headerName: "Ficha",
      width: 90,
      renderCell: (params) =>
        params.value ? (
          <Chip
            size="small"
            icon={<BadgeIcon sx={{ fontSize: 14 }} />}
            label={params.value}
            sx={{ fontWeight: 600, fontSize: "0.72rem" }}
          />
        ) : (
          "—"
        ),
    },
    {
      field: "exitAction",
      headerName: "Estado / Salida",
      width: 170,
      sortable: false,
      renderCell: (params) => {
        const hasExit = Boolean(params.row.exitTime || params.row.exitAt);
        if (hasExit) {
          return (
            <Chip
              size="small"
              icon={<TimeIcon sx={{ fontSize: 15 }} />}
              label={`Salió: ${formatTime(params.row.exitTime || params.row.exitAt)}`}
              color="default"
              variant="outlined"
              sx={{ fontWeight: 500, fontSize: "0.75rem", bgcolor: "action.hover" }}
            />
          );
        }
        return (
          <Button
            size="small"
            variant="contained"
            color="warning"
            startIcon={<LogoutIcon sx={{ fontSize: 15 }} />}
            onClick={() => handleMarkExit(params.row.id)}
            sx={{
              textTransform: "none",
              fontSize: "0.75rem",
              fontWeight: 600,
              py: 0.3,
              px: 1.2,
              borderRadius: 1.5,
              boxShadow: "none",
              "&:hover": {
                boxShadow: "0 2px 6px rgba(237, 108, 2, 0.35)",
              },
            }}
          >
            Marcar Salida
          </Button>
        );
      },
    },
    {
      field: "createdBy",
      headerName: "Registrado Por",
      width: 150,
      valueGetter: (value: any) => value || "Sistema",
    },
  ];

  return (
    <>
      {/* Selector de Cliente para usuarios globales */}
      {isGlobalUser && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 160 }}>
            Conjunto / Cliente Activo:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 280 }}>
            <Select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              displayEmpty
            >
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} ({c.internalCode || c.nit})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      )}

      <DataTable
        title="Control de Visitantes e Ingresos"
        endpoint={endpoint}
        columns={columns}
        breadcrumbs={[{ label: "Operaciones" }, { label: "Visitantes" }]}
        onCreate={canCreate ? handleOpenCreate : undefined}
        onEdit={canEdit ? (id) => handleEdit(id) : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        refreshTrigger={refreshTrigger}
        infoDescription="Control de accesos y permanencia de visitantes en el conjunto residencial o sede corporativa."
        infoInstructions={`1. Registra el visitante vinculando obligatoriamente la Unidad y el Residente que autoriza su entrada.
2. Cuando el visitante se retire del predio, pulsa el botón 'Marcar Salida' en su fila correspondiente para cerrar el ciclo.`}
      />

      {/* Modal de Registro / Edición de Visitante */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
            {isEditing ? "Actualizar Registro de Visitante" : "Nuevo Ingreso de Visitante"}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              {/* Sección 1: Vinculación a Unidad y Residente */}
              <Grid size={12}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "primary.main", fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <HomeWorkIcon sx={{ fontSize: 18 }} /> 1. Destino Residencial y Residente
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="unit-select-label">Apartamento / Unidad Residencial</InputLabel>
                  <Select
                    labelId="unit-select-label"
                    label="Apartamento / Unidad Residencial"
                    value={formData.unitId}
                    onChange={(e) => handleSelectUnit(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>-- Seleccionar Unidad --</em>
                    </MenuItem>
                    {units.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.unitName} {u.tower?.towerName ? `(Torre ${u.tower.towerName})` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="resident-select-label">Residente que Autoriza / Visita</InputLabel>
                  <Select
                    labelId="resident-select-label"
                    label="Residente que Autoriza / Visita"
                    value={formData.residentId}
                    onChange={(e) => handleSelectResident(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>-- Seleccionar Residente --</em>
                    </MenuItem>
                    {availableResidents.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.firstName} {r.lastName} {r.unit?.unitName ? `[${r.unit.unitName}]` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={submitting} sx={{ fontWeight: 600 }}>
              {submitting ? "Guardando..." : isEditing ? "Actualizar Registro" : "Registrar Ingreso"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
