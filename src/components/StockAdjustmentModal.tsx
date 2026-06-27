import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { CloseX } from './Icons';

interface Props { productId: string; productName: string; currentStock: number; onSuccess: () => void; onClose: () => void; }

export const StockAdjustmentModal: React.FC<Props> = ({ productId, productName, currentStock, onSuccess, onClose }) => {
  const { session } = useAppStore();
  const [tipo, setTipo] = useState<'entrada' | 'salida' | 'ajuste'>('ajuste');
  const [cantidad, setCantidad] = useState('');
  const [observacion, setObservacion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);

  const apply = async () => {
    if (!session) return;
    const qty = parseFloat(cantidad);
    if (isNaN(qty) || qty <= 0) { setError('Cantidad inválida'); return; }
    setLoading(true); setError('');
    try {
      const delta = tipo === 'entrada' ? qty : tipo === 'salida' ? -qty : qty - currentStock;
      const stockResultante = Math.max(0, currentStock + delta);
      const id = crypto.randomUUID(); const fechaHora = new Date().toISOString();
      await supabase.from('inventario_sucursal').upsert({ sucursal_id: session.sucursal_id, producto_id: productId, stock_actual: stockResultante, version: 1, last_updated: fechaHora }, { onConflict: 'sucursal_id, producto_id' });
      await supabase.from('movimientos_inventario').insert({ id, sucursal_id: session.sucursal_id, producto_id: productId, tipo: tipo === 'ajuste' ? 'ajuste' : tipo === 'entrada' ? 'entrada_manual' : 'salida_manual', cantidad: delta, stock_resultante: stockResultante, usuario_id: session.usuario_db_id ?? session.id, observacion: observacion || `${tipo} manual`, created_at: fechaHora });
      await supabase.from('eventos_auditoria').insert({ id: crypto.randomUUID(), sucursal_id: session.sucursal_id, usuario_id: session.usuario_db_id ?? session.id, tipo: 'ajuste_inventario', descripcion: `Ajuste: ${tipo} ${delta > 0 ? '+' : ''}${delta} → ${stockResultante} (${productName})`, metadata: { producto_id: productId, tipo, cantidad_anterior: currentStock, cantidad_nueva: stockResultante }, created_at: fechaHora });
      onSuccess();
    } catch (e) { console.error(e); setError('Error al procesar ajuste'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_150ms_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center"><h2 className="text-lg font-bold text-gray-900">Ajustar Stock</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1"><CloseX size={18} /></button></div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-500">Producto: <span className="font-semibold text-gray-900">{productName}</span> | Stock actual: <span className="font-bold">{currentStock}</span></p>
          <div className="flex gap-2">{(['entrada', 'salida', 'ajuste'] as const).map(t => (<button key={t} onClick={() => setTipo(t)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tipo === t ? 'bg-[var(--color-primary)] text-white' : 'bg-white border border-gray-300 text-gray-700'}`}>{t === 'entrada' ? 'Entrada (+)' : t === 'salida' ? 'Salida (−)' : 'Ajuste'}</button>))}</div>
          {tipo === 'ajuste' ? <input type="number" step="0.01" min="0" placeholder="Nuevo stock" value={cantidad} onChange={e => setCantidad(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[var(--color-primary)]" /> : <input type="number" step="0.01" min="0" placeholder="Cantidad" value={cantidad} onChange={e => setCantidad(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[var(--color-primary)]" />}
          <input placeholder="Observación (opcional)" value={observacion} onChange={e => setObservacion(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm outline-none" />
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
          <button onClick={apply} disabled={loading} className="w-full bg-[var(--color-primary)] text-white py-2.5 rounded-lg font-semibold hover:bg-[var(--color-primary-dark)] disabled:bg-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] text-sm">{loading ? 'Procesando...' : 'Aplicar ajuste'}</button>
        </div>
      </div>
    </div>
  );
};
