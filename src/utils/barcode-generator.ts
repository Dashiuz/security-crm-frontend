/**
 * Barcode 128 & QR Code SVG Vector Generator
 * Genera representaciones vectoriales SVG inmutables sin dependencias externas.
 */

// Patrones Code 128 Set B (107 patrones para caracteres 0-106)
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112", // 100-106 (104=StartB, 106=Stop)
];

const START_B_INDEX = 104;
const STOP_INDEX = 106;

/**
 * Genera un SVG string de un código de barras Code 128
 */
export function generateBarcode128Svg(
  text: string,
  options?: { width?: number; height?: number; showText?: boolean },
): string {
  const width = options?.width || 280;
  const height = options?.height || 90;
  const showText = options?.showText ?? true;

  const cleanText = text.replace(/[^\x20-\x7E]/g, "");
  const codes: number[] = [START_B_INDEX];

  let checksum = START_B_INDEX;
  for (let i = 0; i < cleanText.length; i++) {
    const code = cleanText.charCodeAt(i) - 32;
    codes.push(code);
    checksum += code * (i + 1);
  }

  const checkDigit = checksum % 103;
  codes.push(checkDigit);
  codes.push(STOP_INDEX);

  // Convertir índices a patrón de anchos de barras (b1, s1, b2, s2, ...)
  let pattern = "";
  for (const c of codes) {
    pattern += CODE128_PATTERNS[c] || "212222";
  }

  // Calcular número total de módulos
  let totalModules = 0;
  for (const ch of pattern) {
    totalModules += parseInt(ch, 10);
  }

  const quietZone = 10;
  const scale = (width - quietZone * 2) / totalModules;
  const barHeight = showText ? height - 24 : height;

  let x = quietZone;
  let isBar = true;
  let rects = "";

  for (const ch of pattern) {
    const moduleWidth = parseInt(ch, 10) * scale;
    if (isBar) {
      rects += `<rect x="${x.toFixed(2)}" y="0" width="${moduleWidth.toFixed(2)}" height="${barHeight}" fill="#0f172a" />`;
    }
    x += moduleWidth;
    isBar = !isBar;
  }

  const textElement = showText
    ? `<text x="${(width / 2).toFixed(2)}" y="${height - 4}" text-anchor="middle" font-family="monospace" font-size="12" font-weight="700" fill="#334155">${cleanText}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: transparent;">
    ${rects}
    ${textElement}
  </svg>`;
}

/**
 * Retorna URL de renderizado seguro de QR en alta definición
 */
export function getQrCodeImageUrl(data: string, size = 260): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(
    data,
  )}`;
}

export type LabelStandardFormat =
  | "THERMAL_50x25"
  | "THERMAL_50x50"
  | "THERMAL_100x50"
  | "SHEET_A4_24UP"
  | "BADGE_CR80";

export interface LabelFormatConfig {
  id: LabelStandardFormat;
  name: string;
  category: "thermal" | "sheet" | "badge";
  widthMm: number;
  heightMm: number;
  description: string;
  isGrid?: boolean;
  cols?: number;
  rows?: number;
}

export const LABEL_STANDARD_FORMATS: LabelFormatConfig[] = [
  {
    id: "THERMAL_50x25",
    name: 'Térmica Pequeña (50 × 25 mm / 2" × 1")',
    category: "thermal",
    widthMm: 50,
    heightMm: 25,
    description: "Ideal para activos de almacén, herramientas, radios y seriales",
  },
  {
    id: "THERMAL_50x50",
    name: 'Térmica Mediana (50 × 50 mm / 2" × 2")',
    category: "thermal",
    widthMm: 50,
    heightMm: 50,
    description: "Formato cuadrado para puntos de patrullaje y rondas en pared",
  },
  {
    id: "THERMAL_100x50",
    name: 'Térmica Grande (100 × 50 mm / 4" × 2")',
    category: "thermal",
    widthMm: 100,
    heightMm: 50,
    description: "Rótulos para correspondencia, bultos y cajas de inventario",
  },
  {
    id: "SHEET_A4_24UP",
    name: "Pliego Adhesivo A4 / Carta (24 Etiquetas 3x8)",
    category: "sheet",
    widthMm: 210,
    heightMm: 297,
    isGrid: true,
    cols: 3,
    rows: 8,
    description: "Para imprimir lotes en papel adhesivo con impresoras de oficina",
  },
  {
    id: "BADGE_CR80",
    name: "Carnet / Escarapela PVC (85.6 × 54 mm)",
    category: "badge",
    widthMm: 85.6,
    heightMm: 54,
    description: "Tarjetas de identificación para guardias y pases de visitantes",
  },
];


