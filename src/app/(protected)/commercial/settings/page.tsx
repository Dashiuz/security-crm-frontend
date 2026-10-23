"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Breadcrumbs,
  Link,
  CircularProgress,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  CalendarMonthOutlined,
  ShieldOutlined,
  BadgeOutlined,
  CardGiftcardOutlined,
  PaletteOutlined,
  SendTimeExtensionOutlined,
  RefreshOutlined,
  ExpandMore as ExpandMoreIcon,
  TuneOutlined,
} from "@mui/icons-material";
import { useCommercialSettings } from "./hooks/useCommercialSettings";
import TariffPeriodsTab from "./components/tabs/TariffPeriodsTab";
import ServiceCatalogTab from "./components/tabs/ServiceCatalogTab";
import SalaryMatrixTab from "./components/tabs/SalaryMatrixTab";
import ValueAddedTab from "./components/tabs/ValueAddedTab";
import DocumentSkinTab from "./components/tabs/DocumentSkinTab";
import DistributionMatrixTab from "./components/tabs/DistributionMatrixTab";
import { noxiaPalette } from "@/theme/noxiaTheme";

const TAB_CONFIG = [
  { label: "Vigencias y Tarifas SVSP", icon: <CalendarMonthOutlined /> },
  { label: "Catálogo de Servicios", icon: <ShieldOutlined /> },
  { label: "Matriz Salarial y Turnos", icon: <BadgeOutlined /> },
  { label: "Valores Agregados y Topes", icon: <CardGiftcardOutlined /> },
  { label: "Plantillas e Identidad Empresarial", icon: <PaletteOutlined /> },
  { label: "Notificar Departamentos", icon: <SendTimeExtensionOutlined /> },
];

export default function CommercialSettingsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeTab, setActiveTab] = useState(0);

  const { settings, loading, refresh } = useCommercialSettings();

  const desktopTabValue = activeTab >= 0 && activeTab <= 5 ? activeTab : 0;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Encabezado y Breadcrumb */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1, fontSize: "0.85rem" }}>
            <Link underline="hover" color="inherit" href="/dashboard">
              Inicio
            </Link>
            <Typography color="inherit">Dirección Comercial</Typography>
            <Typography color="text.primary" sx={{ fontWeight: 600 }}>
              Catálogo y Configuración
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: `${noxiaPalette.primary.main}15`,
                color: noxiaPalette.primary.main,
                display: "flex",
              }}
            >
              <TuneOutlined />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main, letterSpacing: -0.5 }}>
                Catálogo y Configuración Comercial
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Motor tarifario oficial SVSP, cálculo salarial de guardas, catálogo de servicios e identidad camaleón
              </Typography>
            </Box>
          </Box>
        </Box>

        <Tooltip title="Actualizar datos">
          <IconButton
            onClick={refresh}
            disabled={loading}
            sx={{
              bgcolor: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.1)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
            }}
          >
            <RefreshOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Contenido Principal con Carga */}
      {loading && !settings ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12 }}>
          <CircularProgress sx={{ color: noxiaPalette.primary.main }} />
        </Box>
      ) : settings ? (
        isMobile ? (
          /* Mobile: Acordeones por cada Pestaña */
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Accordion
              expanded={activeTab === 0}
              onChange={() => setActiveTab(activeTab === 0 ? -1 : 0)}
              slotProps={{ transition: { unmountOnExit: true } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarMonthOutlined fontSize="small" sx={{ color: noxiaPalette.primary.main }} />
                  Vigencias y Tarifas SVSP
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {activeTab === 0 && (
                  <TariffPeriodsTab periods={settings.tariffPeriods || []} onRefresh={refresh} />
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion
              expanded={activeTab === 1}
              onChange={() => setActiveTab(activeTab === 1 ? -1 : 1)}
              slotProps={{ transition: { unmountOnExit: true } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                  <ShieldOutlined fontSize="small" sx={{ color: noxiaPalette.primary.main }} />
                  Catálogo de Servicios
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {activeTab === 1 && (
                  <ServiceCatalogTab services={settings.serviceCatalog || []} onRefresh={refresh} />
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion
              expanded={activeTab === 2}
              onChange={() => setActiveTab(activeTab === 2 ? -1 : 2)}
              slotProps={{ transition: { unmountOnExit: true } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                  <BadgeOutlined fontSize="small" sx={{ color: noxiaPalette.primary.main }} />
                  Matriz Salarial y Turnos
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {activeTab === 2 && (
                  <SalaryMatrixTab salaryMatrix={settings.salaryMatrix || []} onRefresh={refresh} />
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion
              expanded={activeTab === 3}
              onChange={() => setActiveTab(activeTab === 3 ? -1 : 3)}
              slotProps={{ transition: { unmountOnExit: true } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                  <CardGiftcardOutlined fontSize="small" sx={{ color: noxiaPalette.primary.main }} />
                  Valores Agregados y Topes
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {activeTab === 3 && (
                  <ValueAddedTab settings={settings} onRefresh={refresh} />
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion
              expanded={activeTab === 4}
              onChange={() => setActiveTab(activeTab === 4 ? -1 : 4)}
              slotProps={{ transition: { unmountOnExit: true } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                  <PaletteOutlined fontSize="small" sx={{ color: noxiaPalette.primary.main }} />
                  Plantillas e Identidad Empresarial
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {activeTab === 4 && (
                  <DocumentSkinTab
                    documentSkin={settings.documentSkin}
                    snippets={settings.textSnippets || []}
                    onRefresh={refresh}
                  />
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion
              expanded={activeTab === 5}
              onChange={() => setActiveTab(activeTab === 5 ? -1 : 5)}
              slotProps={{ transition: { unmountOnExit: true } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                  <SendTimeExtensionOutlined fontSize="small" sx={{ color: noxiaPalette.primary.main }} />
                  Notificar Departamentos
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {activeTab === 5 && (
                  <DistributionMatrixTab
                    recipients={settings.distributionRecipients || []}
                    onRefresh={refresh}
                  />
                )}
              </AccordionDetails>
            </Accordion>
          </Box>
        ) : (
          /* Desktop: Arquetipo E (Master-Detail con Tabs Verticales fijas de 260px) */
          <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
            {/* Columna Izquierda: Tabs Verticales */}
            <Paper
              elevation={0}
              sx={{
                width: 260,
                minWidth: 260,
                borderRadius: 3,
                border: "1px solid rgba(0,0,0,0.08)",
                bgcolor: "#FFFFFF",
                overflow: "hidden",
                position: "sticky",
                top: 80,
              }}
            >
              <Tabs
                orientation="vertical"
                value={desktopTabValue}
                onChange={handleTabChange}
                sx={{
                  borderRight: 1,
                  borderColor: "divider",
                  "& .MuiTab-root": {
                    alignItems: "center",
                    justifyContent: "flex-start",
                    textAlign: "left",
                    py: 1.8,
                    px: 2,
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    textTransform: "none",
                    gap: 1.5,
                    borderRight: "3px solid transparent",
                    transition: "all 0.15s ease",
                    "&.Mui-selected": {
                      color: noxiaPalette.primary.main,
                      bgcolor: `${noxiaPalette.primary.main}0D`,
                      borderRight: `3px solid ${noxiaPalette.primary.main}`,
                    },
                    "&:hover": {
                      bgcolor: "rgba(0,0,0,0.02)",
                    },
                  },
                }}
              >
                {TAB_CONFIG.map((t, idx) => (
                  <Tab
                    key={idx}
                    icon={t.icon}
                    iconPosition="start"
                    label={t.label}
                  />
                ))}
              </Tabs>
            </Paper>

            {/* Columna Derecha: Contenido Detalle de la Pestaña Activa */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {desktopTabValue === 0 && (
                <TariffPeriodsTab periods={settings.tariffPeriods || []} onRefresh={refresh} />
              )}
              {desktopTabValue === 1 && (
                <ServiceCatalogTab services={settings.serviceCatalog || []} onRefresh={refresh} />
              )}
              {desktopTabValue === 2 && (
                <SalaryMatrixTab salaryMatrix={settings.salaryMatrix || []} onRefresh={refresh} />
              )}
              {desktopTabValue === 3 && (
                <ValueAddedTab settings={settings} onRefresh={refresh} />
              )}
              {desktopTabValue === 4 && (
                <DocumentSkinTab
                  documentSkin={settings.documentSkin}
                  snippets={settings.textSnippets || []}
                  onRefresh={refresh}
                />
              )}
              {desktopTabValue === 5 && (
                <DistributionMatrixTab
                  recipients={settings.distributionRecipients || []}
                  onRefresh={refresh}
                />
              )}
            </Box>
          </Box>
        )
      ) : null}
    </Box>
  );
}
