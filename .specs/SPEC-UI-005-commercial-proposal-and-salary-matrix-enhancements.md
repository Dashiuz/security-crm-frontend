# `SPEC-UI-005`: Optimización Integral de Propuestas Comerciales, Matriz Salarial Operativa y Validación Tarifaria SVSP

> **Estado**: `PROPUESTA TÉCNICA / LISTO PARA IMPLEMENTACIÓN`  
> **Módulos Afectados**:  
> - Frontend: `commercial/proposals` (Workspace Split-Screen), `commercial/settings` (Pestañas: *Vigencias y Tarifas SVSP*, *Matriz Salarial y Turnos*)  
> - Backend: `modules/commercial/settings`, `modules/commercial/proposals`  
> **Especificación Frontend**: `SPEC-UI-005-commercial-proposal-and-salary-matrix-enhancements.md`  
> **Especificación Backend**: [`SPEC-ADM-023`](file:///d:/projects/security-crm-backend/.specs/03-administrative/SPEC-ADM-023-commercial-settings-and-proposal-matrix-enhancements.md)  
> **Fecha**: 2026-10-25  

---

## 1. Resumen Ejecutivo y Objetivos

Esta especificación aborda la sincronización completa entre los módulos de **Configuración Comercial** y el **Creador de Propuestas Económicas**. El objetivo es eliminar la digitación manual y propensa a errores, dotar a la matriz salarial de flexibilidad total (creación, edición, eliminación y turnos dinámicos) y solucionar definitivamente los fallos de validación numérica (`ValidationPipe`) al guardar vigencias tarifarias y matrices de salarios.

---

## 2. Requerimientos Funcionales y Técnicos Detallados

### Item 1: Auto-completar desde el Catálogo de Servicios en Propuestas
* **Ubicación**: [SplitScreenProposalWorkspace.tsx](file:///d:/projects/security-crm-frontend/src/app/(protected)/commercial/proposals/components/SplitScreenProposalWorkspace.tsx) - Sección 2 (*Estructura Económica y Puestos de Vigilancia*).
* **Comportamiento**:
  * Modificar el botón `+ Agregar Puesto` para que ofrezca un selector o menú:
    1. *"Seleccionar del Catálogo de Servicios"* (Despliega modal o popover con los servicios activos de `CommercialSettingsApi.getServiceCatalog()`).
    2. *"Puesto Personalizado / Manual"*.
  * Al seleccionar un servicio (ej. *"Vigilancia Fija Armada 24h"*):
    * Autocompleta `positionTitle` con el nombre del servicio.
    * Autocompleta `scheduleType` con el turno sugerido configurado en el catálogo.
    * Autocompleta `weaponModality` con la modalidad asignada (Arma Letal, No Letal, Sin Arma).
    * Autocompleta `tariffCategory` con el sector económico del cliente o del servicio.
    * Consulta la tarifa oficial de venta de la vigencia activa y calcula el `unitMonthlyBilledPrice`.

---

### Item 2: Auto-vincular Costo Laboral de la Matriz Salarial
* **Ubicación**: [SplitScreenProposalWorkspace.tsx](file:///d:/projects/security-crm-frontend/src/app/(protected)/commercial/proposals/components/SplitScreenProposalWorkspace.tsx) - Sección 2.
* **Comportamiento**:
  * Cuando el usuario selecciona o cambia el `scheduleType` (ej. `Turno 2x2x2`) o el `positionTitle`:
    * El sistema busca en la `salaryMatrix` cargada si existe una coincidencia exacta de `[positionTitle, scheduleType]`, o por defecto la coincidencia por `scheduleType`.
    * Autocompleta el campo `unitMonthlyRealCost` con el costo nómina total calculado en la matriz salarial vigente.
    * Muestra un indicador visual bajo el campo: `"✓ Costo vinculado a Matriz Salarial Vigente ($11.400.000 COP)"`.
    * El usuario conserva la facultad de sobreescribir el valor si el contrato tiene condiciones especiales de negociación.

---

### Item 3: Firmantes Flexibles y Ad-Hoc en Sección 7
* **Ubicación**: [SplitScreenProposalWorkspace.tsx](file:///d:/projects/security-crm-frontend/src/app/(protected)/commercial/proposals/components/SplitScreenProposalWorkspace.tsx) - Sección 7 (*Firmantes Autorizados en el Documento*).
* **Comportamiento**:
  * Mantener las tarjetas de los firmantes institucionales preconfigurados con sus toggles de *Incluido / Omitir*.
  * Añadir un botón `+ Agregar Firmante Ad-hoc / Especial`.
  * Desplegar un modal o formulario compacto para ingresar:
    * `fullName`: Nombre del firmante (obligatorio).
    * `jobTitle`: Cargo específico para la propuesta (obligatorio).
    * `documentNumber`: Cédula / Documento de identidad (opcional).
  * Los firmantes ad-hoc se integran en el estado `adHocSigners`, se persisten en `draftSnapshotJson.adHocSigners` al guardar la propuesta y se inyectan en el bloque de firmas de la previsualización PDF / A4.

---

### Item 4: Botón `+ Agregar Cargo Operativo` en Matriz Salarial
* **Ubicación**: [SalaryMatrixTab.tsx](file:///d:/projects/security-crm-frontend/src/app/(protected)/commercial/settings/components/tabs/SalaryMatrixTab.tsx) - Sección inferior (*Matriz Salarial por Cargo Operativo*).
* **Comportamiento**:
  * Añadir un botón primario `+ Nuevo Cargo Operativo` junto a `Guardar Matriz Salarial`.
  * Al hacer clic, se añade una nueva fila al estado `positions` (o abre un drawer compacto):
    * Permite tipear cualquier nombre de cargo (ej. *Guarda Canino*, *Escolta VIP*, *Operador de Dron*, *Manejador Canino*, *Coordinador de Puesto*).
    * Permite seleccionar el turno inicial (por defecto `SCHEDULE_2X2X2`).
    * Inicializa automáticamente el sueldo base con el SMMLV de la vigencia activa y calcula las deducciones legales.

---

### Item 5: Selector de Turno Dinámico en Cada Fila de la Matriz Salarial
* **Ubicación**: [SalaryMatrixTab.tsx](file:///d:/projects/security-crm-frontend/src/app/(protected)/commercial/settings/components/tabs/SalaryMatrixTab.tsx).
* **Comportamiento**:
  * Convertir la etiqueta de turno estática en un selector `Select` de Material-UI por fila.
  * Opciones disponibles:
    * `SCHEDULE_2X2X2` (Turno 2x2x2 - 24 Horas Rotativo) ➔ Factor: **3.0 guardas**
    * `SCHEDULE_3X3X2` (Turno 3x3x2 - 24 Horas Relevos) ➔ Factor: **2.8 guardas**
    * `SCHEDULE_4X4X2` (Turno 4x4x2 - 24 Horas Extendido) ➔ Factor: **3.0 guardas**
    * `SCHEDULE_5X1` (Turno 5x1 - 12 Horas Lunes a Viernes) ➔ Factor: **1.2 guardas**
    * `SCHEDULE_5X2` (Turno 5x2 - 12 Horas Hábil) ➔ Factor: **1.0 guarda**
  * Al cambiar el turno, se actualiza automáticamente el campo `guardsRequiredPerPost` y se recalculan las horas ordinarias y extras sugeridas.

---

### Item 6: Cálculo Automático Inteligente de Horas Extras según el Turno
* **Ubicación**: [SalaryMatrixTab.tsx](file:///d:/projects/security-crm-frontend/src/app/(protected)/commercial/settings/components/tabs/SalaryMatrixTab.tsx).
* **Lógica Matemática**:
  * El sistema analiza la jornada del turno:
    * Turnos de 12 horas: 8 horas ordinarias + 4 horas extras por turno.
    * Se cruzan las horas estimadas con los valores de la tabla oficial superior de 8 tipologías:
      * Horas nocturnas con recargo del +35%.
      * Horas extras diurnas con recargo del +25%.
      * Horas extras nocturnas con recargo del +75%.
      * Domingos y festivos (+80% y +115%).
  * Se genera el valor sugerido de `estimatedOvertimePay`.
  * Se incorpora un botón de varita mágica o recalculado automático: *"Calcular según tarifas oficiales"*.

---

### Item 7: Vincular Simulación con Vigencias SVSP y Corrección de Validación de DTOs
* **Ubicación**:
  * Frontend: [TariffPeriodsTab.tsx](file:///d:/projects/security-crm-frontend/src/app/(protected)/commercial/settings/components/tabs/TariffPeriodsTab.tsx), [TariffPeriodDrawer.tsx](file:///d:/projects/security-crm-frontend/src/app/(protected)/commercial/settings/components/drawers/TariffPeriodDrawer.tsx), [SalaryMatrixTab.tsx](file:///d:/projects/security-crm-frontend/src/app/(protected)/commercial/settings/components/tabs/SalaryMatrixTab.tsx).
  * Backend: [create-tariff-period.dto.ts](file:///d:/projects/security-crm-backend/src/modules/commercial/settings/dtos/create-tariff-period.dto.ts), [update-tariff-period.dto.ts](file:///d:/projects/security-crm-backend/src/modules/commercial/settings/dtos/update-tariff-period.dto.ts).
* **Diagnóstico del Error Reportado**:
  * Al editar o crear una vigencia tarifaria, el backend arrojaba:
    > `monthlyTransportAux must not be less than 0. monthlyTransportAux must be a number conforming to the specified constraints. commercialMultiplier must be a number conforming to the specified constraints. strata46Multiplier must be a number conforming to the specified constraints. strata13Multiplier must be a number conforming to the specified constraints`
  * **Causa**: Prisma entrega `Decimal` serializado como `string`. El formulario frontend enviaba los valores como `string`. En el backend, [create-tariff-period.dto.ts](file:///d:/projects/security-crm-backend/src/modules/commercial/settings/dtos/create-tariff-period.dto.ts) y [update-tariff-period.dto.ts](file:///d:/projects/security-crm-backend/src/modules/commercial/settings/dtos/update-tariff-period.dto.ts) tenían `@IsNumber()`, pero **ningún `@Type(() => Number)`**, haciendo que `class-validator` rechazara todos los campos.
* **Solución**:
  1. En backend: Decorar todas las propiedades numéricas con `@Type(() => Number)` en [create-tariff-period.dto.ts](file:///d:/projects/security-crm-backend/src/modules/commercial/settings/dtos/create-tariff-period.dto.ts):
     - `smmlv`, `monthlyTransportAux`, `dailyTransportAux`, `baseHourlyRate`, `dayProportionFactor`, `nightProportionFactor`, `commercialMultiplier`, `strata46Multiplier`, `strata13Multiplier`.
  2. En frontend: Asegurar que `TariffPeriodDrawer.tsx` convierta los inputs a `Number()` en el payload de envío.
  3. En `SalaryMatrixTab.tsx`: Reemplazar los valores estáticos quemados (`smmlv: 1750905...`) por una consulta basada en la vigencia activa (`activeTariffPeriod`), permitiendo consultar el histórico de años mediante selector.

---

### Item 8: Botón para Eliminar Cargo Operativo de la Matriz Salarial
* **Ubicación**: [SalaryMatrixTab.tsx](file:///d:/projects/security-crm-frontend/src/app/(protected)/commercial/settings/components/tabs/SalaryMatrixTab.tsx).
* **Comportamiento**:
  * Añadir una columna de acciones a la tabla con un botón de papelera (`DeleteIcon`) con tooltip *"Eliminar Cargo"*.
  * Si el cargo ya está persistido en la BD (tiene `id`), se ejecuta la eliminación mediante el endpoint existente `DELETE /commercial/settings/salary-matrix/:id`.
  * Si es una fila nueva no guardada, se remueve inmediatamente del estado local.
  * Muestra diálogo o toast de confirmación para evitar borrados accidentales.

---

## 3. Matriz de Cambios por Archivo

| Archivo | Capa | Acción | Descripción |
| :--- | :--- | :--- | :--- |
| `create-tariff-period.dto.ts` | Backend | Modificar | Agregar `@Type(() => Number)` en campos decimales/numéricos. |
| `TariffPeriodDrawer.tsx` | Frontend | Modificar | Sanitizar valores a `Number()` antes de enviar PUT/POST. |
| `SalaryMatrixTab.tsx` | Frontend | Refactorizar | Agregar botón nuevo cargo, selector de turnos, cálculo inteligente de extras, botón eliminar y enlace con vigencia activa. |
| `SplitScreenProposalWorkspace.tsx` | Frontend | Mejorar | Auto-completar desde catálogo de servicios, vincular costo de matriz salarial y añadir firmantes ad-hoc en sección 7. |

---

## 4. Plan de Pruebas y Validación

1. **Pruebas Unitarias Backend**:
   - Validar que `createTariffPeriod` y `updateTariffPeriod` acepten payloads tanto con números puros como con strings numéricos convertidos por `class-transformer`.
   - Ejecutar suite `npm test -- src/modules/commercial/settings` (cobertura $\ge 80\%$).
2. **Pruebas de Integración Frontend**:
   - Modificar una vigencia tarifaria en la Pestaña 1 y verificar que guarde sin errores de validación.
   - En la Pestaña 3, añadir un cargo *"Guarda Canino"* en turno `2x2x2`, guardar y validar persistencia.
   - En el Creador de Propuestas, pulsar `+ Agregar Puesto`, seleccionar un servicio del catálogo y comprobar que se precarguen turno, tarifa y costo laboral automáticamente.
   - Añadir un firmante ad-hoc en la Sección 7 y verificar que aparezca en la previsualización del documento.
