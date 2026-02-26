"use client";

import DataTable from "@/components/common/DataTable";
import { GridColDef } from "@mui/x-data-grid";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "fullName", headerName: "Usuario", width: 200 },
  { field: "document", headerName: "Documento", width: 130 },
  {
    field: "roles",
    headerName: "Roles Actuales",
    width: 250,
    valueGetter: (params) => {
      // This assumes the backend returns an array of roles in the user objects or we handle it specially.
      // For now, placeholder showing it's the assignment view.
      return "Ver Detalles";
    },
  },
];

export default function UserRolesPage() {
  return (
    <DataTable
      title="Asignación de Roles"
      endpoint="/user"
      columns={columns}
      breadcrumbs={[
        { label: "Administrativo" },
        { label: "Asignación de Roles" },
      ]}
      onCreate={() => alert("Próximamente: Diálogo de Asignación Masiva")}
      onEdit={(id) => alert(`Próximamente: Gestionar Roles de Usuario ${id}`)}
    />
  );
}
