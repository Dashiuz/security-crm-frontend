"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Autocomplete, TextField, CircularProgress, Box, Typography } from "@mui/material";
import { HomeWork as HomeWorkIcon } from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";

export interface UnitOption {
  id: string;
  unitName: string;
  unitType?: string;
  tower?: { id?: string; towerName: string };
  floor?: { id?: string; floorNumber: number };
  residents?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    document?: string;
    phoneNumber?: string;
    residentType?: string;
  }>;
}

interface UnitAutocompleteProps {
  clientId?: string;
  value: UnitOption | null;
  onChange: (unit: UnitOption | null) => void;
  label?: string;
  placeholder?: string;
  size?: "small" | "medium";
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  error?: boolean;
}

export default function UnitAutocomplete({
  clientId,
  value,
  onChange,
  label = "Unidad / Apartamento",
  placeholder = "Buscar ej: Torre 1, 101, Apto...",
  size = "small",
  disabled = false,
  required = false,
  helperText,
  error = false,
}: UnitAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!clientId) {
      setOptions([]);
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const queryParam = encodeURIComponent(inputValue.trim());
        const data = await HttpClient.get<UnitOption[]>(
          `/client/${clientId}/units/autocomplete?query=${queryParam}&limit=20`
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
  }, [clientId, inputValue]);

  // Si hay un valor seleccionado que no esté en options, incluirlo para que no se pierda el label
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
        const towerStr = option.tower?.towerName ? ` (Torre ${option.tower.towerName})` : "";
        return `${option.unitName}${towerStr}`;
      }}
      isOptionEqualToValue={(option, val) => option?.id === val?.id}
      loading={loading}
      disabled={disabled || !clientId}
      size={size}
      noOptionsText={clientId ? "No se encontraron unidades" : "Selecciona un conjunto primero"}
      renderOption={(props, option) => {
        const { key, ...restProps } = props as any;
        return (
          <Box key={key || option.id} component="li" {...restProps} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HomeWorkIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {option.unitName}
              </Typography>
              {option.tower?.towerName && (
                <Typography variant="caption" color="text.secondary">
                  Torre {option.tower.towerName}
                  {option.floor?.floorNumber !== undefined ? ` • Piso ${option.floor.floorNumber}` : ""}
                </Typography>
              )}
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
