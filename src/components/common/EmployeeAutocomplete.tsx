"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Autocomplete, TextField, CircularProgress, Box, Typography, Chip } from "@mui/material";
import { Badge as BadgeIcon } from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";

export interface EmployeeOption {
  id: string;
  fullName: string;
  document?: string;
  documentType?: string;
  departmentRef?: { id: string; name: string };
  positionRef?: { id: string; name: string };
}

interface EmployeeAutocompleteProps {
  value: EmployeeOption | null;
  onChange: (employee: EmployeeOption | null) => void;
  label?: string;
  placeholder?: string;
  size?: "small" | "medium";
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  error?: boolean;
}

export default function EmployeeAutocomplete({
  value,
  onChange,
  label = "Empleado del Tenant",
  placeholder = "Buscar por nombre o cédula...",
  size = "small",
  disabled = false,
  required = false,
  helperText,
  error = false,
}: EmployeeAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const queryParam = encodeURIComponent(inputValue.trim());
        const data = await HttpClient.get<EmployeeOption[]>(
          `/employee/search/autocomplete?query=${queryParam}&limit=25`
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
  }, [inputValue]);

  const finalOptions = useMemo(() => {
    if (value && !options.some((o) => o.id === value.id)) {
      return [value, ...options];
    }
    return options;
  }, [value, options]);

  return (
    <Autocomplete<EmployeeOption>
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={finalOptions}
      getOptionLabel={(option) => {
        const doc = option.document ? ` - Doc: ${option.document}` : "";
        const pos = option.positionRef?.name ? ` (${option.positionRef.name})` : "";
        return `${option.fullName}${doc}${pos}`;
      }}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      loading={loading}
      disabled={disabled}
      noOptionsText={loading ? "Buscando..." : "No se encontraron empleados activos"}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size={size}
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props as any;
        return (
          <Box
            key={key || option.id}
            component="li"
            {...optionProps}
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, gap: 1 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <BadgeIcon sx={{ color: "primary.main", fontSize: 20 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {option.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.documentType || "CC"}: {option.document || "—"}
                </Typography>
              </Box>
            </Box>
            {option.positionRef?.name ? (
              <Chip
                size="small"
                label={option.positionRef.name}
                variant="outlined"
                color="secondary"
                sx={{ fontSize: "0.7rem", height: 22 }}
              />
            ) : null}
          </Box>
        );
      }}
    />
  );
}
