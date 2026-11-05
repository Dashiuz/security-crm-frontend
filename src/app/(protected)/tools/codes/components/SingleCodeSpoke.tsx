"use client";

import React, { useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  QrCode2 as QrIcon,
  ViewWeek as BarcodeIcon,
  ContentCopy as CopyIcon,
  Print as PrintIcon,
  CheckCircle as SuccessIcon,
  ArrowForward as ForwardIcon,
  RestartAlt as ResetIcon,
} from "@mui/icons-material";
import {
  UniversalCodesApi,
  UniversalCode,
  CodeType,
  CodePurpose,
} from "@/lib/api/universal-codes";
import {
  generateBarcode128Svg,
  getQrCodeImageUrl,
} from "@/utils/barcode-generator";
import DepartmentAutocomplete from "./DepartmentAutocomplete";

interface SingleCodeSpokeProps {
  initialType?: CodeType;
  onSendToPrintStation: (code: UniversalCode) => void;
}

const PURPOSE_OPTIONS: { value: CodePurpose; label: string; recommendedType: CodeType }[] = [
  { value: "PATROL_CHECKPOINT", label: "Punto de Marcación / Ronda Física", recommendedType: "QR_CODE" },
  { value: "INVENTORY_ASSET", label: "Activo / Radio / Dotación de Seguridad", recommendedType: "BARCODE_128" },
  { value: "EMPLOYEE_CREDENTIAL", label: "Carnet de Guardia / Empleado", recommendedType: "QR_CODE" },
  { value: "RESIDENT_VEHICLE", label: "Bicicleta / Vehículo de Residente", recommendedType: "QR_CODE" },
  { value: "VISITOR_PASS", label: "Pase / Escarapela de Visitante", recommendedType: "BARCODE_128" },
  { value: "CORRESPONDENCE_PACKAGE", label: "Paquete de Correspondencia", recommendedType: "BARCODE_128" },
  { value: "DOCUMENT_VERIFICATION", label: "Radicado / Verificación de Documento", recommendedType: "QR_CODE" },
  { value: "OTHER_CUSTOM", label: "Finalidad Personalizada", recommendedType: "QR_CODE" },
];

export default function SingleCodeSpoke({
  initialType = "QR_CODE",
  onSendToPrintStation,
}: SingleCodeSpokeProps) {
  const [codeType, setCodeType] = useState<CodeType>(initialType);
  const [purpose, setPurpose] = useState<CodePurpose>("PATROL_CHECKPOINT");
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [description, setDescription] = useState("");

  // Metadatos operacionales contextuales
  // 1. PATROL_CHECKPOINT
  const [cpLocation, setCpLocation] = useState("");
  const [cpZoneType, setCpZoneType] = useState("Común");
  const [cpFloor, setCpFloor] = useState("1");
  const [cpInterval, setCpInterval] = useState("60");
  const [cpTolerance, setCpTolerance] = useState("10");
  const [cpPostOrder, setCpPostOrder] = useState("");
  const [cpRequireIncident, setCpRequireIncident] = useState(false);

  // 2. INVENTORY_ASSET
  const [assetSerial, setAssetSerial] = useState("");
  const [assetBrand, setAssetBrand] = useState("");
  const [assetModel, setAssetModel] = useState("");
  const [assetInternalId, setAssetInternalId] = useState("");
  const [assetCategory, setAssetCategory] = useState("Telecomunicaciones / Radio");
  const [assetMaintenanceDate, setAssetMaintenanceDate] = useState("");

  // 3. EMPLOYEE_CREDENTIAL
  const [empDoc, setEmpDoc] = useState("");
  const [empRole, setEmpRole] = useState("Guarda de Seguridad");
  const [empBloodType, setEmpBloodType] = useState("O+");
  const [empSupervigilancia, setEmpSupervigilancia] = useState("");
  const [empCourseExpiry, setEmpCourseExpiry] = useState("");
  const [empEmergencyPhone, setEmpEmergencyPhone] = useState("");

  // 4. RESIDENT_VEHICLE
  const [vehUnit, setVehUnit] = useState("");
  const [vehType, setVehType] = useState("Automóvil");
  const [vehPlateOrSerial, setVehPlateOrSerial] = useState("");
  const [vehBrandColor, setVehBrandColor] = useState("");
  const [vehParkingSpot, setVehParkingSpot] = useState("");
  const [vehOwnerName, setVehOwnerName] = useState("");

  // 5. VISITOR_PASS
  const [passNumber, setPassNumber] = useState("");
  const [passVisitorType, setPassVisitorType] = useState("Visitante General");
  const [passZones, setPassZones] = useState("Recepción y Zonas Comunes");

  // 6. CORRESPONDENCE_PACKAGE
  const [pkgTargetUnit, setPkgTargetUnit] = useState("");
  const [pkgCourier, setPkgCourier] = useState("Servientrega");
  const [pkgTrackingGuide, setPkgTrackingGuide] = useState("");
  const [pkgType, setPkgType] = useState("Paquete Pequeño");

  // 7. DOCUMENT_VERIFICATION
  const [docRadicado, setDocRadicado] = useState("");
  const [docType, setDocType] = useState("Acta de Entrega de Turno");
  const [docSigner, setDocSigner] = useState("");

  // 8. OTHER_CUSTOM
  const [customKey1, setCustomKey1] = useState("");
  const [customVal1, setCustomVal1] = useState("");

  // Estados de interfaz y validación
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAttempt, setSubmittedAttempt] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<UniversalCode | null>(null);
  const [copied, setCopied] = useState(false);

  // Acoplamiento Inteligente: al cambiar finalidad, preselecciona la simbología recomendada en terreno
  const handlePurposeChange = (newPurpose: CodePurpose) => {
    setPurpose(newPurpose);
    const target = PURPOSE_OPTIONS.find((p) => p.value === newPurpose);
    if (target) {
      setCodeType(target.recommendedType);
    }
  };

  const handleCreate = async () => {
    setSubmittedAttempt(true);
    if (!title.trim()) {
      setErrorMessage("El título o identificador descriptivo es obligatorio para emitir el código.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Compilar metadatos estructurados según la finalidad operativa
      const metadata: Record<string, unknown> = {};

      if (purpose === "PATROL_CHECKPOINT") {
        if (cpLocation.trim()) metadata.checkpointLocation = cpLocation.trim();
        metadata.zoneType = cpZoneType;
        metadata.floor = cpFloor.trim() || "1";
        metadata.targetIntervalMinutes = parseInt(cpInterval, 10) || 60;
        metadata.toleranceMinutes = parseInt(cpTolerance, 10) || 10;
        if (cpPostOrder.trim()) metadata.postOrder = cpPostOrder.trim();
        metadata.requiresIncidentReport = cpRequireIncident;
      } else if (purpose === "INVENTORY_ASSET") {
        if (assetSerial.trim()) metadata.serialNumber = assetSerial.trim();
        if (assetBrand.trim()) metadata.brand = assetBrand.trim();
        if (assetModel.trim()) metadata.model = assetModel.trim();
        if (assetInternalId.trim()) metadata.internalAssetId = assetInternalId.trim();
        metadata.assetCategory = assetCategory;
        if (assetMaintenanceDate.trim()) metadata.maintenanceDueDate = assetMaintenanceDate.trim();
        if (department) metadata.assignedDepartment = department;
      } else if (purpose === "EMPLOYEE_CREDENTIAL") {
        if (empDoc.trim()) metadata.documentNumber = empDoc.trim();
        metadata.operationalRole = empRole;
        metadata.bloodType = empBloodType;
        if (empSupervigilancia.trim()) metadata.supervigilanciaCarnet = empSupervigilancia.trim();
        if (empCourseExpiry.trim()) metadata.courseExpirationDate = empCourseExpiry.trim();
        if (empEmergencyPhone.trim()) metadata.emergencyPhone = empEmergencyPhone.trim();
      } else if (purpose === "RESIDENT_VEHICLE") {
        if (vehUnit.trim()) metadata.unitNumber = vehUnit.trim();
        metadata.vehicleType = vehType;
        if (vehPlateOrSerial.trim()) {
          metadata.plateOrSerial = vehPlateOrSerial.trim();
          metadata.serialNumber = vehPlateOrSerial.trim();
        }
        if (vehBrandColor.trim()) metadata.brandColor = vehBrandColor.trim();
        if (vehParkingSpot.trim()) metadata.parkingSpot = vehParkingSpot.trim();
        if (vehOwnerName.trim()) metadata.residentName = vehOwnerName.trim();
      } else if (purpose === "VISITOR_PASS") {
        if (passNumber.trim()) metadata.passNumber = passNumber.trim();
        metadata.visitorType = passVisitorType;
        if (passZones.trim()) metadata.authorizedZones = passZones.trim();
      } else if (purpose === "CORRESPONDENCE_PACKAGE") {
        if (pkgTargetUnit.trim()) metadata.targetUnit = pkgTargetUnit.trim();
        metadata.courierCompany = pkgCourier;
        if (pkgTrackingGuide.trim()) metadata.trackingGuide = pkgTrackingGuide.trim();
        metadata.packageType = pkgType;
      } else if (purpose === "DOCUMENT_VERIFICATION") {
        if (docRadicado.trim()) metadata.documentRadicado = docRadicado.trim();
        metadata.documentType = docType;
        if (docSigner.trim()) metadata.signerName = docSigner.trim();
      } else if (purpose === "OTHER_CUSTOM") {
        if (customKey1.trim()) metadata[customKey1.trim()] = customVal1.trim();
      }

      const res = await UniversalCodesApi.create({
        code: customCode.trim() ? customCode.trim().toUpperCase() : undefined,
        codeType,
        purpose,
        title: title.trim(),
        department: department.trim() || undefined,
        description: description.trim() || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });

      setGeneratedCode(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar el código universal.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGeneratedCode(null);
    setTitle("");
    setCustomCode("");
    setDescription("");
    setCpLocation("");
    setCpFloor("1");
    setCpInterval("60");
    setCpTolerance("10");
    setCpPostOrder("");
    setCpRequireIncident(false);
    setAssetSerial("");
    setAssetBrand("");
    setAssetModel("");
    setAssetInternalId("");
    setAssetMaintenanceDate("");
    setEmpDoc("");
    setEmpSupervigilancia("");
    setEmpCourseExpiry("");
    setEmpEmergencyPhone("");
    setVehUnit("");
    setVehPlateOrSerial("");
    setVehBrandColor("");
    setVehParkingSpot("");
    setVehOwnerName("");
    setPassNumber("");
    setPassZones("Recepción y Zonas Comunes");
    setPkgTargetUnit("");
    setPkgTrackingGuide("");
    setDocRadicado("");
    setDocSigner("");
    setCustomKey1("");
    setCustomVal1("");
    setSubmittedAttempt(false);
    setErrorMessage(null);
  };

  // Código simulado para previsualización reactiva previa a la creación
  const previewCodeValue = customCode.trim()
    ? customCode.trim().toUpperCase()
    : codeType === "QR_CODE"
    ? "LORO-QR-PREVIEW"
    : codeType === "BARCODE_EAN13"
    ? "7709144753560"
    : "LORO-BAR-PREVIEW";

  return (
    <Box>
      <Grid container spacing={3.5}>
        {/* Columna Izquierda: Formulario de Emisión */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
              Parámetros de Emisión Individual
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configura los atributos y preguntas operacionales del código para persistirlo de forma canónica en base de datos.
            </Typography>

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            )}

            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Finalidad Operativa"
                    value={purpose}
                    onChange={(e) => handlePurposeChange(e.target.value as CodePurpose)}
                  >
                    {PURPOSE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Tipo de Simbología"
                    value={codeType}
                    onChange={(e) => setCodeType(e.target.value as CodeType)}
                    helperText={
                      codeType === "QR_CODE"
                        ? "Sugerido para escaneo móvil, rondas y carnets"
                        : "Sugerido para pistolas láser USB en garita/almacén"
                    }
                  >
                    <MenuItem value="QR_CODE">Código QR Bidimensional</MenuItem>
                    <MenuItem value="BARCODE_128">Código de Barras Lineal (Code 128)</MenuItem>
                    <MenuItem value="BARCODE_EAN13">Código de Barras EAN-13 (13 dígitos)</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                size="small"
                required
                label="Título o Identificador Descriptivo"
                placeholder={
                  purpose === "PATROL_CHECKPOINT"
                    ? "Ej: Punto Ronda Garita Norte Entrada Sur"
                    : purpose === "EMPLOYEE_CREDENTIAL"
                    ? "Ej: Carnet Guardia Juan Carlos Pérez"
                    : purpose === "RESIDENT_VEHICLE"
                    ? "Ej: Vehículo Torre 2 - Apto 502"
                    : "Ej: Cámara Domo Almacén #12"
                }
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (submittedAttempt && e.target.value.trim()) {
                    setErrorMessage(null);
                  }
                }}
                error={submittedAttempt && !title.trim()}
                helperText={
                  submittedAttempt && !title.trim()
                    ? "Este campo es obligatorio para identificar el código."
                    : "Identificador legible que se imprimirá junto con el rótulo."
                }
              />

              <DepartmentAutocomplete
                value={department}
                onChange={setDepartment}
              />

              {/* 1. Formulario Específico: PUNTOS DE MARCACIÓN / RONDA FÍSICA */}
              {purpose === "PATROL_CHECKPOINT" && (
                <Box sx={{ p: 2.5, bgcolor: "neutral.50", borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, mb: 1.5, display: "block", textTransform: "uppercase", color: "primary.main" }}>
                    Parámetros Operacionales de Ronda de Vigilancia:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Ubicación o Sector Físico *"
                        placeholder="Ej: Cuarto de Bombas / Garita Norte"
                        value={cpLocation}
                        onChange={(e) => setCpLocation(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Tipo de Sector"
                        value={cpZoneType}
                        onChange={(e) => setCpZoneType(e.target.value)}
                      >
                        <MenuItem value="Común">Común / Tránsito Normal</MenuItem>
                        <MenuItem value="Crítico / Alto Riesgo">Crítico / Alto Riesgo</MenuItem>
                        <MenuItem value="Maquinaria / Bombas">Maquinaria / Servicios</MenuItem>
                        <MenuItem value="Perímetro Exterior">Perímetro Exterior</MenuItem>
                        <MenuItem value="Salida de Emergencia">Salida de Emergencia</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Piso o Nivel"
                        placeholder="Ej: Sótano 2, Piso 1"
                        value={cpFloor}
                        onChange={(e) => setCpFloor(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Frecuencia Ronda (min) *"
                        value={cpInterval}
                        onChange={(e) => setCpInterval(e.target.value)}
                        helperText="Cada cuánto marcar"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Tolerancia (min)"
                        value={cpTolerance}
                        onChange={(e) => setCpTolerance(e.target.value)}
                        helperText="Margen de demora"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Consigna Operativa de Verificación"
                        placeholder="Ej: Verificar candado de válvula principal, ausencia de fugas y registro de luminarias"
                        value={cpPostOrder}
                        onChange={(e) => setCpPostOrder(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={cpRequireIncident}
                            onChange={(e) => setCpRequireIncident(e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Exigir reporte de novedad de puesto al marcar en smartphone
                          </Typography>
                        }
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* 2. Formulario Específico: ACTIVOS / ARMAS / RADIOS / DOTACIÓN */}
              {purpose === "INVENTORY_ASSET" && (
                <Box sx={{ p: 2.5, bgcolor: "neutral.50", borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, mb: 1.5, display: "block", textTransform: "uppercase", color: "primary.main" }}>
                    Atributos del Activo, Equipo o Armamento:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Número de Serie de Fábrica *"
                        placeholder="Ej: SN-998240-MOT"
                        value={assetSerial}
                        onChange={(e) => setAssetSerial(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Marca y Modelo"
                        placeholder="Ej: Motorola DGP-8550e / Hikvision"
                        value={assetBrand}
                        onChange={(e) => setAssetBrand(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Categoría de Dotación"
                        value={assetCategory}
                        onChange={(e) => setAssetCategory(e.target.value)}
                      >
                        <MenuItem value="Telecomunicaciones / Radio">Telecomunicaciones / Radios</MenuItem>
                        <MenuItem value="Armamento y Munición">Armamento y Munición</MenuItem>
                        <MenuItem value="CCTV y Electrónica">CCTV y Electrónica</MenuItem>
                        <MenuItem value="Seguridad Perimetral / Linternas">Seguridad Perimetral / Linternas</MenuItem>
                        <MenuItem value="Dotación Uniforme">Dotación Uniforme</MenuItem>
                        <MenuItem value="Otro">Otro Activo Fijo</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Plaqueta de Activo Fijo Interno"
                        placeholder="Ej: ACT-SEG-2026-04"
                        value={assetInternalId}
                        onChange={(e) => setAssetInternalId(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Fecha Próximo Mantenimiento / Calibración"
                        InputLabelProps={{ shrink: true }}
                        value={assetMaintenanceDate}
                        onChange={(e) => setAssetMaintenanceDate(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* 3. Formulario Específico: CARNET DE GUARDIA / FUNCIONARIO */}
              {purpose === "EMPLOYEE_CREDENTIAL" && (
                <Box sx={{ p: 2.5, bgcolor: "neutral.50", borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, mb: 1.5, display: "block", textTransform: "uppercase", color: "primary.main" }}>
                    Ficha de Identificación de Guardia / Personal de Seguridad:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Cédula / Documento de Identidad *"
                        placeholder="Ej: 1020492810"
                        value={empDoc}
                        onChange={(e) => setEmpDoc(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Cargo Operativo"
                        value={empRole}
                        onChange={(e) => setEmpRole(e.target.value)}
                      >
                        <MenuItem value="Guarda de Seguridad">Guarda de Seguridad</MenuItem>
                        <MenuItem value="Supervisor de Zona">Supervisor de Zona</MenuItem>
                        <MenuItem value="Operador OMT (Cámaras)">Operador OMT (Cámaras)</MenuItem>
                        <MenuItem value="Escolta / Protección Especial">Escolta / Protección Especial</MenuItem>
                        <MenuItem value="Jefe de Operaciones">Jefe de Operaciones</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Grupo Sanguíneo RH *"
                        value={empBloodType}
                        onChange={(e) => setEmpBloodType(e.target.value)}
                      >
                        {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((rh) => (
                          <MenuItem key={rh} value={rh}>
                            {rh}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Carnet SuperVigilancia"
                        placeholder="Ej: SV-994820"
                        value={empSupervigilancia}
                        onChange={(e) => setEmpSupervigilancia(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Vencimiento Curso Vigilancia"
                        InputLabelProps={{ shrink: true }}
                        value={empCourseExpiry}
                        onChange={(e) => setEmpCourseExpiry(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Contacto de Emergencia / EPS / ARL"
                        placeholder="Ej: Sura ARL / Tel: 300 123 4567"
                        value={empEmergencyPhone}
                        onChange={(e) => setEmpEmergencyPhone(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* 4. Formulario Específico: VEHÍCULO O BICICLETA DE RESIDENTE */}
              {purpose === "RESIDENT_VEHICLE" && (
                <Box sx={{ p: 2.5, bgcolor: "neutral.50", borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, mb: 1.5, display: "block", textTransform: "uppercase", color: "primary.main" }}>
                    Rótulo de Control de Acceso Vehicular:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Unidad / Apartamento *"
                        placeholder="Ej: Torre 3 - Apto 502"
                        value={vehUnit}
                        onChange={(e) => setVehUnit(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Tipo de Vehículo"
                        value={vehType}
                        onChange={(e) => setVehType(e.target.value)}
                      >
                        <MenuItem value="Automóvil">Automóvil / Camioneta</MenuItem>
                        <MenuItem value="Motocicleta">Motocicleta</MenuItem>
                        <MenuItem value="Bicicleta">Bicicleta</MenuItem>
                        <MenuItem value="Patineta Eléctrica">Patineta Eléctrica</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Placa o Serial de Marco *"
                        placeholder="Ej: ABC-123 / GW-9912"
                        value={vehPlateOrSerial}
                        onChange={(e) => setVehPlateOrSerial(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Marca y Color"
                        placeholder="Ej: Trek Negro / Renault Blanco"
                        value={vehBrandColor}
                        onChange={(e) => setVehBrandColor(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Celda / Bahía Parqueadero"
                        placeholder="Ej: Bahía 45 (Sótano 1)"
                        value={vehParkingSpot}
                        onChange={(e) => setVehParkingSpot(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Nombre Residente Propietario"
                        placeholder="Ej: Carlos Mario Gómez"
                        value={vehOwnerName}
                        onChange={(e) => setVehOwnerName(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* 5. Formulario Específico: PASE / ESCARAPELA DE VISITANTE */}
              {purpose === "VISITOR_PASS" && (
                <Box sx={{ p: 2.5, bgcolor: "neutral.50", borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, mb: 1.5, display: "block", textTransform: "uppercase", color: "primary.main" }}>
                    Datos de Escarapela / Pase de Visitante:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Número Visible de Pase *"
                        placeholder="Ej: Pase #042"
                        value={passNumber}
                        onChange={(e) => setPassNumber(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Tipo de Visitante"
                        value={passVisitorType}
                        onChange={(e) => setPassVisitorType(e.target.value)}
                      >
                        <MenuItem value="Visitante General">Visitante General</MenuItem>
                        <MenuItem value="Contratista / Técnico">Contratista / Técnico</MenuItem>
                        <MenuItem value="Domiciliario / Delivery">Domiciliario / Delivery</MenuItem>
                        <MenuItem value="Proveedor">Proveedor</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Zonas Autorizadas"
                        placeholder="Ej: Recepción, Torre A, Pisos 1 al 4"
                        value={passZones}
                        onChange={(e) => setPassZones(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* 6. Formulario Específico: PAQUETE DE CORRESPONDENCIA */}
              {purpose === "CORRESPONDENCE_PACKAGE" && (
                <Box sx={{ p: 2.5, bgcolor: "neutral.50", borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, mb: 1.5, display: "block", textTransform: "uppercase", color: "primary.main" }}>
                    Rótulo de Recepción de Correspondencia / Paquetería:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Unidad o Apartamento Destino *"
                        placeholder="Ej: Torre 1 - Apto 304"
                        value={pkgTargetUnit}
                        onChange={(e) => setPkgTargetUnit(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Empresa de Envíos"
                        value={pkgCourier}
                        onChange={(e) => setPkgCourier(e.target.value)}
                      >
                        {["Servientrega", "Coordinadora", "Interrapidísimo", "Deprisa", "DHL", "FedEx", "MercadoLibre", "Otro"].map((c) => (
                          <MenuItem key={c} value={c}>
                            {c}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Número de Guía de Transporte"
                        placeholder="Ej: GUIA-99201940"
                        value={pkgTrackingGuide}
                        onChange={(e) => setPkgTrackingGuide(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Tipo de Paquete"
                        value={pkgType}
                        onChange={(e) => setPkgType(e.target.value)}
                      >
                        <MenuItem value="Sobre / Documento">Sobre / Documento</MenuItem>
                        <MenuItem value="Paquete Pequeño">Paquete Pequeño</MenuItem>
                        <MenuItem value="Bulto Voluminoso">Bulto Voluminoso</MenuItem>
                        <MenuItem value="Cadena de Frío / Perecedero">Cadena de Frío / Perecedero</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* 7. Formulario Específico: VERIFICACIÓN DE DOCUMENTO */}
              {purpose === "DOCUMENT_VERIFICATION" && (
                <Box sx={{ p: 2.5, bgcolor: "neutral.50", borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, mb: 1.5, display: "block", textTransform: "uppercase", color: "primary.main" }}>
                    Rótulo de Certificación Documental y Actas:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Número de Radicado / Acta *"
                        placeholder="Ej: ACTA-2026-TURNO-14"
                        value={docRadicado}
                        onChange={(e) => setDocRadicado(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Tipo de Documento"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                      >
                        <MenuItem value="Acta de Entrega de Turno">Acta de Entrega de Turno</MenuItem>
                        <MenuItem value="Minuta Oficial de Operaciones">Minuta Oficial de Operaciones</MenuItem>
                        <MenuItem value="Protocolo de Seguridad / Consigna">Protocolo de Seguridad / Consigna</MenuItem>
                        <MenuItem value="Contrato de Servicio">Contrato de Servicio</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Funcionario Responsable / Firmante"
                        placeholder="Ej: Supervisor de Zona Carlos Andrés"
                        value={docSigner}
                        onChange={(e) => setDocSigner(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* 8. Formulario Específico: PERSONALIZADO */}
              {purpose === "OTHER_CUSTOM" && (
                <Box sx={{ p: 2.5, bgcolor: "neutral.50", borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, mb: 1.5, display: "block", textTransform: "uppercase", color: "primary.main" }}>
                    Atributos Personalizados Clave-Valor:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Nombre del Atributo (Clave)"
                        placeholder="Ej: CodigoUbicacion"
                        value={customKey1}
                        onChange={(e) => setCustomKey1(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Valor del Atributo"
                        placeholder="Ej: SECTOR-B-99"
                        value={customVal1}
                        onChange={(e) => setCustomVal1(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Descripción o Notas Adicionales"
                placeholder="Observaciones de instalación, recomendaciones de seguridad o consignas..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <TextField
                fullWidth
                size="small"
                label="Código Personalizado (Opcional)"
                placeholder="Dejar en blanco para autogenerar con formato institucional LORO"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                helperText="Si se omite, el sistema generará automáticamente un código único garantizado sin colisiones."
              />

              <Button
                variant="contained"
                size="large"
                onClick={handleCreate}
                disabled={isSubmitting}
                sx={{
                  py: 1.4,
                  borderRadius: 2.5,
                  fontWeight: 800,
                  textTransform: "none",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Generar y Registrar Código en Base de Datos"
                )}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Columna Derecha: Previsualización en Vivo */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              textAlign: "center",
              bgcolor: "background.paper",
              position: "sticky",
              top: 24,
            }}
          >
            {generatedCode ? (
              // Ficha Exitosa del Código Generado
              <Box>
                <Chip
                  icon={<SuccessIcon />}
                  label="Código Registrado Exitosamente"
                  color="success"
                  sx={{ mb: 2.5, fontWeight: 700 }}
                />

                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {generatedCode.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Finalidad: <b>{generatedCode.purpose}</b> • {generatedCode.department || "General"}
                </Typography>

                {/* Contenedor del Rótulo Físico */}
                <Box
                  sx={{
                    p: 3,
                    bgcolor: "#ffffff",
                    borderRadius: 2.5,
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                    border: "1px solid",
                    borderColor: "divider",
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    maxWidth: 320,
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1.5, color: "primary.main", mb: 1 }}>
                    LORO ERP • CONTROL CANÓNICO
                  </Typography>

                  {generatedCode.codeType === "QR_CODE" ? (
                    <Box
                      component="img"
                      src={getQrCodeImageUrl(generatedCode.code, 220)}
                      alt={generatedCode.code}
                      sx={{ width: 190, height: 190, my: 1 }}
                    />
                  ) : (
                    <Box
                      sx={{ my: 1.5, maxWidth: "100%", overflow: "hidden" }}
                      dangerouslySetInnerHTML={{
                        __html: generateBarcode128Svg(generatedCode.code, {
                          width: 280,
                          height: 90,
                          showText: true,
                        }),
                      }}
                    />
                  )}

                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "monospace",
                      fontWeight: 800,
                      color: "text.primary",
                      letterSpacing: 1,
                      mt: 1,
                    }}
                  >
                    {generatedCode.code}
                  </Typography>

                  {generatedCode.department && (
                    <Typography variant="caption" color="text.secondary">
                      Área: {generatedCode.department}
                    </Typography>
                  )}
                </Box>

                {/* Acciones del Código Generado */}
                <Stack spacing={1.5}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PrintIcon />}
                    onClick={() => onSendToPrintStation(generatedCode)}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, py: 1 }}
                  >
                    Enviar a Estación de Impresión
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<CopyIcon />}
                    onClick={() => handleCopy(generatedCode.code)}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                  >
                    {copied ? "¡Código Copiado!" : "Copiar Código Canónico"}
                  </Button>

                  <Button
                    variant="text"
                    startIcon={<ResetIcon />}
                    onClick={handleReset}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, color: "text.secondary" }}
                  >
                    Emitir Nuevo Código
                  </Button>
                </Stack>
              </Box>
            ) : (
              // Previsualización en Vivo de Prueba
              <Box sx={{ width: "100%" }}>
                <Chip
                  label="Previsualización Vectorial en Vivo"
                  size="small"
                  variant="outlined"
                  sx={{ mb: 2, fontWeight: 700 }}
                />

                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {title.trim() || "Título del Código"}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: "block" }}>
                  {purpose} • {department || "Área General"}
                </Typography>

                <Box
                  sx={{
                    p: 2.5,
                    bgcolor: "#ffffff",
                    borderRadius: 2.5,
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
                    border: "1px dashed",
                    borderColor: "divider",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 180,
                    maxWidth: 300,
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  {codeType === "QR_CODE" ? (
                    <Box
                      component="img"
                      src={getQrCodeImageUrl(previewCodeValue, 200)}
                      alt="Preview QR"
                      sx={{ width: 170, height: 170 }}
                    />
                  ) : (
                    <Box
                      dangerouslySetInnerHTML={{
                        __html: generateBarcode128Svg(previewCodeValue, {
                          width: 260,
                          height: 80,
                          showText: true,
                        }),
                      }}
                    />
                  )}
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "text.secondary",
                  }}
                >
                  {previewCodeValue}
                </Typography>

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                  * Al hacer clic en registrar, se persistirá en PostgreSQL con trazabilidad de auditoría.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
