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
