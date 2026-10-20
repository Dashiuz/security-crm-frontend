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
import { useNotification } from "@/providers/NotificationProvider";

export interface ActiveAssignmentItem {
  id?: string;
  clientId: string;
  clientName: string;
  clientCode?: string | null;
  assignedAt: string;
  notes?: string | null;
  source?: string;
  roleName?: string | null;
}

export interface ClientHistoryItem {
  id: string;
  clientId: string;
  clientName: string;
  clientCode?: string | null;
  assignedAt: string;
  unassignedAt: string | null;
  reason?: string | null;
  notes?: string | null;
  recordedAt: string;
}

export interface LinkedUserData {
  id: string;
  document: string;
  fullName: string;
  department?: string | null;
  position?: string | null;
  isActive: boolean;
  isFirstLogin?: boolean;
  roles: Array<
    | {
        id: string;
        name: string;
      }
    | {
        role: {
          id: string;
          name: string;
        };
      }
    | string
  >;
  clientAccesses?: Array<{
    clientId: string;
    roleName: string | null;
    isActive: boolean;
    client: {
      id: string;
      name: string;
      internalCode?: string | null;
      address?: string | null;
    };
  }>;
}

export interface WorkforceSummaryData {
  employee: {
    id: string;
    tenantId: string;
    fullName: string;
    firstName: string;
    secondName?: string | null;
    lastName: string;
    maternalSurname?: string | null;
    documentType: string;
    document: string;
    gender: string;
    birthdate: string;
    entryDate: string;
    address: string;
    email?: string | null;
    phone?: string | null;
    departmentId?: string | null;
    departmentName?: string | null;
    positionId?: string | null;
    positionName?: string | null;
    isActive: boolean;
    isRetired?: boolean;
    retiredAt?: string | null;
    avatarUrl?: string | null;
    mediaAttachments?: any[];
    clientId?: string | null;
    clientName?: string | null;
  };
  user: LinkedUserData | null;
  activeAssignments: ActiveAssignmentItem[];
  clientHistory: ClientHistoryItem[];
}

interface EmployeeDetailContextValue {
  employeeId: string;
  summary: WorkforceSummaryData | null;
  loading: boolean;
  error: string | null;
  reloadSummary: () => Promise<void>;
  updateEmployee: (data: Record<string, any>) => Promise<boolean>;
}

const EmployeeDetailContext = createContext<EmployeeDetailContextValue | undefined>(undefined);

export function EmployeeDetailProvider({
  employeeId,
  children,
}: {
  employeeId: string;
  children: React.ReactNode;
}) {
  const { showError, showSuccess } = useNotification();
  const [summary, setSummary] = useState<WorkforceSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await HttpClient.get<WorkforceSummaryData>(
        `/employee/${employeeId}/workforce-summary`,
      );
      setSummary(data);
    } catch (err: any) {
      const msg = err.message || "Error al cargar la ficha del empleado";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [employeeId, showError]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const updateEmployee = async (data: Record<string, any>): Promise<boolean> => {
    try {
      await HttpClient.patch(`/employee/${employeeId}`, data);
      showSuccess("Datos del empleado actualizados exitosamente");
      await fetchSummary();
      return true;
    } catch (err: any) {
      showError(err.message || "Error al actualizar datos del empleado");
      return false;
    }
  };

  const value = useMemo(
    () => ({
      employeeId,
      summary,
      loading,
      error,
      reloadSummary: fetchSummary,
      updateEmployee,
    }),
    [employeeId, summary, loading, error, fetchSummary],
  );

  return (
    <EmployeeDetailContext.Provider value={value}>
      {children}
    </EmployeeDetailContext.Provider>
  );
}

export function useEmployeeDetail() {
  const context = useContext(EmployeeDetailContext);
  if (!context) {
    throw new Error("useEmployeeDetail must be used within an EmployeeDetailProvider");
  }
  return context;
}
