"use client";

import React, { useEffect, useState } from "react";
import { Tooltip } from "@mui/material";
import {
  ArrowBack as PrevIcon,
  ArrowForward as NextIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  GridView as GridIcon,
  Timer as TimerIcon,
  PictureAsPdf as PdfIcon,
  RestartAlt as ResetIcon,
} from "@mui/icons-material";

export interface RevealDeckApi {
  prev: () => void;
  next: () => void;
  slide: (h: number, v?: number) => void;
  toggleOverview?: () => void;
  isOverview?: () => boolean;
}

interface PresentationHudProps {
  deck: RevealDeckApi;
  currentSlide: number;
  totalSlides: number;
  onToggleGrid?: () => void;
  isGridOpen?: boolean;
  onCloseGrid?: () => void;
}

export default function PresentationHud({
  deck,
  currentSlide,
  totalSlides,
  onToggleGrid,
  isGridOpen = false,
  onCloseGrid,
}: PresentationHudProps) {
  const [seconds, setSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handlePrintPdf = () => {
    // If in grid overview mode, close it first
    if (onCloseGrid) {
      onCloseGrid();
    }
    if (deck?.isOverview && deck.isOverview()) {
      deck.toggleOverview?.();
    }
    // Blur active element so any open MUI tooltip immediately disappears
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Give browser a micro-tick to render then open print dialog
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div className="presentation-hud">
      {/* Timer (Desktop / Tablet) */}
      <div className="hud-desktop-only">
        <Tooltip title="Tiempo de presentación" arrow>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: "#A78BFA",
              fontSize: 13,
              fontFamily: "monospace",
              padding: "0 6px",
            }}
          >
            <TimerIcon sx={{ fontSize: 16 }} />
            <span>{formatTimer(seconds)}</span>
          </div>
        </Tooltip>
        <div className="hud-divider" />
      </div>

      {/* Navigation: Prev / Next */}
      <Tooltip title="Anterior diapositiva (Flecha Izquierda)" arrow>
        <button
          className="hud-btn"
          onClick={() => deck?.prev()}
          aria-label="Anterior diapositiva"
        >
          <PrevIcon sx={{ fontSize: 18 }} />
        </button>
      </Tooltip>

      <Tooltip title="Siguiente diapositiva (Flecha Derecha / Espacio)" arrow>
        <button
          className="hud-btn"
          onClick={() => deck?.next()}
          aria-label="Siguiente diapositiva"
        >
          <NextIcon sx={{ fontSize: 18 }} />
        </button>
      </Tooltip>

      <div className="hud-divider" />

      {/* Slide Counter */}
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          fontWeight: 700,
          color: "#E2E8F0",
          padding: "0 6px",
        }}
      >
        {currentSlide} / {totalSlides}
      </span>

      <div className="hud-divider" />

      {/* Overview Grid (Esc) */}
      <Tooltip title="Ver todas las diapositivas en cuadrícula (Tecla Esc)" arrow>
        <button
          className={`hud-btn ${isGridOpen ? "active" : ""}`}
          onClick={() => {
            if (onToggleGrid) {
              onToggleGrid();
            } else if (deck?.toggleOverview) {
              deck.toggleOverview();
            }
          }}
          aria-label="Vista en cuadrícula"
        >
          <GridIcon sx={{ fontSize: 18 }} />
        </button>
      </Tooltip>

      {/* Fullscreen (F) (Desktop / Tablet) */}
      <div className="hud-desktop-only">
        <Tooltip title="Pantalla Completa (Tecla F)" arrow>
          <button
            className="hud-btn"
            onClick={toggleFullscreen}
            aria-label="Pantalla completa"
          >
            {isFullscreen ? (
              <FullscreenExitIcon sx={{ fontSize: 18 }} />
            ) : (
              <FullscreenIcon sx={{ fontSize: 18 }} />
            )}
          </button>
        </Tooltip>
      </div>

      {/* Direct PDF Print */}
      <Tooltip title="Guardar / Imprimir en PDF" arrow>
        <button
          className="hud-btn"
          onClick={handlePrintPdf}
          aria-label="Imprimir a PDF"
        >
          <PdfIcon sx={{ fontSize: 18, color: "#34D399" }} />
        </button>
      </Tooltip>

      {/* Reset to Start (Desktop / Tablet) */}
      <div className="hud-desktop-only">
        <Tooltip title="Volver al Inicio" arrow>
          <button
            className="hud-btn"
            onClick={() => deck?.slide(0, 0)}
            aria-label="Volver a la portada"
          >
            <ResetIcon sx={{ fontSize: 18 }} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
