import { HttpClient } from "./client";

export enum PayrollPaymentFrequency {
  MONTHLY_WITH_ADVANCE = "MONTHLY_WITH_ADVANCE",
  BIWEEKLY_PURE = "BIWEEKLY_PURE",
  MONTHLY_PURE = "MONTHLY_PURE",
  WEEKLY = "WEEKLY",
}

export enum PayrollAdvanceMode {
  FIXED_AMOUNT = "FIXED_AMOUNT",
  PERCENTAGE_OF_BASE = "PERCENTAGE_OF_BASE",
  PROPORTIONAL_DAYS = "PROPORTIONAL_DAYS",
}

export enum PayrollConceptNature {
  DEVENGO = "DEVENGO",
  LICENCIA = "LICENCIA",
  INCAPACIDAD = "INCAPACIDAD",
  DEDUCCION = "DEDUCCION",
  SEG_SOCIAL = "SEG_SOCIAL",
  PROVISION = "PROVISION",
}

export enum PayrollProportionality {
  DAYS = "DAYS",
  NON_PROPORTIONAL = "NON_PROPORTIONAL",
  HOURS = "HOURS",
}

export enum SocialSecurityEntityType {
  EPS = "EPS",
  AFP = "AFP",
  CCF = "CCF",
  ARL = "ARL",
}

export enum ArlRiskClass {
  RISK_I = "RISK_I",
  RISK_II = "RISK_II",
  RISK_III = "RISK_III",
  RISK_IV = "RISK_IV",
  RISK_V = "RISK_V",
}

export enum DependencySettlementType {
  BY_AVERAGE_GUARANTEED = "BY_AVERAGE_GUARANTEED",
  BY_SCHEDULE = "BY_SCHEDULE",
  FIXED_ADMIN = "FIXED_ADMIN",
}

export enum ShiftModalityClass {
  ROTATING = "ROTATING",
  DAY_SHIFT = "DAY_SHIFT",
  NIGHT_SHIFT = "NIGHT_SHIFT",
  ADMINISTRATIVE = "ADMINISTRATIVE",
}

export interface PayrollSettings {
  id: string;
  tenantId: string;
  companyLegalName: string;
  companyNit: string;
  companyDv: string;
  arlEntityCode?: string;
  arlEntityName?: string;
  daneCityCode: string;
  daneCityName: string;
  daneDepartmentCode: string;
  daneDepartmentName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  legalRepDocument?: string;
  legalRepFullName?: string;
  paymentFrequency: PayrollPaymentFrequency;
  advanceMode: PayrollAdvanceMode;
  defaultAdvancePct: number;
  deductAbsencesInAdvance: boolean;
  saturdayIsWorkingDay: boolean;
  applyExonerationLaw1607: boolean;
  enforceUgpp40PctRule: boolean;
  scheduleLockDate?: string;
  activeYear: number;
  smmlv: number;
  employerSickLeaveRatePct?: number;
  epsSickLeaveRateDays3To90Pct?: number;
  epsSickLeaveRateDays91To180Pct?: number;
  transportAllowance: number;
  uvtValue: number;
  weeklyWorkingHours: number;
  monthlyDivisorHours: number;
  normalHourFactorPct: number;
  nightSurchargePct: number;
  extraDayPct: number;
  extraNightPct: number;
  sundayCompensatedPct: number;
  holidaySurchargePct: number;
  extraHolidayDayPct: number;
  extraHolidayNightPct: number;
  employeeHealthPct: number;
  employeePensionPct: number;
  fspBasePct: number;
  employerHealthPct: number;
  employerPensionPct: number;
  ccfPct: number;
  senaPct: number;
  icbfPct: number;
}

export interface PayrollHoliday {
  id: string;
  date: string;
  year: number;
  name: string;
  isNational: boolean;
}

export interface PayrollConcept {
  id: string;
  code: number;
  name: string;
  nature: PayrollConceptNature;
  proportionality: PayrollProportionality;
  isDeletableOnLiquidation: boolean;
  isConstitutiveOfSalary: boolean;
  adminPucAccount?: string;
  operativePucAccount?: string;
  creditCounterpartPuc?: string;
  dianNieCode?: string;
  inLiq: boolean;
  inPri: boolean;
  inTis: boolean;
  inVac: boolean;
  inCes: boolean;
  inIbcEpsAfp: boolean;
  inIbcArl: boolean;
  inIbcCcf: boolean;
  inLhex: boolean;
  inLnr: boolean;
  inUgpp40Pct: boolean;
  defaultRatePct?: number;
  shiftCodeMap?: string;
  isActive: boolean;
}

export interface PayrollModalityItem {
  id: string;
  conceptId: string;
  percentage: number;
  sortOrder: number;
  concept: PayrollConcept;
}

export interface PayrollShiftModality {
  id: string;
  code: number;
  name: string;
  shiftClass: ShiftModalityClass;
  hoursPerShift: number;
  description?: string;
  isActive: boolean;
  items: PayrollModalityItem[];
}

export interface PayrollBranch {
  id: string;
  code: number;
  name: string;
  daneCityCode?: string;
  pilaBranchCode?: string;
  isActive: boolean;
}

export interface PayrollDependency {
  id: string;
  code: number;
  name: string;
  isInternal: boolean;
  branchId: string;
  branch?: PayrollBranch;
  clientId?: string;
  client?: {
    id: string;
    name: string;
    internalCode: string;
    nit: string;
  };
  serviceOrderPositionId?: string;
  serviceOrderPosition?: {
    id: string;
    positionTitle: string;
    scheduleType: string;
    serviceOrder?: {
      id: string;
      orderFolioCode: string;
      omegaCode: string;
      status: string;
    };
  };
  omegaCode?: string;
  accountingCostCenter?: string;
  accountingSubCostCenter?: string;
  monthlyPaidValue: number;
  prestacionalAmount: number;
  dailyValue: number;
  settlementType: DependencySettlementType;
  modalityId?: string;
  modality?: PayrollShiftModality;
  arlRiskClass: ArlRiskClass;
  cotizanteTypeCode: string;
  isVariable: boolean;
  isActive: boolean;
}

export interface PayrollEntity {
  id: string;
  code: string;
  name: string;
  entityType: SocialSecurityEntityType;
  nit: string;
  pluCode: string;
  legacyConceptCode?: number;
  isActive: boolean;
}

export interface PayrollBank {
  id: string;
  code: string;
  name: string;
  achCode?: string;
  exportFormat: string;
  isActive: boolean;
}

export interface PayrollExitReason {
  id: string;
  code: number;
  name: string;
  isJustCause: boolean;
  isActive: boolean;
}

export interface PayrollHiringRequirement {
  id: string;
  code: number;
  name: string;
  isMandatory: boolean;
  hasExpiry: boolean;
  isActive: boolean;
}

export interface PayrollSvspLevel {
  id: string;
  code: string;
  name: string;
  validityDays: number;
  isActive: boolean;
}

export interface PayrollSecurityAcademy {
  id: string;
  code: number;
  name: string;
  nit: string;
  address?: string;
  phone?: string;
  email?: string;
  legalRepName?: string;
  city?: string;
  isActive: boolean;
}

export interface PayrollPeriod {
  id: string;
  code: number;
  label: string;
  year: number;
  month: number;
  periodNumber: number;
  startDate: string;
  endDate: string;
  paymentDate?: string;
  status: string;
}

export interface BreakdownSimulationResult {
  daysWorked: number;
  baseSalary: number;
  excessDistributed: number;
  totalGrossPay: number;
  breakdownItems: Array<{
    conceptId: string;
    conceptCode: number;
    conceptName: string;
    percentage: number;
    calculatedValue: number;
  }>;
}

export interface DependenciesKpis {
  totalPosts: number;
  operativePosts: number;
  internalPosts: number;
  totalGuaranteedMonthlyPayroll: number;
}

export interface SyncServiceOrdersResult {
  syncedCount: number;
  createdCount: number;
  updatedCount: number;
  syncedItems: string[];
}

export const PayrollApi = {
  // Settings & Holidays
  getSettings: () => HttpClient.get<PayrollSettings>("/payroll/settings"),
  updateSettings: (data: Partial<PayrollSettings>) => HttpClient.patch<PayrollSettings>("/payroll/settings", data),
  getHolidays: (year?: number) =>
    HttpClient.get<PayrollHoliday[]>(`/payroll/settings/holidays${year ? `?year=${year}` : ""}`),
  generateHolidays: (year: number) =>
    HttpClient.post<PayrollHoliday[]>(`/payroll/settings/holidays/generate?year=${year}`, {}),

  // Concepts & Modalities
  listConcepts: (params?: { nature?: string; isActive?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.nature) q.append("nature", params.nature);
    if (params?.isActive !== undefined) q.append("isActive", String(params.isActive));
    if (params?.search) q.append("search", params.search);
    const qs = q.toString();
    return HttpClient.get<PayrollConcept[]>(`/payroll/concepts${qs ? `?${qs}` : ""}`);
  },
  getConcept: (id: string) => HttpClient.get<PayrollConcept>(`/payroll/concepts/${id}`),
  createConcept: (data: Partial<PayrollConcept>) => HttpClient.post<PayrollConcept>("/payroll/concepts", data),
  updateConcept: (id: string, data: Partial<PayrollConcept>) =>
    HttpClient.patch<PayrollConcept>(`/payroll/concepts/${id}`, data),
  deleteConcept: (id: string) => HttpClient.delete<PayrollConcept>(`/payroll/concepts/${id}`),
  updateBaseMatrix: (matrix: Array<Partial<PayrollConcept> & { conceptId: string }>) =>
    HttpClient.patch<{ success: boolean; count: number }>("/payroll/concepts/matrix/bulk", matrix),

  listModalities: () => HttpClient.get<PayrollShiftModality[]>("/payroll/concepts/modalities/all"),
  getModality: (id: string) => HttpClient.get<PayrollShiftModality>(`/payroll/concepts/modalities/${id}`),
  createModality: (data: Partial<PayrollShiftModality>) => HttpClient.post<PayrollShiftModality>("/payroll/concepts/modalities", data),
  updateModality: (id: string, data: Partial<PayrollShiftModality>) =>
    HttpClient.patch<PayrollShiftModality>(`/payroll/concepts/modalities/${id}`, data),
  deleteModality: (id: string) => HttpClient.delete<PayrollShiftModality>(`/payroll/concepts/modalities/${id}`),

  // Dependencies & Posts
  listDependencies: (params?: { branchId?: string; clientId?: string; isInternal?: boolean; isActive?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.branchId) q.append("branchId", params.branchId);
    if (params?.clientId) q.append("clientId", params.clientId);
    if (params?.isInternal !== undefined) q.append("isInternal", String(params.isInternal));
    if (params?.isActive !== undefined) q.append("isActive", String(params.isActive));
    if (params?.search) q.append("search", params.search);
    const qs = q.toString();
    return HttpClient.get<PayrollDependency[]>(`/payroll/dependencies${qs ? `?${qs}` : ""}`);
  },
  getDependenciesKpis: () => HttpClient.get<DependenciesKpis>("/payroll/dependencies/kpis"),
  getDependency: (id: string) => HttpClient.get<PayrollDependency>(`/payroll/dependencies/${id}`),
  createDependency: (data: Partial<PayrollDependency>) => HttpClient.post<PayrollDependency>("/payroll/dependencies", data),
  updateDependency: (id: string, data: Partial<PayrollDependency>) =>
    HttpClient.patch<PayrollDependency>(`/payroll/dependencies/${id}`, data),
  deleteDependency: (id: string) => HttpClient.delete<PayrollDependency>(`/payroll/dependencies/${id}`),
  syncFromServiceOrders: (data: { clientId?: string; defaultBranchId: string }) =>
    HttpClient.post<SyncServiceOrdersResult>("/payroll/dependencies/sync-service-orders", data),
  simulateBreakdown: (data: { monthlyPaidValue: number; modalityId: string; daysWorked?: number }) =>
    HttpClient.post<BreakdownSimulationResult>("/payroll/dependencies/simulate-breakdown", data),

  // Catalogs
  listEntities: (type?: SocialSecurityEntityType) =>
    HttpClient.get<PayrollEntity[]>(`/payroll/catalogs/entities${type ? `?type=${type}` : ""}`),
  createEntity: (data: Partial<PayrollEntity>) => HttpClient.post<PayrollEntity>("/payroll/catalogs/entities", data),
  listBanks: () => HttpClient.get<PayrollBank[]>("/payroll/catalogs/banks"),
  createBank: (data: Partial<PayrollBank>) => HttpClient.post<PayrollBank>("/payroll/catalogs/banks", data),
  listBranches: () => HttpClient.get<PayrollBranch[]>("/payroll/catalogs/branches"),
  listEmployees: () => HttpClient.get<any[]>("/payroll/employees"),
  listExitReasons: () => HttpClient.get<PayrollExitReason[]>("/payroll/catalogs/exit-reasons"),
  listHiringRequirements: () => HttpClient.get<PayrollHiringRequirement[]>("/payroll/catalogs/hiring-requirements"),
  listSvspLevels: () => HttpClient.get<PayrollSvspLevel[]>("/payroll/catalogs/svsp-levels"),
  listAcademies: () => HttpClient.get<PayrollSecurityAcademy[]>("/payroll/catalogs/academies"),
  listPeriods: (year?: number) =>
    HttpClient.get<PayrollPeriod[]>(`/payroll/catalogs/periods${year ? `?year=${year}` : ""}`),
  createPeriod: (data: {
    code: number;
    label: string;
    year: number;
    month: number;
    periodNumber?: number;
    startDate: string;
    endDate: string;
    paymentDate?: string;
    status?: string;
    notes?: string;
  }) => HttpClient.post<PayrollPeriod>("/payroll/catalogs/periods", data),
  generateYearPeriods: (data: { year: number; baseCode?: number }) =>
    HttpClient.post<PayrollPeriod[]>("/payroll/catalogs/periods/generate-year", data),
};

