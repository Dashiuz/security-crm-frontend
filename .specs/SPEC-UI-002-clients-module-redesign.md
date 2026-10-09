# SPEC-UI-002: Rediseño Arquitectónico del Módulo de Clientes (Sidenav & Hub)

> **Estado**: `IMPLEMENTADO`  
> **Módulo**: `administrative/clients`  
> **Ubicación Frontend**: `src/app/(protected)/administrative/clients/[id]`  
> **Ubicación Backend**: `src/modules/administrative/client`  

---

## 1. Contexto y Objetivo
El módulo de Detalles del Cliente actualmente concentra toda la información en un único componente (`[id]/page.tsx` con >3000 líneas y 6 pestañas). Esto genera cuellos de botella en rendimiento (renderizado innecesario), experiencia de usuario (formularios densos, navegación móvil incómoda) y seguridad de datos (sobre-exposición de información administrativa a roles operativos).

**Objetivos del Rediseño**:
1. Implementar `layout.tsx` anidados (App Router) para dividir la carga en rutas dedicadas (Desktop: Sidenav, Mobile: Hub & Spoke).
2. Reducir la carga cognitiva mediante vistas orientadas a tareas (Dashboard, Legal, Operaciones).
3. Fortalecer el modelo de seguridad RBAC agregando permisos granulares por sección.
4. Mejorar la persistencia aislando el guardado por tarjeta en lugar de un `PATCH` masivo.

---

## 2. Nuevos Permisos (Backend `prisma/seed.ts`)

Para evitar basarnos en roles quemados (como `TECNICO` o `COMERCIAL`), crearemos permisos finos en la semilla que se asignarán a los roles correspondientes.

| Permiso | Descripción | Rol Sugerido |
| :--- | :--- | :--- |
| `client:read_general` | Ver Overview/Dashboard | Todos |
| `client:update_general` | Editar datos base | Admin |
| `client:read_operations` | Ver Estructura, Accesos, Seguridad | Admin, Operativo |
| `client:update_operations` | Editar Estructura Física y Áreas | Admin |
| `client:read_legal` | Ver Info Contractual y Consejo | Admin, Comercial |
| `client:update_legal` | Editar Contratos y Contactos | Admin, Comercial |
| `client:read_residents` | (Existente) Ver Residentes | Admin, Operativo |

> **Nota**: El permiso global `client:manage` sobrepasará estas reglas (Dios/SuperAdmin).

---

## 3. Endpoints Backend & Seguridad (NestJS)

Actualmente existe `PATCH /client/:id` que recibe el DTO completo. Si bien sirve, la validación de permisos a nivel de campos en un solo endpoint es compleja.

### 3.1. Nuevos Endpoints Especializados
En `ClientController` (`src/modules/administrative/client/client.controller.ts`), agregaremos rutas específicas que validen sus respectivos permisos. Esto asegura que nadie con Postman pueda actualizar el contrato si solo tiene `client:update_operations`.

- `PATCH /client/:id/general` (Requiere `client:update_general`)
- `PATCH /client/:id/operations` (Requiere `client:update_operations`) 
- `PATCH /client/:id/legal` (Requiere `client:update_legal`)

### 3.2. Carga Segura (`GET /client/:id`)
El `ClientService.findOne` se modificará para omitir datos (ej. `councilData`, `contractNumber`) si el usuario no tiene `client:read_legal`.

### 3.3. Peligro de Borrado en Cascada
Actualmente `generateStructure()` borra `Unit`, `Floor`, `Tower` (lo cual dispara `onDelete: Cascade` borrando todos los `Resident` de esas unidades). El guardado de Operaciones debe pedir **doble confirmación explícita (tipo "Escriba REGENERAR")** si cambia la estructura física.

---

## 4. Arquitectura Frontend (App Router)

### 4.1. Estructura de Directorios

```text
src/app/(protected)/administrative/clients/[id]/
├── layout.tsx         # Sidenav (Desktop) + ClientContext
├── page.tsx           # Hub & Spoke (Mobile Landing) / Redirige a Overview en Desktop
├── overview/          # (General) Dashboard, Mapa estático, Métricas (Read-only + Edit)
├── residents/         # ResponsiveDataView + Cursor Pagination para residentes
├── operations/        # (Operaciones) Estructura Física, Canva, Estudios, Geofence
└── legal/             # (Legal) Acordeones colapsables: Contrato, Administración, Consejo
```

### 4.2. Comportamiento Responsive

1. **Desktop (md+):**
   - El `layout.tsx` mostrará un **Sidenav secundario** a la izquierda (~240px).
   - El `Sidebar` global se puede retraer o mantener, según el diseño (estilo Vercel/Stripe Settings).
   - Navegación instantánea entre `/overview`, `/residents`, `/operations`, `/legal`.

2. **Mobile (xs/sm):**
   - La raíz `/clients/[id]/page.tsx` mostrará el **Hub (Tarjetas grandes)**.
   - Cada tarjeta actúa como un `Spoke`, navegando a la ruta correspondiente que tomará el 100% de la pantalla, con un botón superior izquierdo "← Volver al Cliente".
   - El Sidenav no se renderiza.

### 4.3. `ClientContext`
Para evitar redundancia de peticiones HTTP, el `layout.tsx` hará el fetch del cliente 1 sola vez y expondrá la data mediante un React Context `useClientDetail()`.

### 4.4. UI/UX: Tarjetas en Modo Lectura (Profile)
En las rutas `overview`, `operations` y `legal`, la información se agrupará en tarjetas (Cards/Paper). 
- **Por defecto:** Solo lectura (Texto plano y tipografía pulida).
- **Interacción:** Botón superior derecho "Editar" que convierte la tarjeta en formulario.
- **Ventaja:** Previene guardados accidentales masivos y cada tarjeta despacha una sola petición PATCH (ej. solo el consejo de administración).

---

## 5. Plan de Implementación (Fases)

### Fase 1: Backend y Seguridad
1. Agregar nuevos permisos en `prisma/seed.ts` y re-ejecutar seed.
2. Modificar `ClientController` y `ClientService` para ofrecer los sub-endpoints PATCH (`/general`, `/operations`, `/legal`).
3. Modificar `ClientService.findOne` para limpiar data si el request no tiene los permisos `read` requeridos.

### Fase 2: Layout y Navegación (Frontend)
1. Crear `ClientContext` y `clientNavConfig` (arreglo centralizado de opciones de menú que reacciona a los permisos de `useAuth()`).
2. Construir `layout.tsx` con el Sidenav (Desktop).
3. Construir `page.tsx` (raíz) con el Hub de 4 tarjetas grandes (Mobile).

### Fase 3: Rutas Especializadas (Migración del componente de 3000 líneas)
1. Mover la lógica de "Resumen" a `/overview`.
2. Mover la lógica de "Residentes" a `/residents` (incluyendo la paginación con `ResponsiveDataView`).
3. Mover "Estructura" y "Estudios" a `/operations` (protegiendo el guardado de estructura).
4. Mover Contratos/Consejo a `/legal` (implementando acordeones o tarjetas).

### Fase 4: Limpieza
1. Eliminar los componentes viejos.
2. Asegurar que los botones "← Volver a la Lista" mantengan el UX.
