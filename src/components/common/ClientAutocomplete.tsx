"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Autocomplete, TextField, CircularProgress, Box, Typography } from "@mui/material";
import { Business as BusinessIcon } from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";

export interface ClientOption {
  id: string;
  name: string;
  internalCode?: string;
  nit?: string;
}

interface ClientAutocompleteProps {
  value: ClientOption | null;
  onChange: (client: ClientOption | null) => void;
  label?: string;
  placeholder?: string;
  size?: "small" | "medium";
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  error?: boolean;
  allowAllOption?: boolean;
  allOptionLabel?: string;
}

const ALL_CLIENTS_OPTION: ClientOption = {
  id: "",
  name: "Todos los Clientes / Conjuntos",
};

export default function ClientAutocomplete({
  value,
  onChange,
  label = "Conjunto / Cliente",
  placeholder = "Buscar por nombre, código o NIT...",
  size = "small",
  disabled = false,
  required = false,
  helperText,
  error = false,
  allowAllOption = false,
  allOptionLabel = "Todos los Clientes / Conjuntos",
}: ClientAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const queryParam = encodeURIComponent(searchQuery.trim());
        const data = await HttpClient.get<ClientOption[]>(
          `/client/search/autocomplete?query=${queryParam}&limit=25`
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
  }, [searchQuery]);

  const allOption: ClientOption = useMemo(
    () => ({ id: "", name: allOptionLabel }),
    [allOptionLabel]
  );

  const selectedValue = useMemo(() => {
    if (allowAllOption && (!value || value.id === "")) {
      return allOption;
    }
    return value;
  }, [allowAllOption, value, allOption]);

  const finalOptions: ClientOption[] = useMemo(() => {
    const list: ClientOption[] = allowAllOption ? [allOption, ...options] : [...options];
    if (selectedValue && selectedValue.id && !list.some((o) => o.id === selectedValue.id)) {
      return [selectedValue, ...list];
    }
    return list;
  }, [allowAllOption, allOption, options, selectedValue]);

  return (
    <Autocomplete<ClientOption>
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={selectedValue}
      onChange={(_, newValue) => {
        if (!newValue || newValue.id === "") {
          onChange(null);
        } else {
          onChange(newValue);
        }
      }}
      onInputChange={(_, newInputValue, reason) => {
        if (reason === "input") {
          setSearchQuery(newInputValue);
        } else if (reason === "reset" || reason === "clear") {
          setSearchQuery("");
        }
      }}
      options={finalOptions}
      filterOptions={(opts, state) => {
        const query = state.inputValue.trim().toLowerCase();
        if (!query || (allowAllOption && query === allOptionLabel.toLowerCase())) {
          return opts;
        }
        return opts.filter((option) => {
          if (allowAllOption && option.id === "") {
            return true;
          }
          const name = option.name.toLowerCase();
          const code = (option.internalCode || "").toLowerCase();
          const nit = (option.nit || "").toLowerCase();
          return name.includes(query) || code.includes(query) || nit.includes(query);
        });
      }}
      getOptionLabel={(option) => {
        if (!option.id) return option.name;
        const code = option.internalCode || option.nit;
        return code ? `${option.name} (${code})` : option.name;
      }}
      isOptionEqualToValue={(option, val) => {
        if (!option || !val) return false;
        return option.id === val.id;
      }}
      loading={loading}
      disabled={disabled}
      noOptionsText={loading ? "Buscando..." : "No se encontraron clientes"}
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
        const code = option.internalCode || option.nit;
        const isAll = !option.id;
        return (
          <Box
            key={key || option.id || "all-clients"}
            component="li"
            {...optionProps}
            sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}
          >
            <BusinessIcon sx={{ color: isAll ? "secondary.main" : "primary.main", fontSize: 20 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: isAll ? 700 : 600, color: isAll ? "primary.main" : "text.primary" }}>
                {option.name}
              </Typography>
              {code ? (
                <Typography variant="caption" color="text.secondary">
                  Código/Omega: {code}
                </Typography>
              ) : null}
            </Box>
          </Box>
        );
      }}
    />
  );
}
