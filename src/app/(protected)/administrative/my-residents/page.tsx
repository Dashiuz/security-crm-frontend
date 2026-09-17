"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Chip,
  Box,
  Typography,
  Grid,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import CsvImportDialog from "@/components/common/CsvImportDialog";
import { useAuth } from "@/components/AuthContext";
import { CloudUpload as CloudUploadIcon, PersonAdd as PersonAddIcon } from "@mui/icons-material";
import dayjs from "dayjs";

export default function MyResidentsPage() {
  const { session } = useAuth();
  const { showError, showSuccess } = useNotification();
  const clientId = session?.user?.clientId;
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [units, setUnits] = useState<any[]>([]);

  // Dialog states
  const [openModal, setOpenModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [deleteResident, setDeleteResident] = useState<any>(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  // Filters State
  const [residents, setResidents] = useState<any[]>([]);
  const [towers, setTowers] = useState<any[]>([]);
  const [filterTower, setFilterTower] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Form State
  const [form, setForm] = useState({
    unitId: "",
    residentType: "OWNER",
    idType: "CI",
    document: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    gender: "N",
    birthdate: "",
  });

  const fetchResidents = async () => {
    try {
      const data = await HttpClient.get<any[]>(`/resident/by-client/${clientId}`);
      setResidents(data);
    } catch (e) {
      // Error fetching residents
    }
  };

  useEffect(() => {
    if (clientId) {
      HttpClient.get<any>(`/client/${clientId}`)
        .then((data) => {
          setUnits(data.units || []);
          setTowers(data.towers || []);
        })
        .catch(() => {});
      fetchResidents();
    }
  }, [clientId, refreshTrigger]);

  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      if (
        filterTower !== "ALL" &&
        r.unit?.tower?.towerName?.trim().toLowerCase() !== filterTower.trim().toLowerCase()
      ) {
        return false;
      }
      if (filterType !== "ALL" && r.residentType !== filterType) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const full = `${r.firstName} ${r.lastName}`.toLowerCase();
        if (
          !full.includes(q) &&
          !r.document?.toLowerCase().includes(q) &&
          !r.unit?.unitName?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [residents, filterTower, filterType, searchQuery]);

  if (!clientId) {
    return (
      <Box p={3}>
        <Typography color="error">No tienes un conjunto asignado.</Typography>
      </Box>
    );
  }

  const columns: GridColDef[] = [
    {
      field: "unitName",
      headerName: "Unidad / Vivienda",
      flex: 1,
      minWidth: 150,
      valueGetter: (value: any, row: any) => row.unit?.unitName || "N/A",
    },
    {
      field: "fullName",
      headerName: "Nombre del Residente",
      flex: 1.5,
      minWidth: 200,
      valueGetter: (value: any, row: any) => `${row.firstName} ${row.lastName}`,
    },
    {
      field: "document",
      headerName: "Documento",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "phoneNumber",
      headerName: "Teléfono",
      flex: 1,
      minWidth: 140,
    },
    {
      field: "residentType",
      headerName: "Tipo Residente",
      width: 140,
      renderCell: (params) => {
        const colors: any = {
          OWNER: "primary",
          TENANT: "info",
          FAMILY_MEMBER: "secondary",
          OTHER: "default",
        };
        const labels: any = {
          OWNER: "Propietario",
          TENANT: "Inquilino",
          FAMILY_MEMBER: "Familiar",
          OTHER: "Otro",
        };
        return (
          <Chip
            label={labels[params.value] || params.value}
            color={colors[params.value] || "default"}
            size="small"
          />
        );
      },
    },
  ];

  const handleOpenAdd = () => {
    setSelectedResident(null);
    setForm({
      unitId: "",
      residentType: "OWNER",
      idType: "CI",
      document: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      gender: "N",
      birthdate: "",
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (id: string, row: any) => {
    setSelectedResident(row);
    setForm({
      unitId: row.unitId || "",
      residentType: row.residentType || "OWNER",
      idType: row.idType || "CI",
      document: row.document || "",
      firstName: row.firstName || "",
      lastName: row.lastName || "",
      phoneNumber: row.phoneNumber || "",
      email: row.email || "",
      gender: row.gender || "N",
      birthdate: row.birthdate ? dayjs(row.birthdate).format("YYYY-MM-DD") : "",
    });
    setOpenModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, clientId };
      if (selectedResident) {
        await HttpClient.patch(`/resident/${selectedResident.id}`, payload);
        showSuccess("Residente actualizado exitosamente");
      } else {
        await HttpClient.post("/resident", payload);
        showSuccess("Residente creado exitosamente");
      }
      setOpenModal(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al guardar residente");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteResident) return;
    try {
      await HttpClient.delete(`/resident/${deleteResident.id}`);
      showSuccess("Residente inhabilitado exitosamente");
      setDeleteResident(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al inhabilitar residente");
    }
  };

  const handleImportResidentsCsv = async (
    csvRows: Array<Record<string, string>>,
    fileName: string,
  ) => {
    const res = await HttpClient.post<any>("/resident/import/csv", {
      clientId,
      data: csvRows,
      fileName,
    });
    setRefreshTrigger((prev) => prev + 1);
    return res;
  };

  return (
    <>
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filtrar por Torre"
              value={filterTower}
              onChange={(e) => setFilterTower(e.target.value)}
            >
              <MenuItem value="ALL">Todas las Torres</MenuItem>
              {towers.map((t, idx) => (
                <MenuItem key={idx} value={t.towerName}>
                  {t.towerName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Tipo de Residente"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="ALL">Todos los Tipos</MenuItem>
              <MenuItem value="OWNER">Propietario</MenuItem>
              <MenuItem value="TENANT">Inquilino</MenuItem>
              <MenuItem value="FAMILY_MEMBER">Familiar</MenuItem>
              <MenuItem value="OTHER">Otro</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar Residente / Cédula / Apto"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }} sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudUploadIcon />}
              onClick={() => setCsvImportOpen(true)}
              sx={{ textTransform: "none" }}
            >
              Cargar CSV
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenAdd}
              sx={{ textTransform: "none" }}
            >
              + Residente
            </Button>
          </Grid>
        </Grid>
      </Box>

      <DataTable
        title={`Residentes Registrados`}
        rows={filteredResidents}
        columns={columns}
        breadcrumbs={[
          { label: "Administrativo" },
          { label: "Mis Residentes" },
        ]}
        hideCreateButton
        hideStatusFilter
        onEdit={handleOpenEdit}
        onDelete={(id, row) => setDeleteResident(row || residents.find((r) => r.id === id))}
      />

      <PromptConfirmDialog
        open={Boolean(deleteResident)}
        onClose={() => setDeleteResident(null)}
        onConfirm={handleConfirmDelete}
        title="Dar de baja Residente"
        description="¿Está seguro de que desea inhabilitar a este residente? Escriba el documento para confirmar."
        expectedValue={deleteResident?.document || ""}
        inputLabel="Número de Documento"
        confirmButtonText="Inhabilitar"
        confirmColor="error"
      />

      <CsvImportDialog
        open={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        title="Carga Masiva de Residentes"
        templateColumns={[
          "unitName",
          "firstName",
          "lastName",
          "document",
          "phoneNumber",
          "email",
          "residentType",
        ]}
        onImport={handleImportResidentsCsv}
        onSuccessRedirect={(result) => {
          setRefreshTrigger((prev) => prev + 1);
          if (result?.status === 'SUCCESS') {
            showSuccess("Importación masiva completada con éxito");
          } else if (result?.status === 'PARTIAL') {
            showSuccess("Importación masiva completada parcialmente. Revisa las advertencias.");
          }
        }}
      />

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedResident ? "Editar Residente" : "Registrar Nuevo Residente"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} mt={1}>
            <TextField
              select
              fullWidth
              label="Unidad / Vivienda *"
              value={form.unitId}
              onChange={(e) => setForm({ ...form, unitId: e.target.value })}
            >
              {units.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.unitName}</MenuItem>
              ))}
            </TextField>
            
            <TextField
              select
              fullWidth
              label="Tipo de Residente *"
              value={form.residentType}
              onChange={(e) => setForm({ ...form, residentType: e.target.value })}
            >
              <MenuItem value="OWNER">Propietario</MenuItem>
              <MenuItem value="TENANT">Inquilino</MenuItem>
              <MenuItem value="FAMILY_MEMBER">Familiar</MenuItem>
              <MenuItem value="OTHER">Otro</MenuItem>
            </TextField>

            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Tipo Doc."
                value={form.idType}
                onChange={(e) => setForm({ ...form, idType: e.target.value })}
                sx={{ width: 120 }}
              >
                <MenuItem value="CI">CC / CI</MenuItem>
                <MenuItem value="CE">CE</MenuItem>
                <MenuItem value="PASSPORT">Pasaporte</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Número de Documento *"
                value={form.document}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Nombre(s) *"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
              <TextField
                fullWidth
                label="Apellido(s) *"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Teléfono / Celular *"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              />
              <TextField
                fullWidth
                label="Correo Electrónico (Opcional)"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Stack>

            <TextField
              fullWidth
              type="date"
              label="Fecha de Nacimiento (Opcional)"
              value={form.birthdate}
              onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
