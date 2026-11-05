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

export interface ProspectDetailData {
  id: string;
  tenantId: string;
  internalCode: string;
  clientStatus: string;
  contractStatus?: string;
  contractNumber?: string | null;
  nit: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  commune?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  cai?: string | null;
  quadrant?: string | null;
  quadrantPhone?: string | null;
  observations?: string | null;
  sector?: string | null;
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
  clientProperties?: {
    id?: string;
    structureType?: string;
    towersAmount?: number;
    floorsAmount?: number;
    apartmentsPerFloor?: number;
    unitsAmount?: number;
    elevatorsAmount?: number;
    hasCommercialStores?: boolean;
    commercialStoresAmount?: number;
    hasSwimmingPool?: boolean;
    hasCommunalLounge?: boolean;
    hasGym?: boolean;
    hasWetAreas?: boolean;
    hasChildrenPlayground?: boolean;
    hasCoworking?: boolean;
    hasBbqArea?: boolean;
    hasSquashCourt?: boolean;
    hasSportsCourt?: boolean;
    hasVisitorParking?: boolean;
    visitorParkingAmount?: number;
    hasMotorcycleParking?: boolean;
    motorcycleParkingAmount?: number;
    hasBicycleRack?: boolean;
    bicycleRackAmount?: number;
    bicycleCapacityPerRack?: number;
    entriesDescription?: string[];
    entriesMediaFiles?: any[];
    structureConfig?: any;
  } | null;
  towers?: any[];
  floors?: any[];
  units?: any[];
  recaptationTargetDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: any;
}

interface ProspectContextValue {
  prospectId: string;
  prospect: ProspectDetailData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  reloadProspect: () => Promise<void>;
  updateGeneral: (data: Record<string, any>) => Promise<boolean>;
  updateOperations: (data: Record<string, any>) => Promise<boolean>;
  convertProspect: (data: {
    contractNumber: string;
    contractDate: string;
    lastContractDate: string;
    contractEndDate?: string;
    renewedContract?: boolean;
  }) => Promise<boolean>;
  permissions: {
    canManage: boolean;
    canRead: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canConvert: boolean;
  };
}

const ProspectContext = createContext<ProspectContextValue | undefined>(undefined);

export function ProspectProvider({
  prospectId,
  children,
}: {
  prospectId: string;
  children: React.ReactNode;
}) {
  const { session } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [prospect, setProspect] = useState<ProspectDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const permissions = useMemo(() => {
    const isGodlike =
      (session?.tenantId === "system" ||
        session?.originalTenantId === "system") &&
      session?.user?.roles?.some((r: any) => r.name === "GODLIKE");

    const perms = session?.permissions || [];
    const hasManage = isGodlike || perms.includes("client:manage");

    return {
      canManage: hasManage,
      canRead:
        hasManage ||
        perms.includes("client:read_general") ||
        perms.includes("client:read_all") ||
        perms.includes("client:read_assigned") ||
        perms.includes("client:read_workplace"),
      canEdit: hasManage || perms.includes("client:update"),
      canDelete: hasManage || perms.includes("client:delete"),
      canConvert: hasManage || perms.includes("client:update") || perms.includes("client:create"),
    };
  }, [session]);

  const reloadProspect = useCallback(async () => {
    if (!prospectId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await HttpClient.get<ProspectDetailData>(`/prospect/${prospectId}`);
      setProspect(res);
    } catch (err: any) {
      const msg = err?.message || "Error al cargar la información del prospecto.";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [prospectId, showError]);

  useEffect(() => {
    reloadProspect();
  }, [reloadProspect]);

  const updateGeneral = useCallback(
    async (data: Record<string, any>): Promise<boolean> => {
      try {
        setSaving(true);
        await HttpClient.patch(`/prospect/${prospectId}`, data);
        showSuccess("Datos generales del prospecto actualizados correctamente.");
        await reloadProspect();
        return true;
      } catch (err: any) {
        showError(err?.message || "Error al actualizar datos del prospecto.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [prospectId, reloadProspect, showSuccess, showError],
  );

  const updateOperations = useCallback(
    async (data: Record<string, any>): Promise<boolean> => {
      try {
        setSaving(true);
        await HttpClient.patch(`/prospect/${prospectId}`, {
          structureConfig: data,
        });
        showSuccess("Estructura física y áreas del prospecto actualizadas correctamente.");
        await reloadProspect();
        return true;
      } catch (err: any) {
        showError(err?.message || "Error al actualizar la estructura del prospecto.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [prospectId, reloadProspect, showSuccess, showError],
  );

  const convertProspect = useCallback(
    async (convertData: {
      contractNumber: string;
      contractDate: string;
      lastContractDate: string;
      contractEndDate?: string;
      renewedContract?: boolean;
    }): Promise<boolean> => {
      try {
        setSaving(true);
        await HttpClient.post(`/prospect/${prospectId}/convert`, convertData);
        showSuccess(`¡Felicidades! Se ha formalizado el contrato y ahora es un Cliente Activo.`);
        return true;
      } catch (err: any) {
        showError(err?.message || "Error al formalizar el contrato del prospecto.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [prospectId, showSuccess, showError],
  );

  const value = useMemo(
    () => ({
      prospectId,
      prospect,
      loading,
      saving,
      error,
      reloadProspect,
      updateGeneral,
      updateOperations,
      convertProspect,
      permissions,
    }),
    [
      prospectId,
      prospect,
      loading,
      saving,
      error,
      reloadProspect,
      updateGeneral,
      updateOperations,
      convertProspect,
      permissions,
    ],
  );

  return <ProspectContext.Provider value={value}>{children}</ProspectContext.Provider>;
}

export function useProspectDetail() {
  const context = useContext(ProspectContext);
  if (!context) {
    throw new Error("useProspectDetail debe utilizarse dentro de un ProspectProvider");
  }
  return context;
}

