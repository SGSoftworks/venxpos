import { create } from 'zustand';

export interface UserSession {
  id: string;
  email: string;
  rol: 'cajero' | 'admin';
  sucursal_id: string;
  usuario_db_id?: string;
  nombre: string;
  access_token: string;
  refresh_token: string;
}

export interface CartItem {
  id: string;
  producto_id: string;
  codigo_barras: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  precio_original: number;
  descuento_porcentaje: number;
  subtotal: number;
}

export interface CompletedSale {
  ticketNumber: number;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    precio_original: number;
    descuento_porcentaje: number;
    subtotal: number;
  }>;
  subtotal: number;
  total: number;
  metodoPago: string;
  montoRecibido: number;
  cambioEntregado: number;
  fecha: string;
}

export interface SubscriptionInfo {
  sucursal_nombre: string;
  plan: string;
  subscription_status: 'active' | 'past_due' | 'cancelled' | 'expired';
  proximo_cobro: string | null;
  max_sucursales: number;
}

interface AppState {
  isOnline: boolean;
  session: UserSession | null;
  activeBranchId: string | null;
  subscription: SubscriptionInfo | null;

  cart: CartItem[];
  cartSubtotal: number;
  cartTotal: number;

  lastCompletedSale: CompletedSale | null;

  currentAperturaId: string | null;
  aperturaInfo: { fondo: number; since: string } | null;

  scannedBarcode: string | null;

  setOnlineStatus: (status: boolean) => void;
  setSession: (session: UserSession | null) => void;
  setSubscription: (info: SubscriptionInfo | null) => void;
  setApertura: (id: string | null, info: { fondo: number; since: string } | null) => void;

  setScannedBarcode: (code: string | null) => void;

  addToCart: (item: Omit<CartItem, 'id' | 'subtotal' | 'precio_original' | 'descuento_porcentaje'>) => void;
  updateItemQuantity: (id: string, cantidad: number) => void;
  setItemDiscount: (id: string, descuentoPorcentaje: number) => void;
  setItemPrice: (id: string, nuevoPrecio: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setLastCompletedSale: (sale: CompletedSale | null) => void;
}

const calcSubtotal = (item: CartItem) => {
  const desc = (item.descuento_porcentaje ?? 0) / 100;
  return item.cantidad * item.precio_unitario * (1 - desc);
};

const calculateTotals = (cart: CartItem[]) => {
  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  return {
    cart,
    cartSubtotal,
    cartTotal: cartSubtotal,
  };
};

export const useAppStore = create<AppState>((set) => ({
  isOnline: navigator.onLine,
  session: null,
  activeBranchId: null,
  subscription: null,

  cart: [],
  cartSubtotal: 0,
  cartTotal: 0,

  lastCompletedSale: null,

  currentAperturaId: null,
  aperturaInfo: null as { fondo: number; since: string } | null,
  scannedBarcode: null,

  setOnlineStatus: (status) => set({ isOnline: status }),

  setSession: (session) =>
    set({ session, activeBranchId: session?.sucursal_id ?? null }),

  setSubscription: (info) => set({ subscription: info }),
  setApertura: (id, info) => set({ currentAperturaId: id, aperturaInfo: info }),

  setScannedBarcode: (code) => set({ scannedBarcode: code }),

  setLastCompletedSale: (sale) => set({ lastCompletedSale: sale }),

  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find(
        (i) => i.producto_id === item.producto_id && i.descuento_porcentaje === 0 && i.precio_unitario === item.precio_unitario,
      );
      let newCart: CartItem[];

      if (existing) {
        newCart = state.cart.map((i) =>
          i.producto_id === item.producto_id && i.descuento_porcentaje === 0 && i.precio_unitario === item.precio_unitario
            ? { ...i, cantidad: i.cantidad + item.cantidad, subtotal: calcSubtotal({ ...i, cantidad: i.cantidad + item.cantidad }) }
            : i,
        );
      } else {
        newCart = [
          ...state.cart,
          {
            ...item,
            id: crypto.randomUUID(),
            precio_original: item.precio_unitario,
            descuento_porcentaje: 0,
            subtotal: item.cantidad * item.precio_unitario,
          },
        ];
      }

      return calculateTotals(newCart);
    }),

  updateItemQuantity: (id, cantidad) =>
    set((state) => {
      const newCart = state.cart.map((item) =>
        item.id === id
          ? { ...item, cantidad, subtotal: calcSubtotal({ ...item, cantidad }) }
          : item,
      );
      return calculateTotals(newCart);
    }),

  setItemDiscount: (id, descuentoPorcentaje) =>
    set((state) => {
      const pct = Math.max(0, Math.min(100, descuentoPorcentaje));
      const newCart = state.cart.map((item) =>
        item.id === id
          ? { ...item, descuento_porcentaje: pct, subtotal: calcSubtotal({ ...item, descuento_porcentaje: pct }) }
          : item,
      );
      return calculateTotals(newCart);
    }),

  setItemPrice: (id, nuevoPrecio) =>
    set((state) => {
      const price = Math.max(0, nuevoPrecio);
      const newCart = state.cart.map((item) =>
        item.id === id
          ? { ...item, precio_unitario: price, subtotal: calcSubtotal({ ...item, precio_unitario: price }) }
          : item,
      );
      return calculateTotals(newCart);
    }),

  removeItem: (id) =>
    set((state) => {
      const newCart = state.cart.filter((item) => item.id !== id);
      return calculateTotals(newCart);
    }),

  clearCart: () =>
    set({
      cart: [],
      cartSubtotal: 0,
      cartTotal: 0,
    }),
}));

window.addEventListener('online', () =>
  useAppStore.getState().setOnlineStatus(true),
);
window.addEventListener('offline', () =>
  useAppStore.getState().setOnlineStatus(false),
);