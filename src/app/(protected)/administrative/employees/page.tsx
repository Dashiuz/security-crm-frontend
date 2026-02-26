"use client";

import DataTable from "@/components/common/DataTable";
import { GridColDef } from "@mui/x-data-grid";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "fullName", headerName: "Nombre Completo", width: 200 },
  { field: "document", headerName: "Documento", width: 130 },
  { field: "email", headerName: "Email", width: 180 },
  { field: "phone", headerName: "Teléfono", width: 120 },
  { field: "departmentName", headerName: "Departamento", width: 150 },
  { field: "positionName", headerName: "Cargo", width: 150 },
  { field: "isActive", headerName: "Activo", type: "boolean", width: 90 },
];

export default function EmployeesPage() {
  return (
    <DataTable
      title="Gestión de Empleados"
      endpoint="/employee"
      columns={columns}
      breadcrumbs={[{ label: "Administrativo" }, { label: "Empleados" }]}
      onCreate={() => alert("Próximamente: Modal de Creación")}
      onEdit={(id) => alert(`Próximamente: Editar ${id}`)}
    />
  );
}
