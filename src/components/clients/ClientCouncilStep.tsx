"use client";

import React from "react";
import {
  Grid,
  TextField,
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
  GroupsRounded as GroupsIcon,
} from "@mui/icons-material";

export interface CouncilMember {
  name: string;
  phone: string;
  email: string;
  unit: string;
}

export interface ClientCouncilStepProps {
  councilPresident: CouncilMember;
  onChangeCouncilPresident: (member: CouncilMember) => void;
  councilTreasurer: CouncilMember;
  onChangeCouncilTreasurer: (member: CouncilMember) => void;
  councilMembers: CouncilMember[];
  onChangeCouncilMembers: (members: CouncilMember[]) => void;
  disabled?: boolean;
}

export default function ClientCouncilStep({
  councilPresident,
  onChangeCouncilPresident,
  councilTreasurer,
  onChangeCouncilTreasurer,
  councilMembers,
  onChangeCouncilMembers,
  disabled = false,
}: ClientCouncilStepProps) {
  const updatePresidentField = (field: keyof CouncilMember, val: string) => {
    onChangeCouncilPresident({
      ...councilPresident,
      [field]: val,
    });
  };

  const updateTreasurerField = (field: keyof CouncilMember, val: string) => {
    onChangeCouncilTreasurer({
      ...councilTreasurer,
      [field]: val,
    });
  };

  // Point 7: Dynamic Other Council Members / Vocales
  const handleAddMember = () => {
    onChangeCouncilMembers([
      ...councilMembers,
      { name: "", phone: "", email: "", unit: "" },
    ]);
  };

  const handleRemoveMember = (idx: number) => {
    onChangeCouncilMembers(councilMembers.filter((_, i) => i !== idx));
  };

  const handleMemberChange = (idx: number, field: keyof CouncilMember, val: string) => {
    const copy = [...councilMembers];
    copy[idx] = { ...copy[idx], [field]: val };
    onChangeCouncilMembers(copy);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
          🏛️ 5. Datos del Consejo de Administración
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Registre a los miembros de la mesa directiva y vocales del consejo de administración.
        </Typography>
      </Box>

      {/* Presidente del Consejo */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <GroupsIcon color="primary" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Presidente del Consejo de Administración
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Nombre Completo"
              value={councilPresident.name}
              onChange={(e) => updatePresidentField("name", e.target.value)}
              disabled={disabled}
              placeholder="Nombre y apellido"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Teléfono de Contacto"
              value={councilPresident.phone}
              onChange={(e) => updatePresidentField("phone", e.target.value.replace(/\D/g, ""))}
              slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*" } }}
              disabled={disabled}
              placeholder="3101234567"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="email"
              label="Correo Electrónico"
              value={councilPresident.email}
              onChange={(e) => updatePresidentField("email", e.target.value)}
              disabled={disabled}
              placeholder="presidente@cliente.com"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Unidad / Apto"
              value={councilPresident.unit}
              onChange={(e) => updatePresidentField("unit", e.target.value)}
              disabled={disabled}
              placeholder="Ej: T1-502"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tesorero del Consejo */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <GroupsIcon color="secondary" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Tesorero del Consejo de Administración
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Nombre Completo"
              value={councilTreasurer.name}
              onChange={(e) => updateTreasurerField("name", e.target.value)}
              disabled={disabled}
              placeholder="Nombre y apellido"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Teléfono de Contacto"
              value={councilTreasurer.phone}
              onChange={(e) => updateTreasurerField("phone", e.target.value.replace(/\D/g, ""))}
              slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*" } }}
              disabled={disabled}
              placeholder="3101234567"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              type="email"
              label="Correo Electrónico"
              value={councilTreasurer.email}
              onChange={(e) => updateTreasurerField("email", e.target.value)}
              disabled={disabled}
              placeholder="tesorero@cliente.com"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Unidad / Apto"
              value={councilTreasurer.unit}
              onChange={(e) => updateTreasurerField("unit", e.target.value)}
              disabled={disabled}
              placeholder="Ej: T2-304"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Otros Consejeros / Vocales (Punto 7: Ilimitados) */}
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
              Otros Consejeros / Vocales
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Agregue tantos consejeros y vocales como conformen el consejo de administración.
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddMember}
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
            Agregar Consejero / Vocal
          </Button>
        </Box>

        {councilMembers.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center", bgcolor: "background.default", borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No hay vocales adicionales registrados. Pulse &quot;+ Agregar Consejero / Vocal&quot; para registrar uno nuevo.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {councilMembers.map((member, idx) => (
              <Paper
                key={idx}
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, bgcolor: "background.default" }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`Nombre Consejero #${idx + 1}`}
                      value={member.name}
                      onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                      disabled={disabled}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Teléfono"
                      value={member.phone}
                      onChange={(e) => handleMemberChange(idx, "phone", e.target.value.replace(/\D/g, ""))}
                      slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*" } }}
                      disabled={disabled}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="email"
                      label="Correo"
                      value={member.email}
                      onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                      disabled={disabled}
                    />
                  </Grid>

                  <Grid size={{ xs: 10, sm: 1.5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Unidad"
                      value={member.unit}
                      onChange={(e) => handleMemberChange(idx, "unit", e.target.value)}
                      disabled={disabled}
                    />
                  </Grid>

                  <Grid size={{ xs: 2, sm: 0.5 }} sx={{ textAlign: "center" }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveMember(idx)}
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
  );
}
