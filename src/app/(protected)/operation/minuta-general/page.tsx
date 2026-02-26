"use client";

import DataTable from "@/components/common/DataTable";
import { GridColDef } from "@mui/x-data-grid";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "date", headerName: "Fecha", width: 110 },
  { field: "time", headerName: "Hora", width: 100 },
  { field: "annotation", headerName: "Anotación", flex: 1, minWidth: 250 },
  { field: "category", headerName: "Categoría", width: 130 },
  { field: "priority", headerName: "Prioridad", width: 100 },
  { field: "status", headerName: "Estado", width: 120 },
];

export default function MinutaGeneralPage() {
  return (
    <DataTable
      title="Minuta General"
      endpoint="/operation/minuta/general"
      columns={columns}
      breadcrumbs={[{ label: "Operaciones" }, { label: "Minuta General" }]}
      onCreate={() => alert("Próximamente: Modal de Creación")}
      onEdit={(id) => alert(`Próximamente: Editar ${id}`)}
    />
  );
}
