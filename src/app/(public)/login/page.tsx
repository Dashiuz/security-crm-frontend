"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const document = formData.get("document") as string;
    const password = formData.get("password") as string;

    try {
      await AuthService.login({ document, password });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="xs">
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            fontWeight="bold"
            color="primary"
          >
            NOXIA
          </Typography>
          <Typography variant="body1" color="text.secondary">
            CRM para Empresas de Seguridad
          </Typography>
        </Box>

        <Card variant="outlined">
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
              Iniciar Sesión
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="document"
                label="Documento de Identidad"
                name="document"
                autoComplete="document"
                autoFocus
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Contraseña"
                type="password"
                id="password"
                autoComplete="current-password"
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Entrar"
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 4 }}
        >
          © {new Date().getFullYear()} Noxia Security. Todos los derechos
          reservados.
        </Typography>
      </Container>
    </Box>
  );
}
