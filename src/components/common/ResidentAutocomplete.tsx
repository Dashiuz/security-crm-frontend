"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Autocomplete, TextField, CircularProgress, Box, Typography } from "@mui/material";
import { Person as PersonIcon } from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";

export interface ResidentOption {
  id: string;
  firstName: string;
  lastName: string;
  document?: string;
  phoneNumber?: string;
  unitId?: string;
  unit?: {
    id: string;
    unitName: string;
    tower?: { id?: string; towerName: string };
  };
}

interface ResidentAutocompleteProps {
  clientId?: string;
  unitId?: string;
  preloadedResidents?: ResidentOption[];
  value: ResidentOption | null;
  onChange: (resident: ResidentOption | null) => void;
  label?: string;
  placeholder?: string;
  size?: "small" | "medium";
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  error?: boolean;
}

const EMPTY_RESIDENTS: ResidentOption[] = [];

export default function ResidentAutocomplete({
  clientId,
  unitId,
  preloadedResidents = EMPTY_RESIDENTS,
  value,
  onChange,
  label = "Residente",
  placeholder = "Buscar nombre, apellido o doc...",
  size = "small",
  disabled = false,
  required = false,
  helperText,
  error = false,
}: ResidentAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ResidentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Si hay residentes precargados y no hay texto buscado, usarlos
    if (!inputValue.trim() && preloadedResidents.length > 0) {
      setOptions(preloadedResidents);
      setLoading(false);
      return;
    }

    if (!clientId) {
      setOptions((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const queryParam = encodeURIComponent(inputValue.trim());
        const unitParam = unitId ? `&unitId=${encodeURIComponent(unitId)}` : "";
        const data = await HttpClient.get<ResidentOption[]>(
          `/resident/autocomplete?clientId=${clientId}&query=${queryParam}${unitParam}&limit=20`
        );
        setOptions(data || []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [clientId, unitId, inputValue, preloadedResidents]);

  const finalOptions = useMemo(() => {
    if (value && !options.some((o) => o.id === value.id)) {
      return [value, ...options];
    }
    return options;
  }, [value, options]);

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      options={finalOptions}
      getOptionLabel={(option) => {
        if (!option) return "";
        const docStr = option.document ? ` (CC: ${option.document})` : "";
        const unitStr = option.unit?.unitName ? ` [${option.unit.unitName}]` : "";
        return `${option.firstName} ${option.lastName}${docStr}${unitStr}`;
      }}
      isOptionEqualToValue={(option, val) => option?.id === val?.id}
      loading={loading}
      disabled={disabled || !clientId}
      size={size}
      noOptionsText={
        clientId
          ? "No se encontraron residentes"
          : "Selecciona un conjunto primero"
      }
      renderOption={(props, option) => {
        const { key, ...restProps } = props as any;
        return (
          <Box
            key={key || option.id}
            component="li"
            {...restProps}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <PersonIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {option.firstName} {option.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.document ? `Doc: ${option.document}` : ""}
                {option.unit?.unitName ? ` • Apto: ${option.unit.unitName}` : ""}
                {option.phoneNumber ? ` • Tel: ${option.phoneNumber}` : ""}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
