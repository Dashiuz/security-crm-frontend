"use client";

import { useState, useEffect, useRef } from "react";
import {
  Paper,
  Box,
  TextField,
  Button,
  Grid,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterAltOutlined as FilterIcon,
  RestartAlt as ResetIcon,
} from "@mui/icons-material";
import UnitAutocomplete, { UnitOption } from "./UnitAutocomplete";
import ResidentAutocomplete, { ResidentOption } from "./ResidentAutocomplete";

export interface MinutaFilterValues {
  startDate?: string;
  endDate?: string;
  search?: string;
  unitId?: string;
  residentId?: string;
}

interface MinutaFilterBarProps {
  clientId?: string;
  onFilterChange: (filters: MinutaFilterValues) => void;
  searchPlaceholder?: string;
  showTextSearch?: boolean;
  showUnitFilter?: boolean;
  showResidentFilter?: boolean;
}

export default function MinutaFilterBar({
  clientId,
  onFilterChange,
  searchPlaceholder = "Buscar en novedades...",
  showTextSearch = true,
  showUnitFilter = true,
  showResidentFilter = true,
}: MinutaFilterBarProps) {
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<UnitOption | null>(null);
  const [selectedResident, setSelectedResident] = useState<ResidentOption | null>(null);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      onFilterChange({
        search: searchText.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        unitId: selectedUnit?.id || undefined,
        residentId: selectedResident?.id || undefined,
      });
    }, 400);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchText, startDate, endDate, selectedUnit, selectedResident, onFilterChange]);

  const handleReset = () => {
    setSearchText("");
    setStartDate("");
    setEndDate("");
    setSelectedUnit(null);
    setSelectedResident(null);
    onFilterChange({});
  };

  const hasActiveFilters =
    Boolean(searchText.trim()) ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    Boolean(selectedUnit) ||
    Boolean(selectedResident);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: 2.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Grid container spacing={1.5} alignItems="center">
        {showTextSearch && (
          <Grid size={{ xs: 12, md: 3.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={searchPlaceholder}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: searchText ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchText("")}>
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Grid>
        )}

        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Desde"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Hasta"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {showUnitFilter && (
          <Grid size={{ xs: 12, sm: 6, md: 2.2 }}>
            <UnitAutocomplete
              clientId={clientId}
              value={selectedUnit}
              onChange={(unit) => {
                setSelectedUnit(unit);
                if (unit && unit.residents && unit.residents.length > 0) {
                  // Si no hay residente seleccionado, dejamos las opciones listas
                }
              }}
              label="Filtrar por Unidad"
              placeholder="Buscar unidad..."
            />
          </Grid>
        )}

        {showResidentFilter && (
          <Grid size={{ xs: 12, sm: 6, md: 2.3 }}>
            <ResidentAutocomplete
              clientId={clientId}
              unitId={selectedUnit?.id}
              preloadedResidents={selectedUnit?.residents as any}
              value={selectedResident}
              onChange={(resident) => {
                setSelectedResident(resident);
                if (resident?.unit && !selectedUnit) {
                  setSelectedUnit(resident.unit as any);
                }
              }}
              label="Filtrar por Residente"
              placeholder="Buscar residente..."
            />
          </Grid>
        )}

        <Grid size="auto">
          {hasActiveFilters && (
            <Tooltip title="Limpiar todos los filtros">
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={handleReset}
                startIcon={<ResetIcon sx={{ fontSize: 18 }} />}
                sx={{ height: 40, textTransform: "none", fontWeight: 600 }}
              >
                Limpiar
              </Button>
            </Tooltip>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
