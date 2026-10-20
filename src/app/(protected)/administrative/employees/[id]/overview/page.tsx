"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  Skeleton,
  TextField,
  MenuItem,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  EditRounded as EditIcon,
  SaveRounded as SaveIcon,
  CloseRounded as CloseIcon,
  BadgeRounded as BadgeIcon,
  WorkRounded as WorkIcon,
  ContactPhoneRounded as ContactPhoneIcon,
  CalendarMonthRounded as CalendarIcon,
  LocationOnRounded as LocationIcon,
  PersonRounded as PersonIcon,
} from "@mui/icons-material";
import { useEmployeeDetail } from "../EmployeeDetailContext";
import { HttpClient } from "@/lib/api/client";

export default function EmployeeOverviewPage() {
  const { summary, loading, updateEmployee } = useEmployeeDetail();
  const theme = useTheme();

  // Active section currently in edit mode ("personal" | "laboral" | "contacto" | null)
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [positions, setPositions] = useState<Array<{ id: string; name: string; departmentId?: string }>>([]);

  const employee = summary?.employee;

  const [form, setForm] = useState({
    firstName: "",
    secondName: "",
    lastName: "",
    maternalSurname: "",
    gender: "M",
    birthdate: "",
    entryDate: "",
    address: "",
    phone: "",
    email: "",
    departmentId: "",
    positionId: "",
  });

  const syncFormFromEmployee = () => {
    if (employee) {
      setForm({
        firstName: employee.firstName || "",
        secondName: employee.secondName || "",
        lastName: employee.lastName || "",
        maternalSurname: employee.maternalSurname || "",
        gender: employee.gender || "M",
        birthdate: employee.birthdate ? employee.birthdate.split("T")[0] : "",
        entryDate: employee.entryDate ? employee.entryDate.split("T")[0] : "",
        address: employee.address || "",
        phone: employee.phone || "",
        email: employee.email || "",
        departmentId: employee.departmentId || "",
        positionId: employee.positionId || "",
      });
    }
  };

  useEffect(() => {
    syncFormFromEmployee();
  }, [employee]);

  // Load departments and positions for the inline select fields
  useEffect(() => {
    const fetchRelations = async () => {
      try {
        const [depts, posts] = await Promise.allSettled([
          HttpClient.get<any[]>("/department"),
          HttpClient.get<any[]>("/position"),
        ]);
        if (depts.status === "fulfilled" && Array.isArray(depts.value)) {
          setDepartments(depts.value);
        }
        if (posts.status === "fulfilled" && Array.isArray(posts.value)) {
          setPositions(posts.value);
        }
      } catch (e) {
        console.error("Error loading departments/positions:", e);
      }
    };
    fetchRelations();
  }, []);

  const handleSaveCard = async (section: string) => {
    setSaving(true);
    try {
      let payload: Record<string, any> = {};
      if (section === "personal") {
        payload = {
          firstName: form.firstName,
          secondName: form.secondName || null,
          lastName: form.lastName,
          maternalSurname: form.maternalSurname || null,
          gender: form.gender,
          birthdate: form.birthdate || null,
          address: form.address,
        };
      } else if (section === "laboral") {
        payload = {
          departmentId: form.departmentId || null,
          positionId: form.positionId || null,
          entryDate: form.entryDate || null,
        };
      } else if (section === "contacto") {
        payload = {
          phone: form.phone || null,
          email: form.email || null,
        };
      }

      const ok = await updateEmployee(payload);
      if (ok) {
        setEditingCard(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelCard = () => {
    syncFormFromEmployee();
    setEditingCard(null);
  };

  const renderValueCell = (
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
          bgcolor: (t) =>
            t.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          transition: "all 0.18s ease-in-out",
          "&:hover": {
            bgcolor: (t) =>
              t.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.035)",
            borderColor: (t) =>
              t.palette.mode === "dark"
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

  if (loading && !employee) {
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
          Datos Personales y Laborales
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestione los datos de identificación, información laboral y canales de contacto del recurso.
        </Typography>
      </Box>

      {/* Card 1: Identificación y Datos Básicos */}
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
              Identificación y Datos Básicos
            </Typography>
          </Box>
          {editingCard === "personal" ? (
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
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={() => handleSaveCard("personal")}
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
              onClick={() => setEditingCard("personal")}
            >
              Editar
            </Button>
          )}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "personal" ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Primer Nombre"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Segundo Nombre"
                value={form.secondName}
                onChange={(e) => setForm({ ...form, secondName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Primer Apellido"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Segundo Apellido"
                value={form.maternalSurname}
                onChange={(e) => setForm({ ...form, maternalSurname: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                select
                size="small"
                label="Género"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <MenuItem value="M">Masculino</MenuItem>
                <MenuItem value="F">Femenino</MenuItem>
                <MenuItem value="OTRO">Otro</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Fecha de Nacimiento"
                value={form.birthdate}
                onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Dirección Residencial"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderValueCell("Nombre Completo", employee?.fullName)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderValueCell(
                "Documento",
                employee?.document
                  ? `${employee?.documentType || "CC"}: ${employee?.document}`
                  : null
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderValueCell(
                "Género",
                employee?.gender === "M"
                  ? "Masculino"
                  : employee?.gender === "F"
                  ? "Femenino"
                  : employee?.gender || null
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {renderValueCell("Fecha de Nacimiento", employee?.birthdate ? employee.birthdate.split("T")[0] : null)}
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              {renderValueCell("Dirección Residencial", employee?.address)}
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Card 2: Información Laboral y Contractual */}
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
            <WorkIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Información Laboral y Cargo
            </Typography>
          </Box>
          {editingCard === "laboral" ? (
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
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={() => handleSaveCard("laboral")}
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
              onClick={() => setEditingCard("laboral")}
            >
              Editar
            </Button>
          )}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "laboral" ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                select
                size="small"
                label="Departamento"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <MenuItem value="">
                  <em>Sin departamento</em>
                </MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                select
                size="small"
                label="Cargo Asignado"
                value={form.positionId}
                onChange={(e) => setForm({ ...form, positionId: e.target.value })}
              >
                <MenuItem value="">
                  <em>Sin cargo</em>
                </MenuItem>
                {positions.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Fecha de Ingreso"
                value={form.entryDate}
                onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {renderValueCell("Cargo Asignado", employee?.positionName)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {renderValueCell("Departamento", employee?.departmentName)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {renderValueCell("Fecha de Ingreso", employee?.entryDate ? employee.entryDate.split("T")[0] : null)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {renderValueCell(
                "Estado Contractual",
                employee?.isRetired
                  ? "Dado de Baja"
                  : employee?.isActive
                  ? "Activo"
                  : "Inactivo",
                {
                  color: employee?.isRetired
                    ? "error"
                    : employee?.isActive
                    ? "success"
                    : "default",
                  label: employee?.isRetired
                    ? "Dado de Baja"
                    : employee?.isActive
                    ? "Activo"
                    : "Inactivo",
                }
              )}
            </Grid>
            {employee?.isRetired && (
              <Grid size={{ xs: 12, md: 6 }}>
                {renderValueCell("Fecha de Retiro", employee?.retiredAt ? employee.retiredAt.split("T")[0] : null)}
              </Grid>
            )}
          </Grid>
        )}
      </Paper>

      {/* Card 3: Canales de Contacto Directo */}
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
              Canales de Contacto Directo
            </Typography>
          </Box>
          {editingCard === "contacto" ? (
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
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={() => handleSaveCard("contacto")}
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
              onClick={() => setEditingCard("contacto")}
            >
              Editar
            </Button>
          )}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "contacto" ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Teléfono Principal"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Correo Electrónico"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              {renderValueCell("Teléfono Principal", employee?.phone)}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {renderValueCell("Correo Electrónico", employee?.email)}
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
}
