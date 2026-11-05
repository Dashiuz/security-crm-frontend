"use client";

import React, { useEffect } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import {
  Close as CloseIcon,
  CheckCircle as CurrentIcon,
  ArrowForward as ArrowIcon,
  Shield as ShieldIcon,
  Hub as EcosystemIcon,
  Sync as SynergyIcon,
  WarningAmber as WarningIcon,
  HistoryEdu as HistoryIcon,
  Security as SecurityIcon,
  MonetizationOn as MoneyIcon,
  Calculate as CalcIcon,
  Groups as HrIcon,
  RecordVoiceOver as MicIcon,
  Badge as BadgeIcon,
  Map as MapIcon,
  Forum as OtherAreasIcon,
  AccessTime as TimeIcon,
  Gavel as LawIcon,
  Draw as SignIcon,
  QrCode2 as QrIcon,
  RocketLaunch as RoadmapIcon,
  TrendingUp as RoiIcon,
} from "@mui/icons-material";

export interface SlideOverviewItem {
  index: number;
  number: string;
  category: string;
  title: string;
  summary: string;
  icon: React.ReactNode;
}

export const SLIDES_METADATA: SlideOverviewItem[] = [
  {
    index: 0,
    number: "01",
    category: "PORTADA",
    title: "LORO ERP: El Sistema para Empresas de Seguridad",
    summary: "Integra clientes externos, clientes internos y área administrativa para dar decisiones a Direcciones y rumbo a Gerencias.",
    icon: <ShieldIcon sx={{ fontSize: 22, color: "#8B5CF6" }} />,
  },
  {
    index: 1,
    number: "02",
    category: "VISIÓN INTEGRAL",
    title: "Tres Partes Importantes que Forman un Todo",
    summary: "Clientes externos, clientes internos (guardas) y gestión administrativa conectados en tiempo real.",
    icon: <EcosystemIcon sx={{ fontSize: 22, color: "#10B981" }} />,
  },
  {
    index: 2,
    number: "03",
    category: "UNIÓN DE ÁREAS",
    title: "Comercial, RRHH y Operaciones Como una Sola",
    summary: "Apoyo continuo a Contabilidad, Facturación, Asistenciales y Calidad bajo un mismo hilo conductor.",
    icon: <SynergyIcon sx={{ fontSize: 22, color: "#34D399" }} />,
  },
  {
    index: 3,
    number: "04",
    category: "DOLORES DE CABEZA",
    title: "Los 4 Dolores Comunes en Seguridad",
    summary: "Minutas de papel, cotizaciones en Excel que se descuadran, enredos de nómina 24/7 y reportes manuales.",
    icon: <WarningIcon sx={{ fontSize: 22, color: "#EF4444" }} />,
  },
  {
    index: 4,
    number: "05",
    category: "NUESTRA HISTORIA",
    title: "Hecho en el Puesto de Guardia, No en una Oficina Lejana",
    summary: "De minuta digital en portería a un ERP completo que conecta toda la operación de la empresa.",
    icon: <HistoryIcon sx={{ fontSize: 22, color: "#38BDF8" }} />,
  },
  {
    index: 5,
    number: "06",
    category: "SEGURIDAD DE DATOS",
    title: "Seguridad y Tranquilidad con su Información",
    summary: "Datos 100% privados por empresa, trazabilidad de auditoría, fotos en la nube y disponibilidad 24/7.",
    icon: <SecurityIcon sx={{ fontSize: 22, color: "#10B981" }} />,
  },
  {
    index: 6,
    number: "07",
    category: "DESDE COMERCIAL",
    title: "Lo que Vendo ya no es una Promesa: es una Realidad",
    summary: "Seguimiento desde el minuto uno, propuestas en línea, análisis de rentabilidad, valores agregados y firma digital.",
    icon: <MoneyIcon sx={{ fontSize: 22, color: "#10B981" }} />,
  },
  {
    index: 7,
    number: "08",
    category: "SIMULADOR EN VIVO",
    title: "Calculadora de Tarifas y Rentabilidad por Puesto",
    summary: "Simulación interactiva con tarifas de ley 2026 (8.8 y 9.77 SMMLV) y margen de ganancia en vivo.",
    icon: <CalcIcon sx={{ fontSize: 22, color: "#8B5CF6" }} />,
  },
  {
    index: 8,
    number: "09",
    category: "DESDE RRHH",
    title: "Su Propia 'Tienda de Guardas' y Cero Papel",
    summary: "Selección del guarda ideal, listas de postulados con motores de búsqueda, cultura organizacional e historias digitales.",
    icon: <HrIcon sx={{ fontSize: 22, color: "#A78BFA" }} />,
  },
  {
    index: 9,
    number: "10",
    category: "DESDE OPERACIONES",
    title: "La Operación Nace desde las Anotaciones del Guarda",
    summary: "Novedades desde el minuto cero, trazabilidad total, capacitaciones en puesto, menos papel y alertas críticas.",
    icon: <MicIcon sx={{ fontSize: 22, color: "#8B5CF6" }} />,
  },
  {
    index: 10,
    number: "11",
    category: "CONTROL DE ACCESOS",
    title: "Visitantes y Paquetería con Evidencia en Foto",
    summary: "Registro de visitantes y entrega de paquetes con foto de guía y firma del residente en el celular.",
    icon: <BadgeIcon sx={{ fontSize: 22, color: "#34D399" }} />,
  },
  {
    index: 11,
    number: "12",
    category: "PLANOS Y MAPAS",
    title: "Estudios de Seguridad con Mapas y Cámaras",
    summary: "Ubicación visual de cámaras, domos, sensores y garitas sobre mapa satelital o plano del cliente.",
    icon: <MapIcon sx={{ fontSize: 22, color: "#F59E0B" }} />,
  },
  {
    index: 12,
    number: "13",
    category: "LAS DEMÁS ÁREAS",
    title: "Información al Instante y Cero Reprocesos",
    summary: "Comunicación a todo nivel, historial completo del cliente, pago basado en tiempos reales y control de novedades.",
    icon: <OtherAreasIcon sx={{ fontSize: 22, color: "#34D399" }} />,
  },
  {
    index: 13,
    number: "14",
    category: "NÓMINA DE TURNOS",
    title: "Nómina 24/7 y Programaciones Dinámicas (Ley 2101)",
    summary: "Recargos exactos, cobro de incapacidades a la EPS, control de préstamos y archivos planos para bancos.",
    icon: <TimeIcon sx={{ fontSize: 22, color: "#38BDF8" }} />,
  },
  {
    index: 14,
    number: "15",
    category: "CUMPLIMIENTO LEGAL",
    title: "SuperVigilancia RENOVA, DIAN y Seguridad Social",
    summary: "Plantilla oficial RENOVA de 22 columnas, Nómina Electrónica DIAN, PILA y certificados laborales.",
    icon: <LawIcon sx={{ fontSize: 22, color: "#FBBF24" }} />,
  },
  {
    index: 15,
    number: "16",
    category: "HERRAMIENTAS",
    title: "Firmas en el Celular, Códigos QR y Formatos",
    summary: "Firma electrónica con validez legal, etiquetas para rondas/armamento y plantillas documentales.",
    icon: <SignIcon sx={{ fontSize: 22, color: "#818CF8" }} />,
  },
  {
    index: 16,
    number: "17",
    category: "CÓDIGOS EN VIVO",
    title: "Generador de Códigos QR para Rondas y Armas",
    summary: "Demostración interactiva: cree e imprima códigos únicos de control en un solo clic.",
    icon: <QrIcon sx={{ fontSize: 22, color: "#10B981" }} />,
  },
  {
    index: 17,
    number: "18",
    category: "LO QUE VIENE",
    title: "Nuevas Funciones: Rondas GPS y Relevo con Foto",
    summary: "Recorridos con GPS en vivo, relevo biométrico, citofonía móvil, armamento y capacitación en video.",
    icon: <RoadmapIcon sx={{ fontSize: 22, color: "#F472B6" }} />,
  },
  {
    index: 18,
    number: "19",
    category: "DIRECCIONES Y GERENCIAS",
    title: "Un Sistema que se Paga Solo con el Tiempo y Dinero Ahorrado",
    summary: "Decisiones para Direcciones, rumbo en tiempo real para Gerencias y retorno inmediato de la inversión.",
    icon: <RoiIcon sx={{ fontSize: 22, color: "#10B981" }} />,
  },
];

interface PresentationGridModalProps {
  isOpen: boolean;
  currentSlide: number;
  onSelectSlide: (index: number) => void;
  onClose: () => void;
}

export default function PresentationGridModal({
  isOpen,
  currentSlide,
  onSelectSlide,
  onClose,
}: PresentationGridModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "rgba(9, 7, 26, 0.96)",
        backdropFilter: "blur(18px)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        p: { xs: 2, sm: 3, md: 4 },
        boxSizing: "border-box",
        animation: "fadeIn 0.2s ease-out",
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "scale(0.98)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
      }}
    >
      {/* Top Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: 1620,
          width: "100%",
          mx: "auto",
          mb: 3,
          pb: 2,
          borderBottom: "1px solid rgba(139, 92, 246, 0.25)",
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: "#FFFFFF",
                fontSize: { xs: "20px", sm: "24px", md: "28px" },
                letterSpacing: "-0.01em",
              }}
            >
              ÍNDICE GENERAL DE LA PRESENTACIÓN
            </Typography>
            <span
              className="tactical-pill tactical-pill-violet"
              style={{ fontSize: "14px", padding: "5px 14px" }}
            >
              {SLIDES_METADATA.length} DIAPOSITIVAS
            </span>
          </Box>
          <Typography sx={{ color: "#CBD5E1", fontSize: { xs: "14px", sm: "16px" } }}>
            Haga clic en cualquier tarjeta para ir directamente a esa diapositiva o presione{" "}
            <kbd
              style={{
                backgroundColor: "rgba(124, 58, 237, 0.25)",
                border: "1px solid rgba(139, 92, 246, 0.5)",
                borderRadius: "4px",
                padding: "2px 8px",
                color: "#FFFFFF",
                fontSize: "13px",
              }}
            >
              Esc
            </kbd>{" "}
            para volver.
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            color: "#E2E8F0",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            p: 1.4,
            borderRadius: "12px",
            "&:hover": {
              color: "#FFFFFF",
              backgroundColor: "rgba(124, 58, 237, 0.35)",
              borderColor: "#8B5CF6",
            },
          }}
          aria-label="Cerrar vista de cuadrícula"
        >
          <CloseIcon sx={{ fontSize: 26 }} />
        </IconButton>
      </Box>

      {/* Grid of 19 Slides */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2.5,
          maxWidth: 1620,
          width: "100%",
          mx: "auto",
          pb: 6,
        }}
      >
        {SLIDES_METADATA.map((slide) => {
          const isCurrent = currentSlide === slide.index + 1;

          return (
            <Box
              key={slide.index}
              onClick={() => onSelectSlide(slide.index)}
              sx={{
                backgroundColor: isCurrent ? "rgba(28, 22, 60, 0.96)" : "rgba(18, 14, 40, 0.88)",
                border: isCurrent
                  ? "2.5px solid #10B981"
                  : "1.5px solid rgba(139, 92, 246, 0.32)",
                borderRadius: "16px",
                p: 2.5,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 195,
                boxShadow: isCurrent
                  ? "0 0 24px rgba(16, 185, 129, 0.45)"
                  : "0 4px 16px rgba(0, 0, 0, 0.45)",
                "&:hover": {
                  transform: "translateY(-4px)",
                  borderColor: isCurrent ? "#10B981" : "#8B5CF6",
                  backgroundColor: "rgba(28, 22, 60, 0.99)",
                  boxShadow: "0 12px 28px rgba(124, 58, 237, 0.4)",
                },
              }}
            >
              {/* Header inside card: number and category */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 900,
                        fontSize: "14px",
                        color: isCurrent ? "#10B981" : "#C4B5FD",
                        backgroundColor: isCurrent
                          ? "rgba(16, 185, 129, 0.18)"
                          : "rgba(124, 58, 237, 0.22)",
                        border: isCurrent
                          ? "1px solid rgba(16, 185, 129, 0.45)"
                          : "1px solid rgba(139, 92, 246, 0.4)",
                        padding: "3px 9px",
                        borderRadius: "6px",
                      }}
                    >
                      #{slide.number}
                    </span>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 850,
                        color: "#CBD5E1",
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}
                    >
                      {slide.category}
                    </Typography>
                  </Box>

                  {isCurrent ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <CurrentIcon sx={{ fontSize: 18, color: "#10B981" }} />
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 900,
                          color: "#10B981",
                        }}
                      >
                        ACTUAL
                      </Typography>
                    </Box>
                  ) : (
                    slide.icon
                  )}
                </Box>

                {/* Card Title */}
                <Typography
                  sx={{
                    fontWeight: 850,
                    fontSize: "17px",
                    lineHeight: 1.28,
                    color: "#FFFFFF",
                    mb: 1,
                  }}
                >
                  {slide.title}
                </Typography>

                {/* Card Summary */}
                <Typography
                  sx={{
                    fontSize: "14.5px",
                    lineHeight: 1.45,
                    color: "#CBD5E1",
                  }}
                >
                  {slide.summary}
                </Typography>
              </Box>

              {/* Bottom Jump Indicator */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 0.6,
                  mt: 2,
                  pt: 1.2,
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  color: isCurrent ? "#10B981" : "#C4B5FD",
                  fontSize: "13.5px",
                  fontWeight: 800,
                }}
              >
                <span>{isCurrent ? "En pantalla" : "Ir a diapositiva"}</span>
                <ArrowIcon sx={{ fontSize: 17 }} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
