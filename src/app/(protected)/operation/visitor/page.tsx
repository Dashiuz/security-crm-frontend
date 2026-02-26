"use client";

import DataTable from "@/components/common/DataTable";
import { GridColDef } from "@mui/x-data-grid";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "visitorFullName", headerName: "Visitante", width: 200 },
  { field: "visitorIdNumber", headerName: "Documento", width: 130 },
  { field: "entryTime", headerName: "Entrada", width: 100 },
  { field: "exitTime", headerName: "Salida", width: 100 },
  { field: "destination", headerName: "Destino", width: 150 },
  { field: "authorizedByFullName", headerName: "Autorizado por", width: 180 },
  { field: "status", headerName: "Estado", width: 120 },
];

export default function VisitorControlPage() {
  return (
    <DataTable
      title="Control de Visitas"
      endpoint="/operation/minuta/visitor"
      columns={columns}
      breadcrumbs={[{ label: "Operaciones" }, { label: "Control de Visitas" }]}
      onCreate={() => alert("Próximamente: Modal de Creación")}
      onEdit={(id) => alert(`Próximamente: Editar ${id}`)}
    />
  );
}
