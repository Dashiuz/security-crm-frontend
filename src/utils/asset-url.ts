/**
 * Helper to resolve asset URLs (logos, avatars, media attachments)
 * Handles full URLs, Data URLs, and relative backend API paths.
 */
export function resolveAssetUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // Data URLs or external HTTPS links
  if (trimmed.startsWith("data:") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Relative backend path (e.g. /api/tenants/:id/logo)
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed}`;
}

