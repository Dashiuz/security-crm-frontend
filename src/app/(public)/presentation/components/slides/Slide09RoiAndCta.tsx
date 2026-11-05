"use client";

import React from "react";
import { Box, Typography, Button } from "@mui/material";
import {
  TrendingUp as RoiIcon,
  Send as ContactIcon,
  Shield as ShieldIcon,
} from "@mui/icons-material";
import TacticalStatCard from "../widgets/TacticalStatCard";
import TacticalComparisonRow from "../widgets/TacticalComparisonRow";

export default function Slide09RoiAndCta() {
  return (
    <section>
      <Box
        sx={{
          width: "100%",
          maxWidth: 1660,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          py: { xs: 2, md: 1 },
        }}
      >
        {/* Header */}
        <Box sx={{ mb: { xs: 2, md: 3 }, textAlign: "center" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <span className="tactical-pill tactical-pill-emerald" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <RoiIcon sx={{ fontSize: 18 }} /> DIRECCIONES Y GERENCIAS • RUMBO Y DECISIONES
            </span>
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              color: "#FFFFFF",
              fontSize: { xs: "26px", sm: "36px", md: "46px", lg: "52px" },
              lineHeight: 1.12,
              mb: 1,
            }}
          >
            Un Sistema que se Paga Solo con el Tiempo y Dinero que Ahorra
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "25px" },
              lineHeight: 1.4,
              maxWidth: 1380,
              mx: "auto",
            }}
          >
            Decisiones y proyecciones seguras para las Direcciones, y control en tiempo real para saber el norte y rumbo de la empresa en las Gerencias.
          </Typography>
        </Box>

        {/* 3 Large Stat Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: { xs: 2, md: 3 },
            mb: { xs: 2, md: 3 },
          }}
        >
          <TacticalStatCard
            value="-85%"
            label="Menos Tiempo y Cero Reprocesos"
            sublabel="De pasar días pidiendo datos entre áreas a tener toda la información en línea"
            badgeText="AHORRO ADMINISTRATIVO"
            badgeType="emerald"
          />
          <TacticalStatCard
            value="0%"
            label="Reclamos sin Evidencia"
            sublabel="Toda entrega de paquete, visita o novedad tiene foto y trazabilidad de inicio a fin"
            badgeText="CLIENTES TRANQUILOS"
            badgeType="violet"
          />
          <TacticalStatCard
            value="100%"
            label="Nómina en Tiempos Reales"
            sublabel="Liquidación exacta conectada con los turnos reales trabajados y las tarifas de ley"
            badgeText="CERO DEMANDAS"
            badgeType="emerald"
          />
        </Box>

        {/* 2 Comparison Rows */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: { xs: 2, md: 3 } }}>
          <TacticalComparisonRow
            title="Comercial, RRHH y Operaciones"
            traditional="Promesas sueltas, carpetas de papel en archivo y cuadernos manchados en garita"
            loro="Propuestas en línea, 'tienda de guardas' lista y minutas digitales desde el minuto cero"
          />
          <TacticalComparisonRow
            title="Direcciones y Gerencias"
            traditional="Archivos de Excel desconectados que impiden ver la rentabilidad real a tiempo"
            loro="Datos convertidos en decisiones, proyecciones y rumbo claro en tiempo real"
          />
        </Box>

        {/* CTA Box */}
        <Box
          className="bento-card bento-hero"
          sx={{
            p: { xs: 2.5, md: 3 },
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: { xs: 2, md: 3 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, textAlign: { xs: "center", sm: "left" } }}>
            <ShieldIcon sx={{ color: "#34D399", fontSize: { xs: 36, md: 44 }, flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "18px", md: "22px", lg: "24px" } }}>
                ¿Listo para integrar Comercial, RRHH, Operaciones y Gerencia en un solo todo?
              </Typography>
              <Typography sx={{ color: "#E2E8F0", fontSize: { xs: "15px", md: "18px", lg: "19.5px" } }}>
                Comencemos con una demostración guiada para los puestos de vigilancia de sus clientes actuales.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            endIcon={<ContactIcon />}
            href="/login"
            sx={{
              background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
              color: "#FFFFFF",
              fontWeight: 850,
              fontSize: { xs: "16px", md: "19px" },
              px: { xs: 3, md: 4 },
              py: { xs: 1.4, md: 1.8 },
              borderRadius: "12px",
              boxShadow: "0 4px 18px rgba(124, 58, 237, 0.45)",
              textTransform: "none",
              whiteSpace: "nowrap",
              "&:hover": {
                background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
              },
            }}
          >
            Agendar Demostración
          </Button>
        </Box>
      </Box>
    </section>
  );
}
