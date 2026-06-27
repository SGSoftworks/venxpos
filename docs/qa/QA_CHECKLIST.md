# QA Checklist — VenxPos Online-First

## Login
| # | Caso | Resultado Esperado | Estado |
|---|------|-------------------|--------|
| 1 | Login con credenciales válidas | POSLayout se muestra | |
| 2 | Login con credenciales inválidas | Mensaje de error | |
| 3 | F5 tras login | Sesión restaurada (persistSession: true) | |
| 4 | F5 tras logout | Login screen | |
| 5 | Sin internet al abrir | ConnectionGuard bloquea | |

## Ventas
| # | Caso | Resultado Esperado | Estado |
|---|------|-------------------|--------|
| 6 | Buscar producto por descripción | Resultados filtrados | |
| 7 | Escanear código de barras | Producto agregado al carrito | |
| 8 | Escanear código inexistente | Sonido error + toast rojo | |
| 9 | Producto por peso | WeightModal se abre | |
| 10 | Venta libre (F9) | FreeSaleModal → agregar por categoría | |
| 11 | Pago en efectivo | Venta registrada + ticket | |
| 12 | Pago mixto | Venta con split efectivo/tarjeta | |
| 13 | Stock insuficiente | Error antes de insertar venta | |
| 14 | Reimprimir ticket (F8) | window.print() del último ticket | |

## Inventario
| # | Caso | Resultado Esperado | Estado |
|---|------|-------------------|--------|
| 15 | Crear producto | Insert en Supabase + inventario | |
| 16 | Código duplicado | Error "código ya existe" | |
| 17 | Editar producto | Update en Supabase | |
| 18 | Eliminar producto | Modal confirmación → DELETE | |
| 19 | Importar Excel | Upsert productos + inventario | |
| 20 | Exportar Excel | saveFile() diálogo nativo | |
| 21 | Exportar PDF | saveFile() diálogo nativo | |

## Reportes
| # | Caso | Resultado Esperado | Estado |
|---|------|-------------------|--------|
| 22 | Reporte ventas del día | Datos correctos | |
| 23 | Reporte métodos de pago | Desglose por método | |
| 24 | Exportar PDF reportes | Diálogo guardar | |
| 25 | Exportar Excel reportes | Diálogo guardar | |
| 26 | Exportar CSV reportes | Archivo descargado | |

## Caja
| # | Caso | Resultado Esperado | Estado |
|---|------|-------------------|--------|
| 27 | Abrir caja (principal) | Apertura registrada en Supabase | |
| 28 | Abrir caja (no principal) | Bloqueado | |
| 29 | Cerrar caja | Flujo unificado: form → confirm → done | |
| 30 | Exportar PDF cierre | saveFile() con resumen | |
| 31 | Logout tras cierre | localStorage limpio + F5 = Login | |

## Multi-Sucursal
| # | Caso | Resultado Esperado | Estado |
|---|------|-------------------|--------|
| 32 | Admin General ve selector | Select con todas sus sucursales | |
| 33 | Admin Sucursal ve bloqueado | Nombre fijo, sin selector | |
| 34 | Cajero ve bloqueado | Nombre fijo, sin selector | |
| 35 | Cambiar sucursal | AdminOverrideModal → PIN → switch | |
| 36 | Inventario aislado | Solo productos de sucursal actual | |
