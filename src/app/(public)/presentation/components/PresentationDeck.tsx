"use client";

import React, { useEffect, useRef, useState } from "react";
import "../presentation.css";

// 15 Flat, Sequential Slides (Softened executive language, zero vertical nesting)
import Slide00Hero from "./slides/Slide00Hero";
import Slide01PainPoints from "./slides/Slide01PainPoints";
import Slide02Evolution from "./slides/Slide02Evolution";
import Slide03Architecture from "./slides/Slide03Architecture";
import Slide04Operations from "./slides/Slide04Operations";
import Slide04SubVisitors from "./slides/Slide04SubVisitors";
import Slide04SubCanva from "./slides/Slide04SubCanva";
import Slide05Commercial from "./slides/Slide05Commercial";
import Slide05SubTariffDemo from "./slides/Slide05SubTariffDemo";
import Slide06Payroll from "./slides/Slide06Payroll";
import Slide06SubCompliance from "./slides/Slide06SubCompliance";
import Slide07Tools from "./slides/Slide07Tools";
import Slide07SubCodesDemo from "./slides/Slide07SubCodesDemo";
import Slide08Roadmap from "./slides/Slide08Roadmap";
import Slide09RoiAndCta from "./slides/Slide09RoiAndCta";

// Floating HUD Controls
import PresentationHud from "./PresentationHud";

export default function PresentationDeck() {
  const deckRef = useRef<HTMLDivElement>(null);
  const [deckInstance, setDeckInstance] = useState<any>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(1);
  const [totalSlidesCount, setTotalSlidesCount] = useState(15);

  useEffect(() => {
    let deck: any = null;

    async function initReveal() {
      if (!deckRef.current) return;

      try {
        const Reveal = (await import("reveal.js")).default;

        deck = new Reveal(deckRef.current, {
          width: 1280,
          height: 720,
          margin: 0.04,
          minScale: 0.2,
          maxScale: 2.0,
          hash: true,
          controls: false, // Tactical HUD replaces default controls
          progress: true,
          slideNumber: false,
          history: true,
          overview: true,
          center: false,
          touch: true,
          transition: "slide",
          backgroundTransition: "fade",
          pdfSeparateFragments: false,
          embedded: false,
        });

        await deck.initialize();
        setDeckInstance(deck);

        const updateState = () => {
          if (!deck) return;
          const indices = deck.getIndices();
          // Horizontal slide count + 1 for user-facing count (1..15)
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

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Reveal container */}
      <div className="reveal" ref={deckRef} style={{ width: "100%", height: "100%" }}>
        <div className="slides">
          {/* 01. Portada */}
          <Slide00Hero />

          {/* 02. Los 4 Dolores de Cabeza */}
          <Slide01PainPoints />

          {/* 03. La Historia de Loro ERP */}
          <Slide02Evolution />

          {/* 04. Seguridad y Tranquilidad con sus Datos */}
          <Slide03Architecture />

          {/* 05. Operación en Porterías y Minutas con Voz */}
          <Slide04Operations />

          {/* 06. Visitantes y Paquetería con Evidencia en Foto */}
          <Slide04SubVisitors />

          {/* 07. Mapas Satelitales y Ubicación de Cámaras */}
          <Slide04SubCanva />

          {/* 08. Cotizaciones con Tarifas de Ley 2026 */}
          <Slide05Commercial />

          {/* 09. Simulador Interactivo de Tarifas */}
          <Slide05SubTariffDemo />

          {/* 10. Nómina Especializada 24/7 y Ley 2101 */}
          <Slide06Payroll />

          {/* 11. Cumplimiento con SuperVigilancia RENOVA y DIAN */}
          <Slide06SubCompliance />

          {/* 12. Herramientas: Firmas, Carnés y Formatos */}
          <Slide07Tools />

          {/* 13. Generador de Códigos QR y de Barras en Vivo */}
          <Slide07SubCodesDemo />

          {/* 14. Novedades y Módulos en Desarrollo */}
          <Slide08Roadmap />

          {/* 15. Beneficios Reales y Cómo Empezar */}
          <Slide09RoiAndCta />
        </div>
      </div>

      {/* Floating Tactical HUD */}
      {deckInstance && (
        <PresentationHud
          deck={deckInstance}
          currentSlide={currentSlideIndex}
          totalSlides={totalSlidesCount}
        />
      )}
    </div>
  );
}
