# SPEC-UI-007: Rediseño de Configuración Comercial, Vigencias SVSP y Matriz Salarial Libre de Scroll

> **Estado**: `IMPLEMENTADO / VERIFICADO`  
> **Módulos Frontend**: `src/app/(protected)/commercial/settings`, `src/app/(protected)/commercial/proposals`  
> **Especificación Backend Espejo**: [`SPEC-ADM-025`](file:///d:/projects/security-crm-backend/.specs/03-administrative/SPEC-ADM-025-commercial-tariff-calculation-refactor-and-variable-matrix.md)  
> **Código de Especificación**: `SPEC-UI-007-commercial-tariff-calculation-refactor-and-salary-matrix`  
> **Fecha de Creación**: `2026-10-27`  
> **Autor(es)**: `Antigravity Core Engineering`  

---

## 1. Alcance Visual y Experiencia de Usuario (UX/UI)

### 1.1 Objetivo
Resolver la rigidez y las fallas de cálculo identificadas en los módulos de configuración tarifaria y propuestas comerciales mediante:
1. **Control Total de Multiplicadores y Días de Pronto Pago**: Permitir la edición fluida del multiplicador para estratos 4, 5 y 6 (`strata46Multiplier: 9.77`) y la configuración de los días calendario que conceden el descuento por pronto pago (`promptPaymentDays`).
2. **Modal de Confirmación Regulatoria SVSP**: Dialog / Modal especializado que solicita confirmación cuando el usuario configure o liquide un servicio con parámetros por debajo o fuera del piso legal oficial.
3. **Erradicación del Scroll Horizontal en la Matriz Salarial**: Reemplazar la tabla comprimida por una cuadrícula de **Tarjetas Bento Modulares por Cargo Operativo**, que exponen con claridad el Sueldo Neto a pagar al Guarda y el Costo Real por Puesto para el análisis de Ganancias y Pérdidas (G&P).
4. **Desglose Matemático Interactivo (Breadcrumb)**: Mostrar la traza exacta de cálculo en el simulador en vivo (`LiveTariffSimulator.tsx`) coincidente con la metodología del manual de tarifas de la SuperVigilancia.

---

## 2. Componentes Frontend Afectados y Nuevos Elementos

### 2.1 Simulador Tarifario (`LiveTariffSimulator.tsx`)
- Selector rápido de sector enriquecido:
  - `Comercial y Público (8.80 SMMLV)`
  - `Residencial Estratos 4, 5 y 6 (9.77 SMMLV)`
  - `Residencial Estratos 1, 2 y 3 (Libre - Ref: 7.00 SMMLV)`
- Campo numérico interactivo: `Multiplicador Personalizado (SMMLV)` con step `0.01` para probar cualquier escenario inmediatamente.
- Campo de pronto pago: `% Descuento` y `Días Pronto Pago (días calendario)`.
- Selector de franja horaria: `Moderno 2026 (13h día / 11h noche)` vs `Tradicional (15h día / 9h noche)`.
- Rastro matemático: Breadcrumb dinámico con tipografía `JetBrains Mono` mostrando:
  `[SMMLV] × Multiplicador = Base` $\rightarrow$ `+ A&S` $\rightarrow$ `Subtotal` $\rightarrow$ `AIU` $\rightarrow$ `IVA` $\rightarrow$ `Total Factura`.

### 2.2 Tab "Matriz Salarial y Turnos" (`SalaryMatrixTab.tsx`)
- **Banner Pedagógico Superior**: Conexión entre Sueldo del Guarda, Deducciones de Ley (-8%), Factor de Guardas (ej. 3.0) y Costo Operativo en el P&L / G&P.
- **Cuadrícula de Tarjetas Bento Modulares**:
  - Encabezado: Título editable, Selector de Esquema de Turno (`2x2x2`, `3x3x2`, `4x4x2`, `5x1`, `5x2`, etc.) y Chip con Factor de Guardas.
  - Bloque de Devengados: Sueldo Base, Aux. Transporte, Horas Extras/Recargos (con botón de recálculo inteligente según tarifas oficiales).
  - Bloque de Beneficios: Bono no salarial, Rodamiento.
  - Bloque de Deducciones: Salud ($-4\%$) y Pensión ($-4\%$).
  - Resumen Táctico Destacado:
    - 🏦 **Sueldo Neto Guarda** (lo que recibe en banco).
    - 💼 **Costo Nómina Puesto** (lo que cuesta el puesto a la empresa).
- **Acordeón de Recargos de Ley**: Visualización y edición asistida de las 8 tarifas horarias SVSP.

### 2.3 Modal Reutilizable de Confirmación Regulatoria (`RegulatoryExemptionDialog.tsx`)
- Renderiza un diálogo de advertencia estética corporativa (borde amarillo/ámbar, ícono de escudo de seguridad):
  - Título: *"Confirmación de Excepción Regulatoria SVSP"*
  - Detalle: Explica qué parámetro se desvía del piso oficial (ej. multiplicador < 8.8 o A&S < 10%).
  - Botones: *"Entiendo el Marco Legal y Aplico Excepción"* (Acción primaria) y *"Restablecer Piso Oficial"* (Secundaria).

### 2.4 Workspace de Propuestas (`CanvasProposalWorkspace.tsx`)
- Corrección de `calculateBilledPriceForService`:
  - Lee el sector del servicio y vincula el multiplicador correspondiente (`commercialMultiplier`, `strata46Multiplier = 9.77`, etc.) o el multiplicador ad-hoc del ítem.
  - Conecta el costo real con `grossSalary * guardsRequiredPerPost` de la matriz salarial.
  - Habilita la variable y token `{{propuesta_dias_pronto_pago}}`.

---

## 3. Criterios de Aceptación UI/UX

1. **Cero Scroll Horizontal**: En pantallas $\ge 1200\text{px}$ la Matriz Salarial no genera barra de desplazamiento horizontal.
2. **Fidelidad Numérica**: Todas las cifras monetarias formateadas con `Intl.NumberFormat('es-CO')` y fuente `JetBrains Mono`.
3. **Retroalimentación Visual**: Estados de carga instantáneos (`CircularProgress` de 16px) y debounces optimizados de 250ms para evitar parpadeos.
4. **Diseño Responsivo**: Adaptación fluida a tablets y móviles mediante el sistema de diseño NOXIA (Deep Violet palette, Plus Jakarta Sans).
