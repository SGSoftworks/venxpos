# Seguridad — VenxPos

## Autenticación

- **Supabase Auth**: JWT con `persistSession: true` (localStorage)
- **Login**: `supabase.auth.signInWithPassword()`
- **Logout**: `supabase.auth.signOut()` + `localStorage.clear()`
- **Sesión persistente**: `supabase.auth.getSession()` en App.tsx mount

## Roles

| Rol | Permisos |
|-----|---------|
| **Admin General** | >1 sucursal como admin en `usuario_sucursal`. Cambia sucursal, ve todas, opera solo en principal |
| **Admin Sucursal** | 1 sucursal. Opera caja, gestiona inventario, no cambia sucursal |
| **Cajero** | Opera caja, vende, no cambia sucursal |

## Row Level Security

Todas las tablas tienen RLS activado. Ningún usuario puede leer/escribir datos de sucursales no asignadas.

Políticas INSERT usan `sucursal_id IN (SELECT get_user_sucursales())`.
Políticas SELECT usan `sucursal_id IN (SELECT get_user_sucursales())`.
Políticas Admin usan `is_admin()`.

## Multi-Sucursal

- `usuario_sucursal`: tabla junction con `usuario_id`, `sucursal_id`, `rol`, `activo`
- `usuarios.sucursal_principal_id`: sucursal operativa principal
- `canSwitchBranch`: solo Admin General (>1 sucursal como admin)
- `checkApertura` bloquea apertura en sucursal no principal

## Conexión

- `ConnectionGuard`: bloquea acceso sin `navigator.onLine`
- `navigator.onLine` listeners en `useAppStore.ts`
