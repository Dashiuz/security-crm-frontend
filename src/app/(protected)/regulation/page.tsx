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
  { field: "firstName", headerName: "Nombre", width: 150 },
  { field: "lastName", headerName: "Apellido", width: 150 },
  { field: "email", headerName: "Email", width: 200 },
  { field: "position", headerName: "Puesto", width: 150 },
  { field: "status", headerName: "Estado", width: 120 },
];

const rows = [
  {
    id: 1,
    lastName: "Snow",
    firstName: "Jon",
    email: "jon@noxia.com",
    position: "Guardia",
    status: "Activo",
  },
  {
    id: 2,
    lastName: "Lannister",
    firstName: "Cersei",
    email: "cersei@noxia.com",
    position: "Supervisor",
    status: "Activo",
  },
  {
    id: 3,
    lastName: "Lannister",
    firstName: "Jaime",
    email: "jaime@noxia.com",
    position: "Guardia",
    status: "Inactivo",
  },
];

export default function RegulationPage() {
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
            <Typography color="text.primary">Regulation</Typography>
          </Breadcrumbs>
          <Typography variant="h4" fontWeight="bold">
            Empleados (Regulation)
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<RefreshIcon />}>
            Refrescar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            Nuevo Empleado
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
