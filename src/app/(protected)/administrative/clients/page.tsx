"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import { GridColDef } from "@mui/x-data-grid";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";

import DetailDialog from "@/components/common/DetailDialog";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import { formatDateTime } from "@/lib/formatters";
import { Chip } from "@mui/material";
import { RestoreFromTrash as RestoreFromTrashIcon, RemoveCircle as RemoveCircleIcon } from "@mui/icons-material";
import { GridActionsCellItem } from "@mui/x-data-grid";

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
  installedTech: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "true")
    .default(false),
  hasSecurityStudy: z
    .union([z.boolean(), z.string()])
    .transform((val) => String(val) === "true")
    .default(false),
  securityStudyFile: z.any().optional().nullable(),
  securityStudy: z.string().optional().nullable(),
  weaponsAmount: z.coerce.number().min(0).default(0),
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
  { field: "name", headerName: "Nombre", width: 220 },
  { field: "nit", headerName: "NIT", width: 130 },
  { field: "clientStatus", headerName: "Estado Cliente", width: 120 },
  { field: "contractNumber", headerName: "Contrato", width: 140 },
  { field: "sector", headerName: "Sector", width: 130 },
  { field: "city", headerName: "Ciudad", width: 110 },
  { field: "isActive", headerName: "Activo", type: "boolean", width: 90 },
  {
    field: "createdBy",
    headerName: "Creado Por",
    width: 160,
    valueGetter: (value: any) => value || "Sistema",
  },
  {
    field: "createdAt",
    headerName: "Creado En",
    width: 170,
    valueFormatter: (value: any) => (value ? formatDateTime(value) : "N/A"),
  },
];

export default function ClientsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailClient, setDetailClient] = useState<any | null>(null);
  const [deleteClient, setDeleteClient] = useState<any | null>(null);
  const [reactivateClient, setReactivateClient] = useState<any | null>(null);
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
    {
      name: "installedTech",
      label: "Tecnología Instalada",
      type: "select",
      options: [
        { value: "true", label: "Sí" },
        { value: "false", label: "No" },
      ],
    },
    { name: "weaponsAmount", label: "Cantidad de Armas", type: "number" },
    {
      name: "hasSecurityStudy",
      label: "Estudio de Seguridad",
      type: "select",
      options: [
        { value: "true", label: "Sí" },
        { value: "false", label: "No" },
      ],
    },
    {
      name: "securityStudyFile",
      label: "Estudio de Seguridad (Archivo)",
      type: "file",
      hidden: (watchValues) => !Boolean(watchValues.hasSecurityStudy),
    },
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
      hasSecurityStudy: false,
      securityStudyFile: null,
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
      const hasStudy = Boolean(
        data.securityStudy && data.securityStudy.trim() !== "",
      );
      setDefaultValues({
        ...data,
        installedTech: Boolean(data.installedTech),
        hasSecurityStudy: hasStudy,
        securityStudyFile: null,
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

  const handleView = (row: any) => {
    setDetailClient(row);
  };

  const handleDeleteRequest = (id: string) => {
    HttpClient.get<any[]>("/client").then((clients) => {
      const target = clients.find((c) => c.id === id);
      if (target) setDeleteClient(target);
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteClient) return;
    try {
      await HttpClient.delete(`/client/${deleteClient.id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al inhabilitar el cliente");
    }
  };

  const handleConfirmReactivate = async () => {
    if (!reactivateClient) return;
    try {
      await HttpClient.patch(`/client/${reactivateClient.id}/reactivate`, {});
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al reactivar el cliente");
    }
  };

  const customActions = (row: any) => {
    if (!row.isActive || row.deletedAt) {
      return [
        <GridActionsCellItem
          key={`reactivate-${row.id}`}
          icon={<RestoreFromTrashIcon color="success" />}
          label="Reactivar Cliente"
          title="Reactivar"
          showInMenu={false}
          onClick={() => setReactivateClient(row)}
        />,
      ];
    }
    return [];
  };

  const handleSubmit = async (data: ClientForm) => {
    try {
      const { hasSecurityStudy, securityStudyFile, ...rest } = data;

      let securityStudyValue: string | null = null;
      if (hasSecurityStudy) {
        if (securityStudyFile) {
          securityStudyValue =
            typeof securityStudyFile === "string"
              ? securityStudyFile
              : securityStudyFile.name;
        } else if (data.securityStudy) {
          securityStudyValue = data.securityStudy;
        } else {
          securityStudyValue = "SI";
        }
      }

      const payload = {
        ...rest,
        installedTech: Boolean(data.installedTech),
        weaponsAmount: Number(data.weaponsAmount || 0),
        securityStudy: securityStudyValue,
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
        onDelete={handleDeleteRequest}
        onView={handleView}
        customActions={customActions}
        deleteIcon={<RemoveCircleIcon color="error" />}
        refreshTrigger={refreshTrigger}
        infoDescription="Administración de la cartera de clientes de la empresa, incluyendo datos legales, contractuales y de contacto."
        infoInstructions={`Utiliza el 'Crear' para registrar un nuevo cliente con su información de contrato.
        Haz clic en el icono de ojo para consultar los detalles y la auditoría del cliente.
        Para inhabilitar o eliminar un cliente, confirma ingresando su NIT exacto.
        Para reactivar un cliente inhabilitado, presiona el icono de restauración y confirma con su NIT.`}
      />

      <DetailDialog
        open={Boolean(detailClient)}
        onClose={() => setDetailClient(null)}
        title="Detalles del Cliente"
        fields={
          detailClient
            ? [
                { label: "Nombre", value: detailClient.name },
                { label: "NIT", value: detailClient.nit },
                { label: "Código Interno", value: detailClient.internalCode },
                { label: "N° Contrato", value: detailClient.contractNumber },
                { label: "Sector", value: detailClient.sector },
                { label: "Estado Cliente", value: detailClient.clientStatus },
                { label: "Estado Contrato", value: detailClient.contractStatus },
                { label: "Ciudad", value: detailClient.city || "N/A" },
                { label: "Dirección", value: detailClient.address || "N/A" },
                { label: "Administrador", value: detailClient.administrator || "N/A" },
                { label: "Tel. Administrador", value: detailClient.administratorPhone || "N/A" },
                { label: "Tecnología Instalada", value: detailClient.installedTech ? "Sí" : "No" },
                { label: "Cantidad de Armas", value: detailClient.weaponsAmount ?? 0 },
                { label: "Estudio de Seguridad", value: detailClient.securityStudy || "No disponible" },
                {
                  label: "Estado Registro",
                  value: (
                    <Chip
                      label={detailClient.isActive ? "Activo" : "Inactivo"}
                      color={detailClient.isActive ? "success" : "default"}
                      size="small"
                    />
                  ),
                },
                { label: "Creado Por", value: detailClient.createdBy || "Sistema" },
                {
                  label: "Creado En",
                  value: detailClient.createdAt
                    ? formatDateTime(detailClient.createdAt)
                    : "N/A",
                },
              ]
            : []
        }
      />

      <PromptConfirmDialog
        open={Boolean(deleteClient)}
        onClose={() => setDeleteClient(null)}
        onConfirm={handleConfirmDelete}
        title="Inhabilitar / Eliminar Cliente"
        description={`Para confirmar la eliminación del cliente "${deleteClient?.name}", por favor ingrese su NIT exacto:`}
        expectedValue={deleteClient?.nit || ""}
        inputLabel="NIT del Cliente"
        confirmButtonText="Confirmar Eliminación"
        confirmColor="error"
      />

      <PromptConfirmDialog
        open={Boolean(reactivateClient)}
        onClose={() => setReactivateClient(null)}
        onConfirm={handleConfirmReactivate}
        title="Reactivar Cliente"
        description={`Para confirmar la reactivación del cliente "${reactivateClient?.name}", por favor ingrese su NIT exacto:`}
        expectedValue={reactivateClient?.nit || ""}
        inputLabel="NIT del Cliente"
        confirmButtonText="Confirmar Reactivación"
        confirmColor="primary"
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
