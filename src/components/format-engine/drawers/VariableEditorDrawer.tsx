"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  InputLabel,
  Alert,
  Divider,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Code,
  Storage,
  TextFields,
  Delete,
  CheckCircle,
  HelpOutline,
} from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import {
  FormatEngineApi,
  FormatVariable,
  FormatVisibilityScope,
  VariableSourceType,
  SystemFieldCategory,
} from "@/lib/api/format-engine";

export interface VariableEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  variable?: FormatVariable | null;
  systemCatalog?: SystemFieldCategory[];
}

export default function VariableEditorDrawer({
  open,
  onClose,
  onSuccess,
  variable,
  systemCatalog = [],
}: VariableEditorDrawerProps) {
  const [tokenKey, setTokenKey] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [scope, setScope] = useState<FormatVisibilityScope>(
    FormatVisibilityScope.PERSONAL
  );
  const [sourceType, setSourceType] = useState<VariableSourceType>(
    VariableSourceType.STATIC_TEXT
  );
  const [staticValue, setStaticValue] = useState("");
  const [systemPath, setSystemPath] = useState("");
  const [catalog, setCatalog] = useState<SystemFieldCategory[]>(systemCatalog);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (systemCatalog.length === 0) {
      FormatEngineApi.getSystemCatalog()
        .then((data) => setCatalog(data))
        .catch(() => {});
    } else {
      setCatalog(systemCatalog);
    }
  }, [systemCatalog]);

  useEffect(() => {
    if (variable) {
      setTokenKey(variable.key);
      setLabel(variable.label);
      setCategory(variable.category || "GENERAL");
      setScope(variable.scope);
      setSourceType(variable.sourceType);
      setStaticValue(variable.staticValue || "");
      setSystemPath(variable.systemPath || "");
    } else {
      setTokenKey("");
      setLabel("");
      setCategory("GENERAL");
      setScope(FormatVisibilityScope.PERSONAL);
      setSourceType(VariableSourceType.STATIC_TEXT);
      setStaticValue("");
      setSystemPath("");
    }
    setError(null);
  }, [variable, open]);

  const handleKeyChange = (val: string) => {
    // Normalizar clave automáticamente a MAYÚSCULAS_CON_GUION_BAJO
    const normalized = val
      .toUpperCase()
      .replace(/[\s\.\-]+/g, "_")
      .replace(/[^A-Z0-9_]/g, "");
    setTokenKey(normalized);
  };

  const handleSystemFieldSelect = (selectedPath: string) => {
    setSystemPath(selectedPath);
    // Auto-completar etiqueta si está vacía
    for (const cat of catalog) {
      const field = cat.fields.find((f) => f.systemPath === selectedPath);
      if (field) {
        if (!label) setLabel(field.label);
        if (!tokenKey) handleKeyChange(field.token);
        break;
      }
    }
  };

  const handleSubmit = async () => {
    if (!tokenKey.trim()) {
      setError("El nombre de la variable / token es obligatorio.");
      return;
    }
    if (!label.trim()) {
      setError("La etiqueta descriptiva es obligatoria.");
      return;
    }
    if (sourceType === VariableSourceType.STATIC_TEXT && !staticValue.trim()) {
      setError("Debe especificar el valor estático para este token.");
      return;
    }
    if (sourceType === VariableSourceType.DATABASE_SYSTEM && !systemPath) {
      setError("Debe seleccionar un campo del sistema de base de datos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (variable) {
        await FormatEngineApi.updateVariable(variable.id, {
          label: label.trim(),
          category: category.trim(),
          sourceType,
          staticValue:
            sourceType === VariableSourceType.STATIC_TEXT ? staticValue : undefined,
          systemPath:
            sourceType === VariableSourceType.DATABASE_SYSTEM ? systemPath : undefined,
        });
      } else {
        await FormatEngineApi.createVariable({
          key: tokenKey,
          label: label.trim(),
          category: category.trim(),
          scope,
          sourceType,
          staticValue:
            sourceType === VariableSourceType.STATIC_TEXT ? staticValue : undefined,
          systemPath:
            sourceType === VariableSourceType.DATABASE_SYSTEM ? systemPath : undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al guardar la variable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={onClose}
      title={variable ? "Editar Variable / Atajo Dinámico" : "Nueva Variable / Atajo Dinámico"}
      subtitle="Configure un token para reutilizarlo en plantillas universales y tablas"
      headerIcon={<Code sx={{ color: "primary.main" }} />}
      width={{ xs: "100%", sm: 540, md: 680 }}
      customActions={
        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%" }}>
          <Button onClick={onClose} color="inherit" disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={<CheckCircle />}
          >
            {loading ? "Guardando..." : variable ? "Actualizar Variable" : "Guardar Variable"}
          </Button>
        </Box>
      }
    >
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 2 Inputs Uno al lado del otro (Requerimiento Central) */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: "#F8FAFC",
            border: "1px solid #CBD5E1",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 800, color: "#0F172A", mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <TextFields fontSize="small" sx={{ color: "primary.main" }} />
            Definición del Token y Fuente de Datos (Lado a Lado)
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
            {/* Input Izquierdo: Token */}
            <Box sx={{ flex: 1 }}>
              <TextField
                label="Nombre de la Variable / Token"
                fullWidth
                size="small"
                value={tokenKey}
                disabled={Boolean(variable)}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="EJ: MI_TOKEN_1"
                helperText={
                  tokenKey
                    ? `Se usará como: {{${tokenKey}}}`
                    : "Solo mayúsculas y guiones bajos"
                }
                InputProps={{
                  sx: { fontFamily: "monospace", fontWeight: 700, color: "#DC2626" },
                }}
              />
            </Box>

            {/* Input Derecho: Tipo de Fuente */}
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="source-type-label">Tipo de Origen</InputLabel>
                <Select
                  labelId="source-type-label"
                  value={sourceType}
                  label="Tipo de Origen"
                  onChange={(e) => setSourceType(e.target.value as VariableSourceType)}
                >
                  <MenuItem value={VariableSourceType.STATIC_TEXT}>
                    Texto Fijo Personalizado
                  </MenuItem>
                  <MenuItem value={VariableSourceType.DATABASE_SYSTEM}>
                    Mapeo Automático BD Sistema
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>

          {/* Valor según tipo de origen */}
          {sourceType === VariableSourceType.STATIC_TEXT ? (
            <TextField
              label="Valor Estático a Reemplazar"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={staticValue}
              onChange={(e) => setStaticValue(e.target.value)}
              placeholder="Escriba el texto exacto que sustituirá a este token en los documentos..."
              helperText="Este valor se insertará tal cual cada vez que se procese el formato."
            />
          ) : (
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel id="system-path-label">Campo de la Base de Datos</InputLabel>
                <Select
                  labelId="system-path-label"
                  value={systemPath}
                  label="Campo de la Base de Datos"
                  onChange={(e) => handleSystemFieldSelect(e.target.value)}
                >
                  {catalog.map((cat) => [
                    <MenuItem
                      key={cat.id}
                      disabled
                      sx={{
                        fontWeight: 800,
                        color: "primary.main",
                        bgcolor: "#EFF6FF !important",
                        opacity: "1 !important",
                      }}
                    >
                      {cat.name}
                    </MenuItem>,
                    ...cat.fields.map((f) => (
                      <MenuItem key={f.systemPath} value={f.systemPath} sx={{ pl: 3 }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: "100%" }}>
                          <Typography variant="body2">{f.label}</Typography>
                          <Chip
                            size="small"
                            label={`{{${f.token}}}`}
                            sx={{
                              height: 20,
                              fontFamily: "monospace",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                            }}
                          />
                        </Stack>
                      </MenuItem>
                    )),
                  ])}
                </Select>
              </FormControl>
              <Typography variant="caption" sx={{ color: "#64748B", display: "block", mt: 0.5 }}>
                El motor resolverá el valor en tiempo real desde la BD según la entidad seleccionada.
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Metadatos adicionales */}
        <Stack spacing={2}>
          <TextField
            label="Etiqueta Descriptiva"
            fullWidth
            size="small"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ej: Número de Cuenta Bancaria Principal"
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Categoría / Grupo"
              fullWidth
              size="small"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="GENERAL, FINANCIERO, LEGAL..."
            />

            {!variable && (
              <Box sx={{ flex: 1 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                    Ámbito de Visibilidad
                  </FormLabel>
                  <RadioGroup
                    row
                    value={scope}
                    onChange={(e) => setScope(e.target.value as FormatVisibilityScope)}
                  >
                    <FormControlLabel
                      value={FormatVisibilityScope.PERSONAL}
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">Personal (Solo yo)</Typography>}
                    />
                    <FormControlLabel
                      value={FormatVisibilityScope.GLOBAL}
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">Global (Empresa)</Typography>}
                    />
                  </RadioGroup>
                </FormControl>
              </Box>
            )}
          </Stack>
        </Stack>
      </Stack>
    </ResponsiveFormDrawer>
  );
}
