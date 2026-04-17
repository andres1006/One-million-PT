# OMC · Leads — Prueba técnica frontend

Aplicación web **100% frontend** para administrar leads de **One Million Copy SAS**: visualización, filtros, CRUD, dashboard y resumen ejecutivo con IA.

> **Estado:** Fase 0 (scaffold) + Fase 1 (dominio + mocks + layout). El CRUD, dashboard y módulo de IA se implementan en las siguientes fases del plan en [`docs/PROPUESTA.md`](./docs/PROPUESTA.md).

## 🧱 Stack

| Área | Elección |
|---|---|
| Framework | **Next.js 15** (App Router) + TypeScript `strict` |
| Styling | **Tailwind CSS v4** |
| UI Kit | **shadcn/ui** (tema *base-nova*, Geist Sans/Mono) |
| Formularios | React Hook Form + Zod |
| Estado remoto | TanStack Query |
| Estado local UI | Zustand |
| Mocks | **MSW** (Mock Service Worker) |
| Gráficas | Recharts |
| Theming | `next-themes` (claro / oscuro / system) |
| Notificaciones | Sonner |
| Iconos | lucide-react |

### ¿Por qué este stack?

- **Next.js** nos da SSR opcional, API routes (para la ruta `/api/ai-summary`) y deploy 1-click en Vercel sin infra adicional.
- **shadcn/ui** aporta componentes accesibles (Radix / Base UI), copiados al repo para tener control total sin lock-in.
- **MSW** simula la API a nivel de red, así el código de producción no cambia si luego conectamos un backend real.
- **React Hook Form + Zod** dan validaciones declarativas, performance y un único schema como fuente de verdad.
- **TanStack Query** encapsula loading/error/cache/invalidation sin reinventar ruedas.

## 🗂️ Arquitectura

Capas inspiradas en Clean Architecture (livianas, sin over-engineering):

```
src/
├── app/                       # App Router (pages, layout, providers)
├── components/
│   ├── layout/                # Sidebar, Header, ThemeToggle, AppShell
│   └── ui/                    # shadcn components
├── domain/                    # Types + schemas Zod (framework-agnostic)
├── infrastructure/
│   ├── api/                   # LeadsRepository (interface + http impl)
│   └── mocks/                 # MSW handlers + seed de 15 leads
└── lib/                       # utils, constants, formatters, query-client
```

Principios aplicados:

- **SRP:** cada carpeta/archivo hace una cosa. Un *repository* no formatea fechas; un *component* no conoce `fetch`.
- **DIP:** la UI depende de la **interfaz** `LeadsRepository`, no de la implementación — hoy es HTTP + MSW, mañana puede ser un backend real sin tocar la UI.
- **Clean Code:** nombres explícitos en español alineados al dominio (`fuente`, `presupuesto`, `fecha_creacion`), funciones pequeñas, sin magic numbers.

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

Abre <http://localhost:3000>.

### Scripts

```bash
pnpm dev           # Dev server (Turbopack)
pnpm build         # Build de producción
pnpm start         # Sirve el build
pnpm lint          # ESLint
pnpm typecheck     # tsc --noEmit
pnpm format        # Prettier (write)
pnpm format:check  # Prettier (check)
```

## 🧪 Mocks (MSW)

Con `NEXT_PUBLIC_MOCKS=on` (default en `.env.example`), antes de montar la app se arranca un **Service Worker** que intercepta las llamadas a `/api/*` en el navegador y responde desde [`src/infrastructure/mocks/handlers.ts`](./src/infrastructure/mocks/handlers.ts) usando el seed de [`src/infrastructure/mocks/seed.ts`](./src/infrastructure/mocks/seed.ts) (**16 leads**, > mínimo exigido).

Endpoints simulados:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/leads` | Listado paginado + filtros (`q`, `source`, `from`, `to`, `page`, `pageSize`, `sort`) |
| `GET` | `/api/leads/stats` | Métricas agregadas para el dashboard |
| `GET` | `/api/leads/:id` | Detalle |
| `POST` | `/api/leads` | Crea un lead (valida con Zod) |
| `PATCH` | `/api/leads/:id` | Actualiza |
| `DELETE` | `/api/leads/:id` | Elimina |

Para desactivar MSW: `NEXT_PUBLIC_MOCKS=off`.

## 🔐 Variables de entorno

Ver [`.env.example`](./.env.example).

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_MOCKS` | `on` / `off`. Activa MSW en el cliente. |
| `OPENAI_API_KEY` | Opcional. Si está presente el endpoint `/api/ai-summary` usa GPT; si no, cae al generador heurístico local. |

## 🧭 Rutas

| Ruta | Contenido |
|---|---|
| `/` | Landing + accesos directos. En Fase 4 se convierte en el dashboard con métricas. |
| `/leads` | Tabla de leads con filtros (Fase 3). |
| `/ai-summary` | Generador de resumen ejecutivo (Fase 5). |

## ✅ Próximas fases

Detalladas en [`docs/PROPUESTA.md`](./docs/PROPUESTA.md):

- Fase 2 — Layout + providers (✅ incluido aquí).
- Fase 3 — CRUD de leads (tabla, filtros, formularios, detalle, delete).
- Fase 4 — Dashboard (StatCards + charts).
- Fase 5 — AI Summary (ruta `/api/ai-summary` + UI).
- Fase 6 — Calidad (a11y, microinteracciones, responsive).
- Fase 7 — Tests (Vitest + Testing Library).
- Fase 8 — Docs finales + deploy en Vercel.

---

**Autor:** [andres1006](https://github.com/andres1006) — Prueba técnica One Million Copy SAS.
