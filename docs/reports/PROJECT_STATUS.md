# Project Status — VenxPos

Fecha: 2026-06-19

## Porcentaje Real de Avance: **88%**

Basado en 26 funcionalidades (23 completadas, 3 pendientes).

## Qué está terminado ✅

- Sistema POS completo (búsqueda, escáner, carrito, venta libre, peso)
- Motor fiscal IVA incluido
- Inventario CRUD + import/export Excel
- Apertura y cierre de caja unificado
- Multi-sucursal con roles (Admin General, Admin Sucursal, Cajero)
- Reportes con exportación PDF/Excel/CSV
- Save dialog nativo (showSaveFilePicker)
- Conexión obligatoria (ConnectionGuard)
- UX/UI profesional (modales, animaciones, focus, cursor)
- Documentación completa
- Supabase online-first con RLS

## Qué falta ❌

| Ítem | Prioridad | Esfuerzo |
|------|-----------|----------|
| Tests automatizados | Alta | 2-3 días |
| CI/CD pipeline | Media | 1 día |
| Supabase Realtime (stock live updates) | Baja | 1-2 días |

## Qué es experimental ⚠️

- `next_ticket_number` RPC en Supabase tiene bug (cajero_id fake). Se usa fallback `MAX(ticket_number)+1` que funciona correctamente.

## Riesgos actuales

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Sin internet = inoperable | **Alto** | ConnectionGuard + recomendar 4G backup |
| Sin tests | **Alto** | QA manual con checklist |
| Dependencia total de Supabase | **Medio** | Supabase SLA 99.9% |
| Sin rollback de datos | **Medio** | Backups automáticos de Supabase |

## Deuda técnica

| Ítem | Impacto |
|------|---------|
| `usuarios.sucursal_id` aún existe (redundante con usuario_sucursal) | Bajo |
| `ShiftCloseSummary.tsx` es dead code (no se usa) | Bajo |
| `crypto.ts` es parcialmente dead code (solo hashPin/verifyPin se usaban, ya no) | Bajo |
| Reportes de productos/impuestos simplificados | Medio |

## Próximos pasos

1. Implementar tests automatizados (Jest + React Testing Library)
2. Configurar CI/CD (GitHub Actions)
3. Implementar Supabase Realtime para stock
4. Limpiar deuda técnica (drop column, remove dead files)
5. Pruebas de carga con múltiples sucursales
