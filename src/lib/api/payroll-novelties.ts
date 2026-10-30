import { HttpClient } from "./client";

export enum LeaveAndAbsenceType {
  SICK_LEAVE_EG = "SICK_LEAVE_EG",
  WORK_ACCIDENT_AT = "WORK_ACCIDENT_AT",
  MATERNITY_PATERNITY_LMA = "MATERNITY_PATERNITY_LMA",
  PAID_LEAVE_LR = "PAID_LEAVE_LR",
  UNPAID_LEAVE_LNR = "UNPAID_LEAVE_LNR",
  DISCIPLINARY_SUSPENSION_SAN = "DISCIPLINARY_SUSPENSION_SAN",
  UNJUSTIFIED_ABSENCE_AUS = "UNJUSTIFIED_ABSENCE_AUS",
  VACATION_TIME_VAC = "VACATION_TIME_VAC",
}

export enum EpsClaimStatus {
  NOT_APPLICABLE = "NOT_APPLICABLE",
  PENDING_FILING = "PENDING_FILING",
  FILED_IN_AUDIT = "FILED_IN_AUDIT",
  APPROVED_PENDING_PAYMENT = "APPROVED_PENDING_PAYMENT",
  PAID_RECOVERED = "PAID_RECOVERED",
  REJECTED = "REJECTED",
}

export enum PayrollLoanStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  PAID_OFF = "PAID_OFF",
  CANCELLED = "CANCELLED",
}

export enum PermanentConceptScope {
  BY_EMPLOYEE = "BY_EMPLOYEE",
  BY_DEPENDENCY = "BY_DEPENDENCY",
}

export enum NoveltyPeriodicityRule {
  ALL_PERIODS = "ALL_PERIODS",
  FIRST_FORTNIGHT_ONLY = "FIRST_FORTNIGHT_ONLY",
  SECOND_FORTNIGHT_ONLY = "SECOND_FORTNIGHT_ONLY",
  END_OF_MONTH_ONLY = "END_OF_MONTH_ONLY",
}

export enum NoveltyOriginType {
  MANUAL = "MANUAL",
  IMPORTED_EXCEL = "IMPORTED_EXCEL",
  AUTOMATIC_SCHEDULE = "AUTOMATIC_SCHEDULE",
}

export interface NoveltiesKpis {
  year: number;
  month: number;
  activeLeavesCount: number;
  pendingClaimsCount: number;
  totalPendingClaimAmount: number;
  activeLoansCount: number;
  totalLoansOutstandingBalance: number;
  periodNoveltiesCount: number;
  totalPeriodNoveltiesAmount: number;
}

export interface IncapacityPreviewResult {
  totalDays: number;
  employerDays: number;
  entityDays: number;
  baseSalaryMonthly: number;
  ibcDailyValue: number;
  smmlvDailyFloor: number;
  employerRecognizedAmount: number;
  entityRecognizedAmount: number;
  totalLiquidatedAmount: number;
  affectsSeventhDay: boolean;
  claimStatus: EpsClaimStatus;
  dailyBreakdown: Array<{
    dayIndex: number;
    dateStr: string;
    payer: "EMPLOYER" | "ENTITY" | "NONE";
    ratePct: number;
    dailyAmount: number;
  }>;
}

export interface PayrollLeaveAndAbsence {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    document: string;
    phone?: string;
  };
  leaveType: LeaveAndAbsenceType;
  conceptId: string;
  cie10Id?: string;
  cie10?: {
    id: string;
    code: string;
    name: string;
  };
  entityId?: string;
  entity?: {
    id: string;
    code: string;
    name: string;
    entityType: string;
  };
  startDate: string;
  endDate: string;
  totalDays: number;
  employerDays: number;
  entityDays: number;
  baseSalaryMonthly: number;
  ibcDailyValue: number;
  employerRecognizedAmount: number;
  entityRecognizedAmount: number;
  totalLiquidatedAmount: number;
  affectsSeventhDay: boolean;
  claimStatus: EpsClaimStatus;
  certificateNumber?: string;
  filingDate?: string;
  paymentDate?: string;
  reimbursedAmount?: number;
  notes?: string;
  createdAt: string;
}

export interface PayrollLoan {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    document: string;
  };
  conceptId: string;
  concept?: {
    id: string;
    code: number;
    name: string;
  };
  loanCode: string;
  description: string;
  principalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  totalPaidAmount: number;
  remainingBalance: number;
  deductionRule: NoveltyPeriodicityRule;
  status: PayrollLoanStatus;
  disbursementDate: string;
  startDeductionDate: string;
  notes?: string;
  installments?: Array<{
    id: string;
    installmentNumber: number;
    paymentDate: string;
    amount: number;
    balanceAfter: number;
    notes?: string;
  }>;
  createdAt: string;
}

export interface PayrollPermanentConcept {
  id: string;
  scope: PermanentConceptScope;
  employeeId?: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    document: string;
  };
  dependencyId?: string;
  dependency?: {
    id: string;
    name: string;
    code: number;
  };
  conceptId: string;
  concept?: {
    id: string;
    code: number;
    name: string;
    nature: string;
  };
  amount: number;
  isProportionalToDays: boolean;
  applicationRule: NoveltyPeriodicityRule;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface PayrollPeriodNovelty {
  id: string;
  periodId: string;
  employeeId: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    document: string;
  };
  dependencyId?: string;
  dependency?: {
    id: string;
    name: string;
  };
  conceptId: string;
  concept?: {
    id: string;
    code: number;
    name: string;
    nature: string;
  };
  noveltyDate: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  origin: NoveltyOriginType;
  notes?: string;
  createdAt: string;
}

export const payrollNoveltiesApi = {
  getKpis: (year?: number, month?: number) => {
    const q = new URLSearchParams();
    if (year) q.append("year", String(year));
    if (month) q.append("month", String(month));
    const qs = q.toString();
    return HttpClient.get<NoveltiesKpis>(`/payroll/novelties/kpis${qs ? `?${qs}` : ""}`);
  },

  // Leaves & Incapacities
  previewLeave: (data: {
    leaveType: LeaveAndAbsenceType;
    startDate: string;
    endDate: string;
    baseSalaryMonthly?: number;
    employeeId?: string;
    isExtension?: boolean;
    accumulatedPriorDays?: number;
  }) => HttpClient.post<IncapacityPreviewResult>("/payroll/novelties/leaves/preview", data),

  listLeaves: (params?: {
    employeeId?: string;
    leaveType?: LeaveAndAbsenceType;
    claimStatus?: EpsClaimStatus;
    startDate?: string;
    endDate?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.employeeId) q.append("employeeId", params.employeeId);
    if (params?.leaveType) q.append("leaveType", params.leaveType);
    if (params?.claimStatus) q.append("claimStatus", params.claimStatus);
    if (params?.startDate) q.append("startDate", params.startDate);
    if (params?.endDate) q.append("endDate", params.endDate);
    const qs = q.toString();
    return HttpClient.get<PayrollLeaveAndAbsence[]>(`/payroll/novelties/leaves${qs ? `?${qs}` : ""}`);
  },

  createLeave: (data: any) => HttpClient.post<PayrollLeaveAndAbsence>("/payroll/novelties/leaves", data),

  updateClaimStatus: (
    id: string,
    data: {
      claimStatus: EpsClaimStatus;
      certificateNumber?: string;
      filingDate?: string;
      paymentDate?: string;
      reimbursedAmount?: number;
      rejectionReason?: string;
    }
  ) => HttpClient.patch<PayrollLeaveAndAbsence>(`/payroll/novelties/leaves/${id}/claim`, data),

  deleteLeave: (id: string) => HttpClient.delete<PayrollLeaveAndAbsence>(`/payroll/novelties/leaves/${id}`),

  // Loans & Installments
  listLoans: (params?: { employeeId?: string; status?: PayrollLoanStatus }) => {
    const q = new URLSearchParams();
    if (params?.employeeId) q.append("employeeId", params.employeeId);
    if (params?.status) q.append("status", params.status);
    const qs = q.toString();
    return HttpClient.get<PayrollLoan[]>(`/payroll/novelties/loans${qs ? `?${qs}` : ""}`);
  },

  createLoan: (data: any) => HttpClient.post<PayrollLoan>("/payroll/novelties/loans", data),

  updateLoanStatus: (id: string, data: { status: PayrollLoanStatus; notes?: string }) =>
    HttpClient.patch<PayrollLoan>(`/payroll/novelties/loans/${id}/status`, data),

  recordLoanInstallment: (
    id: string,
    data: { amount: number; periodId?: string; notes?: string }
  ) => HttpClient.post<{ installment: any; loan: PayrollLoan }>(`/payroll/novelties/loans/${id}/installments`, data),

  // Permanent Concepts
  listPermanentConcepts: (params?: {
    scope?: PermanentConceptScope;
    employeeId?: string;
    dependencyId?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.scope) q.append("scope", params.scope);
    if (params?.employeeId) q.append("employeeId", params.employeeId);
    if (params?.dependencyId) q.append("dependencyId", params.dependencyId);
    const qs = q.toString();
    return HttpClient.get<PayrollPermanentConcept[]>(`/payroll/novelties/permanent-concepts${qs ? `?${qs}` : ""}`);
  },

  createPermanentConcept: (data: any) =>
    HttpClient.post<PayrollPermanentConcept>("/payroll/novelties/permanent-concepts", data),

  deletePermanentConcept: (id: string) =>
    HttpClient.delete<PayrollPermanentConcept>(`/payroll/novelties/permanent-concepts/${id}`),

  // Period Novelties
  listPeriodNovelties: (params?: { periodId?: string; employeeId?: string; conceptId?: string }) => {
    const q = new URLSearchParams();
    if (params?.periodId) q.append("periodId", params.periodId);
    if (params?.employeeId) q.append("employeeId", params.employeeId);
    if (params?.conceptId) q.append("conceptId", params.conceptId);
    const qs = q.toString();
    return HttpClient.get<PayrollPeriodNovelty[]>(`/payroll/novelties/period-novelties${qs ? `?${qs}` : ""}`);
  },

  createPeriodNovelty: (data: any) =>
    HttpClient.post<PayrollPeriodNovelty>("/payroll/novelties/period-novelties", data),

  bulkImportPeriodNovelties: (data: { novelties: any[] }) =>
    HttpClient.post<{ importedCount: number }>("/payroll/novelties/period-novelties/bulk-import", data),

  deletePeriodNovelty: (id: string) =>
    HttpClient.delete<PayrollPeriodNovelty>(`/payroll/novelties/period-novelties/${id}`),

  // CIE-10 Diagnostics
  listCie10: (search?: string) => {
    const q = new URLSearchParams();
    if (search) q.append("search", search);
    const qs = q.toString();
    return HttpClient.get<Array<{ id: string; code: string; name: string }>>(`/payroll/catalogs/cie10${qs ? `?${qs}` : ""}`);
  },
};

