import { HttpClient } from "./client";
import {
  PilaBatchStatus,
  DianProviderMode,
  DianEnvironmentType,
  ElectronicPayrollStatus,
  ElectronicDocumentType,
  AccountingExportFormat,
} from "./payroll";

// ============================================================================
// TYPES & INTERFACES FOR COMPLIANCE (SPEC-ADM-033)
// ============================================================================

export interface PilaRecordLine {
  id: string;
  sequenceNumber: number;
  employeeId: string;
  documentType: string;
  documentNumber: string;
  firstLastName: string;
  secondLastName?: string | null;
  firstName: string;
  secondName?: string | null;
  daneDepartmentCode: string;
  daneCityCode: string;
  contributorType: string;
  contributorSubtype: string;
  epsCodePlu: string;
  afpCodePlu: string;
  ccfCodePlu: string;
  arlRatePct: number;
  workedDaysPension: number;
  workedDaysHealth: number;
  workedDaysArl: number;
  workedDaysCcf: number;
  isIng: boolean;
  isRet: boolean;
  isIge: boolean;
  isIrl: boolean;
  isLma: boolean;
  isVacLr: boolean;
  isSln: boolean;
  isVst: boolean;
  baseSalary: number;
  ibcHealth: number;
  ibcPension: number;
  ibcArl: number;
  ibcCcf: number;
  healthTotalAmount: number;
  pensionTotalAmount: number;
  fspAmount: number;
  arlAmount: number;
  ccfAmount: number;
  totalLineAmount: number;
  rawPositionalRecord?: string;
  employee?: {
    id: string;
    documentType: string;
    document: string;
    firstName: string;
    lastName: string;
  };
}

export interface PilaBatch {
  id: string;
  tenantId: string;
  periodId: string;
  branchId?: string | null;
  status: PilaBatchStatus;
  operatorName: string;
  payrollType: string;
  totalEmployees: number;
  totalLines: number;
  totalIbcHealth: number;
  totalIbcPension: number;
  totalIbcArl: number;
  totalIbcCcf: number;
  totalHealthEmployee: number;
  totalHealthEmployer: number;
  totalPensionEmployee: number;
  totalPensionEmployer: number;
  totalFsp: number;
  totalArl: number;
  totalCcf: number;
  totalSena: number;
  totalIcbf: number;
  totalExoneratedLaw1607: number;
  grandTotalAmount: number;
  fileNameTxt?: string;
  fileNameCsv?: string;
  generatedAt: string;
  period?: {
    id: string;
    code: number;
    label: string;
    startDate: string;
    endDate: string;
  };
  lines?: PilaRecordLine[];
}

export interface ElectronicDocument {
  id: string;
  consecutive: number;
  documentNumber: string;
  documentType: ElectronicDocumentType;
  providerMode: DianProviderMode;
  status: ElectronicPayrollStatus;
  cune: string;
  qrUrl: string;
  issueDate: string;
  workedDays: number;
  totalAccrued: number;
  totalDeductions: number;
  netAmount: number;
  nieBreakdownJson?: Record<string, any>;
  xmlContent?: string;
  providerPayloadJson?: any;
  rejectionErrorsJson?: string[];
  predecessorDocId?: string | null;
  predecessorCune?: string | null;
  employee?: {
    id: string;
    documentType: string;
    document: string;
    firstName: string;
    lastName: string;
  };
}

export interface ElectronicBatch {
  id: string;
  year: number;
  month: number;
  providerMode: DianProviderMode;
  environment: DianEnvironmentType;
  prefix: string;
  status: ElectronicPayrollStatus;
  totalDocuments: number;
  validatedDocuments: number;
  acceptedDocuments: number;
  rejectedDocuments: number;
  totalAccrued: number;
  totalDeductions: number;
  netAmount: number;
  period?: {
    id: string;
    code: number;
    label: string;
    startDate: string;
    endDate: string;
  };
  documents?: ElectronicDocument[];
}

export interface AccountingLine {
  id: string;
  sequence: number;
  pucAccount: string;
  accountName: string;
  thirdPartyNit: string;
  thirdPartyName: string;
  costCenterCode?: string | null;
  costCenterName?: string | null;
  dependencyCode?: number | null;
  conceptCode?: number | null;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

export interface AccountingBatch {
  id: string;
  periodId: string;
  exportFormat: AccountingExportFormat;
  batchNumber: string;
  accountingDate: string;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  fileName?: string;
  totalLines: number;
  period?: {
    id: string;
    code: number;
    label: string;
    startDate: string;
    endDate: string;
  };
  lines?: AccountingLine[];
  formattedContent?: string;
}

export interface TaxCertificate220 {
  id: string;
  year: number;
  employeeId: string;
  issueDate: string;
  certifiedFromDate: string;
  certifiedToDate: string;
  expeditionCity: string;
  retentionAgentNit: string;
  retentionAgentName: string;
  employeeDocument: string;
  employeeFullName: string;
  row36Salaries: number;
  row37Honoraries: number;
  row38SocialBenefits: number;
  row39AllowancesNonSalarial: number;
  row40OtherIncome: number;
  row41Indemnifications: number;
  row46SeverancePaid: number;
  row47PensionsIncome: number;
  row49TotalGrossIncome: number;
  row50HealthDeduction: number;
  row51PensionAndFspDeduction: number;
  row52VoluntaryPensionDeduction: number;
  row53AfcDeduction: number;
  row55WithholdingTax: number;
  qrCodeData?: string;
  employee?: {
    id: string;
    documentType: string;
    document: string;
    firstName: string;
    lastName: string;
  };
}

export interface ComplianceDashboardKpis {
  pila: {
    totalBatches: number;
    lastBatch?: PilaBatch | null;
  };
  electronicPayroll: {
    totalBatches: number;
    lastBatch?: ElectronicBatch | null;
    documentCounts: {
      DRAFT: number;
      VALIDATED: number;
      TRANSMITTED_ACCEPTED: number;
      REJECTED: number;
      REPLACED_BY_NOTE: number;
    };
  };
  accounting: {
    totalBatches: number;
    lastBatch?: AccountingBatch | null;
  };
  taxCertificates: {
    total220Issued: number;
  };
}

export interface AnnualAccumulatedMonth {
  month: number;
  basicSalary: number;
  overtimeAndSurcharges: number;
  transportAllowance: number;
  nonSalarialAllowances: number;
  incapacitiesAndLeaves: number;
  otherEarnings: number;
  totalEarnings: number;
  healthDeduction: number;
  pensionDeduction: number;
  fspDeduction: number;
  withholdingTax: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
}

export interface AnnualAccumulatedEmployeeRow {
  employeeId: string;
  employeeDocument: string;
  employeeFullName: string;
  costCenterCode: string;
  costCenterName: string;
  dependencyCode: number;
  dependencyName: string;
  months: Record<number, AnnualAccumulatedMonth>;
  yearTotals: AnnualAccumulatedMonth;
}

export interface AnnualAccumulatedMatrix {
  year: number;
  totalEmployees: number;
  grandTotalsByMonth: Record<number, AnnualAccumulatedMonth>;
  grandTotalYear: AnnualAccumulatedMonth;
  employees: AnnualAccumulatedEmployeeRow[];
}

// ============================================================================
// PAYROLL COMPLIANCE API CLIENT
// ============================================================================

export const payrollComplianceApi = {
  // 1. Dashboard Overview
  getKpis: () => HttpClient.get<ComplianceDashboardKpis>("/payroll/compliance/kpis"),

  // 2. Planilla Única PILA (Res. 2388)
  generatePilaBatch: (payload: { periodId: string; branchId?: string; operatorName?: string }) =>
    HttpClient.post<PilaBatch>("/payroll/compliance/pila/generate", payload),

  getPilaBatch: (batchId: string, query?: { search?: string; noveltyFilter?: string }) => {
    const params = new URLSearchParams();
    if (query?.search) params.append("search", query.search);
    if (query?.noveltyFilter) params.append("noveltyFilter", query.noveltyFilter);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return HttpClient.get<PilaBatch>(`/payroll/compliance/pila/${batchId}${qs}`);
  },

  exportPilaFlatFile: async (batchId: string, fileName = "PILA.txt") => {
    const blob = await HttpClient.getBlob(`/payroll/compliance/pila/${batchId}/export-txt`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  exportPilaAuditCsv: async (batchId: string, fileName = "PILA_AUDITORIA.csv") => {
    const blob = await HttpClient.getBlob(`/payroll/compliance/pila/${batchId}/export-csv`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  // 3. Nómina Electrónica DIAN
  generateElectronicBatch: (payload: {
    periodId: string;
    providerMode?: DianProviderMode;
    environment?: DianEnvironmentType;
  }) => HttpClient.post<ElectronicBatch>("/payroll/compliance/electronic/generate", payload),

  getElectronicBatch: (batchId: string, query?: { search?: string; status?: ElectronicPayrollStatus }) => {
    const params = new URLSearchParams();
    if (query?.search) params.append("search", query.search);
    if (query?.status) params.append("status", query.status);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return HttpClient.get<ElectronicBatch>(`/payroll/compliance/electronic/${batchId}${qs}`);
  },

  transmitElectronicDocument: (docId: string) =>
    HttpClient.post<ElectronicDocument>(`/payroll/compliance/electronic/documents/${docId}/transmit`),

  transmitAllElectronicBatch: (batchId: string) =>
    HttpClient.post<ElectronicBatch>(`/payroll/compliance/electronic/batches/${batchId}/transmit-all`),

  createAdjustmentNote: (
    docId: string,
    payload: {
      documentType: ElectronicDocumentType;
      reason: string;
    },
  ) => HttpClient.post<ElectronicDocument>(`/payroll/compliance/electronic/documents/${docId}/adjustment-note`, payload),

  // 4. Interfaz Contable (World Office / Helisa)
  generateAccountingBatch: (payload: {
    periodId: string;
    exportFormat?: AccountingExportFormat;
    accountingDate?: string;
    batchNumber?: string;
    notes?: string;
  }) => HttpClient.post<AccountingBatch>("/payroll/compliance/accounting/generate", payload),

  getAccountingBatch: (batchId: string) =>
    HttpClient.get<AccountingBatch>(`/payroll/compliance/accounting/${batchId}`),

  exportAccountingCsv: async (batchId: string, fileName = "NOMINA_CONTABLE.csv") => {
    const blob = await HttpClient.getBlob(`/payroll/compliance/accounting/${batchId}/export-csv`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  // 5. Certificados 220 & Constancias Laborales
  generateForm220Certificates: (payload: { year: number; employeeId?: string; expeditionCity?: string }) =>
    HttpClient.post<TaxCertificate220[]>("/payroll/compliance/certificates/form-220/generate", payload),

  getForm220Certificates: (year: number, employeeId?: string) => {
    const params = new URLSearchParams();
    params.append("year", year.toString());
    if (employeeId) params.append("employeeId", employeeId);
    return HttpClient.get<TaxCertificate220[]>(`/payroll/compliance/certificates/form-220?${params.toString()}`);
  },

  downloadForm220Pdf: async (certId: string, employeeDoc = "doc") => {
    const blob = await HttpClient.getBlob(`/payroll/compliance/certificates/form-220/${certId}/pdf`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formulario_220_${employeeDoc}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  downloadLaborCertificatePdf: async (payload: {
    employeeId: string;
    includeAverageSalary?: boolean;
    addressedTo?: string;
    notes?: string;
  }) => {
    // In our backend, this endpoint is POST /payroll/compliance/certificates/labor/pdf returning application/pdf
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/payroll/compliance/certificates/labor/pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `constancia_laboral_${payload.employeeId.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  // 6. Matriz BI de Acumulados
  getAnnualAccumulatedReport: (query: { year: number; employeeId?: string; clientId?: string }) => {
    const params = new URLSearchParams();
    params.append("year", query.year.toString());
    if (query.employeeId) params.append("employeeId", query.employeeId);
    if (query.clientId) params.append("clientId", query.clientId);
    return HttpClient.get<AnnualAccumulatedMatrix>(`/payroll/compliance/reports/annual-accumulated?${params.toString()}`);
  },
};

