import { HttpClient } from "./client";

export enum CommercialSector {
  COMMERCIAL_PUBLIC = "COMMERCIAL_PUBLIC",
  RESIDENTIAL_STRATA_4_6 = "RESIDENTIAL_STRATA_4_6",
  RESIDENTIAL_STRATA_1_3 = "RESIDENTIAL_STRATA_1_3",
}

export enum WeaponModality {
  NO_WEAPON = "NO_WEAPON",
  LETHAL_WEAPON = "LETHAL_WEAPON",
  NON_LETHAL_WEAPON = "NON_LETHAL_WEAPON",
  CANINE_SUPPORT = "CANINE_SUPPORT",
}

export enum ShiftScheduleType {
  SCHEDULE_2X2X2 = "SCHEDULE_2X2X2",
  SCHEDULE_3X3X2 = "SCHEDULE_3X3X2",
  SCHEDULE_4X4X2 = "SCHEDULE_4X4X2",
  SCHEDULE_5X1 = "SCHEDULE_5X1",
  SCHEDULE_5X2 = "SCHEDULE_5X2",
  SCHEDULE_6X1 = "SCHEDULE_6X1",
  SCHEDULE_6X2 = "SCHEDULE_6X2",
  SCHEDULE_7X1 = "SCHEDULE_7X1",
  SPECIAL_CUSTOM = "SPECIAL_CUSTOM",
}

export enum WorkingDaysModality {
  DAYS_30_ALL_MONTH = "DAYS_30_ALL_MONTH",
  DAYS_26_MON_SAT_HOL = "DAYS_26_MON_SAT_HOL",
  DAYS_24_MON_SAT_NO_HOL = "DAYS_24_MON_SAT_NO_HOL",
  DAYS_22_MON_FRI_HOL = "DAYS_22_MON_FRI_HOL",
  DAYS_20_MON_FRI_NO_HOL = "DAYS_20_MON_FRI_NO_HOL",
  DAYS_10_WEEKEND_HOL = "DAYS_10_WEEKEND_HOL",
  DAYS_8_WEEKEND_ONLY = "DAYS_8_WEEKEND_ONLY",
  DAYS_2_HOLIDAYS_ONLY = "DAYS_2_HOLIDAYS_ONLY",
}

export enum ValueAddedCategory {
  POST_EQUIPMENT = "POST_EQUIPMENT",
  SERVICE_SUPPORT = "SERVICE_SUPPORT",
  TECHNOLOGY_COMODATO = "TECHNOLOGY_COMODATO",
  SECURITY_STUDY = "SECURITY_STUDY",
  CASH_REINVESTMENT = "CASH_REINVESTMENT",
}

export enum InternalDepartment {
  CONTRACTS = "CONTRACTS",
  OPERATIONS = "OPERATIONS",
  WAREHOUSE = "WAREHOUSE",
  MONITORING_CENTER = "MONITORING_CENTER",
  CUSTOMER_SERVICE = "CUSTOMER_SERVICE",
  HUMAN_RESOURCES = "HUMAN_RESOURCES",
  QUALITY_ASSURANCE = "QUALITY_ASSURANCE",
  ACCOUNTING = "ACCOUNTING",
  TREASURY = "TREASURY",
}

export interface TariffPeriodConfig {
  id: string;
  year: number;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  smmlv: number;
  monthlyTransportAux: number;
  dailyTransportAux: number;
  statutoryWeeklyHours: number;
  baseHourlyRate: number;
  statutoryDayHours: number;
  statutoryNightHours: number;
  dayProportionFactor: number;
  nightProportionFactor: number;
  commercialMultiplier: number;
  strata46Multiplier: number;
  strata13Multiplier: number;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityServiceCatalogItem {
  [key: string]: any;
  id: string;
  serviceCode: number;
  name: string;
  targetPosition: string;
  sector: CommercialSector;
  weaponModality: WeaponModality;
  scheduleType: ShiftScheduleType;
  daysModality: WorkingDaysModality;
  dailyTotalHours: number;
  dayHours: number;
  nightHours: number;
  billableDaysPerMonth: number;
  adminSupervisionPct: number;
  isSystemStandard: boolean;
  isActive: boolean;
}

export interface PositionSalaryMatrixItem {
  id?: string;
  positionTitle: string;
  scheduleType?: ShiftScheduleType;
  guardsRequiredPerPost?: number;
  baseSalary: number;
  transportAllowance: number;
  shiftOrdinaryHours?: number;
  shiftExtraHours?: number;
  estimatedOvertimePay: number;
  grossSalary: number;
  healthDeductionPct?: number;
  pensionDeductionPct?: number;
  healthDeduction: number;
  pensionDeduction: number;
  totalDeductions: number;
  fixedBonusNonSalary?: number;
  vehicleAllowance?: number;
  netTakeHomePay: number;
  isActive?: boolean;
}

export interface ValueAddedCatalogItem {
  id: string;
  name: string;
  category: ValueAddedCategory;
  description?: string | null;
  internalReferenceCost: number;
  isStandardBenefit: boolean;
  defaultQuantity: number;
  isActive: boolean;
}

export interface TenantDocumentSkin {
  id: string;
  headerLayout?: DocumentHeaderLayout | null;
  primaryBrandColorHex: string;
  accentBrandColorHex: string;
  headerAccentBarHex?: string | null;
  logoS3Key?: string | null;
  secondaryLogoS3Key?: string | null;
  companyLegalName: string;
  companyNit: string;
  commercialRegisterNum?: string | null;
  supervigilanciaLicense?: string | null;
  supervigilanciaLicDate?: string | null;
  supervigilanciaLicExpiry?: string | null;
  minTicLicenseNum?: string | null;
  uniformsResolutionNum?: string | null;
  overtimeResolutionNum?: string | null;
  sstImplementationPct?: number | null;
  hasIso9001Certified: boolean;
  hasBascCertified: boolean;
  hasPoliceSupportNetwork: boolean;
  hasDijinEnterpriseFront: boolean;
  commercialDirectorName?: string | null;
  commercialDirectorTitle?: string | null;
  commercialDirectorEmail?: string | null;
  commercialDirectorPhone?: string | null;
  commercialDirectorSigS3?: string | null;
  legalRepName?: string | null;
  legalRepTitle?: string | null;
  legalRepEmail?: string | null;
  legalRepPhone?: string | null;
  legalRepSigS3?: string | null;
}

export interface DocumentTextSnippet {
  id: string;
  key: string;
  title: string;
  bodyTemplate: string;
  category: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface ServiceOrderDistributionRecipient {
  id: string;
  department: InternalDepartment;
  recipientName: string;
  recipientEmail: string;
  isActive: boolean;
}

export interface CommercialSettings {
  id: string;
  tenantId: string;
  defaultAiuRate: number;
  defaultIvaOnAiuRate: number;
  defaultRetefuenteRate: number;
  defaultReteIcaRate: number;
  maxReinvestmentPct1Yr: number;
  maxReinvestmentPct2Yr: number;
  defaultQuoteValidityDays: number;
  enableGuardSalaryDisplay: boolean;
  qualityDocCode: string;
  qualityDocVersion: string;
  qualityDocRevisionDate?: string | null;
  tariffPeriods: TariffPeriodConfig[];
  serviceCatalog: SecurityServiceCatalogItem[];
  salaryMatrix: PositionSalaryMatrixItem[];
  valueAddedCatalog: ValueAddedCatalogItem[];
  documentSkin?: TenantDocumentSkin | null;
  distributionRecipients: ServiceOrderDistributionRecipient[];
  textSnippets: DocumentTextSnippet[];
}

export interface SimulateTariffInput {
  tariffPeriodId?: string;
  manualSmmlv?: number;
  manualTransportAux?: number;
  sector: CommercialSector;
  weaponModality: WeaponModality;
  dayHours: number;
  nightHours: number;
  billableDays: number;
  discountPct?: number;
  customSectorMultiplier?: number;
}

export interface TariffSimulationResult {
  tariffBase24h: number;
  dayHourlyRateMonth: number;
  nightHourlyRateMonth: number;
  directCost: number;
  adminSupervisionPct: number;
  adminSupervisionValue: number;
  subtotalBeforeTax: number;
  discountValue: number;
  subtotalAfterDiscount: number;
  aiuBaseValue: number;
  ivaValue: number;
  retefuenteValue: number;
  reteIcaValue: number;
  totalWithTax: number;
  netCompanyToReceive: number;
  dailyRate: number;
}

export interface SimulateSalaryInput {
  smmlv?: number;
  transportAllowance?: number;
  statutoryWeeklyHours?: number;
  fixedBonusNonSalary?: number;
  vehicleAllowance?: number;
  overtimeHoursNight?: number;
}

export interface HourlyRateItem {
  name: string;
  code: string;
  baseRate: number;
  surchargePct: number;
  surchargeValue: number;
  totalHourlyRate: number;
}

export interface SvspSalaryReference2026 {
  smmlv: number;
  transportAllowance: number;
  totalMinimumGross: number;
  statutoryWeeklyHours: number;
  monthlyDivisorHours: number;
  baseHourlyRate: number;
  hourlyRates: {
    ordinaryDay: HourlyRateItem;
    ordinaryNight: HourlyRateItem;
    overtimeDay: HourlyRateItem;
    overtimeNight: HourlyRateItem;
    sundayHolidayOrdDay: HourlyRateItem;
    sundayHolidayOrdNight: HourlyRateItem;
    sundayHolidayExtDay: HourlyRateItem;
    sundayHolidayExtNight: HourlyRateItem;
  };
  shiftStructure: {
    ordinaryHoursPerShift: number;
    extraHoursPerShift: number;
    totalShiftHours: number;
  };
  deductionRates: {
    healthPct: number;
    pensionPct: number;
  };
}

export interface SalarySimulationResult {
  reference: SvspSalaryReference2026;
  baseSalary: number;
  transportAllowance: number;
  overtimePay: number;
  nightSurcharges: number;
  sundayHolidaySurcharges: number;
  totalSalaryEarned: number;
  healthDeduction: number;
  pensionDeduction: number;
  totalDeductions: number;
  fixedBonusNonSalary: number;
  vehicleAllowance: number;
  grossSalaryTotal: number;
  netTakeHomePay: number;
}

export const CommercialSettingsApi = {
  getSettings: () => HttpClient.get<CommercialSettings>("/commercial/settings"),

  updateSettings: (data: Partial<CommercialSettings>) =>
    HttpClient.patch<CommercialSettings>("/commercial/settings", data),

  createTariffPeriod: (data: Partial<TariffPeriodConfig>) =>
    HttpClient.post<TariffPeriodConfig>("/commercial/settings/tariff-periods", data),

  updateTariffPeriod: (id: string, data: Partial<TariffPeriodConfig>) =>
    HttpClient.patch<TariffPeriodConfig>(`/commercial/settings/tariff-periods/${id}`, data),

  deleteTariffPeriod: (id: string) =>
    HttpClient.delete<{ success: boolean; message: string }>(`/commercial/settings/tariff-periods/${id}`),

  simulateTariff: (data: SimulateTariffInput) =>
    HttpClient.post<TariffSimulationResult>("/commercial/settings/simulate-rate", data),

  simulateSalary: (data: SimulateSalaryInput) =>
    HttpClient.post<SalarySimulationResult>("/commercial/settings/simulate-salary", data),

  getServiceCatalog: () =>
    HttpClient.get<SecurityServiceCatalogItem[]>("/commercial/settings/service-catalog"),

  createServiceCatalog: (data: Partial<SecurityServiceCatalogItem>) =>
    HttpClient.post<SecurityServiceCatalogItem>("/commercial/settings/service-catalog", data),

  updateServiceCatalog: (id: string, data: Partial<SecurityServiceCatalogItem>) =>
    HttpClient.patch<SecurityServiceCatalogItem>(`/commercial/settings/service-catalog/${id}`, data),

  deleteServiceCatalog: (id: string) =>
    HttpClient.delete<{ success: boolean; message: string }>(`/commercial/settings/service-catalog/${id}`),

  getSalaryMatrix: () =>
    HttpClient.get<PositionSalaryMatrixItem[]>("/commercial/settings/salary-matrix"),

  upsertSalaryMatrix: (items: PositionSalaryMatrixItem[]) =>
    HttpClient.put<PositionSalaryMatrixItem[]>("/commercial/settings/salary-matrix", { items }),

  getValueAddedCatalog: () =>
    HttpClient.get<ValueAddedCatalogItem[]>("/commercial/settings/value-added"),

  createValueAdded: (data: Partial<ValueAddedCatalogItem>) =>
    HttpClient.post<ValueAddedCatalogItem>("/commercial/settings/value-added", data),

  updateValueAdded: (id: string, data: Partial<ValueAddedCatalogItem>) =>
    HttpClient.patch<ValueAddedCatalogItem>(`/commercial/settings/value-added/${id}`, data),

  deleteValueAdded: (id: string) =>
    HttpClient.delete<{ success: boolean; message: string }>(`/commercial/settings/value-added/${id}`),

  updateDocumentSkin: (data: Partial<TenantDocumentSkin>) =>
    HttpClient.patch<TenantDocumentSkin>("/commercial/settings/document-skin", data),

  updateDistributionRecipients: (recipients: Partial<ServiceOrderDistributionRecipient>[]) =>
    HttpClient.put<ServiceOrderDistributionRecipient[]>("/commercial/settings/distribution", { recipients }),

  getTextSnippets: () =>
    HttpClient.get<DocumentTextSnippet[]>("/commercial/settings/snippets"),

  createTextSnippet: (data: Partial<DocumentTextSnippet>) =>
    HttpClient.post<DocumentTextSnippet>("/commercial/settings/snippets", data),

  updateTextSnippet: (id: string, data: Partial<DocumentTextSnippet>) =>
    HttpClient.patch<DocumentTextSnippet>(`/commercial/settings/snippets/${id}`, data),

  deleteTextSnippet: (id: string) =>
    HttpClient.delete<{ success: boolean; message: string }>(`/commercial/settings/snippets/${id}`),
};

export enum SignerRoleScope {
  LEGAL_REPRESENTATIVE = "LEGAL_REPRESENTATIVE",
  COMMERCIAL_DIRECTOR = "COMMERCIAL_DIRECTOR",
  TECHNICAL_DIRECTOR = "TECHNICAL_DIRECTOR",
  OPERATIONS_MANAGER = "OPERATIONS_MANAGER",
  CUSTOM_SIGNER = "CUSTOM_SIGNER",
}

export enum DocumentHeaderLayout {
  MODERN_MINIMALIST = "MODERN_MINIMALIST",
  CLASSIC_CORPORATE = "CLASSIC_CORPORATE",
  EDITORIAL_CENTERED = "EDITORIAL_CENTERED",
  FRAME_ACCREDITED = "FRAME_ACCREDITED",
}

export interface AuthorizedSigner {
  id: string;
  fullName: string;
  jobTitle: string;
  documentNumber?: string;
  professionalCardNum?: string;
  email?: string;
  phone?: string;
  roleScope: SignerRoleScope;
  includeInCommercialProposal: boolean;
  priorityOrder: number;
  signatureS3Key?: string;
  signatureUrl?: string;
  isActive: boolean;
}

export const DocumentEngineApi = {
  getSigners: () => HttpClient.get<AuthorizedSigner[]>("/commercial/document-engine/signers"),
  createSigner: (data: Partial<AuthorizedSigner>) =>
    HttpClient.post<AuthorizedSigner>("/commercial/document-engine/signers", data),
  updateSigner: (id: string, data: Partial<AuthorizedSigner>) =>
    HttpClient.patch<AuthorizedSigner>(`/commercial/document-engine/signers/${id}`, data),
  deleteSigner: (id: string) =>
    HttpClient.delete<{ success: boolean; message: string }>(`/commercial/document-engine/signers/${id}`),
  reorderSigners: (order: { id: string; priorityOrder: number }[]) =>
    HttpClient.put<AuthorizedSigner[]>("/commercial/document-engine/signers/reorder", { order }),
  getPreviewConfig: () =>
    HttpClient.get<{ skin: TenantDocumentSkin; signers: AuthorizedSigner[] }>("/commercial/document-engine/preview-config"),
  interpolatePreview: (data: { template: string; variables?: Record<string, any> }) =>
    HttpClient.post<{ interpolated: string }>("/commercial/document-engine/interpolate-preview", data),
};

