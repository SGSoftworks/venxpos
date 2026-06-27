# QA — Importación / Exportación

## Módulo: Inventario — Exportar Excel (`InventoryManager.tsx`)

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Inventario vacío (0 productos) | Archivo con headers y 0 filas | | |
| 1+ productos visibles | Archivo con datos correctos, columnas en español | | |
| 1000+ productos | Archivo generado en < 3s | | |
| Caracteres especiales (tildes, ñ) | Se visualizan correctamente en Excel | | |
| Columnas correctas | Código Barras, Descripción, Categoría, Costo, Precio Venta, Stock, Stock Mínimo, Producto por Peso, Activo | | |
| Todos los productos exportados | No solo los filtrados/paginados | | |
| Feedback visual | Aparece "Exportando..." → "Exportación completada ✔" | | |

## Módulo: Inventario — Descargar Plantilla (`InventoryManager.tsx`)

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Click en "Descargar Plantilla" | Archivo `Plantilla_Productos.xlsx` se descarga | | |
| Headers de plantilla | codigo_barras, descripcion, categoria, costo, precio_venta, stock, stock_minimo, requiere_peso | | |
| Fila ejemplo incluida | Producto "Ejemplo — Producto de muestra" con datos válidos | | |

## Módulo: Inventario — Importar Excel (`InventoryManager.tsx`)

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Archivo vacío (sin filas) | Error "No se encontraron registros para importar" | | |
| Columna obligatoria faltante | Error "Faltan columnas obligatorias: ..." | | |
| Precio negativo o no numérico | Error por fila específico | | |
| Código vacío en una fila | Error "código de barras vacío" en esa fila | | |
| Descripción vacía en una fila | Error "descripción vacía" en esa fila | | |
| Mezcla de errores | Listado de hasta 5 errores con número de fila | | |
| Sin errores + sin duplicados | Importación directa, resumen mostrado | | |
| Con duplicados (1 producto) | Modal con opciones Actualizar / Omitir / Cancelar | | |
| Con duplicados (10+ productos) | Modal con conteo correcto | | |
| Actualizar duplicados | Registros existentes se actualizan | | |
| Omitir duplicados | Registros existentes no se modifican | | |
| Cancelar importación | No se modifica ningún registro | | |
| Resumen final correcto | Nuevos: X, Actualizados: Y, Omitidos: Z, Errores: W | | |
| Archivo CSV seleccionado | Input rechaza .csv (solo .xlsx/.xls) | | |
| Archivo .xls (formato antiguo) | Se importa correctamente | | |
| Categoría en importación | Se asigna categoría si existe por nombre | | |
| stock_minimo en importación | Se guarda en el producto | | |
| requiere_peso en importación | Sí → 1, No/otro → 0 | | |
| Feedback visual durante importación | Botón muestra "Importando..." | | |

## Módulo: Inventario — Exportar PDF (`InventoryManager.tsx`)

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| Click "Exportar PDF" con datos | PDF generado con tabla de productos | | |
| Inventario vacío | Error "No hay productos para exportar a PDF" | | |
| Columnas en PDF | Código Barras, Descripción, Categoría, Costo, Precio Venta, Stock, Stock Mínimo, IVA | | |
| Metadatos en PDF | Título, sucursal, fecha de generación | | |
| Feedback visual | "Generando PDF..." → "PDF generado ✔" | | |

## Módulo: Reportes — Ventas del Día (`ReportsPanel.tsx`)

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| CSV — con datos | Archivo CSV con indicadores correctos | | |
| CSV — sin datos | Archivo CSV generado (puede estar vacío) | | |
| Excel — con datos | XLSX con subtotal, impuestos, total, transacciones, ticket promedio | | |
| Excel — sin datos | XLSX generado con 0 en todos los valores | | |
| PDF — con datos | PDF con indicadores, sucursal, usuario, fecha | | |
| PDF — sin datos | PDF con mensaje "No existen registros" | | |
| Imprimir — con datos | Diálogo de impresión con tabla de indicadores | | |
| Imprimir — sin datos | Diálogo de impresión con tabla vacía | | |

## Módulo: Reportes — Métodos de Pago

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| CSV — con datos | Archivo con método, total, porcentaje | | |
| Excel — con datos | XLSX con método, total, porcentaje | | |
| PDF — con datos | PDF con tabla de métodos | | |
| Sin datos | Los 3 formatos funcionan sin errores | | |
| Imprimir | Diálogo de impresión correcto | | |

## Módulo: Reportes — Impuestos

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| CSV | Archivo con tipo, tarifa, base gravable, monto | | |
| Excel | XLSX con los mismos datos | | |
| PDF | PDF con tabla de impuestos | | |
| Sin datos | Sin errores en ningún formato | | |
| Imprimir | Diálogo de impresión | | |

## Módulo: Reportes — Productos Más Vendidos

| Caso | Resultado Esperado | Resultado | Estado |
|---|---|---|---|
| CSV | Archivo con producto, cantidad, ingresos | | |
| Excel | XLSX con los mismos datos | | |
| PDF | PDF con tabla de productos | | |
| Sin datos | Sin errores en ningún formato | | |
| Imprimir | Diálogo de impresión | | |

## Consistencia (F6)

| Verificación | Método | Resultado | Estado |
|---|---|---|---|
| Totales pantalla vs Excel | Cargar reporte, exportar Excel, comparar subtotal/impuestos/total | | |
| Totales pantalla vs PDF | Cargar reporte, exportar PDF, comparar valores | | |
| Cantidades pantalla vs Excel | Misma fuente de datos (`reports.ts`) — consistencia garantizada por diseño | | |

---

**Procedimiento de QA:**
1. Iniciar sesión con sucursal con datos
2. Probar cada caso listado arriba
3. Marcar Resultado como ✔ (pasa) o ✘ (falla)
4. Reportar fallas como issues
