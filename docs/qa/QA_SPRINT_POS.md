# QA — Sprint POS Comercial

## F1 — Navegación (Header + menú principal)

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Header muestra VENXPOS + sucursal + usuario + rol | Todo visible en topbar | | |
| Sincronización: indicador 🟢/🟡/🔴 visible | Dot colored según estado | | |
| Turno badge muestra "Turno HH:MM" o "Sin turno" | Badge actualizado | | |
| Nav Caja/Dashboard/Inventario/Reportes/Cerrar Caja | Cambian vista correctamente | | |
| Botón activo se muestra en azul | Estado visual correcto | | |
| Menú ⚙ se abre/cierra con click | Dropdown visible | | |
| Menú ⚙ contiene: Sincronización, Config, Stock, Backup, Ayuda, Atajos, Devolución, Historial, Reimprimir, BranchSelector | Todos los ítems presentes | | |
| Click fuera del menú ⚙ lo cierra | Dropdown se oculta | | |
| BranchSelector funcional dentro del menú | Cambio de sucursal funciona | | |

## F2 — Dashboard operativo

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Vista inicial al abrir app | Dashboard se muestra | | |
| Cards: Ventas Hoy, Caja, Último Cierre, Stock Bajo, Sincronización | Todas visibles | | |
| Alertas: agotados, stock bajo, sync pendientes, sync errors | Alertas visibles solo cuando hay datos | | |
| Últimas Ventas: tabla con hora, ticket, método, total | Datos correctos | | |
| Botones: Ir a Caja, Reportes, Historial | Funcionan | | |
| Refrescar datos cada 10s | Datos se actualizan | | |

## F3 — Apertura de turno obligatoria

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Sin apertura activa → modal de apertura se muestra | Modal forzado | | |
| Con apertura activa → POS funcional | Operaciones habilitadas | | |
| Cerrar caja → apertura se marca cerrada | Estado correcto | | |

## F4 — Búsqueda profesional

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Buscar por descripción (LIKE) | Resultados filtrados | | |
| Buscar por código de barras parcial (LIKE) | Resultados filtrados | | |
| Menos de 2 caracteres → sin resultados | No se dispara búsqueda | | |
| Resultados muestran código + descripción + categoría + precio | Info completa en cada resultado | | |
| ↑↓ navega resultados | Selección se mueve | | |
| Enter selecciona resultado | Producto se agrega al carrito | | |
| Escape cierra resultados | Dropdown se oculta | | |
| Sin apertura → búsqueda bloqueada + mensaje | Input deshabilitado | | |

## F5 — Favoritos (panel lateral)

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Productos con es_favorito=1 se muestran | Panel visible debajo del buscador | | |
| Click en favorito → agrega al carrito | Producto agregado | | |
| Sin favoritos → panel oculto | No ocupa espacio | | |
| Favoritos con peso → abre WeightModal | Modal de peso se muestra | | |

## F6 — Productos por peso

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Producto con requiere_peso=1 → WeightModal se abre | Modal visible | | |
| Ingresar peso en KG → calcula precio × peso | Precio correcto en carrito | | |
| EAN-13 iniciando con 20 → decodifica peso | Peso extraído correctamente | | |
| EAN-13 sin iniciar con 20 → producto normal | Se agrega con cantidad=1 | | |

## F7 — Venta libre profesional

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| F9 abre FreeSaleModal | Modal visible | | |
| Seleccionar categoría → campo de valor aparece | UI clara | | |
| Sin campo descripción | Solo categoría + valor | | |
| Ingresar valor + Enter → producto se agrega | Agregado al carrito | | |
| Valor inválido o vacío → error | Mensaje de error | | |
| Escape cierra modal | Modal se cierra | | |

## F8 — Inventario profesional (indicadores de stock)

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Stock > mínimo → 🟢 verde | Indicador verde | | |
| Stock ≤ mínimo y > 0 → 🟡 ámbar | Indicador ámbar | | |
| Stock ≤ 0 → 🔴 rojo | Indicador rojo | | |
| Filtros: Activos, Stock Bajo, Inactivos, Favoritos | Funcionan correctamente | | |
| Crear producto + editar + toggle activo/favorito + stock | CRUD completo funcional | | |

## F9 — Import/Export Excel

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Cubierto en IMPORT_EXPORT_QA.md | 40+ casos | | |

## F10 — Reportes reales

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Filtro de fecha: Hoy / Semana / Mes / Personalizado | Cambia datos del reporte | | |
| Personalizado: fecha inicio y fin | Filtro aplicado | | |
| Tab Ventas: subtotal, impuestos, total, transacciones, ticket promedio | Datos correctos | | |
| Utilidad: ingresos, costo, utilidad, margen | Calculado correctamente | | |
| Tab Métodos: método, total, % | Datos correctos | | |
| Tab Impuestos: tipo, tarifa, base, monto | Datos correctos | | |
| Tab Productos: toggle Más/Menos vendidos | Cambia orden | | |
| Tab Cierres: fecha, usuario, ventas, artículos, esperado, contado, diferencia | Datos correctos | | |
| Tab Movimientos: fecha, tipo, descripción, usuario | Datos de eventos_auditoria | | |
| Export CSV | Archivo descargado | | |
| Export Excel | Archivo descargado | | |
| Export PDF | PDF generado | | |
| Print | Ventana de impresión | | |
| Sin datos → EmptyState | Mensaje "Sin datos para el período seleccionado" | | |

## F11 — Impuestos comerciales

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Precio de venta = precio final | Sin cálculo extra | | |
| IVA se calcula sobre subtotal para reporte | Correcto en resumen | | |
| Receipt muestra IVA% por ítem | Desglose visible | | |

## F12 — Cierre de caja

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Sin campo observaciones | Solo efectivo contado | | |
| Efectivo esperado se calcula (fondo + ventas efectivo) | Valor correcto | | |
| Diferencia: CUADRADO / SOBRANTE / FALTANTE | Indicador correcto | | |
| Resumen: ventas, artículos, subtotal, impuestos, total, métodos pago | Datos correctos | | |
| Imprimir y cerrar → ticket de cierre + auto-logout | Cierre completo | | |
| Cerrar sin imprimir → auto-logout | Cierre sin impresión | | |

## F13 — Reimpresión de tickets (F8)

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| F8 reimprime el último ticket | Impresión se dispara | | |
| Sin ventas previas → F8 no hace nada | Sin error | | |

## F14 — Cambio de sucursal

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Cambiar sucursal desde el menú ⚙ | BranchSelector visible | | |
| PIN admin requerido | AdminOverrideModal se abre | | |
| Datos se descargan para la nueva sucursal | Productos/inventario/categorías/usuarios actualizados | | |
| Múltiples cambios (2+) funcionan | Sin bug "solo funciona una vez" | | |

## F15 — Tema visual comercial

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Fondo general #F8FAFC (bg-slate-50) | Correcto | | |
| Cards #FFFFFF | Correcto | | |
| Texto principal #111827 (text-gray-900) | Correcto | | |
| Primary #2563EB (blue-600) | Correcto | | |

## F16 — Experiencia táctil

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Botones nav topbar | min-h-[40px] | | |
| Botones favoritos | min-h-[48px] | | |
| Badges action bar | py-2 (mayor área táctil) | | |
| Input búsqueda | p-3 (48px altura) | | |

## F17 — Sync status indicator

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Indicador 🟢/🟡/🔴 en header | Visible siempre | | |
| Pendientes count badge | Número visible en badge ámbar | | |
| Estado cambia en tiempo real | Reacciona a online/offline | | |

## F18 — Compilación y lint

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| `npm run build` (tsc -b && vite build) | 0 errores | | |
| `npm run lint` (eslint .) | 0 errores (warnings pre-existentes permitidos) | | |
| Sin console.log en producción | Solo console.error permitido | | |
