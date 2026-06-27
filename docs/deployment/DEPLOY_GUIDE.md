# Deploy Guide — VenxPOS SaaS

## Requisitos previos

- Supabase project `beacnoxukkoellhecofm`
- SaaS migrations aplicadas (tenants, plans, subscriptions, branch_accounts)
- POS migration `20260619_saas_pos_integration.sql` aplicada
- Node.js 20+

## Build

```bash
npm install
npm run build
```

Output en `dist/` — static SPA. Servir desde cualquier CDN/hosting estático.

## Variables de entorno (`.env.local`)

```
VITE_SUPABASE_URL=https://beacnoxukkoellhecofm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
VITE_SAAS_URL=http://localhost:5174
```

## Base de datos

### Migraciones (orden de aplicación)

1. `supabase/migrations/20260619_saas_core.sql` — SaaS tables (tenants, plans, subscriptions, branch_accounts, etc.)
2. `supabase/migrations/20260619_saas_pos_integration.sql` — `get_subscription_info()` RPC + backfill

### Verificación post-deploy

```sql
-- Verificar que la RPC existe y funciona
SELECT get_subscription_info();

-- Verificar branch_accounts para usuarios existentes
SELECT COUNT(*) FROM branch_accounts WHERE activo = true;

-- Verificar planes seed
SELECT * FROM plans WHERE activo = true;
```

## Flujo de registro SaaS → POS

1. Cliente visita `https://app.venxpos.com` (SaaS frontend)
2. Selecciona plan → completa registro → paga con Wompi
3. SaaS activa tenant, crea sucursal + usuario admin
4. Usuario recibe credenciales y descarga VenxPOS
5. Inicia sesión en VenxPOS → validación de suscripción → acceso al POS

## Tauri desktop build

```bash
npm run tauri build
```

## Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| "Suscripción vencida" al iniciar sesión | subscription_status != active | Verificar estado en tabla subscriptions. Renovar desde SaaS |
| 404 en `get_subscription_info()` | Migration no aplicada | Ejecutar `20260619_saas_pos_integration.sql` |
| RLS bloquea operaciones | usuario no tiene branch_accounts | Ejecutar backfill SQL de la migration |
| Plan muestra "basico" incorrecto | Tenant sin subscription activa | Verificar tabla subscriptions para el tenant |
