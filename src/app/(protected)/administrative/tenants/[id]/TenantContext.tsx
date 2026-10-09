"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { HttpClient } from "@/lib/api/client";
import { AuthService } from "@/lib/api/auth";
import { useNotification } from "@/providers/NotificationProvider";
import {
  TenantGeneralFormData,
  TenantProfileFormData,
  TenantSubscriptionFormData,
  TenantSettingsFormData,
} from "@/lib/schemas/tenant.schema";

export interface Feature {
  key: string;
  name: string;
  description?: string;
}

interface TenantContextType {
  tenantId: string;
  tenant: any | null;
  loading: boolean;
  featuresList: Feature[];
  selectedFeatures: string[];
  setSelectedFeatures: React.Dispatch<React.SetStateAction<string[]>>;
  savingSection: string | null;
  refreshTenant: () => Promise<void>;
  handleImpersonate: () => Promise<void>;
  handleToggleFeature: (key: string) => void;
  handleSaveFeatures: () => Promise<void>;
  handleSaveGeneral: (data: TenantGeneralFormData) => Promise<boolean>;
  handleSaveProfile: (data: TenantProfileFormData) => Promise<boolean>;
  handleSaveSubscription: (data: TenantSubscriptionFormData) => Promise<boolean>;
  handleSaveSettings: (data: TenantSettingsFormData) => Promise<boolean>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const tenantId = (params?.id as string) || "";
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<any | null>(null);
  const [featuresList, setFeaturesList] = useState<Feature[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  const loadTenantData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const [tenantData, featuresData] = await Promise.all([
        HttpClient.get<any>(`/tenants/${tenantId}`),
        HttpClient.get<Feature[]>("/features"),
      ]);

      setTenant(tenantData);
      setFeaturesList(featuresData || []);
      setSelectedFeatures(tenantData.features || []);
    } catch (err: any) {
      showError(err?.message || "Error al cargar la información de la empresa.");
    } finally {
      setLoading(false);
    }
  }, [tenantId, showError]);

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  const handleImpersonate = async () => {
    try {
      await AuthService.impersonate(tenantId);
      window.location.href = "/dashboard";
    } catch (error) {
      showError("Error al iniciar administración de la empresa.");
    }
  };

  const handleSaveGeneral = async (data: TenantGeneralFormData): Promise<boolean> => {
    try {
      setSavingSection("general");
      const updated = await HttpClient.patch<any>(`/tenants/${tenantId}`, {
        name: data.name,
        slug: data.slug,
        isActive: data.isActive,
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || null,
        secondaryColor: data.secondaryColor || null,
        sidebarColor: data.sidebarColor || null,
      });
      setTenant(updated);
      showSuccess("Información general actualizada correctamente.");
      return true;
    } catch (err: any) {
      showError(err?.message || "Error al actualizar información general.");
      return false;
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveProfile = async (data: TenantProfileFormData): Promise<boolean> => {
    try {
      setSavingSection("profile");
      const updated = await HttpClient.patch<any>(`/tenants/${tenantId}`, {
        profile: {
          legalName: data.legalName,
          taxId: data.taxId,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone || null,
          address: data.address || null,
          city: data.city || null,
          country: data.country || null,
          legalRepresentative: data.legalRepresentative || null,
        },
      });
      setTenant(updated);
      showSuccess("Perfil legal actualizado correctamente.");
      return true;
    } catch (err: any) {
      showError(err?.message || "Error al actualizar perfil legal.");
      return false;
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveSubscription = async (data: TenantSubscriptionFormData): Promise<boolean> => {
    try {
      setSavingSection("subscription");
      const updated = await HttpClient.patch<any>(`/tenants/${tenantId}`, {
        subscription: {
          planTier: data.planTier,
          status: data.status,
          maxClients: Number(data.maxClients),
          maxUsers: Number(data.maxUsers),
          maxEmployees: Number(data.maxEmployees),
          subscriptionEndsAt: data.subscriptionEndsAt
            ? new Date(data.subscriptionEndsAt).toISOString()
            : null,
          paymentGatewayId: data.paymentGatewayId || null,
        },
      });
      setTenant(updated);
      showSuccess("Suscripción y límites actualizados correctamente.");
      return true;
    } catch (err: any) {
      showError(err?.message || "Error al actualizar la suscripción.");
      return false;
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveSettings = async (data: TenantSettingsFormData): Promise<boolean> => {
    try {
      setSavingSection("settings");
      const updated = await HttpClient.patch<any>(`/tenants/${tenantId}`, {
        settings: {
          timezone: data.timezone,
          currency: data.currency,
          dateFormat: data.dateFormat,
          mfaRequired: data.mfaRequired,
          sessionTimeoutMinutes: Number(data.sessionTimeoutMinutes),
          passwordPolicy: data.passwordPolicy,
          faviconUrl: data.faviconUrl || null,
          loginBackgroundUrl: data.loginBackgroundUrl || null,
          supportEmail: data.supportEmail || null,
          supportPhone: data.supportPhone || null,
        },
      });
      setTenant(updated);
      showSuccess("Ajustes del sistema actualizados correctamente.");
      return true;
    } catch (err: any) {
      showError(err?.message || "Error al actualizar los ajustes.");
      return false;
    } finally {
      setSavingSection(null);
    }
  };

  const handleToggleFeature = (key: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSaveFeatures = async () => {
    try {
      setSavingSection("features");
      await HttpClient.put(`/tenants/${tenantId}/features`, {
        featureKeys: selectedFeatures,
      });
      setTenant((prev: any) => ({ ...prev, features: selectedFeatures }));
      showSuccess("Módulos de la empresa sincronizados correctamente.");
    } catch (err: any) {
      showError(err?.message || "Error al sincronizar módulos.");
    } finally {
      setSavingSection(null);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        tenantId,
        tenant,
        loading,
        featuresList,
        selectedFeatures,
        setSelectedFeatures,
        savingSection,
        refreshTenant: loadTenantData,
        handleImpersonate,
        handleToggleFeature,
        handleSaveFeatures,
        handleSaveGeneral,
        handleSaveProfile,
        handleSaveSubscription,
        handleSaveSettings,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantDetail() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenantDetail must be used within a TenantProvider");
  }
  return context;
}
