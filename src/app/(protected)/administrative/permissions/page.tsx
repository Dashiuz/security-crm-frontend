"use client";

import DataTable from "@/components/common/DataTable";
import { GridColDef } from "@mui/x-data-grid";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 120 },
  { field: "key", headerName: "Clave de Permiso", flex: 1 },
  { field: "description", headerName: "Descripción", flex: 2 },
];

export default function PermissionsPage() {
  return (
    <DataTable
      title="Gestión de Permisos"
      endpoint="/permission"
      columns={columns}
      breadcrumbs={[{ label: "Administrativo" }, { label: "Permisos" }]}
      onCreate={() => alert("Próximamente: Modal de Creación")}
      onEdit={(id) => alert(`Próximamente: Editar ${id}`)}
    />
  );
}
