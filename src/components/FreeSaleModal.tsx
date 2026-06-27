import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { CloseX } from './Icons';

const CATEGORIES = ['Carnes', 'Quesos', 'Verduras', 'Frutas', 'Panadería', 'Dulcería', 'Huevos', 'Bebidas', 'Otros'];

export const FreeSaleModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { session, addToCart } = useAppStore();
  const [categoria, setCategoria] = useState('');
  const [valor, setValor] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, [categoria]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const confirm = async () => {
    if (!categoria) { setError('Seleccione una categoría'); return; }
    const v = parseFloat(valor);
    if (!v || v <= 0) { setError('Ingrese un valor válido'); return; }
    const code = `VL-${categoria.toUpperCase().replace(/ /g, '_')}`;
    const { data } = await supabase.from('productos').select('id, codigo_barras, descripcion, precio_venta, tarifa_iva, tarifa_impoconsumo').eq('codigo_barras', code).eq('sucursal_id', session?.sucursal_id).limit(1);
    if (data && data.length > 0) {
      const p = data[0];
      addToCart({ producto_id: p.id, codigo_barras: p.codigo_barras, descripcion: p.descripcion, cantidad: 1, precio_unitario: v, tarifa_iva: p.tarifa_iva as number, tarifa_impoconsumo: p.tarifa_impoconsumo as number });
      onClose();
    } else {
      setError('Producto de venta libre no encontrado');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_150ms_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center"><h2 className="text-lg font-bold text-gray-900">Venta Libre</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1"><CloseX size={18} /></button></div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-2">{CATEGORIES.map((c) => (<button key={c} onClick={() => { setCategoria(c); setError(''); }} className={`py-2 rounded-lg text-xs font-medium transition-colors ${categoria === c ? 'bg-[var(--color-primary)] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{c}</button>))}</div>
          {categoria && <div><label className="block text-gray-500 text-sm mb-1.5 font-medium">Valor ($)</label><input ref={inputRef} type="number" step="0.01" min="0" className="w-full bg-white border-2 border-[var(--color-primary-border)] rounded-lg p-4 text-3xl text-gray-900 outline-none focus:border-[var(--color-primary)]" value={valor} onChange={(e) => { setValor(e.target.value); setError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') onClose(); }} /></div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
          <button onClick={confirm} className="w-full bg-[var(--color-primary)] text-white py-3 rounded-lg font-semibold hover:bg-[var(--color-primary-dark)]">Agregar venta libre</button>
        </div>
      </div>
    </div>
  );
};
