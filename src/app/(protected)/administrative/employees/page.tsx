"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import DetailDialog from "@/components/common/DetailDialog";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import { GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import {
  PersonOff as PersonOffIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { Chip } from "@mui/material";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";

const schema = z.object({
  firstName: z.string().min(1, "El primer nombre es requerido").max(100),
  secondName: z.string().max(100).optional().nullable(),
  lastName: z.string().min(1, "El apellido es requerido").max(100),
  maternalSurname: z.string().max(100).optional().nullable(),
  documentType: z.string().min(1, "El tipo de documento es requerido"),
  document: z.string().min(1, "El documento es requerido"),
  birthdate: z.string().min(1, "La fecha de nacimiento es requerida"),
  gender: z.string().min(1, "El género es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  clientId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().optional().nullable(),
  entryDate: z.string().min(1, "La fecha de ingreso es requerida"),
  isActive: z.boolean().optional().default(true),
});

type EmployeeForm = z.infer<typeof schema>;

const columns: GridColDef[] = [
  {
    field: "fullName",
    headerName: "Nombre Completo",
    width: 230,
  },
  { field: "document", headerName: "Documento", width: 120 },
  {
    field: "clientName",
    headerName: "Cliente / Conjunto",
    width: 200,
    valueGetter: (value: any) => value || "Sin asignar",
  },
  { field: "email", headerName: "Email", width: 170 },
  { field: "phone", headerName: "Teléfono", width: 110 },
  {
    field: "departmentName",
    headerName: "Departamento",
    width: 140,
    valueGetter: (value: any) => value || "N/A",
  },
  {
    field: "positionName",
    headerName: "Cargo",
    width: 140,
    valueGetter: (value: any) => value || "N/A",
  },
  { field: "isActive", headerName: "Activo", type: "boolean", width: 80 },
];

export default function EmployeesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<
    EmployeeForm | undefined
  >();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showError } = useNotification();
  const [detailEmployee, setDetailEmployee] = useState<any | null>(null);
  const [retireEmployeeData, setRetireEmployeeData] = useState<any | null>(null);
  const [reactivateEmployeeData, setReactivateEmployeeData] = useState<any | null>(null);

  const [clients, setClients] = useState<{ value: string; label: string }[]>([]);
  const [departments, setDepartments] = useState<
    { value: string; label: string }[]
  >([]);
  const [positions, setPositions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    const fetchRelations = async () => {
      try {
        const [cls, depts, posts] = await Promise.all([
          HttpClient.get<any[]>("/client"),
          HttpClient.get<any[]>("/department"),
          HttpClient.get<any[]>("/position"),
        ]);

        const sortedCls = [...(cls || [])].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        const sortedDepts = [...depts].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        const sortedPosts = [...posts].sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        setClients(
          sortedCls.map((c) => ({ value: c.id, label: `${c.name} (${c.internalCode})` })),
        );
        setDepartments(
          sortedDepts.map((d) => ({ value: d.id, label: d.name })),
        );
        setPositions(sortedPosts.map((p) => ({ value: p.id, label: p.name })));
      } catch (error: any) {
        console.error("Error fetching relationships details:", error);
        showError("No se pudieron cargar los datos relacionales.");
      }
    };
    fetchRelations();
  }, []);

  const fields: FormField<EmployeeForm>[] = [
    { name: "firstName", label: "Primer Nombre", required: true },
    { name: "secondName", label: "Segundo Nombre" },
    { name: "lastName", label: "Primer Apellido", required: true },
    { name: "maternalSurname", label: "Segundo Apellido" },
    {
      name: "documentType",
      label: "Tipo Documento",
      type: "select",
      options: [
        { value: "CC", label: "Cédula de Ciudadanía" },
        { value: "CE", label: "Cédula de Extranjería" },
        { value: "PAS", label: "Pasaporte" },
      ],
      required: true,
    },
    { name: "document", label: "Número Documento", required: true },
    {
      name: "birthdate",
      label: "Fecha Nacimiento",
      type: "date",
      required: true,
    },
    {
      name: "gender",
      label: "Género",
      type: "select",
      options: [
        { value: "M", label: "Masculino" },
        { value: "F", label: "Femenino" },
        { value: "O", label: "Otro" },
      ],
      required: true,
    },
    { name: "address", label: "Dirección", required: true },
    {
      name: "clientId",
      label: "Cliente / Conjunto Residencial",
      type: "select",
      options: clients,
    },
    {
      name: "departmentId",
      label: "Departamento",
      type: "select",
      options: departments,
    },
    { name: "positionId", label: "Cargo", type: "select", options: positions },
    { name: "email", label: "Email" },
    { name: "phone", label: "Teléfono" },
    { name: "entryDate", label: "Fecha Ingreso", type: "date", required: true },
  ];

  const handleCreate = () => {
    setSelectedId(null);
    setDefaultValues({
      firstName: "",
      secondName: "",
      lastName: "",
      maternalSurname: "",
      documentType: "CC",
      document: "",
      birthdate: "",
      gender: "M",
      address: "",
      departmentId: "",
      positionId: "",
      email: "",
      phone: "",
      entryDate: new Date().toISOString().split("T")[0],
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = async (id: string, row?: any) => {
    setLoading(true);
    try {
      const data = await HttpClient.get<any>(`/employee/any/${id}`);
      setSelectedId(id);
      setDefaultValues({
        ...data,
        birthdate: data.birthdate?.split("T")[0],
        entryDate: data.entryDate?.split("T")[0],
      });
      setDialogOpen(true);
    } catch (error) {
      showError("Error al cargar los datos del empleado");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (row: any) => {
    setDetailEmployee(row);
  };

  const handleRetireConfirm = async () => {
    if (!retireEmployeeData) return;
    try {
      await HttpClient.patch(`/employee/${retireEmployeeData.id}/retire`, {});
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al dar de baja al empleado");
    }
  };

  const handleReactivateConfirm = async () => {
    if (!reactivateEmployeeData) return;
    try {
      await HttpClient.patch(`/employee/${reactivateEmployeeData.id}/reactivate`, {});
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al reactivar al empleado");
    }
  };

  const customActions = (row: any) => {
    if (row.isRetired || !row.isActive) {
      return [
        <GridActionsCellItem
          key={`reactivate-${row.id}`}
          icon={<PersonAddIcon color="success" />}
          label="Reactivar Empleado"
          title="Reactivar"
          showInMenu={false}
          onClick={() => setReactivateEmployeeData(row)}
        />,
      ];
    }
    return [
      <GridActionsCellItem
        key={`retire-${row.id}`}
        icon={<PersonOffIcon color="warning" />}
        label="Dar de Baja"
        title="Dar de Baja"
        showInMenu={false}
        onClick={() => setRetireEmployeeData(row)}
      />,
    ];
  };

  const handleSubmit = async (data: EmployeeForm) => {
    try {
      if (selectedId) {
        await HttpClient.patch(`/employee/${selectedId}`, data);
      } else {
        await HttpClient.post("/employee", data);
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al guardar el empleado");
      throw error;
    }
  };

  return (
    <>
      <DataTable
        title="Gestión de Empleados"
        endpoint="/employee"
        columns={columns}
        breadcrumbs={[{ label: "Administrativo" }, { label: "Empleados" }]}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
        customActions={customActions}
        refreshTrigger={refreshTrigger}
        infoDescription="Registro y control de la información del personal de la empresa, incluyendo datos de identificación, contacto y vinculación organizacional."
        infoInstructions={`Utiliza el botón 'Crear' para registrar un nuevo empleado.
Haz clic en el icono de ojo para ver los detalles completos del empleado.
Haz clic en el icono de baja para retirar al empleado o en la persona con signo más para reactivarlo (en ambos casos especificando su cédula).`}
      />

      <DetailDialog
        open={Boolean(detailEmployee)}
        onClose={() => setDetailEmployee(null)}
        title="Detalles del Empleado"
        fields={
          detailEmployee
            ? [
                { label: "Nombre Completo", value: detailEmployee.fullName },
                {
                  label: "Documento",
                  value: `${detailEmployee.documentType || "CC"}: ${detailEmployee.document}`,
                },
                { label: "Email", value: detailEmployee.email || "Sin registrar" },
                { label: "Teléfono", value: detailEmployee.phone || "Sin registrar" },
                { label: "Dirección", value: detailEmployee.address || "Sin registrar" },
                { label: "Cliente / Conjunto", value: detailEmployee.clientName || "Sin asignar" },
                { label: "Departamento", value: detailEmployee.departmentName || "N/A" },
                { label: "Cargo / Posición", value: detailEmployee.positionName || "N/A" },
                { label: "Fecha Nacimiento", value: detailEmployee.birthdate || "N/A" },
                { label: "Fecha Ingreso", value: detailEmployee.entryDate || "N/A" },
                {
                  label: "Estado",
                  value: (
                    <Chip
                      label={
                        detailEmployee.isRetired
                          ? "Dado de Baja"
                          : detailEmployee.isActive
                            ? "Activo"
                            : "Inactivo"
                      }
                      color={
                        detailEmployee.isRetired
                          ? "error"
                          : detailEmployee.isActive
                            ? "success"
                            : "default"
                      }
                      size="small"
                    />
                  ),
                },
              ]
            : []
        }
      />

      <PromptConfirmDialog
        open={Boolean(retireEmployeeData)}
        onClose={() => setRetireEmployeeData(null)}
        onConfirm={handleRetireConfirm}
        title="Dar de Baja a Empleado"
        description={`Para confirmar la baja de ${retireEmployeeData?.fullName}, por favor ingrese su número de documento:`}
        expectedValue={retireEmployeeData?.document || ""}
        inputLabel="Número de Documento"
        confirmButtonText="Confirmar Baja"
        confirmColor="warning"
      />

      <PromptConfirmDialog
        open={Boolean(reactivateEmployeeData)}
        onClose={() => setReactivateEmployeeData(null)}
        onConfirm={handleReactivateConfirm}
        title="Reactivar Empleado"
        description={`Para confirmar la reactivación de ${reactivateEmployeeData?.fullName}, por favor ingrese su número de documento:`}
        expectedValue={reactivateEmployeeData?.document || ""}
        inputLabel="Número de Documento"
        confirmButtonText="Confirmar Reactivación"
        confirmColor="primary"
      />

      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={selectedId ? "Editar Empleado" : "Crear Empleado"}
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
        loading={loading}
      />
    </>
  );
}
