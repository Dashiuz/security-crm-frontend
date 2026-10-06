import { HttpClient } from "./client";

export enum PqrsType {
  PETICION = "PETICION",
  QUEJA = "QUEJA",
  RECLAMO = "RECLAMO",
  SUGERENCIA = "SUGERENCIA",
  FELICITACION = "FELICITACION",
}

export enum PqrsStatus {
  OPEN = "OPEN",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  REJECTED = "REJECTED",
}

export enum PqrsPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface PqrsTicket {
  id: string;
  tenantId: string;
  clientId: string;
  code: string;
  subject: string;
  description: string;
  status: PqrsStatus;
  priority: PqrsPriority;
  type: PqrsType;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    fullName: string;
    document?: string;
    department?: string;
    position?: string;
  } | null;
  client?: {
    id: string;
    name: string;
    nit?: string;
    email?: string;
    administratorEmail?: string;
    administratorPhone?: string;
  };
  createdBy?: {
    id: string;
    fullName: string;
    document?: string;
  } | null;
  attachments?: any[];
  messages?: PqrsMessage[];
  _count?: {
    messages: number;
    attachments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PqrsMessage {
  id: string;
  ticketId: string;
  clientId: string;
  content: string;
  isFromClient: boolean;
  createdBy?: {
    id: string;
    fullName: string;
    document?: string;
    userType?: string;
  } | null;
  attachments?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePqrsTicketPayload {
  subject: string;
  description: string;
  type: PqrsType;
  priority?: PqrsPriority;
  clientId?: string;
}

export interface UpdatePqrsStatusPayload {
  status: PqrsStatus;
  reason?: string;
}

export interface AssignPqrsTicketPayload {
  assignedToId: string;
  priority?: PqrsPriority;
}

export interface CreatePqrsMessagePayload {
  content: string;
}

export interface QueryPqrsTicketParams {
  status?: PqrsStatus;
  type?: PqrsType;
  priority?: PqrsPriority;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class PqrsApi {
  static async getAll(params?: QueryPqrsTicketParams): Promise<{ data: PqrsTicket[]; meta: any }> {
    const query = new URLSearchParams();
    if (params) {
      if (params.status) query.append("status", params.status);
      if (params.type) query.append("type", params.type);
      if (params.priority) query.append("priority", params.priority);
      if (params.clientId) query.append("clientId", params.clientId);
      if (params.search) query.append("search", params.search);
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
    }
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return HttpClient.get<{ data: PqrsTicket[]; meta: any }>(`/administrative/pqrs${queryString}`);
  }

  static async getById(id: string): Promise<PqrsTicket> {
    return HttpClient.get<PqrsTicket>(`/administrative/pqrs/${id}`);
  }

  static async create(payload: CreatePqrsTicketPayload): Promise<PqrsTicket> {
    return HttpClient.post<PqrsTicket>("/administrative/pqrs", payload);
  }

  static async assign(id: string, payload: AssignPqrsTicketPayload): Promise<PqrsTicket> {
    return HttpClient.patch<PqrsTicket>(`/administrative/pqrs/${id}/assign`, payload);
  }

  static async updateStatus(id: string, payload: UpdatePqrsStatusPayload): Promise<PqrsTicket> {
    return HttpClient.patch<PqrsTicket>(`/administrative/pqrs/${id}/status`, payload);
  }

  static async updatePriority(id: string, priority: PqrsPriority): Promise<PqrsTicket> {
    return HttpClient.patch<PqrsTicket>(`/administrative/pqrs/${id}/priority`, { priority });
  }

  static async addMessage(id: string, payload: CreatePqrsMessagePayload): Promise<PqrsMessage> {
    return HttpClient.post<PqrsMessage>(`/administrative/pqrs/${id}/messages`, payload);
  }

  static async getStats(clientId?: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
  }> {
    const query = clientId ? `?clientId=${clientId}` : "";
    return HttpClient.get<{
      total: number;
      pending: number;
      inProgress: number;
      resolved: number;
    }>(`/administrative/pqrs/stats${query}`);
  }
}

