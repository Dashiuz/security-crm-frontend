"use client";

import DataTable from "@/components/common/DataTable";
import { GridColDef } from "@mui/x-data-grid";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "fullName", headerName: "Nombre Completo", width: 200 },
  { field: "document", headerName: "Documento", width: 130 },
  { field: "department", headerName: "Departamento", width: 150 },
  { field: "position", headerName: "Cargo", width: 150 },
  { field: "isActive", headerName: "Activo", type: "boolean", width: 90 },
];

export default function UsersPage() {
  return (
    <DataTable
      title="Gestión de Usuarios"
      endpoint="/user"
      columns={columns}
      breadcrumbs={[{ label: "Administrativo" }, { label: "Usuarios" }]}
      onCreate={() => alert("Próximamente: Modal de Creación")}
      onEdit={(id) => alert(`Próximamente: Editar ${id}`)}
    />
  );
}
