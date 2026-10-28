# SPEC-UI-006: Rediseño Integral de Cotizaciones Comerciales (Canvas Notion + Canva) y Universal Document Studio

> **Estado**: `PENDIENTE_DE_REVISION`  
> **Módulo**: `commercial / format-engine / signatures`  
> **Referencia Backend**: `SPEC-ADM-024`  
> **Directrices de Diseño**: `/better-ui`, `/impeccable`, `/ui-ux-pro-max`, `/vercel-react-best-practices`  
> **Autor(es)**: `Antigravity UI/UX Pro Max`  
> **Fecha de Creación**: `2026-10-26`  
> **Última Actualización**: `2026-10-26`  

---

## 1. Resumen Ejecutivo y Objetivos de Interfaz

Esta especificación formaliza la transición integral hacia una experiencia de **Lienzo Único en Blanco (Híbrido Notion + Canva)** para la generación de cotizaciones comerciales, sustituyendo y renombrando de forma permanente el componente `SplitScreenProposalWorkspace.tsx` por **`CanvasProposalWorkspace.tsx`**.

Bajo este nuevo estándar arquitectónico, el usuario redacta, formatea y estructura el documento directamente sobre una hoja A4 física virtualizada, apoyado por una barra delgada estilo sistema operativo, un ribbon de herramientas de creación rápida y un cajón lateral deslizante (`Drawer`) para parametrización de datos estructurados, sentando a su vez las bases para migrar el **Universal Document Studio** a su propia página dedicada en Next.js App Router.

### 1.1 Metas Clave de Experiencia de Usuario (UI/UX)
1. **Lienzo Único de Enfoque Total**: Documento en blanco centralizado donde la edición y la previsualización ocurren en el mismo espacio interactivo.
2. **Sustitución y Renombrado de Componente**:
   * Archivo original: `src/app/(protected)/commercial/proposals/components/SplitScreenProposalWorkspace.tsx`
   * **Nuevo archivo canónico**: `src/app/(protected)/commercial/proposals/components/CanvasProposalWorkspace.tsx`
   * Erradicación completa de cualquier lógica, propiedad o estilo asociado al patrón anterior de paneles divididos.
3. **Rutas Nativas en Next.js**: Migración desde modales flotantes a páginas completas del App Router (`/commercial/proposals/new` y `/commercial/proposals/[id]/edit`) que limpian la URL, soportan historial del navegador, restauran el ciclo de vida y erradican problemas de apilamiento y `z-index`.
4. **Barra Superior Estilo Sistema Operativo (OS Bar)**: Ventana delgada de 38px en `#0F172A` con menús desplegables (`Archivo`, `Destinatario`, `Puestos & Tarifas`, `Beneficios VAG`, `Firmantes`, `Ver`).
5. **Ribbon de Acciones Rápidas (48px)**: Centralización de herramientas (`[+ Texto]`, `[+ Cláusula]`, `[@ Variable Dinámica]`, `[Importar Formato]`, chips contextuales y botón primario de emisión).
6. **Cajas de Texto Notion-like**: Bloques editables en línea (`NotionProposalBlock`), sin bordes grises de formulario, con tipografía natural, canal izquierdo de control (`-56px`) con Drag & Drop nativo, y barra de formato flotante superior (`top: -38px`) que previene solapamientos visuales.
7. **Cabecera Ejecutiva Compacta**: Rediseño a un encabezado denso de 2 columnas (~75-80px de altura), reduciendo más del 70% del espacio vertical desperdiciado anteriormente.
8. **Calibración Dimensional A4 y Zoom Interactivo**: Estandarización del ancho imprimible a `794px` (210mm a 96 DPI) y selector de escala dinámico `[ 75% | 90% | 100% | Ajustar ]`.
9. **Transparencia en Valores Agregados (VAG)**: Tabla explícita de comodatos con valor de referencia tachado y facturación visible al cliente: **$ 0 COP (CORTESÍA / BONIFICADO)**.
10. **Bloque de Firmas Conmutable**: Oculto por defecto, conmutable mediante toggle `showSignatures` para no invadir el documento innecesariamente.
11. **Deshacer/Rehacer Global (`Ctrl+Z` / `Ctrl+Y`) y Respaldo Local**: Pila de historial memento a nivel de documento y borrador silencioso en `localStorage`.

---

## 2. Arquitectura de Rutas y Navegación en Next.js App Router

### 2.1 Desacoplamiento de Rutas Dedicadas (`vercel-react-best-practices`)
Para evitar el bundle bloat en el listado de cotizaciones y resolver colisiones de apilamiento:

* **Listado Principal**: `src/app/(protected)/commercial/proposals/page.tsx`
  * Carga ligera, sin TipTap ni motores de lienzo en el bundle inicial.
  * Botón `"Nueva Propuesta"` navega vía `Link` o `router.push('/commercial/proposals/new')`.
  * Fila de tabla: `[✎ Editar]` navega a `/commercial/proposals/[id]/edit`.
  * `[📄 Ver PDF]` abre modal ligero de visualización directa / impresión.
* **Creación de Cotización**: `src/app/(protected)/commercial/proposals/new/page.tsx`
  * Carga el entorno de trabajo `CanvasProposalWorkspace` en modo creación.
  * Inicializa folio correlativo sugerido y bloques base de minuta.
* **Edición de Cotización Existente**: `src/app/(protected)/commercial/proposals/[id]/edit/page.tsx`
  * Recibe `params.id`, consulta la propuesta vía `commercialProposalsApi.getProposalById(id)` e hidrata `CanvasProposalWorkspace`.

---

## 3. Especificación Detallada de Componentes de Interfaz

### 3.1 Barra Superior de Sistema Operativo (OS Bar - 38px)
* **Contenedor**: `height: 38px`, `background: #0F172A`, `color: #F8FAFC`, `px: 2`, `borderBottom: 1px solid rgba(255,255,255,0.08)`.
* **Menú Archivo**:
  * `Guardar y Emitir Cotización` (Ctrl + S)
  * `Importar Formato / Plantilla...`
  * `Vista Previa PDF Oficial`
  * `Deshacer (Ctrl + Z)` / `Rehacer (Ctrl + Y)`
  * `Cerrar Ventana (Salir al Módulo)`
* **Menú Destinatario**:
  * `Configurar Cliente o Prospecto...` (Abre Drawer en pestaña "client")
* **Menú Puestos & Tarifas**:
  * `Gestionar Puestos y Turnos...` (Abre Drawer en pestaña "positions")
  * `Catálogo Oficial SVSP...` (Abre Modal de Catálogo)
  * `+ Puesto Manual`
* **Menú Beneficios VAG**:
  * `Gestionar Valores Agregados...` (Abre Drawer en pestaña "vags")
  * `Catálogo Institucional VAG...` (Abre Modal VAG)
  * `+ Beneficio Manual`
* **Menú Firmantes**:
  * `Configurar Firmantes (Noxia Sign)...` (Abre Drawer en pestaña "signers")
  * `+ Firmante Ad-hoc...`
* **Menú Ver**:
  * Toggle: `Mostrar / Ocultar Bloque de Firmas`
  * Toggle: `Mostrar / Ocultar Valores Agregados (VAG)`
  * `Análisis Financiero P&L` (Abre Drawer en pestaña "pnl")
* **Lateral Derecho**:
  * Chip Semáforo P&L interactivo con margen neto (`Rentable` / `Ajustado` / `Déficit`).
  * Botón de cierre de ventana `✕` con retorno seguro a `/commercial/proposals`.

---

### 3.2 Ribbon de Acciones Rápidas (48px)
* **Contenedor**: `height: 48px`, `background: #FFFFFF`, `borderBottom: 1px solid #E2E8F0`, `px: 2.5`.
* **Herramientas de Inserción**:
  * `[+ Texto]`: Inserta bloque tipo párrafo estándar.
  * `[+ Cláusula]`: Inserta bloque con título ordinal autoincremental (`CLÁUSULA X: [Título]`).
  * `[@ Variable Dinámica]`: Despliega Popover clasificado (Cliente, Propuesta, Empresa, Imágenes S3) con buscador en vivo.
  * `[Importar Formato]`: Abre el modal `FormatSelectionModal` con catálogo de minutas institucionales.
* **Chips Indicadores de Estado (Disparadores de Drawer)**:
  * `[👤 {Nombre Cliente o "Seleccionar Destinatario"}]` (abre Drawer Destinatario).
  * `[🛡️ {N} Puestos SVSP]` (abre Drawer Puestos).
  * `[🎁 {N} Beneficios VAG]` (abre Drawer VAGs).
  * `[✍️ {N} Firmantes]` (abre Drawer Firmantes).
* **Acciones de Salida**:
  * `[Vista Previa]` (Modal PDF limpio sin hydration warnings).
  * `[Guardar y Emitir Cotización]` (Botón primario destacado, micro-animación `active:scale-96`, loading state).

---

### 3.3 El Lienzo Central en Blanco (Hoja A4)

* **Contenedor Workspace**: `background: #F1F5F9`, `overflowY: auto`, centrado horizontal.
* **Hoja A4**:
  * Ancho calibrado: `794px` (equivalente físico A4 a 96 DPI).
  * Márgenes interiores: `padding: 36px 44px`.
  * Elevación: `box-shadow: 0 10px 30px -4px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)`.
  * Borde y radio: `border-radius: 4px`, `border: 1px solid #E2E8F0`.

#### Estructura Secuencial de la Hoja:
1. **Cabecera Ejecutiva Compacta (~75-80px)**:
   * Columna Izquierda:
     * `PROPUESTA TÉCNICO-COMERCIAL` (8px overline, color índigo).
     * Señores: **`[Razón Social del Cliente o Prospecto]`** (bold, 1.05rem).
     * NIT: `[NIT]` • Sede: `[Ciudad]`.
   * Columna Derecha:
     * Folio correlativo: `Ref: PROP-2026-XXXX`.
     * Fecha de emisión: `[Ciudad, Día de Mes de Año]`.
     * Asunto: `Servicios Especializados de Vigilancia y Seguridad Privada`.
   * Botón hover: `[✎ Modificar Destinatario]` (abre Drawer Destinatario).
2. **Bloques Modulares Notion-like (`NotionProposalBlock`)**:
   * Sin bordes de formulario ni campos grises.
   * Canal de control izquierdo a `-56px`:
     * Tirador `⋮⋮` con eventos nativos HTML5 `draggable={true}`, `onDragStart`, `onDrop` e indicador visual de reordenamiento.
     * Botones de acción rápida: `▲` (subir), `▼` (bajar), `🗑` (eliminar).
   * Barra de formato flotante:
     * Ubicación: `position: absolute; top: -38px; left: 0px`.
     * Botones: Negrita, Cursiva, H2, H3, Viñetas, Lista Numerada, Alineación (Izq, Cen, Just), Separador.
     * Cero colisión con el título de la cláusula o con el tirador izquierdo.
   * Desplazamiento vertical natural sin scrollbars internos.
3. **Estructura Económica y Tarifas Mensuales SVSP**:
   * Encabezado de sección formal homologado.
   * Tabla con celdas compactas (`padding: 6px 8px`, `font-size: 0.8rem`):
     * Cargo / Puesto, Modalidad, Turno, Puestos, Tarifa Mes (COP).
   * Subtotal antes de impuestos.
   * IVA sobre AIU (19% sobre base AIU 10%).
   * Total Facturado con IVA en resaltado índigo.
   * Botón hover: `[✎ Editar Puestos y Turnos]`.
4. **Valores Agregados y Beneficios en Especie (VAG)**:
   * Tabla visible cuando `showVags === true`:
     * Beneficio / Comodato Institucional, Cantidad, Periodicidad, Valor de Referencia tachado (`~ $ X.XXX.XXX ~`), Facturado al Cliente: **$ 0 COP (BONIFICADO / CORTESÍA)** en verde esmeralda `#059669`.
   * Botón hover: `[✎ Editar Beneficios VAG]`.
5. **Bloque de Firmas Conmutable**:
   * Renderizado condicional: únicamente cuando `showSignatures === true && signers.length > 0`.
   * Tarjetas con firma digitalizada, nombre, cargo y cédula.
6. **Micro-Pie de Página Legal**:
   * Micro-texto de 10px en `#64748B`:
     * `NOXIA SEGURIDAD PRIVADA S.A.S. • NIT: 900.000.000-1 • Resolución SVSP No. 004921`
     * `Documento emitido bajo Ley 527 de 1999 • Firma Digital y Trazabilidad Forense • SHA-256: 7f8a9...b4c2`

---

### 3.4 Controlador de Escala / Zoom del Canvas
* Ubicación: Esquina inferior derecha fija o Ribbon superior.
* Botones de escala: `[ 75% | 90% | 100% | Ajustar a Pantalla ]`.
* Implementación:
  ```css
  .a4-paper-canvas {
    transform: scale(var(--zoom-factor));
    transform-origin: top center;
    transition: transform 150ms cubic-bezier(0.2, 0, 0, 1);
  }
  ```
* Resuelve el desbordamiento en monitores compactos manteniendo legibilidad al 100%.

---

### 3.5 Cajón Lateral de Parametrización (Drawer de 480px)
* Libre de conflictos de `z-index` (renderizado nativo sobre el layout de la página).
* Pestaña **Destinatario**: Autocomplete con prospectos (`includeProspects={true}`), ciudad, duración, pronto pago.
* Pestaña **Puestos**: Selector modal del catálogo SVSP, puesto manual, cálculo salarial con la Matriz Salarial.
* Pestaña **VAG**: Selector modal de catálogo institucional de comodatos, costos internos P&L.
* Pestaña **Firmantes**: Usuarios con firma digitalizada Noxia Sign, firmantes ad-hoc, toggle `showSignatures`.
* Pestaña **P&L**: Simulación financiera en vivo (costo nómina, amortización VAG, margen neto, semáforo).

---

### 3.6 Corrección de Errores de Hidratación en Diálogos
* Todos los títulos de diálogo (`<DialogTitle>`) se declaran con `component="div"` para evitar la anidación inválida de `Typography` (`<h6>`) dentro del `<h2>` nativo de Material UI.

---

## 4. Matriz de Tareas de Implementación (Orden de Ejecución)

1. [ ] **Renombrado y Reemplazo de Componente**:
   * Migrar y renombrar `SplitScreenProposalWorkspace.tsx` a `src/app/(protected)/commercial/proposals/components/CanvasProposalWorkspace.tsx`.
   * Eliminar definitivamente el archivo antiguo `SplitScreenProposalWorkspace.tsx`.
2. [ ] **Rutas Canónicas**:
   * Crear `src/app/(protected)/commercial/proposals/new/page.tsx` montando `CanvasProposalWorkspace`.
   * Crear `src/app/(protected)/commercial/proposals/[id]/edit/page.tsx` montando `CanvasProposalWorkspace`.
   * Actualizar navegación en `src/app/(protected)/commercial/proposals/page.tsx` hacia las nuevas rutas.
3. [ ] **Corrección de Hidratación**:
   * Corregir `<DialogTitle component="div">` en modales de preview y catálogos.
4. [ ] **Z-Index y Drawers**:
   * Retirar el wrapper `fixed; zIndex: 1300` para garantizar apertura fluida de Drawers.
5. [ ] **Cabecera Compacta Ejecutiva**:
   * Implementar diseño de 2 columnas (~75-80px de altura).
6. [ ] **Calibración A4 y Zoom Interactivo**:
   * Ajustar dimensiones a 794px e implementar selector de escala `[75% | 90% | 100% | Ajustar]`.
7. [ ] **NotionProposalBlock**:
   * Barra flotante superior externa (`top: -38px`) sin solapamiento.
   * Gutter izquierdo `-56px` con Drag & Drop HTML5 nativo y flechas `▲` / `▼`.
   * Memoización de bloques con `React.memo`.
8. [ ] **Historial Global y Autoguardado**:
   * Implementar `useCanvasHistory` (`Ctrl+Z` / `Ctrl+Y`) y respaldo local silencioso en `localStorage`.
9. [ ] **Renombrar a "Importar Formato"**:
   * Estandarizar nombre en toda la UI y enlazar con el modal de formatos.
10. [ ] **Optimizaciones del Listado de Propuestas**:
    * Separar acciones `[✎ Editar]` y `[📄 Ver PDF]`.
    * KPI Cards interactivas para filtrado rápido.
11. [ ] **Validación**:
    * Ejecución de `npx tsc --noEmit` en frontend (0 errores).
    * Ejecución de `npm test` en backend (100% pass).

---

## 5. Transición del Universal Document Studio a Página Nueva (Siguiente Hito)

Una vez completado y validado el creador de cotizaciones comerciales:
1. Se creará la ruta `src/app/(protected)/tools/formats/new/page.tsx` y `src/app/(protected)/tools/formats/[id]/edit/page.tsx`.
2. Se reemplazará el actual `UniversalFormatDrawer` por la página dedicada de 3 paneles (Herramientas -> Lienzo -> Hoja A4 en vivo) con el mismo motor de zoom y componentes modulares.
