"use client";

import React from "react";
import { Box, Typography, Button } from "@mui/material";
import {
  TrendingUp as RoiIcon,
  CheckCircle as SuccessIcon,
  Send as ContactIcon,
  Shield as ShieldIcon,
} from "@mui/icons-material";
import TacticalStatCard from "../widgets/TacticalStatCard";
import TacticalComparisonRow from "../widgets/TacticalComparisonRow";

export default function Slide09RoiAndCta() {
  return (
    <section>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header */}
        <Box sx={{ mb: 2.5, textAlign: "center" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <span className="tactical-pill tactical-pill-emerald">
              <RoiIcon sx={{ fontSize: 14 }} /> BENEFICIOS REALES Y VISIBLES
            </span>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "26px", md: "36px" } }}>
            Un Sistema que se Paga Solo con el Tiempo y Dinero que Ahorra
          </Typography>
          <Typography sx={{ color: "#CBD5E1", fontSize: "15px", maxWidth: 720, mx: "auto" }}>
            Hecho a la medida de la seguridad privada en Colombia para que usted tenga el control sin desgastarse.
          </Typography>
        </Box>

        {/* 3 Large Stat Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 2,
            mb: 2.5,
          }}
        >
          <TacticalStatCard
            value="-85%"
            label="Menos Tiempo en Oficina"
            sublabel="De pasar días cuadrando turnos en Excel a liquidar en minutos"
            badgeText="AHORRO DE TIEMPO"
            badgeType="emerald"
          />
          <TacticalStatCard
            value="0%"
            label="Reclamos sin Evidencia"
            sublabel="Toda entrega de paquete o novedad tiene foto y firma de respaldo"
            badgeText="CLIENTES TRANQUILOS"
            badgeType="violet"
          />
          <TacticalStatCard
            value="100%"
            label="Alineado con la Ley"
            sublabel="Tarifas oficiales SVSP y cálculo exacto de nómina laboral"
            badgeText="CERO DEMANDAS"
            badgeType="emerald"
          />
        </Box>

        {/* 2 Comparison Rows */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
          <TacticalComparisonRow
            title="Minutas de Garita"
            traditional="Cuadernos de papel manchados y llamadas sin registro"
            loro="Bitácora en el celular, dictado por voz, fotos y alertas a gerencia"
          />
          <TacticalComparisonRow
            title="Cotizaciones y Nómina"
            traditional="Archivos de Excel viejos con riesgo de perder plata o recibir demandas"
            loro="Cálculo automático con tarifas de la Superintendencia y pagos al banco"
          />
        </Box>

        {/* CTA Box */}
        <Box
          className="bento-card bento-hero"
          sx={{
            p: 2,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, textAlign: { xs: "center", sm: "left" } }}>
            <ShieldIcon sx={{ color: "#34D399", fontSize: 32 }} />
            <Box>
              <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "16px" }}>
                ¿Listo para modernizar la operación de su empresa de seguridad?
              </Typography>
              <Typography sx={{ color: "#CBD5E1", fontSize: "13px" }}>
                Comencemos con una prueba guiada para los puestos de vigilancia de sus clientes actuales.
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<ContactIcon />}
            href="/login"
            sx={{
              backgroundColor: "#7C3AED",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "14px",
              textTransform: "none",
              px: 3,
              py: 1.2,
              borderRadius: "8px",
              boxShadow: "0 0 20px rgba(124, 58, 237, 0.5)",
              "&:hover": {
                backgroundColor: "#6D28D9",
                boxShadow: "0 0 28px rgba(124, 58, 237, 0.8)",
              },
            }}
          >
            Ingresar al Sistema
          </Button>
        </Box>
      </Box>
    </section>
  );
}
