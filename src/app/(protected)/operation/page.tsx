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
  { field: "title", headerName: "Título", width: 200 },
  { field: "employee", headerName: "Empleado", width: 150 },
  { field: "date", headerName: "Fecha", width: 150 },
  { field: "type", headerName: "Tipo", width: 120 },
  { field: "status", headerName: "Estado", width: 120 },
];

const rows = [
  {
    id: 1,
    title: "Ronda Perimetral Mañana",
    employee: "Jon Snow",
    date: "2026-02-20",
    type: "Ronda",
    status: "Completado",
  },
  {
    id: 2,
    title: "Incidente Portón Norte",
    employee: "Cersei Lannister",
    date: "2026-02-20",
    type: "Incidente",
    status: "Pendiente",
  },
];

export default function OperationPage() {
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
            <Typography color="text.primary">Operation</Typography>
          </Breadcrumbs>
          <Typography variant="h4" fontWeight="bold">
            Minutas (Operation)
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<RefreshIcon />}>
            Refrescar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            Nueva Minuta
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
