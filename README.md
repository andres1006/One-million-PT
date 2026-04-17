# OMC · Leads — Prueba técnica frontend

Aplicación web **100% frontend** para administrar leads de **One Million Copy SAS**: listado con filtros, CRUD, dashboard ejecutivo y resumen con IA.

> **Estado:** Producto completo (fases 0 → 8). Tests automatizados con Vitest (44 casos) y deploy preparado para Vercel.

## 📐 Resumen del entregable

| Item | Detalle |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript `strict` |
| Styling | Tailwind CSS v4 + shadcn/ui (tema `base-nova`) |
| Estado remoto | TanStack Query con `keepPreviousData` |
| Estado UI | Zustand (filtros + theme + historial IA con `persist`) |
| Formularios | React Hook Form + Zod |
| Mocks | MSW (service worker en navegador) |
| Gráficas | Recharts (AreaChart y BarChart) |
| Tests | Vitest + Testing Library + jsdom (50 tests) |
| Linting | ESLint (config de Next) + Prettier + commitlint + husky |
| Deploy | Vercel (estático + route `/api/ai-summary`) |

## 🎯 Qué cubre la prueba

El documento original pedía 6 apartados obligatorios + bonus. Todos implementados:

- [x] **Listar leads** con tabla responsive (columnas: nombre, email, fuente, producto, presupuesto, fecha).
- [x] **Filtros** por texto (`q`), fuente, rango de fechas, ordenamiento y paginación de 10 por página.
- [x] **Crear, editar y eliminar** leads con validaciones (RHF + Zod), confirmación de borrado y toasts.
- [x] **Ver detalle** en modal con todos los datos.
- [x] **Dashboard** con 4 KPIs (total, presupuesto promedio, últimos 7 días, WoW %), gráfico de tendencia 14 días y distribución por fuente.
- [x] **Resumen IA** en `/ai-summary` con filtros de fuente y rango, ruta API `/api/ai-summary`, y fallback heurístico determinístico cuando no hay `OPENAI_API_KEY`.
- [x] **Historial de resúmenes** persistido en `localStorage` (máx 5).
- [x] **Mocks MSW** con 16 leads seed, cubriendo `GET /api/leads`, `GET /api/leads/stats`, `GET /api/leads/:id`, `POST`, `PATCH`, `DELETE`.
- [x] **Error boundaries** (`error.tsx`, `global-error.tsx`, `not-found.tsx`).
- [x] **A11y:** skip-to-content, landmarks, focus rings visibles, `aria-live` en acciones asíncronas.
- [x] **Dark mode** con `next-themes`.

## 🗂️ Arquitectura

Capas inspiradas en Clean Architecture (livianas, sin over-engineering):

```
src/
├── app/                       # App Router: pages, layout, providers, route API, boundaries
│   ├── api/ai-summary/        # POST: genera resumen (OpenAI si hay key, si no heurístico)
│   ├── leads/                 # Vista de tabla + filtros + modales
│   ├── ai-summary/            # Vista del generador de IA + historial
│   ├── error.tsx              # Error boundary por ruta (reset sin reload)
│   ├── global-error.tsx       # Último recurso con estilos inline
│   └── not-found.tsx          # 404
├── components/
│   ├── ai/                    # AiFiltersBar, AiSummaryCard, AiHistoryList, AiSummaryView
│   ├── dashboard/             # KpiCard, SourceBarChart, DailyTrendChart, RecentLeadsCard
│   ├── layout/                # AppShell, Sidebar, Header, ThemeToggle, SkipToContent
│   ├── leads/                 # LeadsView, LeadsTable, LeadFormDialog, LeadDetailDialog…
│   └── ui/                    # shadcn components (Button, Card, Dialog, Select…)
├── domain/                    # Tipos + schemas Zod (framework-agnostic: Lead, AiSummary…)
├── application/
│   ├── ai/                    # buildAiDataset, generateHeuristicSummary (puros)
│   ├── hooks/                 # useLeadsList, useLeadStats, useAiSummary (React Query)
│   └── stores/                # leadsFilters (URL-sync), aiHistory (persist)
├── infrastructure/
│   ├── api/                   # LeadsRepository + filter-leads (applyLeadFilters, computeStats)
│   └── mocks/                 # MSW handlers + seed de 16 leads
└── lib/                       # utils, constants, formatters (es-CO), query-client
```

Principios aplicados:

- **SRP:** cada archivo hace una cosa. Un repository no formatea fechas; un componente no conoce `fetch`.
- **DIP:** la UI depende de la interfaz `LeadsRepository`. Hoy usa MSW sobre `/api/*`; mañana se puede inyectar un HTTP real o un adapter localStorage sin tocar componentes.
- **Pureza:** el dataset del resumen IA se calcula con una función pura (`buildAiDataset`) y el fallback (`generateHeuristicSummary`) también lo es → 100% testeable sin mocks.
- **Clean Code:** nombres en español alineados al dominio (`fuente`, `presupuesto`, `fecha_creacion`), funciones pequeñas, sin magic numbers.

## 🚀 Cómo correr el proyecto

### Requisitos

- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)

### Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Abre <http://localhost:3000>. La primera visita instala el service worker de MSW y siembra 16 leads en memoria.

### Scripts

```bash
pnpm dev            # Dev server (Turbopack)
pnpm build          # Build de producción
pnpm start          # Sirve el build
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest (suite completa)
pnpm test:watch     # Vitest en modo watch
pnpm test:coverage  # Reporte de coverage con v8
pnpm format         # Prettier (write)
pnpm format:check   # Prettier (check)
```

## 🧪 Testing

Se usa **Vitest + Testing Library + jsdom**. 50 tests repartidos en 9 suites cubren las piezas críticas:

| Suite | Qué prueba |
|---|---|
| `lib/formatters.test.ts` | `formatCurrency` (null / NaN / integer), `formatDate` (locale), `formatRelative` (diff < 1min, singular/plural, fechas futuras, horas, días). |
| `infrastructure/api/filter-leads.test.ts` | `applyLeadFilters` con todas las combinaciones (q, source, rango de fechas, sort asc/desc, paginación sin mutar el array fuente) + `computeStats` (empty input, top source determinista, promedio sólo sobre leads con presupuesto). |
| `application/ai/build-dataset.test.ts` | Agregaciones por fuente, ventanas 7d / prev-7d, filtrado por fuente, top 3 productos. |
| `application/ai/heuristic-summary.test.ts` | Provider = `heuristic`, headline **no duplicado** en analysis (regresión de review), WoW up/down, empty dataset, scope con fuente. |
| `application/stores/leads-filters-store.test.ts` | Defaults, reset-a-page-1 en cada cambio de filtro, `hydrateFromParams` (`?page=2.5` → `2`, source desconocida → `"all"`, page ≤ 0 → `1`), round-trip con `toSearchParams`. |
| `application/stores/ai-history-store.test.ts` | Orden descendente, cap en `AI_SUMMARY_HISTORY_LIMIT`, `clear()`. |
| `components/leads/source-badge.test.tsx` | Labels localizados (Instagram, Landing Page, Referido). |
| `components/dashboard/kpi-card.test.tsx` | Render de label/value/hint, delta positivo / negativo con `aria-label`, estado `isLoading`. |
| `infrastructure/ai/openai-client.test.ts` | Rutas de salida del cliente OpenAI: `no_key`, `ok`, `http_error` (401/429 con mensaje), `invalid_response` (JSON malformado / schema incompleto), `network_error` (fetch tirado). |

Corre todo con:

```bash
pnpm test
```

## 🧪 Mocks (MSW)

Con `NEXT_PUBLIC_MOCKS=on` (default en `.env.example`), antes de montar la app se arranca un **Service Worker** que intercepta `/api/*` en el navegador y responde desde [`src/infrastructure/mocks/handlers.ts`](./src/infrastructure/mocks/handlers.ts) usando el seed de [`src/infrastructure/mocks/seed.ts`](./src/infrastructure/mocks/seed.ts) (16 leads).

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/leads` | Listado paginado + filtros (`q`, `source`, `from`, `to`, `page`, `pageSize`, `sort`) |
| `GET` | `/api/leads/stats` | Métricas agregadas + serie diaria de 14 días |
| `GET` | `/api/leads/:id` | Detalle |
| `POST` | `/api/leads` | Crea un lead (valida con Zod) |
| `PATCH` | `/api/leads/:id` | Actualiza |
| `DELETE` | `/api/leads/:id` | Elimina |

> La única ruta **real** de servidor es `POST /api/ai-summary`. Vive en `src/app/api/ai-summary/route.ts` para poder usar la key de OpenAI sin exponerla al cliente.

Para desactivar MSW: `NEXT_PUBLIC_MOCKS=off`.

## 🤖 Resumen con IA

La página `/ai-summary` permite generar un resumen ejecutivo en español en ~2 segundos.

### Flujo

1. El cliente construye un `AiSummaryDataset` **puro** (agregados por fuente, WoW, top productos, promedio de presupuesto…) vía `buildAiDataset`.
2. Envía dataset + filtros a `POST /api/ai-summary`.
3. El route handler:
   - Si existe `OPENAI_API_KEY` → llama a `gpt-4o-mini` (configurable con `OPENAI_MODEL`) con `response_format: json_object` y valida la respuesta. Si el modelo alucina un `topSource` no válido, cae a `null`.
   - Si no hay key, o OpenAI falla (401, 429, red caída, JSON inválido) → usa `generateHeuristicSummary`, determinístico y siempre disponible.
4. Cuando hay un **fallback por error** (key presente pero call falló), la respuesta incluye un `warning` que el UI renderiza como banner ámbar dentro de la tarjeta. Además se deja un `console.warn` en los logs del servidor con el detalle (`Vercel → Function Logs`).
5. La respuesta se guarda en `localStorage` (últimos 5) y se muestra con badge indicando el proveedor (`OpenAI` vs `Heurístico`).

La clave del diseño es que **el producto nunca bloquea al usuario**: el fallback heurístico entrega un resumen válido en todos los escenarios.

### Activar OpenAI en Vercel (paso a paso)

El heurístico es el modo por defecto y no requiere configuración. Para activar el modelo real en la URL pública:

1. **Crea la API key**: <https://platform.openai.com/api-keys> → "Create new secret key". Necesitas billing activo en tu cuenta de OpenAI.
2. **Agrega la env var en Vercel**: dashboard → proyecto `one-million-pt` → **Settings → Environment Variables** → `OPENAI_API_KEY` = `sk-...`, scope **Production** (y opcionalmente Preview). Opcional: `OPENAI_MODEL` si quieres otro modelo (default `gpt-4o-mini`).
3. **Redeploy**: en **Deployments**, clic en el último deploy → **Redeploy** (puedes mantener el build cache).
4. **Verifica**: visita `/ai-summary` → "Generar resumen" → el badge cambia de `Heurístico` a `OpenAI`. Si aparece un banner ámbar "Fallback al modo heurístico" significa que la llamada a OpenAI falló — revisa los **Function Logs** de Vercel para el detalle exacto (key inválida, sin billing, rate limit, JSON mal formado, etc.).

> Costos estimados: ~500 tokens por clic con `gpt-4o-mini` ≈ **< $0.001 USD** por resumen. El heurístico queda como safety net si hay un outage.

## 🔐 Variables de entorno

Ver [`.env.example`](./.env.example).

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_MOCKS` | `on` / `off`. Activa MSW en el cliente. Siempre `on` para la prueba. |
| `OPENAI_API_KEY` | Opcional. Si está presente el endpoint `/api/ai-summary` usa GPT; si no, cae al generador heurístico local. |
| `OPENAI_MODEL` | Opcional. Default: `gpt-4o-mini`. |

## 🧭 Rutas

| Ruta | Contenido |
|---|---|
| `/` | Dashboard con KPIs, tendencia 14d, distribución por fuente y últimos 5 leads. |
| `/leads` | Tabla de leads con filtros, paginación, crear / editar / eliminar / ver detalle. |
| `/ai-summary` | Generador de resumen ejecutivo con IA + historial. |
| `/api/ai-summary` | Route handler `POST` (OpenAI con fallback heurístico). |

## 🚢 Deploy en Vercel

El repo está preparado para despliegue 1-click:

1. Importar el repo en Vercel.
2. Framework: **Next.js** (autodetectado).
3. Build command: `pnpm build`. Install command: `pnpm install`.
4. Environment variables:
   - `NEXT_PUBLIC_MOCKS=on`
   - (opcional) `OPENAI_API_KEY=…`
5. Deploy → la URL queda lista y todos los flujos (tabla, filtros, CRUD, dashboard, IA) funcionan sin backend adicional porque MSW corre en el navegador.

## 🗺️ Historial por fases

Seguimos un plan de 9 fases (0-8), documentado en [`docs/PROPUESTA.md`](./docs/PROPUESTA.md):

| Fase | PR | Contenido |
|---|---|---|
| 0-1 | [#1](https://github.com/andres1006/One-million-PT/pull/1) | Scaffold Next 16 + shadcn + dominio + MSW con seed de 16 leads. |
| 2-3 | [#2](https://github.com/andres1006/One-million-PT/pull/2) | Layout + CRUD completo de leads (tabla, filtros URL-sync, form RHF+Zod, detalle, delete con confirm). |
| 4   | [#3](https://github.com/andres1006/One-million-PT/pull/3) | Dashboard: KPIs, tendencia 14 días (AreaChart), distribución por fuente (BarChart), recent leads. |
| 5   | [#4](https://github.com/andres1006/One-million-PT/pull/4) | Resumen IA: route `/api/ai-summary`, heurístico fallback, historial en localStorage. |
| 6   | [#5](https://github.com/andres1006/One-million-PT/pull/5) | Polish: error boundaries, 404, skip-to-content, `role="banner"`. |
| 7-8 | #6  | Tests (Vitest + RTL, 44 casos) + README final + deploy config. |

## 📎 Recursos

- Plan / HU / riesgos / DoD: [`docs/PROPUESTA.md`](./docs/PROPUESTA.md).
- Inspiración UI: [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md).

---

Hecho con cariño para One Million Copy SAS · 2026.
