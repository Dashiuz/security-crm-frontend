"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CommercialSettingsApi,
  CommercialSettings,
} from "@/lib/api/commercial-settings";
import { useNotification } from "@/providers/NotificationProvider";

export function useCommercialSettings() {
  const [settings, setSettings] = useState<CommercialSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useNotification();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CommercialSettingsApi.getSettings();
      setSettings(data);
    } catch (err: any) {
      const msg = err?.message || "Error al cargar la configuración comercial";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
    setSettings,
  };
}
