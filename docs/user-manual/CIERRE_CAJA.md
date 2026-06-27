# Cierre de Caja — Manual de Usuario

## Requisitos

- Turno abierto
- Estar en la **sucursal principal**

## Pasos

1. Clic en **Cerrar Caja** en la barra superior
2. El sistema carga automáticamente el resumen operativo
3. Ingresar el **efectivo contado** en caja
4. Clic en **Confirmar cierre**

## Confirmación

- Se muestra resumen: efectivo esperado vs contado, diferencia
- **CUADRADO**: diferencia = $0 ✅
- **SOBRANTE**: contado > esperado ⚠️
- **FALTANTE**: contado < esperado ❌

## Exportar PDF

Antes de confirmar, puede exportar un PDF con el resumen de cierre. Se abre diálogo para guardar.

## Finalizar

- El cierre se registra en Supabase
- La apertura se marca como cerrada
- Se limpia la sesión completamente
- Vuelve a la pantalla de Login

## Después del cierre

- F5 o reiniciar la aplicación → Login obligatorio
- No se restaura la sesión automáticamente
