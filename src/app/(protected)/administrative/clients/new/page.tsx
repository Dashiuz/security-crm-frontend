"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Breadcrumbs,
  Link,
  Divider,
  IconButton,
  Paper,
  Chip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Domain as DomainIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";

interface TowerInput {
  towerName: string;
  floorsAmount: number;
  apartmentsPerFloor: number;
}

export default function CreateClientPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);

  // Step 1: General Client Data
  const [formData, setFormData] = useState({
    internalCode: `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
    nit: "",
    name: "",
    contractNumber: `CONT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    clientStatus: "ACTIVE",
    contractStatus: "ACTIVE",
    sector: "RESIDENTIAL",
    email: "",
    phone: "",
    receptionPhone: "",
    address: "",
    city: "Bogotá",
    state: "Cundinamarca",
    country: "Colombia",
    neighborhood: "",
    administrator: "",
    administratorPhone: "",
    administratorEmail: "",
    coordinatorInChargeId: "",
    commercialContactId: "",
    installedTech: false,
    weaponsAmount: 0,
    securityStudy: "",
    contractDate: new Date().toISOString().split("T")[0],
    lastContractDate: new Date().toISOString().split("T")[0],
    observations: "",
  });

  // Step 2: Structural Data
  const [structureType, setStructureType] = useState<string>("BUILDING_CLUSTER");
  const [floorsAmount, setFloorsAmount] = useState<number>(5);
  const [apartmentsPerFloor, setApartmentsPerFloor] = useState<number>(4);
  const [towers, setTowers] = useState<TowerInput[]>([
    { towerName: "Torre 1", floorsAmount: 10, apartmentsPerFloor: 4 },
    { towerName: "Torre 2", floorsAmount: 10, apartmentsPerFloor: 4 },
  ]);
  const [unitsAmount, setUnitsAmount] = useState<number>(50);
  const [housePrefix, setHousePrefix] = useState<string>("Casa");

  // Amenities
  const [amenities, setAmenities] = useState({
    hasSocialRoom: false,
    socialRoomAmount: 0,
    hasGym: false,
    gymAmount: 0,
    hasPool: false,
    poolAmount: 0,
    hasTennisCourt: false,
    tennisCourtAmount: 0,
    hasBasketballCourt: false,
    basketballCourtAmount: 0,
    hasFootballCourt: false,
    footballCourtAmount: 0,
    hasVolleyballCourt: false,
    volleyballCourtAmount: 0,
    hasPlayground: false,
    playgroundAmount: 0,
    hasParking: true,
    parkingAmount: 50,
    hasStorageRoom: false,
    storageRoomAmount: 0,
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await HttpClient.get<any[]>("/employee");
        setEmployees(
          data.map((e) => ({
            value: e.id,
            label: `${e.fullName} (${e.positionName || "Sin Cargo"})`,
          }))
        );
      } catch (err) {
        showError("Error al cargar lista de empleados.");
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddTower = () => {
    const nextTowerNum = towers.length + 1;
    setTowers((prev) => [
      ...prev,
      { towerName: `Torre ${nextTowerNum}`, floorsAmount: 10, apartmentsPerFloor: 4 },
    ]);
  };

  const handleRemoveTower = (index: number) => {
    setTowers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTowerChange = (index: number, field: keyof TowerInput, value: any) => {
    setTowers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.nit || !formData.internalCode || !formData.contractNumber) {
      showError("Por favor complete los campos obligatorios (*).");
      return;
    }

    setLoading(true);
    try {
      const structureConfig: any = {
        structureType,
        ...amenities,
      };

      if (structureType === "SINGLE_BUILDING") {
        structureConfig.floorsAmount = Number(floorsAmount);
        structureConfig.apartmentsPerFloor = Number(apartmentsPerFloor);
      } else if (structureType === "BUILDING_CLUSTER") {
        structureConfig.towersAmount = towers.length;
        structureConfig.towers = towers.map((t) => ({
          towerName: t.towerName,
          floorsAmount: Number(t.floorsAmount),
          apartmentsPerFloor: Number(t.apartmentsPerFloor),
        }));
      } else if (structureType === "HOUSE_CLUSTER") {
        structureConfig.unitsAmount = Number(unitsAmount);
        structureConfig.prefix = housePrefix;
      } else {
        structureConfig.unitsAmount = Number(unitsAmount);
        structureConfig.prefix = "Unidad";
      }

      const payload = {
        ...formData,
        weaponsAmount: Number(formData.weaponsAmount || 0),
        coordinatorInChargeId: formData.coordinatorInChargeId || null,
        commercialContactId: formData.commercialContactId || null,
        structureConfig,
      };

      await HttpClient.post("/client/with-structure", payload);
      showSuccess("¡Cliente y estructura registrados con éxito!");
      router.push("/administrative/clients");
    } catch (err: any) {
      showError(err.message || "Error al registrar cliente.");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Información Legal y Comercial", "Modelado de Estructura e Inmueble"];

  return (
    <Box sx={{ pb: 6 }}>
      {/* Top Header Bar */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Breadcrumbs sx={{ mb: 1 }}>
            <Link underline="hover" color="inherit" href="/administrative/clients">
              Mis Compradores / Clientes
            </Link>
            <Typography color="text.primary">Nuevo Cliente</Typography>
          </Breadcrumbs>
          <Typography variant="h4" fontWeight="bold">
            Registro de Cliente / Conjunto Residencial
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

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step 1 Content */}
      {activeStep === 0 && (
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
              <BusinessIcon color="primary" /> Información Legal, Contrato y Ubicación
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="Nombre / Razón Social"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Conjunto Residencial Las Palmas"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="NIT"
                  name="nit"
                  value={formData.nit}
                  onChange={handleChange}
                  placeholder="Ej: 900123456-7"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="Código Interno"
                  name="internalCode"
                  value={formData.internalCode}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  select
                  label="Sector del Cliente"
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                >
                  <MenuItem value="RESIDENTIAL">Residencial (Conjuntos / Edificios)</MenuItem>
                  <MenuItem value="COMMERCIAL">Comercial</MenuItem>
                  <MenuItem value="INDUSTRIAL">Industrial</MenuItem>
                  <MenuItem value="GOVERNMENT">Gubernamental</MenuItem>
                  <MenuItem value="OTHER">Otro</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="N° de Contrato"
                  name="contractNumber"
                  value={formData.contractNumber}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Contrato"
                  name="contractDate"
                  value={formData.contractDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Última Fecha Contrato"
                  name="lastContractDate"
                  value={formData.lastContractDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Email Principal"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Teléfono Principal"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Dirección"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Ciudad"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Barrio / Zona"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Nombre Administrador"
                  name="administrator"
                  value={formData.administrator}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Teléfono Administrador"
                  name="administratorPhone"
                  value={formData.administratorPhone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  label="Email Administrador"
                  name="administratorEmail"
                  value={formData.administratorEmail}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Coordinador A Cargo"
                  name="coordinatorInChargeId"
                  value={formData.coordinatorInChargeId}
                  onChange={handleChange}
                >
                  <MenuItem value="">-- Ninguno --</MenuItem>
                  {employees.map((e) => (
                    <MenuItem key={e.value} value={e.value}>
                      {e.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Contacto Comercial"
                  name="commercialContactId"
                  value={formData.commercialContactId}
                  onChange={handleChange}
                >
                  <MenuItem value="">-- Ninguno --</MenuItem>
                  {employees.map((e) => (
                    <MenuItem key={e.value} value={e.value}>
                      {e.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => setActiveStep(1)}
              >
                Siguiente: Estructura del Inmueble
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 2 Content */}
      {activeStep === 1 && (
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
              <DomainIcon color="primary" /> Configuración de Estructura Físico-Residencial
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Tipo de Complejo Residencial"
                  value={structureType}
                  onChange={(e) => setStructureType(e.target.value)}
                  helperText="Define cómo se autogenerarán las torres, pisos y apartamentos/viviendas"
                >
                  <MenuItem value="SINGLE_BUILDING">Edificio Simple (1 Torre / Bloque)</MenuItem>
                  <MenuItem value="BUILDING_CLUSTER">Conjunto de Torres (Múltiples Torres)</MenuItem>
                  <MenuItem value="HOUSE_CLUSTER">Conjunto de Casas / Villas</MenuItem>
                  <MenuItem value="OTHER">Otro Tipo de Inmueble</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Dynamic builder based on type */}
            {structureType === "SINGLE_BUILDING" && (
              <Box sx={{ p: 3, bgcolor: "action.hover", borderRadius: 2, mb: 4 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Configuración del Edificio Simple
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Cantidad de Pisos"
                      value={floorsAmount}
                      onChange={(e) => setFloorsAmount(Number(e.target.value))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Apartamentos por Piso"
                      value={apartmentsPerFloor}
                      onChange={(e) => setApartmentsPerFloor(Number(e.target.value))}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={`Se generará 1 Torre con ${floorsAmount} pisos y aprox. ${floorsAmount * apartmentsPerFloor} apartamentos.`}
                    color="info"
                    variant="outlined"
                  />
                </Box>
              </Box>
            )}

            {structureType === "BUILDING_CLUSTER" && (
              <Box sx={{ p: 3, bgcolor: "action.hover", borderRadius: 2, mb: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Configuración de Torres del Conjunto ({towers.length} Torres)
                  </Typography>
                  <Button startIcon={<AddIcon />} variant="outlined" onClick={handleAddTower}>
                    Agregar Torre
                  </Button>
                </Box>

                {towers.map((t, idx) => (
                  <Paper key={idx} sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
                    <TextField
                      label="Nombre de Torre"
                      value={t.towerName}
                      onChange={(e) => handleTowerChange(idx, "towerName", e.target.value)}
                      sx={{ flexGrow: 1 }}
                    />
                    <TextField
                      type="number"
                      label="N° Pisos"
                      value={t.floorsAmount}
                      onChange={(e) => handleTowerChange(idx, "floorsAmount", Number(e.target.value))}
                      sx={{ width: 120 }}
                    />
                    <TextField
                      type="number"
                      label="Aptos/Piso"
                      value={t.apartmentsPerFloor}
                      onChange={(e) => handleTowerChange(idx, "apartmentsPerFloor", Number(e.target.value))}
                      sx={{ width: 120 }}
                    />
                    <IconButton color="error" onClick={() => handleRemoveTower(idx)} disabled={towers.length <= 1}>
                      <DeleteIcon />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            )}

            {structureType === "HOUSE_CLUSTER" && (
              <Box sx={{ p: 3, bgcolor: "action.hover", borderRadius: 2, mb: 4 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Configuración del Conjunto de Casas
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Cantidad de Casas / Viviendas"
                      value={unitsAmount}
                      onChange={(e) => setUnitsAmount(Number(e.target.value))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Prefijo de Nomenclatura"
                      value={housePrefix}
                      onChange={(e) => setHousePrefix(e.target.value)}
                      helperText="Ejemplo: Casa -> Casa 1, Casa 2... o Manzana A - Casa"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
              <Button variant="outlined" onClick={() => setActiveStep(0)}>
                Anterior
              </Button>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Registrando Cliente y Estructura..." : "Guardar Cliente y Generar Estructura"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
