import { HttpClient } from './client';

export type InteractionChannel =
  | 'PHONE_CALL'
  | 'WHATSAPP_MESSAGE'
  | 'EMAIL'
  | 'IN_PERSON_MEETING'
  | 'VIDEO_CONFERENCE'
  | 'TECHNICAL_VISIT';

export type FollowUpMilestoneStatus = 'PENDING' | 'WON' | 'LOST' | 'REJECTED';

export type DealLossReasonCategory =
  | 'COMPETITOR_PRICE'
  | 'AUTOMATIC_RENEWAL'
  | 'PERMANENCE_CLAUSE'
  | 'HIGHER_VALUE_ADDED'
  | 'BUDGET_LIMITATION'
  | 'PREFERS_CONCIERGE'
  | 'NO_DECISION_CANCELLED'
  | 'FAILED_COMPLIANCE'
  | 'OTHER';

export interface CommercialFollowUpDto {
  id: string;
  tenantId: string;
  clientId: string;
  interactionDate: string;
  contactChannel: InteractionChannel;
  contactPersonName: string;
  contactPersonRole?: string | null;
  managementSummary: string;
  nextContactDate?: string | null;
  statusAfterFollowUp: FollowUpMilestoneStatus;
  lossReasonCategory?: DealLossReasonCategory | null;
  lossReasonDescription?: string | null;
  winningCompetitorName?: string | null;
  competitorPriceQuoted?: number | null;
  competitorGuardsSalary?: number | null;
  assignedCommercialId: string;
  assignedCommercial?: {
    id: string;
    fullName: string;
    document: string;
  };
  client?: {
    id: string;
    name: string;
    nit: string;
    stratum?: number | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateFollowUpPayload {
  clientId: string;
  interactionDate?: string;
  contactChannel: InteractionChannel;
  contactPersonName: string;
  contactPersonRole?: string;
  managementSummary: string;
  nextContactDate?: string;
  statusAfterFollowUp?: FollowUpMilestoneStatus;
  lossReasonCategory?: DealLossReasonCategory;
  lossReasonDescription?: string;
  winningCompetitorName?: string;
  competitorPriceQuoted?: number;
  competitorGuardsSalary?: number;
}

export const commercialCrmApi = {
  getFollowUps: async (params?: { clientId?: string; status?: FollowUpMilestoneStatus; take?: number; cursor?: string }) => {
    const query = new URLSearchParams();
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.status) query.set('status', params.status);
    if (params?.take) query.set('take', params.take.toString());
    if (params?.cursor) query.set('cursor', params.cursor);

    const qs = query.toString();
    return HttpClient.get<{ data: CommercialFollowUpDto[]; meta: { nextCursor: string | null; take: number } }>(
      `/commercial/crm/follow-ups${qs ? `?${qs}` : ''}`,
    );
  },

  getFollowUpsByClient: async (clientId: string) => {
    return HttpClient.get<CommercialFollowUpDto[]>(`/commercial/crm/follow-ups/client/${clientId}`);
  },

  getRecaptationAlerts: async () => {
    return HttpClient.get<any[]>('/commercial/crm/follow-ups/recaptation-alerts');
  },

  createFollowUp: async (data: CreateFollowUpPayload) => {
    return HttpClient.post<CommercialFollowUpDto>('/commercial/crm/follow-ups', data);
  },

  getFollowUpById: async (id: string) => {
    return HttpClient.get<CommercialFollowUpDto>(`/commercial/crm/follow-ups/${id}`);
  },

  updateFollowUp: async (id: string, data: Partial<CreateFollowUpPayload>) => {
    return HttpClient.patch<CommercialFollowUpDto>(`/commercial/crm/follow-ups/${id}`, data);
  },

  deleteFollowUp: async (id: string) => {
    return HttpClient.delete<CommercialFollowUpDto>(`/commercial/crm/follow-ups/${id}`);
  },
};
