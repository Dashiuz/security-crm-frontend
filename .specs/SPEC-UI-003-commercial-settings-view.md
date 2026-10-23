# SPEC-UI-003: Vista de Catálogo y Configuraciones Comerciales (Arquetipo E: Master-Detail Settings)

> **Estado**: `APROBADO`
> **Módulo**: `commercial`
> **Ubicación Frontend**: `src/app/(protected)/commercial/settings/`
> **Registro de Navegación**: `src/config/navigationRegistry.ts` (`id: "com-settings"`)
> **Backend Asociado**: `SPEC-ADM-018` (`/api/v1/commercial/settings`)
> **Fecha de Creación**: 2026-10-22
> **Autor**: Antigravity (Principal Software Architect & Lead UI/UX Engineer)
> **Sistema de Diseño**: *Deep Violet Tactical Enterprise* (`noxiaTheme.ts`)

---

## 1. Contexto y Propósito de la Interfaz

La vista `/commercial/settings` (**"Catálogo y Configuración"**) centraliza el gobierno del motor de precios de la empresa de seguridad, la parametrización salarial de guardias, los topes de negociación comercial y la identidad de marca (*Brand Skin*) para la exportación de documentos oficiales.

### Objetivos de UX

1. **Erradicar la Fricción del Excel**: Reemplazar más de 40 hojas frágiles con una experiencia fluida de **Master-Detail Settings (Arquetipo E)**.
2. **Inmediatez Visual (Simulador en Vivo)**: Proporcionar un widget de simulación matemática flotante que permita al Director Comercial validar cálculos de ley antes y después de cambios de jornada sin recargar la pantalla.
3. **Persistencia Granular**: Cada pestaña o tarjeta guarda cambios de forma atómica (mediante `PATCH` específico) con feedback visual inmediato (toasts y estados `isSaving`), evitando formularios monolíticos propensos a pérdidas de datos.
4. **Diseño Táctico y Responsivo**: Experiencia de escritorio densa y altamente productiva (tabla densa, menús contextuales) adaptada limpiamente a dispositivos móviles mediante acordeones y drawers interactivos (`<ResponsiveFormDrawer/>`).

---

## 2. Arquitectura de Navegación y Segundo Riel

### 2.1 Activación en `src/config/navigationRegistry.ts`

En la dirección estratégica `commercial` (orden #3 en el primer riel), se activa el ítem #5 del submenú:

```typescript
{
  id: "com-settings",
  title: "Catálogo y Configuración",
  description: "Motor tarifario SVSP, catálogo de servicios, salarios y plantillas",
  status: "ACTIVE",
  path: "/commercial/settings",
  iconName: "TuneOutlined",
  permissions: ["commercial:settings:read", "commercial:settings:manage"],
  features: ["commercial"],
}
```

---

## 3. Estructura de Componentes y Directorios

```text
src/app/(protected)/commercial/settings/
├── page.tsx                           # Master-Detail Container (Tabs verticales / Acordeón)
├── layout.tsx                         # Header con breadcrumb y estado de permisos
├── hooks/
│   ├── useCommercialSettings.ts       # Hook SWR/React-Query para datos del tenant
│   └── useTariffSimulation.ts         # Hook para cálculo matemático reactivo
└── components/
    ├── tabs/
    │   ├── TariffPeriodsTab.tsx       # Tab 1: Vigencias SVSP + Widget Simulador
    │   ├── ServiceCatalogTab.tsx      # Tab 2: Catálogo con <ResponsiveDataView/>
    │   ├── SalaryMatrixTab.tsx        # Tab 3: Matriz de Salarios por Cargo/Turno
    │   ├── ValueAddedTab.tsx          # Tab 4: Topes de Reinversión y Catálogo VAG
    │   ├── DocumentSkinTab.tsx        # Tab 5: Identidad Camaleón y Snippets Dinámicos
    │   └── DistributionMatrixTab.tsx  # Tab 6: 9 Áreas y Matriz de Correos
    ├── drawers/
    │   ├── TariffPeriodDrawer.tsx     # Creación/Edición de Vigencia con validación
    │   ├── ServiceCatalogDrawer.tsx   # Alta/Modificación de Servicio
    │   ├── ValueAddedDrawer.tsx       # Alta de Bien en Especie / Dotación
    │   └── SnippetEditorDrawer.tsx    # Editor de plantilla con selector de variables
    └── widgets/
        └── LiveTariffSimulator.tsx    # Widget reactivo con desglose matemático completo
```

---

## 4. Especificación Detallada de Pantallas y Comportamiento

### 4.1 Layout Master-Detail (Arquetipo E)

* **Desktop (`md+`)**:
  * Barra Lateral de Navegación (260px fija):
    * `<Tabs orientation="vertical">` con fondos sutiles en `primary.main` al 8% de opacidad y borde derecho activo de 3px (`#7C3AED`).
    * Iconos de pestaña:
      1. `CalendarMonthOutlined` $\rightarrow$ **Vigencias y Tarifas SVSP**
      2. `ShieldOutlined` $\rightarrow$ **Catálogo de Servicios**
      3. `BadgeOutlined` $\rightarrow$ **Matriz Salarial y Turnos**
      4. `CardGiftcardOutlined` $\rightarrow$ **Valores Agregados y Topes**
      5. `PaletteOutlined` $\rightarrow$ **Plantillas e Identidad Empresarial**
      6. `SendTimeExtensionOutlined` $\rightarrow$ **Distribución a 9 Áreas**
* **Mobile (`xs/sm`)**:
  * Encabezado con selector desplegable estilizado o acordeones `<Accordion>` con elevación táctica y transiciones fluidas.

---

### 4.2 Detalle de Cada Pestaña

#### Tab 1: Vigencias y Tarifas SVSP (`TariffPeriodsTab.tsx`)

* **Listado de Tramos Anuales**:
  * Tarjetas de vigencia con chip `ACTIVA` (`#10B981`) o `HISTÓRICA` (`#64748B`).
  * Indicador de jornada semanal (ej. `46 Horas` o `44 Horas`), fechas de inicio/fin y SMMLV formateado en moneda local.
  * Botón `+ Nueva Vigencia`: Abre `TariffPeriodDrawer.tsx`.
* **Widget Flotante `LiveTariffSimulator.tsx`**:
  * Selectores reactivos: Sector (Comercial, Residencial E4-6, Residencial E1-3), Modalidad de Arma (Sin Arma, Con Arma, Canino), Turno (24h, 12h Diurno, 12h Nocturno) y Días (30, 26, 24, 20).
  * Tarjeta de desglose instantáneo:
    * Costo Directo Mensual
    * Valor A&S (8%, 10%, 11%)
    * Subtotal antes de Impuestos
    * Base Gravable AIU (10%)
    * IVA sobre AIU (19%)
    * **Total Factura con IVA** (resaltado con tipografía JetBrains Mono en `#7C3AED`)

#### Tab 2: Catálogo de Servicios de Vigilancia (`ServiceCatalogTab.tsx`)

* Implementa `<ResponsiveDataView/>`:
  * Tabla densa con cabecera fija, ordenamiento y buscador por código (`COD`) o nombre de servicio.
  * Columnas: Código, Descripción, Cargo, Sector, Arma, Turno, Días/Mes, % A&S y Estado.
  * Menú kebab de acciones (`GridActionsCellItem showInMenu={true}`) para editar o desactivar.
  * Modo móvil: Tarjetas tácticas virtualizadas con `<UniversalMobileCard/>`.

#### Tab 3: Matriz Salarial y Esquemas de Turno (`SalaryMatrixTab.tsx`)

* **Bloque Superior de Referencia Salarial Oficial (SuperVigilancia 2026)**:
  * Tarjeta estilo banner con icono `InfoOutlined` y título: **"REFERENCIA SALARIAL 2026"**.
  * Métricas destacadas: `SMMLV: $ 1.750.905` | `Aux. Transporte: $ 249.095` | `Total Mínimo Devengado: $ 2.000.000`.
* **Grilla Táctica de Valores por Hora Trabajada (8 Tarjetas)**:
  1. `Ord. Diurna (Valor Base)`: `$ 7.959` (Contorno Ámbar suave, factor 1.0)
  2. `Ord. Nocturna`: `$ 10.744` *(Valor Base + Recargo 35%: $ 2.785)* (Contorno Azul suave)
  3. `Extra Diurna`: `$ 9.948` *(Valor Base + Recargo 25%: $ 1.989)* (Contorno Naranja)
  4. `Extra Nocturna`: `$ 13.927` *(Valor Base + Recargo 75%: $ 5.968)* (Contorno Azul oscuro)
  5. `Dom/Fest Ord. Diur`: `$ 14.325` *(Valor Base + Recargo 80%: $ 6.366)* (Contorno Rojo suave)
  6. `Dom/Fest Ord. Noct`: `$ 17.111` *(Valor Base + Recargo 115%: $ 9.152)* (Contorno Violeta)
  7. `Dom/Fest Extra D.`: `$ 16.315` *(Valor Base + Recargo 105%: $ 8.356)* (Contorno Rojo intenso)
  8. `Dom/Fest Extra N.`: `$ 20.294` *(Valor Base + Recargo 155%: $ 12.335)* (Contorno Violeta oscuro)
* **Badges de Regla Operativa y Deducciones**:
  * Chip de composición de turno: `[ 8h ord. ] + [ 4h ext. ] = 12h/turno`.
  * Chips de deducción de nómina: `Salud 4.0%` y `Pensión 4.0%` (aplicadas sobre base salarial sin auxilio de transporte).
* **Tabla Interactiva por Cargo Operativo**:
  * Gestión de nómina de referencia por cargo (Guarda Portero, Supervisor Motorizado, OMT, Recepcionista).
  * Columnas: Total Devengado, Deducción Salud (4%), Deducción Pensión (4%), Bonificación, Rodamiento y **Sueldo Neto Libre a Retirar**.
* Celdas numéricas con máscara de moneda (`COP`).
* Botón de guardado masivo con estado de carga y confirmación de éxito.

#### Tab 4: Valores Agregados y Topes de Reinversión (`ValueAddedTab.tsx`)

* **Bloque de Topes Financieros**:
  * `<Slider>` interactivo y `<TextField>` numérico para fijar:
    * Tope a 1 año: `80%` (configurable del 0% al 150% de la primera factura).
    * Tope a 2 años: `160%` (configurable del 0% al 300%).
  * Interruptor `<Switch>`: *Permitir excepciones comerciales bajo aprobación de Gerencia General*.
* **Catálogo de Bienes en Especie**:
  * Lista de elementos (lockers, microondas, apoyos de guardia de 12h, cámaras) con su costo de referencia interno para el P&L.

#### Tab 5: Plantillas e Identidad Empresarial de Texto (`DocumentSkinTab.tsx`)

* **Piel Institucional (Brand Skin)**:
  * Selectores de color corporativo primario y secundario con previsualización en miniatura del encabezado de página.
  * Cargador de archivos con arrastrar y soltar para:
    * Logotipo Principal (procesado a WebP optimizado).
    * Firma digitalizada transparente del Director Comercial y Representante Legal.
  * Formulario con resoluciones de la SuperVigilancia (Licencia SVSP, MinTIC, Uniformes, Horas Extras, porcentaje SG-SST).
* **Editor de Cláusulas y Plantillas Dinámicas**:
  * Selector de plantilla (Carta de Presentación Residencial, Comercial, Licitación).
  * Editor de texto enriquecido/textarea con botones de inserción rápida de variables:
    * `{{nombre_cliente}}`, `{{nit_cliente}}`, `{{representante_legal}}`, `{{validez_oferta}}`, `{{monto_poliza_hurto}}`.

#### Tab 6: Matriz de Distribución a 9 Áreas (`DistributionMatrixTab.tsx`)

* Tarjetas para cada una de las 9 dependencias internas:
  `CONTRATOS`, `OPERACIONES`, `ALMACÉN`, `CENTRAL DE MONITOREO`, `RECEPCIÓN`, `RRHH`, `CALIDAD`, `CONTABILIDAD`, `TESORERÍA`.
* Cada fila contiene:
  * Badge del departamento con color táctico distintivo.
  * Input de nombre del funcionario responsable.
  * Input validado de correo electrónico institucional.
  * `<Switch color="primary">` para activar o pausar el despacho de la notificación automática.

---

## 5. Criterios de Aceptación UI/UX

1. **Tokens de Color y Jerarquía**:
   * Cumplimiento estricto de la paleta *Deep Violet Tactical Enterprise* (`#7C3AED` primario, `#1E1B4B` sidebar/dark, `#0F172A` background default).
   * Cero uso de colores genéricos o estilos ad-hoc fuera de `noxiaTheme.ts`.
2. **Virtualización y Rendimiento**:
   * Carga fluida del catálogo de servicios sin demoras perceptibles utilizando virtualización de lista.
   * Debounce de 300 ms en inputs de búsqueda y cálculo reactivo en el simulador.
3. **Manejo de Errores y Estados Vacíos**:
   * Estados `EmptyState` elegantes cuando no existan tramos tarifarios o elementos de catálogo configurados.
   * Mensajes de error claros provenientes de las respuestas HTTP (ej. conflictos `P2002` o validaciones de DTO).
4. **Validación de Compilación**:
   * Cero errores en `npx tsc --noEmit` y `npm run lint`.
   * El bundle de producción compila limpiamente sin advertencias de dependencias cíclicas.
