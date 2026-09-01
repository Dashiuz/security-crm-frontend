import dayjs from "dayjs";

/**
 * Formats a date string or object to DD-MM-YYYY
 */
export const formatDate = (params: any): string => {
  const value = params?.value !== undefined ? params.value : params;
  if (!value) return "-";

  try {
    const d = dayjs(value);
    if (!d.isValid()) return String(value);
    return d.format("DD-MM-YYYY");
  } catch (error) {
    return String(value);
  }
};

/**
 * Formats a time string or object to HH:mm:ss
 */
export const formatTime = (params: any): string => {
  const value = params?.value !== undefined ? params.value : params;
  if (!value) return "-";

  try {
    // If it's a string like "13:45:00"
    if (typeof value === "string" && /^(\d{2}:){1,2}\d{2}/.test(value)) {
      return value;
    }

    const d = dayjs(value);
    if (!d.isValid()) return String(value);
    return d.format("HH:mm:ss");
  } catch (error) {
    return String(value);
  }
};

/**
 * Formats a time, ISO datetime, or Date object to HH:mm for HTML5 <input type="time">
 */
export const formatTimeToHHmm = (value: any): string => {
  if (!value) return "";
  try {
    if (typeof value === "string" && /^\d{2}:\d{2}/.test(value)) {
      return value.slice(0, 5);
    }
    const d = dayjs(value);
    if (!d.isValid()) return "";
    return d.format("HH:mm");
  } catch {
    return "";
  }
};

/**
 * Formats a datetime string or object to DD-MM-YYYY HH:mm:ss
 */
export const formatDateTime = (params: any): string => {
  const value = params?.value !== undefined ? params.value : params;
  if (!value) return "-";

  try {
    const d = dayjs(value);
    if (!d.isValid()) return String(value);
    return d.format("DD-MM-YYYY HH:mm:ss");
  } catch (error) {
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
    OTHER: "Otro Tipo de Inmueble",
  };
  return map[type] || type.replace(/_/g, " ");
};
