"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import { GridColDef } from "@mui/x-data-grid";
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
  departmentId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().optional().nullable(),
  entryDate: z.string().min(1, "La fecha de ingreso es requerida"),
  isActive: z.boolean().optional().default(true),
});

type EmployeeForm = z.infer<typeof schema>;

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  {
    field: "fullName",
    headerName: "Nombre Completo",
    width: 250,
  },
  { field: "document", headerName: "Documento", width: 130 },
  { field: "email", headerName: "Email", width: 180 },
  { field: "phone", headerName: "Teléfono", width: 120 },
  {
    field: "departmentName",
    headerName: "Departamento",
    width: 150,
    valueGetter: (value: any) => value || "N/A",
  },
  {
    field: "positionName",
    headerName: "Cargo",
    width: 150,
    valueGetter: (value: any) => value || "N/A",
  },
  { field: "isActive", headerName: "Activo", type: "boolean", width: 90 },
];

export default function EmployeesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<
    EmployeeForm | undefined
  >();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showError, showWarning } = useNotification();

  const [departments, setDepartments] = useState<
    { value: string; label: string }[]
  >([]);
  const [positions, setPositions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    const fetchRelations = async () => {
      try {
        const [depts, posts] = await Promise.all([
          HttpClient.get<any[]>("/department"),
          HttpClient.get<any[]>("/position"),
        ]);

        // Alphabetical sorting
        const sortedDepts = [...depts].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        const sortedPosts = [...posts].sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        setDepartments(
          sortedDepts.map((d) => ({ value: d.id, label: d.name })),
        );
        setPositions(sortedPosts.map((p) => ({ value: p.id, label: p.name })));
      } catch (error: any) {
        console.error("Error fetching relationships details:", error);
        showError("No se pudieron cargar los departamentos o cargos.");
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

  const handleSubmit = async (data: EmployeeForm) => {
    try {
      if (selectedId) {
        await HttpClient.patch(`/employee/${selectedId}`, data);
      } else {
        await HttpClient.post("/employee", data);
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      alert(error.message || "Error al guardar el empleado");
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
        refreshTrigger={refreshTrigger}
        infoDescription="Registro y control de la información del personal de la empresa, incluyendo datos de identificación, contacto y vinculación organizacional."
        infoInstructions={`Utiliza el botón 'Crear' para registrar un nuevo empleado.
Haz clic en el icono de edición para actualizar los datos personales, el departamento o el cargo.
Los empleados registrados aquí podrán ser vinculados a cuentas de usuario posteriormente.`}
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
