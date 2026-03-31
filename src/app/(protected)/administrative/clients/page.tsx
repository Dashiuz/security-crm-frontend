"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import { GridColDef } from "@mui/x-data-grid";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";

// Enums from backend
const ClientStatus = ["ACTIVE", "INACTIVE"] as const;
const ContractStatus = [
  "ACTIVE",
  "INACTIVE",
  "PENDING",
  "EXPIRED",
  "CANCELLED",
  "SUSPENDED",
  "RENEWED",
  "TERMINATED",
] as const;
const ClientSector = [
  "RESIDENTIAL",
  "COMMERCIAL",
  "INDUSTRIAL",
  "GOVERNMENT",
  "OTHER",
] as const;

const schema = z.object({
  internalCode: z.string().min(1, "El código interno es requerido"),
  clientStatus: z.enum(ClientStatus).default("ACTIVE"),
  contractStatus: z.enum(ContractStatus).default("ACTIVE"),
  contractNumber: z.string().min(1, "El número de contrato es requerido"),
  nit: z.string().min(1, "El NIT es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().optional().nullable(),
  receptionPhone: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  commune: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  quadrant: z.string().optional().nullable(),
  observations: z.string().optional().nullable(),
  sector: z.enum(ClientSector).default("RESIDENTIAL"),
  coordinatorInChargeId: z.string().optional().nullable(),
  commercialContactId: z.string().optional().nullable(),
  installedTech: z.boolean().optional().default(false),
  securityStudy: z.string().optional().nullable(),
  weaponsAmount: z.number().min(0).optional().default(0),
  administrator: z.string().optional().nullable(),
  administratorPhone: z.string().optional().nullable(),
  administratorEmail: z.string().email("Email inválido").optional().nullable(),
  contractDate: z.string().min(1, "La fecha de contrato es requerida"),
  lastContractDate: z
    .string()
    .min(1, "La última fecha de contrato es requerida"),
  isActive: z.boolean().optional().default(true),
});

type ClientForm = z.infer<typeof schema>;

const columns: GridColDef[] = [
  { field: "internalCode", headerName: "Código", width: 100 },
  { field: "name", headerName: "Nombre", width: 250 },
  { field: "nit", headerName: "NIT", width: 130 },
  { field: "clientStatus", headerName: "Estado Cliente", width: 120 },
  { field: "contractNumber", headerName: "Contrato", width: 150 },
  { field: "sector", headerName: "Sector", width: 130 },
  { field: "city", headerName: "Ciudad", width: 120 },
  { field: "isActive", headerName: "Activo", type: "boolean", width: 90 },
];

export default function ClientsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<ClientForm | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showError } = useNotification();

  const [employees, setEmployees] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await HttpClient.get<any[]>("/employee");
        setEmployees(
          data.map((e) => ({
            value: e.id,
            label: `${e.fullName} (${e.positionName || "Sin Cargo"})`,
          })),
        );
      } catch (error) {
        showError("Error al cargar la lista de empleados.");
      }
    };
    fetchEmployees();
  }, []);

  const fields: FormField<ClientForm>[] = [
    { name: "name", label: "Nombre del Cliente", required: true },
    { name: "nit", label: "NIT", required: true },
    { name: "internalCode", label: "Código Interno", required: true },
    {
      name: "sector",
      label: "Sector",
      type: "select",
      options: ClientSector.map((s) => ({ value: s, label: s })),
      required: true,
    },
    {
      name: "clientStatus",
      label: "Estado del Cliente",
      type: "select",
      options: ClientStatus.map((s) => ({ value: s, label: s })),
      required: true,
    },
    { name: "email", label: "Email Principal" },
    { name: "phone", label: "Teléfono Principal" },
    { name: "receptionPhone", label: "Teléfono Recepción" },
    { name: "address", label: "Dirección" },
    { name: "city", label: "Ciudad" },
    { name: "state", label: "Departamento/Estado" },
    { name: "neighborhood", label: "Barrio" },
    { name: "contractNumber", label: "N° de Contrato", required: true },
    {
      name: "contractStatus",
      label: "Estado del Contrato",
      type: "select",
      options: ContractStatus.map((s) => ({ value: s, label: s })),
      required: true,
    },
    {
      name: "contractDate",
      label: "Fecha Contrato",
      type: "date",
      required: true,
    },
    {
      name: "lastContractDate",
      label: "Última Fecha Contrato",
      type: "date",
      required: true,
    },
    {
      name: "coordinatorInChargeId",
      label: "Coordinador a Cargo",
      type: "select",
      options: employees,
    },
    {
      name: "commercialContactId",
      label: "Contacto Comercial",
      type: "select",
      options: employees,
    },
    { name: "administrator", label: "Nombre Administrador" },
    { name: "administratorPhone", label: "Teléfono Administrador" },
    { name: "administratorEmail", label: "Email Administrador" },
    { name: "installedTech", label: "Tecnología Instalada", type: "checkbox" },
    { name: "weaponsAmount", label: "Cantidad de Armas", type: "number" },
    { name: "securityStudy", label: "Estudio de Seguridad" },
    { name: "observations", label: "Observaciones", type: "textarea" },
  ];

  const handleCreate = () => {
    setSelectedId(null);
    setDefaultValues({
      internalCode: "",
      clientStatus: "ACTIVE",
      contractStatus: "ACTIVE",
      contractNumber: "",
      nit: "",
      name: "",
      email: "",
      phone: "",
      receptionPhone: "",
      zipCode: "",
      address: "",
      country: "Colombia",
      city: "",
      state: "",
      commune: "",
      neighborhood: "",
      quadrant: "",
      observations: "",
      sector: "RESIDENTIAL",
      coordinatorInChargeId: "",
      commercialContactId: "",
      installedTech: false,
      securityStudy: "",
      weaponsAmount: 0,
      administrator: "",
      administratorPhone: "",
      administratorEmail: "",
      contractDate: new Date().toISOString().split("T")[0],
      lastContractDate: new Date().toISOString().split("T")[0],
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = async (id: string) => {
    setLoading(true);
    try {
      const data = await HttpClient.get<any>(`/client/${id}`);
      setSelectedId(id);
      setDefaultValues({
        ...data,
        coordinatorInChargeId: data.coordinatorInChargeId || "",
        commercialContactId: data.commercialContactId || "",
      });
      setDialogOpen(true);
    } catch (error) {
      showError("Error al cargar los datos del cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ClientForm) => {
    try {
      const payload = {
        ...data,
        coordinatorInChargeId: data.coordinatorInChargeId || null,
        commercialContactId: data.commercialContactId || null,
      };
      if (selectedId) {
        await HttpClient.patch(`/client/${selectedId}`, payload);
      } else {
        await HttpClient.post("/client", payload);
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al guardar el cliente");
      throw error;
    }
  };

  return (
    <>
      <DataTable
        title="Gestión de Clientes"
        endpoint="/client"
        columns={columns}
        breadcrumbs={[{ label: "Administrativo" }, { label: "Clientes" }]}
        onCreate={handleCreate}
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
        infoDescription="Administración de la cartera de clientes de la empresa, incluyendo datos legales, contractuales y de contacto."
        infoInstructions={`Utiliza el 'Crear' para registrar un nuevo cliente con su información de contrato.
        Puedes asignar coordinadores y comerciales responsables a cada cliente.
        La información de ubicación y tecnología es vital para la operación en campo.`}
      />
      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={selectedId ? "Editar Cliente" : "Crear Cliente"}
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
        loading={loading}
      />
    </>
  );
}
