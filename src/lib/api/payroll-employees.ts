import { HttpClient } from "./client";

export enum EmploymentContractType {
  FIXED_TERM = "FIXED_TERM",
  INDEFINITE = "INDEFINITE",
  WORK_OR_LABOR = "WORK_OR_LABOR",
  APPRENTICE_LECTIVE = "APPRENTICE_LECTIVE",
  APPRENTICE_PRODUCTIVE = "APPRENTICE_PRODUCTIVE",
}

export enum EmployeeSalaryMode {
  BY_DEPENDENCY = "BY_DEPENDENCY",
  MINIMUM_WAGE = "MINIMUM_WAGE",
  CUSTOM_FIXED = "CUSTOM_FIXED",
}

export enum SalaryAdjustmentOrigin {
  INITIAL_CONTRACT = "INITIAL_CONTRACT",
  INDIVIDUAL_INCREASE = "INDIVIDUAL_INCREASE",
  SMMLV_GLOBAL_UPDATE = "SMMLV_GLOBAL_UPDATE",
}

export interface ApplySalaryAdjustmentDto {
  salaryMode?: EmployeeSalaryMode;
  newSalary: number;
  effectiveDate: string;
  reason: string;
}

export enum BankAccountType {
  SAVINGS = "SAVINGS",
  CHECKING = "CHECKING",
  ELECTRONIC_DEPOSIT = "ELECTRONIC_DEPOSIT",
  CASH_OR_CHECK = "CASH_OR_CHECK",
}

export enum MilitaryCardClass {
  FIRST_CLASS = "FIRST_CLASS",
  SECOND_CLASS = "SECOND_CLASS",
  PROVISIONAL = "PROVISIONAL",
  NOT_APPLICABLE = "NOT_APPLICABLE",
}

export enum MaritalStatus {
  SINGLE = "SINGLE",
  MARRIED = "MARRIED",
  FREE_UNION = "FREE_UNION",
  DIVORCED = "DIVORCED",
  WIDOWED = "WIDOWED",
}

export enum EducationLevel {
  PRIMARY = "PRIMARY",
  HIGH_SCHOOL = "HIGH_SCHOOL",
  TECHNICAL = "TECHNICAL",
  TECHNOLOGIST = "TECHNOLOGIST",
  PROFESSIONAL = "PROFESSIONAL",
  POSTGRADUATE = "POSTGRADUATE",
}

export enum HousingType {
  OWN = "OWN",
  RENTED = "RENTED",
  FAMILY = "FAMILY",
  MORTGAGED = "MORTGAGED",
}

export enum FamilyRelationship {
  SPOUSE = "SPOUSE",
  CHILD = "CHILD",
  PARENT = "PARENT",
  SIBLING = "SIBLING",
  OTHER = "OTHER",
}

export enum HiringRequirementStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  EXPIRED = "EXPIRED",
  WAIVED = "WAIVED",
}

export interface PayrollEmployeeListItem {
  id: string;
  fullName: string;
  firstName: string;
  secondName?: string | null;
  lastName: string;
  maternalSurname?: string | null;
  documentType: string;
  document: string;
  email?: string | null;
  phone?: string | null;
  entryDate: string;
  isActive: boolean;
  isRetired: boolean;
  payrollProfile?: any | null;
  currentSvspCourse?: any | null;
  svspStatus: "VALID" | "EXPIRING_SOON" | "EXPIRED" | "MISSING";
  svspDaysRemaining: number | null;
  contractAlertStatus: "OK" | "PREAVISO_REQUIRED" | "EXPIRED";
  folderCompletionPct: number;
  isBlockedForRehire: boolean;
}

export interface PayrollKpisResponse {
  totalActiveEmployees: number;
  svspValidCount: number;
  svspAlertCount: number;
  contractsExpiringSoonCount: number;
  incompleteFoldersCount: number;
}

export interface EmployeeDossierResponse {
  employee: {
    id: string;
    fullName: string;
    firstName: string;
    secondName?: string | null;
    lastName: string;
    maternalSurname?: string | null;
    documentType: string;
    document: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    gender?: string | null;
    birthdate?: string | null;
    entryDate?: string | null;
    isActive: boolean;
    isRetired: boolean;
    retiredAt?: string | null;
    departmentName?: string | null;
    positionName?: string | null;
  };
  payrollProfile?: any | null;
  familyMembers: any[];
  requirementMatrix: any[];
  svspCourses: any[];
  internalTrainings: any[];
  salaryHistories?: any[];
  periodSettlements?: any[];
  svspStatus: "VALID" | "EXPIRING_SOON" | "EXPIRED" | "MISSING";
  svspDaysRemaining: number | null;
  contractAlertStatus: "OK" | "PREAVISO_REQUIRED" | "EXPIRED";
  folderCompletionPct: number;
}

export class PayrollEmployeesApi {
  static async findEmployees(filters?: {
    search?: string;
    branchId?: string;
    dependencyId?: string;
    svspStatus?: string;
    isActive?: boolean;
  }): Promise<PayrollEmployeeListItem[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.branchId) params.append("branchId", filters.branchId);
    if (filters?.dependencyId) params.append("dependencyId", filters.dependencyId);
    if (filters?.svspStatus) params.append("svspStatus", filters.svspStatus);
    if (filters?.isActive !== undefined) params.append("isActive", String(filters.isActive));

    const url = `/payroll/employees${params.toString() ? `?${params.toString()}` : ""}`;
    return HttpClient.get<PayrollEmployeeListItem[]>(url);
  }

  static async getKpis(): Promise<PayrollKpisResponse> {
    return HttpClient.get<PayrollKpisResponse>("/payroll/employees/kpis");
  }

  static async getEmployeeDossier(employeeId: string): Promise<EmployeeDossierResponse> {
    return HttpClient.get<EmployeeDossierResponse>(`/payroll/employees/${employeeId}/dossier`);
  }

  static async upsertPayrollProfile(employeeId: string, data: any): Promise<any> {
    return HttpClient.put(`/payroll/employees/${employeeId}/profile`, data);
  }

  static async addFamilyMember(employeeId: string, data: any): Promise<any> {
    return HttpClient.post(`/payroll/employees/${employeeId}/family-members`, data);
  }

  static async deleteFamilyMember(id: string): Promise<any> {
    return HttpClient.delete(`/payroll/employees/family-members/${id}`);
  }

  static async updateRequirementCheck(
    employeeId: string,
    requirementId: string,
    data: any,
  ): Promise<any> {
    return HttpClient.put(`/payroll/employees/${employeeId}/requirements/${requirementId}`, data);
  }

  static async addSvspCourse(employeeId: string, data: any): Promise<any> {
    return HttpClient.post(`/payroll/employees/${employeeId}/svsp-courses`, data);
  }

  static async deleteSvspCourse(id: string): Promise<any> {
    return HttpClient.delete(`/payroll/employees/svsp-courses/${id}`);
  }

  static async addInternalTraining(employeeId: string, data: any): Promise<any> {
    return HttpClient.post(`/payroll/employees/${employeeId}/trainings`, data);
  }

  static async deleteInternalTraining(id: string): Promise<any> {
    return HttpClient.delete(`/payroll/employees/trainings/${id}`);
  }

  static async downloadRenovaExcel(): Promise<void> {
    const token = typeof window !== "undefined" ? localStorage.getItem("access-token") : null;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/payroll/employees/svsp/export-renova`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error("Error al descargar archivo RENOVA");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RENOVA_SUPERVIGILANCIA_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  static async applySalaryAdjustment(
    employeeId: string,
    data: ApplySalaryAdjustmentDto,
  ): Promise<any> {
    return HttpClient.post(`/payroll/employees/${employeeId}/salary-adjustment`, data);
  }

  static async downloadPayslipPdf(
    employeeId: string,
    settlementId: string,
    groupOvertime = false,
  ): Promise<void> {
    const token = typeof window !== "undefined" ? localStorage.getItem("access-token") : null;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/payroll/employees/${employeeId}/payslips/${settlementId}/pdf?groupOvertime=${groupOvertime}`,
      {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (!response.ok) {
      throw new Error("Error al descargar desprendible de nómina");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `desprendible_${employeeId}_${settlementId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

