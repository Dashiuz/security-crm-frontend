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
  IconButton,
  Chip,
} from "@mui/material";
import {
  EditRounded as EditIcon,
  SaveRounded as SaveIcon,
  CloseRounded as CloseIcon,
  GavelRounded as GavelIcon,
  BusinessRounded as BusinessIcon,
  GroupsRounded as GroupsIcon,
  AddRounded as AddIcon,
  DeleteRounded as DeleteIcon,
} from "@mui/icons-material";
import { useClientDetail } from "../ClientContext";

interface AdditionalContact {
  title: string;
  name: string;
  phone: string;
  email: string;
}

interface CouncilMember {
  name: string;
  phone: string;
  email: string;
  unit: string;
}

export default function ClientLegalPage() {
  const { client, loading, saving, updateLegal, permissions } = useClientDetail();
  const theme = useTheme();

  const [editingCard, setEditingCard] = useState<string | null>(null);

  // Contract state
  const [contractForm, setContractForm] = useState({
    contractNumber: "",
    contractStatus: "ACTIVE",
    renewedContract: false,
    contractDate: "",
    lastContractDate: "",
    contractEndDate: "",
  });

  // Administration state
  const [administrationType, setAdministrationType] = useState<string>("INDIVIDUAL");
  const [individualAdmin, setIndividualAdmin] = useState({
    administrator: "",
    identificationNumber: "",
    administratorEmail: "",
    administratorPhone: "",
  });
  const [enterpriseAdmin, setEnterpriseAdmin] = useState({
    companyName: "",
    nit: "",
    phone: "",
    email: "",
    legalRepName: "",
    legalRepId: "",
    legalRepPhone: "",
    additionalContacts: [] as AdditionalContact[],
  });

  // Council state
  const [councilPresident, setCouncilPresident] = useState<CouncilMember>({
    name: "",
    phone: "",
    email: "",
    unit: "",
  });
  const [councilTreasurer, setCouncilTreasurer] = useState<CouncilMember>({
    name: "",
    phone: "",
    email: "",
    unit: "",
  });
  const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>([]);

  useEffect(() => {
    if (client) {
      setContractForm({
        contractNumber: client.contractNumber || "",
        contractStatus: client.contractStatus || "ACTIVE",
        renewedContract: Boolean(client.renewedContract),
        contractDate: client.contractDate ? client.contractDate.split("T")[0] : "",
        lastContractDate: client.lastContractDate
          ? client.lastContractDate.split("T")[0]
          : "",
        contractEndDate: client.contractEndDate
          ? client.contractEndDate.split("T")[0]
          : client.lastContractDate
          ? client.lastContractDate.split("T")[0]
          : "",
      });

      const admType = client.administrationType || "INDIVIDUAL";
      setAdministrationType(admType);
      const admComp = client.administrationCompanyData || {};

      setIndividualAdmin({
        administrator: client.administrator || "",
        identificationNumber: admComp.identificationNumber || "",
        administratorEmail: client.administratorEmail || "",
        administratorPhone: client.administratorPhone || "",
      });

      setEnterpriseAdmin({
        companyName: admComp.companyName || client.administrator || "",
        nit: admComp.nit || "",
        phone: admComp.phone || client.administratorPhone || "",
        email: admComp.email || client.administratorEmail || "",
        legalRepName: admComp.legalRepName || "",
        legalRepId: admComp.legalRepId || "",
        legalRepPhone: admComp.legalRepPhone || "",
        additionalContacts: admComp.additionalContacts || [],
      });

      const cData = client.councilData || {};
      setCouncilPresident(cData.president || { name: "", phone: "", email: "", unit: "" });
      setCouncilTreasurer(cData.treasurer || { name: "", phone: "", email: "", unit: "" });
      setCouncilMembers(cData.councilMembers || []);
    }
  }, [client]);

  const handleSaveContract = async () => {
    const success = await updateLegal({
      contractNumber: contractForm.contractNumber,
      contractStatus: contractForm.contractStatus,
      renewedContract: contractForm.renewedContract,
      contractDate: contractForm.contractDate || null,
      lastContractDate: contractForm.lastContractDate || null,
      contractEndDate: contractForm.contractEndDate || null,
    });
    if (success) setEditingCard(null);
  };

  const handleSaveAdministration = async () => {
    const payload: any = {
      administrationType,
      administrator:
        administrationType === "INDIVIDUAL"
          ? individualAdmin.administrator
          : enterpriseAdmin.companyName,
      administratorPhone:
        administrationType === "INDIVIDUAL"
          ? individualAdmin.administratorPhone
          : enterpriseAdmin.phone,
      administratorEmail:
        administrationType === "INDIVIDUAL"
          ? individualAdmin.administratorEmail
          : enterpriseAdmin.email,
      administrationCompanyData:
        administrationType === "ENTERPRISE"
          ? enterpriseAdmin
          : {
              identificationNumber: individualAdmin.identificationNumber,
            },
    };

    const success = await updateLegal(payload);
    if (success) setEditingCard(null);
  };

  const handleSaveCouncil = async () => {
    const success = await updateLegal({
      councilData: {
        president: councilPresident,
        treasurer: councilTreasurer,
        councilMembers: councilMembers.filter((m) => m.name.trim() !== ""),
      },
    });
    if (success) setEditingCard(null);
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
          Legal y Contratos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestione las cláusulas contractuales, contactos administrativos y el consejo directivo.
        </Typography>
      </Box>

      {/* Card 1: Información Contractual */}
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
            <GavelIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Información Contractual
            </Typography>
          </Box>
          {permissions.canEditLegal && (
            editingCard === "contract" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={() => setEditingCard(null)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveContract}
                  disabled={saving}
                >
                  Guardar Contrato
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingCard("contract")}
              >
                Editar
              </Button>
            )
          )}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "contract" ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Número de Contrato"
                value={contractForm.contractNumber}
                onChange={(e) =>
                  setContractForm({ ...contractForm, contractNumber: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                select
                size="small"
                label="Estado del Contrato"
                value={contractForm.contractStatus}
                onChange={(e) =>
                  setContractForm({ ...contractForm, contractStatus: e.target.value })
                }
              >
                <MenuItem value="ACTIVE">Activo</MenuItem>
                <MenuItem value="SUSPENDED">Suspendido</MenuItem>
                <MenuItem value="TERMINATED">Terminado</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={contractForm.renewedContract}
                    onChange={(e) =>
                      setContractForm({
                        ...contractForm,
                        renewedContract: e.target.checked,
                      })
                    }
                  />
                }
                label="Prórroga Automática"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="date"
                size="small"
                label="Fecha Inicio"
                InputLabelProps={{ shrink: true }}
                value={contractForm.contractDate}
                onChange={(e) =>
                  setContractForm({ ...contractForm, contractDate: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="date"
                size="small"
                label="Fecha Vencimiento"
                InputLabelProps={{ shrink: true }}
                value={contractForm.lastContractDate}
                onChange={(e) =>
                  setContractForm({ ...contractForm, lastContractDate: e.target.value })
                }
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              {renderField("Número de Contrato", client?.contractNumber)}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              {renderField("Estado del Contrato", client?.contractStatus)}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              {renderField(
                "Prórroga Automática",
                client?.renewedContract ? "Habilitada" : "No",
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              {renderField("Fecha Inicio", client?.contractDate?.split("T")[0])}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              {renderField("Fecha Vencimiento", client?.lastContractDate?.split("T")[0])}
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Card 2: Administración del Inmueble */}
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
            <BusinessIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Administración del Inmueble
            </Typography>
          </Box>
          {permissions.canEditLegal && (
            editingCard === "admin" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={() => setEditingCard(null)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAdministration}
                  disabled={saving}
                >
                  Guardar Administración
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingCard("admin")}
              >
                Editar
              </Button>
            )
          )}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "admin" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              select
              size="small"
              label="Tipo de Administración"
              value={administrationType}
              onChange={(e) => setAdministrationType(e.target.value)}
              sx={{ width: 250 }}
            >
              <MenuItem value="INDIVIDUAL">Persona Natural (Individual)</MenuItem>
              <MenuItem value="ENTERPRISE">Empresa Inmobiliaria / Gestión</MenuItem>
            </TextField>

            {administrationType === "INDIVIDUAL" ? (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nombre del Administrador"
                    value={individualAdmin.administrator}
                    onChange={(e) =>
                      setIndividualAdmin({ ...individualAdmin, administrator: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Cédula / Identificación"
                    value={individualAdmin.identificationNumber}
                    onChange={(e) =>
                      setIndividualAdmin({
                        ...individualAdmin,
                        identificationNumber: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Teléfono de Contacto"
                    value={individualAdmin.administratorPhone}
                    onChange={(e) =>
                      setIndividualAdmin({
                        ...individualAdmin,
                        administratorPhone: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Correo Electrónico"
                    value={individualAdmin.administratorEmail}
                    onChange={(e) =>
                      setIndividualAdmin({
                        ...individualAdmin,
                        administratorEmail: e.target.value,
                      })
                    }
                  />
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Razón Social Empresa"
                    value={enterpriseAdmin.companyName}
                    onChange={(e) =>
                      setEnterpriseAdmin({ ...enterpriseAdmin, companyName: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="NIT Empresa"
                    value={enterpriseAdmin.nit}
                    onChange={(e) =>
                      setEnterpriseAdmin({ ...enterpriseAdmin, nit: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Teléfono Corporativo"
                    value={enterpriseAdmin.phone}
                    onChange={(e) =>
                      setEnterpriseAdmin({ ...enterpriseAdmin, phone: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Correo Corporativo"
                    value={enterpriseAdmin.email}
                    onChange={(e) =>
                      setEnterpriseAdmin({ ...enterpriseAdmin, email: e.target.value })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Representante Legal"
                    value={enterpriseAdmin.legalRepName}
                    onChange={(e) =>
                      setEnterpriseAdmin({
                        ...enterpriseAdmin,
                        legalRepName: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Teléfono Representante"
                    value={enterpriseAdmin.legalRepPhone}
                    onChange={(e) =>
                      setEnterpriseAdmin({
                        ...enterpriseAdmin,
                        legalRepPhone: e.target.value,
                      })
                    }
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              {renderField(
                "Tipo de Administración",
                administrationType === "INDIVIDUAL" ? "Persona Natural" : "Empresa / Inmobiliaria",
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              {renderField(
                "Administrador / Razón Social",
                administrationType === "INDIVIDUAL"
                  ? individualAdmin.administrator
                  : enterpriseAdmin.companyName,
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              {renderField(
                "Teléfono de Contacto",
                administrationType === "INDIVIDUAL"
                  ? individualAdmin.administratorPhone
                  : enterpriseAdmin.phone,
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              {renderField(
                "Correo Electrónico",
                administrationType === "INDIVIDUAL"
                  ? individualAdmin.administratorEmail
                  : enterpriseAdmin.email,
              )}
            </Grid>
            {administrationType === "ENTERPRISE" && (
              <Grid size={{ xs: 12, sm: 4 }}>
                {renderField("Representante Legal", enterpriseAdmin.legalRepName)}
              </Grid>
            )}
          </Grid>
        )}
      </Paper>

      {/* Card 3: Consejo de Administración */}
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
            <GroupsIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Consejo de Administración
            </Typography>
          </Box>
          {permissions.canEditLegal && (
            editingCard === "council" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={() => setEditingCard(null)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveCouncil}
                  disabled={saving}
                >
                  Guardar Consejo
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingCard("council")}
              >
                Editar
              </Button>
            )
          )}
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingCard === "council" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Presidente del Consejo
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nombre Completo"
                  value={councilPresident.name}
                  onChange={(e) => setCouncilPresident({ ...councilPresident, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Teléfono"
                  value={councilPresident.phone}
                  onChange={(e) => setCouncilPresident({ ...councilPresident, phone: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Correo"
                  value={councilPresident.email}
                  onChange={(e) => setCouncilPresident({ ...councilPresident, email: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Unidad / Apto"
                  value={councilPresident.unit}
                  onChange={(e) => setCouncilPresident({ ...councilPresident, unit: e.target.value })}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" fontWeight={600}>
              Tesorero del Consejo
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nombre Completo"
                  value={councilTreasurer.name}
                  onChange={(e) => setCouncilTreasurer({ ...councilTreasurer, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Teléfono"
                  value={councilTreasurer.phone}
                  onChange={(e) => setCouncilTreasurer({ ...councilTreasurer, phone: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Correo"
                  value={councilTreasurer.email}
                  onChange={(e) => setCouncilTreasurer({ ...councilTreasurer, email: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Unidad / Apto"
                  value={councilTreasurer.unit}
                  onChange={(e) => setCouncilTreasurer({ ...councilTreasurer, unit: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                PRESIDENTE DEL CONSEJO
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {councilPresident.name || "No designado"}
              </Typography>
              {councilPresident.phone && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Tel: {councilPresident.phone} • Apto: {councilPresident.unit || "N/A"}
                </Typography>
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                TESORERO DEL CONSEJO
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {councilTreasurer.name || "No designado"}
              </Typography>
              {councilTreasurer.phone && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Tel: {councilTreasurer.phone} • Apto: {councilTreasurer.unit || "N/A"}
                </Typography>
              )}
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
}
