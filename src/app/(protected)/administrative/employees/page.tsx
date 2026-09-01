"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import DetailDialog from "@/components/common/DetailDialog";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import ImageUploadCapture from "@/components/common/ImageUploadCapture";
import { GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import {
  PersonOff as PersonOffIcon,
  PersonAdd as PersonAddIcon,
  Badge as BadgeIcon,
} from "@mui/icons-material";
import { Chip, Box, Avatar, Typography, Stack } from "@mui/material";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<
    EmployeeForm | undefined
  >();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useNotification();
  const [detailEmployee, setDetailEmployee] = useState<any | null>(null);
  const [detailAvatarUrl, setDetailAvatarUrl] = useState<string | null>(null);
  const [retireEmployeeData, setRetireEmployeeData] = useState<any | null>(null);
  const [reactivateEmployeeData, setReactivateEmployeeData] = useState<any | null>(null);

  // Avatar / S3 States
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);

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
        const [clsRes, deptsRes, postsRes] = await Promise.allSettled([
          HttpClient.get<any[]>("/client"),
          HttpClient.get<any[]>("/department"),
          HttpClient.get<any[]>("/position"),
        ]);

        if (clsRes.status === "fulfilled" && Array.isArray(clsRes.value)) {
          const sortedCls = [...clsRes.value].sort((a, b) =>
            a.name.localeCompare(b.name),
          );
          setClients(
            sortedCls.map((c) => ({ value: c.id, label: `${c.name} (${c.internalCode})` })),
          );
        }

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

  const handleView = async (row: any) => {
    setDetailEmployee(row);
    setDetailAvatarUrl(null);
    try {
      if (row.mediaAttachments && row.mediaAttachments.length > 0) {
        const presigned = await StorageApi.getPresignedUrl(row.mediaAttachments[0].id);
        setDetailAvatarUrl(presigned.presignedUrl);
      } else {
        const mediaList = await StorageApi.getByEntity(MediaTypeCategory.EMPLOYEE, row.id);
        if (mediaList && mediaList.length > 0) {
          setDetailAvatarUrl(mediaList[0].presignedUrl || null);
        }
      }
    } catch {}
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
          showSuccess("Fotografía del empleado sincronizada en AWS S3");
        } catch (uploadErr) {
          console.error("S3 upload error:", uploadErr);
          showError("Empleado guardado, pero ocurrió un problema al subir la foto a S3.");
        }
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al guardar el empleado");
      throw error;
    }
  };

  const columns: GridColDef[] = [
    {
      field: "fullName",
      headerName: "Empleado",
      width: 250,
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
        infoDescription="Registro y control de la información del personal de la empresa, incluyendo fotografía en vivo, datos de identificación, contacto y vinculación organizacional."
        infoInstructions={`Utiliza el botón 'Crear' para registrar un nuevo empleado con captura de foto en vivo o subida de archivo.
Haz clic en el icono de ojo para ver los detalles y fotografía en alta resolución del empleado.
Haz clic en el icono de baja para retirar al empleado o en la persona con signo más para reactivarlo.`}
      />

      <DetailDialog
        open={Boolean(detailEmployee)}
        onClose={() => setDetailEmployee(null)}
        title="Detalles del Empleado"
        headerContent={
          detailEmployee && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pb: 2,
                mb: 2,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Avatar
                src={detailAvatarUrl || detailEmployee?.avatarUrl || undefined}
                sx={{
                  width: 90,
                  height: 90,
                  bgcolor: "primary.main",
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                  mb: 1.5,
                }}
              >
                {detailEmployee.fullName
                  ? detailEmployee.fullName
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                  : "EM"}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {detailEmployee.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {detailEmployee.positionName || "Sin Cargo"} • {detailEmployee.departmentName || "Sin Departamento"}
              </Typography>
            </Box>
          )
        }
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
    </>
  );
}
