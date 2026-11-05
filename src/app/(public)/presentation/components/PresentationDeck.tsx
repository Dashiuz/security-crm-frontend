"use client";

import React, { useEffect, useRef, useState } from "react";
import "../presentation.css";

// 19 Flat, Sequential Slides following the complete Executive Storyline
import Slide00Hero from "./slides/Slide00Hero";
import Slide01Ecosystem from "./slides/Slide01Ecosystem";
import Slide02Synergy from "./slides/Slide02Synergy";
import Slide01PainPoints from "./slides/Slide01PainPoints";
import Slide02Evolution from "./slides/Slide02Evolution";
import Slide03Architecture from "./slides/Slide03Architecture";
import Slide05Commercial from "./slides/Slide05Commercial";
import Slide05SubTariffDemo from "./slides/Slide05SubTariffDemo";
import Slide04Rrhh from "./slides/Slide04Rrhh";
import Slide04Operations from "./slides/Slide04Operations";
import Slide04SubVisitors from "./slides/Slide04SubVisitors";
import Slide04SubCanva from "./slides/Slide04SubCanva";
import Slide06OtherAreas from "./slides/Slide06OtherAreas";
import Slide06Payroll from "./slides/Slide06Payroll";
import Slide06SubCompliance from "./slides/Slide06SubCompliance";
import Slide07Tools from "./slides/Slide07Tools";
import Slide07SubCodesDemo from "./slides/Slide07SubCodesDemo";
import Slide08Roadmap from "./slides/Slide08Roadmap";
import Slide09RoiAndCta from "./slides/Slide09RoiAndCta";

// Floating HUD Controls & Executive Grid Overview
import PresentationHud, { RevealDeckApi } from "./PresentationHud";
import PresentationGridModal from "./PresentationGridModal";

interface RevealInstance extends RevealDeckApi {
  initialize: () => Promise<void>;
  destroy: () => void;
  getIndices: () => { h?: number; v?: number };
  getTotalSlides?: () => number;
  on: (event: string, callback: () => void) => void;
}

export default function PresentationDeck() {
  const deckRef = useRef<HTMLDivElement>(null);
  const [deckInstance, setDeckInstance] = useState<RevealInstance | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(1);
  const [totalSlidesCount, setTotalSlidesCount] = useState(19);
  const [isGridOpen, setIsGridOpen] = useState(false);

  // Global keyboard shortcuts for Grid View (Esc, O, o)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "o" || e.key === "O") {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
          return;
        }
        e.preventDefault();
        setIsGridOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let deck: RevealInstance | null = null;

    async function initReveal() {
      if (!deckRef.current) return;

      try {
        const Reveal = (await import("reveal.js")).default;

        const instance = new Reveal(deckRef.current, {
          width: "100%",
          height: "100%",
          margin: 0,
          minScale: 1,
          maxScale: 1,
          hash: true,
          controls: false, // Tactical HUD replaces default controls
          progress: true,
          slideNumber: false,
          history: true,
          overview: false, // Replaced by high-impact React PresentationGridModal
          center: false,
          touch: true,
          transition: "slide",
          backgroundTransition: "fade",
          pdfSeparateFragments: false,
          embedded: false,
          keyboard: {
            27: () => {}, // Let Esc be handled by React PresentationGridModal
          },
        });

        deck = instance as unknown as RevealInstance;
        await deck.initialize();
        setDeckInstance(deck);

        const updateState = () => {
          if (!deck) return;
          const indices = deck.getIndices();
          // Horizontal slide count + 1 for user-facing count (1..19)
          setCurrentSlideIndex((indices?.h || 0) + 1);

          if (deck.getTotalSlides) {
            setTotalSlidesCount(deck.getTotalSlides());
          }
        };

        deck.on("slidechanged", updateState);
        deck.on("overviewshown", updateState);
        deck.on("overviewhidden", updateState);

        // Initial state update
        updateState();
      } catch (err) {
        console.error("Error al inicializar Reveal.js:", err);
      }
    }

    initReveal();

    return () => {
      try {
        if (deck && typeof deck.destroy === "function") {
          deck.destroy();
        }
      } catch (e) {
        console.warn("Reveal destroy error:", e);
      }
    };
  }, []);

  const handleSelectSlide = (slideIndex: number) => {
    if (deckInstance) {
      deckInstance.slide(slideIndex, 0);
    }
    setIsGridOpen(false);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Reveal container */}
      <div className="reveal" ref={deckRef} style={{ width: "100%", height: "100%" }}>
        <div className="slides">
          {/* 01. Portada */}
          <Slide00Hero />

          {/* 02. Tres Partes que Forman un Todo (Clientes Externos, Internos, Administración + Direcciones y Gerencias) */}
          <Slide01Ecosystem />

          {/* 03. Unión de Áreas: Comercial, RRHH y Operaciones + Apoyo Transversal */}
          <Slide02Synergy />

          {/* 04. Los 4 Dolores de Cabeza del Sector */}
          <Slide01PainPoints />

          {/* 05. La Historia de Loro ERP */}
          <Slide02Evolution />

          {/* 06. Seguridad y Tranquilidad con sus Datos */}
          <Slide03Architecture />

          {/* 07. Desde Comercial: Lo que Vendo ya no es una Promesa, es una Realidad */}
          <Slide05Commercial />

          {/* 08. Simulador Interactivo de Rentabilidad y Tarifas */}
          <Slide05SubTariffDemo />

          {/* 09. Desde RRHH: Su Propia "Tienda de Guardas", Filtros y Cero Papel */}
          <Slide04Rrhh />

          {/* 10. Desde Operaciones: Novedades desde el Minuto Cero, Capacitación y Alertas Críticas */}
          <Slide04Operations />

          {/* 11. Control de Visitantes y Paquetería con Evidencia en Foto */}
          <Slide04SubVisitors />

          {/* 12. Estudios de Seguridad con Mapas Satelitales y Cámaras */}
          <Slide04SubCanva />

          {/* 13. Las Demás Áreas: Información al Instante, Historial Completo y Cero Reprocesos */}
          <Slide06OtherAreas />

          {/* 14. Nómina Especializada 24/7 y Programaciones Dinámicas (Ley 2101) */}
          <Slide06Payroll />

          {/* 15. Cumplimiento con SuperVigilancia RENOVA, DIAN y UGPP */}
          <Slide06SubCompliance />

          {/* 16. Herramientas: Firmas en el Celular, Códigos QR y Formatos */}
          <Slide07Tools />

          {/* 17. Generador de Códigos QR y de Barras en Vivo */}
          <Slide07SubCodesDemo />

          {/* 18. Novedades y Módulos en Desarrollo */}
          <Slide08Roadmap />

          {/* 19. Beneficios Reales para Direcciones y Gerencias */}
          <Slide09RoiAndCta />
        </div>
      </div>

      {/* Floating Tactical HUD */}
      {deckInstance && (
        <PresentationHud
          deck={deckInstance}
          currentSlide={currentSlideIndex}
          totalSlides={totalSlidesCount}
          onToggleGrid={() => setIsGridOpen((prev) => !prev)}
          isGridOpen={isGridOpen}
          onCloseGrid={() => setIsGridOpen(false)}
        />
      )}

      {/* Fullscreen Executive Grid Modal */}
      <PresentationGridModal
        isOpen={isGridOpen}
        currentSlide={currentSlideIndex}
        onSelectSlide={handleSelectSlide}
        onClose={() => setIsGridOpen(false)}
      />
    </div>
  );
}
