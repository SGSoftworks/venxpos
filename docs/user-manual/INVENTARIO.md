# Inventario — Manual de Usuario

## Ver productos

Acceder a la pestaña **Inventario** en la barra de navegación. Tabla con todos los productos de sus sucursales asignadas.

## Indicadores de stock

- 🟢 Verde: stock > mínimo
- 🟡 Ámbar: stock ≤ mínimo
- 🔴 Rojo: stock = 0

## Filtros

- **Todos**: todos los productos
- **Stock Bajo**: productos bajo el mínimo
- **Inactivos**: productos desactivados
- **Favoritos**: productos marcados con ★

## Crear producto

1. Clic en **+ Nuevo**
2. Llenar: código de barras, descripción, precio, costo, stock inicial
3. Clic en **Crear**

## Editar producto

1. Clic en **Editar** en la fila del producto
2. Modificar campos
3. Clic en **Guardar**

## Eliminar producto

1. Clic en **🗑** en la fila del producto
2. Confirmar en el modal
3. El producto y su inventario se eliminan permanentemente

## Ajustar stock

1. Clic en **Stock**
2. Seleccionar: Entrada (+), Salida (-), o Ajuste (valor fijo)
3. Ingresar cantidad y observación
4. Clic en **Aplicar ajuste**

## Importar Excel

1. Clic en **Importar**
2. Seleccionar archivo .xlsx con columnas: codigo_barras, descripcion, precio_venta
3. Los productos existentes se actualizan (upsert por código de barras)

## Exportar

- **Excel**: diálogo para guardar archivo .xlsx
- **PDF**: diálogo para guardar archivo .pdf
- **Plantilla**: descarga plantilla Excel para importar
