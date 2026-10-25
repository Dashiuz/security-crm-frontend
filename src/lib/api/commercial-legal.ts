import { HttpClient } from './client';

export type PolicyType =
  | 'COMPLIANCE'
  | 'WAGES_AND_BENEFITS'
  | 'SERVICE_QUALITY'
  | 'CIVIL_LIABILITY_PLO'
  | 'GLOBAL_THEFT';

export type PolicyStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CANCELLED';

export type AnsCommitmentType =
  | 'SECURITY_STUDY_DELIVERY'
  | 'PRIOR_TAKEOVER_EMPALME'
  | 'FREE_GUARD_SUPPORT_12H'
  | 'QUARTERLY_MANAGEMENT_REP';

export type AnsCommitmentStatus = 'PENDING' | 'FULFILLED' | 'BREACHED';

export interface InsurancePolicyDto {
  id: string;
  tenantId: string;
  clientId: string;
  policyType: PolicyType;
  insuranceCompanyName: string;
  policyCertificateNumber: string;
  insuredAmount: number;
  effectiveStartDate: string;
  effectiveEndDate: string;
  status: PolicyStatus;
  mediaAttachmentId?: string | null;
  mediaAttachment?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ContractAddendumDto {
  id: string;
  tenantId: string;
  clientId: string;
  addendumNumber: string;
  title: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
  durationYears: number;
  reinvestmentAmountPact: number;
  disbursedAmount: number;
  disbursementDate?: string | null;
  description?: string | null;
  mediaAttachmentId?: string | null;
  mediaAttachment?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AnsCommitmentDto {
  id: string;
  tenantId: string;
  clientId: string;
  commitmentType: AnsCommitmentType;
  title: string;
  dueDate: string;
  deliveredDate?: string | null;
  status: AnsCommitmentStatus;
  evidenceNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const commercialLegalApi = {
  // Policies
  getPoliciesByClient: async (clientId: string) => {
    return HttpClient.get<InsurancePolicyDto[]>(`/commercial/legal/policies/client/${clientId}`);
  },
  createPolicy: async (data: any) => {
    return HttpClient.post<InsurancePolicyDto>('/commercial/legal/policies', data);
  },
  updatePolicy: async (id: string, data: any) => {
    return HttpClient.patch<InsurancePolicyDto>(`/commercial/legal/policies/${id}`, data);
  },
  deletePolicy: async (id: string) => {
    return HttpClient.delete<InsurancePolicyDto>(`/commercial/legal/policies/${id}`);
  },

  // Addendums
  getAddendumsByClient: async (clientId: string) => {
    return HttpClient.get<ContractAddendumDto[]>(`/commercial/legal/addendums/client/${clientId}`);
  },
  createAddendum: async (data: any) => {
    return HttpClient.post<ContractAddendumDto>('/commercial/legal/addendums', data);
  },
  updateAddendum: async (id: string, data: any) => {
    return HttpClient.patch<ContractAddendumDto>(`/commercial/legal/addendums/${id}`, data);
  },
  deleteAddendum: async (id: string) => {
    return HttpClient.delete<ContractAddendumDto>(`/commercial/legal/addendums/${id}`);
  },

  // ANS
  getAnsByClient: async (clientId: string) => {
    return HttpClient.get<AnsCommitmentDto[]>(`/commercial/legal/ans/client/${clientId}`);
  },
  createAns: async (data: any) => {
    return HttpClient.post<AnsCommitmentDto>('/commercial/legal/ans', data);
  },
  updateAns: async (id: string, data: any) => {
    return HttpClient.patch<AnsCommitmentDto>(`/commercial/legal/ans/${id}`, data);
  },
  deleteAns: async (id: string) => {
    return HttpClient.delete<AnsCommitmentDto>(`/commercial/legal/ans/${id}`);
  },
};
