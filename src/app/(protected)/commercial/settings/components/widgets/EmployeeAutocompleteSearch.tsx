"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Avatar,
  Stack,
} from "@mui/material";
import { PersonSearchOutlined } from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";

export interface AutocompleteEmployee {
  id: string;
  fullName: string;
  document: string;
  documentType: string;
  email?: string | null;
  phone?: string | null;
  signatureUrl?: string | null;
  departmentRef?: { id: string; name: string } | null;
  positionRef?: { id: string; name: string } | null;
}

interface EmployeeAutocompleteSearchProps {
  label?: string;
  placeholder?: string;
  onSelect: (employee: AutocompleteEmployee | null) => void;
  size?: "small" | "medium";
  disabled?: boolean;
  valueText?: string;
}

export default function EmployeeAutocompleteSearch({
  label = "Buscar Funcionario",
  placeholder = "Escriba nombre o cédula...",
  onSelect,
  size = "small",
  disabled = false,
  valueText = "",
}: EmployeeAutocompleteSearchProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(valueText);
  const [options, setOptions] = useState<AutocompleteEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external text if provided and not typing
  useEffect(() => {
    if (!open && valueText) {
      setInputValue(valueText);
    }
  }, [valueText, open]);

  // Debounced search (500ms)
  useEffect(() => {
    setAuthError(false);
    if (!inputValue || inputValue.trim().length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setAuthError(false);
        // Primary commercial settings endpoint; fallback to employee autocomplete if needed
        let results: AutocompleteEmployee[] = [];
        try {
          results = await HttpClient.get<AutocompleteEmployee[]>(
            `/commercial/settings/employees/search?query=${encodeURIComponent(
              inputValue.trim()
            )}&limit=15`
          );
        } catch (firstErr: any) {
          if (firstErr?.statusCode === 404) {
            results = await HttpClient.get<AutocompleteEmployee[]>(
              `/employee/search/autocomplete?query=${encodeURIComponent(
                inputValue.trim()
              )}&limit=15`
            );
          } else {
            throw firstErr;
          }
        }
        setOptions(Array.isArray(results) ? results : []);
      } catch (err: any) {
        console.error(
          "Error al buscar empleados:",
          err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err))
        );
        if (err?.statusCode === 401 || err?.statusCode === 403) {
          setAuthError(true);
        }
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue]);

  return (
    <Autocomplete
      size={size}
      disabled={disabled}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.fullName || ""
      }
      isOptionEqualToValue={(option, val) => option.id === val.id}
      filterOptions={(x) => x} // Backend handles the filtering
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(_, selectedOption) => {
        if (selectedOption && typeof selectedOption !== "string") {
          onSelect(selectedOption);
        } else {
          onSelect(null);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <PersonSearchOutlined
                  sx={{ color: "text.secondary", mr: 0.5, fontSize: 19 }}
                />
                {params.InputProps.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props as any;
        return (
          <Box
            component="li"
            key={option.id || key}
            {...otherProps}
            sx={{
              p: 1,
              borderBottom: "1px solid rgba(0,0,0,0.04)",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: "0.75rem",
                  bgcolor: "primary.main",
                  fontWeight: 700,
                }}
              >
                {option.fullName.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, fontSize: "0.82rem", lineHeight: 1.2 }}
                  noWrap
                >
                  {option.fullName}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem" }}
                  noWrap
                >
                  {option.documentType} {option.document}
                  {option.positionRef?.name ? ` • ${option.positionRef.name}` : ""}
                  {option.departmentRef?.name ? ` (${option.departmentRef.name})` : ""}
                </Typography>
              </Box>
            </Stack>
          </Box>
        );
      }}
      noOptionsText={
        authError
          ? "Sesión expirada o permisos insuficientes. Por favor recargue la página."
          : inputValue.trim().length < 2
          ? "Escriba al menos 2 caracteres para buscar..."
          : loading
          ? "Buscando en empleados..."
          : "No se encontraron empleados con ese criterio"
      }
    />
  );
}
