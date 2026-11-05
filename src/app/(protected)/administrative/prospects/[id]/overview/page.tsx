"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  Skeleton,
  useTheme,
  Chip,
} from "@mui/material";
import {
  EditRounded as EditIcon,
  BadgeRounded as BadgeIcon,
  LocationOnRounded as LocationIcon,
  ContactPhoneRounded as ContactPhoneIcon,
  ApartmentRounded as ApartmentIcon,
} from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import UserAutocomplete, { UserOption } from "@/components/common/UserAutocomplete";
import { useProspectDetail } from "../ProspectContext";

const SECTORS = [
  { value: "RESIDENTIAL", label: "Residencial" },
  { value: "COMMERCIAL", label: "Comercial" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "HEALTH", label: "Salud" },
  { value: "EDUCATION", label: "Educación" },
  { value: "FINANCIAL", label: "Financiero" },
  { value: "LOGISTICS", label: "Logística y Transporte" },
  { value: "OTHER", label: "Otro" },
];

export default function ProspectOverviewPage() {
  const { prospect, loading, saving, updateGeneral, permissions } = useProspectDetail();
  const theme = useTheme();

  // Active drawer state: null | "identification" | "location" | "contacts"
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);

  // Form states for each card drawer
  const [identForm, setIdentForm] = useState({
    name: "",
    nit: "",
    internalCode: "",
    sector: "RESIDENTIAL",
    observations: "",
  });

  const [locForm, setLocForm] = useState({
    address: "",
    city: "Bogotá",
    state: "Bogotá D.C.",
    commune: "",
    neighborhood: "",
    cai: "",
    quadrant: "",
    quadrantPhone: "",
    phone: "",
    email: "",
  });

  const [contactForm, setContactForm] = useState<{
    commercialContact: UserOption | null;
    coordinatorInCharge: UserOption | null;
  }>({
    commercialContact: null,
    coordinatorInCharge: null,
  });

  // Handlers to open drawers with populated data
  const handleOpenIdentDrawer = () => {
    if (prospect) {
      setIdentForm({
        name: prospect.name || "",
        nit: prospect.nit || "",
        internalCode: prospect.internalCode || "",
        sector: prospect.sector || "RESIDENTIAL",
        observations: prospect.observations || "",
      });
    }
    setActiveDrawer("identification");
  };

  const handleOpenLocDrawer = () => {
    if (prospect) {
      setLocForm({
        address: prospect.address || "",
        city: prospect.city || "Bogotá",
        state: "Bogotá D.C.",
        commune: prospect.commune || "",
        neighborhood: prospect.neighborhood || "",
        cai: prospect.cai || "",
        quadrant: prospect.quadrant || "",
        quadrantPhone: prospect.quadrantPhone || "",
        phone: prospect.phone || "",
        email: prospect.email || "",
      });
    }
    setActiveDrawer("location");
  };

  const handleOpenContactDrawer = () => {
    if (prospect) {
      setContactForm({
        commercialContact: prospect.commercialContact
          ? {
              id: prospect.commercialContact.id,
              fullName: prospect.commercialContact.fullName,
              position: prospect.commercialContact.position,
            }
          : null,
        coordinatorInCharge: prospect.coordinatorInCharge
          ? {
              id: prospect.coordinatorInCharge.id,
              fullName: prospect.coordinatorInCharge.fullName,
              position: prospect.coordinatorInCharge.position,
            }
          : null,
      });
    }
    setActiveDrawer("contacts");
  };

  // Submit handlers
  const handleSaveIdent = async () => {
    const success = await updateGeneral(identForm);
    if (success) setActiveDrawer(null);
  };

  const handleSaveLoc = async () => {
    const success = await updateGeneral(locForm);
    if (success) setActiveDrawer(null);
  };

  const handleSaveContact = async () => {
    const success = await updateGeneral({
      commercialContactId: contactForm.commercialContact?.id || null,
      coordinatorInChargeId: contactForm.coordinatorInCharge?.id || null,
    });
    if (success) setActiveDrawer(null);
  };

  const renderField = (
    label: string,
    value?: string | number | null,
    chip?: {
      color?: "success" | "warning" | "error" | "default" | "primary" | "info";
      label?: string;
    }
  ) => {
    const isValEmpty =
      value === undefined || value === null || String(value).trim() === "";

    return (
      <Box
        sx={{
          p: 2,
          height: "100%",
          minHeight: 74,
          borderRadius: 2.5,
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          transition: "all 0.18s ease-in-out",
          "&:hover": {
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.035)",
            borderColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontSize: "0.68rem",
            mb: 0.6,
          }}
        >
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {chip && !isValEmpty ? (
            <Chip
              size="small"
              label={chip.label || String(value)}
              color={chip.color || "default"}
              sx={{ fontWeight: 600, fontSize: "0.75rem", height: 24 }}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: isValEmpty ? "text.disabled" : "text.primary",
                wordBreak: "break-word",
              }}
            >
              {!isValEmpty ? String(value) : "No especificado"}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Skeleton variant="rounded" height={160} />
        <Skeleton variant="rounded" height={220} />
      </Box>
    );
  }

  const currentSectorObj = SECTORS.find((s) => s.value === prospect?.sector);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Page Title */}
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Resumen General del Prospecto
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestione la información de identificación básica, localización y equipo responsable.
        </Typography>
      </Box>

      {/* Card 1: Identificación y Clasificación */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <BadgeIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Identificación y Clasificación
            </Typography>
          </Box>
          {permissions.canEdit && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleOpenIdentDrawer}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Editar
            </Button>
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField("Nombre / Razón Social", prospect?.name)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField("NIT / Identificación Tributaria", prospect?.nit)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField(
              "Código Omega (Interno)",
              prospect?.internalCode,
              { color: "primary", label: prospect?.internalCode || "N/A" }
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField("Sector Económico", currentSectorObj?.label || prospect?.sector || "Residencial")}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField("Estado de Vinculación", "Prospecto Comercial", {
              color: "warning",
              label: "Prospecto en Negociación",
            })}
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {renderField("Observaciones Generales", prospect?.observations)}
          </Grid>
        </Grid>
      </Paper>

      {/* Card 2: Ubicación Geográfica y Cuadrante Policial */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <LocationIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Ubicación Geográfica y Cuadrante Policial
            </Typography>
          </Box>
          {permissions.canEdit && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleOpenLocDrawer}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Editar
            </Button>
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField("Dirección Principal", prospect?.address)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField("Ciudad", prospect?.city || "Bogotá")}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField("Barrio", prospect?.neighborhood)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField("Localidad / Comuna", prospect?.commune)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField("Teléfono Principal", prospect?.phone)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField("Correo Electrónico", prospect?.email)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField("CAI Policial Jurisdiccional", prospect?.cai)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField("Cuadrante Policial", prospect?.quadrant)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderField("Teléfono del Cuadrante", prospect?.quadrantPhone)}
          </Grid>
        </Grid>
      </Paper>

      {/* Card 3: Asignación Comercial y Responsables */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <ContactPhoneIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Asignación Comercial y Responsables
            </Typography>
          </Box>
          {permissions.canEdit && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleOpenContactDrawer}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Editar
            </Button>
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            {renderField(
              "Contacto Comercial Asignado",
              prospect?.commercialContact?.fullName,
              prospect?.commercialContact
                ? { color: "primary", label: prospect.commercialContact.fullName }
                : undefined
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            {renderField(
              "Coordinador de Operaciones a Cargo",
              prospect?.coordinatorInCharge?.fullName,
              prospect?.coordinatorInCharge
                ? { color: "info", label: prospect.coordinatorInCharge.fullName }
                : undefined
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Drawer 1: Editar Identificación */}
      <ResponsiveFormDrawer
        open={activeDrawer === "identification"}
        onClose={() => !saving && setActiveDrawer(null)}
        title="Editar Identificación y Clasificación"
        subtitle="Actualice los datos comerciales y de registro del prospecto."
        isSubmitting={saving}
        submitButtonText="Guardar Cambios"
        formId="ident-form"
        width={{ xs: "100%", sm: 500 }}
      >
        <Box
          component="form"
          id="ident-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveIdent();
          }}
          sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            fullWidth
            label="Razón Social / Nombre"
            value={identForm.name}
            onChange={(e) => setIdentForm({ ...identForm, name: e.target.value })}
            required
            size="small"
          />
          <TextField
            fullWidth
            label="NIT / Identificación"
            value={identForm.nit}
            onChange={(e) => setIdentForm({ ...identForm, nit: e.target.value })}
            size="small"
          />
          <TextField
            fullWidth
            label="Código Interno (Omega)"
            value={identForm.internalCode}
            onChange={(e) => setIdentForm({ ...identForm, internalCode: e.target.value })}
            size="small"
          />
          <TextField
            fullWidth
            select
            label="Sector Económico"
            value={identForm.sector}
            onChange={(e) => setIdentForm({ ...identForm, sector: e.target.value })}
            size="small"
          >
            {SECTORS.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Observaciones Generales"
            value={identForm.observations}
            onChange={(e) => setIdentForm({ ...identForm, observations: e.target.value })}
            size="small"
          />
        </Box>
      </ResponsiveFormDrawer>

      {/* Drawer 2: Editar Ubicación */}
      <ResponsiveFormDrawer
        open={activeDrawer === "location"}
        onClose={() => !saving && setActiveDrawer(null)}
        title="Editar Ubicación Geográfica"
        subtitle="Actualice la dirección, teléfonos y cuadrante policial del prospecto."
        isSubmitting={saving}
        submitButtonText="Guardar Cambios"
        formId="loc-form"
        width={{ xs: "100%", sm: 500 }}
      >
        <Box
          component="form"
          id="loc-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveLoc();
          }}
          sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            fullWidth
            label="Dirección Principal"
            value={locForm.address}
            onChange={(e) => setLocForm({ ...locForm, address: e.target.value })}
            required
            size="small"
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Ciudad"
                value={locForm.city}
                onChange={(e) => setLocForm({ ...locForm, city: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Barrio"
                value={locForm.neighborhood}
                onChange={(e) => setLocForm({ ...locForm, neighborhood: e.target.value })}
                size="small"
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label="Localidad / Comuna"
            value={locForm.commune}
            onChange={(e) => setLocForm({ ...locForm, commune: e.target.value })}
            size="small"
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Teléfono Principal"
                value={locForm.phone}
                onChange={(e) => setLocForm({ ...locForm, phone: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                value={locForm.email}
                onChange={(e) => setLocForm({ ...locForm, email: e.target.value })}
                size="small"
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label="CAI Policial Jurisdiccional"
            value={locForm.cai}
            onChange={(e) => setLocForm({ ...locForm, cai: e.target.value })}
            size="small"
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Cuadrante Policial"
                value={locForm.quadrant}
                onChange={(e) => setLocForm({ ...locForm, quadrant: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Teléfono del Cuadrante"
                value={locForm.quadrantPhone}
                onChange={(e) => setLocForm({ ...locForm, quadrantPhone: e.target.value })}
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
      </ResponsiveFormDrawer>

      {/* Drawer 3: Editar Responsables */}
      <ResponsiveFormDrawer
        open={activeDrawer === "contacts"}
        onClose={() => !saving && setActiveDrawer(null)}
        title="Asignación de Personal y Contactos"
        subtitle="Vincule el asesor comercial y el coordinador asignados al prospecto."
        isSubmitting={saving}
        submitButtonText="Guardar Cambios"
        formId="contact-form"
        width={{ xs: "100%", sm: 500 }}
      >
        <Box
          component="form"
          id="contact-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveContact();
          }}
          sx={{ p: 2, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <UserAutocomplete
            type="commercials"
            label="Contacto Comercial Asignado"
            value={contactForm.commercialContact}
            onChange={(u) => setContactForm({ ...contactForm, commercialContact: u })}
          />
          <UserAutocomplete
            type="coordinators"
            label="Coordinador de Operaciones a Cargo"
            value={contactForm.coordinatorInCharge}
            onChange={(u) => setContactForm({ ...contactForm, coordinatorInCharge: u })}
          />
        </Box>
      </ResponsiveFormDrawer>
    </Box>
  );
}
