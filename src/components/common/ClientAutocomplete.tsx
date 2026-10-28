"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Autocomplete, TextField, CircularProgress, Box, Typography, Chip, Popper } from "@mui/material";
import { Business as BusinessIcon, Star as StarIcon } from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";

export interface ClientOption {
  id: string;
  name: string;
  internalCode?: string;
  nit?: string;
  clientStatus?: string;
  isProspect?: boolean;
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
  includeProspects?: boolean;
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
  includeProspects = false,
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
        const prospectParam = includeProspects ? "&includeProspects=true" : "";
        const data = await HttpClient.get<ClientOption[]>(
          `/client/search/autocomplete?query=${queryParam}&limit=25${prospectParam}`
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
  }, [searchQuery, includeProspects]);

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
      filterOptions={(opts) => opts}
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
      PopperComponent={(props) => (
        <Popper
          {...props}
          style={{ ...props.style, zIndex: 99999 }}
          sx={{ zIndex: 99999 }}
        />
      )}
      slotProps={{
        popper: {
          style: { zIndex: 99999 },
          sx: { zIndex: 99999 },
        },
      }}
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
        const isProspect = option.clientStatus === "PROSPECT";
        return (
          <Box
            key={key || option.id || "all-clients"}
            component="li"
            {...optionProps}
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, gap: 1.5 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
              <BusinessIcon sx={{ color: isAll ? "secondary.main" : isProspect ? "warning.main" : "primary.main", fontSize: 20, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: isAll ? 700 : 600, color: isAll ? "primary.main" : "text.primary" }} noWrap>
                  {option.name}
                </Typography>
                {code ? (
                  <Typography variant="caption" color="text.secondary">
                    Código/Omega: {code}
                  </Typography>
                ) : null}
              </Box>
            </Box>
            {!isAll && (
              <Box sx={{ flexShrink: 0, ml: 1 }}>
                {isProspect ? (
                  <Chip
                    size="small"
                    icon={<StarIcon sx={{ fontSize: "13px !important" }} />}
                    label="Prospecto"
                    color="warning"
                    variant="outlined"
                    sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
                  />
                ) : (
                  <Chip
                    size="small"
                    label="Cliente Activo"
                    color="success"
                    variant="outlined"
                    sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }}
                  />
                )}
              </Box>
            )}
          </Box>
        );
      }}
    />
  );
}
