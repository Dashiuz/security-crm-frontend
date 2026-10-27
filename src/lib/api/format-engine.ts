import { HttpClient } from "./client";

export enum FormatCategory {
  COMMERCIAL = "COMMERCIAL",
  HUMAN_RESOURCES = "HUMAN_RESOURCES",
  OPERATIONS = "OPERATIONS",
  QUALITY_HSEQ = "QUALITY_HSEQ",
  LEGAL = "LEGAL",
  GENERAL = "GENERAL",
}

export enum FormatVisibilityScope {
  GLOBAL = "GLOBAL",
  PERSONAL = "PERSONAL",
}

export enum VariableSourceType {
  STATIC_TEXT = "STATIC_TEXT",
  DATABASE_SYSTEM = "DATABASE_SYSTEM",
}

export interface UniversalDocumentFormat {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  category: FormatCategory;
  scope: FormatVisibilityScope;
  userId?: string | null;
  isDefault: boolean;
  isActive: boolean;
  bodyTemplate: string;
  sectionsConfig: {
    showHeader?: boolean;
    showSvspCredentials?: boolean;
    svspCredentialsMode?: "AUTO" | "MANUAL";
    manualSvspCredentials?: {
      license?: string;
      licenseDate?: string;
      licenseExpiry?: string;
      uniformsResolution?: string;
      overtimeResolution?: string;
    };
    showQualityBadges?: boolean;
    showEconomicGrid?: boolean;
    showSigners?: boolean;
    showFooter?: boolean;
  };
  detectedVariables: string[];
  user?: {
    id: string;
    fullName: string;
    document?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface FormatVariable {
  id: string;
  scope: FormatVisibilityScope;
  userId?: string | null;
  key: string;
  label: string;
  category: string;
  sourceType: VariableSourceType;
  staticValue?: string | null;
  systemPath?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemFieldCategory {
  id: string;
  name: string;
  icon?: string;
  fields: Array<{
    systemPath: string;
    label: string;
    token: string;
    dataType: "TEXT" | "DATE" | "CURRENCY" | "NUMBER" | "IMAGE";
    example: string;
  }>;
}

export interface ParseResult {
  html: string;
  detectedVariables: string[];
  originalType: "DOCX" | "XLSX" | "UNKNOWN";
}

export interface RenderResult {
  interpolatedContent: string;
  substitutedVariables: string[];
  missingVariables: string[];
}

export interface CreateFormatInput {
  code: string;
  title: string;
  description?: string;
  category?: FormatCategory;
  scope?: FormatVisibilityScope;
  isDefault?: boolean;
  bodyTemplate: string;
  sectionsConfig?: any;
  detectedVariables?: string[];
}

export interface UpdateFormatInput {
  code?: string;
  title?: string;
  description?: string;
  category?: FormatCategory;
  scope?: FormatVisibilityScope;
  isDefault?: boolean;
  isActive?: boolean;
  bodyTemplate?: string;
  sectionsConfig?: any;
  detectedVariables?: string[];
}

export interface CreateVariableInput {
  key: string;
  label: string;
  category?: string;
  scope?: FormatVisibilityScope;
  sourceType: VariableSourceType;
  staticValue?: string;
  systemPath?: string;
}

export interface UpdateVariableInput {
  label?: string;
  category?: string;
  sourceType?: VariableSourceType;
  staticValue?: string;
  systemPath?: string;
  isActive?: boolean;
}

export interface RenderFormatInput {
  entityType?: "CLIENT" | "EMPLOYEE" | "PROPOSAL";
  entityId?: string;
  customTemplateHtml?: string;
  additionalVariables?: Record<string, any>;
}

export class FormatEngineApi {
  // ==========================================
  // FORMATOS UNIVERSALES
  // ==========================================

  static async getFormats(filters?: {
    category?: FormatCategory;
    scope?: FormatVisibilityScope;
    search?: string;
  }): Promise<UniversalDocumentFormat[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.scope) params.append("scope", filters.scope);
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString() ? `?${params.toString()}` : "";
    return HttpClient.get<UniversalDocumentFormat[]>(
      `/format-engine/formats${query}`
    );
  }

  static async getFormatById(id: string): Promise<UniversalDocumentFormat> {
    return HttpClient.get<UniversalDocumentFormat>(
      `/format-engine/formats/${id}`
    );
  }

  static async createFormat(
    input: CreateFormatInput
  ): Promise<UniversalDocumentFormat> {
    return HttpClient.post<UniversalDocumentFormat>(
      "/format-engine/formats",
      input
    );
  }

  static async updateFormat(
    id: string,
    input: UpdateFormatInput
  ): Promise<UniversalDocumentFormat> {
    return HttpClient.patch<UniversalDocumentFormat>(
      `/format-engine/formats/${id}`,
      input
    );
  }

  static async deleteFormat(id: string): Promise<UniversalDocumentFormat> {
    return HttpClient.delete<UniversalDocumentFormat>(
      `/format-engine/formats/${id}`
    );
  }

  static async getNextFormatCode(category: FormatCategory): Promise<{ code: string }> {
    return HttpClient.get<{ code: string }>(
      `/format-engine/formats/next-code?category=${category}`
    );
  }

  // ==========================================
  // VARIABLES DINÁMICAS
  // ==========================================

  static async getVariables(search?: string): Promise<FormatVariable[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return HttpClient.get<FormatVariable[]>(`/format-engine/variables${query}`);
  }

  static async createVariable(
    input: CreateVariableInput
  ): Promise<FormatVariable> {
    return HttpClient.post<FormatVariable>("/format-engine/variables", input);
  }

  static async updateVariable(
    id: string,
    input: UpdateVariableInput
  ): Promise<FormatVariable> {
    return HttpClient.patch<FormatVariable>(
      `/format-engine/variables/${id}`,
      input
    );
  }

  static async deleteVariable(id: string): Promise<void> {
    return HttpClient.delete<void>(`/format-engine/variables/${id}`);
  }

  // ==========================================
  // CATÁLOGO DE DATOS DEL SISTEMA
  // ==========================================

  static async getSystemCatalog(): Promise<SystemFieldCategory[]> {
    return HttpClient.get<SystemFieldCategory[]>(
      "/format-engine/system-catalog"
    );
  }

  // ==========================================
  // PARSE & DROP (WORD & EXCEL)
  // ==========================================

  static async parseUploadedFile(file: File): Promise<ParseResult> {
    const formData = new FormData();
    formData.append("file", file);

    return HttpClient.post<ParseResult>("/format-engine/parse-file", formData);
  }

  // ==========================================
  // RENDERIZADO / INTERPOLACIÓN
  // ==========================================

  static async renderCustomHtml(
    input: RenderFormatInput
  ): Promise<RenderResult> {
    return HttpClient.post<RenderResult>("/format-engine/render", input);
  }

  static async renderSavedFormat(
    formatId: string,
    input: RenderFormatInput
  ): Promise<RenderResult> {
    return HttpClient.post<RenderResult>(
      `/format-engine/formats/${formatId}/render`,
      input
    );
  }
}
