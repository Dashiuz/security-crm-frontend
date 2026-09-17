"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Autocomplete, TextField, CircularProgress, Box, Typography, Chip } from "@mui/material";
import { Person as PersonIcon } from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";

export interface UserOption {
  id: string;
  fullName: string;
  position?: string;
}

interface UserAutocompleteProps {
  value: UserOption | null;
  onChange: (user: UserOption | null) => void;
  type: "coordinators" | "commercials";
  label?: string;
  placeholder?: string;
  size?: "small" | "medium";
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  error?: boolean;
}

export default function UserAutocomplete({
  value,
  onChange,
  type,
  label = "Usuario",
  placeholder = "Buscar por nombre...",
  size = "small",
  disabled = false,
  required = false,
  helperText,
  error = false,
}: UserAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<UserOption[]>([]);
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
        const data = await HttpClient.get<UserOption[]>(
          `/user/${type}?search=${queryParam}&limit=15`
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
  }, [inputValue, type]);

  const finalOptions = useMemo(() => {
    if (value && !options.some((o) => o.id === value.id)) {
      return [value, ...options];
    }
    return options;
  }, [value, options]);

  return (
    <Autocomplete<UserOption>
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={finalOptions}
      getOptionLabel={(option) => {
        const pos = option.position ? ` (${option.position})` : "";
        return `${option.fullName}${pos}`;
      }}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      loading={loading}
      disabled={disabled}
      noOptionsText={loading ? "Buscando..." : "No se encontraron usuarios"}
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
              <PersonIcon sx={{ color: "primary.main", fontSize: 20 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {option.fullName}
                </Typography>
              </Box>
            </Box>
            {option.position ? (
              <Chip
                size="small"
                label={option.position}
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
