# Design System — VenxPos

## Tokens (CSS Custom Properties)

Definidos en `src/index.css` bajo `:root`:

| Token | Valor | Uso |
|-------|-------|-----|
| `--primary` | `#2563eb` | Botones principales, enlaces |
| `--primary-hover` | `#1d4ed8` | Hover de botones |
| `--success` | `#16a34a` | Estados positivos, check |
| `--warning` | `#d97706` | Alertas, stock bajo |
| `--danger` | `#dc2626` | Errores, delete |
| `--surface` | `#ffffff` | Cards, modales |
| `--surface-hover` | `#f8fafc` | Hover cards/rows |
| `--border` | `#e5e7eb` | Bordes estándar |
| `--text-primary` | `#111827` | Texto principal |
| `--text-secondary` | `#6b7280` | Texto secundario |
| `--radius-sm` | `6px` | Botones, inputs |
| `--radius-md` | `12px` | Cards |
| `--radius-lg` | `16px` | Modales grandes |
| `--shadow-soft` | `0 1px 3px rgba(0,0,0,.04)` | Cards |
| `--shadow-medium` | `0 4px 12px rgba(0,0,0,.06)` | Modales |

## Animaciones

| Keyframe | Duración | Easing | Uso |
|----------|----------|--------|-----|
| `fadeIn` | 300-400ms | ease-out | Modales, cards, texto |
| `scaleIn` | 200-500ms | ease-out | Modales, login logo |
| `slideUp` | 300ms | ease-out | Contenido staggered |
| `pulseGlow` | 2s | ease | Indicador activo |
| `progressBar` | 3s | linear | Cierre caja countdown |

## Componentes Base

### Modal
```
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
  <div className="bg-white rounded-xl shadow-lg border border-gray-200 animate-[scaleIn_200ms_ease-out]" onClick={e.stopPropagation()}>
    {/* header con ✕ button */}
    {/* contenido */}
  </div>
</div>
```

Patrón consistente en 14/14 modales.

### Empty State
```
<div className="flex items-center justify-center h-64 text-gray-400">
  <div className="text-center">
    <div className="text-5xl mb-4">{icono}</div>
    <p className="text-lg font-medium text-gray-500">{título}</p>
    <p className="text-sm mt-1">{sugerencia}</p>
  </div>
</div>
```

### Skeleton Loader
```
{loading ? (
  <div className="space-y-2 p-2">
    {[1,2,3,4,5].map(i => (
      <div key={i} className="animate-pulse flex gap-3 p-3 bg-white rounded-lg border border-gray-100">
        <div className="h-4 bg-gray-200 rounded" style={{width: 'var(--col-width)'}} />
      </div>
    ))}
  </div>
) : (
  <table>...</table>
)}
```

## Tablas

- **Zebra**: `tr:nth-child(even) { background-color: #fafafa; }` (CSS global)
- **Hover**: `tr:hover { background-color: #f1f5f9 !important; }` (CSS global)
- **Sticky header**: `thead th { position: sticky; top: 0; }` (CSS global)
- **Focus**: `button:focus-visible { outline: 2px solid #3b82f6; }` (CSS global)

## Botones

- **Active feedback**: `button:active:not(:disabled) { transform: scale(0.97); }` (CSS global)
- **Cursor**: `button { cursor: pointer; }` (CSS global)
- **Primarios**: `bg-blue-600 text-white hover:bg-blue-700`
- **Secundarios**: `bg-white border border-gray-300 text-gray-700 hover:bg-gray-50`
- **Peligro**: `bg-red-500 text-white hover:bg-red-600`

## Colores por Contexto

| Contexto | Fondo | Borde | Texto |
|----------|-------|-------|-------|
| Éxito | `bg-green-100` | `border-green-200` | `text-green-600` |
| Advertencia | `bg-amber-100` | `border-amber-200` | `text-amber-600` |
| Error | `bg-red-50` | `border-red-200` | `text-red-700` |
| Info | `bg-blue-50` | `border-blue-200` | `text-blue-700` |
