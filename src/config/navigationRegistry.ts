/**
 * Navigation Registry (SSOT) - Noxia ERP & Security CRM
 * Especificación: SPEC-CORE-008
 * Mapeo oficial de las 9 Direcciones Estratégicas + Configuraciones (#10) + Herramientas Generales (#11)
 */

export type ModuleStatus = "ACTIVE" | "ROADMAP";

export type ErpDirectionId =
  | "dashboard"
  | "clients"
  | "employees"
  | "commercial"
  | "human-resources"
  | "warehouse"
  | "scheduling"
  | "operations"
  | "technology"
  | "quality"
  | "finance"
  | "settings"
  | "system-tenants"
  | "system-users";

export interface NavigationSubItem {
  id: string;
  title: string;
  description: string;
  status: ModuleStatus;
  path?: string;
  iconName: string;
  sectionHeader?: string;
  permissions?: string[];
  features?: string[];
  bulletColor?: string;
  internalOnly?: boolean;
  roadmapDetails?: {
    overview: string;
    keyPoints: string[];
    dependencies?: string[];
  };
}

export interface ErpDirection {
  id: ErpDirectionId;
  order: number;
  title: string;
  shortTitle: string;
  description: string;
  iconName: string;
  badge?: string;
  path?: string;
  permissions?: string[];
  features?: string[];
  items: NavigationSubItem[];
}

export interface GeneralToolItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: "canvas" | "qr" | "documents" | "quotations" | "schedules";
  actionType: "LINK" | "DRAWER" | "MODAL";
  targetPath?: string;
  status: ModuleStatus;
  roadmapDetails?: {
    overview: string;
    keyPoints: string[];
  };
}

/**
 * 1 a 9: Direcciones del ERP + Dashboard y Configuraciones
 */
export const ERP_DIRECTIONS: ErpDirection[] = [
  {
    id: "dashboard",
    order: 0,
    title: "Panel Principal",
    shortTitle: "Inicio",
    description: "Métricas consolidadas, KPIs de turno y estado del servicio",
    iconName: "DashboardOutlined",
    path: "/dashboard",
    items: [],
  },
  {
    id: "clients",
    order: 1,
    title: "Directorio de Clientes",
    shortTitle: "Clientes",
    description: "Directorio maestro de sedes contratadas, empresas y conjuntos",
    iconName: "BusinessOutlined",
    path: "/administrative/clients",
    permissions: ["client:manage", "client:read"],
    features: ["client"],
    items: [],
  },
  {
    id: "employees",
    order: 2,
    title: "Padrón de Empleados",
    shortTitle: "Empleados",
    description: "Padrón oficial de guardias, supervisores y personal operativo",
    iconName: "PeopleAltOutlined",
    path: "/administrative/employees",
    permissions: ["employee:manage", "employee:read"],
    features: ["employee"],
    items: [],
  },
  {
    id: "commercial",
    order: 3,
    title: "Dirección Comercial",
    shortTitle: "Comercial",
    description: "Captación, pipeline de ventas, propuestas económicas y contratos",
    iconName: "BusinessCenterOutlined",
    items: [
      {
        id: "com-prospects",
        title: "Prospectos y Seguimiento",
        description: "Captación, pipeline de ventas y seguimiento comercial",
        status: "ACTIVE",
        path: "/commercial/prospects",
        iconName: "PersonSearchOutlined",
        sectionHeader: "EMBUDO Y GESTIÓN",
        permissions: ["client:manage", "client:read"],
        features: ["client"],
      },
      {
        id: "com-proposals",
        title: "Propuestas y Cotizaciones",
        description: "Emisión de propuestas económicas, cotizaciones, editor y visor PDF",
        status: "ACTIVE",
        path: "/commercial/proposals",
        iconName: "ReceiptLongOutlined",
        permissions: ["commercial:settings:read"],
        features: ["commercial"],
      },
      {
        id: "com-service-orders",
        title: "Órdenes de Servicio",
        description: "Formalización contractual, actas de inicio e instalación de puestos",
        status: "ACTIVE",
        path: "/commercial/service-orders",
        iconName: "AssignmentTurnedInOutlined",
        permissions: ["commercial:settings:read"],
        features: ["commercial"],
      },
      {
        id: "com-clients",
        title: "Cartera de Clientes",
        description: "Directorio de sedes contratadas, conjuntos residenciales y corporativos",
        status: "ACTIVE",
        path: "/commercial/clients",
        iconName: "BusinessOutlined",
        sectionHeader: "CARTERA Y ADMINISTRACIÓN",
        permissions: ["client:manage", "client:read"],
        features: ["client"],
      },
      {
        id: "com-settings",
        title: "Catálogo y Configuración",
        description: "Motor tarifario SVSP, catálogo de servicios, salarios, identidad visual y firmantes",
        status: "ACTIVE",
        path: "/commercial/settings",
        iconName: "TuneOutlined",
        permissions: ["commercial:settings:read", "commercial:settings:manage"],
        features: ["commercial"],
      },
    ],
  },
  {
    id: "human-resources",
    order: 4,
    title: "Recursos Humanos",
    shortTitle: "RR.HH.",
    description: "Atracción de talento, padrón de empleados, contratos y porte de armas",
    iconName: "BadgeOutlined",
    items: [
      {
        id: "hr-recruitment",
        title: "Captar Aspirantes (Vacantes)",
        description: "Portal de recepción de hojas de vida e interesados en vacantes",
        status: "ROADMAP",
        iconName: "HowToRegOutlined",
        roadmapDetails: {
          overview: "Formulario público y módulo interno de captación de hojas de vida.",
          keyPoints: [
            "Validación previa de antecedentes judiciales y libreta militar.",
            "Preselección por filtros operativos (experiencia, ubicación geográfica).",
          ],
        },
      },
      {
        id: "hr-employees",
        title: "Padrón de Empleados",
        description: "Hojas de vida, datos personales, puestos asignados e historial laboral",
        status: "ACTIVE",
        path: "/administrative/employees",
        iconName: "PeopleAltOutlined",
        permissions: ["employee:manage", "employee:read"],
        features: ["employee"],
      },
      {
        id: "hr-formats",
        title: "Formatos Laborales",
        description: "Plantillas y formularios estandarizados de talento humano",
        status: "ROADMAP",
        iconName: "ArticleOutlined",
        roadmapDetails: {
          overview: "Repositorio de formatos legales y reglamentarios.",
          keyPoints: [
            "Actas de descargo, autorizaciones de descuento y solicitudes de permisos.",
            "Generación con autocompletado de datos del empleado seleccionado.",
          ],
        },
      },
      {
        id: "hr-contracts",
        title: "Contratos Laborales",
        description: "Administración documental de contratos a término fijo e indefinido",
        status: "ROADMAP",
        iconName: "HistoryEduOutlined",
        roadmapDetails: {
          overview: "Gestión del ciclo de vida contractual del personal operativo.",
          keyPoints: [
            "Control de prórrogas y preavisos legales automáticos.",
            "Firma digital de contratos y otrosí.",
          ],
        },
      },
      {
        id: "hr-gun-license",
        title: "Control Porte de Armas",
        description: "Vigilancia estricta del examen psicofísico anual de porte de armas",
        status: "ROADMAP",
        iconName: "ShieldOutlined",
        roadmapDetails: {
          overview: "Semáforo y alertas preventivas de aptitud psicofísica y tiro.",
          keyPoints: [
            "Alertas automáticas 60, 30 y 15 días antes del vencimiento del examen anual.",
            "Bloqueo preventivo en Programación si el guardia tiene el certificado vencido.",
          ],
          dependencies: ["Norma del Departamento de Control de Comercio de Armas"],
        },
      },
      {
        id: "hr-supervigilancia",
        title: "Acreditaciones SuperVigilancia",
        description: "Control de vigencia de cursos de vigilancia, escolta y medios",
        status: "ROADMAP",
        iconName: "WorkspacePremiumOutlined",
        roadmapDetails: {
          overview: "Matriz de cumplimiento de cursos acreditados por la academia.",
          keyPoints: [
            "Registro de carné vigente de la Superintendencia de Vigilancia.",
            "Control de reentrenamiento anual obligatorio.",
          ],
        },
      },
    ],
  },
  {
    id: "warehouse",
    order: 5,
    title: "Dirección de Almacén",
    shortTitle: "Almacén",
    description: "Inventario de armamento, dotaciones, radios, proveedores y compras",
    iconName: "Inventory2Outlined",
    items: [
      {
        id: "wh-inventory",
        title: "Control de Inventario",
        description: "Stock de armamento, munición, uniformes, chalecos antibalas y radios",
        status: "ROADMAP",
        iconName: "InventoryOutlined",
        roadmapDetails: {
          overview: "Kárdex integral de activos físicos de alta seguridad y dotación.",
          keyPoints: [
            "Trazabilidad serial por arma (revólver, pistola, escopeta) y salvoconducto.",
            "Control de fecha de vencimiento quinquenal de chalecos blindados nivel III-A.",
            "Registro de entrega física de dotación al guardia con acta digital.",
          ],
        },
      },
      {
        id: "wh-purchase-schedules",
        title: "Cronograma de Compras",
        description: "Planificación de compras periódicas de dotación y suministros",
        status: "ROADMAP",
        iconName: "CalendarTodayOutlined",
        roadmapDetails: {
          overview: "Calendario de abastecimiento preventivo por temporadas.",
          keyPoints: [
            "Reposición de dotaciones cada 4 meses según legislación laboral.",
            "Consolidación de requerimientos por tallas y sedes de clientes.",
          ],
        },
      },
      {
        id: "wh-payment-schedules",
        title: "Cronograma de Pagos",
        description: "Proyección y control de pagos a proveedores de logística",
        status: "ROADMAP",
        iconName: "PaymentsOutlined",
        roadmapDetails: {
          overview: "Flujo de compromisos económicos con proveedores de armería y uniformes.",
          keyPoints: [
            "Calendario de pagos vinculados a facturas de compras de almacén.",
            "Previsión de caja para desembolsos operativos.",
          ],
        },
      },
      {
        id: "wh-suppliers",
        title: "Directorio de Proveedores",
        description: "Proveedores homologados de armería, uniformes, radios y tecnología",
        status: "ROADMAP",
        iconName: "LocalShippingOutlined",
        roadmapDetails: {
          overview: "Registro de aliados estratégicos y proveedores certificados.",
          keyPoints: [
            "Evaluación de calidad de suministros y tiempos de entrega.",
            "Historial de órdenes de compra emitidas.",
          ],
        },
      },
    ],
  },
  {
    id: "scheduling",
    order: 6,
    title: "Programación de Turnos",
    shortTitle: "Programación",
    description: "Mallas 24/7, asignación de puestos, control de horas y algoritmo ideal",
    iconName: "CalendarMonthOutlined",
    items: [
      {
        id: "sch-shift-management",
        title: "Malla de Turnos Operativos",
        description: "Matriz interactiva 24/7 en esquemas 2x2, 4x2 y 12 horas",
        status: "ROADMAP",
        iconName: "GridOnOutlined",
        roadmapDetails: {
          overview: "Cuadrícula visual de programación de puestos de vigilancia.",
          keyPoints: [
            "Visualización por semana y mes con turnos diurnos (D), nocturnos (N) y descansos (X).",
            "Validación automática de descansos obligatorios por ley.",
          ],
        },
      },
      {
        id: "sch-guard-assignment",
        title: "Asignación de Guardias",
        description: "Vinculación directa de personal a clientes y puestos físicos",
        status: "ROADMAP",
        iconName: "PersonAddAlt1Outlined",
        roadmapDetails: {
          overview: "Asignación fija y rotativa de guardias a puestos de cliente.",
          keyPoints: [
            "Historial cronológico de puestos ocupados por empleado.",
            "Sincronización en tiempo real con el padrón del cliente.",
          ],
        },
      },
      {
        id: "sch-guard-calendar",
        title: "Calendario por Guarda",
        description: "Agenda personalizada de turnos y relevos de cada empleado",
        status: "ROADMAP",
        iconName: "EventNoteOutlined",
        roadmapDetails: {
          overview: "Vista individual del guarda con sus turnos asignados del mes.",
          keyPoints: [
            "Exportable a PDF o consultable por el guarda desde su acceso.",
            "Historial de cambios de turno autorizados.",
          ],
        },
      },
      {
        id: "sch-available-guards",
        title: "Guardias Disponibles",
        description: "Monitoreo en tiempo real de personal de relevo y reserva",
        status: "ROADMAP",
        iconName: "CheckCircleOutlineOutlined",
        roadmapDetails: {
          overview: "Pool de guardas disponibles para atender contingencias.",
          keyPoints: [
            "Filtro por ubicación geográfica cercana al puesto con novedad.",
            "Validación de cursos y examen de armas al día.",
          ],
        },
      },
      {
        id: "sch-absence-reports",
        title: "Reporte de Ausencias",
        description: "Canalización de ausentismo no programado hacia la Central",
        status: "ROADMAP",
        iconName: "ReportProblemOutlined",
        roadmapDetails: {
          overview: "Consola de notificación inmediata de abandono o inasistencia.",
          keyPoints: [
            "Disparo de alerta sonora y visual a la Central de Monitoreo.",
            "Activación del protocolo de relevo inmediato.",
          ],
        },
      },
      {
        id: "sch-hours-quota",
        title: "Conteo de Horas por Cliente",
        description: "Control estricto de horas contratadas vs ejecutadas con límites",
        status: "ROADMAP",
        iconName: "HourglassBottomOutlined",
        roadmapDetails: {
          overview: "Semáforo de cumplimiento del contrato comercial.",
          keyPoints: [
            "Previene prestar horas de más no facturables al cliente.",
            "Alerta cuando el conjunto está próximo a agotar su bolsa de horas adicionales.",
          ],
        },
      },
      {
        id: "sch-schedule-alerts",
        title: "Alertas de Programación",
        description: "Detección de rupturas de turno, vacíos y sobrecosto en horas extras",
        status: "ROADMAP",
        iconName: "NotificationImportantOutlined",
        roadmapDetails: {
          overview: "Motor predictivo de mitigación de riesgo laboral y financiero.",
          keyPoints: [
            "Alerta si un guarda supera el límite legal de 12 horas extras semanales.",
            "Aviso de puestos descubiertos a menos de 2 horas del relevo.",
          ],
        },
      },
      {
        id: "sch-worked-hours-audit",
        title: "Horas Trabajadas por Guardia",
        description: "Cómputo para liquidación de nómina, recargos y dominicales",
        status: "ROADMAP",
        iconName: "AccessTimeOutlined",
        roadmapDetails: {
          overview: "Totalizador exacto de tiempos que alimentará la Nómina.",
          keyPoints: [
            "Desglose de horas diurnas ordinarias, nocturnas, dominicales y festivos.",
            "Exportable directo a archivo de causación de nómina.",
          ],
        },
      },
      {
        id: "sch-novedades",
        title: "Novedades e Indisposiciones",
        description: "Seguimiento de incapacidades, calamidades y permisos",
        status: "ROADMAP",
        iconName: "MedicalServicesOutlined",
        roadmapDetails: {
          overview: "Registro de novedades de salud y fuerza mayor.",
          keyPoints: [
            "Adjunto de incapacidad médica EPS y validación de prórrogas.",
            "Desacoplamiento temporal de la malla sin perder trazabilidad.",
          ],
        },
      },
      {
        id: "sch-ideal-guard-algorithm",
        title: "Algoritmo de Guarda Ideal",
        description: "Motor de emparejamiento automático por perfil, cursos y cercanía",
        status: "ROADMAP",
        iconName: "AutoAwesomeOutlined",
        roadmapDetails: {
          overview: "Algoritmo de scoring que cruza la necesidad del cliente con el talento disponible.",
          keyPoints: [
            "Ponderación: Perfil comercial + proximidad al puesto + evaluaciones de calidad.",
            "Recomienda el top 3 de guardias óptimos para el cliente.",
          ],
        },
      },
    ],
  },
  {
    id: "operations",
    order: 7,
    title: "Dirección de Operaciones",
    shortTitle: "Operaciones",
    description: "Central de monitoreo, 4 minutas de puesto, campo y estudios de seguridad",
    iconName: "SecurityOutlined",
    items: [
      {
        id: "ops-soc",
        title: "Central de Monitoreo (SOC)",
        description: "Mesa de ayuda y operador de medios tecnológicos corporativo",
        status: "ACTIVE",
        path: "/operation/internal/minuta-general",
        iconName: "SupportAgentOutlined",
        permissions: ["minuta:manage", "minuta:read"],
        features: ["minuta"],
        bulletColor: "#7C3AED",
      },
      {
        id: "ops-minuta-general",
        title: "Minuta General de Puestos",
        description: "Registro cronológico de novedades e incidentes de clientes",
        status: "ACTIVE",
        path: "/operation/minuta-general",
        iconName: "NotesOutlined",
        permissions: ["minuta:manage", "minuta:read"],
        features: ["minuta"],
        bulletColor: "#1976d2",
      },
      {
        id: "ops-visitor",
        title: "Control de Visitas",
        description: "Ingreso, salida, unidades autorizantes y verificación de documentos",
        status: "ACTIVE",
        path: "/operation/visitor",
        iconName: "PeopleAltOutlined",
        permissions: ["minuta:manage", "minuta:read"],
        features: ["visitor"],
        bulletColor: "#ed6c02",
      },
      {
        id: "ops-correspondence",
        title: "Control de Domicilios",
        description: "Recepción de correspondencia, casilleros y entrega con evidencia",
        status: "ACTIVE",
        path: "/operation/correspondence",
        iconName: "HomeWorkOutlined",
        permissions: ["minuta:manage", "minuta:read"],
        features: ["correspondence"],
        bulletColor: "#9c27b0",
      },
      {
        id: "ops-parking",
        title: "Control de Parqueadero",
        description: "Registro de placas vehiculares, bahías y control de acceso",
        status: "ACTIVE",
        path: "/operation/parking",
        iconName: "LocalParkingOutlined",
        permissions: ["minuta:manage", "minuta:read"],
        features: ["parking"],
        bulletColor: "#2e7d32",
      },
      {
        id: "ops-security-studies",
        title: "Estudios de Seguridad",
        description: "Análisis perimetral en lienzo CAD Konva y cartografía satelital Mapbox",
        status: "ACTIVE",
        path: "/administrative/clients",
        iconName: "ShieldOutlined",
        permissions: ["sec_study:read", "canva:read"],
        features: ["sec_study", "canva"],
      },
    ],
  },
  {
    id: "technology",
    order: 8,
    title: "Dirección de Tecnología",
    shortTitle: "Tecnología",
    description: "Proyectos de CCTV, talanqueras vehiculares, alarmas y reconocimiento facial",
    iconName: "MemoryOutlined",
    items: [
      {
        id: "tech-quotations",
        title: "Cotizaciones de Seguridad Electrónica",
        description: "Diseño y costeo técnico de proyectos electrónicos",
        status: "ROADMAP",
        iconName: "CalculateOutlined",
        roadmapDetails: {
          overview: "Presupuestos especializados en equipos de seguridad electrónica.",
          keyPoints: [
            "Desglose de cámaras IP, DVR/NVR, cableado estructurado y fuentes de poder.",
            "Cálculo de mano de obra técnica e instalación.",
          ],
        },
      },
      {
        id: "tech-installations",
        title: "Instalaciones y Proyectos",
        description: "Control de obras de CCTV, talanqueras, alarmas y biometría facial",
        status: "ROADMAP",
        iconName: "VideocamOutlined",
        roadmapDetails: {
          overview: "Seguimiento de proyectos de instalación y mantenimiento técnico.",
          keyPoints: [
            "Cronograma de obra e hitos de entrega en sedes de clientes.",
            "Acta digital de entrega a satisfacción con fotos de evidencia.",
          ],
        },
      },
    ],
  },
  {
    id: "quality",
    order: 9,
    title: "Dirección de Calidad",
    shortTitle: "Calidad",
    description: "E-Learning para el personal, estándares de servicio y módulo PQRS B2B",
    iconName: "VerifiedOutlined",
    items: [
      {
        id: "qlt-pqrs",
        title: "Gestión de PQRS",
        description: "Plataforma de tickets, chat bidireccional y alertas en tiempo real",
        status: "ACTIVE",
        path: "/administrative/pqrs",
        iconName: "FeedbackOutlined",
        permissions: ["pqrs:manage", "pqrs:read", "pqrs:create"],
        features: ["pqrs"],
      },
      {
        id: "qlt-elearning-authoring",
        title: "Creador de Cursos (E-Learning)",
        description: "Módulo de autor para subida de videos, material, quiz y puntajes",
        status: "ROADMAP",
        iconName: "PostAddOutlined",
        roadmapDetails: {
          overview: "Plataforma de creación de cursos de formación continua.",
          keyPoints: [
            "Subida de material audiovisual, infografías y evaluaciones tipo test.",
            "Definición de puntaje mínimo de aprobación para certificar al guardia.",
          ],
        },
      },
      {
        id: "qlt-elearning-player",
        title: "Aula Virtual (Capacitación)",
        description: "Reproducción interactiva de cursos obligatorios para el personal",
        status: "ROADMAP",
        iconName: "SchoolOutlined",
        roadmapDetails: {
          overview: "Entorno de aprendizaje donde los guardias realizan sus capacitaciones.",
          keyPoints: [
            "Monitoreo de porcentaje de avance y emisión de diploma digital.",
            "Cursos en servicio al cliente, manejo de crisis y primeros auxilios.",
          ],
        },
      },
    ],
  },
  {
    id: "finance",
    order: 10,
    title: "Dirección Financiera",
    shortTitle: "Finanzas",
    description: "Tesorería, facturación de puestos contratados, nómina y contabilidad NIIF",
    iconName: "AccountBalanceOutlined",
    items: [
      {
        id: "fin-treasury",
        title: "Tesorería (Nómina y Facturación)",
        description: "Facturación a clientes por puestos y liquidación de horas/nómina",
        status: "ROADMAP",
        iconName: "ReceiptOutlined",
        roadmapDetails: {
          overview: "Núcleo de monetización del ERP.",
          keyPoints: [
            "Consolida horas de Programación para liquidar nómina neta de guardias.",
            "Facturación electrónica recurrente basada en contratos de Comercial.",
          ],
          dependencies: ["Programación 24/7", "Contratos Comerciales", "Almacén"],
        },
      },
      {
        id: "fin-accounting",
        title: "Contabilidad General",
        description: "Libro mayor, balances, retenciones y causaciones NIIF",
        status: "ROADMAP",
        iconName: "AccountBalanceWalletOutlined",
        roadmapDetails: {
          overview: "Receptor contable de toda la operación empresarial.",
          keyPoints: [
            "Causación automática de nómina y facturación de servicios.",
            "Cumplimiento normativo y balances financieros.",
          ],
        },
      },
    ],
  },
  {
    id: "settings",
    order: 11,
    title: "Configuraciones y Gobierno",
    shortTitle: "Ajustes",
    description: "Firma digital, credenciales, usuarios, roles RBAC y parámetros de tenant",
    iconName: "SettingsOutlined",
    items: [
      {
        id: "cfg-signature",
        title: "Firma Digital",
        description: "Configuración y rúbrica digital para actas, minutas y contratos",
        status: "ROADMAP",
        iconName: "DrawOutlined",
        roadmapDetails: {
          overview: "Firma electrónica con validez probatoria.",
          keyPoints: [
            "Captura de trazo digital y estampado cronológico.",
            "Incrustación en actas de entrega, minutas y promesas de compra.",
          ],
        },
      },
      {
        id: "cfg-users",
        title: "Gestión de Usuarios",
        description: "Cuentas de acceso, credenciales y perfiles de sesión",
        status: "ACTIVE",
        path: "/administrative/users",
        iconName: "ManageAccountsOutlined",
        permissions: ["user:manage", "user:read"],
        features: ["user"],
      },
      {
        id: "cfg-roles",
        title: "Control de Roles",
        description: "Matriz granular de permisos y asignación de privilegios",
        status: "ACTIVE",
        path: "/administrative/roles",
        iconName: "AdminPanelSettingsOutlined",
        permissions: ["role:manage", "role:read"],
        features: ["role"],
      },
      {
        id: "cfg-departments",
        title: "Departamentos",
        description: "Estructura de áreas organizacionales de la empresa",
        status: "ACTIVE",
        path: "/administrative/departments",
        iconName: "AccountTreeOutlined",
        permissions: ["department:manage", "department:read"],
        features: ["department"],
      },
      {
        id: "cfg-positions",
        title: "Cargos y Posiciones",
        description: "Catálogo de cargos con homologación de categorías operativas",
        status: "ACTIVE",
        path: "/administrative/positions",
        iconName: "WorkOutlineOutlined",
        permissions: ["position:manage", "position:read"],
        features: ["position"],
      },
      {
        id: "cfg-tenants",
        title: "Empresas y Tenants",
        description: "Parámetros globales, marcas, logos y suscripciones",
        status: "ACTIVE",
        path: "/administrative/tenants",
        iconName: "DomainOutlined",
        permissions: ["godlike:manage"],
      },
    ],
  },
];

/**
 * 11: Herramientas Generales Transversales
 */
export const GENERAL_TOOLS: GeneralToolItem[] = [
  {
    id: "tool-canva",
    title: "Canva de Seguridad",
    description: "Lienzo CAD interactivo con georreferenciación Mapbox y simbología perimetral",
    iconName: "PaletteOutlined",
    category: "canvas",
    actionType: "LINK",
    targetPath: "/administrative/clients",
    status: "ACTIVE",
  },
  {
    id: "tool-qr",
    title: "Generador de Códigos QR",
    description: "Creación instantánea de QR para puntos de ronda, credenciales de personal y activos",
    iconName: "QrCode2Outlined",
    category: "qr",
    actionType: "MODAL",
    status: "ACTIVE",
  },
  {
    id: "tool-templates",
    title: "Elaboración de Formatos",
    description: "Generador de contratos, actas de entrega de dotación, minutas y otrosí",
    iconName: "DescriptionOutlined",
    category: "documents",
    actionType: "LINK",
    targetPath: "/tools/formats",
    status: "ACTIVE",



    roadmapDetails: {
      overview: "Centro de plantillas dinámicas con inyección de variables.",
      keyPoints: [
        "Variables automáticas: {nombre_empleado}, {cliente}, {fecha}, {nit}.",
        "Exportación a PDF con membrete oficial del tenant.",
      ],
    },
  },
  {
    id: "tool-quotations",
    title: "Elaboración de Cotizaciones",
    description: "Generador transversal de propuestas de vigilancia física y electrónica",
    iconName: "ReceiptLongOutlined",
    category: "quotations",
    actionType: "MODAL",
    status: "ROADMAP",
    roadmapDetails: {
      overview: "Cotizador transversal consumible por Comercial y Tecnología.",
      keyPoints: [
        "Cotizaciones parametrizadas con cálculo automático de IVA y retenciones.",
        "Emisión con consecutivo oficial.",
      ],
    },
  },
  {
    id: "tool-purchase-orders",
    title: "Elaboración de Órdenes de Compra",
    description: "Emisión de requerimientos de abastecimiento para almacén y operaciones",
    iconName: "ShoppingCartOutlined",
    category: "documents",
    actionType: "MODAL",
    status: "ROADMAP",
    roadmapDetails: {
      overview: "Generación de órdenes de compra con aprobación de gerencia.",
      keyPoints: [
        "Detalle de artículos, cantidades y proveedor seleccionado.",
        "Generación en PDF con estado 'Borrador', 'Aprobada' o 'Despachada'.",
      ],
    },
  },
  {
    id: "tool-schedules",
    title: "Elaboración de Cronogramas",
    description: "Planificador temporal de rondas, compras de dotación y auditorías de calidad",
    iconName: "EventNoteOutlined",
    category: "schedules",
    actionType: "MODAL",
    status: "ROADMAP",
    roadmapDetails: {
      overview: "Herramienta de calendario y diagramas de Gantt para proyectos operativos.",
      keyPoints: [
        "Hitos de control para instalaciones técnicas y auditorías de calidad.",
        "Recordatorios automáticos en el sistema.",
      ],
    },
  },
];

/**
 * Direcciones de la Consola Maestra Global (Tenant 'system' / SuperAdmin)
 * Conforme a SPEC-REG-007
 */
export const SYSTEM_MASTER_DIRECTIONS: ErpDirection[] = [
  {
    id: "dashboard",
    order: 0,
    title: "Dashboard Global",
    shortTitle: "Dashboard",
    description: "Métricas consolidadas de la plataforma, actividad global y rendimiento de tenants",
    iconName: "DashboardOutlined",
    badge: "SaaS",
    path: "/dashboard",
    permissions: ["godlike:manage"],
    items: [],
  },
  {
    id: "system-tenants",
    order: 1,
    title: "Empresas y Tenants",
    shortTitle: "Empresas",
    description: "Gestión multi-tenant, marcas blancas, licenciamiento y suscripciones empresariales",
    iconName: "DomainOutlined",
    badge: "Tenants",
    permissions: ["godlike:manage"],
    items: [
      {
        id: "sys-tenants-list",
        title: "Todas las Empresas",
        description: "Directorio maestro de empresas de seguridad, estados y acceso directo (impersonate)",
        status: "ACTIVE",
        path: "/administrative/tenants",
        iconName: "DomainOutlined",
        permissions: ["godlike:manage"],
      },
      {
        id: "sys-tenants-create",
        title: "Registrar Empresa",
        description: "Alta de un nuevo tenant, configuración inicial y asignación de planes",
        status: "ACTIVE",
        path: "/administrative/tenants/create",
        iconName: "BusinessOutlined",
        permissions: ["godlike:manage"],
      },
    ],
  },
  {
    id: "system-users",
    order: 2,
    title: "Usuarios y Accesos Globales",
    shortTitle: "Usuarios",
    description: "Administración central de cuentas SuperAdmin, soporte técnico y roles del sistema",
    iconName: "AdminPanelSettingsOutlined",
    badge: "Master",
    permissions: ["godlike:manage"],
    items: [
      {
        id: "sys-users-list",
        title: "Usuarios del Sistema",
        description: "Cuentas de administradores de plataforma y soporte técnico",
        status: "ACTIVE",
        path: "/administrative/users",
        iconName: "ManageAccountsOutlined",
        permissions: ["godlike:manage"],
      },
      {
        id: "sys-roles-list",
        title: "Roles y Permisos",
        description: "Matriz global de roles maestros y permisos del sistema",
        status: "ACTIVE",
        path: "/administrative/roles",
        iconName: "SecurityOutlined",
        permissions: ["godlike:manage"],
      },
    ],
  },
];

/**
 * Helpers de filtrado por RBAC y Tenant
 */
export function filterAccessibleDirections(
  directions: ErpDirection[],
  permissions: string[] = [],
  isFeatureEnabled: (feature: string) => boolean = () => true,
  isGodlike = false,
  clientId?: string | null,
  isSystemMaster = false,
): ErpDirection[] {
  // En modo Consola Maestra SaaS (Tenant 'system' sin impersonación),
  // se muestran exclusivamente las direcciones del sistema global (SPEC-REG-007).
  if (isSystemMaster) {
    return SYSTEM_MASTER_DIRECTIONS;
  }

  // Si es SuperAdmin pero está administrando una empresa operativa (impersonate),
  // tiene acceso total a todas las direcciones del ERP de esa empresa.
  if (isGodlike) {
    return directions;
  }

  return directions
    .filter((dir) => {
      if (dir.permissions && dir.permissions.length > 0) {
        const hasDirPerm = dir.permissions.some((p) => permissions.includes(p));
        if (!hasDirPerm) return false;
      }
      if (dir.features && dir.features.length > 0) {
        const hasDirFeature = dir.features.every((f) => isFeatureEnabled(f));
        if (!hasDirFeature) return false;
      }
      return true;
    })
    .map((dir) => {
      const filteredItems = dir.items.filter((item) => {
        if (item.internalOnly && clientId) {
          return false;
        }
        if (item.permissions && item.permissions.length > 0) {
          const hasItemPerm = item.permissions.some((p) => permissions.includes(p));
          if (!hasItemPerm) return false;
        }
        if (item.features && item.features.length > 0) {
          const hasItemFeature = item.features.every((f) => isFeatureEnabled(f));
          if (!hasItemFeature) return false;
        }
        return true;
      });

      return {
        ...dir,
        items: filteredItems,
      };
    })
    .filter((dir) => dir.items.length > 0 || Boolean(dir.path) || dir.id === "dashboard" || dir.id === "clients" || dir.id === "employees");
}
