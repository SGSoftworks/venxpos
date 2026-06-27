import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { CloseX } from './Icons';

export const ReturnModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { session } = useAppStore();
  const [ticketSearch, setTicketSearch] = useState('');
  const [venta, setVenta] = useState<{ id: string; ticket_number: number; total: number; metodo_pago: string; fecha_hora: string } | null>(null);
  const [detalles, setDetalles] = useState<{ id: string; producto_id: string; cantidad_o_peso: number; precio_unitario: number; subtotal: number; tarifa_iva_aplicada: number; tarifa_impoconsumo_aplicada: number }[]>([]);
  const [motivo, setMotivo] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);

  const search = async () => {
    if (!ticketSearch.trim()) return;
    const { data } = await supabase.from('ventas').select('*').eq('ticket_number', parseInt(ticketSearch)).eq('sucursal_id', session?.sucursal_id).limit(1);
    if (data && data.length > 0) {
      setVenta(data[0] as typeof venta);
      const { data: dets } = await supabase.from('venta_detalles').select('*').eq('venta_id', data[0].id);
      setDetalles((dets || []) as typeof detalles);
      setError(null);
    } else { setError('Venta no encontrada'); setVenta(null); }
  };

  const processReturn = async () => {
    if (!venta || !session) return;
    try {
      const devId = crypto.randomUUID(); const now = new Date().toISOString();
      await supabase.from('devoluciones').insert({ id: devId, sucursal_id: session.sucursal_id, cajero_id: session.usuario_db_id ?? session.id, venta_original_id: venta.id, ticket_original: venta.ticket_number, subtotal: -venta.total, impuestos: 0, total: -venta.total, metodo_pago: venta.metodo_pago, fecha_hora: now, motivo: motivo || null, hash: crypto.randomUUID() });
      for (const d of detalles) {
        await supabase.from('devolucion_detalles').insert({ id: crypto.randomUUID(), devolucion_id: devId, producto_id: d.producto_id, cantidad: -d.cantidad_o_peso, precio_unitario: d.precio_unitario, subtotal: -d.subtotal, tarifa_iva_aplicada: d.tarifa_iva_aplicada, tarifa_impoconsumo_aplicada: d.tarifa_impoconsumo_aplicada });
        try { await supabase.rpc('incrementar_inventario', { p_sucursal_id: session.sucursal_id, p_producto_id: d.producto_id, p_cantidad: Math.abs(d.cantidad_o_peso), p_devolucion_id: devId, p_usuario_id: session.usuario_db_id ?? session.id }); } catch { /* fallback */ }
      }
      setMsg('Devolución registrada exitosamente');
      setTimeout(() => onClose(), 1500);
    } catch (e) { console.error(e); setError('Error al procesar devolución'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_150ms_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl max-h-[85vh] flex flex-col animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center"><h2 className="text-lg font-bold text-gray-900">Devolución</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1"><CloseX size={18} /></button></div>
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div className="flex gap-2"><input placeholder="# Ticket" value={ticketSearch} onChange={e => setTicketSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') search(); }} className="flex-1 bg-white border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[var(--color-primary)]" /><button onClick={search} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium">Buscar</button></div>
          {venta && (<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-semibold">Ticket #{venta.ticket_number} — {new Date(venta.fecha_hora).toLocaleString('es-CO')}</p>
            <p className="text-sm text-gray-500">Método: {venta.metodo_pago} | Total: ${venta.total.toLocaleString()}</p>
            <div className="mt-2 space-y-1">{detalles.map(d => (<div key={d.id} className="flex justify-between text-sm"><span>{d.producto_id} x {d.cantidad_o_peso}</span><span>${d.subtotal}</span></div>))}</div>
            <textarea placeholder="Motivo de devolución (opcional)" value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full mt-2 bg-white border border-gray-300 rounded-lg p-2 text-sm outline-none" />
            <button onClick={processReturn} className="w-full mt-3 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 text-sm">Procesar devolución</button>
          </div>)}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
          {msg && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{msg}</div>}
        </div>
      </div>
    </div>
  );
};
