# Arquitectura VenxPos — Online-First

## Visión General

```
┌─────────────────────────────────────────────────┐
│                 Tauri Desktop                    │
│  ┌──────────────────────────────────────────┐   │
│  │             React App                     │   │
│  │  ┌────────────────────────────────────┐   │   │
│  │  │      ConnectionGuard               │   │   │
│  │  │   navigator.onLine → Render App    │   │   │
│  │  │   !online → "Sin conexión"         │   │   │
│  │  └────────────────────────────────────┘   │   │
│  │                                            │   │
│  │  Zustand (cache UI)                        │   │
│  │    • session, cart, activeBranch           │   │
│  │    • sin datos de negocio persistentes     │   │
│  │                                            │   │
│  │  Supabase Client (única fuente)            │   │
│  │    • REST API para CRUD                    │   │
│  │    • Auth JWT para sesión                  │   │
│  │    • RLS para multi-tenant                 │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                         │
                         ▼
            ┌─────────────────────┐
            │      Supabase       │
            │   (PostgreSQL)      │
            │   • Auth            │
            │   • RLS             │
            │   • REST API        │
            └─────────────────────┘
```

## Flujo de Autenticación

```
App.tsx mount
  ├─ supabase.auth.getSession()
  │   ├─ Session found → query usuario_sucursal → setSession() → POSLayout
  │   └─ No session → <Login />
  └─ Login.tsx handleLogin()
       ├─ supabase.auth.signInWithPassword()
       ├─ query usuarios (id, nombre, sucursal_principal_id)
       ├─ query usuario_sucursal (assignments)
       ├─ calcula canSwitchBranch (admin con >1 suc)
       └─ setSession() → POSLayout
```

## Flujo de Venta

```
User escanea/selecciona producto
  ├─ BarcodeScanner: keydown → buffer → Enter → callback
  └─ HandleSearchChange: debounce → supabase.from('productos').ilike()
       └─ User clicks → addToCart() (Zustand)

User presiona F10 → PaymentModal
  ├─ nextTicketNumber(): MAX(ticket_number)+1 from Supabase
  ├─ Stock check: supabase.from('inventario_sucursal').select('stock_actual')
  ├─ supabase.from('ventas').insert(...)
  ├─ supabase.from('venta_detalles').insert(...)
  ├─ supabase.rpc('decrementar_inventario') for each item
  ├─ setLastCompletedSale() → Receipt visible via print:block
  └─ window.print() → ticket
```

## Flujo de Cierre de Caja

```
User clicks "Cerrar Caja" → CashRegisterClose
  ├─ Loading: query aperturas_caja + ventas since opening
  ├─ Form: muestra resumen + input efectivo contado
  ├─ Confirm: "¿Desea cerrar el turno?"
  └─ Done:
       ├─ supabase.from('cierres_caja').insert(...)
       ├─ supabase.from('aperturas_caja').update({estado:'cerrada'})
       ├─ supabase.from('eventos_auditoria').insert(...)
       ├─ exportPdf() → saveFile()
       └─ onLogout: localStorage.clear() + signOut() + setSession(null)
```

## Flujo de Inventario

```
InventoryManager mount
  ├─ get_user_sucursales() RPC → sucursal IDs
  ├─ supabase.from('productos').select().in('sucursal_id', ids)
  ├─ supabase.from('inventario_sucursal').select().in('sucursal_id', ids)
  └─ Render table with stock colors (green/amber/red)

CRUD:
  ├─ Create: supabase.from('productos').insert() + inventario_sucursal.upsert()
  ├─ Update: supabase.from('productos').update()
  ├─ Delete: supabase.from('inventario_sucursal').delete() + productos.delete()
  └─ Import: XLSX.read() → upsert productos + inventario
```

## Multi-Sucursal

```
usuario_sucursal (junction table)
  ├─ usuario_id → usuarios.id
  ├─ sucursal_id → sucursales.id
  ├─ rol → 'admin' | 'cajero'
  └─ activo → boolean

usuarios.sucursal_principal_id → sucursal operativa principal

Admin General:
  ├─ canSwitchBranch = true (admin en >1 sucursal)
  ├─ Puede cambiar entre todas sus sucursales asignadas
  └─ Solo opera caja en sucursal_principal_id

Admin Sucursal / Cajero:
  ├─ canSwitchBranch = false
  └─ BranchSelector muestra nombre bloqueado (sin select)
```
