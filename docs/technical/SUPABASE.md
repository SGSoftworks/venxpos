# Tablas Supabase — VenxPos

## Tablas Principales

| Tabla | Descripción | RLS |
|-------|------------|-----|
| `sucursales` | Sucursales del sistema | Lectura por sucursal asignada |
| `usuarios` | Vinculados a `auth.users` | Lectura por sucursal |
| `usuario_sucursal` | Junction: usuario ↔ sucursal con rol | Lectura propias + Admin gestiona |
| `productos` | Catálogo de productos por sucursal | Admin gestiona |
| `inventario_sucursal` | Stock por sucursal/producto | Admin gestiona |
| `categorias` | Categorías de producto | Admin gestiona |
| `aperturas_caja` | Aperturas de turno | Insertar/Leer por sucursal |
| `cierres_caja` | Cierres Z | Insertar/Leer por sucursal |
| `ventas` | Ventas realizadas | Insertar/Leer por sucursal |
| `venta_detalles` | Líneas de venta | Insertar/Leer por sucursal |
| `eventos_auditoria` | Auditoría operativa | Insertar/Leer por sucursal |
| `movimientos_inventario` | Trazabilidad de stock | Insertar/Leer por sucursal |
| `devoluciones` | Devoluciones/NC | Insertar/Leer por sucursal |
| `ventas_conflicto` | Conflictos de stock | Admin gestiona |
| `configuracion_fiscal` | Config fiscal por sucursal | Admin gestiona |

## RPCs (Remote Procedure Calls)

| RPC | Propósito | Parámetros |
|-----|----------|------------|
| `get_user_sucursal()` | Sucursal actual del usuario | — |
| `get_user_sucursales()` | Todas las sucursales del usuario | — |
| `get_user_sucursal_principal()` | Sucursal principal del usuario | — |
| `is_admin()` | ¿Es admin? | — |
| `is_admin_general()` | ¿Admin con >1 sucursal? | — |
| `can_switch_branch()` | ¿Puede cambiar sucursal? | — |
| `decrementar_inventario()` | Decrementa stock con optimistic locking | sucursal_id, producto_id, cantidad, venta_id, usuario_id |
| `incrementar_inventario()` | Incrementa stock (devoluciones) | sucursal_id, producto_id, cantidad, devolucion_id, usuario_id |
| `next_ticket_number()` | Genera número de ticket | sucursal_id |

## RLS Policies

Todas las tablas tienen Row Level Security activado. Las políticas usan:
- `get_user_sucursal()` para filtrado por sucursal única
- `get_user_sucursales()` para filtrado multi-sucursal
- `is_admin()` para permisos de administración
