import { HttpClient } from './client';

export type ServiceOrderStatus =
  | 'DRAFT_CONFIGURING'
  | 'ISSUED_DISPATCHED'
  | 'IN_OPERATION'
  | 'CANCELLED';

export type ServiceOrderType = 'NEW_SITE' | 'CONTRACT_RENEWAL' | 'POSITION_ADDITION';
export type EquipmentDeliveryStatus = 'PENDING_WAREHOUSE' | 'DISPATCHED_TO_SITE' | 'DELIVERED_ON_SITE';
export type ShiftScheduleType =
  | 'SCHEDULE_2X2X2'
  | 'SCHEDULE_3X3X2'
  | 'SCHEDULE_4X4X2'
  | 'SCHEDULE_5X1'
  | 'SCHEDULE_5X2'
  | 'SCHEDULE_6X1'
  | 'SCHEDULE_6X2'
  | 'SCHEDULE_7X1'
  | 'SPECIAL_CUSTOM';

export type WeaponModality = 'NO_WEAPON' | 'LETHAL_WEAPON' | 'NON_LETHAL_WEAPON' | 'CANINE_SUPPORT';

export interface ServiceOrderPositionPayload {
  id?: string;
  positionTitle: string;
  quantityGuards: number;
  scheduleType: ShiftScheduleType;
  weaponModality: WeaponModality;
  netMonthlySalaryToPay: number;
  minYearsExperiencePh?: number;
  preferredGender?: string;
  requiresCurrentCourse?: boolean;
  requiresGalaUniform?: boolean;
  specificProfileTraits?: any;
}

export interface ServiceOrderEquipmentPayload {
  id?: string;
  itemName: string;
  quantity: number;
  isMandatoryOnSite?: boolean;
  deliveryStatus?: EquipmentDeliveryStatus;
  serialNumbers?: string;
  notes?: string;
}

export interface CreateServiceOrderPayload {
  clientId: string;
  proposalId?: string;
  orderType?: ServiceOrderType;
  installationDate: string;
  contractEndDate: string;
  empalmeDaysPrior?: number;
  siteAddress: string;
  siteCity: string;
  sitePhone?: string;
  legalRepName: string;
  legalRepPhone?: string;
  administratorName: string;
  administratorPhone?: string;
  administratorEmail?: string;
  assignedCoordinatorId?: string;
  assignedCoordinatorName?: string;
  totalMonthlyBeforeTax: number;
  totalMonthlyWithTax: number;
  operationalNotes?: string;
  positions: ServiceOrderPositionPayload[];
  equipment?: ServiceOrderEquipmentPayload[];
}

export interface UpdateServiceOrderPayload extends Partial<CreateServiceOrderPayload> {
  status?: ServiceOrderStatus;
}

export interface ServiceOrderDto {
  id: string;
  tenantId: string;
  clientId: string;
  proposalId?: string | null;
  orderFolioCode: string;
  omegaCode: string;
  orderType: ServiceOrderType;
  status: ServiceOrderStatus;
  installationDate: string;
  contractEndDate: string;
  empalmeDaysPrior: number;
  siteAddress: string;
  siteCity: string;
  sitePhone?: string | null;
  legalRepName: string;
  legalRepPhone?: string | null;
  administratorName: string;
  administratorPhone?: string | null;
  administratorEmail?: string | null;
  assignedCoordinatorId?: string | null;
  assignedCoordinatorName?: string | null;
  commercialUserId: string;
  totalMonthlyBeforeTax: number;
  totalMonthlyWithTax: number;
  operationalNotes?: string | null;
  client?: {
    id: string;
    name: string;
    nit: string;
    internalCode?: string | null;
    stratum?: number | null;
    sector: string;
  };
  proposal?: {
    id: string;
    proposalFolioCode: string;
    versionNumber: number;
    status: string;
    pnlStatus: string;
  };
  positions?: any[];
  equipment?: any[];
  dispatchLogs?: Array<{
    id: string;
    department: string;
    recipientEmail: string;
    dispatchedAt: string;
    wasEmailSuccess: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrderFilterParams {
  clientId?: string;
  status?: ServiceOrderStatus;
  search?: string;
  cursor?: string;
  take?: number;
}

export const commercialServiceOrdersApi = {
  getServiceOrders: async (params?: ServiceOrderFilterParams) => {
    const query = new URLSearchParams();
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.take) query.set('take', params.take.toString());

    const qs = query.toString();
    return HttpClient.get<{ data: ServiceOrderDto[]; meta: { nextCursor: string | null; take: number } }>(
      `/commercial/service-orders${qs ? `?${qs}` : ''}`,
    );
  },

  getServiceOrderById: async (id: string) => {
    return HttpClient.get<ServiceOrderDto>(`/commercial/service-orders/${id}`);
  },

  createServiceOrder: async (data: CreateServiceOrderPayload) => {
    return HttpClient.post<ServiceOrderDto>('/commercial/service-orders', data);
  },

  updateServiceOrder: async (id: string, data: UpdateServiceOrderPayload) => {
    return HttpClient.patch<ServiceOrderDto>(`/commercial/service-orders/${id}`, data);
  },

  dispatchOrder: async (id: string, data?: { dispatchNotes?: string }) => {
    return HttpClient.post<{ order: ServiceOrderDto; dispatchedDepartmentsCount: number }>(
      `/commercial/service-orders/${id}/dispatch`,
      data || {},
    );
  },

  updateStatus: async (id: string, status: ServiceOrderStatus) => {
    return HttpClient.patch<ServiceOrderDto>(`/commercial/service-orders/${id}/status`, { status });
  },

  deleteServiceOrder: async (id: string) => {
    return HttpClient.delete<ServiceOrderDto>(`/commercial/service-orders/${id}`);
  },
};
