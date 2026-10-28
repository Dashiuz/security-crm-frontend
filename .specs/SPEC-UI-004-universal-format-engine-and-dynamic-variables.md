# `SPEC-UI-004`: Motor Universal de Formatos, Variables Dinámicas (Atajos), Tablas TipTap y Arquitectura "Parse & Drop" (Zero-S3)

> **Estado**: `PROPUESTA TÉCNICA / PENDIENTE DE APROBACIÓN`  
> **Módulo Frontend**: `tools/formats`, `settings/variables`, `components/format-engine`, `commercial/proposals`  
> **Código de Especificación**: `SPEC-UI-004-universal-format-engine-and-dynamic-variables`  
> **Especificación Base Backend**: [`SPEC-CORE-010`](file:///d:/projects/security-crm-backend/.specs/04-core-architecture/SPEC-CORE-010-universal-format-engine-and-dynamic-variables.md)  
> **Autor**: Lead Software Architect & Principal UI/UX Engineer  
> **Fecha**: 2026-10-25  

---

## 1. Resumen de Novedades y Arquitectura Definitiva

1. **Pipeline "Parse & Drop" (Zero-S3)**:
   * Zona Drag & Drop en el drawer de creación donde el usuario puede arrastrar su archivo Word (`.docx`) o Excel (`.xlsx`) existente.
   * El archivo se procesa efímeramente en memoria RAM en el backend, convirtiendo tablas, estilos y celdas en HTML semántico compatible con TipTap.
   * El archivo original se destruye de la memoria de inmediato (0 bytes en AWS S3).
   * La plantilla se despliega viva en el editor web TipTap para que el usuario pueda editarla, corregir textos o insertar variables.
2. **Editor Web con Tablas Avanzadas (MIT License - 100% Gratuito)**:
   * Integración de `@tiptap/extension-table`, `table-row`, `table-cell` y `table-header`.
   * **Pegado inteligente desde Excel/Word (`Ctrl+V`)**: Conserva filas, columnas y celdas combinadas en pantalla.
   * Controles flotantes para insertar/eliminar columnas y filas, cambiar fondos y alinear celdas.
3. **Resaltado Visual de Tokens en Rojo y Negrita**:
   * Extensión `DynamicTokenExtension` que colorea automáticamente `{{variable}}` en **rojo vivo y negrita** (`#DC2626`, fondo `#FEF2F2`, borde punteado `#F87171`), tanto en párrafos normales como dentro de celdas de tablas.
4. **Selector de Atributos de Base de Datos Masivo (Modelo "Oracle Reports")**:
   * Árbol de navegación intuitivo en 2 pasos para mapear campos de:
     * 🏢 Mi Empresa (NIT, Licencia SVSP, Resoluciones)
     * 👤 Cliente (Razón Social, Administrador, Estrato, Sede)
     * 👮 Empleado (Cédula, Cargo, Salario, EPS/ARL, Fecha Ingreso)
     * 📑 Solicitudes y Procesos (Vacaciones con fechas y días, Dotación con tallas, Armamento con seriales)
     * 💰 Financiero (Montos con conversión automática a letras `monto_en_letras`)
     * 📅 Fechas y Sistema
5. **Arquitectura Modular "Piezas de Lego"**:
   * 7 bloques activables mediante interruptores en `UniversalFormatDrawer`: Membrete, Credenciales SuperVigilancia (con toggle de auto-llenado de BD o edición manual), Sellos de Calidad, Cuerpo TipTap con Tablas, Matriz Económica, Firmantes Autorizados y Footer.
6. **Desacoplamiento Total de Comercial**:
   * Elevación de la gestión documental al riel de Herramientas Generales (`/tools/formats`).
   * Eliminación de la pestaña de plantillas en `/commercial/settings`.
   * En `/commercial/proposals`, modal de decisión inicial: *"Elegir Formato Global"*, *"Elegir Mi Formato Personal"* o *"Iniciar en Blanco"*.
