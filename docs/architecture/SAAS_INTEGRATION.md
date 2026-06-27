# SaaS Integration — VenxPOS

## Resumen

VenxPOS es el cliente POS. La gestión SaaS (planes, pagos, tenants, suscripciones) está en `venxpos-saas`. Ambos comparten la misma instancia Supabase.

## Separación de responsabilidades

| Dominio | Responsable |
|---------|------------|
| Planes, precios, features | `venxpos-saas` (Dashboard + Admin) |
| Pagos (Wompi) | `venxpos-saas` (Edge Functions) |
| Creación de tenants y sucursales | `venxpos-saas` (Edge Function `create-branch`) |
| Gestión de suscripciones | `venxpos-saas` (Edge Function `renew-subscriptions`) |
| Validación de suscripción activa | **VenxPOS** (`get_subscription_info()` RPC) |
| Operaciones POS (ventas, inventario, cierres) | **VenxPOS** |
| Visualización de plan en configuración | **VenxPOS** (ConfigPanel) |

## Flujo de integración

```
1. Cliente se registra en SaaS → paga → tenant activo
2. SaaS crea sucursal + usuario admin (create-branch Edge Function)
3. Usuario descarga VenxPOS e inicia sesión
4. VenxPOS llama get_subscription_info() → valida suscripción activa
5. Si activa: acceso al POS con datos de su sucursal
6. Si vencida: mensaje "Suscripción vencida" y bloqueo
```

## RPC: `get_subscription_info()`

**Archivo**: `supabase/migrations/20260619_saas_pos_integration.sql`

Retorna JSON con:
- `sucursal_nombre`: nombre de la sucursal del usuario
- `plan`: nombre del plan (basico, estandar, pro, empresarial)
- `subscription_status`: active, past_due, cancelled, expired
- `proximo_cobro`: fecha de próxima renovación (ISO 8601)
- `max_sucursales`: límite de sucursales del plan

La función es `SECURITY DEFINER` — navega internamente `usuarios → sucursales → empresas → tenants → subscriptions → plans` sin exponer la estructura al POS.

## Aislamiento de datos

- **RLS**: Cada tabla POS usa `get_user_sucursal()` para scoping por sucursal
- **SaaS**: Las tablas `tenants`, `subscriptions`, `payments`, `branch_accounts` tienen RLS independiente
- **POS nunca accede directamente a tablas SaaS** (solo vía RPC)

## Cambios en esta integración (2026-06-19)

### Agregado
- `get_subscription_info()` RPC en Supabase
- `SubscriptionInfo` interface en Zustand store
- Bloqueo de acceso por suscripción en Login
- Sección Suscripción en ConfigPanel
- Backfill de `branch_accounts` para usuarios existentes

### Eliminado
- `BranchInfo` del store (reemplazado por `subscription.sucursal_nombre`)
- `isSyncing`, `lastSyncAt`, `syncError` del store (vestigios de sync worker)
- `ShiftCloseSummary.tsx` (dead code)
- `crypto.ts` (dead code)
- `pendingSyncCount` y su useEffect en POSLayout

### Sin cambios
- Tablas POS existentes
- RLS policies
- Ventas e inventario históricos
- Flujo de pago, cierre, reportes, inventario
