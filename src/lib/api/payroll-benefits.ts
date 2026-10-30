import { HttpClient } from "./client";

export type VacationSettlementType = "ENJOYED_IN_TIME" | "COMPENSATED_IN_CASH";
export type SocialBenefitType =
  | "PRIMA_FIRST_SEMESTER"
  | "PRIMA_SECOND_SEMESTER"
  | "SEVERANCE_ANNUAL"
  | "SEVERANCE_INTERESTS";
export type PayrollSettlementStatus = "DRAFT" | "APPROVED" | "PAID" | "ANNULLED";

export interface BenefitsKpis {
  totalActiveEmployees: number;
  employeesWithOver15VacationDays: number;
  latestPrimaBatch: {
    label: string;
    status: PayrollSettlementStatus;
    totalBenefitAmount: number;
    totalEmployees: number;
  } | null;
  latestSeveranceBatch: {
    label: string;
    status: PayrollSettlementStatus;
    totalBenefitAmount: number;
    totalInterestAmount: number;
  } | null;
  finalSettlementsCountThisYear: number;
}

export interface VacationBookItem {
  employeeId: string;
  document: string;
  fullName: string;
  hireDate: string;
  dependencyName: string;
  currentBasicSalary: number;
  totalServiceDays: number;
  totalAccruedBusinessDays: number;
  totalEnjoyedBusinessDays: number;
  pendingBusinessDays: number;
  alertLevel: "NORMAL" | "ALERT_MED" | "ALERT_HIGH";
  settlementsCount: number;
}

export interface SimulateVacationPayload {
  employeeId: string;
  vacationType: VacationSettlementType;
  enjoymentStartDate: string;
  businessDays: number;
  loansToDeduct?: number;
}

export interface VacationCalculationResult {
  enjoymentStartDate: string;
  enjoymentEndDate: string;
  returnDate: string;
  businessDays: number;
  nonWorkingDaysIncluded: number;
  calendarDaysPaid: number;
  saturdayWasWorkingDay: boolean;
  currentBasicSalary: number;
  averageVariableVacBase: number;
  totalVacationBase: number;
  dailyVacationRate: number;
  grossVacationAmount: number;
  healthDeductionAmount: number;
  pensionDeductionAmount: number;
  loansDeductionAmount: number;
  netPayAmount: number;
  employee: {
    id: string;
    document: string;
    fullName: string;
  };
}

export interface CreateVacationPayload extends SimulateVacationPayload {
  accrualStartDate: string;
  accrualEndDate: string;
  paymentDate?: string;
  notes?: string;
}

export interface VacationSettlement {
  id: string;
  employeeId: string;
  vacationType: VacationSettlementType;
  status: PayrollSettlementStatus;
  accrualStartDate: string;
  accrualEndDate: string;
  enjoymentStartDate: string;
  enjoymentEndDate: string;
  returnDate: string;
  businessDays: number;
  nonWorkingDaysIncluded: number;
  calendarDaysPaid: number;
  currentBasicSalary: number;
  averageVariableVacBase: number;
  totalVacationBase: number;
  grossVacationAmount: number;
  healthDeductionAmount: number;
  pensionDeductionAmount: number;
  loansDeductionAmount: number;
  netPayAmount: number;
  paymentDate?: string | null;
  linkedLeaveId?: string | null;
  notes?: string | null;
  createdAt: string;
  employee?: {
    id: string;
    document: string;
    firstName: string;
    lastName: string;
    payrollProfile?: {
      primaryDependency?: { name: string };
    };
  };
}

export interface GenerateBatchPayload {
  benefitType: SocialBenefitType;
  year: number;
  cutoffDate: string;
  projectionEndDate: string;
  paymentDate?: string;
  notes?: string;
}

export interface SocialBenefitItem {
  id: string;
  batchId: string;
  employeeId: string;
  hireDateSnapshot: string;
  grossDaysInPeriod: number;
  unpaidLeaveDaysDeducted: number;
  projectedDaysAdded: number;
  netDaysWorked: number;
  basicSalaryMonthly: number;
  averageVariableEarnings: number;
  transportAllowanceBase: number;
  totalComputationBase: number;
  calculatedBenefitAmount: number;
  approvedBenefitAmount: number;
  interestRatePct: number;
  calculatedInterestAmount: number;
  approvedInterestAmount: number;
  bankAccountType: string;
  bankAccountNumber?: string | null;
  hasBankWarning: boolean;
  isManuallyEdited: boolean;
  isInjectedToPayroll: boolean;
  injectedPeriodId?: string | null;
  notes?: string | null;
  employee?: {
    id: string;
    document: string;
    firstName: string;
    lastName: string;
  };
  cesantiasEntity?: {
    id: string;
    name: string;
    code: string;
  } | null;
  bank?: {
    id: string;
    name: string;
  } | null;
}

export interface SocialBenefitBatch {
  id: string;
  benefitType: SocialBenefitType;
  year: number;
  label: string;
  periodStartDate: string;
  cutoffDate: string;
  projectionEndDate: string;
  paymentDate?: string | null;
  status: PayrollSettlementStatus;
  totalEmployees: number;
  totalBenefitAmount: number;
  totalInterestAmount: number;
  notes?: string | null;
  createdAt: string;
  items?: SocialBenefitItem[];
  fundsSummary?: Array<{
    entityName: string;
    totalAmount: number;
    count: number;
  }>;
}

export interface SimulateFinalLiquidationPayload {
  employeeId: string;
  retirementDate: string;
  exitReasonId: string;
  includePendingPayroll?: boolean;
  applyIndemnification?: boolean;
  otherEarningsAmount?: number;
  otherEarningsConcept?: string;
  otherDeductionsAmount?: number;
  otherDeductionsConcept?: string;
  blockForRehireBdn?: boolean;
}

export interface FinalLiquidationSimulationResult {
  totalContractDays360: number;
  unpaidLeaveDaysTotal: number;
  netServiceDaysTotal: number;
  lastBasicSalary: number;
  transportAllowanceApplicable: number;
  cesantiasAverageBase: number;
  primaAverageBase: number;
  vacationAverageBase: number;
  cesantiasPendingDays: number;
  cesantiasAmount: number;
  interestsCesantiasAmount: number;
  primaPendingDays: number;
  primaAmount: number;
  vacationTotalAccruedDays: number;
  vacationEnjoyedDays: number;
  vacationPendingBusinessDays: number;
  vacationAmount: number;
  includePendingPayroll: boolean;
  pendingPayrollDays: number;
  pendingBasicSalaryAmount: number;
  pendingTransportAmount: number;
  pendingOvertimeAmount: number;
  pendingHealthDeduction: number;
  pendingPensionDeduction: number;
  applyIndemnification: boolean;
  indemnificationDays: number;
  indemnificationAmount: number;
  otherEarningsAmount: number;
  loansDeductedAmount: number;
  otherDeductionsAmount: number;
  totalBenefitsAndEarnings: number;
  totalDeductions: number;
  netPayAmount: number;
  employee: {
    id: string;
    document: string;
    fullName: string;
    dependencyName?: string;
    contractType: string;
  };
  exitReason: {
    id: string;
    code: number;
    name: string;
    isJustCause: boolean;
  };
  activeLoansCount: number;
}

export interface CreateFinalSettlementPayload extends SimulateFinalLiquidationPayload {
  paymentDate?: string;
  notes?: string;
}

export interface FinalContractSettlement {
  id: string;
  employeeId: string;
  exitReasonId: string;
  status: PayrollSettlementStatus;
  contractTypeSnapshot: string;
  hireDate: string;
  retirementDate: string;
  totalContractDays360: number;
  netServiceDaysTotal: number;
  lastBasicSalary: number;
  cesantiasAmount: number;
  interestsCesantiasAmount: number;
  primaAmount: number;
  vacationAmount: number;
  indemnificationAmount: number;
  loansDeductedAmount: number;
  netPayAmount: number;
  blockForRehireBdn: boolean;
  paymentDate?: string | null;
  notes?: string | null;
  createdAt: string;
  employee?: {
    id: string;
    document: string;
    firstName: string;
    lastName: string;
    payrollProfile?: {
      primaryDependency?: { name: string };
    };
  };
  exitReason?: {
    id: string;
    code: number;
    name: string;
    isJustCause: boolean;
  };
}

export const payrollBenefitsApi = {
  // 1. KPIs
  getKpis: () => HttpClient.get<BenefitsKpis>("/payroll/benefits/kpis"),

  // 2. Vacaciones
  getVacationBook: () => HttpClient.get<VacationBookItem[]>("/payroll/benefits/vacations/book"),
  simulateVacation: (payload: SimulateVacationPayload) =>
    HttpClient.post<VacationCalculationResult>("/payroll/benefits/vacations/simulate", payload),
  createVacation: (payload: CreateVacationPayload) =>
    HttpClient.post<VacationSettlement>("/payroll/benefits/vacations", payload),
  approveVacation: (id: string) =>
    HttpClient.post<VacationSettlement>(`/payroll/benefits/vacations/${id}/approve`, {}),
  listVacations: (employeeId?: string) =>
    HttpClient.get<VacationSettlement[]>(`/payroll/benefits/vacations${employeeId ? `?employeeId=${employeeId}` : ""}`),
  downloadVacationPdf: (id: string) => HttpClient.getBlob(`/payroll/benefits/vacations/${id}/pdf`),
  downloadVacationSlipPdf: (id: string) => HttpClient.getBlob(`/payroll/benefits/vacations/${id}/pdf`),

  // 3. Prima y Cesantías
  generateBatch: (payload: GenerateBatchPayload) =>
    HttpClient.post<SocialBenefitBatch>("/payroll/benefits/batches/generate", payload),
  listBatches: (year?: number) =>
    HttpClient.get<SocialBenefitBatch[]>(`/payroll/benefits/batches${year ? `?year=${year}` : ""}`),
  getBatch: (batchId: string) => HttpClient.get<SocialBenefitBatch>(`/payroll/benefits/batches/${batchId}`),
  updateBatchItem: (itemId: string, payload: { approvedBenefitAmount?: number; approvedInterestAmount?: number; notes?: string }) =>
    HttpClient.patch<SocialBenefitItem>(`/payroll/benefits/batches/items/${itemId}`, payload),
  approveBatch: (batchId: string) =>
    HttpClient.post<SocialBenefitBatch>(`/payroll/benefits/batches/${batchId}/approve`, {}),
  injectToPayroll: (batchId: string, payload: { targetPeriodId: string; conceptId?: string }) =>
    HttpClient.post<{ batchId: string; targetPeriodId: string; injectedCount: number; message: string }>(
      `/payroll/benefits/batches/${batchId}/inject-to-payroll`,
      payload,
    ),

  // 4. Liquidación Definitiva
  simulateFinalSettlement: (payload: SimulateFinalLiquidationPayload) =>
    HttpClient.post<FinalLiquidationSimulationResult>("/payroll/benefits/final-settlements/simulate", payload),
  createFinalSettlement: (payload: CreateFinalSettlementPayload) =>
    HttpClient.post<FinalContractSettlement>("/payroll/benefits/final-settlements", payload),
  approveFinalSettlement: (id: string) =>
    HttpClient.post<FinalContractSettlement>(`/payroll/benefits/final-settlements/${id}/approve`, {}),
  listFinalSettlements: () => HttpClient.get<FinalContractSettlement[]>("/payroll/benefits/final-settlements"),
  listFinalContractSettlements: () => HttpClient.get<FinalContractSettlement[]>("/payroll/benefits/final-settlements"),
  downloadFinalSettlementPdf: (id: string) => HttpClient.getBlob(`/payroll/benefits/final-settlements/${id}/pdf`),
};

