"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Autocomplete,
  TextField,
  CircularProgress,
} from "@mui/material";
import { HttpClient } from "@/lib/api/client";

interface DepartmentItem {
  id: string;
  name: string;
  isActive?: boolean;
}

interface DepartmentAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
  disabled?: boolean;
}

export default function DepartmentAutocomplete({
  value,
  onChange,
  label = "Departamento / Área Responsable",
  placeholder = "Seleccionar o escribir área...",
  size = "small",
  fullWidth = true,
  disabled = false,
}: DepartmentAutocompleteProps) {
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  // Cargar catálogo de departamentos de la empresa
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    HttpClient.get<DepartmentItem[]>("/department")
      .then((data) => {
        if (isMounted) {
          const activeDepts = (data || []).filter((d) => d.isActive !== false);
          setDepartments(activeDepts);
        }
      })
      .catch((err) => {
        console.error("Error cargando departamentos:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sincronizar input cuando cambia la prop value externamente
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Debounce de 500ms al escribir
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, value, onChange]);

  const departmentNames = useMemo(() => {
    return departments.map((d) => d.name);
  }, [departments]);

  return (
    <Autocomplete
      freeSolo
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      options={departmentNames}
      value={value || ""}
      inputValue={inputValue}
      onInputChange={(_, newInputValue, reason) => {
        setInputValue(newInputValue);
        if (reason === "reset" || reason === "clear") {
          onChange(newInputValue);
        }
      }}
      onChange={(_, newValue) => {
        const val = newValue || "";
        setInputValue(val);
        onChange(val);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}

