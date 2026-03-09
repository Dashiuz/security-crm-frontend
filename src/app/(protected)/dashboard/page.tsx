"use client";

import { Box, Grid, Paper, Typography, Card, CardContent } from "@mui/material";
import { useAuth } from "@/components/AuthContext";

export default function DashboardPage() {
  const { session } = useAuth();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: "bold" }}>
        Bienvenido, {session?.user.firstName} {session?.user.lastName}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Módulo Regulation
              </Typography>
              <Typography variant="h5">0 Empleados</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Módulo Operation
              </Typography>
              <Typography variant="h5">0 Minutas</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Módulo Administrative
              </Typography>
              <Typography variant="h5">0 Recursos</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              bgcolor: "primary.light",
              color: "primary.contrastText",
              borderRadius: 4,
            }}
          >
            <Typography variant="h6">
              Noxia CRM - Central de Operaciones
            </Typography>
            <Typography variant="body1">
              Selecciona un módulo en la barra lateral para comenzar.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
