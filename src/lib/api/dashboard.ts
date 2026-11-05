import { HttpClient } from "./client";

export interface DashboardKpis {
  activeClients: number;
  prospectsInPipeline: number;
  openPqrs: number;
  ansComplianceRate: number;
  activeGuards: number;
  pendingPackages: number;
}

export interface AnsTrendPoint {
  week: string;
  compliance: number;
  target: number;
  totalTickets: number;
}

export interface CommercialFunnelStage {
  stage: string;
  count: number;
  totalValue: number;
}

export interface DashboardOverview {
  kpis: DashboardKpis;
  charts: {
    ansWeeklyTrend: AnsTrendPoint[];
    commercialFunnel: CommercialFunnelStage[];
  };
  updatedAt: string;
}

export type ReminderUrgency = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type ReminderModule = "PQRS" | "COMMERCIAL" | "CLIENTS" | "PORTERIA" | "TALENT";

export interface DashboardReminder {
  id: string;
  module: ReminderModule;
  title: string;
  description: string;
  urgency: ReminderUrgency;
  dueDate?: string | null;
  actionPath: string;
  actionLabel: string;
}

export interface DashboardRemindersResponse {
  reminders: DashboardReminder[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    total: number;
  };
}

export class DashboardApi {
  static async getOverview(): Promise<DashboardOverview> {
    return HttpClient.get<DashboardOverview>("/administrative/dashboard/overview");
  }

  static async getReminders(): Promise<DashboardRemindersResponse> {
    return HttpClient.get<DashboardRemindersResponse>("/administrative/dashboard/reminders");
  }
}

