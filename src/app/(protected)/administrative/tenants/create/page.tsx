"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Grid,
  TextField,
  MenuItem,
  Switch,
  Card,
  CardActionArea,
  Chip,
  InputAdornment,
  Divider,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Gavel as GavelIcon,
  WorkspacePremium as PremiumIcon,
  Tune as TuneIcon,
  Extension as ExtensionIcon,
  AutoFixHigh as AutoFixIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";
import WizardStepper, { WizardStep } from "@/components/common/WizardStepper";
import {
  tenantGeneralSchema,
  TenantGeneralFormData,
  tenantProfileSchema,
  TenantProfileFormData,
  tenantSubscriptionSchema,
  TenantSubscriptionFormData,
  tenantSettingsSchema,
  TenantSettingsFormData,
} from "@/lib/schemas/tenant.schema";

interface Feature {
  key: string;
  name: string;
  description?: string;
}

export default function CreateTenantPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featuresList, setFeaturesList] = useState<Feature[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Step 1 Form: General
  const generalForm = useForm<TenantGeneralFormData>({
    resolver: zodResolver(tenantGeneralSchema),
    defaultValues: {
      name: "",
      slug: "",
      isActive: true,
      logoUrl: "",
      primaryColor: "#1a237e",
      secondaryColor: "#455a64",
      sidebarColor: "#0f172a",
    },
    mode: "onTouched",
  });

  // Step 2 Form: Legal Profile
  const profileForm = useForm<TenantProfileFormData>({
    resolver: zodResolver(tenantProfileSchema),
    defaultValues: {
      legalName: "",
      taxId: "900.123.456-7",
      contactEmail: "",
      contactPhone: "+57 601 2345678",
      address: "Calle 100 # 15 - 20 Oficina 501",
      city: "Bogotá",
      country: "Colombia",
      legalRepresentative: "Juan Carlos Pérez",
    },
    mode: "onTouched",
  });

  // Step 3 Form: Subscription & Limits
  const subscriptionForm = useForm<TenantSubscriptionFormData>({
    resolver: zodResolver(tenantSubscriptionSchema),
    defaultValues: {
      planTier: "BASIC",
      status: "TRIAL",
      maxClients: 5,
      maxUsers: 50,
      maxEmployees: 50,
      subscriptionEndsAt: "",
      paymentGatewayId: "",
    },
    mode: "onTouched",
  });

  // Step 4 Form: Settings & Security
  const settingsForm = useForm<TenantSettingsFormData>({
    resolver: zodResolver(tenantSettingsSchema),
    defaultValues: {
      timezone: "America/Bogota",
      currency: "COP",
      dateFormat: "DD/MM/YYYY",
      mfaRequired: false,
      sessionTimeoutMinutes: 60,
      passwordPolicy: "MEDIUM",
      faviconUrl: "",
      loginBackgroundUrl: "",
      supportEmail: "",
      supportPhone: "",
    },
    mode: "onTouched",
  });

  // Cargar lista de módulos (features) disponibles
  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const data = await HttpClient.get<Feature[]>("/features");
        setFeaturesList(data);
      } catch (err: any) {
        showError("Error al cargar el catálogo de características.");
      }
    };
    loadFeatures();
  }, [showError]);

  // Generar slug automáticamente desde el nombre si el slug está vacío
  const handleGenerateSlug = () => {
    const currentName = generalForm.getValues("name");
    if (!currentName) return;
    const generatedSlug = currentName
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s-]+/g, "-");
    generalForm.setValue("slug", generatedSlug, { shouldValidate: true });
  };

  // Toggle de selección de características
  const toggleFeature = (key: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllFeatures = () => {
    if (selectedFeatures.length === featuresList.length) {
      setSelectedFeatures([]);
    } else {
      setSelectedFeatures(featuresList.map((f) => f.key));
    }
  };

  // Control del avance por paso con validación
  const handleNext = async (): Promise<boolean> => {
    if (activeStep === 0) {
      const valid = await generalForm.trigger();
      if (!valid) return false;
      setActiveStep(1);
      return true;
    }
    if (activeStep === 1) {
      const valid = await profileForm.trigger();
      if (!valid) return false;
      setActiveStep(2);
      return true;
    }
    if (activeStep === 2) {
      const valid = await subscriptionForm.trigger();
      if (!valid) return false;
      setActiveStep(3);
      return true;
    }
    if (activeStep === 3) {
      const valid = await settingsForm.trigger();
      if (!valid) return false;
      setActiveStep(4);
      return true;
    }
    return true;
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  // Envío final
  const handleSubmitAll = async () => {
    const valid0 = await generalForm.trigger();
    const valid1 = await profileForm.trigger();
    const valid2 = await subscriptionForm.trigger();
    const valid3 = await settingsForm.trigger();

    if (!valid0) {
      setActiveStep(0);
      return;
    }
    if (!valid1) {
      setActiveStep(1);
      return;
    }
    if (!valid2) {
      setActiveStep(2);
      return;
    }
    if (!valid3) {
      setActiveStep(3);
      return;
    }

    const generalValues = generalForm.getValues();
    const profileValues = profileForm.getValues();
    const subValues = subscriptionForm.getValues();
    const settingsValues = settingsForm.getValues();

    const payload = {
      name: generalValues.name,
      slug: generalValues.slug,
      isActive: generalValues.isActive,
      logoUrl: generalValues.logoUrl || undefined,
      primaryColor: generalValues.primaryColor || undefined,
      secondaryColor: generalValues.secondaryColor || undefined,
      sidebarColor: generalValues.sidebarColor || undefined,
      profile: {
        legalName: profileValues.legalName,
        taxId: profileValues.taxId,
        contactEmail: profileValues.contactEmail,
        contactPhone: profileValues.contactPhone || undefined,
        address: profileValues.address || undefined,
        city: profileValues.city || undefined,
        country: profileValues.country || undefined,
        legalRepresentative: profileValues.legalRepresentative || undefined,
      },
      subscription: {
        planTier: subValues.planTier,
        status: subValues.status,
        maxClients: Number(subValues.maxClients),
        maxUsers: Number(subValues.maxUsers),
        maxEmployees: Number(subValues.maxEmployees),
        subscriptionEndsAt: subValues.subscriptionEndsAt
          ? new Date(subValues.subscriptionEndsAt).toISOString()
          : undefined,
        paymentGatewayId: subValues.paymentGatewayId || undefined,
      },
      settings: {
        timezone: settingsValues.timezone,
        currency: settingsValues.currency,
        dateFormat: settingsValues.dateFormat,
        mfaRequired: settingsValues.mfaRequired,
        sessionTimeoutMinutes: Number(settingsValues.sessionTimeoutMinutes),
        passwordPolicy: settingsValues.passwordPolicy,
        faviconUrl: settingsValues.faviconUrl || undefined,
        loginBackgroundUrl: settingsValues.loginBackgroundUrl || undefined,
        supportEmail: settingsValues.supportEmail || undefined,
        supportPhone: settingsValues.supportPhone || undefined,
      },
    };

    setIsSubmitting(true);
    try {
      const newTenant = await HttpClient.post<any>("/tenants", payload);

      // Asignar módulos si se seleccionaron
      if (selectedFeatures.length > 0 && newTenant?.id) {
        await HttpClient.put(`/tenants/${newTenant.id}/features`, {
          featureKeys: selectedFeatures,
        });
      }

      showSuccess(`Empresa "${newTenant.name}" creada exitosamente.`);
      router.push("/administrative/tenants");
    } catch (error: any) {
      showError(error?.message || "Ocurrió un error al crear la empresa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Definición de Pasos
  const steps: WizardStep[] = [
    {
      label: "Identidad",
      description: "Datos principales y marca",
      icon: <BusinessIcon sx={{ fontSize: 20 }} />,
      content: (
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Identificación de la Empresa
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configura el nombre comercial, identificador único (slug) y la paleta de colores de la organización.
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Controller
                name="name"
                control={generalForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Nombre Comercial de la Empresa"
                    fullWidth
                    required
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    placeholder="Ej: Seguridad Andina"
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="isActive"
                control={generalForm.control}
                render={({ field }) => (
                  <Box
                    sx={{
                      p: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      height: "100%",
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">Estado Operativo</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {field.value ? "Empresa Activa" : "Empresa Inactiva"}
                      </Typography>
                    </Box>
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      color="success"
                    />
                  </Box>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="slug"
                control={generalForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Slug Identificador (Dominio/Ruta)"
                    fullWidth
                    required
                    error={Boolean(fieldState.error)}
                    helperText={
                      fieldState.error?.message ||
                      "Identificador único usado en rutas y subdominios."
                    }
                    placeholder="ej: seguridad-andina"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Generar desde el nombre">
                            <IconButton onClick={handleGenerateSlug} edge="end" color="primary">
                              <AutoFixIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="logoUrl"
                control={generalForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="URL del Logo"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message || "URL pública del logotipo (PNG o SVG)"}
                    placeholder="https://miservidor.com/logo.png"
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }}>
                <Chip icon={<PaletteIcon />} label="Personalización de Marca" size="small" />
              </Divider>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="primaryColor"
                control={generalForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Color Primario"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "4px",
                              bgcolor: field.value || "#1a237e",
                              border: "1px solid #ccc",
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="secondaryColor"
                control={generalForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Color Secundario"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "4px",
                              bgcolor: field.value || "#455a64",
                              border: "1px solid #ccc",
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="sidebarColor"
                control={generalForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Color de Barra Lateral (Opcional)"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    placeholder="#0f172a"
                    InputProps={{
                      startAdornment: field.value ? (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "4px",
                              bgcolor: field.value,
                              border: "1px solid #ccc",
                            }}
                          />
                        </InputAdornment>
                      ) : undefined,
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      ),
    },
    {
      label: "Perfil Legal",
      description: "Razón social y contacto",
      icon: <GavelIcon sx={{ fontSize: 20 }} />,
      content: (
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Información Legal y Representación
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Datos constitutivos de la persona jurídica o natural para efectos contractuales y tributarios.
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Controller
                name="legalName"
                control={profileForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Razón Social Oficial"
                    fullWidth
                    required
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    placeholder="Ej: Seguridad Andina de Colombia S.A.S."
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Controller
                name="taxId"
                control={profileForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="NIT / RUT / Identificador Fiscal"
                    fullWidth
                    required
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    placeholder="900.123.456-7"
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="contactEmail"
                control={profileForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Correo Electrónico Institucional"
                    type="email"
                    fullWidth
                    required
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    placeholder="contacto@seguridadandina.com"
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="contactPhone"
                control={profileForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Teléfono Principal"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    placeholder="+57 601 2345678"
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="legalRepresentative"
                control={profileForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Representante Legal"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    placeholder="Juan Carlos Pérez"
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="address"
                control={profileForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Dirección Principal"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    placeholder="Calle 100 # 15 - 20 Oficina 501"
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="city"
                control={profileForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Ciudad"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="country"
                control={profileForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="País"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      ),
    },
    {
      label: "Suscripción",
      description: "Planes y cuotas de uso",
      icon: <PremiumIcon sx={{ fontSize: 20 }} />,
      content: (
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Plan y Capacidades Asignadas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Define los límites operativos de la empresa y la vigencia de su suscripción.
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="planTier"
                control={subscriptionForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Plan de Suscripción"
                    fullWidth
                    helperText="Nivel de características contratadas"
                  >
                    <MenuItem value="BASIC">Básico (BASIC)</MenuItem>
                    <MenuItem value="PRO">Profesional (PRO)</MenuItem>
                    <MenuItem value="ENTERPRISE">Empresarial (ENTERPRISE)</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="status"
                control={subscriptionForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Estado de la Suscripción"
                    fullWidth
                    helperText="Condición de facturación del cliente"
                  >
                    <MenuItem value="TRIAL">Periodo de Prueba (TRIAL)</MenuItem>
                    <MenuItem value="ACTIVE">Activa (ACTIVE)</MenuItem>
                    <MenuItem value="PAST_DUE">En Mora (PAST_DUE)</MenuItem>
                    <MenuItem value="CANCELED">Cancelada (CANCELED)</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="maxClients"
                control={subscriptionForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    label="Máximo de Clientes / Conjuntos"
                    type="number"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message || "Límite de propiedades administrables"}
                    inputProps={{ min: 1 }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="maxUsers"
                control={subscriptionForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    label="Máximo de Usuarios del Sistema"
                    type="number"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message || "Límite de cuentas de acceso"}
                    inputProps={{ min: 1 }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="maxEmployees"
                control={subscriptionForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                    label="Máximo de Empleados"
                    type="number"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message || "Guardas, supervisores, etc."}
                    inputProps={{ min: 1 }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="subscriptionEndsAt"
                control={subscriptionForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Fecha de Vencimiento de Suscripción"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message || "Dejar vacío si es indefinida"}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="paymentGatewayId"
                control={subscriptionForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="ID de Pasarela de Pagos (Stripe/Wompi)"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message || "ID de cliente externo"}
                    placeholder="cus_Nox123456"
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      ),
    },
    {
      label: "Ajustes & Seguridad",
      description: "Políticas y configuración",
      icon: <TuneIcon sx={{ fontSize: 20 }} />,
      content: (
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Configuración Operativa y Políticas de Seguridad
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ajustes regionales, requisitos de acceso y canales de asistencia.
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="timezone"
                control={settingsForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Zona Horaria Predeterminada"
                    fullWidth
                  >
                    <MenuItem value="America/Bogota">Bogotá / Lima (UTC-5)</MenuItem>
                    <MenuItem value="America/Mexico_City">Ciudad de México (UTC-6)</MenuItem>
                    <MenuItem value="America/Santiago">Santiago de Chile (UTC-3)</MenuItem>
                    <MenuItem value="America/Argentina/Buenos_Aires">Buenos Aires (UTC-3)</MenuItem>
                    <MenuItem value="America/New_York">Nueva York (UTC-5 / UTC-4)</MenuItem>
                    <MenuItem value="UTC">UTC Universal</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="currency"
                control={settingsForm.control}
                render={({ field }) => (
                  <TextField {...field} select label="Moneda" fullWidth>
                    <MenuItem value="COP">Peso Colombiano (COP)</MenuItem>
                    <MenuItem value="USD">Dólar Estadounidense (USD)</MenuItem>
                    <MenuItem value="EUR">Euro (EUR)</MenuItem>
                    <MenuItem value="MXN">Peso Mexicano (MXN)</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="dateFormat"
                control={settingsForm.control}
                render={({ field }) => (
                  <TextField {...field} select label="Formato de Fecha" fullWidth>
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }}>
                <Chip icon={<SecurityIcon />} label="Seguridad y Sesiones" size="small" />
              </Divider>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="passwordPolicy"
                control={settingsForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Política de Contraseñas"
                    fullWidth
                    helperText="Exigencia de complejidad"
                  >
                    <MenuItem value="LOW">Baja (Mínimo 6 caracteres)</MenuItem>
                    <MenuItem value="MEDIUM">Media (8 caracteres + mayúsculas y números)</MenuItem>
                    <MenuItem value="STRICT">Estricta (10 caracteres + símbolos y rotación)</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="sessionTimeoutMinutes"
                control={settingsForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                    label="Expiración de Sesión (Minutos)"
                    type="number"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message || "Tiempo de inactividad"}
                    inputProps={{ min: 5, max: 1440 }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="mfaRequired"
                control={settingsForm.control}
                render={({ field }) => (
                  <Box
                    sx={{
                      p: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      height: "100%",
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">Autenticación MFA</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {field.value ? "Obligatorio para todos" : "Opcional"}
                      </Typography>
                    </Box>
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      color="primary"
                    />
                  </Box>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Canales de Soporte y Asistencia" size="small" />
              </Divider>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="supportEmail"
                control={settingsForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Correo de Soporte para Usuarios"
                    type="email"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    placeholder="soporte@empresa.com"
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="supportPhone"
                control={settingsForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Teléfono o Línea de Asistencia"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    placeholder="+57 300 000 0000"
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      ),
    },
    {
      label: "Módulos",
      description: "Características activadas",
      icon: <ExtensionIcon sx={{ fontSize: 20 }} />,
      content: (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Módulos y Características Habilitadas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Selecciona qué herramientas y funcionalidades estarán a disposición de los usuarios de este tenant.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip
                label={`${selectedFeatures.length} / ${featuresList.length} Seleccionados`}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={
                  selectedFeatures.length === featuresList.length
                    ? "Deseleccionar Todos"
                    : "Seleccionar Todos"
                }
                clickable
                onClick={handleSelectAllFeatures}
                color="secondary"
              />
            </Box>
          </Box>

          {featuresList.length === 0 ? (
            <Alert severity="info">
              No hay características registradas en el catálogo del sistema.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {featuresList.map((feat) => {
                const isSelected = selectedFeatures.includes(feat.key);
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feat.key}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2.5,
                        borderColor: isSelected ? "primary.main" : "divider",
                        bgcolor: isSelected
                          ? "rgba(26, 35, 126, 0.03)"
                          : "background.paper",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                          borderColor: isSelected ? "primary.main" : "text.secondary",
                        },
                      }}
                    >
                      <CardActionArea
                        onClick={() => toggleFeature(feat.key)}
                        sx={{ p: 2, height: "100%" }}
                      >
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                          {isSelected ? (
                            <CheckCircleIcon color="primary" sx={{ mt: 0.2 }} />
                          ) : (
                            <UncheckedIcon color="disabled" sx={{ mt: 0.2 }} />
                          )}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {feat.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                mt: 0.5,
                              }}
                            >
                              {feat.description || "Sin descripción específica"}
                            </Typography>
                            <Chip
                              label={feat.key}
                              size="small"
                              sx={{
                                mt: 1,
                                height: 20,
                                fontSize: "0.7rem",
                                bgcolor: "action.hover",
                              }}
                            />
                          </Box>
                        </Box>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      {/* Breadcrumbs & Title */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
          <Link
            underline="hover"
            color="inherit"
            href="/dashboard"
            onClick={(e) => {
              e.preventDefault();
              router.push("/dashboard");
            }}
          >
            Dashboard
          </Link>
          <Link
            underline="hover"
            color="inherit"
            href="/administrative/tenants"
            onClick={(e) => {
              e.preventDefault();
              router.push("/administrative/tenants");
            }}
          >
            Empresas
          </Link>
          <Typography color="text.primary">Nueva Empresa</Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={700} color="text.primary">
          Crear Nueva Empresa
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Asistente de configuración integral de organizaciones para el ecosistema Noxia CRM.
        </Typography>
      </Box>

      {/* Wizard */}
      <WizardStepper
        steps={steps}
        activeStep={activeStep}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={handleSubmitAll}
        isSubmitting={isSubmitting}
        submitText="Crear Empresa"
        canClickSteps={true}
        onStepClick={(step) => setActiveStep(step)}
      />
    </Box>
  );
}
