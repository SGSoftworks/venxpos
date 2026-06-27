# Migración Offline-First → Online-First Supabase

## Fecha: 2026-06-19
## Arquitecto: VenxPos Team

---

## 1. Auditoría de Dependencias SQLite

### 1.1 Archivos que dependen de SQLite (24 archivos)

| Archivo | `getDb()` | `db.select()` | `db.execute()` | Tablas accedidas |
|---------|-----------|---------------|----------------|------------------|
| `src/lib/db.ts` | - | - | - | Crea todas las tablas |
| `src/lib/migrations.ts` | - | - | - | Migraciones de esquema |
| `src/lib/syncWorker.ts` | ✅ | ✅ | ✅ | `ventas_offline`, `eventos_auditoria_offline`, `local_inventario`, `local_categorias`, `devoluciones_offline`, `local_productos`, `local_movimientos_inventario`, `local_aperturas_caja`, `cierres_caja_offline` |
| `src/lib/reports.ts` | ✅ | ✅ | - | `ventas_offline`, `venta_detalles_offline`, `eventos_auditoria_offline`, `local_movimientos_inventario`, `cierres_caja_offline`, `local_aperturas_caja` |
| `src/App.tsx` | ✅ | ✅ | ✅ | `local_session` |
| `src/components/Login.tsx` | ✅ | - | ✅ | `local_productos`, `local_inventario`, `local_categorias`, `local_sucursales`, `local_usuarios`, `local_session`, `eventos_auditoria_offline` |
| `src/components/POSLayout.tsx` | ✅ | ✅ | - | `local_productos`, `local_aperturas_caja`, `local_session` |
| `src/components/PaymentModal.tsx` | ✅ | ✅ | ✅ | `ventas_offline`, `venta_detalles_offline`, `local_inventario`, `local_movimientos_inventario` |
| `src/components/InventoryManager.tsx` | ✅ | ✅ | ✅ | `local_productos`, `local_inventario`, `local_categorias` |
| `src/components/CashRegisterClose.tsx` | ✅ | ✅ | ✅ | `local_aperturas_caja`, `ventas_offline`, `venta_detalles_offline`, `cierres_caja_offline`, `eventos_auditoria_offline` |
| `src/components/BranchSelector.tsx` | ✅ | ✅ | ✅ | `local_sucursales`, `local_productos`, `local_inventario`, `local_categorias`, `local_usuarios`, `local_session` |
| `src/components/Dashboard.tsx` | ✅ | ✅ | - | `ventas_offline`, `local_productos`, `local_inventario`, `eventos_auditoria_offline`, `local_aperturas_caja`, `cierres_caja_offline`, `local_usuarios` |
| `src/components/AdminOverrideModal.tsx` | ✅ | ✅ | - | `local_usuarios` |
| `src/components/AperturaTurnoModal.tsx` | ✅ | - | ✅ | `local_aperturas_caja` |
| `src/components/BackupRestore.tsx` | ✅ | ✅ | ✅ | Todas las tablas |
| `src/components/ConfigPanel.tsx` | ✅ | ✅ | ✅ | `local_sucursales`, `local_session` |
| `src/components/FreeSaleModal.tsx` | ✅ | ✅ | ✅ | `local_productos`, `local_inventario` |
| `src/components/QuickStockAdjust.tsx` | ✅ | ✅ | ✅ | `local_productos`, `local_inventario`, `local_movimientos_inventario` |
| `src/components/Receipt.tsx` | ✅ | ✅ | - | `local_session` |
| `src/components/ReportsPanel.tsx` | ✅ | ✅ | - | `local_sucursales` |
| `src/components/ReturnModal.tsx` | ✅ | ✅ | ✅ | `ventas_offline`, `venta_detalles_offline`, `devoluciones_offline`, `devolucion_detalles_offline`, `local_inventario`, `local_movimientos_inventario` |
| `src/components/SaleHistory.tsx` | ✅ | ✅ | - | `ventas_offline`, `venta_detalles_offline`, `local_productos` |
| `src/components/StockAdjustmentModal.tsx` | ✅ | ✅ | ✅ | `local_inventario`, `local_movimientos_inventario`, `eventos_auditoria_offline` |
| `src/components/SyncManager.tsx` | ✅ | ✅ | - | `ventas_offline`, `eventos_auditoria_offline` |

---

## 2. Tablas SQLite (17 tablas)

| Tabla Local | Equivalente Supabase | Estado |
|-------------|---------------------|--------|
| `local_session` | Zustand + `supabase.auth` | **Eliminar** |
| `local_productos` | `productos` | **Migrar a Supabase directo** |
| `local_inventario` | `inventario_sucursal` | **Migrar a Supabase directo** |
| `local_categorias` | `categorias` | **Migrar a Supabase directo** |
| `local_usuarios` | `usuarios` | **Migrar a Supabase directo** |
| `local_sucursales` | `sucursales` | **Migrar a Supabase directo** |
| `local_aperturas_caja` | `aperturas_caja` | **Migrar a Supabase directo** |
| `local_movimientos_inventario` | `movimientos_inventario` | **Migrar a Supabase directo** |
| `ventas_offline` | `ventas` | **Migrar a Supabase directo** |
| `venta_detalles_offline` | `venta_detalles` | **Migrar a Supabase directo** |
| `cierres_caja_offline` | `cierres_caja` | **Migrar a Supabase directo** |
| `eventos_auditoria_offline` | `eventos_auditoria` | **Migrar a Supabase directo** |
| `devoluciones_offline` | `devoluciones` | **Migrar a Supabase directo** |
| `devolucion_detalles_offline` | `devolucion_detalles` | **Migrar a Supabase directo** |
| `_migrations` | - | **Eliminar** |
| `venxpos_local.db` | - | **Eliminar** |

---

## 3. Código a Eliminar

| Archivo | Líneas | Razón |
|---------|--------|-------|
| `src/lib/db.ts` | ~233 | Singleton SQLite, initLocalDb, PRAGMA |
| `src/lib/migrations.ts` | ~230 | Migraciones de esquema SQLite |
| `src/lib/syncWorker.ts` | ~897 | Cola de sincronización offline |
| `src/components/SyncManager.tsx` | ~150 | UI de gestión de sync |
| `src/components/BackupRestore.tsx` | ~170 | Backup/Restore SQLite |

### Dependencia npm a eliminar

```json
"@tauri-apps/plugin-sql": "^x.x.x"
```

### Config Tauri a limpiar

```json
// Eliminar de tauri.conf.json:
"plugins": {
    "sql": { ... }
}
```

---

## 4. Nuevo Modelo Online-First

```
┌─────────────────────────────────────────────────┐
│                    Tauri Desktop                 │
│  ┌─────────────────────────────────────────┐   │
│  │              React App                   │   │
│  │  ┌───────────────────────────────────┐  │   │
│  │  │        ConnectionGuard            │  │   │
│  │  │   ¿Internet? → Sí → Render App   │  │   │
│  │  │   ¿Internet? → No → "Sin conex"  │  │   │
│  │  └───────────────────────────────────┘  │   │
│  │                                          │   │
│  │  Zustand (solo cache UI)                 │   │
│  │    • session, cart, activeBranch        │   │
│  │    • sin datos de negocio               │   │
│  │                                          │   │
│  │  Supabase Client (única fuente)          │   │
│  │    • productos, inventario, ventas       │   │
│  │    • auth, categorías, sucursales        │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────┐
              │      Supabase       │
              │   (única fuente)    │
              └─────────────────────┘
```

---

## 5. Plan de Fases

| Fase | Descripción | Archivos |
|------|------------|----------|
| 1 | Auditoría | Este documento |
| 2 | Eliminar syncWorker, db.ts, migrations.ts | 5 archivos |
| 3 | ConnectionGuard | 1 archivo nuevo |
| 4 | Migrar Login + App.tsx | 2 archivos |
| 5 | Migrar POSLayout + PaymentModal | 2 archivos |
| 6 | Migrar InventoryManager | 1 archivo |
| 7 | Migrar modales restantes | 10 archivos |
| 8 | Migrar Reportes + Dashboard | 3 archivos |
| 9 | Limpiar dependencias | package.json, tauri.conf.json |
| 10 | QA + Docs | 4 archivos |
