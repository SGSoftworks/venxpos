# VenxPos — AGENTS.md

## Stack

- **Frontend**: React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4
- **State**: Zustand 5 (`src/store/useAppStore.ts`)
- **Database**: Supabase (PostgreSQL) — fuente única de verdad. Sin SQLite local.
- **Auth**: Supabase Auth (JWT + RLS)
- **No router** — app es single-screen POS

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | `eslint .` |


## Critical TypeScript config (`tsconfig.app.json`)

- `"verbatimModuleSyntax": true` — must use `import type` for type-only imports
- `"erasableSyntaxOnly": true` — no `enum` keyword; use union types
- `"noUnusedLocals": true`, `"noUnusedParameters": true`

## Architecture

### Online-First Supabase
Todas las operaciones son directas contra Supabase vía REST API. No existe base de datos local.

### SaaS Multi-Tenant (v2.1)
El POS es un **cliente SaaS**. La gestión de suscripciones, pagos y tenants está encapsulada en `venxpos-saas`. El POS solo conoce `sucursal_id` y `usuario_id`.

**Validación de suscripción**: Al iniciar sesión, `get_subscription_info()` RPC retorna plan, estado y renovación. Si `subscription_status != 'active'`, se bloquea el acceso.

**Relación 1:1**: 1 usuario = 1 sucursal. Sin selector de sucursal. Sin multi-sucursal.

### Login (`src/components/Login.tsx`)
Supabase Auth → `usuarios` profile → `get_subscription_info()` RPC → validación suscripción → Zustand session + subscription.

### Session (`src/App.tsx`)
`supabase.auth.getSession()` → si existe, carga perfil + `get_subscription_info()` → POSLayout. Si no, Login.

### POS (`src/components/POSLayout.tsx`)
Búsqueda de productos contra Supabase. Carrito en Zustand. Pago directo a Supabase (insert ventas + detalles + decrementar_inventario).

### Inventario (`src/components/InventoryManager.tsx`)
CRUD contra Supabase. Importación Excel con upsert. Exportación PDF/Excel con `showSaveFilePicker`.

### Cierre Caja (`src/components/CashRegisterClose.tsx`)
Flujo unificado: efectivo contado → confirmación → PDF cierre → logout con countdown 3s.

### Configuración (`src/components/ConfigPanel.tsx`)
Datos de sucursal + sección Suscripción (plan, estado, renovación, botón "Administrar suscripción" → SaaS).

### Barcode Scanner (`src/lib/barcodeScanner.ts`)
Keydown global con buffer. Timeout 60ms. Compatible con cualquier lector HID.

### Impuestos (IVA incluido)
Precio final = precio público. IVA extraído internamente: `base = subtotal / (1 + tasa)`.

### Receipt (`src/components/Receipt.tsx`)
CSS `hidden print:block`. `window.print()` para ticket. Usa `subscription.sucursal_nombre` del store.

### Icons (`src/components/Icons.tsx`)
20+ SVG inline components. `CloseX`, `Check`, `CircleCheck`, `Cart`, `Chart`, `Banknote`, `Gear`, etc.

### Connection Guard (`src/components/ConnectionGuard.tsx`)
Bloquea acceso sin internet. `navigator.onLine` + event listeners.

## Conventions

- All code, comments, and UI text are in **Spanish**.
- Components in `src/components/`, lib in `src/lib/`, store in `src/store/`.
- Database column names use `snake_case`.
- All styling is Tailwind utility classes.
- Buttons use `cursor: pointer` globally (index.css).
- Modal pattern: backdrop `onClick={onClose}` + content `onClick={e.stopPropagation()}` + ESC `useEffect`.
- Icons are SVG (not emojis). Import from `./Icons`.

## Key Files

| File | Purpose |
|------|---------|
| `supabase_schema.sql` | Schema + RLS + RPCs (source of truth) |
| `supabase/migrations/` | Migraciones incrementales |
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/store/useAppStore.ts` | Zustand: session, subscription, cart, IVA |
| `src/components/POSLayout.tsx` | Main POS view |
| `src/components/PaymentModal.tsx` | Payment flow |
| `src/components/CashRegisterClose.tsx` | Cash close unified flow |
| `src/components/Login.tsx` | Auth + subscription validation |
| `src/components/ConfigPanel.tsx` | Branch settings + subscription info |
| `src/components/Icons.tsx` | SVG icon library |
| `src/lib/saveFile.ts` | Cross-platform save dialog |
| `src/lib/pdfExport.ts` | jsPDF + saveFile |
| `src/lib/barcodeScanner.ts` | Global barcode detection |
