"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import { GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { HttpClient } from "@/lib/api/client";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import { formatDateTime } from "@/lib/formatters";
import {
  RemoveCircle as RemoveCircleIcon,
  Handshake as HandshakeIcon,
  TaskAlt as ConvertIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  Typography,
  CircularProgress,
} from "@mui/material";

const columns: GridColDef[] = [
  { field: "internalCode", headerName: "Código", width: 110 },
  { field: "name", headerName: "Nombre / Conjunto", width: 250 },
  { field: "nit", headerName: "NIT", width: 130 },
  { field: "sector", headerName: "Sector", width: 130 },
  { field: "phone", headerName: "Teléfono", width: 130 },
  { field: "email", headerName: "Correo", width: 190 },
  { field: "city", headerName: "Ciudad", width: 110 },
  {
    field: "createdBy",
    headerName: "Creado Por",
    width: 150,
    valueGetter: (value: any) => value || "Sistema",
  },
  {
    field: "createdAt",
    headerName: "Creado En",
    width: 170,
    valueFormatter: (value: any) => (value ? formatDateTime(value) : "N/A"),
  },
];

export default function ProspectsPage() {
  const router = useRouter();
  const [deleteProspect, setDeleteProspect] = useState<any | null>(null);
  const [convertProspect, setConvertProspect] = useState<any | null>(null);
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [converting, setConverting] = useState(false);
  const { showSuccess, showError } = useNotification();

  const [convertForm, setConvertForm] = useState({
    contractNumber: "",
    contractDate: new Date().toISOString().split("T")[0],
    lastContractDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split("T")[0],
    contractEndDate: "",
    renewedContract: false,
    coordinatorInChargeId: "",
    commercialContactId: "",
    administrationType: "INDIVIDUAL",
  });

  useEffect(() => {
    HttpClient.get<any[]>("/employee")
      .then((data) => {
        setEmployees(
          data.map((e) => ({
            value: e.id,
            label: `${e.fullName} (${e.positionName || "Sin Cargo"})`,
          })),
        );
      })
      .catch(() => {});
  }, []);

  const handleCreate = () => {
    router.push("/administrative/prospects/new");
  };

  const handleView = (row: any) => {
    router.push(`/administrative/prospects/${row.id}`);
  };

  const handleDeleteRequest = (id: string) => {
    HttpClient.get<any[]>("/prospect").then((prospects) => {
      const target = prospects.find((p) => p.id === id);
      if (target) setDeleteProspect(target);
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteProspect) return;
    try {
      await HttpClient.delete(`/prospect/${deleteProspect.id}`);
      showSuccess("Prospecto inhabilitado con éxito.");
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al inhabilitar el prospecto.");
    }
  };

  const handleOpenConvert = (row: any) => {
    setConvertProspect(row);
    setConvertForm({
      contractNumber: `CONT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      contractDate: new Date().toISOString().split("T")[0],
      lastContractDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0],
      contractEndDate: "",
      renewedContract: false,
      coordinatorInChargeId: "",
      commercialContactId: "",
      administrationType: "INDIVIDUAL",
    });
  };

  const handleConfirmConvert = async () => {
    if (!convertProspect) return;
    if (!convertForm.contractNumber || !convertForm.contractDate || !convertForm.lastContractDate) {
      showError("Por favor completa los campos de número y fechas de contrato.");
      return;
    }

    setConverting(true);
    try {
      await HttpClient.post(`/prospect/${convertProspect.id}/convert`, convertForm);
      showSuccess(`¡Felicidades! Se ha cerrado el contrato y "${convertProspect.name}" ahora es un Cliente Activo.`);
      setConvertProspect(null);
      router.push("/administrative/clients");
    } catch (err: any) {
      showError(err.message || "Error al convertir el prospecto en cliente.");
    } finally {
      setConverting(false);
    }
  };

  const customActions = (row: any) => {
    return [
      <GridActionsCellItem
        key={`convert-${row.id}`}
        icon={<ConvertIcon color="primary" />}
        label="Cerrar Contrato (Convertir a Cliente)"
        title="Cerrar Contrato"
        showInMenu={false}
        onClick={() => handleOpenConvert(row)}
      />,
    ];
  };

  return (
    <>
      <DataTable
        title="Gestión de Prospectos de Clientes"
        endpoint="/prospect"
        columns={columns}
        breadcrumbs={[{ label: "Mis Clientes" }, { label: "Prospectos" }]}
        onCreate={handleCreate}
        onView={handleView}
        onDelete={handleDeleteRequest}
        customActions={customActions}
        deleteIcon={<RemoveCircleIcon color="error" />}
        refreshTrigger={refreshTrigger}
        infoDescription="Control de cartera de prospectos comerciales y cotizaciones previas a la firma de contrato."
        infoInstructions={`Haz clic en 'Crear Nuevo' para iniciar el registro guiado (Ubicación y Estructura).
        Haz clic en el icono del visto bueno para 'Cerrar Contrato' y formalizar al prospecto como Cliente Activo.
        Haz clic en el ojo para ver los detalles del prospecto.`}
      />

      {/* Invalidate Dialog */}
      <PromptConfirmDialog
        open={Boolean(deleteProspect)}
        onClose={() => setDeleteProspect(null)}
        onConfirm={handleConfirmDelete}
        title="Inhabilitar Prospecto"
        description={`Para confirmar la eliminación del prospecto "${deleteProspect?.name}", por favor ingrese su NIT exacto:`}
        expectedValue={deleteProspect?.nit || ""}
        inputLabel="NIT del Prospecto"
        confirmButtonText="Confirmar Eliminación"
        confirmColor="error"
      />

      {/* Convert to Client Dialog */}
      <Dialog
        open={Boolean(convertProspect)}
        onClose={() => !converting && setConvertProspect(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Cerrar Contrato y Formalizar Cliente: {convertProspect?.name}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Al formalizar este prospecto, se convertirá en un <strong>Cliente Activo</strong> dentro de la plataforma y estará disponible para asignación operativa de guardias y residentes.
          </Typography>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Número de Contrato *"
                value={convertForm.contractNumber}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, contractNumber: e.target.value })
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Tipo de Contrato"
                value={convertForm.renewedContract ? "RENEWED" : "NEW"}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    renewedContract: e.target.value === "RENEWED",
                  })
                }
              >
                <MenuItem value="NEW">Contrato Nuevo</MenuItem>
                <MenuItem value="RENEWED">Contrato Renovado</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha Inicial del Contrato *"
                InputLabelProps={{ shrink: true }}
                value={convertForm.contractDate}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, contractDate: e.target.value })
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha Final del Contrato *"
                InputLabelProps={{ shrink: true }}
                value={convertForm.lastContractDate}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, lastContractDate: e.target.value })
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Coordinador a Cargo"
                value={convertForm.coordinatorInChargeId}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    coordinatorInChargeId: e.target.value,
                  })
                }
              >
                <MenuItem value="">-- Sin Asignar --</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.value} value={emp.value}>
                    {emp.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Contacto Comercial Asignado"
                value={convertForm.commercialContactId}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    commercialContactId: e.target.value,
                  })
                }
              >
                <MenuItem value="">-- Sin Asignar --</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.value} value={emp.value}>
                    {emp.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Tipo de Administración"
                value={convertForm.administrationType}
                onChange={(e) =>
                  setConvertForm({
                    ...convertForm,
                    administrationType: e.target.value,
                  })
                }
              >
                <MenuItem value="INDIVIDUAL">Administración Individual</MenuItem>
                <MenuItem value="ENTERPRISE">Empresa de Administración</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setConvertProspect(null)} color="inherit" disabled={converting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmConvert}
            disabled={converting}
            startIcon={converting ? <CircularProgress size={20} color="inherit" /> : <HandshakeIcon />}
            sx={{ borderRadius: 2 }}
          >
            {converting ? "Formalizando..." : "Confirmar y Cerrar Contrato"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
