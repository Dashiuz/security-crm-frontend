"use client";

import {
  Box,
  Typography,
  Button,
  Stack,
  Breadcrumbs,
  Link,
  Paper,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Add as AddIcon, Refresh as RefreshIcon } from "@mui/icons-material";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "name", headerName: "Recurso", width: 200 },
  { field: "category", headerName: "Categoría", width: 150 },
  { field: "assignedTo", headerName: "Asignado a", width: 150 },
  { field: "lastAudit", headerName: "Última Auditoría", width: 150 },
  { field: "condition", headerName: "Condición", width: 120 },
];

const rows = [
  {
    id: 1,
    name: "Vehículo Patrulla 01",
    category: "Vehículo",
    assignedTo: "Unidad Delta",
    lastAudit: "2026-01-15",
    condition: "Excelente",
  },
  {
    id: 2,
    name: "Radio Comunicador R2",
    category: "Equipo",
    assignedTo: "Jon Snow",
    lastAudit: "2026-02-10",
    condition: "Bueno",
  },
];

export default function AdministrativePage() {
  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
            <Link underline="hover" color="inherit" href="/dashboard">
              Dashboard
            </Link>
            <Typography color="text.primary">Administrative</Typography>
          </Breadcrumbs>
          <Typography variant="h4" fontWeight="bold">
            Recursos (Administrative)
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<RefreshIcon />}>
            Refrescar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            Nuevo Recurso
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ height: 400, width: "100%", p: 2 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 5 },
            },
          }}
          pageSizeOptions={[5, 10]}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
}
