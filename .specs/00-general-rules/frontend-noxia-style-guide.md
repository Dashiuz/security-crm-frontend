# Guía de Estilo y Sistema de Diseño Noxia: "Deep Violet Tactical Enterprise"

> **Estado**: `VIGENTE`  
> **Ámbito**: Frontend Global (`security-crm-frontend`)  
> **Framework Base**: Next.js 16 (App Router) + Material UI (MUI v6/v7) + Emotion  
> **Autor**: Lead Software Architect & UI/UX Design System Team  
> **Fecha de Entrada en Vigor**: 2026-10-20  

---

## 1. Filosofía de Diseño: "Mission-Critical Operational Security"

**Noxia** es una plataforma tecnológica de misión crítica para empresas de seguridad privada, vigilancia física, patrullaje perimetral, control de accesos e inspección residencial. 

A diferencia de las aplicaciones corporativas genéricas o tableros financieros tradicionales, las interfaces de Noxia operan en entornos de alta exigencia:
- **Centros de Control y Monitoreo (SOC / 24/7)**: Puestos de mando donde operadores gestionan múltiples alertas, llamadas de radio y minutas en tiempo real.
- **Garitas de Acceso y Porterías**: Guardas de seguridad operando pantallas táctiles o tabletas móviles bajo condiciones variables de luz.
- **Gerencias de Operaciones y Clientes**: Paneles densos donde se evalúan análisis de riesgo, contratos, novedades legales y personal asignado.

### Principios Fundamentales:
1. **Diferenciación y Prestigio Táctico**: Salimos del azul marino corporativo genérico. Adoptamos el espectro del **Violeta Real (`#7C3AED` / `#6D28D9`)** en armonía con un fondo de mando **Midnight Obsidian (`#1E1B4B` / `#0F172A`)**, evocando inteligencia, ciberseguridad y autoridad tecnológica.
2. **Claridad sobre Ruido (High-Signal, Low-Noise)**: La densidad de datos no debe generar fatiga visual. Cada píxel, borde y separador cumple un propósito informativo o jerárquico.
3. **Dualidad Responsiva Predictiva**: Toda vista nace pensada para dos realidades:
   - **Desktop (md+)**: Alta densidad tabular, navegación anidada, split-panes y atajos de teclado.
   - **Mobile / Tablet (xs/sm)**: Listados virtualizados con desplazamiento infinito, *Bottom Sheets* gestuales y navegación *Hub & Spoke*.
4. **Persistencia e Inmutabilidad Forense**: Las bitácoras, minutas, firmas y evidencias son inmutables. El diseño visual enfatiza la trazabilidad (quién, cuándo y desde dónde) con tipografía monoespaciada de alta precisión.

---

## 2. Sistema de Diseño Fundacional

### 2.1 Paleta Cromática Oficial: "Noxia Deep Violet"

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NOXIA COLOR ECOSYSTEM                           │
├───────────────────┬───────────────────┬────────────────────────────────┤
│   PRIMARY BRAND   │  MIDNIGHT COMMAND │     OPERATIONAL SEVERITY       │
│  Violet 600 / 700 │  Indigo 950 / 900 │  Emerald • Amber • Rose • Iris │
│ #7C3AED / #6D28D9 │ #1E1B4B / #312E81 │   #059669 #D97706 #E11D48 #4F46E5│
└───────────────────┴───────────────────┴────────────────────────────────┘
```

#### A. Tokens Primarios (Marca, Foco y Acción Principal)
- **`primary.main` (`#7C3AED`)**: Violeta vibrante. Botones primarios, iconos activos, switches encendidos y bordes de acento.
- **`primary.dark` (`#5B21B6`)**: Violeta profundo. Hover de botones, headers de diálogo con alto contraste (contraste WCAG AAA > 7:1 contra blanco).
- **`primary.light` (`#A78BFA`)**: Violeta suave. Focus rings, badges secundarios y bordes de realce.
- **`primary.soft` (`#F5F3FF`)**: Superficie violeta tenue. Fondos de filas seleccionadas en tablas, chips activos y fondos de tabs activos.
- **`primary.contrastText` (`#FFFFFF`)**: Blanco puro de máxima legibilidad.

#### B. Tokens Secundarios y Centro de Mando (Midnight Obsidian)
- **`secondary.main` (`#1E1B4B`)**: Azul noche índigo. Barra de navegación superior ([`Navbar`](file:///d:/projects/security-crm-frontend/src/components/layout/Navbar.tsx)), cabeceras de mandos tácticos y banners institucionales.
- **`secondary.light` (`#312E81`)**: Índigo profundo. Sidenav secundario de clientes y empleados.
- **`neutral.slate` (`#475569`)**: Gris pizarra para subtítulos, metadatos y estados inactivos.

#### C. Semántica Operativa y Niveles de Severidad
- **Verificado / Activo / Guardia en Turno / Éxito**:
  - Main: **`#059669`** (Emerald 600) | Fondo chip: **`#ECFDF5`** (Emerald 50) | Borde: **`#A7F3D0`**.
- **Novedad / Pendiente / Advertencia / Prioridad 4**:
  - Main: **`#D97706`** (Amber 600) | Fondo chip: **`#FFFBEB`** (Amber 50) | Borde: **`#FDE68A`**.
- **Crítico / Pánico / Emergencia / Rechazado**:
  - Main: **`#E11D48`** (Rose 600) | Fondo chip: **`#FFF1F2`** (Rose 50) | Borde: **`#FECDD3`**.
- **Informativo / Minuta Rutinaria / General**:
  - Main: **`#4F46E5`** (Indigo 600) | Fondo chip: **`#EEF2FF`** (Indigo 50) | Borde: **`#C7D2FE`**.

#### D. Fondos y Superficies Neutras
- **`background.default` (`#F8FAFC`)**: Slate 50. Fondo de pantalla frío, limpio y sin fatiga.
- **`background.paper` (`#FFFFFF`)**: Superficie blanca pura para tarjetas, tablas y modales.
- **`divider` (`#E2E8F0`)**: Hairline border de 1px que separa secciones sin ensuciar la vista.
- **`text.primary` (`#0F172A`)**: Slate 900. Títulos y textos principales de alto contraste.
- **`text.secondary` (`#64748B`)**: Slate 500. Metadatos, etiquetas y descripciones.

---

### 2.2 Tipografía Oficial

| Rol | Familia Tipográfica | Pesos | Caso de Uso |
| :--- | :--- | :--- | :--- |
| **Principal (UI)** | **Plus Jakarta Sans** (fallback: Inter, sans-serif) | `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold) | Toda la interfaz de usuario, títulos, botones, inputs y navegación. |
| **Técnica (Data)** | **JetBrains Mono** (fallback: monospace) | `500` (Medium), `600` (SemiBold) | Códigos de tickets (`PQR-2026-001`), documentos de identidad, placas vehiculares (`ABC-123`), marcas de tiempo (`14:32:05`), direcciones IP y cifras financieras. |

*Regla de Oro en Botones*: `textTransform: "none"`. Queda estrictamente prohibido el uso de botones con texto forzado a mayúsculas sostenidas (`UPPERCASE`).

---

### 2.3 Sistema de Radios y Sombras Enterprise

- **Bordes Redondeados (Border Radius)**:
  - `xs (4px)`: Badges mínimos y tags numéricos.
  - `sm (6px)`: Chips semánticos y tooltips.
  - `md (8px)`: Botones, inputs de texto, selects y checkboxes.
  - `lg (12px)`: Tarjetas (Cards), contenedores Paper y ventanas modales de diálogo.
  - `xl (16px)`: Drawers laterales y contenedores de alta jerarquía.
  - `pill (20px / 9999px)`: Agarradores táctiles y Bottom Sheets en móvil.
- **Sombras Nítidas (Crisp Shadows)**:
  - *Base*: `0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.08)`.
  - *Card Hover*: `0 4px 12px rgba(109, 40, 217, 0.08), 0 1px 3px rgba(15, 23, 42, 0.05)`.
  - *Drawer / Modal*: `0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 10px 10px -5px rgba(15, 23, 42, 0.04)`.

---

## 3. Los 5 Arquetipos de Interfaz Noxia

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUETIPOS DE INTERFAZ                          │
├───────────────────────────────────┬────────────────────────────────────┤
│ A. Arquetipo de Listado Universal │ B. Arquetipo de Inspección Rápida  │
│ C. Espacio de Trabajo Denso (Hub) │ D. Operación Fija (Split-Pane)     │
│ E. Formularios y Asignación       │                                    │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

### A. Arquetipo de Listado Universal
Diseñado para la gestión y búsqueda de grandes volúmenes de datos (Residentes, Minutas, Empleados, Clientes, Usuarios, Vehículos).

- **Componente Canónico**: [`ResponsiveDataView`](file:///d:/projects/security-crm-frontend/src/components/common/ResponsiveDataView.tsx).
- **Comportamiento Desktop (`md+`)**:
  - Renderiza [`DataTable`](file:///d:/projects/security-crm-frontend/src/components/common/DataTable.tsx) basado en `@mui/x-data-grid`.
  - Altura de fila compacta (`density="standard"` o `"compact"`), cabecera fijada con fondo `#F8FAFC`, ordenamiento multi-columna, búsqueda rápida y exportación a CSV/PDF.
  - **Líneas Divisorias de Filas**: Separador horizontal nítido en `#E2E8F0` (Slate-200) y cabecera en `1.5px solid #CBD5E1` (Slate-300) para un ritmo visual denso, ordenado y descansado para la vista.
  - **Fila en Hover**: Velo sutil en `rgba(124, 58, 237, 0.035)` que acompaña el escaneo horizontal del operador.
  - **Columna de Acciones Canónica (Estilo Stripe / Linear SaaS)**:
    - Cabecera limpia sin texto: `headerName: ""` (evita el anti-patrón de recorte `"Accio..."`).
    - Ancho ultra-compacto de **`54px`** (centrado ergonómico para el botón circular de 32x32px del kebab menu).
    - Fija / Sticky a la derecha con sombra difuminada suave (`boxShadow: -3px 0 6px rgba(15, 23, 42, 0.025)`) y borde divisorio `#E2E8F0`, manteniendo el fondo mimetizado idéntico al de la fila en reposo (`#FFFFFF`) y en hover (`#FAF8FF`).
    - Botón de tres puntos (`⋮`) en gris pizarra `#64748B`, con hover circular reactivo en `rgba(124, 58, 237, 0.08)` y color primario violeta.
  - Paginación server-side basada en cursor o números de página.
- **Comportamiento Mobile (`xs`, `sm`)**:
  - Se conmuta automáticamente a desplazamiento infinito virtualizado mediante `react-virtuoso`.
  - Cada registro se visualiza con [`UniversalMobileCard`](file:///d:/projects/security-crm-frontend/src/components/common/UniversalMobileCard.tsx).
  - Target táctil mínimo de 44x44px en botones de acción. Avatar, nombre destacado y metadatos clave en chips.

---

### B. Arquetipo de Inspección / Detalle Rápido
Diseñado para consultar la ficha completa de un registro sin abandonar el contexto de la tabla principal.

- **Componente Canónico**: [`ResponsiveDetailWrapper`](file:///d:/projects/security-crm-frontend/src/components/common/ResponsiveDetailWrapper.tsx).
- **Comportamiento Desktop (`md+`)**:
  - Abre un **Cajón Lateral Derecho (Right Drawer)** con ancho predeterminado de `540px` a `640px`.
  - El fondo de la pantalla se oscurece con un backdrop semitransparente.
  - La tabla de fondo se mantiene intacta en su posición de scroll.
- **Comportamiento Mobile (`xs`, `sm`)**:
  - Se transforma automáticamente en un **Bottom Sheet gestual** (`anchor="bottom"`).
  - Ocupa hasta el `92vh` con esquinas superiores redondeadas (`borderRadius: 20px`) y agarrador táctil (*drag handle*).
  - Contenido scrolleable internamente con barra de acciones fijada al pie respetando el `safe-area-inset-bottom`.

---

### C. Arquetipo de Espacio de Trabajo Denso (Workspace y Enrutamiento Anidado)
Diseñado para entidades complejas que concentran múltiples dimensiones operativas y administrativas (ej. Ficha del Cliente [`/administrative/clients/[id]`](file:///d:/projects/security-crm-frontend/src/app/(protected)/administrative/clients/[id]) o Ficha del Empleado [`/administrative/employees/[id]`](file:///d:/projects/security-crm-frontend/src/app/(protected)/administrative/employees/[id])).

- **Estructura Arquitectónica**:
  ```text
  /clients/[id]/
  ├── layout.tsx         # Sidenav (Desktop) + Context Provider centralizado
  ├── page.tsx           # Hub de Navegación Móvil (Hub & Spoke) / Redirect Desktop
  ├── overview/          # Resumen General y Ubicación
  ├── operations/        # Estructura Física y Puestos de Vigilancia
  ├── users/             # Personal y Guardias Asignados
  ├── legal/             # Contratos, Administración y Consejo
  ├── residents/         # Padrón de Residentes (con Arquetipo A)
  └── security-studies/  # Informes y Estudios de Seguridad
  ```
- **Comportamiento Desktop (`md+`)**:
  - Sidenav secundario a la izquierda (`240px`) con iconos semánticos, descripción de sub-módulo y estado activo marcado con acento violeta (`#7C3AED`) y fondo `#F5F3FF`.
  - Área central amplia para la sub-ruta activa.
- **Comportamiento Mobile (`xs`, `sm`)**:
  - **Patrón Hub & Spoke**: La ruta raíz `/clients/[id]` muestra tarjetas táctiles grandes con contadores y estados de salud.
  - Al presionar una tarjeta, navega a la sub-ruta a pantalla completa, incorporando en la cabecera un botón superior izquierdo: `"← Volver al Cliente"`.
- **Persistencia por Tarjeta**:
  - Dentro de cada vista, la información se agrupa en tarjetas de lectura limpia.
  - Cada tarjeta posee su propio botón `"Editar"`, el cual transforma únicamente esa sección en formulario y despacha un `PATCH` granular, previniendo sobrescrituras accidentales.

---

### D. Arquetipo de Operación Fija (Viewport-Locked Split-Pane)
Diseñado para consolas operativas de alta velocidad y atención continua (ej. Consola de PQRS [`/administrative/pqrs/[id]`](file:///d:/projects/security-crm-frontend/src/app/(protected)/administrative/pqrs/[id]) y Minuta General [`/operation/minuta-general`](file:///d:/projects/security-crm-frontend/src/app/(protected)/operation/minuta-general)).

- **Bloqueo del Viewport**:
  - La pantalla principal se bloquea a `height: calc(100vh - 64px)` con `overflow: hidden`.
- **Estructura Split-Pane (Desktop)**:
  - **Panel Izquierdo (Interacción y Línea de Tiempo)**: Historial cronológico de eventos, chat bidireccional de PQRS o registro dinámico de novedades. Caja de respuesta/anotación fijada al fondo.
  - **Panel Derecho (Inspección y Trazabilidad)**: Tarjeta de SLA/tiempos de respuesta, estado del ticket, prioridad, funcionario asignado, cliente vinculado y adjuntos multimedia con scroll independiente.
- **Comportamiento Mobile**:
  - Se conmuta a un control de pestañas superior (`Tabs` MUI) con badge de notificaciones: `[ Timeline | Detalles & SLA | Adjuntos ]`.

---

### E. Arquetipo de Formularios y Asignación: "Zero-Dialog Policy" (CERO Modales)
Diseñado para la creación y edición de entidades complejas, captura de datos, asignaciones y firmas (ej. Pólizas, Otrosíes, ANS, Órdenes de Servicio, Onboarding de Cliente o Asignación de Guardias).

- **REGLA DE ORO DE MISIÓN CRÍTICA: PROHIBICIÓN ABSOLUTA DE VENTANAS MODALES (`<Dialog>`)**:
  - **Queda estrictamente prohibido el uso del componente `<Dialog>` de Material UI en toda la aplicación Noxia.** Los modales centrados flotantes interrumpen el flujo visual del operador, tapan la información de fondo y degradan la experiencia móvil.
  - **Componente Canónico Único y Obligatorio**: [`ResponsiveFormDrawer`](file:///d:/projects/security-crm-frontend/src/components/common/ResponsiveFormDrawer.tsx).
- **Comportamiento Táctico**:
  - **Desktop (`md+`)**: Se abre un **Cajón Lateral Derecho (Right Drawer)** con ancho predeterminado de `560px` a `720px` según la densidad de los campos, permitiendo consultar los datos de la pantalla subyacente.
  - **Mobile (`xs/sm`)**: Se conmuta automáticamente a un **Bottom Sheet gestual** (`anchor="bottom"`) con `borderRadius: 20px` superior, agarrador táctil (*drag handle*) y botones de acción accesibles con una sola mano.
- **Reglas del Formulario**:
  - Barra de pie fija (`position: sticky`, `bottom: 0`, con fondo blanco puro y separador superior nítido).
  - Botón `"Cancelar"` en texto neutral y botón `"Guardar"` en `contained` violeta con spinner integrado (`CircularProgress` de 16px) cuando `isSubmitting` esté activo.
  - En asignaciones duales (Master-Detail): Panel izquierdo con lista filtrable y panel derecho con matriz interactiva de chips de vinculación activa/inactiva.
  - En generación documental y acuerdos jurídicos (Otrosíes, ANS, Minutas): Integración mandatoria de la **Herramienta de Edición de Texto Enriquecido (Rich Text Editor)** para redacción, personalización e interpolación dinámica de cláusulas.

---

## 4. Aspectos Funcionales y de Usabilidad

### F. Micro-interacciones y Controles de Formulario
1. **Validación Declarativa**: Formularios gestionados mediante `react-hook-form` + esquemas de validación tipados en `zod`.
2. **Autocompletes Inteligentes**:
   - Componentes canónicos: [`ClientAutocomplete`](file:///d:/projects/security-crm-frontend/src/components/common/ClientAutocomplete.tsx), [`EmployeeAutocomplete`](file:///d:/projects/security-crm-frontend/src/components/common/EmployeeAutocomplete.tsx), [`ResidentAutocomplete`](file:///d:/projects/security-crm-frontend/src/components/common/ResidentAutocomplete.tsx), [`UnitAutocomplete`](file:///d:/projects/security-crm-frontend/src/components/common/UnitAutocomplete.tsx).
   - Debounce automático de 300ms, búsqueda remota por API y soporte para chips visuales de cliente/rol.
3. **Grabador de Notas de Voz**: [`AudioVoiceNoteRecorder`](file:///d:/projects/security-crm-frontend/src/components/common/AudioVoiceNoteRecorder.tsx) con canvas en vivo de onda senoidal, tiempo de grabación y compresión en formato web audio.
4. **Captura y Adjuntos Multimedia**: [`MultiMediaEvidencePicker`](file:///d:/projects/security-crm-frontend/src/components/common/MultiMediaEvidencePicker.tsx) con soporte para arrastrar y soltar, previsualización instantánea en modal y subida asíncrona segura mediante *Presigned URLs*.
5. **Copia Rápida con Feedback**: Códigos de radicado y documentos con botón de copiado rápido y tooltip reactivo (`"¡Copiado al portapapeles!"`).

### G. Densidad Visual y Formato de Datos
1. **Formateadores Obligatorios**: Todo dato numérico o temporal debe procesarse a través de [`src/lib/formatters.ts`](file:///d:/projects/security-crm-frontend/src/lib/formatters.ts):
   - `formatDate(date)`: Formato estándar `DD/MM/YYYY`.
   - `formatTime(date)`: Formato estándar `hh:mm A`.
   - `formatDateTime(date)`: Formato completo `DD/MM/YYYY hh:mm A`.
   - `formatDocument(doc, type)`: Nomenclatura oficial con puntos de miles (`1.018.234.567`).
2. **Chips Semánticos Canónicos**:
   - [`PqrsStatusChip`](file:///d:/projects/security-crm-frontend/src/components/pqrs/PqrsStatusChip.tsx) para estados del ciclo de vida.
   - [`PqrsPriorityChip`](file:///d:/projects/security-crm-frontend/src/components/pqrs/PqrsPriorityChip.tsx) con estrellas o puntos de severidad (1 a 5).
   - Chips de estado de cuenta digital (3 estados: *Acceso Activo*, *Acceso Suspendido*, *Sin Cuenta Digital*).

### H. Control de Acceso Visual (RBAC en Frontend)
1. **Uso de Permisos Finos sobre Roles Fijos**: Se debe verificar siempre la existencia del permiso exacto (`session.user.permissions.includes('client:update_operations')`) en lugar de verificar nombres quemados de rol.
2. **Ocultamiento vs. Deshabilitación Pedagógica**:
   - Si el usuario carece de permiso para ver una sección o tab, el elemento **no se renderiza**.
   - Si el usuario puede ver la información pero no tiene permiso para editarla, el botón de acción se muestra **deshabilitado (`disabled`) con un `Tooltip`** que informa el permiso requerido (ej. *"Requiere permiso: resident:delete"*).
3. **Aislamiento Multi-Tenant**: Los usuarios con tipo `RESIDENCE_MANAGER` no deben ver selectores de cliente; el sistema inyecta y bloquea visualmente su `clientId` asignado.

### I. Estados de Carga, Error y Vacío (Feedback States)
1. **Skeletons Anatómicos**: Toda vista con carga asíncrona debe mostrar esqueletos animados que imiten la estructura real de tarjetas y tablas, previniendo el salto visual de contenido (*Cumulative Layout Shift*).
2. **Empty States Ilustrativos**: Si una consulta no devuelve registros, mostrar contenedor centrado con icono temático tenue en `#A78BFA`, título claro (`"No se encontraron minutas"`) y botón primario de acción si el usuario posee permiso de creación.
3. **Notificaciones Globales (Toasts)**: Todo resultado de mutación asíncrona despachará alertas mediante [`useNotification()`](file:///d:/projects/security-crm-frontend/src/providers/NotificationProvider.tsx) (`showSuccess`, `showError`, `showWarning`).
4. **Protección Anti-Doble Submit**: Todo botón de envío debe quedar inhabilitado durante el proceso (`disabled={isSubmitting}`) y desplegar un spinner circular integrado.

---

## 5. Reglas Normativas de Desarrollo (Do's & Don'ts)

| Área | ✅ LO QUE SE DEBE HACER (DO) | ❌ LO QUE ESTÁ PROHIBIDO (DON'T) |
| :--- | :--- | :--- |
| **Colores** | Utilizar siempre los tokens semánticos del tema (`theme.palette.primary.main`, `color="primary"`, etc.). | Quemar colores hexadecimales ad-hoc (`#1a237e`, `#000`, `blue`) directamente en estilos locales. |
| **Tipografía** | Usar las variantes de `Typography` (`h4`, `subtitle1`, `body2`) con los pesos definidos en el tema. | Aplicar `style={{ fontSize: '13px', fontWeight: 'bold' }}` de forma inline o arbitraria. |
| **Botones** | Usar botones con texto en capitalización estándar (`textTransform: "none"`). | Usar mayúsculas sostenidas tipo `"GUARDAR DATOS"` o `"CANCELAR"`. |
| **Formularios Densos** | Utilizar [`ResponsiveFormDrawer`](file:///d:/projects/security-crm-frontend/src/components/common/ResponsiveFormDrawer.tsx) con botones fijados al pie. | Abrir cuadros `Dialog` pequeños con barras de scroll dobles que desbordan la pantalla en móviles. |
| **Listados** | Utilizar [`ResponsiveDataView`](file:///d:/projects/security-crm-frontend/src/components/common/ResponsiveDataView.tsx) para listados de entidades principales. | Renderizar tablas HTML simples sin paginación ni soporte táctil móvil. |
| **Iconografía** | Utilizar exclusivamente iconos SVG de `@mui/icons-material`. | Usar emojis como iconos de interfaz (ej. 📝, 🚗, 👮‍♂️, ❌). |
| **Permisos** | Evaluar permisos mediante `permissions.includes(...)` o helpers de contexto. | Evaluar si `user.role === 'ADMIN'` o quemar lógica de negocio en el componente. |
| **Fechas** | Formatear siempre con `formatDate` o `formatDateTime` de `lib/formatters.ts`. | Mostrar fechas crudas ISO (`2026-10-20T14:32:00.000Z`) o usar `.toLocaleDateString()` sin zona horaria. |

---

## 6. Catálogo de Componentes Canónicos Noxia

| Necesidad UI | Componente Canónico Obligatorio | Ubicación en Código |
| :--- | :--- | :--- |
| Listado Universal Responsivo | `<ResponsiveDataView />` | [`src/components/common/ResponsiveDataView.tsx`](file:///d:/projects/security-crm-frontend/src/components/common/ResponsiveDataView.tsx) |
| Tarjeta Móvil Universal | `<UniversalMobileCard />` | [`src/components/common/UniversalMobileCard.tsx`](file:///d:/projects/security-crm-frontend/src/components/common/UniversalMobileCard.tsx) |
| Cajón de Detalle Rápido | `<ResponsiveDetailWrapper />` | [`src/components/common/ResponsiveDetailWrapper.tsx`](file:///d:/projects/security-crm-frontend/src/components/common/ResponsiveDetailWrapper.tsx) |
| Cajón de Formulario Responsivo | `<ResponsiveFormDrawer />` | [`src/components/common/ResponsiveFormDrawer.tsx`](file:///d:/projects/security-crm-frontend/src/components/common/ResponsiveFormDrawer.tsx) |
| Confirmación Crítica con Doble Factor | `<PromptConfirmDialog />` | [`src/components/common/PromptConfirmDialog.tsx`](file:///d:/projects/security-crm-frontend/src/components/common/PromptConfirmDialog.tsx) |
| Selector Multimedia & Evidencias | `<MultiMediaEvidencePicker />` | [`src/components/common/MultiMediaEvidencePicker.tsx`](file:///d:/projects/security-crm-frontend/src/components/common/MultiMediaEvidencePicker.tsx) |
| Grabación de Nota de Voz | `<AudioVoiceNoteRecorder />` | [`src/components/common/AudioVoiceNoteRecorder.tsx`](file:///d:/projects/security-crm-frontend/src/components/common/AudioVoiceNoteRecorder.tsx) |
| Asistente por Pasos (Wizard) | `<WizardStepper />` | [`src/components/common/WizardStepper.tsx`](file:///d:/projects/security-crm-frontend/src/components/common/WizardStepper.tsx) |
| Chip de Estado de PQRS | `<PqrsStatusChip />` | [`src/components/pqrs/PqrsStatusChip.tsx`](file:///d:/projects/security-crm-frontend/src/components/pqrs/PqrsStatusChip.tsx) |
| Chip de Prioridad & Severidad | `<PqrsPriorityChip />` | [`src/components/pqrs/PqrsPriorityChip.tsx`](file:///d:/projects/security-crm-frontend/src/components/pqrs/PqrsPriorityChip.tsx) |
