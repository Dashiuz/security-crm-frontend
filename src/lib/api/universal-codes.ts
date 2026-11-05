import { HttpClient } from "./client";

export type CodeType = "QR_CODE" | "BARCODE_128" | "BARCODE_EAN13";

export type CodePurpose =
  | "PATROL_CHECKPOINT"
  | "INVENTORY_ASSET"
  | "EMPLOYEE_CREDENTIAL"
  | "RESIDENT_VEHICLE"
  | "VISITOR_PASS"
  | "DOCUMENT_VERIFICATION"
  | "CORRESPONDENCE_PACKAGE"
  | "OTHER_CUSTOM";

export type CodeStatus = "ACTIVE" | "INACTIVE" | "REVOKED";

export interface UniversalCode {
  id: string;
  tenantId: string;
  code: string;
  codeType: CodeType;
  purpose: CodePurpose;
  title: string;
  description?: string | null;
  department?: string | null;
  clientId?: string | null;
  batchId?: string | null;
  status: CodeStatus;
  metadata?: Record<string, any> | null;
  createdById?: string | null;
  createdBy?: {
    id: string;
    fullName: string;
    document?: string | null;
  } | null;
  updatedById?: string | null;
  updatedBy?: {
    id: string;
    fullName: string;
    document?: string | null;
  } | null;
  client?: {
    id: string;
    name: string;
    internalCode?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUniversalCodePayload {
  code?: string;
  codeType: CodeType;
  purpose: CodePurpose;
  title: string;
  description?: string;
  department?: string;
  clientId?: string;
  batchId?: string;
  metadata?: Record<string, any>;
}

export interface CreateBatchUniversalCodesPayload {
  codeType: CodeType;
  purpose: CodePurpose;
  quantity: number;
  titlePattern: string;
  batchId?: string;
  department?: string;
  clientId?: string;
  baseMetadata?: Record<string, any>;
}

export interface BatchUpdateItemPayload {
  id: string;
  title?: string;
  department?: string;
  status?: CodeStatus;
  metadata?: Record<string, any>;
}

export interface BatchItemSummary {
  batchId: string;
  count: number;
  purpose: CodePurpose;
  codeType: CodeType;
  department: string | null;
  createdAt: string;
}

export interface UniversalCodesStats {
  total: number;
  active: number;
  inactive: number;
  batchesCount: number;
}

export interface QueryUniversalCodesParams {
  search?: string;
  codeType?: CodeType;
  purpose?: CodePurpose;
  status?: CodeStatus;
  clientId?: string;
  batchId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedUniversalCodes {
  data: UniversalCode[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class UniversalCodesApi {
  static async create(payload: CreateUniversalCodePayload): Promise<UniversalCode> {
    return HttpClient.post<UniversalCode>("/tools/universal-codes", payload);
  }

  static async createBatch(payload: CreateBatchUniversalCodesPayload): Promise<UniversalCode[]> {
    return HttpClient.post<UniversalCode[]>("/tools/universal-codes/batch", payload);
  }

  static async updateBatch(payload: { items: BatchUpdateItemPayload[] }): Promise<UniversalCode[]> {
    return HttpClient.patch<UniversalCode[]>("/tools/universal-codes/batch", payload);
  }

  static async listBatches(): Promise<BatchItemSummary[]> {
    return HttpClient.get<BatchItemSummary[]>("/tools/universal-codes/batches");
  }

  static async getStats(): Promise<UniversalCodesStats> {
    return HttpClient.get<UniversalCodesStats>("/tools/universal-codes/stats");
  }

  static async list(params?: QueryUniversalCodesParams): Promise<PaginatedUniversalCodes> {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.codeType) query.append("codeType", params.codeType);
    if (params?.purpose) query.append("purpose", params.purpose);
    if (params?.status) query.append("status", params.status);
    if (params?.clientId) query.append("clientId", params.clientId);
    if (params?.batchId) query.append("batchId", params.batchId);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const qs = query.toString();
    const endpoint = `/tools/universal-codes${qs ? `?${qs}` : ""}`;
    return HttpClient.get<PaginatedUniversalCodes>(endpoint);
  }

  static async resolve(code: string): Promise<UniversalCode> {
    return HttpClient.get<UniversalCode>(`/tools/universal-codes/resolve/${encodeURIComponent(code)}`);
  }

  static async verifyPublic(code: string): Promise<UniversalCode> {
    return HttpClient.get<UniversalCode>(`/public/universal-codes/verify/${encodeURIComponent(code)}`);
  }

  static async update(id: string, payload: Partial<CreateUniversalCodePayload> & { status?: CodeStatus }): Promise<UniversalCode> {
    return HttpClient.patch<UniversalCode>(`/tools/universal-codes/${id}`, payload);
  }

  static async remove(id: string): Promise<{ message: string; id: string }> {
    return HttpClient.delete<{ message: string; id: string }>(`/tools/universal-codes/${id}`);
  }
}

