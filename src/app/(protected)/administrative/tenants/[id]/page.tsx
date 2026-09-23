"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  CardContent,
  CardActionArea,
  Chip,
  InputAdornment,
  Divider,
  Alert,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Paper,
  Avatar,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Gavel as GavelIcon,
  WorkspacePremium as PremiumIcon,
  Tune as TuneIcon,
  Extension as ExtensionIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Login as LoginIcon,
  Info as InfoIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { AuthService } from "@/lib/api/auth";
import { useNotification } from "@/providers/NotificationProvider";
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

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = params.id as string;
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [tenant, setTenant] = useState<any | null>(null);
  const [featuresList, setFeaturesList] = useState<Feature[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Forms
  const generalForm = useForm<TenantGeneralFormData>({
    resolver: zodResolver(tenantGeneralSchema),
    mode: "onTouched",
  });

  const profileForm = useForm<TenantProfileFormData>({
    resolver: zodResolver(tenantProfileSchema),
    mode: "onTouched",
  });

  const subscriptionForm = useForm<TenantSubscriptionFormData>({
    resolver: zodResolver(tenantSubscriptionSchema),
    mode: "onTouched",
  });

  const settingsForm = useForm<TenantSettingsFormData>({
    resolver: zodResolver(tenantSettingsSchema),
    mode: "onTouched",
  });

  // Cargar datos
  const loadTenantData = useCallback(async () => {
    try {
      setLoading(true);
      const [tenantData, featuresData] = await Promise.all([
        HttpClient.get<any>(`/tenants/${tenantId}`),
        HttpClient.get<Feature[]>("/features"),
      ]);

      setTenant(tenantData);
      setFeaturesList(featuresData);
      setSelectedFeatures(tenantData.features || []);

      // Reset Forms con data cargada
      generalForm.reset({
        name: tenantData.name || "",
        slug: tenantData.slug || "",
        isActive: tenantData.isActive ?? true,
        logoUrl: tenantData.logoUrl || "",
        primaryColor: tenantData.primaryColor || "#1a237e",
        secondaryColor: tenantData.secondaryColor || "#455a64",
        sidebarColor: tenantData.sidebarColor || "",
      });

      profileForm.reset({
        legalName: tenantData.profile?.legalName || tenantData.name || "",
        taxId: tenantData.profile?.taxId || "",
        contactEmail: tenantData.profile?.contactEmail || "",
        contactPhone: tenantData.profile?.contactPhone || "",
        address: tenantData.profile?.address || "",
        city: tenantData.profile?.city || "Bogotá",
        country: tenantData.profile?.country || "Colombia",
        legalRepresentative: tenantData.profile?.legalRepresentative || "",
      });

      subscriptionForm.reset({
        planTier: tenantData.subscription?.planTier || "BASIC",
        status: tenantData.subscription?.status || "TRIAL",
        maxClients: tenantData.subscription?.maxClients ?? 5,
        maxUsers: tenantData.subscription?.maxUsers ?? 50,
        maxEmployees: tenantData.subscription?.maxEmployees ?? 50,
        subscriptionEndsAt: tenantData.subscription?.subscriptionEndsAt
          ? new Date(tenantData.subscription.subscriptionEndsAt).toISOString().split("T")[0]
          : "",
        paymentGatewayId: tenantData.subscription?.paymentGatewayId || "",
      });

      settingsForm.reset({
        timezone: tenantData.settings?.timezone || "America/Bogota",
        currency: tenantData.settings?.currency || "COP",
        dateFormat: tenantData.settings?.dateFormat || "DD/MM/YYYY",
        mfaRequired: tenantData.settings?.mfaRequired ?? false,
        sessionTimeoutMinutes: tenantData.settings?.sessionTimeoutMinutes ?? 60,
        passwordPolicy: tenantData.settings?.passwordPolicy || "MEDIUM",
        faviconUrl: tenantData.settings?.faviconUrl || "",
        loginBackgroundUrl: tenantData.settings?.loginBackgroundUrl || "",
        supportEmail: tenantData.settings?.supportEmail || "",
        supportPhone: tenantData.settings?.supportPhone || "",
      });
    } catch (err: any) {
      showError(err?.message || "Error al cargar la información de la empresa.");
    } finally {
      setLoading(false);
    }
  }, [tenantId, generalForm, profileForm, subscriptionForm, settingsForm, showError]);

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  // Guardar General
  const handleSaveGeneral = async (data: TenantGeneralFormData) => {
    try {
      setSavingSection("general");
      const updated = await HttpClient.patch<any>(`/tenants/${tenantId}`, {
        name: data.name,
        slug: data.slug,
        isActive: data.isActive,
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || null,
        secondaryColor: data.secondaryColor || null,
        sidebarColor: data.sidebarColor || null,
      });
      setTenant(updated);
      showSuccess("Información general actualizada correctamente.");
    } catch (err: any) {
      showError(err?.message || "Error al actualizar información general.");
    } finally {
      setSavingSection(null);
    }
  };

  // Guardar Perfil Legal
  const handleSaveProfile = async (data: TenantProfileFormData) => {
    try {
      setSavingSection("profile");
      const updated = await HttpClient.patch<any>(`/tenants/${tenantId}`, {
        profile: {
          legalName: data.legalName,
          taxId: data.taxId,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone || null,
          address: data.address || null,
          city: data.city || null,
          country: data.country || null,
          legalRepresentative: data.legalRepresentative || null,
        },
      });
      setTenant(updated);
      showSuccess("Perfil legal actualizado correctamente.");
    } catch (err: any) {
      showError(err?.message || "Error al actualizar perfil legal.");
    } finally {
      setSavingSection(null);
    }
  };

  // Guardar Suscripción
  const handleSaveSubscription = async (data: TenantSubscriptionFormData) => {
    try {
      setSavingSection("subscription");
      const updated = await HttpClient.patch<any>(`/tenants/${tenantId}`, {
        subscription: {
          planTier: data.planTier,
          status: data.status,
          maxClients: Number(data.maxClients),
          maxUsers: Number(data.maxUsers),
          maxEmployees: Number(data.maxEmployees),
          subscriptionEndsAt: data.subscriptionEndsAt
            ? new Date(data.subscriptionEndsAt).toISOString()
            : null,
          paymentGatewayId: data.paymentGatewayId || null,
        },
      });
      setTenant(updated);
      showSuccess("Suscripción y límites actualizados correctamente.");
    } catch (err: any) {
      showError(err?.message || "Error al actualizar la suscripción.");
    } finally {
      setSavingSection(null);
    }
  };

  // Guardar Ajustes
  const handleSaveSettings = async (data: TenantSettingsFormData) => {
    try {
      setSavingSection("settings");
      const updated = await HttpClient.patch<any>(`/tenants/${tenantId}`, {
        settings: {
          timezone: data.timezone,
          currency: data.currency,
          dateFormat: data.dateFormat,
          mfaRequired: data.mfaRequired,
          sessionTimeoutMinutes: Number(data.sessionTimeoutMinutes),
          passwordPolicy: data.passwordPolicy,
          faviconUrl: data.faviconUrl || null,
          loginBackgroundUrl: data.loginBackgroundUrl || null,
          supportEmail: data.supportEmail || null,
          supportPhone: data.supportPhone || null,
        },
      });
      setTenant(updated);
      showSuccess("Ajustes del sistema actualizados correctamente.");
    } catch (err: any) {
      showError(err?.message || "Error al actualizar los ajustes.");
    } finally {
      setSavingSection(null);
    }
  };

  // Guardar Módulos
  const handleSaveFeatures = async () => {
    try {
      setSavingSection("features");
      await HttpClient.put(`/tenants/${tenantId}/features`, {
        featureKeys: selectedFeatures,
      });
      setTenant((prev: any) => ({ ...prev, features: selectedFeatures }));
      showSuccess("Módulos de la empresa sincronizados correctamente.");
    } catch (err: any) {
      showError(err?.message || "Error al sincronizar módulos.");
    } finally {
      setSavingSection(null);
    }
  };

  const handleToggleFeature = (key: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleImpersonate = async () => {
    try {
      await AuthService.impersonate(tenantId);
      window.location.href = "/dashboard";
    } catch (error) {
      showError("Error al iniciar administración de la empresa.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tenant) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No se encontró la empresa solicitada.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1300, mx: "auto" }}>
      {/* Header & Breadcrumbs */}
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
          <Typography color="text.primary">{tenant.name}</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={tenant.logoUrl || undefined}
              alt={tenant.name}
              sx={{
                width: 56,
                height: 56,
                bgcolor: tenant.primaryColor || "primary.main",
                fontWeight: 700,
                fontSize: "1.3rem",
              }}
            >
              {tenant.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h5" fontWeight={700}>
                  {tenant.name}
                </Typography>
                <Chip
                  label={tenant.isActive ? "Activo" : "Inactivo"}
                  color={tenant.isActive ? "success" : "default"}
                  size="small"
                />
                <Chip
                  label={tenant.subscription?.planTier || "BASIC"}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Slug: <code>{tenant.slug}</code> | ID: {tenant.id}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/administrative/tenants")}
            >
              Volver al listado
            </Button>
            {tenant.slug !== "system" && tenant.id !== "system" && (
              <Button
                variant="contained"
                color="success"
                startIcon={<LoginIcon />}
                onClick={handleImpersonate}
              >
                Administrar (Impersonate)
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Tabs Layout */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
          <Tabs
            value={tabIndex}
            onChange={(_, newValue) => setTabIndex(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Tenant detail tabs"
          >
            <Tab icon={<InfoIcon />} iconPosition="start" label="Resumen" />
            <Tab icon={<BusinessIcon />} iconPosition="start" label="Identidad General" />
            <Tab icon={<GavelIcon />} iconPosition="start" label="Perfil Legal" />
            <Tab icon={<PremiumIcon />} iconPosition="start" label="Suscripción & Cuotas" />
            <Tab icon={<TuneIcon />} iconPosition="start" label="Ajustes & Seguridad" />
            <Tab icon={<ExtensionIcon />} iconPosition="start" label="Módulos" />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3.5 } }}>
          {/* TAB 0: RESUMEN / OVERVIEW */}
          <CustomTabPanel value={tabIndex} index={0}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Plan Contratado
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                      {tenant.subscription?.planTier || "BASIC"}
                    </Typography>
                    <Chip
                      label={tenant.subscription?.status || "TRIAL"}
                      size="small"
                      color="secondary"
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Límite de Clientes
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {tenant.subscription?.maxClients ?? 5}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Conjuntos / propiedades
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Límite de Usuarios
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {tenant.subscription?.maxUsers ?? 50}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Cuentas de acceso
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Módulos Habilitados
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="success.main">
                      {tenant.features?.length || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      De {featuresList.length} disponibles
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Información de Contacto & Legal
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Razón Social:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {tenant.profile?.legalName || "No especificada"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          NIT / Identificación:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {tenant.profile?.taxId || "No especificado"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Correo Institucional:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {tenant.profile?.contactEmail || "No especificado"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Teléfono:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {tenant.profile?.contactPhone || "No especificado"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Ciudad / País:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {tenant.profile?.city || "Bogotá"} - {tenant.profile?.country || "Colombia"}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Políticas & Seguridad
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Zona Horaria:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {tenant.settings?.timezone || "America/Bogota"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Moneda Oficial:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {tenant.settings?.currency || "COP"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Expiración de Sesión:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {tenant.settings?.sessionTimeoutMinutes || 60} minutos
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          MFA Obligatorio:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {tenant.settings?.mfaRequired ? "Sí" : "No"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Política de Claves:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {tenant.settings?.passwordPolicy || "MEDIUM"}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CustomTabPanel>

          {/* TAB 1: IDENTIDAD GENERAL */}
          <CustomTabPanel value={tabIndex} index={1}>
            <form onSubmit={generalForm.handleSubmit(handleSaveGeneral)}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Controller
                    name="name"
                    control={generalForm.control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="Nombre Comercial"
                        fullWidth
                        required
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
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
                          <Typography variant="subtitle2">Estado Activo</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {field.value ? "Habilitado" : "Deshabilitado"}
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
                        label="Slug Identificador"
                        fullWidth
                        required
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
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
                        label="URL del Logotipo"
                        fullWidth
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }}>
                    <Chip icon={<PaletteIcon />} label="Colores de Marca" size="small" />
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
                        label="Color de Barra Lateral"
                        fullWidth
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
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

                <Grid size={{ xs: 12 }} sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={
                      savingSection === "general" ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    disabled={savingSection === "general"}
                  >
                    Guardar Identidad General
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CustomTabPanel>

          {/* TAB 2: PERFIL LEGAL */}
          <CustomTabPanel value={tabIndex} index={2}>
            <form onSubmit={profileForm.handleSubmit(handleSaveProfile)}>
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

                <Grid size={{ xs: 12 }} sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={
                      savingSection === "profile" ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    disabled={savingSection === "profile"}
                  >
                    Guardar Perfil Legal
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CustomTabPanel>

          {/* TAB 3: SUSCRIPCIÓN & CUOTAS */}
          <CustomTabPanel value={tabIndex} index={3}>
            <form onSubmit={subscriptionForm.handleSubmit(handleSaveSubscription)}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="planTier"
                    control={subscriptionForm.control}
                    render={({ field }) => (
                      <TextField select label="Plan de Suscripción" fullWidth {...field}>
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
                      <TextField select label="Estado de Facturación" fullWidth {...field}>
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
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                        label="Máximo de Clientes / Propiedades"
                        type="number"
                        fullWidth
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
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
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                        label="Máximo de Cuentas de Usuario"
                        type="number"
                        fullWidth
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
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
                        helperText={fieldState.error?.message}
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
                        label="Vencimiento de la Suscripción"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message || "Dejar vacío si no expira"}
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
                        label="ID de Pasarela de Pagos"
                        fullWidth
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={
                      savingSection === "subscription" ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    disabled={savingSection === "subscription"}
                  >
                    Guardar Suscripción & Límites
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CustomTabPanel>

          {/* TAB 4: AJUSTES & SEGURIDAD */}
          <CustomTabPanel value={tabIndex} index={4}>
            <form onSubmit={settingsForm.handleSubmit(handleSaveSettings)}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller
                    name="timezone"
                    control={settingsForm.control}
                    render={({ field }) => (
                      <TextField select label="Zona Horaria" fullWidth {...field}>
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
                      <TextField select label="Moneda Predeterminada" fullWidth {...field}>
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
                      <TextField select label="Formato de Fecha" fullWidth {...field}>
                        <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                        <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                        <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }}>
                    <Chip icon={<SecurityIcon />} label="Políticas de Acceso y Sesión" size="small" />
                  </Divider>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller
                    name="passwordPolicy"
                    control={settingsForm.control}
                    render={({ field }) => (
                      <TextField select label="Política de Contraseñas" fullWidth {...field}>
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
                        label="Tiempo de Inactividad de Sesión (Min)"
                        type="number"
                        fullWidth
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
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
                            {field.value ? "Obligatorio" : "Opcional"}
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
                    <Chip label="Canales de Soporte al Usuario" size="small" />
                  </Divider>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="supportEmail"
                    control={settingsForm.control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="Correo Electrónico de Soporte"
                        type="email"
                        fullWidth
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
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
                        label="Línea Telefónica de Soporte"
                        fullWidth
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={
                      savingSection === "settings" ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    disabled={savingSection === "settings"}
                  >
                    Guardar Ajustes & Seguridad
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CustomTabPanel>

          {/* TAB 5: MÓDULOS */}
          <CustomTabPanel value={tabIndex} index={5}>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  Módulos Habilitados para la Empresa
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={
                    savingSection === "features" ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  onClick={handleSaveFeatures}
                  disabled={savingSection === "features"}
                >
                  Sincronizar Módulos ({selectedFeatures.length})
                </Button>
              </Box>

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
                          onClick={() => handleToggleFeature(feat.key)}
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
            </Box>
          </CustomTabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
