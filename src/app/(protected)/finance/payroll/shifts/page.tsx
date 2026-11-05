import React, { Suspense } from "react";
import ShiftGridWorkspace from "@/components/scheduling/ShiftGridWorkspace";
import { Box, CircularProgress } from "@mui/material";

export default function PayrollShiftsPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      }
    >
      <ShiftGridWorkspace mode="finance" />
    </Suspense>
  );
}
