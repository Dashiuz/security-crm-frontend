"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardActionArea,
  Chip,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  Skeleton,
  useTheme,
} from "@mui/material";
import {
  SaveRounded as SaveIcon,
  ExtensionRounded as ExtensionIcon,
  CheckCircleRounded as CheckCircleIcon,
  RadioButtonUncheckedRounded as UncheckedIcon,
  SearchRounded as SearchIcon,
} from "@mui/icons-material";
import { useTenantDetail } from "../TenantContext";

export default function TenantModulesPage() {
  const {
    featuresList,
    selectedFeatures,
    savingSection,
    handleToggleFeature,
    handleSaveFeatures,
    loading,
  } = useTenantDetail();
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFeatures = featuresList.filter((feat) => {
    const term = searchTerm.toLowerCase();
    return (
      feat.name.toLowerCase().includes(term) ||
      feat.key.toLowerCase().includes(term) ||
      (feat.description && feat.description.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Skeleton variant="rounded" height={80} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Title & Sync Action */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Módulos y Funcionalidades
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Habilite o restrinja los módulos disponibles en el entorno operativo de esta empresa.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={
            savingSection === "features" ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SaveIcon />
            )
          }
          onClick={handleSaveFeatures}
          disabled={savingSection === "features"}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            whiteSpace: "nowrap",
          }}
        >
          Sincronizar Módulos ({selectedFeatures.length})
        </Button>
      </Box>

      {/* Filter / Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar módulos por nombre, clave o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: { xs: "100%", sm: 380 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Chip
            icon={<ExtensionIcon />}
            label={`${selectedFeatures.length} de ${featuresList.length} activados`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </Paper>

      {/* Grid of features */}
      <Grid container spacing={2}>
        {filteredFeatures.map((feat) => {
          const isSelected = selectedFeatures.includes(feat.key);
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feat.key}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2.5,
                  borderColor: isSelected ? "primary.main" : theme.palette.divider,
                  bgcolor: isSelected
                    ? theme.palette.mode === "dark"
                      ? "rgba(25, 118, 210, 0.12)"
                      : "rgba(26, 35, 126, 0.04)"
                    : "background.paper",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                    borderColor: isSelected
                      ? "primary.main"
                      : "text.secondary",
                  },
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardActionArea
                  onClick={() => handleToggleFeature(feat.key)}
                  sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start" }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    {isSelected ? (
                      <CheckCircleIcon color="primary" sx={{ mt: 0.2, fontSize: 22 }} />
                    ) : (
                      <UncheckedIcon color="disabled" sx={{ mt: 0.2, fontSize: 22 }} />
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: "0.95rem" }}>
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
                          fontSize: "0.78rem",
                          minHeight: 34,
                        }}
                      >
                        {feat.description || "Sin descripción específica"}
                      </Typography>
                      <Chip
                        label={feat.key}
                        size="small"
                        sx={{
                          mt: 1.5,
                          height: 22,
                          fontSize: "0.72rem",
                          fontWeight: 600,
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
  );
}
