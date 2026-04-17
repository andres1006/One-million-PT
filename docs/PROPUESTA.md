# Propuesta Técnica — Prueba Frontend One Million Copy SAS

> **Candidato:** Andrés Agudelo
> **Repositorio:** `andres1006/One-million-PT`
> **Stack elegido:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + React Hook Form + Zod + TanStack Query + Zustand
> **Despliegue:** Vercel
> **Tiempo estimado:** 6 h (MVP obligatorio) + 1–2 h bonus

---

## 1. Entendimiento del problema

One Million Copy SAS necesita una **SPA 100% frontend** para administrar *leads* que provienen de embudos de marketing (Instagram, Facebook, landing page, referidos, otros). La app debe permitir:

1. **CRUD completo de leads** con tabla, búsqueda, filtros, paginación y estados (carga / vacío / error).
2. **Dashboard** con métricas clave (total, por fuente, promedio de presupuesto, últimos 7 días).
3. **Resumen con IA** (LLM real o mock bien resuelto) con análisis, fuente principal y recomendaciones.
4. **Calidad frontend:** diseño limpio, componentes reutilizables, separación lógica/UI, responsive, accesibilidad básica.
5. **Mocks locales** con mínimo 10 leads.
6. **Documentación** (README, tecnologías, cómo correr y probar).

Bonus que apuntaremos a cumplir: Deploy Vercel, TypeScript, tests (≥5), modo oscuro, animaciones, sorting, persistencia `localStorage` y arquitectura limpia.

---

## 2. Decisiones técnicas y justificación

| Área | Elección | Por qué |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | SSR/SSG opcional, routing por carpetas, API routes para el endpoint de IA sin backend aparte, deploy 1-click en Vercel. |
| Lenguaje | **TypeScript (strict)** | Seguridad de tipos, mejor DX, menos bugs — es bonus del enunciado. |
| Styling | **Tailwind CSS v4** | Utility-first, consistente, rápido, excelente integración con shadcn. |
| UI Kit | **shadcn/ui** (Radix debajo) | Componentes accesibles (ARIA), copiados al repo → 100% control, sin lock-in. |
| Formularios | **React Hook Form + Zod** | Validación declarativa, un solo schema para front y (eventual) backend, performance. |
| Data fetching | **TanStack Query** | Cache, revalidación, estados de carga/error idiomáticos, invalidaciones finas. |
| Estado global UI | **Zustand** | Sólo para filtros, tema y UI state — ligero, sin boilerplate. |
| Mocks | **MSW (Mock Service Worker)** + JSON seed | Simula una API real a nivel de red → el código de producción no cambia si mañana se conecta a backend real. |
| Persistencia | **localStorage** (via Zustand persist) | Bonus: leads sobreviven al refresh. |
| Gráficas | **Recharts** | Ligero, declarativo, suficiente para 2-3 charts del dashboard. |
| IA | **Ruta `/api/ai-summary`** (Next API Route) con OpenAI opcional o fallback heurístico | Cumple el requisito con mock serio y opción de LLM real si hay `OPENAI_API_KEY`. |
| Tests | **Vitest + Testing Library + Playwright (1 e2e)** | Unit + integración + un smoke test. |
| Calidad | **ESLint, Prettier, Husky + lint-staged, commitlint (Conventional Commits)** | Higiene de commits y código. |
| Deploy | **Vercel** | Integración nativa con Next.js, preview por PR. |

### Principios aplicados

- **SOLID**
  - *SRP:* cada componente/hook/servicio tiene una sola responsabilidad (`LeadsTable`, `useLeads`, `leadsService`, `leadSchema`).
  - *OCP:* filtros y columnas extensibles por configuración, no por modificación.
  - *LSP:* componentes polimórficos (ej. `DataTable<T>` genérica).
  - *ISP:* interfaces pequeñas (`LeadFormValues`, `LeadFilters`, `LeadStats`).
  - *DIP:* la UI consume un `LeadsRepository` interface; la implementación (MSW/REST/localStorage) es inyectable.
- **Clean Code:** nombres explícitos, funciones cortas, no hay lógica de negocio dentro de JSX, early returns, sin magic numbers (constantes centrales).
- **Clean Architecture (ligera):**
  ```
  domain (types, schemas, invariants)
    ↑
  application (use-cases / hooks)
    ↑
  infrastructure (api, mocks, storage)
    ↑
  presentation (components, pages)
  ```

---

## 3. Arquitectura de carpetas

```
src/
├── app/                         # App Router
│   ├── (dashboard)/
│   │   ├── page.tsx             # Dashboard + stats
│   │   ├── leads/
│   │   │   ├── page.tsx         # Tabla de leads
│   │   │   └── [id]/page.tsx    # Detalle de lead
│   │   └── ai-summary/page.tsx  # Resumen inteligente
│   ├── api/
│   │   └── ai-summary/route.ts  # POST → genera resumen
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                      # shadcn (button, dialog, table, …)
│   ├── layout/                  # Sidebar, Header, ThemeToggle
│   ├── leads/                   # LeadsTable, LeadForm, LeadDetail, DeleteLeadDialog
│   ├── dashboard/               # StatCard, LeadsBySourceChart, BudgetAverageCard
│   └── ai/                      # AiSummaryPanel, AiFiltersBar
│
├── domain/
│   ├── lead.ts                  # type Lead, LeadSource enum
│   ├── lead.schema.ts           # Zod schemas (create/update)
│   └── stats.ts                 # type LeadStats
│
├── application/
│   ├── hooks/
│   │   ├── useLeads.ts          # Query + filtros + paginación
│   │   ├── useLead.ts
│   │   ├── useCreateLead.ts
│   │   ├── useUpdateLead.ts
│   │   ├── useDeleteLead.ts
│   │   ├── useLeadStats.ts
│   │   └── useAiSummary.ts
│   └── stores/
│       ├── filtersStore.ts      # Zustand (source, dateRange, q, page)
│       └── themeStore.ts
│
├── infrastructure/
│   ├── api/
│   │   ├── leadsRepository.ts   # interface
│   │   ├── leadsRepository.http.ts
│   │   └── leadsRepository.local.ts  # localStorage fallback
│   ├── mocks/
│   │   ├── handlers.ts          # MSW handlers
│   │   ├── browser.ts
│   │   ├── server.ts
│   │   └── seed.ts              # 15 leads de ejemplo
│   └── ai/
│       ├── summaryService.ts    # orquesta LLM real o heurístico
│       └── heuristicSummary.ts
│
├── lib/
│   ├── utils.ts                 # cn, formatters (currency, date)
│   ├── query-client.ts
│   └── constants.ts             # LEAD_SOURCES, PAGE_SIZE
│
└── tests/
    ├── unit/
    │   ├── lead.schema.test.ts
    │   ├── heuristicSummary.test.ts
    │   └── formatters.test.ts
    ├── integration/
    │   ├── LeadsTable.test.tsx
    │   └── LeadForm.test.tsx
    └── e2e/
        └── leads.spec.ts        # Playwright: crear → editar → eliminar
```

---

## 4. Modelo de datos

```ts
// domain/lead.ts
export const LEAD_SOURCES = ['instagram','facebook','landing_page','referido','otro'] as const;
export type LeadSource = typeof LEAD_SOURCES[number];

export interface Lead {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  fuente: LeadSource;
  producto_interes?: string;
  presupuesto?: number;          // USD
  fecha_creacion: string;        // ISO
}
```

```ts
// domain/lead.schema.ts
export const leadCreateSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  fuente: z.enum(LEAD_SOURCES, { required_error: 'Fuente obligatoria' }),
  producto_interes: z.string().optional(),
  presupuesto: z.coerce.number().min(0, 'Debe ser ≥ 0').optional(),
});
export const leadUpdateSchema = leadCreateSchema.partial();
```

---

## 5. Historias de Usuario (HU)

### Épica A — Gestión de Leads

**HU-01 — Listar leads**
> Como *Marketing Manager* quiero ver todos los leads en una tabla ordenada por fecha descendente para identificar los más recientes.
>
> **Criterios de aceptación (Gherkin):**
> - Dado que existen leads en el sistema, cuando abro `/leads`, entonces veo una tabla con columnas: nombre, email, teléfono, fuente (badge), producto, presupuesto (USD), fecha.
> - La tabla está ordenada por `fecha_creacion` desc por defecto.
> - Muestra skeleton durante la carga, estado vacío con CTA "Crear lead" si no hay datos, y estado de error con botón "Reintentar" si falla.

**HU-02 — Buscar leads por nombre o email**
> Como usuario quiero buscar por nombre o email para localizar un lead rápidamente.
>
> **CA:**
> - Input con debounce 300 ms.
> - Filtra client-side sobre la data actual + resetea la paginación a la página 1.
> - Búsqueda *case-insensitive* y parcial.

**HU-03 — Filtrar por fuente y rango de fechas**
> **CA:**
> - Selector multi-opción de fuente (instagram/facebook/landing_page/referido/otro).
> - Date range picker (calendar shadcn) con "últimos 7/30 días" predefinidos.
> - Los filtros se reflejan en la URL (`?source=instagram&from=…&to=…`) para ser compartibles.
> - Botón "Limpiar filtros".

**HU-04 — Paginación**
> **CA:** controles `prev/next` + contador "Mostrando X-Y de Z"; tamaño configurable (default 10).

**HU-05 — Crear lead**
> **CA:**
> - Botón "Nuevo lead" abre `Dialog` (shadcn) con formulario.
> - Validaciones Zod: nombre ≥2, email válido, fuente obligatoria, presupuesto ≥0.
> - Mensajes de error inline en cada campo.
> - Toast de éxito, cierre del dialog, invalidación de la query → tabla actualizada.
> - Focus trap y cierre con ESC.

**HU-06 — Ver detalle**
> **CA:** al hacer click en una fila se abre `Sheet` (drawer) o ruta `/leads/[id]` con toda la info formateada (presupuesto como USD, fecha relativa + absoluta).

**HU-07 — Editar lead**
> **CA:** botón "Editar" en detalle o menú de fila → mismo form reutilizado en modo update; optimistic update con rollback si falla.

**HU-08 — Eliminar lead**
> **CA:** `AlertDialog` de confirmación ("¿Seguro? Esta acción no se puede deshacer"), toast de éxito/error, invalidación de la query.

### Épica B — Dashboard

**HU-09 — Estadísticas globales**
> **CA:**
> - 4 `StatCard`s: *Total de leads*, *Promedio de presupuesto* (USD), *Leads últimos 7 días* (con delta vs. 7 previos), *Fuente top*.
> - Chart (Recharts `BarChart`) *Leads por fuente*.
> - Chart de línea *Leads por día* (últimos 30 días).
> - Todo calculado en cliente desde la misma data (selector memoizado).

### Épica C — Resumen IA

**HU-10 — Generar resumen inteligente**
> Como PM quiero generar un resumen ejecutivo con IA aplicando filtros opcionales.
>
> **CA:**
> - Formulario con: rango de fecha (opcional) + fuente (opcional).
> - Botón "Generar resumen" → POST a `/api/ai-summary`.
> - Estados: idle, loading (skeleton o spinner + mensaje "Analizando…"), success (tres secciones: *Análisis general*, *Fuente principal*, *Recomendaciones*), error (retry).
> - Si hay `OPENAI_API_KEY` usa GPT-4o-mini; si no, usa generador heurístico local documentado.
> - Resultado copiable al portapapeles.
> - Historial de los últimos 5 resúmenes (Zustand + persist).

### Épica D — Calidad

**HU-11 — Responsive**
> CA: usable en mobile (≥375px) — tabla → cards en < md.

**HU-12 — Modo oscuro**
> CA: toggle en header, persistido, respeta `prefers-color-scheme`.

**HU-13 — Accesibilidad**
> CA: navegable por teclado, labels asociados, focus visible, roles ARIA (shadcn/Radix lo provee), contraste AA.

**HU-14 — Documentación**
> CA: README con secciones: Stack, Scripts, Estructura, Mocks, Variables de entorno, Deploy, Testing.

---

## 6. Plan de tareas paso a paso (estilo OpenSpec)

> Cada bloque representa un commit atómico. Total: ~28 commits.

### Fase 0 — Setup (30 min)
- [ ] `chore: scaffold Next.js 15 + TS + Tailwind v4`
- [ ] `chore: add eslint, prettier, husky, lint-staged, commitlint`
- [ ] `chore: init shadcn/ui (theme, base components)`
- [ ] `chore: add tsconfig paths (@/…)`

### Fase 1 — Dominio + Mocks (45 min)
- [ ] `feat(domain): add Lead type, enum and Zod schemas`
- [ ] `feat(mocks): add MSW handlers + seed of 15 leads`
- [ ] `feat(infra): leadsRepository interface + http impl + localStorage impl`

### Fase 2 — Layout + Shell (30 min)
- [ ] `feat(layout): add sidebar, header, theme toggle, providers`
- [ ] `feat(lib): QueryClient provider + Sonner toasts`

### Fase 3 — Leads (2 h)
- [ ] `feat(leads): LeadsTable with sorting by date`
- [ ] `feat(leads): search with debounce + source filter + date range`
- [ ] `feat(leads): pagination`
- [ ] `feat(leads): loading, empty, error states`
- [ ] `feat(leads): LeadForm (create) with RHF + Zod`
- [ ] `feat(leads): LeadDetail drawer`
- [ ] `feat(leads): update flow (optimistic)`
- [ ] `feat(leads): delete flow with AlertDialog`
- [ ] `feat(leads): sync filters to URL searchParams`

### Fase 4 — Dashboard (45 min)
- [ ] `feat(dashboard): StatCards (total, avg, last 7d, top source)`
- [ ] `feat(dashboard): LeadsBySourceChart (Recharts)`
- [ ] `feat(dashboard): LeadsOverTimeChart`

### Fase 5 — AI Summary (45 min)
- [ ] `feat(ai): heuristic summary generator (docs/AI_SUMMARY.md)`
- [ ] `feat(ai): /api/ai-summary route (OpenAI optional + fallback)`
- [ ] `feat(ai): AiSummaryPanel UI + history`

### Fase 6 — Calidad (45 min)
- [ ] `feat(a11y): focus styles, aria-labels, keyboard nav review`
- [ ] `style: microinteractions (framer-motion-lite or CSS)`
- [ ] `feat(responsive): mobile cards for leads table`

### Fase 7 — Tests (30 min)
- [ ] `test(unit): lead.schema`
- [ ] `test(unit): heuristicSummary`
- [ ] `test(unit): formatters (currency/date)`
- [ ] `test(integration): LeadForm happy path + validation`
- [ ] `test(integration): LeadsTable filters`
- [ ] *(opcional)* `test(e2e): Playwright create/edit/delete`

### Fase 8 — Docs + Deploy (30 min)
- [ ] `docs: complete README + .env.example + screenshots`
- [ ] `chore: vercel.json + deploy preview`
- [ ] `docs: CHANGELOG + link de producción`

---

## 7. Contrato de API mock (MSW)

| Método | Ruta | Body / Query | Respuesta |
|---|---|---|---|
| GET | `/api/leads` | `?q&source&from&to&page&pageSize&sort` | `{ data: Lead[], total, page, pageSize }` |
| GET | `/api/leads/:id` | — | `Lead` |
| POST | `/api/leads` | `LeadCreateInput` | `Lead` (201) |
| PATCH | `/api/leads/:id` | `LeadUpdateInput` | `Lead` |
| DELETE | `/api/leads/:id` | — | 204 |
| POST | `/api/ai-summary` | `{ from?, to?, source? }` | `{ analisis_general, fuente_principal, recomendaciones[] }` |

---

## 8. Estrategia del resumen IA (fallback heurístico documentado)

Cuando no haya `OPENAI_API_KEY`, el servicio produce determinísticamente:

1. **Análisis general:** `"N leads entre {from} y {to}; crecimiento de X% vs período anterior; presupuesto promedio de $Y."`
2. **Fuente principal:** fuente con mayor conteo + % del total.
3. **Recomendaciones:** reglas simples (p. ej. si la fuente top es `instagram` y su ticket promedio < global → "Invertir en contenido de mayor valor en Instagram"; si hay >30% de leads sin presupuesto → "Agregar campo obligatorio en captación").

Documentado en `docs/AI_SUMMARY.md` para que el evaluador vea el criterio.

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Sobre-ingeniería en 6h | Priorizar obligatorios, bonus sólo si queda tiempo. |
| MSW en producción | Activar MSW **solo** en dev/preview; en prod la app usa `leadsRepository.local` sobre `localStorage`. |
| Costo/latencia de LLM real | Ruta con timeout 10s y fallback automático al heurístico. |
| Estado inconsistente tras delete/update | Optimistic update + invalidación de React Query. |

---

## 10. Criterios de "Definition of Done"

- [ ] Todos los obligatorios (Partes 1–6) pasan manualmente.
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes.
- [ ] ≥ 5 tests (3 unit + 2 integration).
- [ ] Lighthouse desktop ≥ 90 en Performance/A11y/Best-Practices.
- [ ] Deploy en Vercel con URL pública en el README.
- [ ] README con pasos reproducibles + `.env.example`.
- [ ] ≥ 15 commits con mensajes *Conventional Commits*.

---

## 11. Siguiente paso sugerido

Si apruebas esta propuesta procedo a:

1. Inicializar el proyecto en el repo `andres1006/One-million-PT` con la Fase 0.
2. Abrir una PR por cada fase (o una sola con commits atómicos, como prefieras) para que puedas revisar incrementalmente.
3. Configurar el deploy en Vercel y compartir la URL de preview.

¿Te gustaría que arranquemos directo por la Fase 0 + Fase 1 (scaffold + dominio + mocks) o prefieres ajustar algo de la propuesta antes?
