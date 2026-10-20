import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import { Tenant } from "@/lib/api/auth";
import {
  PqrsTicket,
  PqrsStatus,
  PqrsType,
  PqrsPriority,
} from "@/lib/api/pqrs";

export interface PqrsPdfOptions {
  ticket: PqrsTicket;
  tenant: Tenant | null;
}

export interface LoadedImageInfo {
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Normaliza y carga una imagen en Base64 JPEG preservando relación de aspecto
 */
async function loadImageAsBase64(url: string): Promise<LoadedImageInfo | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      return convertDataUrlToJpeg(dataUrl);
    }
  } catch {
    // Si falla fetch directo por CORS, intentar proxy
    try {
      const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (json?.dataUrl) {
          return convertDataUrlToJpeg(json.dataUrl);
        }
      }
    } catch {
      // Ignorar fallback
    }
  }
  return null;
}

function convertDataUrlToJpeg(dataUrl: string): Promise<LoadedImageInfo | null> {
  if (typeof window === "undefined") {
    return Promise.resolve({ dataUrl, width: 800, height: 600, aspectRatio: 4 / 3 });
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

function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [27, 58, 38]; // default dark green
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

const STATUS_LABELS: Record<PqrsStatus, string> = {
  [PqrsStatus.OPEN]: "ABIERTA",
  [PqrsStatus.ASSIGNED]: "ASIGNADA",
  [PqrsStatus.IN_PROGRESS]: "EN GESTIÓN",
  [PqrsStatus.RESOLVED]: "RESUELTA",
  [PqrsStatus.CLOSED]: "CERRADA",
  [PqrsStatus.REJECTED]: "RECHAZADA",
  [PqrsStatus.VOIDED]: "ANULADA",
};

const STATUS_COLORS: Record<PqrsStatus, [number, number, number]> = {
  [PqrsStatus.OPEN]: [2, 132, 199],      // Sky blue
  [PqrsStatus.ASSIGNED]: [79, 70, 229],   // Indigo
  [PqrsStatus.IN_PROGRESS]: [217, 119, 6], // Amber
  [PqrsStatus.RESOLVED]: [5, 150, 105],   // Emerald
  [PqrsStatus.CLOSED]: [71, 85, 105],     // Slate
  [PqrsStatus.REJECTED]: [225, 29, 72],   // Rose
  [PqrsStatus.VOIDED]: [100, 116, 139],   // Neutral gray
};

const PRIORITY_LABELS: Record<PqrsPriority, string> = {
  [PqrsPriority.LOW]: "BAJA",
  [PqrsPriority.MEDIUM]: "MEDIA",
  [PqrsPriority.HIGH]: "ALTA",
  [PqrsPriority.CRITICAL]: "CRÍTICA",
};

const TYPE_LABELS: Record<PqrsType, string> = {
  [PqrsType.PETICION]: "PETICIÓN",
  [PqrsType.QUEJA]: "QUEJA",
  [PqrsType.RECLAMO]: "RECLAMO",
  [PqrsType.SUGERENCIA]: "SUGERENCIA",
  [PqrsType.FELICITACION]: "FELICITACIÓN",
};

/**
 * Genera el documento oficial en PDF con la ficha y expediente integral de la PQRS
 */
export async function generatePqrsPdf(options: PqrsPdfOptions): Promise<void> {
  const { ticket, tenant } = options;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const statusColor = STATUS_COLORS[ticket.status] || [71, 85, 105];
  const statusLabel = STATUS_LABELS[ticket.status] || ticket.status;

  // Cargar logotipo institucional si existe
  let logoInfo: LoadedImageInfo | null = null;
  if (tenant?.logoUrl) {
    logoInfo = await loadImageAsBase64(tenant.logoUrl);
  }

  // 1. Barra superior de acento con color de estado
  doc.setFillColor(...statusColor);
  doc.rect(0, 0, pageWidth, 5, "F");

  // 2. Encabezado institucional
  let currentY = 12;
  const maxLogoW = 32;
  const maxLogoH = 15;
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
  doc.setFontSize(12.5);
  doc.setTextColor(30, 41, 59);
  const companyName = tenant?.profile?.legalName || tenant?.name || "EMPRESA DE SEGURIDAD PRIVADA";
  doc.text(companyName.toUpperCase(), textStartX, currentY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const nitLine = tenant?.profile?.taxId ? `NIT: ${tenant.profile.taxId} | ` : "";
  const phoneLine = tenant?.profile?.contactPhone ? `Tel: ${tenant.profile.contactPhone} | ` : "";
  doc.text(`${nitLine}${phoneLine}Expediente Oficial de PQRS - Custodia y Trazabilidad`, textStartX, currentY + 9);

  // Cuadro derecho con Radicado y Estado
  const radBoxW = 54;
  const radBoxH = 15;
  const radBoxX = pageWidth - margin - radBoxW;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(radBoxX, currentY, radBoxW, radBoxH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("RADICADO OFICIAL", radBoxX + radBoxW / 2, currentY + 4.5, { align: "center" });

  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text(ticket.code, radBoxX + radBoxW / 2, currentY + 9.5, { align: "center" });

  doc.setFontSize(7.5);
  doc.setTextColor(...statusColor);
  doc.text(`ESTADO: ${statusLabel}`, radBoxX + radBoxW / 2, currentY + 13.5, { align: "center" });

  currentY += 19;

  // 3. Título del Documento y Metadatos Rápidos
  doc.setFillColor(...statusColor);
  doc.roundedRect(margin, currentY, contentWidth, 7.5, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  const typeText = TYPE_LABELS[ticket.type] || ticket.type;
  const priorityText = PRIORITY_LABELS[ticket.priority] || ticket.priority;
  doc.text(
    `EXPEDIENTE PQRS: ${ticket.code}  |  TIPO: ${typeText}  |  PRIORIDAD: ${priorityText}`,
    pageWidth / 2,
    currentY + 5,
    { align: "center" }
  );

  currentY += 11;

  // 4. ALERTA DE ANULACIÓN (Si el ticket está VOIDED)
  if (ticket.status === PqrsStatus.VOIDED) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(185, 28, 28);
    doc.text("SOLICITUD ANULADA ADMINISTRATIVAMENTE", margin + 4, currentY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(127, 29, 29);
    const voidedDate = ticket.voidedAt ? dayjs(ticket.voidedAt).format("DD/MM/YYYY HH:mm:ss") : "N/A";
    const voidedUser = ticket.voidedBy?.fullName || "Administrador del Sistema";
    doc.text(`Fecha de Anulación: ${voidedDate} | Funcionario Responsable: ${voidedUser}`, margin + 4, currentY + 9);

    doc.setFont("helvetica", "bold");
    doc.text("Motivo de la Anulación:", margin + 4, currentY + 13.5);
    doc.setFont("helvetica", "italic");
    const splitReason = doc.splitTextToSize(ticket.voidReason || "Sin justificación registrada.", contentWidth - 8);
    doc.text(splitReason, margin + 4, currentY + 17);

    currentY += 23;
  }

  // 5. Tabla Informativa de 2 Bloques: Datos del Cliente y Datos de Gestión
  const clientInfoRows = [
    [
      { content: "Cliente / Copropiedad:", styles: { fontStyle: "bold" as const, halign: "left" as const, fillColor: [248, 250, 252] as [number, number, number] } },
      ticket.client?.name || "No especificado",
      { content: "Fecha de Radicación:", styles: { fontStyle: "bold" as const, halign: "left" as const, fillColor: [248, 250, 252] as [number, number, number] } },
      dayjs(ticket.createdAt).format("DD/MM/YYYY HH:mm:ss"),
    ],
    [
      { content: "NIT / Identificación:", styles: { fontStyle: "bold" as const, halign: "left" as const, fillColor: [248, 250, 252] as [number, number, number] } },
      ticket.client?.nit || "N/A",
      { content: "Radicado Por:", styles: { fontStyle: "bold" as const, halign: "left" as const, fillColor: [248, 250, 252] as [number, number, number] } },
      ticket.createdBy?.fullName || "Administrador del Conjunto",
    ],
    [
      { content: "Contacto / Correo:", styles: { fontStyle: "bold" as const, halign: "left" as const, fillColor: [248, 250, 252] as [number, number, number] } },
      ticket.client?.administratorEmail || ticket.client?.email || "N/A",
      { content: "Funcionario Asignado:", styles: { fontStyle: "bold" as const, halign: "left" as const, fillColor: [248, 250, 252] as [number, number, number] } },
      ticket.assignedTo ? ticket.assignedTo.fullName : "Sin Asignar (Pendiente)",
    ],
    [
      { content: "Teléfono Contacto:", styles: { fontStyle: "bold" as const, halign: "left" as const, fillColor: [248, 250, 252] as [number, number, number] } },
      ticket.client?.administratorPhone || "N/A",
      { content: "Última Actualización:", styles: { fontStyle: "bold" as const, halign: "left" as const, fillColor: [248, 250, 252] as [number, number, number] } },
      dayjs(ticket.updatedAt).format("DD/MM/YYYY HH:mm:ss"),
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 55 },
      2: { cellWidth: 38 },
      3: { cellWidth: "auto" },
    },
    body: clientInfoRows,
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // 6. Contenido Original Radicado (Asunto y Descripción de los Hechos)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("1. DESCRIPCIÓN ORIGINAL DE LA SOLICITUD / PETICIÓN", margin, currentY);
  currentY += 2;

  const descTableRows = [
    [
      {
        content: `Asunto: ${ticket.subject}\n\nDescripción de los hechos:\n${ticket.description}`,
        styles: {
          cellPadding: 3,
          fontSize: 8,
          textColor: [30, 41, 59] as [number, number, number],
          fillColor: [255, 255, 255] as [number, number, number],
          lineColor: [203, 213, 225] as [number, number, number],
          lineWidth: 0.3,
        },
      },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "plain",
    tableWidth: contentWidth,
    body: descTableRows,
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // 7. Hilo Cronológico de Respuestas y Trazabilidad Operativa
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("2. TRAZABILIDAD Y COMUNICACIONES REGISTRADAS", margin, currentY);
  currentY += 2;

  const messages = ticket.messages || [];

  if (messages.length === 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [100, 116, 139] },
      body: [["No se registran respuestas o comunicaciones adicionales en este expediente."]],
    });
    currentY = (doc as any).lastAutoTable.finalY + 5;
  } else {
    const messageRows = messages.map((msg, index) => {
      const msgDate = dayjs(msg.createdAt).format("DD/MM/YYYY HH:mm");
      const isClientMsg = msg.createdBy?.userType === "RESIDENCE_MANAGER";
      const originType = isClientMsg ? "Copropiedad" : "Empresa Seguridad";
      const author = msg.createdBy?.fullName || (isClientMsg ? "Administrador Copropiedad" : "Funcionario Noxia");
      const atts = msg.attachments && msg.attachments.length > 0
        ? `\nAdjuntos: ${msg.attachments.map((a: any) => a.fileName).join(", ")}`
        : "";

      return [
        `#${index + 1}`,
        msgDate,
        `${author}\n(${originType})`,
        `${msg.content}${atts}`,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: "grid",
      head: [["#", "Fecha / Hora", "Autor / Origen", "Detalle de la Respuesta / Acción"]],
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 26, halign: "center" },
        2: { cellWidth: 38 },
        3: { cellWidth: "auto" },
      },
      body: messageRows,
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // 8. Evidencias Digitales Registradas (Archivos del ticket inicial y del hilo)
  const allAttachments: any[] = [
    ...(ticket.attachments || []).map((a: any) => ({ ...a, source: "Radicado Inicial" })),
  ];
  messages.forEach((m) => {
    (m.attachments || []).forEach((att: any) => {
      allAttachments.push({ ...att, source: "Respuesta al Hilo" });
    });
  });

  if (allAttachments.length > 0) {
    // Si queda poco espacio, pasar a siguiente página
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text("3. CUSTODIA DE EVIDENCIAS DIGITALES ADJUNTAS", margin, currentY);
    currentY += 2;

    const attachmentRows = allAttachments.map((att, idx) => {
      const sizeKb = att.sizeBytes ? `${(att.sizeBytes / 1024).toFixed(1)} KB` : "N/A";
      const attDate = att.createdAt ? dayjs(att.createdAt).format("DD/MM/YYYY HH:mm") : "N/A";
      return [
        `EVD-${idx + 1}`,
        att.fileName || "Archivo sin nombre",
        att.source,
        sizeKb,
        att.mimeType || "application/octet-stream",
        attDate,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: "grid",
      head: [["ID", "Nombre de Archivo", "Origen", "Tamaño", "Tipo MIME", "Registrado"]],
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { cellWidth: 50 },
        2: { cellWidth: 28 },
        3: { cellWidth: 18, halign: "right" },
        4: { cellWidth: 42 },
        5: { cellWidth: "auto", halign: "center" },
      },
      body: attachmentRows,
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // 9. Bloque de Auditoría, Cumplimiento Normativo y Firmas
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  // Certificación legal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("4. CERTIFICACIÓN DE INTEGRIDAD Y CUMPLIMIENTO NORMATIVO", margin, currentY);
  currentY += 3;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  const legalText =
    "El presente expediente digital certifica la recepción, trámite y resolución de la solicitud PQRS aquí detallada, conforme a las directrices de la Superintendencia de Vigilancia y Seguridad Privada y las disposiciones vigentes en materia de protección al consumidor y ley de hábeas data. La inmutabilidad de los radicados garantiza la transparencia entre la empresa de seguridad y el cliente.";
  const splitLegal = doc.splitTextToSize(legalText, contentWidth);
  doc.text(splitLegal, margin, currentY);
  currentY += splitLegal.length * 3 + 4;

  // Cuadros de Firma
  const sigBoxW = (contentWidth - 8) / 2;
  const sigBoxH = 24;

  // Firma Responsable Empresa de Seguridad
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, sigBoxW, sigBoxH, "S");
  doc.line(margin + 6, currentY + 15, margin + sigBoxW - 6, currentY + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("POR LA EMPRESA DE SEGURIDAD", margin + sigBoxW / 2, currentY + 18.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  const assigneeName = ticket.assignedTo?.fullName || "Director de Operaciones / Atención PQRS";
  doc.text(assigneeName, margin + sigBoxW / 2, currentY + 21.5, { align: "center" });

  // Firma Administrador / Representante del Cliente
  const sig2X = margin + sigBoxW + 8;
  doc.rect(sig2X, currentY, sigBoxW, sigBoxH, "S");
  doc.line(sig2X + 6, currentY + 15, sig2X + sigBoxW - 6, currentY + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("POR EL CLIENTE / COPROPIEDAD", sig2X + sigBoxW / 2, currentY + 18.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  const clientRep = ticket.client?.name || "Administrador del Conjunto";
  doc.text(clientRep, sig2X + sigBoxW / 2, currentY + 21.5, { align: "center" });

  // 10. Pie de Página en todas las páginas
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    doc.text(
      `Ficha Técnica #${ticket.code} - Generada por Noxia CRM el ${dayjs().format("DD/MM/YYYY HH:mm:ss")}`,
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

  const cleanCode = ticket.code.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Expediente_PQRS_${cleanCode}_${dayjs().format("YYYYMMDD_HHmm")}.pdf`;
  doc.save(filename);
}
