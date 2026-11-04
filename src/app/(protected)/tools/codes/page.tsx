"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Breadcrumbs,
  Link as MuiLink,
  Tabs,
  Tab,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Home as HomeIcon,
  Build as ToolsIcon,
  Dashboard as HubIcon,
  AddCircleOutline as SingleIcon,
  DynamicFeed as BatchIcon,
  TableChart as CatalogIcon,
  Print as PrintIcon,
  CameraAlt as ScannerIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CodesHubDashboard from "./components/CodesHubDashboard";
import SingleCodeSpoke from "./components/SingleCodeSpoke";
import BatchCodeSpoke from "./components/BatchCodeSpoke";
import CatalogTableSpoke from "./components/CatalogTableSpoke";
import PrintStationSpoke from "./components/PrintStationSpoke";
import QuickScannerDialog from "./components/QuickScannerDialog";
import { UniversalCode, CodeType } from "@/lib/api/universal-codes";

type SpokeTab = "hub" | "single" | "batch" | "catalog" | "print";

function UniversalCodesModuleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Spoke activo desde URL o default 'hub'
  const spokeParam = (searchParams.get("spoke") as SpokeTab) || "hub";
  const typeParam = (searchParams.get("type") as CodeType) || "QR_CODE";
  const initialBatchId = searchParams.get("batchId") || "";
  const initialSearch = searchParams.get("search") || "";

  const [activeTab, setActiveTab] = useState<SpokeTab>(
    searchParams.get("type") ? "single" : spokeParam
  );

  // Estado compartido para enviar códigos a la Estación de Impresión
  const [codesToPrint, setCodesToPrint] = useState<UniversalCode[]>([]);
  const [printBatchId, setPrintBatchId] = useState<string>(initialBatchId);

  // Búsqueda y Lote sincronizados para el Catálogo Maestro
  const [activeCatalogSearch, setActiveCatalogSearch] = useState<string>(initialSearch);
  const [activeCatalogBatch, setActiveCatalogBatch] = useState<string>(initialBatchId);

  // Escáner Rápido Dialog
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("type")) {
      setActiveTab("single");
    } else if (searchParams.get("spoke")) {
      setActiveTab(searchParams.get("spoke") as SpokeTab);
    }
    const s = searchParams.get("search");
    if (s !== null) {
      setActiveCatalogSearch(s);
    }
    const b = searchParams.get("batchId");
    if (b !== null) {
      setActiveCatalogBatch(b);
    }
  }, [searchParams]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: SpokeTab) => {
    setActiveTab(newValue);
    router.push(`/tools/codes?spoke=${newValue}`, { scroll: false });
  };

  const handleNavigateSpoke = (spoke: SpokeTab, extra?: Record<string, string>) => {
    setActiveTab(spoke);
    if (extra?.search !== undefined) {
      setActiveCatalogSearch(extra.search);
    }
    if (extra?.batchId !== undefined) {
      setActiveCatalogBatch(extra.batchId);
    }
    const query = new URLSearchParams({ spoke });
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => query.append(k, v));
    }
    router.push(`/tools/codes?${query.toString()}`, { scroll: false });
  };

  const handleSendSingleToPrint = (code: UniversalCode) => {
    setCodesToPrint([code]);
    setActiveTab("print");
    router.push("/tools/codes?spoke=print", { scroll: false });
  };

  const handleSendBatchToPrint = (batchId: string, codes: UniversalCode[]) => {
    setPrintBatchId(batchId);
    setCodesToPrint(codes);
    setActiveTab("print");
    router.push(`/tools/codes?spoke=print&batchId=${encodeURIComponent(batchId)}`, { scroll: false });
  };

  const handleSendSelectionToPrint = (codes: UniversalCode[]) => {
    setCodesToPrint(codes);
    setActiveTab("print");
    router.push("/tools/codes?spoke=print", { scroll: false });
  };

  return (
    <Box sx={{ py: 3, px: { xs: 2, sm: 3, md: 4 }, minHeight: "100vh" }}>
      {/* Migas de Pan (Breadcrumbs) */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink
          component={Link}
          href="/dashboard"
          underline="hover"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <HomeIcon fontSize="inherit" />
          Inicio
        </MuiLink>
        <Typography color="inherit" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <ToolsIcon fontSize="inherit" />
          Herramientas
        </Typography>
        <Typography color="text.primary" sx={{ fontWeight: 700 }}>
          Códigos QR y de Barras
        </Typography>
      </Breadcrumbs>

      {/* Encabezado del Módulo con Acción de Escáner */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
            Centro de Códigos QR y Barras
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión por lote y estación de impresión física.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<ScannerIcon />}
          onClick={() => setScannerOpen(true)}
          sx={{
            borderRadius: 2.5,
            px: 2.5,
            py: 1.2,
            fontWeight: 800,
            textTransform: "none",
            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.25)",
          }}
        >
          Lector / Escáner Rápido
        </Button>
      </Stack>

      {/* Pestañas de Navegación Hub & Spoke */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3.5 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              py: 1.5,
              minHeight: 48,
            },
          }}
        >
          <Tab
            value="hub"
            label="Centro de Control"
            icon={<HubIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            value="single"
            label="Emisión Individual"
            icon={<SingleIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            value="batch"
            label="Emisión por Lote"
            icon={<BatchIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            value="catalog"
            label="Catálogo Maestro"
            icon={<CatalogIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            value="print"
            label="Estación de Impresión"
            icon={<PrintIcon fontSize="small" />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Renderizado del Spoke Activo */}
      {activeTab === "hub" && (
        <CodesHubDashboard
          onNavigateSpoke={handleNavigateSpoke}
          onOpenScanner={() => setScannerOpen(true)}
        />
      )}

      {activeTab === "single" && (
        <SingleCodeSpoke
          initialType={typeParam}
          onSendToPrintStation={handleSendSingleToPrint}
        />
      )}

      {activeTab === "batch" && (
        <BatchCodeSpoke
          initialBatchId={initialBatchId}
          onSendBatchToPrintStation={handleSendBatchToPrint}
        />
      )}

      {activeTab === "catalog" && (
        <CatalogTableSpoke
          initialSearch={activeCatalogSearch}
          initialBatchId={activeCatalogBatch}
          onSendToPrintStation={handleSendSelectionToPrint}
        />
      )}

      {activeTab === "print" && (
        <PrintStationSpoke
          initialCodes={codesToPrint}
          initialBatchId={printBatchId}
        />
      )}

      {/* Diálogo de Escaneo Rápido (Pistola USB y Cámara) */}
      <QuickScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSelectCode={(code) => {
          handleNavigateSpoke("catalog", { search: code.code });
        }}
      />
    </Box>
  );
}

export default function UniversalCodesModulePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
          <CircularProgress size={36} />
        </Box>
      }
    >
      <UniversalCodesModuleContent />
    </Suspense>
  );
}

