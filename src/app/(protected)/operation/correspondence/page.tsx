"use client";

import DataTable from "@/components/common/DataTable";
import { GridColDef } from "@mui/x-data-grid";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "destination", headerName: "Destino", width: 150 },
  { field: "sender", headerName: "Remitente", width: 150 },
  { field: "correspondenceType", headerName: "Tipo", width: 130 },
  { field: "trackingNumber", headerName: "Tracking", width: 150 },
  { field: "status", headerName: "Estado", width: 120 },
];

export default function CorrespondenceControlPage() {
  return (
    <DataTable
      title="Control de Domicilios"
      endpoint="/operation/minuta/correspondence"
      columns={columns}
      breadcrumbs={[
        { label: "Operaciones" },
        { label: "Control de Domicilios" },
      ]}
      onCreate={() => alert("Próximamente: Modal de Creación")}
      onEdit={(id) => alert(`Próximamente: Editar ${id}`)}
    />
  );
}
