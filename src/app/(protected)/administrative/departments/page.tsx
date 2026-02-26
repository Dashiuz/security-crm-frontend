"use client";

import DataTable from "@/components/common/DataTable";
import { GridColDef } from "@mui/x-data-grid";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 120 },
  { field: "name", headerName: "Nombre", flex: 1 },
  { field: "description", headerName: "Descripción", flex: 2 },
];

export default function DepartmentsPage() {
  return (
    <DataTable
      title="Departamentos"
      endpoint="/department"
      columns={columns}
      breadcrumbs={[{ label: "Administrativo" }, { label: "Departamentos" }]}
      onCreate={() => alert("Próximamente: Modal de Creación")}
      onEdit={(id) => alert(`Próximamente: Editar ${id}`)}
    />
  );
}
