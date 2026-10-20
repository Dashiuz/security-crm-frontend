"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import ResponsiveDetailWrapper from "@/components/common/ResponsiveDetailWrapper";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import ImageUploadCapture from "@/components/common/ImageUploadCapture";
import { GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import {
  PersonOff as PersonOffIcon,
  PersonAdd as PersonAddIcon,
  Badge as BadgeIcon,
  CloudUpload as CloudUploadIcon,
  BusinessOutlined as BusinessIcon,
  Domain as DomainIcon,
  DomainDisabled as DomainDisabledIcon,
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
  SwapHoriz as SwapHorizIcon,
} from "@mui/icons-material";
import CsvImportDialog from "@/components/common/CsvImportDialog";
import { Chip, Box, Avatar, Typography, Stack, Button, Paper, Grid } from "@mui/material";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";

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

export default function EmployeesPage() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<
    EmployeeForm | undefined
  >();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useNotification();
  const [retireEmployeeData, setRetireEmployeeData] = useState<any | null>(null);
  const [reactivateEmployeeData, setReactivateEmployeeData] = useState<any | null>(null);

  // Avatar / S3 States
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);

  const [csvImportOpen, setCsvImportOpen] = useState(false);

  const [departments, setDepartments] = useState<
    { value: string; label: string }[]
  >([]);
  const [positions, setPositions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    const fetchRelations = async () => {
      try {
        const [deptsRes, postsRes] = await Promise.allSettled([
          HttpClient.get<any[]>("/department"),
          HttpClient.get<any[]>("/position"),
        ]);

        if (deptsRes.status === "fulfilled" && Array.isArray(deptsRes.value)) {
          const sortedDepts = [...deptsRes.value].sort((a, b) =>
            a.name.localeCompare(b.name),
          );
          setDepartments(
            sortedDepts.map((d) => ({ value: d.id, label: d.name })),
          );
        }

        if (postsRes.status === "fulfilled" && Array.isArray(postsRes.value)) {
          const sortedPosts = [...postsRes.value].sort((a, b) =>
            a.name.localeCompare(b.name),
          );
          setPositions(sortedPosts.map((p) => ({ value: p.id, label: p.name })));
        }
      } catch (error: any) {
        console.error("Error fetching relationships details:", error);
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
    setAvatarFile(null);
    setExistingAvatarUrl(null);
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

  const handleEdit = async (id: string) => {
    setLoading(true);
    setAvatarFile(null);
    setExistingAvatarUrl(null);
    try {
      const data = await HttpClient.get<any>(`/employee/any/${id}`);
      setSelectedId(id);
      setDefaultValues({
        ...data,
        birthdate: data.birthdate?.split("T")[0],
        entryDate: data.entryDate?.split("T")[0],
      });

      // Load avatar from S3 if exists
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.EMPLOYEE, id);
      if (mediaList && mediaList.length > 0) {
        setExistingAvatarUrl(mediaList[0].presignedUrl || null);
      }

      setDialogOpen(true);
    } catch {
      showError("Error al cargar los datos del empleado");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (row: any) => {
    router.push(`/administrative/employees/${row.id}/overview`);
  };

  const handleRetireConfirm = async () => {
    if (!retireEmployeeData) return;
    try {
      await HttpClient.patch(`/employee/${retireEmployeeData.id}/retire`, {});
      showSuccess("Empleado retirado del sistema");
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al dar de baja al empleado");
    }
  };

  const handleReactivateConfirm = async () => {
    if (!reactivateEmployeeData) return;
    try {
      await HttpClient.patch(`/employee/${reactivateEmployeeData.id}/reactivate`, {});
      showSuccess("Empleado reactivado exitosamente");
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al reactivar al empleado");
    }
  };

  const customActions = (row: any) => {
    if (row.isRetired || !row.isActive) {
      return [
        <GridActionsCellItem
          key={`view-${row.id}`}
          icon={<BadgeIcon color="primary" />}
          label="Ver Ficha Integral"
          showInMenu={true}
          onClick={() => router.push(`/administrative/employees/${row.id}/overview`)}
        />,
        <GridActionsCellItem
          key={`reactivate-${row.id}`}
          icon={<PersonAddIcon color="success" />}
          label="Reactivar Empleado"
          showInMenu={true}
          onClick={() => setReactivateEmployeeData(row)}
        />,
      ];
    }
    return [
      <GridActionsCellItem
        key={`view-${row.id}`}
        icon={<BadgeIcon color="primary" />}
        label="Ver Ficha Integral"
        showInMenu={true}
        onClick={() => router.push(`/administrative/employees/${row.id}/overview`)}
      />,
      <GridActionsCellItem
        key={`assignments-${row.id}`}
        icon={<BusinessIcon color="primary" />}
        label="Puestos Asignados"
        showInMenu={true}
        onClick={() => router.push(`/administrative/employees/${row.id}/assignments`)}
      />,
      <GridActionsCellItem
        key={`account-${row.id}`}
        icon={<BadgeIcon color="secondary" />}
        label="Cuenta Digital"
        showInMenu={true}
        onClick={() => router.push(`/administrative/employees/${row.id}/account`)}
      />,
      <GridActionsCellItem
        key={`retire-${row.id}`}
        icon={<PersonOffIcon color="warning" />}
        label="Dar de Baja"
        showInMenu={true}
        onClick={() => setRetireEmployeeData(row)}
      />,
    ];
  };

  const handleSubmit = async (data: EmployeeForm) => {
    try {
      let savedEmployee: any;
      if (selectedId) {
        savedEmployee = await HttpClient.patch(`/employee/${selectedId}`, data);
      } else {
        savedEmployee = await HttpClient.post("/employee", data);
      }

      const entityId = selectedId || savedEmployee?.id;

      // Upload Avatar to S3 if attached
      if (avatarFile && entityId) {
        try {
          await StorageApi.uploadMedia({
            file: avatarFile,
            entityType: MediaTypeCategory.EMPLOYEE,
            entityId,
            category: "avatar",
          });
          showSuccess("Fotografía del empleado sincronizada en la nube");
        } catch (uploadErr) {
          console.error("S3 upload error:", uploadErr);
          showError("Empleado guardado, pero ocurrió un problema al subir la foto a la nube.");
        }
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al guardar el empleado");
      throw error;
    }
  };

  const handleImport = async (data: Array<Record<string, string>>, fileName: string) => {
    try {
      const response = await HttpClient.post<{
        status: string;
        totalRows: number;
        successRows: number;
        errorRows: number;
        errors?: Array<{ row: number; reason: string }>;
      }>("/employee/import/csv", {
        data,
        fileName,
      });
      return response;
    } catch (error: any) {
      showError(error.message || "Error al importar el archivo CSV.");
      throw error;
    }
  };

  const columns: GridColDef[] = [
    {
      field: "fullName",
      headerName: "Empleado",
      flex: 1.5,
      minWidth: 220,
      renderCell: (params) => {
        const initials = params.row.fullName
          ? params.row.fullName
            .split(" ")
            .map((n: string) => n[0])
            .slice(0, 2)
            .join("")
          : "EM";
        const avatarSrc = params.row.avatarUrl || (params.row.mediaAttachments?.[0]?.url || undefined);
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%", gap: 1.5 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: avatarSrc ? "transparent" : "primary.main",
                fontSize: "0.85rem",
                fontWeight: 700,
                border: "1px solid",
                borderColor: "divider",
                flexShrink: 0,
              }}
              src={avatarSrc}
            >
              {initials}
            </Avatar>
            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.15 }}>
                {params.row.fullName}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", lineHeight: 1, mt: "2px", fontSize: "0.75rem" }}
              >
                {params.row.documentType || "CC"}: {params.row.document}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: "positionName",
      headerName: "Cargo",
      width: 150,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value || "Sin Cargo"}
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
        />
      ),
    },
    {
      field: "departmentName",
      headerName: "Departamento",
      width: 140,
      valueGetter: (value: any) => value || "N/A",
    },
    {
      field: "hasUser",
      headerName: "Acceso Digital",
      width: 160,
      renderCell: (params) => {
        const hasUser = Boolean(params.row.hasUser);
        const role = params.row.userRole;
        return (
          <Chip
            size="small"
            label={hasUser ? (role ? `${role}` : "Con Usuario") : "Sin Acceso"}
            color={hasUser ? "primary" : "default"}
            variant={hasUser ? "filled" : "outlined"}
            sx={{
              fontWeight: 600,
              fontSize: "0.72rem",
            }}
          />
        );
      },
    },
    {
      field: "isActive",
      headerName: "Estado",
      width: 100,
      renderCell: (params) => {
        const isRetired = Boolean(params.row.isRetired);
        const isActive = Boolean(params.row.isActive);
        return (
          <Chip
            size="small"
            label={isRetired ? "Retirado" : isActive ? "Activo" : "Inactivo"}
            color={isRetired ? "error" : isActive ? "success" : "default"}
            sx={{ fontWeight: 600, fontSize: "0.72rem" }}
          />
        );
      },
    },
    { field: "email", headerName: "Email", flex: 1, minWidth: 150 },
    { field: "phone", headerName: "Teléfono", width: 120 },
  ];

  return (
    <>
      <DataTable
        title="Gestión de Empleados"
        endpoint="/employee"
        columns={columns}
        breadcrumbs={[{ label: "Administrativo" }, { label: "Empleados" }]}
        onCreate={handleCreate}
        onEdit={handleEdit}
        editActionLabel="Editar Datos"
        onView={handleView}
        customActions={customActions}
        refreshTrigger={refreshTrigger}
        extraHeaderActions={
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloudUploadIcon />}
            onClick={() => setCsvImportOpen(true)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.85rem" },
              py: { xs: 0.75, sm: 0.65 },
              px: { xs: 1.8, sm: 2.2 },
              borderRadius: 2,
              whiteSpace: "nowrap",
            }}
          >
            Cargar CSV
          </Button>
        }
        infoDescription="Registro y control de la información del personal de la empresa, incluyendo fotografía en vivo, datos de identificación, contacto y vinculación organizacional."
        infoInstructions={`Utiliza el botón 'Crear' para registrar un nuevo empleado con captura de foto en vivo o subida de archivo.
Haz clic sobre una fila o en el icono de ver para abrir la Ficha Integral del Recurso (Hub & Spoke), donde podrás gestionar datos laborales, puestos concurrentes, credenciales de usuario y programación de turnos.`}
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
        topContent={
          <Box sx={{ mb: 3 }}>
            <ImageUploadCapture
              label="Fotografía del Empleado"
              variant="avatar"
              value={avatarFile}
              previewUrl={existingAvatarUrl}
              onChange={setAvatarFile}
              helperText="Toma una foto en vivo con la cámara o selecciona una imagen desde tu dispositivo para el perfil del empleado."
            />
          </Box>
        }
      />

      <CsvImportDialog
        open={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        title="Importar Empleados"
        templateColumns={[
          "Nombre",
          "SegundoNombre",
          "Apellido",
          "SegundoApellido",
          "TipoDocumento",
          "Documento",
          "FechaNacimiento",
          "Genero",
          "Direccion",
          "Telefono",
          "Email",
          "FechaIngreso",
          "Cargo",
          "Departamento",
        ]}
        onImport={handleImport}
        onSuccessRedirect={(result) => {
          setCsvImportOpen(false);
          setRefreshTrigger((prev) => prev + 1);
          if (result?.status === 'SUCCESS') {
            showSuccess("Importación masiva completada con éxito");
          } else if (result?.status === 'PARTIAL') {
            showSuccess("Importación masiva completada parcialmente. Revisa las advertencias.");
          }
        }}
      />
    </>
  );
}
