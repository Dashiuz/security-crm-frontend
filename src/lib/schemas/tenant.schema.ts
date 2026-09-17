import { z } from "zod";

export const PlanTierEnum = z.enum(["BASIC", "PRO", "ENTERPRISE"]);
export type PlanTier = z.infer<typeof PlanTierEnum>;

export const SubscriptionStatusEnum = z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "CANCELED"]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;

export const PasswordPolicyEnum = z.enum(["LOW", "MEDIUM", "STRICT"]);
export type PasswordPolicy = z.infer<typeof PasswordPolicyEnum>;

// Paso 1: Información General
export const tenantGeneralSchema = z.object({
  name: z.string().min(1, "El nombre de la empresa es requerido").max(100, "Máximo 100 caracteres"),
  slug: z
    .string()
    .min(1, "El slug identificador es requerido")
    .max(50, "Máximo 50 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones (-)"),
  isActive: z.boolean(),
  logoUrl: z.string().max(255).optional().or(z.literal("")),
  primaryColor: z.string().max(20).optional().or(z.literal("")),
  secondaryColor: z.string().max(20).optional().or(z.literal("")),
  sidebarColor: z.string().max(20).optional().or(z.literal("")),
});

export type TenantGeneralFormData = z.infer<typeof tenantGeneralSchema>;

// Paso 2: Perfil Legal y Contacto
export const tenantProfileSchema = z.object({
  legalName: z.string().min(1, "La razón social es obligatoria").max(150, "Máximo 150 caracteres"),
  taxId: z.string().min(1, "El NIT o RUT es obligatorio").max(50, "Máximo 50 caracteres"),
  contactEmail: z.string().min(1, "El correo de contacto es obligatorio").email("Debe ser un email válido").max(100),
  contactPhone: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  legalRepresentative: z.string().max(150).optional().or(z.literal("")),
});

export type TenantProfileFormData = z.infer<typeof tenantProfileSchema>;

// Paso 3: Suscripción y Límites
export const tenantSubscriptionSchema = z.object({
  planTier: PlanTierEnum,
  status: SubscriptionStatusEnum,
  maxClients: z.number().int().min(1, "Mínimo 1 cliente"),
  maxUsers: z.number().int().min(1, "Mínimo 1 usuario"),
  maxEmployees: z.number().int().min(1, "Mínimo 1 empleado"),
  subscriptionEndsAt: z.string().optional().or(z.literal("")),
  paymentGatewayId: z.string().max(100).optional().or(z.literal("")),
});

export type TenantSubscriptionFormData = z.infer<typeof tenantSubscriptionSchema>;

// Paso 4: Ajustes y Seguridad
export const tenantSettingsSchema = z.object({
  timezone: z.string().min(1, "La zona horaria es requerida").max(50),
  currency: z.string().min(1, "La moneda es requerida").max(10),
  dateFormat: z.string().min(1, "El formato de fecha es requerido").max(20),
  mfaRequired: z.boolean(),
  sessionTimeoutMinutes: z
    .number()
    .int()
    .min(5, "Mínimo 5 minutos")
    .max(1440, "Máximo 1440 minutos (24 horas)"),
  passwordPolicy: PasswordPolicyEnum,
  faviconUrl: z.string().max(255).optional().or(z.literal("")),
  loginBackgroundUrl: z.string().max(255).optional().or(z.literal("")),
  supportEmail: z.string().email("Debe ser un email válido").optional().or(z.literal("")),
  supportPhone: z.string().max(50).optional().or(z.literal("")),
});

export type TenantSettingsFormData = z.infer<typeof tenantSettingsSchema>;

// Paso 5: Módulos (Features)
export const tenantFeaturesSchema = z.object({
  features: z.array(z.string()),
});

export type TenantFeaturesFormData = z.infer<typeof tenantFeaturesSchema>;

// Esquema unificado para el Payload de Creación
export const createTenantFullSchema = z.object({
  general: tenantGeneralSchema,
  profile: tenantProfileSchema,
  subscription: tenantSubscriptionSchema,
  settings: tenantSettingsSchema,
  features: tenantFeaturesSchema,
});

export type CreateTenantFullData = z.infer<typeof createTenantFullSchema>;
