"use client";

import DataTable from "@/components/common/DataTable";
import { GridColDef } from "@mui/x-data-grid";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 120 },
  { field: "name", headerName: "Nombre del Rol", flex: 1 },
  { field: "description", headerName: "Descripción", flex: 2 },
];

export default function RolesPage() {
  return (
    <DataTable
      title="Control de Roles"
      endpoint="/role"
      columns={columns}
      breadcrumbs={[{ label: "Administrativo" }, { label: "Control de Roles" }]}
      onCreate={() => alert("Próximamente: Modal de Creación")}
      onEdit={(id) => alert(`Próximamente: Editar ${id}`)}
    />
  );
}
