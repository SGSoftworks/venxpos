import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { CloseX } from './Icons';

export const SaleHistory: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { lastCompletedSale, setLastCompletedSale } = useAppStore();

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  const [ventas, setVentas] = useState<{ id: string; ticket_number: number; total: number; subtotal: number; metodo_pago: string; fecha_hora: string }[]>([]);
  const [selectedVenta, setSelectedVenta] = useState<{ id: string; ticket_number: number; total: number; subtotal: number; metodo_pago: string; fecha_hora: string } | null>(null);
  const [detalles, setDetalles] = useState<{ id: string; producto_id: string; descripcion: string; cantidad_o_peso: number; precio_unitario: number; subtotal: number }[]>([]);
  const [fechaDesde, setFechaDesde] = useState(() => new Date().toISOString().slice(0, 10));
  const [fechaHasta, setFechaHasta] = useState(() => new Date().toISOString().slice(0, 10));

  const cargarVentas = async () => {
    const { data } = await supabase.from('ventas').select('id, ticket_number, total, subtotal, metodo_pago, fecha_hora').gte('fecha_hora', fechaDesde).lte('fecha_hora', fechaHasta + 'T23:59:59.999Z').order('fecha_hora', { ascending: false }).limit(200);
    if (data) setVentas(data as typeof ventas);
  };

  useEffect(() => { cargarVentas(); }, [fechaDesde, fechaHasta]);

  const verDetalle = async (v: typeof ventas[0]) => {
    setSelectedVenta(v);
    const { data: dets } = await supabase.from('venta_detalles').select('*, productos(descripcion)').eq('venta_id', v.id);
    setDetalles((dets || []).map(d => ({
      ...d, descripcion: ((d as Record<string, unknown>).productos as { descripcion: string } | null)?.descripcion ?? d.producto_id as string,
    })) as typeof detalles);
  };

  const reimprimir = () => {
    if (!selectedVenta) return;
    const originalSale = lastCompletedSale;
    setLastCompletedSale({
      ticketNumber: selectedVenta.ticket_number,
      items: detalles.map(d => ({ descripcion: d.descripcion, cantidad: d.cantidad_o_peso, precio_unitario: d.precio_unitario, precio_original: d.precio_unitario, descuento_porcentaje: 0, subtotal: d.subtotal })),
      subtotal: selectedVenta.subtotal, total: selectedVenta.total, metodoPago: selectedVenta.metodo_pago, montoRecibido: 0, cambioEntregado: 0, fecha: selectedVenta.fecha_hora,
    });
    setTimeout(() => { try { window.print(); } catch { /* ok */ } if (originalSale) setLastCompletedSale(originalSale); }, 300);
  };

  const fmt2 = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_150ms_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200"><h2 className="text-lg font-bold text-gray-900">Historial de Ventas</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1"><CloseX size={18} /></button></div>
        <div className="p-4 border-b border-gray-200 flex gap-3 items-center bg-gray-50">
          <label className="text-xs text-gray-500">Desde:</label><input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="bg-white p-2 rounded-lg border border-gray-300 text-sm outline-none" />
          <label className="text-xs text-gray-500">Hasta:</label><input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="bg-white p-2 rounded-lg border border-gray-300 text-sm outline-none" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            {ventas.map(v => (<button key={v.id} onClick={() => verDetalle(v)} className={`w-full p-3 border-b border-gray-100 cursor-pointer hover:bg-[var(--color-primary-light)] transition-colors ${selectedVenta?.id === v.id ? 'bg-[var(--color-primary-light)] border-l-4 border-l-[var(--color-primary)]' : ''}`}><div className="flex justify-between"><span className="font-mono font-semibold text-gray-700">#{v.ticket_number}</span><span className="font-bold">${fmt2(v.total)}</span></div><div className="flex justify-between text-xs text-gray-400 mt-1"><span>{new Date(v.fecha_hora).toLocaleString('es-CO')}</span><span>{v.metodo_pago}</span></div></button>))}
          </div>
          <div className="w-1/2 overflow-y-auto p-4">
            {selectedVenta && (<div className="space-y-4">
              <div><h3 className="text-sm font-semibold text-gray-700">Ticket #{selectedVenta.ticket_number}</h3><p className="text-xs text-gray-500">{new Date(selectedVenta.fecha_hora).toLocaleString('es-CO')} — {selectedVenta.metodo_pago}</p></div>
              <div className="space-y-1">{detalles.map(d => (<div key={d.id} className="flex justify-between text-sm py-1 border-b border-gray-100"><span>{d.descripcion} x {d.cantidad_o_peso}</span><span>${fmt2(d.subtotal)}</span></div>))}</div>
              <div className="border-t border-gray-200 pt-2 space-y-1"><div className="flex justify-between text-sm"><span>Subtotal</span><span>${fmt2(selectedVenta.subtotal)}</span></div><div className="flex justify-between font-bold text-sm"><span>Total</span><span>${fmt2(selectedVenta.total)}</span></div></div>
              <button onClick={reimprimir} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)]">Reimprimir Ticket</button>
            </div>)}
          </div>
        </div>
      </div>
    </div>
  );
};
