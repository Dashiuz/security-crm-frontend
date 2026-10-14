"use client";

import React from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  Box,
  Paper,
  Button,
  IconButton,
  Divider,
} from "@mui/material";
import {
  AddRounded as AddIcon,
  DeleteOutlineRounded as DeleteIcon,
  BusinessRounded as BusinessIcon,
  PersonOutlineRounded as PersonIcon,
} from "@mui/icons-material";

export interface DynamicContact {
  roleName: string;
  name: string;
  document: string;
  email: string;
  phone: string;
}

export interface AdminCompanyData {
  companyName: string;
  nit: string;
  email: string;
  phone: string;
  legalRepName: string;
  legalRepId: string;
  legalRepPhone: string;
  legalRepEmail?: string;
  additionalContacts: DynamicContact[];
}

export interface IndividualAdminData {
  administrator: string;
  representativeDocument: string;
  administratorEmail: string;
  administratorPhone: string;
}

export interface ClientAdministrationStepProps {
  administrationType: "INDIVIDUAL" | "ENTERPRISE";
  onChangeAdministrationType: (type: "INDIVIDUAL" | "ENTERPRISE") => void;
  individualAdmin: IndividualAdminData;
  onChangeIndividualAdmin: (data: IndividualAdminData) => void;
  enterpriseAdmin: AdminCompanyData;
  onChangeEnterpriseAdmin: (data: AdminCompanyData) => void;
  disabled?: boolean;
}

export default function ClientAdministrationStep({
  administrationType,
  onChangeAdministrationType,
  individualAdmin,
  onChangeIndividualAdmin,
  enterpriseAdmin,
  onChangeEnterpriseAdmin,
  disabled = false,
}: ClientAdministrationStepProps) {
  // Update Individual Admin
  const updateIndividualField = (field: keyof IndividualAdminData, val: string) => {
    onChangeIndividualAdmin({
      ...individualAdmin,
      [field]: val,
    });
  };

  // Update Enterprise Admin fields
  const updateEnterpriseField = (field: keyof AdminCompanyData, val: any) => {
    onChangeEnterpriseAdmin({
      ...enterpriseAdmin,
      [field]: val,
    });
  };

  // Point 6: Dynamic Additional Contacts
  const handleAddAdditionalContact = () => {
    const nextList = [
      ...(enterpriseAdmin.additionalContacts || []),
      { roleName: "Asistente de Administración", name: "", document: "", email: "", phone: "" },
    ];
    updateEnterpriseField("additionalContacts", nextList);
  };

  const handleRemoveAdditionalContact = (idx: number) => {
    const nextList = (enterpriseAdmin.additionalContacts || []).filter((_, i) => i !== idx);
    updateEnterpriseField("additionalContacts", nextList);
  };

  const handleAdditionalContactChange = (idx: number, field: keyof DynamicContact, val: string) => {
    const nextList = [...(enterpriseAdmin.additionalContacts || [])];
    nextList[idx] = { ...nextList[idx], [field]: val };
    updateEnterpriseField("additionalContacts", nextList);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
          👥 4. Información de Contacto del Cliente y Administración
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Defina el modelo de administración del conjunto residencial o copropiedad y sus contactos directos.
        </Typography>
      </Box>

      {/* Selector de Tipo de Administración */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Tipo de Administración *"
              value={administrationType}
              onChange={(e) => onChangeAdministrationType(e.target.value as any)}
              disabled={disabled}
            >
              <MenuItem value="INDIVIDUAL">Persona Natural (Individual / Delegado)</MenuItem>
              <MenuItem value="ENTERPRISE">Empresa Administradora Tercerizada</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Formulario Persona Natural */}
      {administrationType === "INDIVIDUAL" && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <PersonIcon color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Datos del Administrador (Persona Natural)
            </Typography>
          </Box>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                required
                label="Nombre Completo del Administrador"
                value={individualAdmin.administrator}
                onChange={(e) => updateIndividualField("administrator", e.target.value)}
                disabled={disabled}
                placeholder="Ej: Lic. Carlos Andrés Gómez"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Cédula / Documento de Identificación"
                value={individualAdmin.representativeDocument}
                onChange={(e) => updateIndividualField("representativeDocument", e.target.value)}
                disabled={disabled}
                placeholder="CC 123456789"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="email"
                label="Correo Electrónico de Administración"
                value={individualAdmin.administratorEmail}
                onChange={(e) => updateIndividualField("administratorEmail", e.target.value)}
                disabled={disabled}
                placeholder="administracion@cliente.com"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Teléfono de Contacto"
                value={individualAdmin.administratorPhone}
                onChange={(e) => updateIndividualField("administratorPhone", e.target.value.replace(/\D/g, ""))}
                slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*" } }}
                disabled={disabled}
                placeholder="3001234567"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Formulario Empresa Tercerizada (Punto 6) */}
      {administrationType === "ENTERPRISE" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Datos de la Empresa y Representante Legal */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <BusinessIcon color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Datos de la Empresa Administradora Tercerizada
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Razón Social de la Empresa Administradora"
                  value={enterpriseAdmin.companyName}
                  onChange={(e) => updateEnterpriseField("companyName", e.target.value)}
                  disabled={disabled}
                  placeholder="Ej: Inmobiliaria & Gestión Integral SAS"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="NIT de la Empresa"
                  value={enterpriseAdmin.nit}
                  onChange={(e) => updateEnterpriseField("nit", e.target.value)}
                  disabled={disabled}
                  placeholder="900.987.654-1"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  label="Correo Corporativo de la Empresa"
                  value={enterpriseAdmin.email}
                  onChange={(e) => updateEnterpriseField("email", e.target.value)}
                  disabled={disabled}
                  placeholder="contacto@inmobiliaria.com"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Teléfono Corporativo de la Empresa"
                  value={enterpriseAdmin.phone}
                  onChange={(e) => updateEnterpriseField("phone", e.target.value.replace(/\D/g, ""))}
                  slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*" } }}
                  disabled={disabled}
                  placeholder="6017654321"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                  Representante Legal
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nombre Representante Legal"
                  value={enterpriseAdmin.legalRepName}
                  onChange={(e) => updateEnterpriseField("legalRepName", e.target.value)}
                  disabled={disabled}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Cédula Representante Legal"
                  value={enterpriseAdmin.legalRepId}
                  onChange={(e) => updateEnterpriseField("legalRepId", e.target.value)}
                  disabled={disabled}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Teléfono Representante Legal"
                  value={enterpriseAdmin.legalRepPhone}
                  onChange={(e) => updateEnterpriseField("legalRepPhone", e.target.value.replace(/\D/g, ""))}
                  slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*" } }}
                  disabled={disabled}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Contactos Adicionales de la Administración (Punto 6: Ilimitados) */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Contactos Adicionales de la Administración
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Agregue tantos contactos de la administración como sean necesarios (asistentes, supervisores de cuenta, etc.).
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddAdditionalContact}
                disabled={disabled}
                sx={{
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: 2,
                  whiteSpace: "nowrap",
                  px: 2,
                  py: 0.8,
                  width: { xs: "100%", sm: "auto" },
                  flexShrink: 0,
                }}
              >
                Agregar Contacto
              </Button>
            </Box>

            {(!enterpriseAdmin.additionalContacts || enterpriseAdmin.additionalContacts.length === 0) ? (
              <Box sx={{ p: 3, textAlign: "center", bgcolor: "background.default", borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay contactos adicionales agregados. Pulse &quot;+ Agregar Contacto&quot; para registrar uno nuevo.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {enterpriseAdmin.additionalContacts.map((contact, idx) => (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2, bgcolor: "background.default" }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Cargo / Rol"
                          value={contact.roleName}
                          onChange={(e) => handleAdditionalContactChange(idx, "roleName", e.target.value)}
                          disabled={disabled}
                          placeholder="Ej: Administrador Delegado"
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Nombre Completo"
                          value={contact.name}
                          onChange={(e) => handleAdditionalContactChange(idx, "name", e.target.value)}
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Cédula"
                          value={contact.document}
                          onChange={(e) => handleAdditionalContactChange(idx, "document", e.target.value)}
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Teléfono"
                          value={contact.phone}
                          onChange={(e) => handleAdditionalContactChange(idx, "phone", e.target.value.replace(/\D/g, ""))}
                          slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*" } }}
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 10, sm: 1.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="email"
                          label="Correo"
                          value={contact.email}
                          onChange={(e) => handleAdditionalContactChange(idx, "email", e.target.value)}
                          disabled={disabled}
                        />
                      </Grid>

                      <Grid size={{ xs: 2, sm: 0.5 }} sx={{ textAlign: "center" }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveAdditionalContact(idx)}
                          disabled={disabled}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
