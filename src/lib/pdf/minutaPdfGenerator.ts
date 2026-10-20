import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import { Tenant } from "@/lib/api/auth";
import { getPriorityInfo } from "@/lib/formatters";

export interface MinutaReportFilterOptions {
  startDate?: string;
  endDate?: string;
  clientName?: string;
  category?: string;
}

export interface SingleSheetOptions {
  minuta: any;
  tenant: Tenant | null;
  photoUrls?: string[];
}

export interface RangeReportOptions {
  minutas: any[];
  tenant: Tenant | null;
  filters?: MinutaReportFilterOptions;
}

export interface LoadedImageInfo {
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Calculates proportional rendering dimensions (object-fit: contain)
 * within a given bounding box [maxW, maxH], strictly preserving original aspect ratio.
 */
function fitDimensions(
  aspectRatio: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  const safeRatio = aspectRatio > 0 ? aspectRatio : 4 / 3;
  let width = maxW;
  let height = maxW / safeRatio;

  if (height > maxH) {
    height = maxH;
    width = maxH * safeRatio;
  }

  return { width, height };
}

/**
 * Normalizes an image data URL to a clean, well-encoded JPEG data URL via off-screen canvas.
 * This guarantees format compatibility with jsPDF (even if the source was PNG, WebP, etc.),
 * ensures alpha transparency is composited cleanly on a white background, and preserves
 * the exact natural aspect ratio of the image.
 */
async function convertDataUrlToJpeg(dataUrl: string): Promise<LoadedImageInfo | null> {
  if (typeof window === "undefined") {
    return { dataUrl, width: 800, height: 600, aspectRatio: 4 / 3 };
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const origW = img.naturalWidth || img.width || 800;
        const origH = img.naturalHeight || img.height || 600;
        const aspectRatio = origW / Math.max(origH, 1);

        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let w = origW;
        let h = origH;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ dataUrl, width: origW, height: origH, aspectRatio });
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve({
          dataUrl: canvas.toDataURL("image/jpeg", 0.9),
          width: origW,
          height: origH,
          aspectRatio,
        });
      } catch {
        resolve({ dataUrl, width: 800, height: 600, aspectRatio: 4 / 3 });
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/**
 * Safely loads an image URL (such as an S3 Presigned URL) into a clean Base64 JPEG string
 * along with its native aspect ratio and dimensions.
 * Uses a resilient fallback strategy:
 * 1. If already data URL -> normalize to JPEG
 * 2. Direct browser fetch with mode: 'cors'
 * 3. Server-side proxy route (/api/proxy-image) to bypass browser CORS restrictions
 */
async function loadImageAsBase64(url: string): Promise<LoadedImageInfo | null> {
  if (!url) return null;

  try {
    // 1. Data URL
    if (url.startsWith("data:")) {
      return await convertDataUrlToJpeg(url);
    }

    // 2. Direct browser fetch
    try {
      const res = await fetch(url, { mode: "cors" });
      if (res.ok) {
        const blob = await res.blob();
        const rawDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (rawDataUrl) {
          const converted = await convertDataUrlToJpeg(rawDataUrl);
          if (converted) return converted;
        }
      }
    } catch {
      // Direct fetch failed (blocked by CORS on port 3001, mobile, LAN, etc.)
    }

    // 3. Fallback via Next.js Proxy Route
    try {
      const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (json?.dataUrl) {
          const converted = await convertDataUrlToJpeg(json.dataUrl);
          if (converted) return converted;
        }
      }
    } catch (proxyErr) {
      console.warn("Proxy image fetch failed:", proxyErr);
    }

    return null;
  } catch (err) {
    console.error("loadImageAsBase64 failed:", err);
    return null;
  }
}

/**
 * Hex to RGB helper
 */
function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [124, 58, 237]; // default Noxia Royal Violet (#7C3AED)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Generates a consolidated tabular report for a date range / list of Minutas
 */
export async function generateMinutaRangePdf(options: RangeReportOptions): Promise<void> {
  const { minutas, tenant, filters } = options;
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const rawPrimary = tenant?.primaryColor;
  const isLegacyGreen =
    rawPrimary === "#224229" ||
    rawPrimary === "#1b3a26" ||
    rawPrimary === "#1976d2";
  const primaryHex = rawPrimary && !isLegacyGreen ? rawPrimary : "#7C3AED";
  const primaryRgb = hexToRgb(primaryHex);

  // Load tenant logo if available
  let logoInfo: LoadedImageInfo | null = null;
  if (tenant?.logoUrl) {
    logoInfo = await loadImageAsBase64(tenant.logoUrl);
  }

  // --- Header ---
  const headerY = 12;
  const maxLogoW = 28;
  const maxLogoH = 14;
  let textStartX = 14;

  if (logoInfo) {
    try {
      const fittedLogo = fitDimensions(logoInfo.aspectRatio, maxLogoW, maxLogoH);
      const logoY = headerY + (maxLogoH - fittedLogo.height) / 2;
      doc.addImage(logoInfo.dataUrl, "JPEG", 14, logoY, fittedLogo.width, fittedLogo.height, undefined, "FAST");
      textStartX = 14 + fittedLogo.width + 4;
    } catch {
      // Ignorar fallo de imagen si formato inválido
    }
  }

  // Legal name & Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  const companyName = tenant?.profile?.legalName || tenant?.name || "SISTEMA DE SEGURIDAD PRIVADA";
  doc.text(companyName.toUpperCase(), textStartX, headerY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const nitText = tenant?.profile?.taxId ? `NIT: ${tenant.profile.taxId} | ` : "";
  const phoneText = tenant?.profile?.contactPhone ? `Tel: ${tenant.profile.contactPhone} | ` : "";
  doc.text(`${nitText}${phoneText}Control Operativo de Minuta General`, textStartX, headerY + 9);

  // Metadata Right Column
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const emitDate = dayjs().format("DD/MM/YYYY HH:mm:ss");
  doc.text(`Fecha Emisión: ${emitDate}`, pageWidth - 14, headerY + 4, { align: "right" });
  doc.text(`Total Registros: ${minutas.length}`, pageWidth - 14, headerY + 9, { align: "right" });

  // Filter Sub-banner
  const bannerY = headerY + 16;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, bannerY, pageWidth - 28, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const sedeFilter = filters?.clientName || "Todas las sedes";
  const startF = filters?.startDate ? dayjs(filters.startDate).format("DD/MM/YYYY") : "Inicio";
  const endF = filters?.endDate ? dayjs(filters.endDate).format("DD/MM/YYYY") : "Actualidad";

  doc.text(`FILTROS APLICADOS: Sede: ${sedeFilter} | Rango: ${startF} al ${endF}`, 18, bannerY + 5.2);

  // --- Table Rows Preparation ---
  const tableRows = minutas.map((m, idx) => {
    const occurred = m.occurredAt || m.date;
    const dateFormatted = occurred ? dayjs(occurred).format("DD/MM/YYYY HH:mm") : "-";
    const prio = getPriorityInfo(m.priority || 3);

    return [
      idx + 1,
      dateFormatted,
      m.clientName || "General",
      m.guardPost || "Puesto Ppal",
      m.unitName || m.residentName || "-",
      m.category || "GENERAL",
      prio.label.toUpperCase(),
      m.annotation || "-",
      m.createdBy || "Personal de Turno",
    ];
  });

  // --- AutoTable ---
  autoTable(doc, {
    startY: bannerY + 11,
    margin: { left: 14, right: 14, bottom: 16 },
    head: [
      [
        "#",
        "Fecha / Hora",
        "Sede / Cliente",
        "Puesto",
        "Ubicación / Residente",
        "Categoría",
        "Prioridad",
        "Anotación / Novedad",
        "Reportado por",
      ],
    ],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: primaryRgb,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      cellPadding: 2.5,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      overflow: "linebreak",
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 24, halign: "center" },
      2: { cellWidth: 28 },
      3: { cellWidth: 24 },
      4: { cellWidth: 24 },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 18, halign: "center" },
      7: { cellWidth: "auto" },
      8: { cellWidth: 28 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      // Footer on every page
      const current = data.pageNumber;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);

      doc.text(
        "Documento oficial de control de minuta de seguridad - Confidencial y reservado",
        14,
        pageHeight - 6
      );
      doc.text(
        `Página ${current}`,
        pageWidth - 14,
        pageHeight - 6,
        { align: "right" }
      );
    },
  });

  const filename = `Reporte_Minuta_${filters?.clientName ? filters.clientName.replace(/\s+/g, "_") : "General"}_${dayjs().format("YYYYMMDD_HHmm")}.pdf`;
  doc.save(filename);
}

/**
 * Generates an official single incident sheet (Ficha de Registro / Novedad)
 * with embedded photos, timeline, detailed narrative, and signature blocks.
 */
export async function generateMinutaSingleSheetPdf(options: SingleSheetOptions): Promise<void> {
  const { minuta, tenant, photoUrls = [] } = options;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Severity color calculation (aligned with official Noxia Operational Palette)
  const priority = Number(minuta.priority) || 3;
  let severityRgb: [number, number, number] = [79, 70, 229]; // Media / Ordinaria: Noxia Iris (#4F46E5)
  let severityLabel = "MEDIA / ORDINARIA";

  if (priority === 5) {
    severityRgb = [225, 29, 72]; // Crítica / Pánico: Noxia Rose (#E11D48)
    severityLabel = "CRÍTICA / EMERGENCIA OPERATIVA";
  } else if (priority === 4) {
    severityRgb = [217, 119, 6]; // Alta / Novedad: Noxia Amber (#D97706)
    severityLabel = "ALTA SEVERIDAD";
  } else if (priority <= 2) {
    severityRgb = [5, 150, 105]; // Baja / Informativa: Noxia Emerald (#059669)
    severityLabel = "BAJA / INFORMATIVA";
  }

  // Load logo if available
  let logoInfo: LoadedImageInfo | null = null;
  if (tenant?.logoUrl) {
    logoInfo = await loadImageAsBase64(tenant.logoUrl);
  }

  // 1. Top Severity Banner
  doc.setFillColor(...severityRgb);
  doc.rect(0, 0, pageWidth, 5, "F");

  // 2. Company & Header Block
  let currentY = 12;
  const maxLogoW = 30;
  const maxLogoH = 14;
  let textStartX = margin;

  if (logoInfo) {
    try {
      const fittedLogo = fitDimensions(logoInfo.aspectRatio, maxLogoW, maxLogoH);
      const logoY = currentY + (maxLogoH - fittedLogo.height) / 2;
      doc.addImage(logoInfo.dataUrl, "JPEG", margin, logoY, fittedLogo.width, fittedLogo.height, undefined, "FAST");
      textStartX = margin + fittedLogo.width + 4;
    } catch {
      // Ignorar fallback
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  const companyName = tenant?.profile?.legalName || tenant?.name || "EMPRESA DE SEGURIDAD PRIVADA";
  doc.text(companyName.toUpperCase(), textStartX, currentY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const nitLine = tenant?.profile?.taxId ? `NIT: ${tenant.profile.taxId} | ` : "";
  const addressLine = tenant?.profile?.address ? `${tenant.profile.address} | ` : "";
  doc.text(`${nitLine}${addressLine}Departamento de Operaciones`, textStartX, currentY + 9);

  // Radicado / ID box right side
  const radicado = `RAD-${(minuta.id || "00000000").slice(-8).toUpperCase()}`;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pageWidth - margin - 50, currentY, 50, 14, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("RADICADO OFICIAL", pageWidth - margin - 25, currentY + 4.5, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(radicado, pageWidth - margin - 25, currentY + 10.5, { align: "center" });

  currentY += 19;

  // 3. Document Title with Severity Badge
  doc.setFillColor(...severityRgb);
  doc.roundedRect(margin, currentY, contentWidth, 8, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `FICHA DE REGISTRO DE MINUTA - NIVEL: ${severityLabel} (${priority}/5)`,
    pageWidth / 2,
    currentY + 5.5,
    { align: "center" }
  );

  currentY += 11;

  // 4. Data Matrix Table
  const occurredMoment = dayjs(minuta.occurredAt || minuta.date);
  const createdMoment = dayjs(minuta.createdAt);

  const detailGrid = [
    [
      { content: "Sede / Cliente:", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      minuta.clientName || "Operación General",
      { content: "Puesto / Ubicación:", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      minuta.guardPost || "Recepción / Portería Principal",
    ],
    [
      { content: "Fecha y Hora Suceso:", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      occurredMoment.format("DD/MM/YYYY HH:mm:ss"),
      { content: "Fecha de Registro:", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      createdMoment.format("DD/MM/YYYY HH:mm:ss"),
    ],
    [
      { content: "Guarda Reportante:", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      minuta.createdBy || "Personal de Turno",
      { content: "Cargo / Rol:", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      minuta.creatorPosition || "Guarda de Seguridad",
    ],
    [
      { content: "Categoría:", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      minuta.category || "GENERAL",
      { content: "Confidencial:", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      minuta.isConfidential ? "SÍ - USO RESTRINGIDO" : "NO",
    ],
    [
      { content: "Unidad / Inmueble:", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      minuta.unitName || "-",
      { content: "Residente / Vínculo:", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      minuta.residentName || minuta.noveltySource || "-",
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: detailGrid as any,
    theme: "grid",
    styles: {
      fontSize: 8.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 51 },
      2: { cellWidth: 40 },
      3: { cellWidth: 51 },
    },
  });

  const finalTableY = (doc as any).lastAutoTable.finalY || currentY + 40;
  currentY = finalTableY + 5;

  // 5. Detailed Annotation Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("DESCRIPCIÓN COMPLETA DE LOS HECHOS (ANOTACIÓN EN MINUTA):", margin, currentY);

  currentY += 3;
  const annotationText = minuta.annotation || "Sin descripción registrada.";
  const splitText = doc.splitTextToSize(annotationText, contentWidth - 8);
  const textHeight = Math.max(splitText.length * 4.5 + 8, 22);

  // If text would overflow beyond printable page before signatures, add page
  if (currentY + textHeight > pageHeight - 55) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, textHeight, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(splitText, margin + 4, currentY + 6);

  currentY += textHeight + 6;

  // 6. Photo Gallery Section (if photos are provided)
  const validPhotos = photoUrls.filter((u): u is string => Boolean(u));
  if (validPhotos.length > 0) {
    const cols = validPhotos.length === 1 ? 1 : validPhotos.length === 2 ? 2 : 3;
    const maxSlotWidth =
      validPhotos.length === 1
        ? 135
        : validPhotos.length === 2
        ? (contentWidth - 6) / 2
        : (contentWidth - 8) / 3;
    const maxSlotHeight = validPhotos.length === 1 ? 82 : validPhotos.length === 2 ? 64 : 48;
    const totalRows = Math.ceil(validPhotos.length / cols);
    const estimatedSectionHeight = totalRows * (maxSlotHeight + 10) + 14;

    if (currentY + estimatedSectionHeight > pageHeight - 38) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`EVIDENCIAS FOTOGRÁFICAS ADJUNTAS (${validPhotos.length}):`, margin, currentY);

    currentY += 4;

    for (let i = 0; i < validPhotos.length; i++) {
      const pUrl = validPhotos[i];
      const colIdx = i % cols;
      const rowIdx = Math.floor(i / cols);

      const slotX =
        validPhotos.length === 1
          ? margin + (contentWidth - maxSlotWidth) / 2
          : margin + colIdx * (maxSlotWidth + 4);

      const slotY = currentY + rowIdx * (maxSlotHeight + 10);

      // Check page overflow for second row if necessary
      if (slotY + maxSlotHeight > pageHeight - 38) {
        doc.addPage();
        currentY = 16;
      }

      try {
        const photoInfo = await loadImageAsBase64(pUrl);
        if (photoInfo) {
          // Strictly preserve natural aspect ratio
          const fitted = fitDimensions(photoInfo.aspectRatio, maxSlotWidth, maxSlotHeight);

          // Center image within the assigned slot
          const photoX = slotX + (maxSlotWidth - fitted.width) / 2;
          const photoY = slotY + (maxSlotHeight - fitted.height) / 2;

          doc.addImage(photoInfo.dataUrl, "JPEG", photoX, photoY, fitted.width, fitted.height, undefined, "FAST");
          doc.setDrawColor(203, 213, 225);
          doc.rect(photoX, photoY, fitted.width, fitted.height, "S");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(`Foto #${i + 1} - Evidencia`, photoX + 2, photoY + fitted.height + 3.5);
        }
      } catch (photoErr) {
        console.warn(`Error al renderizar foto #${i + 1} en PDF:`, photoErr);
      }
    }

    currentY += totalRows * (maxSlotHeight + 10) + 4;
  }

  // 7. Signature Blocks
  // Ensure enough room for signatures (need at least 32mm)
  if (currentY > pageHeight - 38) {
    doc.addPage();
    currentY = 24;
  }

  const sigBoxWidth = (contentWidth - 10) / 2;
  const sigBoxHeight = 26;

  // Signature Guarda
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, sigBoxWidth, sigBoxHeight, "S");
  doc.line(margin + 8, currentY + 16, margin + sigBoxWidth - 8, currentY + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("FIRMA DEL GUARDA DE TURNO", margin + sigBoxWidth / 2, currentY + 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(minuta.createdBy || "Guarda Operativo", margin + sigBoxWidth / 2, currentY + 23.5, { align: "center" });

  // Signature Supervisor
  doc.rect(margin + sigBoxWidth + 10, currentY, sigBoxWidth, sigBoxHeight, "S");
  doc.line(margin + sigBoxWidth + 18, currentY + 16, margin + contentWidth - 8, currentY + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("SUPERVISOR / COORDINADOR RECEPTOR", margin + sigBoxWidth + 10 + sigBoxWidth / 2, currentY + 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Visto Bueno y Cierre Operativo", margin + sigBoxWidth + 10 + sigBoxWidth / 2, currentY + 23.5, { align: "center" });

  // 8. Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    doc.text(
      `Ficha Técnica #${radicado} - Generada por Noxia CRM el ${dayjs().format("DD/MM/YYYY HH:mm:ss")}`,
      margin,
      pageHeight - 6
    );
    doc.text(
      `Página ${p} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6,
      { align: "right" }
    );
  }

  const filename = `Ficha_Minuta_${radicado}_${dayjs().format("YYYYMMDD")}.pdf`;
  doc.save(filename);
}
