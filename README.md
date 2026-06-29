# VenxPos — Punto de Venta

Sistema POS (Point of Sale) profesional para supermercados, minimercados y autoservicios colombianos.

## Características

- **POS en tiempo real** — operaciones directas sobre Supabase
- **Multi-sucursal** — administración de múltiples sucursales con roles por sucursal
- **Cierre de caja profesional** — flujo unificado con resumen fiscal
- **Inventario completo** — CRUD, importación Excel, exportación PDF/Excel/CSV
- **Lector de códigos de barras** — compatible con cualquier lector HID USB/Bluetooth
- **Venta libre** — venta sin código de barras por categoría
- **Productos por peso** — soporte EAN-13 con peso embebido
- **IVA incluido** — precios finales al público con cálculo fiscal automático
- **Reportes** — ventas, métodos de pago, cierres, movimientos
- **Conexión obligatoria** — requiere internet, arquitectura online-first

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19 + TypeScript + Vite 8 |
| **Estilos** | Tailwind CSS 4 |
| **Estado** | Zustand 5 |
| **Base de datos** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (JWT + RLS) |
| **PDF** | jsPDF + jspdf-autotable |
| **Excel** | SheetJS (xlsx) |

## Instalación

```bash
git clone <repo-url>
cd venxpos
npm install
```

### Variables de entorno

Crear `.env.local`:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Desarrollo

```bash
npm run dev        # Vite dev server (puerto 5173)
```

## Build Producción

```bash
npm run build       # TypeScript + Vite bundle
```

## Estructura

```
venxpos/
├── src/
│   ├── components/    # Componentes React
│   ├── lib/           # Utilidades (supabase, pdfExport, saveFile, barcodeScanner)
│   └── store/         # Zustand (useAppStore)
├── docs/              # Documentación
│   ├── architecture/  # Arquitectura del sistema
│   ├── qa/            # Checklists y casos de prueba
│   ├── user-manual/   # Manual de usuario
│   ├── technical/     # Documentación técnica
│   └── audits/        # Auditorías
├── supabase_schema.sql # Esquema Supabase (fuente única de verdad)
└── package.json
```

## Seguridad

- Row Level Security (RLS) en todas las tablas
- Autenticación JWT via Supabase Auth
- Roles: Cajero, Admin Sucursal, Admin General
- Multi-sucursal con aislamiento de datos por `usuario_sucursal`

## Licencia

MIT — Venx Tecnología SAS © 2026
