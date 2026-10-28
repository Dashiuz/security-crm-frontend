import { HttpClient } from './client';

export type ProposalStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'APPROVED_INTERNAL'
  | 'SENT_TO_CLIENT'
  | 'WON'
  | 'LOST'
  | 'VOIDED';

export type PnlHealthStatus =
  | 'PROFITABLE'
  | 'WARNING_LOW_MARGIN'
  | 'DEFICIT_BLOCKED';

export type ProposalContractType = 'NEW_CONTRACT' | 'RENEWAL' | 'ADDITION';
export type BenefitPeriodicity = 'SINGLE_ONE_TIME' | 'MONTHLY_RECURRING' | 'ANNUAL_RENEWAL';

export interface ProposalServiceItemPayload {
  id?: string;
  serviceCatalogId?: string;
  positionTitle: string;
  quantity: number;
  scheduleType: string;
  weaponModality: string;
  tariffCategory: string;
  unitMonthlyBilledPrice: number;
  unitMonthlyRealCost: number;
  sortOrder?: number;
}

export interface ProposalValueAddedItemPayload {
  id?: string;
  valueAddedCatalogItemId?: string;
  itemName: string;
  quantity: number;
  periodicity: BenefitPeriodicity;
  itemInternalCost: number;
  notes?: string;
}

export interface CreateProposalPayload {
  clientId: string;
  tariffPeriodId: string;
  contractType?: ProposalContractType;
  contractDurationMonths?: number;
  promptPaymentDiscPercent?: number;
  promptPaymentDays?: number;
  includePresentation?: boolean;
  includeTechSecurityStudy?: boolean;
  includeEconomicQuote?: boolean;
  includeValuesAdded?: boolean;
  includeHseqAnnexes?: boolean;
  items: ProposalServiceItemPayload[];
  valueAddedItems?: ProposalValueAddedItemPayload[];
  draftSnapshotJson?: any;
}

export type UpdateProposalPayload = Partial<CreateProposalPayload>;

export interface SimulatePnlPayload {
  contractDurationMonths: number;
  promptPaymentDiscPercent?: number;
  promptPaymentDays?: number;
  items: Array<{
    positionTitle: string;
    quantity: number;
    unitMonthlyBilledPrice: number;
    unitMonthlyRealCost: number;
  }>;
  valueAddedItems?: Array<{
    itemName: string;
    quantity: number;
    periodicity: BenefitPeriodicity;
    itemInternalCost: number;
  }>;
}

export interface PnlSimulationResult {
  subtotalMonthlyPreDisc: number;
  promptPaymentDiscPercent: number;
  promptPaymentDiscAmount: number;
  subtotalMonthlyAfterDisc: number;
  aiuBaseAmount: number;
  ivaAmount: number;
  totalMonthlyWithTax: number;
  totalAnnualContractValue: number;
  estimatedMonthlyRealCost: number;
  monthlyVagAmortization: number;
  totalMonthlyOperatingCost: number;
  netMonthlyMarginAmount: number;
  netMarginPercentage: number;
  pnlStatus: PnlHealthStatus;
}

export interface CommercialProposalDto {
  id: string;
  tenantId: string;
  clientId: string;
  tariffPeriodId: string;
  proposalFolioCode: string;
  versionNumber: number;
  status: ProposalStatus;
  contractType: ProposalContractType;
  contractDurationMonths: number;
  includePresentation: boolean;
  includeTechSecurityStudy: boolean;
  includeEconomicQuote: boolean;
  includeValuesAdded: boolean;
  includeHseqAnnexes: boolean;
  subtotalMonthlyPreDisc: number;
  promptPaymentDiscPercent: number;
  promptPaymentDiscAmount: number;
  promptPaymentDays?: number;
  subtotalMonthlyAfterDisc: number;
  aiuBaseAmount: number;
  ivaAmount: number;
  totalMonthlyWithTax: number;
  totalAnnualContractValue: number;
  estimatedMonthlyRealCost: number;
  monthlyVagAmortization: number;
  totalMonthlyOperatingCost: number;
  netMonthlyMarginAmount: number;
  netMarginPercentage: number;
  pnlStatus: PnlHealthStatus;
  client?: {
    id: string;
    name: string;
    nit: string;
    stratum?: number | null;
    sector: string;
    address?: string;
    city?: string;
    email?: string;
    phone?: string;
    clientStatus?: string;
  };
  draftSnapshotJson?: any;
  signers?: any[];
  tariffPeriod?: any;
  items?: any[];
  valueAddedItems?: any[];
  mediaAttachment?: any;
  serviceOrder?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalFilterParams {
  clientId?: string;
  status?: ProposalStatus;
  pnlStatus?: PnlHealthStatus;
  search?: string;
  cursor?: string;
  take?: number;
}

export const commercialProposalsApi = {
  getProposals: async (params?: ProposalFilterParams) => {
    const query = new URLSearchParams();
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.status) query.set('status', params.status);
    if (params?.pnlStatus) query.set('pnlStatus', params.pnlStatus);
    if (params?.search) query.set('search', params.search);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.take) query.set('take', params.take.toString());

    const qs = query.toString();
    return HttpClient.get<{ data: CommercialProposalDto[]; meta: { nextCursor: string | null; take: number } }>(
      `/commercial/proposals${qs ? `?${qs}` : ''}`,
    );
  },

  getProposalById: async (id: string) => {
    return HttpClient.get<CommercialProposalDto>(`/commercial/proposals/${id}`);
  },

  createProposal: async (data: CreateProposalPayload) => {
    return HttpClient.post<CommercialProposalDto>('/commercial/proposals', data);
  },

  updateProposal: async (id: string, data: UpdateProposalPayload) => {
    return HttpClient.patch<CommercialProposalDto>(`/commercial/proposals/${id}`, data);
  },

  simulatePnl: async (data: SimulatePnlPayload) => {
    return HttpClient.post<PnlSimulationResult>('/commercial/proposals/simulate-pnl', data);
  },

  approvePnl: async (id: string) => {
    return HttpClient.post<CommercialProposalDto>(`/commercial/proposals/${id}/approve-pnl`, {});
  },

  issueProposal: async (id: string) => {
    return HttpClient.post<CommercialProposalDto>(`/commercial/proposals/${id}/issue-and-send`, {});
  },

  updateStatus: async (id: string, status: ProposalStatus) => {
    return HttpClient.patch<CommercialProposalDto>(`/commercial/proposals/${id}/status`, { status });
  },

  deleteProposal: async (id: string) => {
    return HttpClient.delete<CommercialProposalDto>(`/commercial/proposals/${id}`);
  },
};
