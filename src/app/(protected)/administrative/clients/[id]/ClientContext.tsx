"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { HttpClient } from "@/lib/api/client";
import { useAuth } from "@/components/AuthContext";
import { useNotification } from "@/providers/NotificationProvider";

export interface ClientDetailData {
  id: string;
  tenantId: string;
  internalCode: string;
  clientStatus: string;
  contractStatus: string;
  contractNumber?: string | null;
  nit: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  receptionPhone?: string | null;
  zipCode?: string | null;
  address?: string | null;
  country?: string | null;
  city?: string | null;
  state?: string | null;
  commune?: string | null;
  neighborhood?: string | null;
  quadrant?: string | null;
  quadrantPhone?: string | null;
  cai?: string | null;
  observations?: string | null;
  sector: string;
  coordinatorInChargeId?: string | null;
  coordinatorInCharge?: {
    id: string;
    fullName: string;
    position?: string;
  } | null;
  commercialContactId?: string | null;
  commercialContact?: {
    id: string;
    fullName: string;
    position?: string;
  } | null;
  installedTech?: boolean;
  securityStudy?: string | null;
  weaponsAmount?: number;
  administrator?: string | null;
  administratorPhone?: string | null;
  administratorEmail?: string | null;
  contractDate?: string | null;
  lastContractDate?: string | null;
  renewedContract?: boolean | null;
  contractEndDate?: string | null;
  contractMediaFiles?: Record<string, any> | null;
  administrationType?: string | null;
  administrationCompanyData?: Record<string, any> | null;
  councilData?: Record<string, any> | null;
  clientProperties?: Record<string, any> | null;
  towers?: any[];
  floors?: any[];
  units?: any[];
  geofence?: Record<string, any> | null;
  mapboxBaseImageS3Key?: string | null;
  mapboxCenterLat?: number | null;
  mapboxCenterLng?: number | null;
  mapboxZoom?: number | null;
  mapboxBboxMinLat?: number | null;
  mapboxBboxMinLng?: number | null;
  mapboxBboxMaxLat?: number | null;
  mapboxBboxMaxLng?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: any;
}

interface ClientContextValue {
  clientId: string;
  client: ClientDetailData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  reloadClient: () => Promise<void>;
  updateGeneral: (data: Record<string, any>) => Promise<boolean>;
  updateOperations: (data: Record<string, any>) => Promise<boolean>;
  updateLegal: (data: Record<string, any>) => Promise<boolean>;
  permissions: {
    canManage: boolean;
    canReadGeneral: boolean;
    canEditGeneral: boolean;
    canReadOperations: boolean;
    canEditOperations: boolean;
    canReadLegal: boolean;
    canEditLegal: boolean;
    canReadResidents: boolean;
  };
}

const ClientContext = createContext<ClientContextValue | undefined>(undefined);

export function ClientProvider({
  clientId,
  children,
}: {
  clientId: string;
  children: React.ReactNode;
}) {
  const { session } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [client, setClient] = useState<ClientDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Compute RBAC permissions
  const permissions = useMemo(() => {
    const isGodlike =
      (session?.tenantId === "system" ||
        session?.originalTenantId === "system") &&
      session?.user?.roles?.some((r) => r.name === "GODLIKE");

    const perms = session?.permissions || [];
    const hasManage = isGodlike || perms.includes("client:manage");

    return {
      canManage: hasManage,
      canReadGeneral:
        hasManage ||
        perms.includes("client:read_general") ||
        perms.includes("client:read_all") ||
        perms.includes("client:read_assigned") ||
        perms.includes("client:read_workplace"),
      canEditGeneral: hasManage || perms.includes("client:update_general") || perms.includes("client:update"),
      canReadOperations:
        hasManage || perms.includes("client:read_operations"),
      canEditOperations:
        hasManage || perms.includes("client:update_operations") || perms.includes("client:update"),
      canReadLegal:
        hasManage || perms.includes("client:read_legal"),
      canEditLegal:
        hasManage || perms.includes("client:update_legal") || perms.includes("client:update"),
      canReadResidents:
        hasManage ||
        perms.includes("client:read_residents") ||
        perms.includes("resident:read") ||
        perms.includes("resident:manage"),
    };
  }, [session]);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await HttpClient.get<ClientDetailData>(`/client/${clientId}`);
      setClient(data);
    } catch (err: any) {
      const msg = err.message || "Error al cargar datos del cliente";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [clientId, showError]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const updateGeneral = async (data: Record<string, any>): Promise<boolean> => {
    setSaving(true);
    try {
      const updated = await HttpClient.patch<ClientDetailData>(
        `/client/${clientId}/general`,
        data,
      );
      setClient(updated);
      showSuccess("Información general actualizada exitosamente.");
      return true;
    } catch (err: any) {
      showError(err.message || "Error al actualizar información general");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateOperations = async (
    data: Record<string, any>,
  ): Promise<boolean> => {
    setSaving(true);
    try {
      const updated = await HttpClient.patch<ClientDetailData>(
        `/client/${clientId}/operations`,
        data,
      );
      setClient(updated);
      showSuccess("Estructura operativa actualizada exitosamente.");
      return true;
    } catch (err: any) {
      showError(err.message || "Error al actualizar estructura operativa");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateLegal = async (data: Record<string, any>): Promise<boolean> => {
    setSaving(true);
    try {
      const updated = await HttpClient.patch<ClientDetailData>(
        `/client/${clientId}/legal`,
        data,
      );
      setClient(updated);
      showSuccess("Información legal y contractual actualizada exitosamente.");
      return true;
    } catch (err: any) {
      showError(err.message || "Error al actualizar información legal");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const value = useMemo(
    () => ({
      clientId,
      client,
      loading,
      saving,
      error,
      reloadClient: fetchClient,
      updateGeneral,
      updateOperations,
      updateLegal,
      permissions,
    }),
    [clientId, client, loading, saving, error, fetchClient, permissions],
  );

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
}

export function useClientDetail() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClientDetail must be used within a ClientProvider");
  }
  return context;
}
