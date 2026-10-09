"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Skeleton,
  useTheme,
  Divider,
  Chip,
} from "@mui/material";
import {
  EditRounded as EditIcon,
  SaveRounded as SaveIcon,
  CloseRounded as CloseIcon,
  BadgeRounded as BadgeIcon,
  LocationOnRounded as LocationIcon,
  ContactPhoneRounded as ContactPhoneIcon,
  SecurityRounded as SecurityIcon,
} from "@mui/icons-material";
import { useClientDetail } from "../ClientContext";
import UserAutocomplete, { UserOption } from "@/components/common/UserAutocomplete";

export default function ClientOverviewPage() {
  const { client, loading, saving, updateGeneral, permissions } = useClientDetail();
  const theme = useTheme();

  // Edit states for individual cards
  const [editingCard, setEditingCard] = useState<string | null>(null);

  // Form states
  const [form, setForm] = useState({
    name: "",
    nit: "",
    internalCode: "",
    sector: "RESIDENTIAL",
    clientStatus: "ACTIVE",
    address: "",
    city: "Bogotá",
    state: "",
    commune: "",
    neighborhood: "",
    zipCode: "",
    cai: "",
    quadrant: "",
    quadrantPhone: "",
    phone: "",
    receptionPhone: "",
    email: "",
    observations: "",
    coordinatorInChargeId: "",
    commercialContactId: "",
    weaponsAmount: 0,
    installedTech: false,
    securityStudy: "",
  });

  const [coordinatorUser, setCoordinatorUser] = useState<UserOption | null>(null);
  const [commercialUser, setCommercialUser] = useState<UserOption | null>(null);

  // Sync form with client data
  useEffect(() => {
    if (client) {
      setForm({
        name: client.name || "",
        nit: client.nit || "",
        internalCode: client.internalCode || "",
        sector: client.sector || "RESIDENTIAL",
        clientStatus: client.clientStatus || "ACTIVE",
        address: client.address || "",
        city: client.city || "Bogotá",
        state: client.state || "",
        commune: client.commune || "",
        neighborhood: client.neighborhood || "",
        zipCode: client.zipCode || "",
        cai: client.cai || "",
        quadrant: client.quadrant || "",
        quadrantPhone: client.quadrantPhone || "",
        phone: client.phone || "",
        receptionPhone: client.receptionPhone || "",
        email: client.email || "",
        observations: client.observations || "",
        coordinatorInChargeId: client.coordinatorInChargeId || "",
        commercialContactId: client.commercialContactId || "",
        weaponsAmount: client.weaponsAmount || 0,
        installedTech: Boolean(client.installedTech),
        securityStudy: client.securityStudy || "",
      });

      if (client.coordinatorInCharge) {
        setCoordinatorUser({
          id: client.coordinatorInCharge.id,
          fullName: client.coordinatorInCharge.fullName,
          position: client.coordinatorInCharge.position,
        });
      } else {
        setCoordinatorUser(null);
      }

      if (client.commercialContact) {
        setCommercialUser({
          id: client.commercialContact.id,
          fullName: client.commercialContact.fullName,
          position: client.commercialContact.position,
        });
      } else {
        setCommercialUser(null);
      }
    }
  }, [client]);

  const handleSaveCard = async () => {
    const success = await updateGeneral({
      ...form,
      coordinatorInChargeId: coordinatorUser?.id || null,
      commercialContactId: commercialUser?.id || null,
    });
    if (success) {
      setEditingCard(null);
    }
  };

  const handleCancelCard = () => {
    if (client) {
      setForm((prev) => ({
        ...prev,
        name: client.name || "",
        nit: client.nit || "",
        internalCode: client.internalCode || "",
        sector: client.sector || "RESIDENTIAL",
        clientStatus: client.clientStatus || "ACTIVE",
        address: client.address || "",
        city: client.city || "Bogotá",
        state: client.state || "",
        commune: client.commune || "",
        neighborhood: client.neighborhood || "",
        zipCode: client.zipCode || "",
        cai: client.cai || "",
        quadrant: client.quadrant || "",
        quadrantPhone: client.quadrantPhone || "",
        phone: client.phone || "",
        receptionPhone: client.receptionPhone || "",
        email: client.email || "",
        observations: client.observations || "",
        weaponsAmount: client.weaponsAmount || 0,
        installedTech: Boolean(client.installedTech),
        securityStudy: client.securityStudy || "",
      }));
    }
    setEditingCard(null);
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Page Title */}
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Resumen General
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestione los datos de identificación, localización física y contactos del cliente.
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
          {permissions.canEditGeneral && (
            editingCard === "card1" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={handleCancelCard}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveCard}
                  disabled={saving}
                >
                  Guardar
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingCard("card1")}
              >
                Editar
              </Button>
            )
          )}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "card1" ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Nombre o Razón Social"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="NIT o Documento"
                value={form.nit}
                onChange={(e) => setForm({ ...form, nit: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Código Interno"
                value={form.internalCode}
                onChange={(e) => setForm({ ...form, internalCode: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                select
                size="small"
                label="Sector"
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
              >
                <MenuItem value="RESIDENTIAL">Residencial</MenuItem>
                <MenuItem value="COMMERCIAL">Comercial</MenuItem>
                <MenuItem value="INDUSTRIAL">Industrial</MenuItem>
                <MenuItem value="GOVERNMENT">Gubernamental</MenuItem>
                <MenuItem value="OTHER">Otro</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                select
                size="small"
                label="Estado del Cliente"
                value={form.clientStatus}
                onChange={(e) => setForm({ ...form, clientStatus: e.target.value })}
              >
                <MenuItem value="ACTIVE">Activo</MenuItem>
                <MenuItem value="SUSPENDED">Suspendido</MenuItem>
                <MenuItem value="INACTIVE">Inactivo</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("Nombre / Razón Social", client?.name)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("NIT / Identificación", client?.nit)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("Código Interno", client?.internalCode)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField(
                "Sector Económico",
                client?.sector === "RESIDENTIAL"
                  ? "Residencial"
                  : client?.sector === "COMMERCIAL"
                  ? "Comercial"
                  : client?.sector === "INDUSTRIAL"
                  ? "Industrial"
                  : client?.sector === "GOVERNMENT"
                  ? "Gubernamental"
                  : client?.sector || "No especificado"
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField(
                "Estado del Cliente",
                client?.clientStatus === "ACTIVE"
                  ? "Activo"
                  : client?.clientStatus === "SUSPENDED"
                  ? "Suspendido"
                  : client?.clientStatus === "INACTIVE"
                  ? "Inactivo"
                  : client?.clientStatus,
                {
                  color:
                    client?.clientStatus === "ACTIVE"
                      ? "success"
                      : client?.clientStatus === "SUSPENDED"
                      ? "warning"
                      : "default",
                }
              )}
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Card 2: Ubicación y Cuadrante Policial */}
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
          {permissions.canEditGeneral && (
            editingCard === "card2" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={handleCancelCard}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveCard}
                  disabled={saving}
                >
                  Guardar
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingCard("card2")}
              >
                Editar
              </Button>
            )
          )}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "card2" ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Dirección Principal"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Ciudad"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Departamento / Estado"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Comuna / Localidad"
                value={form.commune}
                onChange={(e) => setForm({ ...form, commune: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Barrio"
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Código Postal"
                value={form.zipCode}
                onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="CAI Cercano"
                value={form.cai}
                onChange={(e) => setForm({ ...form, cai: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Cuadrante Policial"
                value={form.quadrant}
                onChange={(e) => setForm({ ...form, quadrant: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Teléfono del Cuadrante"
                value={form.quadrantPhone}
                onChange={(e) => setForm({ ...form, quadrantPhone: e.target.value })}
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("Dirección Principal", client?.address)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("Ciudad", client?.city)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("Departamento / Estado", client?.state)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("Comuna / Localidad", client?.commune)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("Barrio", client?.neighborhood)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("Código Postal", client?.zipCode)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("CAI Cercano", client?.cai)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("Cuadrante Policial", client?.quadrant)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("Teléfono del Cuadrante", client?.quadrantPhone)}
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Card 3: Contacto y Comunicación */}
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
              Contacto y Comunicación
            </Typography>
          </Box>
          {permissions.canEditGeneral && (
            editingCard === "card3" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={handleCancelCard}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveCard}
                  disabled={saving}
                >
                  Guardar
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingCard("card3")}
              >
                Editar
              </Button>
            )
          )}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "card3" ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Teléfono Principal"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Teléfono Recepción / Portería"
                value={form.receptionPhone}
                onChange={(e) => setForm({ ...form, receptionPhone: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Correo Electrónico"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label="Observaciones Generales"
                value={form.observations}
                onChange={(e) => setForm({ ...form, observations: e.target.value })}
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              {renderField("Teléfono Principal", client?.phone)}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              {renderField("Teléfono Recepción", client?.receptionPhone)}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              {renderField("Correo Electrónico", client?.email)}
            </Grid>
            <Grid size={12}>
              {renderField("Observaciones Generales", client?.observations)}
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Card 4: Asignación Operativa y Dotación */}
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
            <SecurityIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Asignación Operativa y Dotación
            </Typography>
          </Box>
          {permissions.canEditGeneral && (
            editingCard === "card4" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={handleCancelCard}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveCard}
                  disabled={saving}
                >
                  Guardar
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingCard("card4")}
              >
                Editar
              </Button>
            )
          )}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "card4" ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <UserAutocomplete
                type="coordinators"
                label="Coordinador a Cargo"
                value={coordinatorUser}
                onChange={(val) => setCoordinatorUser(val)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <UserAutocomplete
                type="commercials"
                label="Contacto Comercial"
                value={commercialUser}
                onChange={(val) => setCommercialUser(val)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.installedTech}
                    onChange={(e) => setForm({ ...form, installedTech: e.target.checked })}
                  />
                }
                label="Tecnología Instalada"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                size="small"
                label="Cantidad de Armas"
                value={form.weaponsAmount}
                onChange={(e) => setForm({ ...form, weaponsAmount: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Código Estudio de Seguridad"
                value={form.securityStudy}
                onChange={(e) => setForm({ ...form, securityStudy: e.target.value })}
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("Coordinador a Cargo", client?.coordinatorInCharge?.fullName)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("Contacto Comercial", client?.commercialContact?.fullName)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField(
                "Tecnología Instalada",
                client?.installedTech ? "Instalada" : "No instalada",
                {
                  color: client?.installedTech ? "success" : "default",
                }
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("Cantidad de Armas", client?.weaponsAmount)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderField("Código Estudio de Seguridad", client?.securityStudy)}
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
}
