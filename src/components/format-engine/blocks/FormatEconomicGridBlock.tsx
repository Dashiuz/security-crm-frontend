"use client";

import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { AttachMoney } from "@mui/icons-material";

export interface FormatEconomicGridBlockProps {
  totalMonthly?: string;
  totalInWords?: string;
  contractMonths?: string;
  serviceDescription?: string;
}

export default function FormatEconomicGridBlock({
  totalMonthly = "{{propuesta_total_mensual}}",
  totalInWords = "{{monto_en_letras}}",
  contractMonths = "{{propuesta_meses}}",
  serviceDescription = "Servicio de Vigilancia Integral Especializada 24 Horas",
}: FormatEconomicGridBlockProps) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 800,
          color: "#0F172A",
          mb: 1,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <AttachMoney fontSize="small" sx={{ color: "primary.main" }} />
        Resumen Económico de la Propuesta / Contrato
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, borderColor: "#CBD5E1" }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#F8FAFC" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Descripción del Concepto</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: "#334155" }}>Plazo</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#334155" }}>Canon Mensual (Con IVA)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ color: "#1E293B", fontWeight: 500 }}>
                {serviceDescription}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                {contractMonths} Meses
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.95rem" }}>
                {totalMonthly}
              </TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: "#F1F5F9" }}>
              <TableCell colSpan={3} sx={{ py: 1 }}>
                <Typography variant="caption" sx={{ color: "#475569", fontWeight: 600, display: "block" }}>
                  VALOR EN LETRAS:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A", fontStyle: "italic" }}>
                  {totalInWords}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
