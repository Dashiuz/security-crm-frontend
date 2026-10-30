import { HttpClient } from "./client";

export enum ShiftDayCode {
  D = "D",
  N = "N",
  X = "X",
  R = "R",
  INC = "INC",
  AT = "AT",
  LMA = "LMA",
  LR = "LR",
  LNR = "LNR",
  SAN = "SAN",
  AUS = "AUS",
  VAC = "VAC",
}

export enum DependencyAssignmentRole {
  TITULAR = "TITULAR",
  RELEVANTE = "RELEVANTE",
  SUPERVISOR = "SUPERVISOR",
  REFUERZO = "REFUERZO",
}

export interface PayrollShiftSequence {
  id: string;
  code: string;
  name: string;
  patternJson: string[];
  cycleDaysLength: number;
  dayShiftHours: number;
  nightShiftHours: number;
  defaultDayStartTime: string;
  defaultNightStartTime: string;
  isActive: boolean;
  createdAt: string;
}

export interface EmployeeDependencyAssignment {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    document: string;
  };
  dependencyId: string;
  dependency?: {
    id: string;
    code: number;
    name: string;
    client?: {
      id: string;
      name: string;
    };
  };
  branchId?: string;
  assignmentRole: DependencyAssignmentRole;
  startDate: string;
  endDate?: string;
  isPrimary: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface ShiftDayRecord {
  id?: string;
  shiftCode: ShiftDayCode;
  isReinforcement: boolean;
  isHolidayOrSunday: boolean;
  ordinaryDayHours: number;
  nightSurchargeHours: number;
  sundayHolidayHours: number;
  overtimeDayHours: number;
  overtimeNightHours: number;
  overtimeHolidayDayHours: number;
  overtimeHolidayNightHours: number;
  leaveType?: string;
}

export interface ShiftGridRow {
  dependencyId: string;
  dependencyName: string;
  dependencyCode: number;
  branchName?: string;
  clientName?: string;
  assignmentId: string;
  role: DependencyAssignmentRole;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    document: string;
  };
  days: Record<number, ShiftDayRecord>;
  totals: {
    totalDayHours: number;
    totalNightHours: number;
    totalHolidayHours: number;
    totalOvertimeHours: number;
    totalGrossHours: number;
  };
}

export interface ShiftGridHeaderDay {
  day: number;
  dateStr: string;
  dayOfWeek: number;
  isSunday: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

export interface ShiftGridResponse {
  year: number;
  month: number;
  totalDays: number;
  daysHeader: ShiftGridHeaderDay[];
  rows: ShiftGridRow[];
}

export const payrollShiftsApi = {
  // Sequences
  listSequences: () => HttpClient.get<PayrollShiftSequence[]>("/payroll/shifts/sequences"),
  createSequence: (data: Partial<PayrollShiftSequence>) =>
    HttpClient.post<PayrollShiftSequence>("/payroll/shifts/sequences", data),

  // Assignments / Rotations
  listAssignments: (params?: {
    dependencyId?: string;
    employeeId?: string;
    isActive?: boolean;
  }) => {
    const q = new URLSearchParams();
    if (params?.dependencyId) q.append("dependencyId", params.dependencyId);
    if (params?.employeeId) q.append("employeeId", params.employeeId);
    if (params?.isActive !== undefined) q.append("isActive", String(params.isActive));
    const qs = q.toString();
    return HttpClient.get<EmployeeDependencyAssignment[]>(`/payroll/shifts/assignments${qs ? `?${qs}` : ""}`);
  },

  createAssignment: (data: {
    employeeId: string;
    dependencyId: string;
    assignmentRole?: DependencyAssignmentRole;
    startDate: string;
    endDate?: string;
    isPrimary?: boolean;
    notes?: string;
  }) => HttpClient.post<EmployeeDependencyAssignment>("/payroll/shifts/assignments", data),

  updateAssignment: (id: string, data: Partial<EmployeeDependencyAssignment>) =>
    HttpClient.patch<EmployeeDependencyAssignment>(`/payroll/shifts/assignments/${id}`, data),

  // Monthly Grid
  getGrid: (params: {
    year: number;
    month: number;
    dependencyId?: string;
    branchId?: string;
  }) => {
    const q = new URLSearchParams();
    q.append("year", String(params.year));
    q.append("month", String(params.month));
    if (params.dependencyId) q.append("dependencyId", params.dependencyId);
    if (params.branchId) q.append("branchId", params.branchId);
    return HttpClient.get<ShiftGridResponse>(`/payroll/shifts/grid?${q.toString()}`);
  },

  generateMonth: (data: {
    year: number;
    month: number;
    dependencyId?: string;
    branchId?: string;
    sequenceCode?: string;
    startStepOffset?: number;
  }) => HttpClient.post<{ message: string; assignmentsProcessed: number; recordsUpserted: number }>("/payroll/shifts/generate-month", data),

  bulkUpdateRecords: (data: { records: any[] }) =>
    HttpClient.put<{ message: string; updatedCount: number }>("/payroll/shifts/records/bulk", data),

  createReinforcement: (data: {
    employeeId: string;
    dependencyId: string;
    shiftDate: string;
    shiftCode?: ShiftDayCode;
    hours?: number;
    notes?: string;
  }) => HttpClient.post<any>("/payroll/shifts/reinforcements", data),
};

