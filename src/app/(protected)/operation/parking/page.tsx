"use client";

import DataTable from "@/components/common/DataTable";
import { GridColDef } from "@mui/x-data-grid";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "plate", headerName: "Placa", width: 100 },
  { field: "brand", headerName: "Marca", width: 120 },
  { field: "color", headerName: "Color", width: 100 },
  { field: "parkingNumber", headerName: "Puesto", width: 100 },
  { field: "entryTime", headerName: "Entrada", width: 100 },
  { field: "exitTime", headerName: "Salida", width: 100 },
  { field: "status", headerName: "Estado", width: 120 },
];

export default function ParkingControlPage() {
  return (
    <DataTable
      title="Control de Parqueadero"
      endpoint="/operation/minuta/parking"
      columns={columns}
      breadcrumbs={[
        { label: "Operaciones" },
        { label: "Control de Parqueadero" },
      ]}
      onCreate={() => alert("Próximamente: Modal de Creación")}
      onEdit={(id) => alert(`Próximamente: Editar ${id}`)}
    />
  );
}
