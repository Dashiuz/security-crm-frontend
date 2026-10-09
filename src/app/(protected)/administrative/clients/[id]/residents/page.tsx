"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Paper,
  useTheme,
} from "@mui/material";
import {
  PersonAddRounded as PersonAddIcon,
  CloudUploadRounded as CloudUploadIcon,
  EditRounded as EditIcon,
  DeleteRounded as DeleteIcon,
  PhoneRounded as PhoneIcon,
  EmailRounded as EmailIcon,
  HomeRounded as HomeIcon,
} from "@mui/icons-material";
import { GridColDef } from "@mui/x-data-grid";
import { useClientDetail } from "../ClientContext";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import CsvImportDialog from "@/components/common/CsvImportDialog";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";

export default function ClientResidentsPage() {
  const { clientId, client, permissions } = useClientDetail();
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  // Filters
  const [filterTower, setFilterTower] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal Create/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    unitId: "",
    residentType: "OWNER",
    idType: "CC",
    firstName: "",
    lastName: "",
    document: "",
    phoneNumber: "",
    email: "",
    gender: "M",
    birthdate: "",
    residentSince: new Date().toISOString().split("T")[0],
  });

  // Delete modal
  const [deleteResident, setDeleteResident] = useState<any | null>(null);

  // Units list from client
  const clientUnits = useMemo(() => {
    return client?.units || [];
  }, [client]);

  // Handle open create
  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      unitId: clientUnits[0]?.id || "",
      residentType: "OWNER",
      idType: "CC",
      firstName: "",
      lastName: "",
      document: "",
      phoneNumber: "",
      email: "",
      gender: "M",
      birthdate: "",
      residentSince: new Date().toISOString().split("T")[0],
    });
    setModalOpen(true);
  };

  // Handle open edit
  const handleOpenEdit = (row: any) => {
    setEditingId(row.id);
    setForm({
      unitId: row.unitId || "",
      residentType: row.residentType || "OWNER",
      idType: row.idType || "CC",
      firstName: row.firstName || "",
      lastName: row.lastName || "",
      document: row.document || "",
      phoneNumber: row.phoneNumber || "",
      email: row.email || "",
      gender: row.gender || "M",
      birthdate: row.birthdate ? row.birthdate.split("T")[0] : "",
      residentSince: row.residentSince
        ? row.residentSince.split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setModalOpen(true);
  };

  // Save resident
  const handleSaveResident = async () => {
    if (!form.firstName || !form.lastName || !form.document || !form.unitId) {
      showError("Por favor complete los campos obligatorios: Nombre, Apellido, Documento y Unidad.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await HttpClient.patch(`/resident/${editingId}`, {
          ...form,
          clientId,
        });
        showSuccess("Residente actualizado exitosamente.");
      } else {
        await HttpClient.post(`/resident`, {
          ...form,
          clientId,
        });
        showSuccess("Residente registrado exitosamente.");
      }
      setModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al guardar residente");
    } finally {
      setSaving(false);
    }
  };

  // Delete resident
  const handleConfirmDelete = async () => {
    if (!deleteResident) return;
    try {
      await HttpClient.delete(`/resident/${deleteResident.id}`);
      showSuccess("Residente eliminado exitosamente.");
      setDeleteResident(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al eliminar residente");
    }
  };

  // CSV Import
  const handleImportCsv = async (
    data: Array<Record<string, string>>,
    fileName: string,
  ) => {
    const res = await HttpClient.post<{
      status: string;
      totalRows: number;
      successRows: number;
      errorRows: number;
      errors?: Array<{ row: number; reason: string }>;
    }>("/resident/import/csv", {
      clientId,
      data,
      fileName,
    });
    setRefreshTrigger((prev) => prev + 1);
    return res;
  };

  // Data fetching and filtering
  const fetchResidents = async () => {
    const res = await HttpClient.get<any[]>(`/resident/by-client/${clientId}`);
    let list = Array.isArray(res) ? res : [];

    if (filterTower !== "ALL") {
      list = list.filter((r) => r.unit?.towerId === filterTower);
    }

    if (filterType !== "ALL") {
      list = list.filter((r) => r.residentType === filterType);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
          r.document?.toLowerCase().includes(q) ||
          r.unit?.unitName?.toLowerCase().includes(q) ||
          r.phoneNumber?.toLowerCase().includes(q),
      );
    }

    return { data: list, nextCursor: null };
  };

  const columns: GridColDef[] = [
    {
      field: "fullName",
      headerName: "Residente",
      flex: 1.2,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Typography variant="body2" fontWeight={600}>
            {params.row.firstName} {params.row.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.idType || "CC"} {params.row.document}
          </Typography>
        </Box>
      ),
    },
    {
      field: "unitName",
      headerName: "Inmueble / Unidad",
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <HomeIcon fontSize="small" sx={{ color: "text.secondary" }} />
          <Typography variant="body2" fontWeight={500}>
            {params.row.unit?.tower?.towerName ? `${params.row.unit.tower.towerName} - ` : ""}
            {params.row.unit?.unitName || "Sin unidad"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "residentType",
      headerName: "Tipo",
      width: 130,
      renderCell: (params) => {
        const type = params.value;
        const color =
          type === "OWNER"
            ? "primary"
            : type === "TENANT"
            ? "secondary"
            : "default";
        const label =
          type === "OWNER"
            ? "Propietario"
            : type === "TENANT"
            ? "Inquilino"
            : "Residente";
        return <Chip size="small" label={label} color={color} variant="outlined" />;
      },
    },
    {
      field: "contact",
      headerName: "Contacto",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {params.row.phoneNumber && (
            <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <PhoneIcon sx={{ fontSize: 13 }} /> {params.row.phoneNumber}
            </Typography>
          )}
          {params.row.email && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <EmailIcon sx={{ fontSize: 13 }} /> {params.row.email}
            </Typography>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, width: "100%" }}>
      {/* Top Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Directorio de Residentes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administre la asignación de residentes a inmuebles de {client?.name}.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloudUploadIcon />}
            onClick={() => setCsvImportOpen(true)}
          >
            Importar CSV
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<PersonAddIcon />}
            onClick={handleOpenCreate}
          >
            Nuevo Residente
          </Button>
        </Box>
      </Box>

      {/* Filter Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.divider}`,
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar por nombre, cédula, apto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 240, flex: 1 }}
        />

        <TextField
          select
          size="small"
          label="Torre"
          value={filterTower}
          onChange={(e) => setFilterTower(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="ALL">Todas las torres</MenuItem>
          {client?.towers?.map((t: any) => (
            <MenuItem key={t.id} value={t.id}>
              {t.towerName}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Tipo"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="ALL">Todos los tipos</MenuItem>
          <MenuItem value="OWNER">Propietario</MenuItem>
          <MenuItem value="TENANT">Inquilino</MenuItem>
          <MenuItem value="RESIDENT">Residente</MenuItem>
          <MenuItem value="OTHER">Otro</MenuItem>
        </TextField>
      </Paper>

      {/* Responsive Data View: Table on Desktop, Cards on Mobile */}
      <ResponsiveDataView
        title="Directorio de Residentes"
        hideHeader
        fetchFn={fetchResidents}
        columns={columns}
        refreshTrigger={refreshTrigger}
        getRowId={(row) => row.id}
        onEdit={(id, row) => handleOpenEdit(row)}
        onDelete={(id, row) => setDeleteResident(row)}
        deleteActionLabel="Eliminar"
        deleteIcon={<DeleteIcon color="error" />}
      />

      {/* Create / Edit Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? "Editar Residente" : "Registrar Nuevo Residente"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Nombres"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Apellidos"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                select
                size="small"
                label="Tipo Doc."
                value={form.idType}
                onChange={(e) => setForm({ ...form, idType: e.target.value })}
              >
                <MenuItem value="CC">Cédula Ciudadanía</MenuItem>
                <MenuItem value="CE">Cédula Extranjería</MenuItem>
                <MenuItem value="TI">Tarjeta Identidad</MenuItem>
                <MenuItem value="PASSPORT">Pasaporte</MenuItem>
                <MenuItem value="NIT">NIT</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                fullWidth
                size="small"
                label="Número de Documento"
                value={form.document}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                size="small"
                label="Inmueble / Unidad"
                value={form.unitId}
                onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                required
              >
                {clientUnits.map((u: any) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.tower?.towerName ? `${u.tower.towerName} - ` : ""}
                    {u.unitName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                size="small"
                label="Tipo de Residente"
                value={form.residentType}
                onChange={(e) => setForm({ ...form, residentType: e.target.value })}
              >
                <MenuItem value="OWNER">Propietario</MenuItem>
                <MenuItem value="TENANT">Inquilino / Arrendatario</MenuItem>
                <MenuItem value="RESIDENT">Familiar / Residente</MenuItem>
                <MenuItem value="OTHER">Otro</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Teléfono"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Correo Electrónico"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveResident}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar Residente"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV Import Dialog */}
      <CsvImportDialog
        open={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        title="Importar Residentes Masivamente"
        onImport={handleImportCsv}
        templateColumns={[
          "firstName",
          "lastName",
          "document",
          "idType",
          "phoneNumber",
          "email",
          "unitName",
          "residentType",
        ]}
      />

      {/* Delete Prompt Confirm Dialog */}
      <PromptConfirmDialog
        open={Boolean(deleteResident)}
        title="Eliminar Residente"
        description={`¿Está seguro de que desea eliminar al residente ${deleteResident?.firstName} ${deleteResident?.lastName}? Para confirmar esta acción, escriba ELIMINAR:`}
        expectedValue="ELIMINAR"
        inputLabel="Escriba ELIMINAR para confirmar"
        confirmButtonText="Eliminar"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteResident(null)}
      />
    </Box>
  );
}
