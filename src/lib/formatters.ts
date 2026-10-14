import dayjs from "dayjs";

/**
 * Formats a date string or object to DD-MM-YYYY without timezone distortion.
 * For calendar date strings (YYYY-MM-DD or YYYY-MM-DDT00:00:00Z), extracts the date part
 * directly so negative UTC offsets (e.g. UTC-5 in Colombia) do not shift it to the previous day.
 */
export const formatDate = (params: any): string => {
  const value = params?.value !== undefined ? params.value : params;
  if (!value) return "-";

  try {
    const str = String(value).trim();
    // Check if it starts with YYYY-MM-DD
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}-${month}-${year}`;
    }

    const d = dayjs(value);
    if (!d.isValid()) return str;
    return d.format("DD-MM-YYYY");
  } catch {
    return String(value);
  }
};

/**
 * Formats a time string or object to HH:mm:ss without timezone distortion.
 * For Prisma @db.Time fields serialized as 1970-01-01THH:mm:ss.000Z, preserves the exact wall clock time.
 */
export const formatTime = (params: any): string => {
  const value = params?.value !== undefined ? params.value : params;
  if (!value) return "-";

  try {
    const str = String(value).trim();
    // Direct HH:mm:ss or HH:mm
    if (/^(\d{2}:){1,2}\d{2}$/.test(str)) {
      return str.length === 5 ? `${str}:00` : str;
    }

    // Prisma Time object serialized as 1970-01-01THH:mm:ss.000Z
    if (str.includes("T")) {
      const timePart = str.split("T")[1]?.slice(0, 8);
      if (timePart && /^(\d{2}:){1,2}\d{2}/.test(timePart)) {
        return timePart.length === 5 ? `${timePart}:00` : timePart;
      }
    }

    const d = dayjs(value);
    if (!d.isValid()) return str;
    return d.format("HH:mm:ss");
  } catch {
    return String(value);
  }
};

/**
 * Formats a time, ISO datetime, or Date object to HH:mm for HTML5 <input type="time">
 */
export const formatTimeToHHmm = (value: any): string => {
  if (!value) return "";
  try {
    const str = String(value).trim();
    if (/^\d{2}:\d{2}/.test(str)) {
      return str.slice(0, 5);
    }
    if (str.includes("T")) {
      const timePart = str.split("T")[1]?.slice(0, 5);
      if (timePart && /^\d{2}:\d{2}/.test(timePart)) {
        return timePart;
      }
    }
    const d = dayjs(value);
    if (!d.isValid()) return "";
    return d.format("HH:mm");
  } catch {
    return "";
  }
};

/**
 * Formats a datetime string or object to DD-MM-YYYY HH:mm:ss (using client local time for true UTC moments)
 */
export const formatDateTime = (params: any): string => {
  const value = params?.value !== undefined ? params.value : params;
  if (!value) return "-";

  try {
    const d = dayjs(value);
    if (!d.isValid()) return String(value);
    return d.format("DD-MM-YYYY HH:mm:ss");
  } catch {
    return String(value);
  }
};

/**
 * Maps and formats property structure types from Enum to friendly Spanish
 */
export const formatStructureType = (type?: string): string => {
  if (!type) return "No especificado";
  const map: Record<string, string> = {
    SINGLE_BUILDING: "Edificio Único (Torre individual)",
    BUILDING_CLUSTER: "Conjunto de Torres / Bloques",
    HOUSE_CLUSTER: "Conjunto Cerrado de Casas",
    MIXED: "Conjunto Mixto (Residencial + Locales)",
    COMMERCIAL: "Comercios / Centro Comercial",
    OTHER: "Otro Tipo de Inmueble",
  };
  return map[type] || type.replace(/_/g, " ");
};

/**
 * Priority info definition and semantic badges for minutas
 */
export interface PriorityInfo {
  level: number;
  label: string;
  color: "default" | "info" | "success" | "warning" | "error";
  bg: string;
  textColor: string;
}

export const PRIORITY_CONFIG: Record<number, PriorityInfo> = {
  1: { level: 1, label: "Muy baja", color: "default", bg: "#78909c", textColor: "#ffffff" },
  2: { level: 2, label: "Baja", color: "info", bg: "#0288d1", textColor: "#ffffff" },
  3: { level: 3, label: "Normal", color: "success", bg: "#2e7d32", textColor: "#ffffff" },
  4: { level: 4, label: "Alta", color: "warning", bg: "#ed6c02", textColor: "#ffffff" },
  5: { level: 5, label: "Crítica", color: "error", bg: "#d32f2f", textColor: "#ffffff" },
};

export const getPriorityInfo = (priority?: any): PriorityInfo => {
  const num = Number(priority) || 3;
  return PRIORITY_CONFIG[num] || PRIORITY_CONFIG[3];
};
