import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PaymentModal } from './PaymentModal';
import { supabase } from '../lib/supabase';
import { initBarcodeScanner, setBarcodeIgnore, playBeep as playScanBeep } from '../lib/barcodeScanner';
import { AdminOverrideModal } from './AdminOverrideModal';
import { Dashboard } from './Dashboard';
import { CashRegisterClose } from './CashRegisterClose';
import { AperturaTurnoModal } from './AperturaTurnoModal';
import { ReportsPanel } from './ReportsPanel';
import { InventoryManager } from './InventoryManager';
import { WeightModal } from './WeightModal';
import { FreeSaleModal } from './FreeSaleModal';
import { ReturnModal } from './ReturnModal';
import { SaleHistory } from './SaleHistory';
import { Gear, Keyboard, ArrowReturn, Clipboard, Printer, Check, CircleX, BookOpen } from './Icons';
import { ConfigPanel } from './ConfigPanel';
import { LegalSoporteModal } from './LegalSoporteModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import iconApp from '../assets/branding/icon-app.png';

type ProductRow = {
  id: string; codigo_barras: string; descripcion: string; precio_venta: number;
  costo: number; requiere_peso: number; tarifa_iva: number; tarifa_impoconsumo: number;
  categoria_nombre?: string;
};

type MainView = 'dashboard' | 'pos' | 'inventario';

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1200;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch { /* silent fallback */ }
}

export const POSLayout: React.FC = () => {
  const {
    session,
    cart,
    cartSubtotal,
    cartTotal,
    cartTaxBreakdown,
    addToCart,
    updateItemQuantity,
    removeItem,
    setSession,
    lastCompletedSale,
    setItemDiscount,
    setItemPrice,
    isOnline,
    currentAperturaId,
    aperturaInfo,
    setApertura,
  } = useAppStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const utilRef = useRef<HTMLDivElement>(null);

  const [searchValue, setSearchValue] = useState('');
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isEditQtyMode, setEditQtyMode] = useState(false);
  const [qtyValue, setQtyValue] = useState('');

  const [showOverride, setShowOverride] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [showClosure, setShowClosure] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [activeView, setActiveView] = useState<MainView>('dashboard');
  const activeViewRef = useRef<MainView>('dashboard');
  useEffect(() => { activeViewRef.current = activeView; }, [activeView]);
  const [scanToast, setScanToast] = useState<{ code: string; ok: boolean } | null>(null);
  const scanToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showAperturaModal, setShowAperturaModal] = useState(false);

  const [searchResults, setSearchResults] = useState<ProductRow[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [selectedCartIndex, setSelectedCartIndex] = useState(0);
  const [scanFeedback, setScanFeedback] = useState<'success' | null>(null);

  const [weightProduct, setWeightProduct] = useState<ProductRow | null>(null);
  const [showFreeSale, setShowFreeSale] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showSaleHistory, setShowSaleHistory] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);


  const [showDiscountMode, setShowDiscountMode] = useState(false);
  const [discountValue, setDiscountValue] = useState('');
  const [priceOverrideValue, setPriceOverrideValue] = useState('');
  const [stockMap, setStockMap] = useState<Record<string, { stock: number; min: number }>>({});
  const [showUtilityMenu, setShowUtilityMenu] = useState(false);
  const [branchName, setBranchName] = useState('');

  const fmt2 = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  const parseBarcode = useCallback(async (code: string) => {
    if (!currentAperturaId) return false;
    try {
      let weightKg = 1;

      const { data: products } = await supabase
        .from('productos')
        .select('*')
        .eq('codigo_barras', code)
        .limit(1);

      if (code.startsWith('20') && code.length === 13 && (!products || products.length === 0)) {
        const internalCode = code.substring(2, 7);
        const weightGrams = parseInt(code.substring(7, 12), 10);
        weightKg = weightGrams / 1000;
        const { data: internalProducts } = await supabase
          .from('productos')
          .select('*')
          .eq('codigo_barras', internalCode)
          .limit(1);
        if (internalProducts && internalProducts.length > 0) {
          const p = internalProducts[0] as unknown as ProductRow;
          addToCart({
            producto_id: p.id, codigo_barras: p.codigo_barras, descripcion: p.descripcion,
            cantidad: weightKg, precio_unitario: p.precio_venta,
            tarifa_iva: p.tarifa_iva, tarifa_impoconsumo: p.tarifa_impoconsumo,
          });
          setSearchResults([]); setSelectedCartIndex(cart.length);
          setScanFeedback('success'); playBeep(); setTimeout(() => setScanFeedback(null), 300);
          return true;
        }
        return false;
      }

      if (products && products.length > 0) {
        const p = products[0];
        addToCart({
          producto_id: p.id,
          codigo_barras: p.codigo_barras,
          descripcion: p.descripcion,
          cantidad: p.requiere_peso ? weightKg : 1,
          precio_unitario: p.precio_venta,
          tarifa_iva: p.tarifa_iva,
          tarifa_impoconsumo: p.tarifa_impoconsumo,
        });
        setSearchResults([]);
        setSelectedCartIndex(cart.length);
        setScanFeedback('success');
        playBeep();
        setTimeout(() => setScanFeedback(null), 300);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, [addToCart, cart.length, currentAperturaId]);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const aperturaBloqueada = !currentAperturaId;

  const handleSearchChange = (value: string) => {
    if (aperturaBloqueada) return;
    setSearchValue(value);
    setSelectedResultIndex(0);
    clearTimeout(searchDebounceRef.current);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const term = `%${value}%`;
        const { data: results } = await supabase
          .from('productos')
          .select('id, codigo_barras, descripcion, precio_venta, costo, requiere_peso, tarifa_iva, tarifa_impoconsumo, categorias(nombre)')
          .eq('activo', true)
          .eq('sucursal_id', session?.sucursal_id ?? '')
          .or(`descripcion.ilike.${term},codigo_barras.ilike.${term}`)
          .order('descripcion')
          .limit(10);
        const mapped = (results || []).map((r: Record<string, unknown>) => ({
          ...r,
          categoria_nombre: (r.categorias as { nombre: string } | null)?.nombre ?? null,
        }));
        setSearchResults(mapped as unknown as ProductRow[]);
      } catch {
        setSearchResults([]);
      }
    }, 200);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    if (aperturaBloqueada) return;

    if (searchResults.length > 0 && selectedResultIndex >= 0) {
      selectSearchResult(searchResults[selectedResultIndex]);
      return;
    }

    const found = await parseBarcode(searchValue);
    if (!found) {
      const term = `%${searchValue}%`;
      const { data: results } = await supabase
        .from('productos')
        .select('id, codigo_barras, descripcion, precio_venta, costo, requiere_peso, tarifa_iva, tarifa_impoconsumo, categorias(nombre)')
        .eq('activo', true)
        .eq('sucursal_id', session?.sucursal_id ?? '')
        .or(`descripcion.ilike.${term},codigo_barras.ilike.${term}`)
        .order('descripcion')
        .limit(10);
      setSearchResults((results || []) as unknown as ProductRow[]);
    }
    setSearchValue('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const selectSearchResult = (p: ProductRow) => {
    if (!currentAperturaId) return;
    if (p.requiere_peso) {
      setWeightProduct(p);
      setSearchResults([]);
      setSearchValue('');
      return;
    }
    addToCart({
      producto_id: p.id,
      codigo_barras: p.codigo_barras,
      descripcion: p.descripcion,
      cantidad: 1,
      precio_unitario: p.precio_venta,
      tarifa_iva: p.tarifa_iva,
      tarifa_impoconsumo: p.tarifa_impoconsumo,
    });
    setSearchResults([]);
    setSearchValue('');
    setSelectedCartIndex(cart.length);
    setScanFeedback('success');
    playBeep();
    setTimeout(() => setScanFeedback(null), 300);
    searchInputRef.current?.focus();
  };

  const applyQtyPreset = (delta: number) => {
    if (cart.length === 0) return;
    const idx = selectedCartIndex < cart.length ? selectedCartIndex : cart.length - 1;
    const item = cart[idx];
    if (!item) return;
    const newQty = Math.max(0.001, item.cantidad + delta);
    updateItemQuantity(item.id, newQty);
    setQtyValue(String(newQty));
  };

  const handleQtySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(qtyValue);
    if (isNaN(qty) || qty <= 0 || cart.length === 0) {
      setEditQtyMode(false);
      setQtyValue('');
      searchInputRef.current?.focus();
      return;
    }
    const idx = selectedCartIndex < cart.length ? selectedCartIndex : cart.length - 1;
    updateItemQuantity(cart[idx].id, qty);
    setEditQtyMode(false);
    setQtyValue('');
    searchInputRef.current?.focus();
  };

  const requestRemoveItem = useCallback((itemId: string) => {
    if (session?.rol === 'admin') {
      removeItem(itemId);
    } else {
      setPendingRemoveId(itemId);
      setShowOverride(true);
    }
  }, [session, removeItem]);

  const confirmRemoveItem = () => {
    if (pendingRemoveId !== null) {
      removeItem(pendingRemoveId);
    }
    setPendingRemoveId(null);
    setShowOverride(false);
    searchInputRef.current?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaymentModalOpen || showOverride || showFreeSale || showReturn || showAperturaModal || showClosure || showLegal || showKeyboardShortcuts || showSaleHistory || showConfig || weightProduct) return;

      if (isEditQtyMode || showDiscountMode) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setEditQtyMode(false);
          setShowDiscountMode(false);
          searchInputRef.current?.focus();
        }
        return;
      }

      const currentCart = useAppStore.getState().cart;

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          if (!currentAperturaId) {
            setShowAperturaModal(true);
            return;
          }
          setEditQtyMode(false);
          setSearchResults([]);
          searchInputRef.current?.focus();
          break;
        case 'F2':
          e.preventDefault();
          if (currentCart.length > 0) {
            const idx = selectedCartIndex < currentCart.length ? selectedCartIndex : currentCart.length - 1;
            setSelectedCartIndex(idx);
            setQtyValue(String(currentCart[idx].cantidad));
            setEditQtyMode(true);
            setShowDiscountMode(false);
            setTimeout(() => qtyInputRef.current?.select(), 50);
          }
          break;
        case 'F3':
          e.preventDefault();
          if (currentCart.length > 0) {
            const idx = selectedCartIndex < currentCart.length ? selectedCartIndex : currentCart.length - 1;
            setSelectedCartIndex(idx);
            setEditQtyMode(false);
            setShowDiscountMode(true);
            setDiscountValue(String(currentCart[idx].descuento_porcentaje));
            setPriceOverrideValue(String(currentCart[idx].precio_unitario));
          }
          break;
        case 'F9':
          e.preventDefault();
          if (currentAperturaId) setShowFreeSale(true);
          break;
        case 'F10':
          e.preventDefault();
          if (currentCart.length > 0 && currentAperturaId) {
            setPaymentModalOpen(true);
          }
          break;
        case 'F8':
          e.preventDefault();
          if (lastCompletedSale) {
            try { window.print(); } catch { /* silent */ }
          }
          break;
        case 'F12':
          e.preventDefault();
          setShowReturn(true);
          break;
        case 'Escape':
          setEditQtyMode(false);
          setSearchResults([]);
          searchInputRef.current?.focus();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (searchResults.length > 0) {
            setSelectedResultIndex((p) => Math.min(p + 1, searchResults.length - 1));
          } else if (currentCart.length > 0) {
            setSelectedCartIndex((p) => Math.min(p + 1, currentCart.length - 1));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (searchResults.length > 0) {
            setSelectedResultIndex((p) => Math.max(p - 1, 0));
          } else if (currentCart.length > 0) {
            setSelectedCartIndex((p) => Math.max(p - 1, 0));
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (e.key === 'Backspace' && document.activeElement === searchInputRef.current && searchValue.length > 0) {
            return;
          }
          if (e.key === 'Delete' || (e.key === 'Backspace' && document.activeElement !== searchInputRef.current)) {
            e.preventDefault();
            if (currentCart.length > 0) {
              const idx = selectedCartIndex < currentCart.length ? selectedCartIndex : currentCart.length - 1;
              requestRemoveItem(currentCart[idx].id);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPaymentModalOpen,
    showOverride,
    showFreeSale,
    showReturn,
    showAperturaModal,
    showClosure,
    showLegal,
    showKeyboardShortcuts,
    showSaleHistory,
    showConfig,
    
    
    weightProduct,
    isEditQtyMode,
    showDiscountMode,
    selectedCartIndex,
    searchValue,
    searchResults.length,
    requestRemoveItem,
    currentAperturaId,
    lastCompletedSale,
  ]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showUtilityMenu && utilRef.current && !utilRef.current.contains(e.target as Node)) {
        setShowUtilityMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUtilityMenu]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (cart.length === 0) { setStockMap({}); return; }
      let cancelled = false;
      (async () => {
        const ids = [...new Set(cart.map(i => i.producto_id))];
        const map: Record<string, { stock: number; min: number }> = {};
        for (const pid of ids) {
          const [{ data: invData }, { data: prodData }] = await Promise.all([
            supabase.from('inventario_sucursal').select('stock_actual').eq('sucursal_id', session?.sucursal_id ?? '').eq('producto_id', pid).limit(1),
            supabase.from('productos').select('stock_minimo').eq('id', pid).limit(1),
          ]);
          if (!cancelled) {
            map[pid] = {
              stock: (invData && invData.length > 0) ? (invData[0].stock_actual as number) : 0,
              min: (prodData && prodData.length > 0) ? (prodData[0].stock_minimo as number) : 10,
            };
          }
        }
        if (!cancelled) setStockMap(map);
      })();
      return () => { cancelled = true; };
    }, 0);
    return () => clearTimeout(t);
  }, [cart, session?.sucursal_id]);

  const checkedBranchRef = useRef<string | null>(null);

  useEffect(() => {
    const checkApertura = async () => {
      const currentSession = useAppStore.getState().session;
      if (!currentSession) return;
      const sid = currentSession.sucursal_id;

      if (checkedBranchRef.current === sid && currentAperturaId) return;

      try {
        const { data: rows } = await supabase
          .from('aperturas_caja')
          .select('id, fondo_inicial, fecha_apertura')
          .eq('sucursal_id', sid)
          .eq('estado', 'abierta')
          .order('fecha_apertura', { ascending: false })
          .limit(1);
        checkedBranchRef.current = sid;
        if (rows && rows.length > 0) {
          setApertura(rows[0].id, { fondo: rows[0].fondo_inicial, since: rows[0].fecha_apertura });
          setShowAperturaModal(false);
        } else {
          setApertura(null, null);
          setShowAperturaModal(true);
        }
      } catch {
        setShowAperturaModal(true);
      }
    };
    checkApertura();
  }, [session, currentAperturaId, setApertura]);

  useEffect(() => {
    (async () => {
      if (!session) return;
      try {
        const { data: sRows } = await supabase.from('sucursales').select('nombre').eq('id', session.sucursal_id).limit(1);
        if (sRows && sRows.length > 0) setBranchName(sRows[0].nombre);
      } catch { /* silent */ }
    })();
  }, [session]);

  const showScanToast = (code: string, ok: boolean) => {
    setScanToast({ code, ok });
    if (scanToastTimer.current) clearTimeout(scanToastTimer.current);
    scanToastTimer.current = setTimeout(() => setScanToast(null), 1500);
  };

  useEffect(() => {
    setBarcodeIgnore(() => {
      if (isPaymentModalOpen || showOverride || showFreeSale || showReturn || showAperturaModal || showClosure || showLegal || showKeyboardShortcuts || showSaleHistory || showConfig || showReports || !!weightProduct) return true;
      const st = useAppStore.getState().session;
      if (!st) return true;
      return false;
    });

    initBarcodeScanner(async (code) => {
      const state = useAppStore.getState();
      const st = state.session;
      if (!st) return;
      const currentView = activeViewRef.current;
      const currentApertura = state.currentAperturaId;

      try {
        const { data: rows } = await supabase
          .from('productos')
          .select('id, codigo_barras, descripcion, precio_venta, costo, requiere_peso, tarifa_iva, tarifa_impoconsumo')
          .eq('codigo_barras', code)
          .eq('sucursal_id', st.sucursal_id)
          .eq('activo', true)
          .limit(1);
        if (!rows || rows.length === 0) {
          playScanBeep('error');
          showScanToast(code, false);
          return;
        }

        const p = rows[0];
        playScanBeep('success');
        showScanToast(code, true);

        if (currentView === 'pos' && currentApertura) {
          if (p.requiere_peso) {
            setWeightProduct(p);
          } else {
            useAppStore.getState().addToCart({ producto_id: p.id, codigo_barras: p.codigo_barras, descripcion: p.descripcion, cantidad: 1, precio_unitario: p.precio_venta, tarifa_iva: p.tarifa_iva, tarifa_impoconsumo: p.tarifa_impoconsumo });
          }
        } else if (currentView === 'inventario') {
          useAppStore.getState().setScannedBarcode(code);
        }
      } catch {
        playScanBeep('error');
        showScanToast(code, false);
      }
    });
  }, [isPaymentModalOpen, showOverride, showFreeSale, showReturn, showAperturaModal, showClosure, showLegal, showKeyboardShortcuts, showSaleHistory, showConfig, showReports, weightProduct]);

  const handleAperturaSuccess = (aperturaId: string, fondo: number) => {
    setApertura(aperturaId, { fondo, since: new Date().toISOString() });
    setShowAperturaModal(false);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden">
      {/* Topbar */}
      <div className="flex justify-between items-center px-2 sm:px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-1 sm:gap-3">
          <div className="flex items-center gap-2">
            <img src={iconApp} alt="" className="w-8 h-8" />
            <span className="text-sm font-bold text-gray-900">VENXPOS</span>
          </div>
          {branchName && (
            <span className="bg-[var(--color-primary-light)] text-[var(--color-primary)] px-2 py-0.5 rounded text-[10px] font-semibold border border-[var(--color-primary-border)] hidden sm:inline-block">
              {branchName}
            </span>
          )}
          <span className="h-4 w-px bg-gray-200 hidden sm:block" />
          <div className="text-xs text-gray-500 items-center gap-2 hidden sm:flex">
            <span className="text-gray-700 font-medium">{session?.nombre}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400 capitalize">{session?.rol}</span>
          </div>
          {aperturaInfo ? (
            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-green-200 hidden sm:inline-block">
              Turno {new Date(aperturaInfo.since).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : (
            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-200 animate-pulse hidden sm:inline-block">
              Sin turno
            </span>
          )}
          <div className="flex items-center gap-1 px-2">
            <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setActiveView('pos'); setShowUtilityMenu(false); }}
            className={`text-xs px-3 py-2.5 rounded-lg font-medium transition-colors min-h-[40px] ${
              activeView === 'pos' ? 'bg-[var(--color-primary)] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Caja
          </button>
          <button
            onClick={() => { setActiveView('dashboard'); setShowUtilityMenu(false); }}
            className={`text-xs px-3 py-2.5 rounded-lg font-medium transition-colors min-h-[40px] ${
              activeView === 'dashboard' ? 'bg-[var(--color-primary)] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => { setActiveView('inventario'); setShowUtilityMenu(false); }}
            className={`hidden sm:inline-flex text-xs px-3 py-2.5 rounded-lg font-medium transition-colors min-h-[40px] ${
              activeView === 'inventario' ? 'bg-[var(--color-primary)] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Inventario
          </button>
          <button onClick={() => setShowReports(true)}
            className="hidden sm:inline-flex text-xs px-3 py-2.5 rounded-lg font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors min-h-[40px]">
            Reportes
          </button>
          <button onClick={() => setShowClosure(true)} disabled={!currentAperturaId}
            className={`hidden sm:inline-flex text-xs px-3 py-2.5 rounded-lg font-medium transition-colors min-h-[40px] ${
              currentAperturaId
                ? 'bg-white border border-red-300 text-red-600 hover:bg-red-50'
                : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
            }`}>
            Cerrar Caja
          </button>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <div className="relative" ref={utilRef}>
            <button onClick={() => setShowUtilityMenu(!showUtilityMenu)}
              className="text-xs px-2.5 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors min-h-[40px]" title="Más opciones">
              <Gear size={16} />
            </button>
            {showUtilityMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 py-1 min-w-[160px]" onMouseLeave={() => setShowUtilityMenu(false)}>
                <button onClick={() => { setShowUtilityMenu(false); setShowConfig(true); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[var(--color-primary-light)] transition-colors flex items-center gap-2">
                  <Gear size={14} /> Configuración
                </button>
                <button onClick={() => { setShowUtilityMenu(false); setShowLegal(true); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[var(--color-primary-light)] transition-colors flex items-center gap-2">
                  <BookOpen size={14} /> Legal y Soporte
                </button>
                <button onClick={() => { setShowUtilityMenu(false); setShowKeyboardShortcuts(true); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[var(--color-primary-light)] transition-colors flex items-center gap-2">
                  <Keyboard size={14} /> Atajos de teclado
                </button>
                <button onClick={() => { setShowUtilityMenu(false); setShowReturn(true); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[var(--color-primary-light)] transition-colors flex items-center gap-2">
                  <ArrowReturn size={14} /> Devolución
                </button>
                <button onClick={() => { setShowUtilityMenu(false); setShowSaleHistory(true); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[var(--color-primary-light)] transition-colors flex items-center gap-2">
                  <Clipboard size={14} /> Historial
                </button>
                <button onClick={() => { setShowUtilityMenu(false); if (lastCompletedSale) { try { window.print(); } catch { /* silent */ } } }} className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${lastCompletedSale ? 'text-gray-700 hover:bg-[var(--color-primary-light)]' : 'text-gray-400 cursor-not-allowed'}`} disabled={!lastCompletedSale}>
                  <Printer size={14} /> Reimprimir ticket
                </button>
                <div className="border-t border-gray-100 my-1" />
                <div className="px-3 py-1.5">
                  <span className="text-gray-400 text-xs">Sucursal: </span>
                  <span className="text-gray-700 text-sm font-medium">{branchName || '—'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeView === 'dashboard' ? (
        <Dashboard onGoToPOS={() => { setActiveView('pos'); setShowUtilityMenu(false); }} onReports={() => setShowReports(true)} onHistory={() => setShowSaleHistory(true)} />
      ) : activeView === 'inventario' ? (
        <div className="flex-1 overflow-hidden">
          <InventoryManager />
        </div>
      ) : (
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
            {/* Left Panel — Cart */}
          <div className="w-full lg:w-[35%] border-r border-gray-200 flex flex-col bg-white">
            <div className="p-3 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Carrito ({cart.length})</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {cart.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Carrito vacío
                </div>
              )}
              {cart.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedCartIndex(idx)}
                  className={`group flex justify-between items-center text-sm p-3 rounded-lg cursor-pointer transition-colors w-full ${
                    idx === selectedCartIndex
                      ? 'bg-[var(--color-primary-light)] ring-1 ring-[var(--color-primary-border)]'
                      : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-gray-900 truncate">
                      {item.descripcion}
                      {item.tarifa_iva === 0 && item.tarifa_impoconsumo === 0 && (
                        <span className="text-amber-600 text-xs ml-1.5 font-medium">(Exento)</span>
                      )}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {item.cantidad.toFixed(3)} und × ${item.precio_unitario.toLocaleString()}
                      {item.descuento_porcentaje > 0 && (
                        <span className="text-amber-600 ml-1 font-semibold">(-{item.descuento_porcentaje}%)</span>
                      )}
                    </span>
                    {(() => {
                      const s = stockMap[item.producto_id];
                      if (!s) return null;
                      const saldo = s.stock - item.cantidad;
                      const stockBajo = s.stock <= s.min;
                      return (
                        <span className={`text-[10px] font-medium ${saldo < 0 ? 'text-red-600' : stockBajo ? 'text-amber-600' : 'text-gray-400'}`}>
                          Stock: {s.stock.toFixed(0)}
                          {stockBajo && <span className="ml-1">⚠</span>}
                          {saldo < 0 && <span className="ml-1">(quedará {saldo.toFixed(0)})</span>}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="font-bold text-gray-900 ml-2 whitespace-nowrap tabular-nums text-right">
                    ${item.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    {item.descuento_porcentaje > 0 && (
                      <span className="text-xs text-gray-400 line-through block">${(item.cantidad * item.precio_original).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    )}
                  </div>
                  <span
                    onClick={(e) => { e.stopPropagation(); requestRemoveItem(item.id); }}
                    className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-bold transition-opacity ml-2 shrink-0 cursor-pointer select-none"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); requestRemoveItem(item.id); } }}
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>

            {/* Totals */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex justify-between mb-1 text-gray-500 text-sm">
                <span>Subtotal:</span>
                <span className="tabular-nums text-gray-700">${fmt2(cartSubtotal)}</span>
              </div>
              {cartTaxBreakdown.map((row) => (
                <div key={row.label} className="flex justify-between text-gray-500 text-xs mb-1 ml-2">
                  <span>{row.label}:</span>
                  <span className="tabular-nums">${fmt2(row.tax)}</span>
                </div>
              ))}
              {cartTaxBreakdown.length === 0 && cart.length > 0 && (
                <div className="flex justify-between text-gray-400 text-xs mb-1 ml-2">
                  <span>Impuestos: Exento / 0%</span>
                  <span className="tabular-nums">$0</span>
                </div>
              )}
              <div className="flex justify-between items-end border-t border-gray-200 pt-3 mt-2">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-3xl font-bold text-gray-900 tabular-nums">
                  ${fmt2(cartTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel — Search + Checkout */}
          <div className="w-full lg:w-[65%] flex flex-col bg-slate-50">
            {/* Action Bar */}
            <div className="flex gap-2 p-3 bg-white border-b border-gray-200 text-xs flex-wrap">
              {[
                { key: 'F1', label: 'Buscar/Escanear', color: 'text-[var(--color-primary)]' },
                { key: 'F2', label: 'Cantidad', color: 'text-[var(--color-primary)]' },
                { key: 'F3', label: 'Desc. %', color: 'text-[var(--color-primary)]' },
                { key: '↑↓', label: 'Navegar', color: 'text-gray-600' },
                { key: 'Del', label: 'Quitar', color: 'text-red-600' },
                { key: 'F9', label: 'Venta Libre', color: 'text-[var(--color-primary)]' },
                { key: 'F10', label: 'Pagar', color: 'text-green-600' },
                { key: 'F8', label: 'Reimprimir', color: 'text-gray-600' },
                { key: 'F12', label: 'Devolución', color: 'text-[var(--color-primary)]' },
              ].map((k) => (
                <div key={k.key} className="bg-white px-3 py-2 rounded-lg text-gray-600 border border-gray-200 text-sm min-h-[40px] flex items-center">
                  <span className={`font-semibold mr-1.5 ${k.color}`}>{k.key}</span>
                  {k.label}
                </div>
              ))}
            </div>

            {/* Search / Discount / Qty area */}
            <div className="p-4 bg-white border-b border-gray-200 relative">
              {showDiscountMode ? (
                <div className="space-y-2">
                  <form onSubmit={(e) => { e.preventDefault(); setShowDiscountMode(false); setEditQtyMode(false); searchInputRef.current?.focus(); }} className="space-y-3">
                    <div>
                      <span className="text-[var(--color-primary)] text-xs font-semibold uppercase tracking-wider">Descuento %</span>
                      <input autoFocus type="number" step="1" min="0" max="100"
                        className="w-full bg-white border-2 border-[var(--color-primary-border)] rounded-lg p-3 text-2xl text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] mt-1"
                        value={discountValue}
                        onChange={(e) => {
                          const idx = selectedCartIndex < cart.length ? selectedCartIndex : cart.length - 1;
                          const item = cart[idx];
                          if (!item) return;
                          setDiscountValue(e.target.value);
                          const pct = parseFloat(e.target.value);
                          if (!isNaN(pct)) setItemDiscount(item.id, pct);
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-[var(--color-primary)] text-xs font-semibold uppercase tracking-wider">Precio Unitario</span>
                      <input type="number" step="50" min="0"
                        className="w-full bg-white border-2 border-[var(--color-primary-border)] rounded-lg p-3 text-2xl text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] mt-1"
                        value={priceOverrideValue}
                        onChange={(e) => {
                          const idx = selectedCartIndex < cart.length ? selectedCartIndex : cart.length - 1;
                          const item = cart[idx];
                          if (!item) return;
                          setPriceOverrideValue(e.target.value);
                          const price = parseFloat(e.target.value);
                          if (!isNaN(price)) setItemPrice(item.id, price);
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-[var(--color-primary)] text-white py-2 rounded-lg font-semibold hover:bg-[var(--color-primary-dark)] transition-colors text-sm">
                        Aplicar
                      </button>
                      <button type="button" onClick={() => { setShowDiscountMode(false); searchInputRef.current?.focus(); }} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                        Cancelar
                      </button>
                    </div>
                  </form>
                  {(() => {
                    const idx = selectedCartIndex < cart.length ? selectedCartIndex : cart.length - 1;
                    const item = cart[idx];
                    if (!item) return null;
                    const ahorro = item.cantidad * item.precio_original * (item.descuento_porcentaje / 100);
                    return (
                      <div className="text-xs text-gray-500 space-y-1 mt-2">
                        <p>Original: <span className="text-gray-900 font-medium">${fmt2(item.cantidad * item.precio_original)}</span></p>
                        {item.descuento_porcentaje > 0 && <p>Ahorro: <span className="text-green-600 font-medium">-${fmt2(ahorro)}</span></p>}
                        <p>{item.descripcion} × {item.cantidad.toFixed(3)}</p>
                      </div>
                    );
                  })()}
                </div>
              ) : isEditQtyMode ? (
                <div className="space-y-2">
                  <form onSubmit={handleQtySubmit} className="flex relative">
                    <span className="absolute left-3 top-3 text-[var(--color-primary)] font-semibold text-xs">QTY</span>
                    <input ref={qtyInputRef} autoFocus type="number" step="0.001"
                      className="w-full bg-white border-2 border-[var(--color-primary-border)] rounded-lg p-3 pl-10 text-3xl text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]"
                      placeholder="Nueva cantidad..." value={qtyValue} onChange={(e) => setQtyValue(e.target.value)}
                    />
                  </form>
                  <div className="flex gap-2">
                    {[0.5, 1, 2, 5, 10].map((delta) => (
                      <button key={String(delta)} type="button" onClick={() => applyQtyPreset(delta)}
                        className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm">
                        +{delta}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSearchSubmit} className="flex">
                    <input ref={searchInputRef} type="text" disabled={aperturaBloqueada}
                      className={`w-full text-xl p-3 rounded-lg border outline-none transition-colors ${
                        aperturaBloqueada
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : scanFeedback === 'success'
                            ? 'border-green-300 bg-green-50 text-gray-900'
                            : 'bg-white text-gray-900 border-gray-300 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]'
                      }`}
                      placeholder={aperturaBloqueada ? 'Abra caja primero (F1)...' : 'Buscar producto o código de barras...'}
                      value={searchValue} onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </form>
                  {searchResults.length > 0 && (
                    <div className="absolute z-50 w-[65%] bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {searchResults.map((p, idx) => (
                        <button key={p.id} type="button" onClick={() => selectSearchResult(p)}
                          className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 last:border-0 transition-colors ${
                            idx === selectedResultIndex ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : 'text-gray-700 hover:bg-gray-50'
                          }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold truncate">{p.descripcion}</span>
                              <span className="text-[10px] text-gray-400">
                                {p.codigo_barras}{p.categoria_nombre ? ` · ${p.categoria_nombre}` : ''}
                              </span>
                            </div>
                            <span className="text-[var(--color-primary)] font-bold tabular-nums ml-2 shrink-0">${fmt2(p.precio_venta)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Empty state */}
            <div className={`flex-1 flex items-center justify-center text-lg font-semibold border-2 border-dashed rounded-xl m-4 ${
              aperturaBloqueada
                ? 'text-amber-500 border-amber-300 bg-amber-50 animate-pulse'
                : 'text-gray-400 border-gray-200 bg-white'
            }`}>
              {aperturaBloqueada ? '⚠ Sin apertura de caja' : 'Sistema en espera de lectura EAN'}
            </div>
          </div>
        </div>
      )}

      {showReports && <ReportsPanel onClose={() => setShowReports(false)} />}
      {showAperturaModal && (
        <AperturaTurnoModal
          onSuccess={handleAperturaSuccess}
          onCancel={() => setShowAperturaModal(false)}
        />
      )}
      {showClosure && currentAperturaId && (
        <CashRegisterClose
          aperturaId={currentAperturaId}
          onClose={() => setShowClosure(false)}
          onLogout={async () => {
            setShowClosure(false);
            setApertura(null, null);
            try { await supabase.auth.signOut(); } catch { /* ok */ }
            localStorage.clear();
            setSession(null);
          }}
        />
      )}
      {isPaymentModalOpen && currentAperturaId && (
        <PaymentModal onClose={() => { setPaymentModalOpen(false); searchInputRef.current?.focus(); }} />
      )}
      {showOverride && (
        <AdminOverrideModal
          actionName="ELIMINAR ÍTEM DEL CARRITO"
          onCancel={() => { setShowOverride(false); setPendingRemoveId(null); searchInputRef.current?.focus(); }}
          onSuccess={confirmRemoveItem}
        />
      )}
      {showFreeSale && <FreeSaleModal onClose={() => { setShowFreeSale(false); searchInputRef.current?.focus(); }} />}
      {showReturn && <ReturnModal onClose={() => { setShowReturn(false); searchInputRef.current?.focus(); }} />}
      {showSaleHistory && <SaleHistory onClose={() => setShowSaleHistory(false)} />}
      {showConfig && <ConfigPanel onClose={() => setShowConfig(false)} />}
      {showLegal && <LegalSoporteModal onClose={() => { setShowLegal(false); searchInputRef.current?.focus(); }} />}
      {showKeyboardShortcuts && <KeyboardShortcutsModal onClose={() => { setShowKeyboardShortcuts(false); searchInputRef.current?.focus(); }} />}
      {weightProduct && (
        <WeightModal
          productId={weightProduct.id}
          codigoBarras={weightProduct.codigo_barras}
          descripcion={weightProduct.descripcion}
          precioUnitario={weightProduct.precio_venta}
          tarifaIva={weightProduct.tarifa_iva}
          tarifaImpoconsumo={weightProduct.tarifa_impoconsumo}
          onConfirm={() => { setWeightProduct(null); searchInputRef.current?.focus(); }}
          onCancel={() => { setWeightProduct(null); searchInputRef.current?.focus(); }}
        />
      )}
      {scanToast && (
        <div className="fixed bottom-6 right-6 z-[200] animate-[slideUp_250ms_ease-out]">
          <div className={`rounded-xl px-5 py-3 shadow-lg border text-sm font-medium flex items-center gap-3 ${
            scanToast.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {scanToast.ok ? <Check size={18} /> : <CircleX size={18} />}
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-70">{scanToast.ok ? 'Escaneado' : 'No encontrado'}</p>
              <p className="font-mono font-bold">{scanToast.code}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
