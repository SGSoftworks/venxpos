# Multi-Tenant Model — VenxPOS

## Jerarquía

```
superadmins (platform level — SaaS admin panel)
    └── tenants (businesses — creados en SaaS)
         ├── empresas (1 por tenant, creado en activación)
         │    └── sucursales (1..N por empresa, según plan)
         │         ├── usuarios (cajero/admin, 1:1 con sucursal)
         │         ├── productos, inventario_sucursal
         │         ├── ventas, venta_detalles
         │         ├── cierres_caja, aperturas_caja
         │         └── configuracion_fiscal
         ├── branch_accounts (mapping auth.user → tenant → sucursal)
         ├── subscriptions (plan activo, estado, renovación)
         ├── subscription_events (auditoría de ciclo de vida)
         └── payments (historial de pagos Wompi)
```

## Aislamiento por tenant

Cada tenant tiene:
- **Empresa propia**: 1 registro en `empresas` con `tenant_id`
- **Sucursales propias**: N sucursales vinculadas a su empresa
- **Usuarios propios**: auth.users vinculados vía `branch_accounts`
- **Inventario independiente**: productos e inventario por sucursal
- **Ventas independientes**: ventas con `sucursal_id` → scoping RLS
- **Cierres independientes**: cierres por sucursal

## Planes y límites

| Plan | Max Sucursales | Precio Inicial | Precio Mensual |
|------|---------------|----------------|----------------|
| Básico | 2 | $150,000 COP | $80,000 COP |
| Estándar | 5 | $250,000 COP | $150,000 COP |
| Pro | 10 | $400,000 COP | $250,000 COP |
| Empresarial | Ilimitado | Personalizado | Personalizado |

## RLS — Row Level Security

Todas las tablas POS usan `get_user_sucursal()` para scoping:
```sql
CREATE POLICY "Leer productos" ON productos FOR SELECT
USING (sucursal_id = get_user_sucursal());
```

Las tablas SaaS usan políticas independientes basadas en `get_tenant_id()` y `is_superadmin()`.

## Relación POS ↔ SaaS

```
POS                          SaaS
───                          ────
get_subscription_info()  ←→  subscriptions + plans
(solo lectura)               (gestión completa)

sucursal_id               ←  branch_accounts
usuario_id                    (mapeo auth → tenant → sucursal)

NO conoce                  →  Wompi, pagos, facturación
NO conoce                  →  precios de planes
NO conoce                  →  gestión de tenants
```

## Ciclo de vida del tenant

1. **Registro**: Usuario crea cuenta en SaaS, elige plan
2. **Pago**: Procesa pago inicial vía Wompi (Edge Function `create-payment`)
3. **Activación**: Webhook Wompi → `activate_tenant()` → crea empresa + sucursal + usuario admin
4. **Operación**: Usuario inicia sesión en VenxPOS → valida suscripción activa → opera POS
5. **Renovación**: `renew-subscriptions` Edge Function (diario) → cobro recurrente vía Wompi
6. **Cancelación**: SaaS marca subscription `cancelled` → POS bloquea acceso
