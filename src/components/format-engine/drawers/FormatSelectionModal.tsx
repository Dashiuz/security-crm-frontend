"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  InputAdornment,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Search,
  Description,
  AddCircleOutline,
  CheckCircle,
  FolderOpen,
} from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import {
  FormatEngineApi,
  UniversalDocumentFormat,
  FormatCategory,
} from "@/lib/api/format-engine";

export interface FormatSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelectFormat: (format: UniversalDocumentFormat | null) => void;
  category?: FormatCategory;
  title?: string;
}

export default function FormatSelectionModal({
  open,
  onClose,
  onSelectFormat,
  category,
  title = "Seleccionar Formato o Plantilla Base",
}: FormatSelectionModalProps) {
  const [formats, setFormats] = useState<UniversalDocumentFormat[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadFormats();
    }
  }, [open, category]);

  const loadFormats = async () => {
    setLoading(true);
    try {
      const data = await FormatEngineApi.getFormats({
        category,
        search: search.trim() || undefined,
      });
      setFormats(data);
    } catch {
      setFormats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
  };

  const handleSelectBlank = () => {
    onSelectFormat(null);
    onClose();
  };

  const handleConfirmSelection = () => {
    const chosen = formats.find((f) => f.id === selectedId);
    if (chosen) {
      onSelectFormat(chosen);
    }
    onClose();
  };

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Elija una plantilla institucional existente o comience con un documento en blanco"
      headerIcon={<FolderOpen sx={{ color: "primary.main" }} />}
      width={{ xs: "100%", sm: 580, md: 740 }}
      customActions={
        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "space-between", width: "100%" }}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<AddCircleOutline />}
            onClick={handleSelectBlank}
          >
            Iniciar en Blanco
          </Button>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button onClick={onClose} color="inherit">
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={!selectedId}
              onClick={handleConfirmSelection}
              startIcon={<CheckCircle />}
            >
              Usar Formato Seleccionado
            </Button>
          </Box>
        </Box>
      }
    >
      <Stack spacing={2.5}>
        <TextField
          placeholder="Buscar formatos por código, título o descripción..."
          size="small"
          fullWidth
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") loadFormats();
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={32} />
          </Box>
        ) : formats.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: "center",
              bgcolor: "#F8FAFC",
              borderRadius: 2,
              border: "1px dashed #CBD5E1",
            }}
          >
            <Description sx={{ fontSize: 44, color: "#94A3B8", mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#334155" }}>
              No se encontraron formatos disponibles
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mb: 2 }}>
              Puede redactar el documento desde cero o crear una nueva plantilla universal.
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={handleSelectBlank}
              startIcon={<AddCircleOutline />}
            >
              Comenzar en Blanco
            </Button>
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {formats.map((fmt) => {
              const isSelected = fmt.id === selectedId;
              return (
                <Grid size={{ xs: 12, sm: 6 }} key={fmt.id}>

                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      borderColor: isSelected ? "primary.main" : "#E2E8F0",
                      bgcolor: isSelected ? "primary.soft" : "#FFFFFF",
                      borderWidth: isSelected ? 2 : 1,
                      transition: "all 0.15s ease-in-out",
                      "&:hover": {
                        borderColor: "primary.main",
                        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)",
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => setSelectedId(fmt.id)}
                      sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start" }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: "100%", mb: 1 }}>
                        <Chip
                          label={fmt.code}
                          size="small"
                          sx={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            bgcolor: isSelected ? "primary.main" : "#F1F5F9",
                            color: isSelected ? "#FFFFFF" : "#334155",
                          }}
                        />
                        <Chip
                          label={fmt.scope === "GLOBAL" ? "Global" : "Personal"}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.68rem", height: 20 }}
                        />
                      </Stack>

                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}>
                        {fmt.title}
                      </Typography>

                      {fmt.description && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748B",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            mb: 1,
                          }}
                        >
                          {fmt.description}
                        </Typography>
                      )}

                      <Box sx={{ mt: "auto", pt: 1, width: "100%", borderTop: "1px dashed #E2E8F0" }}>
                        <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                          {fmt.detectedVariables?.length || 0} variables detectadas
                        </Typography>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Stack>
    </ResponsiveFormDrawer>
  );
}
