import { HttpClient } from "./client";

export enum PayrollSettlementStatus {
  DRAFT = "DRAFT",
  APPROVED = "APPROVED",
  PAID = "PAID",
  ANNULLED = "ANNULLED",
}

export enum PayrollDisbursementType {
  PAYROLL_PERIOD = "PAYROLL_PERIOD",
  FORTNIGHT_ADVANCE = "FORTNIGHT_ADVANCE",
  SOCIAL_BENEFITS = "SOCIAL_BENEFITS",
  VACATION_SETTLEMENT = "VACATION_SETTLEMENT",
  FINAL_LIQUIDATION = "FINAL_LIQUIDATION",
}

export enum PayslipDeliveryStatus {
  NOT_SENT = "NOT_SENT",
  SENT = "SENT",
  FAILED = "FAILED",
}

export interface SettlementKpis {
  totalEmployees: number;
  totalEarnings: number;
  totalDeductions: number;
  totalNetPay: number;
  totalEmployerCost: number;
  draftCount: number;
  approvedCount: number;
  paidCount: number;
  bankWarningsCount: number;
  payslipsSentCount: number;
}

export interface LiquidatePeriodDto {
  branchId?: string;
  clientId?: string;
  dependencyId?: string;
  employeeIds?: string[];
  preserveManualEdits?: boolean;
}

export interface SettlementLineEditDto {
  id?: string;
  conceptId: string;
  dependencyId?: string;
  nature: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  isConstitutiveOfSalary?: boolean;
  isDeletable?: boolean;
  notes?: string;
}

export interface ManualEditSettlementDto {
  notes?: string;
  lines: SettlementLineEditDto[];
}

export interface GenerateAdvanceDto {
  year: number;
  month: number;
  cutoffDate?: string;
  defaultAdvancePct?: number;
  deductAbsences?: boolean;
}

export interface UpdateAdvanceItemDto {
  approvedAmount: number;
  notes?: string;
}

export interface GenerateAchFileDto {
  disbursementType: PayrollDisbursementType;
  periodId?: string;
  advanceSettlementId?: string;
  bankId?: string;
  exportFormat?: string;
}

export interface SendPayslipsEmailDto {
  employeeIds?: string[];
  groupOvertime?: boolean;
}

export interface LiquidatePeriodResult {
  settledEmployeesCount: number;
  totalNetPay: number;
}

export interface PeriodSettlementLineRecord {
  id: string;
  tenantId: string;
  settlementId: string;
  conceptId: string;
  concept?: {
    id: string;
    code: string;
    name: string;
    pucAccount: string;
  };
  dependencyId?: string | null;
  nature: string;
  origin: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  isConstitutiveOfSalary: boolean;
  isDeletable: boolean;
  notes?: string | null;
}

export interface PeriodSettlementRecord {
  id: string;
  tenantId: string;
  periodId: string;
  employeeId: string;
  employee?: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
    position?: string;
    email?: string;
    bankName?: string;
    accountNumber?: string;
  };
  status: PayrollSettlementStatus;
  workedDays: number;
  baseSalaryMonthly: number;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  employerTotalCost: number;
  payslipDeliveryStatus: PayslipDeliveryStatus;
  payslipSentAt?: string | null;
  notes?: string | null;
  lines: PeriodSettlementLineRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AchGenerationResult {
  batchId?: string;
  fileName: string;
  fileContent: string;
  mimeType: string;
  totalRecords: number;
  totalAmount: number;
  skippedMissingAccountCount: number;
  warnings?: string[];
}

export interface SendPayslipsResult {
  total: number;
  sentCount: number;
  failedCount: number;
  skippedMissingEmail: number;
  errors?: string[];
}

export interface QuerySettlementsDto {
  search?: string;
  branchId?: string;
  dependencyId?: string;
  status?: string;
}

export class PayrollSettlementApi {
  static async getKpis(periodId: string): Promise<SettlementKpis> {
    return HttpClient.get<SettlementKpis>(`/payroll/settlement/kpis?periodId=${periodId}`);
  }

  static async liquidatePeriod(periodId: string, data: LiquidatePeriodDto): Promise<LiquidatePeriodResult> {
    return HttpClient.post(`/payroll/settlement/liquidate/${periodId}`, data);
  }

  static async findSettlements(periodId: string, query?: QuerySettlementsDto): Promise<PeriodSettlementRecord[]> {
    const params = new URLSearchParams();
    if (query?.search) params.append("search", query.search);
    if (query?.branchId) params.append("branchId", query.branchId);
    if (query?.dependencyId) params.append("dependencyId", query.dependencyId);
    if (query?.status) params.append("status", query.status);
    const qs = params.toString();
    return HttpClient.get<PeriodSettlementRecord[]>(`/payroll/settlement/periods/${periodId}${qs ? `?${qs}` : ""}`);
  }

  static async getSettlementById(settlementId: string): Promise<PeriodSettlementRecord> {
    return HttpClient.get<PeriodSettlementRecord>(`/payroll/settlement/${settlementId}`);
  }

  static async manualEditSettlement(settlementId: string, data: ManualEditSettlementDto): Promise<Record<string, unknown>> {
    return HttpClient.put(`/payroll/settlement/${settlementId}/manual-edit`, data);
  }

  static async closePeriod(periodId: string): Promise<Record<string, unknown>> {
    return HttpClient.post(`/payroll/settlement/periods/${periodId}/close`, {});
  }

  static async reopenPeriod(periodId: string): Promise<Record<string, unknown>> {
    return HttpClient.post(`/payroll/settlement/periods/${periodId}/reopen`, {});
  }

  static async downloadExcelAudit(periodId: string): Promise<void> {
    const token = typeof window !== "undefined" ? localStorage.getItem("access-token") : null;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/payroll/settlement/periods/${periodId}/export/excel`,
      {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (!response.ok) {
      throw new Error("Error al descargar archivo Excel de nómina");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nomina_auditoria_${periodId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  static async generateAdvances(data: GenerateAdvanceDto): Promise<Record<string, unknown>> {
    return HttpClient.post(`/payroll/settlement/advances/generate`, data);
  }

  static async findAdvances(year: number, month: number): Promise<Record<string, unknown> | null> {
    return HttpClient.get<Record<string, unknown> | null>(`/payroll/settlement/advances?year=${year}&month=${month}`);
  }

  static async updateAdvanceItem(itemId: string, data: UpdateAdvanceItemDto): Promise<Record<string, unknown>> {
    return HttpClient.patch(`/payroll/settlement/advances/items/${itemId}`, data);
  }

  static async approveAdvances(advanceId: string): Promise<Record<string, unknown>> {
    return HttpClient.post(`/payroll/settlement/advances/${advanceId}/approve`, {});
  }

  static async generateAch(data: GenerateAchFileDto): Promise<AchGenerationResult> {
    return HttpClient.post(`/payroll/settlement/ach/generate`, data);
  }

  static async downloadPayslipsPdf(
    periodId: string,
    employeeId?: string,
    groupOvertime = false,
  ): Promise<void> {
    const token = typeof window !== "undefined" ? localStorage.getItem("access-token") : null;
    const params = new URLSearchParams();
    if (employeeId) params.append("employeeId", employeeId);
    if (groupOvertime) params.append("groupOvertime", "true");
    const qs = params.toString();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/payroll/settlement/periods/${periodId}/payslips/pdf${qs ? `?${qs}` : ""}`,
      {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (!response.ok) {
      throw new Error("Error al descargar desprendibles de nómina en PDF");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = employeeId
      ? `desprendible_${employeeId}_${periodId}.pdf`
      : `desprendibles_consolidados_${periodId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  static async sendPayslipsEmail(periodId: string, data: SendPayslipsEmailDto): Promise<SendPayslipsResult> {
    return HttpClient.post(`/payroll/settlement/periods/${periodId}/payslips/send-email`, data);
  }
}
