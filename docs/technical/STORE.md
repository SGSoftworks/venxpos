# Zustand Store — useAppStore

## UserSession

```ts
interface UserSession {
  id: string;                    // auth.users.id
  email: string;
  rol: 'cajero' | 'admin';
  sucursal_id: string;           // sucursal activa actual
  sucursal_principal_id?: string; // sucursal operativa principal
  usuario_db_id?: string;         // usuarios.id (Supabase PK)
  nombre: string;
  access_token: string;
  refresh_token: string;
  canSwitchBranch?: boolean;      // Admin General
}
```

## CartItem

```ts
interface CartItem {
  id: string;
  producto_id: string;
  codigo_barras: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  precio_original: number;
  descuento_porcentaje: number;
  subtotal: number;              // cantidad × precio_unitario × (1 - desc%)
  tarifa_iva: number;
  tarifa_impoconsumo: number;
}
```

## calculateTotals()

Lógica IVA incluido:
```ts
for (item of cart) {
  cartTotal += item.subtotal;                      // precio pagado
  const base = totalRate > 0 ? paid / (1 + totalRate) : paid;  // base gravable
  cartSubtotal += base;
  cartTaxes += base * (item.tarifa_iva + item.tarifa_impoconsumo);
}
```

## CompletedSale

```ts
interface CompletedSale {
  ticketNumber: number;
  items: Array<{...}>;
  subtotal: number;     // base gravable
  impuestos: number;    // IVA extraído
  total: number;        // precio final pagado
  taxBreakdown: TaxBreakdownRow[];
  metodoPago: string;
  montoRecibido: number;
  cambioEntregado: number;
  fecha: string;
}
```

## Acciones Principales

| Acción | Descripción |
|--------|------------|
| `addToCart(item)` | Agrega producto. Si ya existe (mismo id + precio), suma cantidad |
| `updateItemQuantity(id, qty)` | Cambia cantidad |
| `setItemDiscount(id, pct)` | Aplica descuento % |
| `removeItem(id)` | Elimina del carrito |
| `clearCart()` | Vacía carrito |
| `setSession(session)` | Actualiza sesión + activeBranchId |
| `setApertura(id, info)` | Actualiza estado de apertura |
| `setScannedBarcode(code)` | Puente barcode → InventoryManager |
