# Arquitectura Multi-Sucursal — VenxPos

## Modelo de Datos

```
usuarios
  ├─ id (PK)
  ├─ user_id → auth.users(id)
  ├─ sucursal_principal_id → sucursales(id)
  └─ nombre, pin_acceso, estado

usuario_sucursal
  ├─ id (PK)
  ├─ usuario_id → usuarios(id)
  ├─ sucursal_id → sucursales(id)
  ├─ rol: 'admin' | 'cajero'
  └─ activo: boolean
```

## Roles

### Admin General
- **Definición**: usuario con `rol = 'admin'` en **>1** sucursal en `usuario_sucursal`
- `canSwitchBranch = true`
- BranchSelector: `<select>` con todas sus sucursales
- Puede ver dashboard, inventario, reportes de cualquier sucursal
- Solo opera caja en `sucursal_principal_id`
- `checkApertura` bloquea si `sucursal_id !== sucursal_principal_id`

### Admin Sucursal
- **Definición**: usuario con `rol = 'admin'` en **1 sola** sucursal
- `canSwitchBranch = false`
- BranchSelector: `<span>` bloqueado con nombre de sucursal
- Opera caja, inventario, reportes solo en su sucursal

### Cajero
- **Definición**: usuario con `rol = 'cajero'` en 1+ sucursales
- `canSwitchBranch = false`
- Igual que Admin Sucursal pero sin permisos de administración

## Funciones RLS

| Función | Retorna |
|---------|---------|
| `is_admin_general()` | `true` si admin en >1 sucursal activa |
| `can_switch_branch()` | Igual que `is_admin_general()` |
| `get_user_sucursal_principal()` | `sucursal_principal_id` o primera asignación |

## Aislamiento

- Todos los queries filtran por `sucursal_id`
- RLS refuerza el aislamiento a nivel de base de datos
- Inventario, ventas, cierres, aperturas: independientes por sucursal
- Admin General puede VER todo pero solo OPERAR en su principal
