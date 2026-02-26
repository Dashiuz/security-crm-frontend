"use client";

import DataTable from "@/components/common/DataTable";
import { GridColDef } from "@mui/x-data-grid";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 120 },
  { field: "name", headerName: "Nombre", flex: 1 },
  { field: "description", headerName: "Descripción", flex: 2 },
];

export default function PositionsPage() {
  return (
    <DataTable
      title="Posiciones / Cargos"
      endpoint="/position"
      columns={columns}
      breadcrumbs={[{ label: "Administrativo" }, { label: "Posiciones" }]}
      onCreate={() => alert("Próximamente: Modal de Creación")}
      onEdit={(id) => alert(`Próximamente: Editar ${id}`)}
    />
  );
}
