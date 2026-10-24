"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Breadcrumbs,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  DescriptionOutlined,
  PictureAsPdf,
  EditOutlined,
  Send,
  CheckCircleOutline,
  HourglassEmpty,
  TuneOutlined,
  FilterList,
} from "@mui/icons-material";
import Link from "next/link";
import SplitScreenProposalWorkspace from "./components/SplitScreenProposalWorkspace";
import { noxiaPalette } from "@/theme/noxiaTheme";

interface ProposalItem {
  id: string;
  code: string;
  clientName: string;
  clientNit: string;
  date: string;
  totalCop: number;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
  author: string;
}

const MOCK_PROPOSALS: ProposalItem[] = [
  {
    id: "prop-1",
    code: "PROP-2026-0042",
    clientName: "CONJUNTO RESIDENCIAL LOS ALPES P.H.",
    clientNit: "901.442.189-3",
    date: "2026-10-22",
    totalCop: 17270787,
    status: "SENT",
    author: "Director Comercial",
  },
  {
    id: "prop-2",
    code: "PROP-2026-0041",
    clientName: "CENTRO EMPRESARIAL CAPITAL TOWER",
    clientNit: "900.812.339-1",
    date: "2026-10-20",
    totalCop: 34541574,
    status: "ACCEPTED",
    author: "Director Comercial",
  },
  {
    id: "prop-3",
    code: "PROP-2026-0040",
    clientName: "PARQUE INDUSTRIAL METROPOLITANO",
    clientNit: "900.111.456-8",
    date: "2026-10-18",
    totalCop: 51812361,
    status: "DRAFT",
    author: "Ejecutivo de Cuenta",
  },
];

export default function ProposalsPage() {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [proposals, setProposals] = useState<ProposalItem[]>(MOCK_PROPOSALS);

  const filteredProposals = proposals.filter((p) => {
    const matchesSearch =
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusChip = (status: ProposalItem["status"]) => {
    switch (status) {
      case "ACCEPTED":
        return <Chip label="Aceptada (Ganada)" size="small" color="success" sx={{ fontWeight: 700, fontSize: "0.72rem" }} />;
      case "SENT":
        return <Chip label="Enviada al Cliente" size="small" color="primary" sx={{ fontWeight: 700, fontSize: "0.72rem" }} />;
      case "DRAFT":
        return <Chip label="Borrador" size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: "0.72rem" }} />;
      case "REJECTED":
        return <Chip label="Rechazada" size="small" color="error" sx={{ fontWeight: 700, fontSize: "0.72rem" }} />;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 1.5, fontSize: "0.85rem" }}>
        <Typography color="inherit">Dirección Comercial</Typography>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>
          Propuestas y Cotizaciones
        </Typography>
      </Breadcrumbs>

      {/* Hero Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
            Propuestas y Cotizaciones Comerciales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generación automatizada de propuestas económicas con el Motor de Documentos Camaleón y seguimiento del embudo.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Link href="/commercial/settings" style={{ textDecoration: "none" }}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<TuneOutlined />}
              sx={{ borderRadius: 2 }}
            >
              Configurar Identidad y Tarifas
            </Button>
          </Link>

          <Button
            variant="contained"
            size="medium"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setWorkspaceOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 700, px: 2.5 }}
          >
            Nueva Propuesta
          </Button>
        </Stack>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2.5, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                Total Propuestas Emitidas
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.main", my: 0.5 }}>
                {proposals.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Acumulado año fiscal 2026
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2.5, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                Enviadas en Negociación
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#d97706", my: 0.5 }}>
                {proposals.filter((p) => p.status === "SENT").length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pendientes de firma o decisión
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2.5, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                Aceptadas / Ganadas
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "success.main", my: 0.5 }}>
                {proposals.filter((p) => p.status === "ACCEPTED").length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Listas para Orden de Servicio
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2.5, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                Valor Total Pipeline (COP)
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary", my: 0.75 }}>
                $ {proposals.reduce((a, b) => a + b.totalCop, 0).toLocaleString("es-CO")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Monto facturable mensual
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems="center">
          <TextField
            placeholder="Buscar por cliente, consecutivo o NIT..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: "100%", sm: 380 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={1}>
            {["ALL", "SENT", "ACCEPTED", "DRAFT"].map((st) => (
              <Chip
                key={st}
                label={st === "ALL" ? "Todas" : st === "SENT" ? "Enviadas" : st === "ACCEPTED" ? "Aceptadas" : "Borradores"}
                onClick={() => setStatusFilter(st)}
                color={statusFilter === st ? "primary" : "default"}
                variant={statusFilter === st ? "filled" : "outlined"}
                sx={{ fontWeight: 600, fontSize: "0.75rem" }}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* Proposals Data Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: "neutral.50" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Consecutivo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Cliente / Razón Social</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Valor Mensual (COP)</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Elaborado Por</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProposals.map((row) => (
              <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell sx={{ fontWeight: 700, color: "primary.main", fontFamily: "monospace" }}>
                  {row.code}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {row.clientName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    NIT: {row.clientNit}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: "0.85rem" }}>{row.date}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.88rem" }}>
                  $ {row.totalCop.toLocaleString("es-CO")}
                </TableCell>
                <TableCell align="center">{getStatusChip(row.status)}</TableCell>
                <TableCell sx={{ fontSize: "0.82rem", color: "text.secondary" }}>{row.author}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="Abrir en Split-Screen">
                      <IconButton size="small" color="primary" onClick={() => setWorkspaceOpen(true)}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Previsualizar PDF Camaleón">
                      <IconButton size="small" color="default" onClick={() => setWorkspaceOpen(true)}>
                        <PictureAsPdf fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Split-Screen Workspace Modal */}
      <SplitScreenProposalWorkspace
        open={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
      />
    </Box>
  );
}
