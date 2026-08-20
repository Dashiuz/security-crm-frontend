"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Tabs,
  Tab,
  MenuItem,
  Breadcrumbs,
  Link,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import { GridColDef } from "@mui/x-data-grid";
import { formatDateTime } from "@/lib/formatters";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any | null>(null);
  const [initialFormData, setInitialFormData] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

  // Structural records for filtering and unit select
  const [towers, setTowers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Residents State
  const [residents, setResidents] = useState<any[]>([]);
  const [residentModalOpen, setResidentModalOpen] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [deleteResident, setDeleteResident] = useState<any | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Resident Filters
  const [filterTower, setFilterTower] = useState<string>("ALL");
  const [filterUnit, setFilterUnit] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Resident Form Data
  const [residentForm, setResidentForm] = useState({
    unitId: "",
    residentType: "OWNER",
    idType: "CI",
    firstName: "",
    lastName: "",
    document: "",
    phoneNumber: "",
    email: "",
    gender: "M",
    birthdate: "",
    residentSince: new Date().toISOString().split("T")[0],
  });

  // Fetch client details
  const fetchClient = async () => {
    setLoading(true);
    try {
      const data = await HttpClient.get<any>(`/client/${clientId}`);
      setClient(data);
      const formVal = {
        name: data.name || "",
        nit: data.nit || "",
        internalCode: data.internalCode || "",
        contractNumber: data.contractNumber || "",
        sector: data.sector || "RESIDENTIAL",
        clientStatus: data.clientStatus || "ACTIVE",
        contractStatus: data.contractStatus || "ACTIVE",
        email: data.email || "",
        phone: data.phone || "",
        receptionPhone: data.receptionPhone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        neighborhood: data.neighborhood || "",
        administrator: data.administrator || "",
        administratorPhone: data.administratorPhone || "",
        administratorEmail: data.administratorEmail || "",
        installedTech: Boolean(data.installedTech),
        weaponsAmount: data.weaponsAmount || 0,
        securityStudy: data.securityStudy || "",
        contractDate: data.contractDate || "",
        lastContractDate: data.lastContractDate || "",
        observations: data.observations || "",
      };
      setFormData(formVal);
      setInitialFormData(formVal);
      setTowers(data.towers || []);
      setUnits(data.units || []);
    } catch (err: any) {
      showError(err.message || "Error al cargar cliente");
    } finally {
      setLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      const data = await HttpClient.get<any[]>(`/resident/by-client/${clientId}`);
      setResidents(data);
    } catch (err: any) {
      showError(err.message || "Error al cargar residentes");
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClient();
      fetchResidents();
    }
  }, [clientId]);

  // Check dirty state
  const handleFieldChange = (field: string, value: any) => {
    const nextForm = { ...formData, [field]: value };
    setFormData(nextForm);
    const hasChanged = JSON.stringify(nextForm) !== JSON.stringify(initialFormData);
    setIsDirty(hasChanged);
  };

  const handleSaveClientChanges = async () => {
    try {
      await HttpClient.patch(`/client/${clientId}`, formData);
      showSuccess("¡Cambios del cliente guardados con éxito!");
      setInitialFormData(formData);
      setIsDirty(false);
      setSaveConfirmOpen(false);
      fetchClient();
    } catch (err: any) {
      showError(err.message || "Error al actualizar cliente.");
    }
  };

  // Filtered residents computed state
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      // 1. Tower filter
      if (
        filterTower !== "ALL" &&
        r.unit?.tower?.id !== filterTower &&
        r.unit?.towerId !== filterTower
      ) {
        return false;
      }

      // 2. Resident type filter
      if (filterType !== "ALL" && r.residentType !== filterType) {
        return false;
      }

      // 3. Search query (name, document, phone, unitName)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = `${r.firstName} ${r.lastName}`.toLowerCase();
        const doc = (r.document || "").toLowerCase();
        const phone = (r.phoneNumber || "").toLowerCase();
        const unitName = (r.unit?.unitName || "").toLowerCase();
        return (
          name.includes(q) ||
          doc.includes(q) ||
          phone.includes(q) ||
          unitName.includes(q)
        );
      }

      return true;
    });
  }, [residents, filterTower, filterType, searchQuery]);

  // Resident Modal Actions
  const handleOpenAddResident = () => {
    setSelectedResidentId(null);
    setResidentForm({
      unitId: units.length > 0 ? units[0].id : "",
      residentType: "OWNER",
      idType: "CI",
      firstName: "",
      lastName: "",
      document: "",
      phoneNumber: "",
      email: "",
      gender: "M",
      birthdate: "",
      residentSince: new Date().toISOString().split("T")[0],
    });
    setResidentModalOpen(true);
  };

  const handleOpenEditResident = (idOrRow: any, row?: any) => {
    const target =
      row ||
      (typeof idOrRow === "object"
        ? idOrRow
        : residents.find((r) => r.id === idOrRow));
    if (!target) return;

    setSelectedResidentId(target.id);
    setResidentForm({
      unitId: target.unitId || target.unit?.id || "",
      residentType: target.residentType || "OWNER",
      idType: target.idType || "CI",
      firstName: target.firstName || "",
      lastName: target.lastName || "",
      document: target.document || "",
      phoneNumber: target.phoneNumber || "",
      email: target.email || "",
      gender: target.gender || "M",
      birthdate: target.birthdate ? target.birthdate.split("T")[0] : "",
      residentSince: target.residentSince ? target.residentSince.split("T")[0] : "",
    });
    setResidentModalOpen(true);
  };

  const handleSaveResident = async () => {
    if (!residentForm.firstName || !residentForm.lastName || !residentForm.document || !residentForm.unitId) {
      showError("Por favor complete los campos obligatorios del residente.");
      return;
    }

    try {
      const payload: any = {
        ...residentForm,
        clientId,
      };

      if (!payload.birthdate) delete payload.birthdate;
      if (!payload.email) delete payload.email;
      if (!payload.gender) delete payload.gender;
      if (!payload.residentSince) delete payload.residentSince;
      if (!payload.idType) delete payload.idType;

      if (selectedResidentId) {
        await HttpClient.patch(`/resident/${selectedResidentId}`, payload);
        showSuccess("Residente actualizado correctamente");
      } else {
        await HttpClient.post("/resident", payload);
        showSuccess("Residente registrado correctamente");
      }

      setResidentModalOpen(false);
      setRefreshTrigger((prev) => prev + 1);
      fetchResidents();
    } catch (err: any) {
      showError(err.message || "Error al guardar residente");
    }
  };

  const handleConfirmDeleteResident = async () => {
    if (!deleteResident) return;
    try {
      await HttpClient.delete(`/resident/${deleteResident.id}`);
      showSuccess("Residente dado de baja correctamente");
      setDeleteResident(null);
      setRefreshTrigger((prev) => prev + 1);
      fetchResidents();
    } catch (err: any) {
      showError(err.message || "Error al eliminar residente");
    }
  };

  const residentColumns: GridColDef[] = [
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
      field: "phoneNumber",
      headerName: "Teléfono / Citofonía",
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
    {
      field: "createdAt",
      headerName: "Creado En",
      width: 160,
      valueFormatter: (value: any) => (value ? formatDateTime(value) : "N/A"),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* Top Header Bar */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Breadcrumbs sx={{ mb: 1 }}>
            <Link underline="hover" color="inherit" href="/administrative/clients">
              Mis Compradores / Clientes
            </Link>
            <Typography color="text.primary">{client?.name}</Typography>
          </Breadcrumbs>
          <Typography variant="h4" fontWeight="bold">
            {client?.name} <Chip label={client?.sector} color="primary" sx={{ ml: 2 }} />
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/administrative/clients")}
        >
          Volver a la lista
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, val) => setTabIndex(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Información General del Cliente" />
          <Tab label={`Residentes del Conjunto (${residents.length})`} />
        </Tabs>
      </Paper>

      {/* TAB 1: CLIENT INFORMATION */}
      <CustomTabPanel value={tabIndex} index={0}>
        <Card sx={{ borderRadius: 3, position: "relative" }}>
          {isDirty && (
            <Box
              sx={{
                p: 2,
                bgcolor: "warning.light",
                color: "warning.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: "12px 12px 0 0",
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                ⚠️ Ha realizado cambios en la información del cliente.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={() => setSaveConfirmOpen(true)}
              >
                Guardar Cambios
              </Button>
            </Box>
          )}

          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Nombre del Cliente"
                  value={formData.name || ""}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="NIT"
                  value={formData.nit || ""}
                  onChange={(e) => handleFieldChange("nit", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Código Interno"
                  value={formData.internalCode || ""}
                  onChange={(e) => handleFieldChange("internalCode", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="N° Contrato"
                  value={formData.contractNumber || ""}
                  onChange={(e) => handleFieldChange("contractNumber", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Email"
                  value={formData.email || ""}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={formData.phone || ""}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={formData.address || ""}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Ciudad"
                  value={formData.city || ""}
                  onChange={(e) => handleFieldChange("city", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Administrador"
                  value={formData.administrator || ""}
                  onChange={(e) => handleFieldChange("administrator", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Tel. Administrador"
                  value={formData.administratorPhone || ""}
                  onChange={(e) => handleFieldChange("administratorPhone", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Email Administrador"
                  value={formData.administratorEmail || ""}
                  onChange={(e) => handleFieldChange("administratorEmail", e.target.value)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </CustomTabPanel>

      {/* TAB 2: RESIDENTS TABLE */}
      <CustomTabPanel value={tabIndex} index={1}>
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            {/* Filter Bar */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 3 }}>
              <TextField
                size="small"
                label="Buscar residente o documento"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: 260 }}
              />

              {towers.length > 0 && (
                <TextField
                  select
                  size="small"
                  label="Torre"
                  value={filterTower}
                  onChange={(e) => setFilterTower(e.target.value)}
                  sx={{ width: 160 }}
                >
                  <MenuItem value="ALL">Todas las Torres</MenuItem>
                  {towers.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.towerName}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                select
                size="small"
                label="Tipo de Residente"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                sx={{ width: 180 }}
              >
                <MenuItem value="ALL">Todos los Tipos</MenuItem>
                <MenuItem value="OWNER">Propietarios</MenuItem>
                <MenuItem value="TENANT">Inquilinos</MenuItem>
                <MenuItem value="FAMILY_MEMBER">Familiares</MenuItem>
                <MenuItem value="OTHER">Otros</MenuItem>
              </TextField>

              <Box sx={{ flexGrow: 1 }} />

              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleOpenAddResident}
              >
                Registrar Residente
              </Button>
            </Box>

            {/* Resident Table */}
            <DataTable
              title="Censo de Residentes"
              endpoint={`/resident/by-client/${clientId}`}
              columns={residentColumns}
              rows={filteredResidents}
              refreshTrigger={refreshTrigger}
              hideCreateButton={true}
              hideStatusFilter={true}
              onEdit={(id, row) => handleOpenEditResident(id, row)}
              onDelete={(id, row) => {
                const target = row || residents.find((r) => r.id === id);
                if (target) setDeleteResident(target);
              }}
            />
          </CardContent>
        </Card>
      </CustomTabPanel>

      {/* Confirmation Modal for Client Edit */}
      <PromptConfirmDialog
        open={saveConfirmOpen}
        onClose={() => setSaveConfirmOpen(false)}
        onConfirm={handleSaveClientChanges}
        title="Confirmar Actualización de Datos del Cliente"
        description={`¿Está seguro de guardar las modificaciones en la información del cliente "${client?.name}"?`}
        expectedValue={client?.nit || ""}
        inputLabel="NIT del Cliente para Confirmar"
        confirmButtonText="Guardar Cambios"
        confirmColor="primary"
      />

      {/* Confirmation Modal for Resident Soft-Delete */}
      <PromptConfirmDialog
        open={Boolean(deleteResident)}
        onClose={() => setDeleteResident(null)}
        onConfirm={handleConfirmDeleteResident}
        title="Dar de Baja a Residente"
        description={`Para confirmar la desvinculación de "${deleteResident?.firstName} ${deleteResident?.lastName}", ingrese su número de documento exacto:`}
        expectedValue={deleteResident?.document || ""}
        inputLabel="Número de Documento"
        confirmButtonText="Confirmar Baja"
        confirmColor="error"
      />

      {/* Resident Create/Edit Modal */}
      <Dialog open={residentModalOpen} onClose={() => setResidentModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedResidentId ? "Editar Residente" : "Registrar Nuevo Residente"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                select
                required
                label="Unidad / Vivienda Asignada"
                value={residentForm.unitId}
                onChange={(e) => setResidentForm({ ...residentForm, unitId: e.target.value })}
              >
                {units.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.unitName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                required
                label="Tipo de Residente"
                value={residentForm.residentType}
                onChange={(e) => setResidentForm({ ...residentForm, residentType: e.target.value })}
              >
                <MenuItem value="OWNER">Propietario (OWNER)</MenuItem>
                <MenuItem value="TENANT">Inquilino (TENANT)</MenuItem>
                <MenuItem value="FAMILY_MEMBER">Familiar (FAMILY_MEMBER)</MenuItem>
                <MenuItem value="OTHER">Otro</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Tipo de Documento"
                value={residentForm.idType}
                onChange={(e) => setResidentForm({ ...residentForm, idType: e.target.value })}
              >
                <MenuItem value="CI">Cédula de Identidad</MenuItem>
                <MenuItem value="CE">Cédula de Extranjería</MenuItem>
                <MenuItem value="PASSPORT">Pasaporte</MenuItem>
                <MenuItem value="NIT">NIT</MenuItem>
                <MenuItem value="OTHER">Otro</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Nombres"
                value={residentForm.firstName}
                onChange={(e) => setResidentForm({ ...residentForm, firstName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Apellidos"
                value={residentForm.lastName}
                onChange={(e) => setResidentForm({ ...residentForm, lastName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Documento"
                value={residentForm.document}
                onChange={(e) => setResidentForm({ ...residentForm, document: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Teléfono"
                value={residentForm.phoneNumber}
                onChange={(e) => setResidentForm({ ...residentForm, phoneNumber: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Email"
                value={residentForm.email}
                onChange={(e) => setResidentForm({ ...residentForm, email: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResidentModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveResident}>
            Guardar Residente
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
