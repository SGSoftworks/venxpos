import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { CloseX } from './Icons';

interface FreeSaleModalProps {
  initialValue?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  { num: '1', name: 'Carnes' },
  { num: '2', name: 'Quesos' },
  { num: '3', name: 'Verduras' },
  { num: '4', name: 'Frutas' },
  { num: '5', name: 'Panadería' },
  { num: '6', name: 'Dulcería' },
  { num: '7', name: 'Huevos' },
  { num: '8', name: 'Bebidas' },
  { num: '9', name: 'Otros' },
] as const;

export const FreeSaleModal: React.FC<FreeSaleModalProps> = ({ initialValue = '', onClose, onSuccess }) => {
  const { session, addToCart } = useAppStore();
  const [valor, setValor] = useState(initialValue);
  const [categoria, setCategoria] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const confirm = useCallback(async (catName?: string) => {
    const cat = catName || categoria;
    if (!cat) { setError('Seleccione una categoría con 1-9'); return; }
    const v = parseFloat(valor);
    if (!v || v <= 0) { setError('Ingrese un valor válido'); return; }
    const code = `VL-${cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/ /g, '_')}`;
    let { data } = await supabase
      .from('productos')
      .select('id, codigo_barras, descripcion, precio_venta, tarifa_iva, tarifa_impoconsumo')
      .eq('codigo_barras', code)
      .eq('sucursal_id', session?.sucursal_id)
      .limit(1);
    if (!data || data.length === 0) {
      const prodId = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from('productos')
        .insert({
          id: prodId,
          sucursal_id: session?.sucursal_id,
          codigo_barras: code,
          descripcion: `Venta Libre ${cat}`,
          precio_venta: 0,
          costo: 0,
          tarifa_iva: 0,
          tarifa_impoconsumo: 0,
          stock_minimo: 999,
          categoria_id: null,
        });
      if (insertError) { setError('Error al crear producto de venta libre'); return; }
      await supabase
        .from('inventario_sucursal')
        .upsert({
          sucursal_id: session?.sucursal_id,
          producto_id: prodId,
          stock_actual: 99999,
          version: 1,
        }, { onConflict: 'sucursal_id, producto_id' });
      data = [{
        id: prodId,
        codigo_barras: code,
        descripcion: `Venta Libre ${cat}`,
        precio_venta: 0,
        tarifa_iva: 0,
        tarifa_impoconsumo: 0,
      }];
    }
    if (data && data.length > 0) {
      const p = data[0];
      await supabase
        .from('inventario_sucursal')
        .upsert({
          sucursal_id: session?.sucursal_id,
          producto_id: p.id,
          stock_actual: 99999,
          version: 1,
        }, { onConflict: 'sucursal_id, producto_id' });
      addToCart({
        producto_id: p.id, codigo_barras: p.codigo_barras, descripcion: p.descripcion,
        cantidad: 1, precio_unitario: v,
        tarifa_iva: p.tarifa_iva as number, tarifa_impoconsumo: p.tarifa_impoconsumo as number,
      });
      onClose();
      onSuccess?.();
    } else {
      setError('Producto de venta libre no encontrado');
    }
  }, [categoria, valor, session, addToCart, onClose, onSuccess]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const cat = CATEGORIES[parseInt(e.key) - 1].name;
        setCategoria(cat);
        setError('');
        confirm(cat);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [confirm, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_150ms_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-xs animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Venta Libre</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors">
            <CloseX size={16} />
          </button>
        </div>
        <div className="px-4 pb-4 space-y-3">
          <input ref={inputRef} type="text" inputMode="decimal"
            className="w-full bg-gray-50 border-2 border-[var(--color-primary-border)] rounded-lg px-3 py-2.5 text-2xl font-bold text-gray-900 text-right outline-none focus:border-[var(--color-primary)] tabular-nums"
            value={valor}
            onChange={(e) => { setValor(e.target.value); setError(''); }}
            placeholder="0"
          />
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">Categoría</p>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((c) => (
                <button key={c.num} onClick={() => { setCategoria(c.name); setError(''); confirm(c.name); }}
                  className={`relative pt-3.5 pb-2 rounded-lg text-xs font-medium transition-colors active:scale-95 ${
                    categoria === c.name
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`absolute left-1.5 top-0.5 text-[10px] font-bold ${
                    categoria === c.name ? 'text-white/60' : 'text-gray-400'
                  }`}>
                    {c.num}
                  </span>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}
          <button onClick={() => confirm(categoria)}
            className="w-full bg-[var(--color-primary)] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors active:scale-95"
          >
            {categoria
              ? `Agregar $${valor || '0'} · ${categoria}`
              : 'Seleccione categoría (1-9)'}
          </button>
        </div>
      </div>
    </div>
  );
};
