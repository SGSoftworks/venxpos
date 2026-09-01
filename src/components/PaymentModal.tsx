import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { CloseX } from './Icons';

export const PaymentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { session, cart, cartSubtotal, cartTotal, clearCart, setLastCompletedSale } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);

  type Metodo = 'EFECTIVO' | 'BILLETERA' | 'QR' | 'MIXTO';
  const [method, setMethod] = useState<Metodo>('EFECTIVO');
  const [received, setReceived] = useState<string>('');
  const [mixEfectivo, setMixEfectivo] = useState<string>('');
  const [mixQR, setMixQR] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const receivedAmount = parseFloat(received) || 0;
  const change = receivedAmount - cartTotal;
  const mixEfectivoNum = parseFloat(mixEfectivo) || 0;
  const mixQRNum = parseFloat(mixQR) || 0;
  const mixOk = Math.abs((mixEfectivoNum + mixQRNum) - cartTotal) < 0.01;
  const isValid = method === 'EFECTIVO' ? receivedAmount >= cartTotal : method === 'MIXTO' ? mixOk : true;

  useEffect(() => { inputRef.current?.focus(); }, [method]);

  const computeVentaHash = useCallback(async (ventaId: string, fechaHora: string): Promise<string> => {
    const payload = `${ventaId}|${cartSubtotal}|${cartTotal}|${fechaHora}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }, [cartSubtotal, cartTotal]);

  const nextTicketNumber = useCallback(async (sucursalId: string): Promise<number> => {
    const { data } = await supabase.from('ventas').select('ticket_number').eq('sucursal_id', sucursalId).order('ticket_number', { ascending: false }).limit(1);
    return (data && data.length > 0 && data[0].ticket_number) ? ((data[0].ticket_number as number) + 1) : 1;
  }, []);

  const handlePayment = useCallback(async () => {
    if (processing || !session) return;
    setProcessing(true);
    setErrorMessage(null);
    try {
      const ventaId = crypto.randomUUID();
      const fechaHora = new Date().toISOString();
      const ticketNumber = await nextTicketNumber(session.sucursal_id);
      const mRecibido = method === 'EFECTIVO' ? receivedAmount : method === 'MIXTO' ? mixEfectivoNum + mixQRNum : cartTotal;
      const mCambio = method === 'EFECTIVO' ? change : 0;
      const hash = await computeVentaHash(ventaId, fechaHora);

      for (const item of cart) {
        const { data: invRow, error: invError } = await supabase
          .from('inventario_sucursal')
          .select('stock_actual')
          .eq('sucursal_id', session.sucursal_id)
          .eq('producto_id', item.producto_id)
          .maybeSingle();
        if (invError) {
          throw new Error(`Error verificando stock de ${item.descripcion}: ${invError.message}`);
        }
        const stock = invRow?.stock_actual != null ? Number(invRow.stock_actual) : 0;
        if (stock < item.cantidad) {
          throw new Error(`Stock insuficiente: ${item.descripcion} (disponible: ${stock}, requerido: ${item.cantidad})`);
        }
      }

      const { error: saleError } = await supabase.from('ventas').insert({
        id: ventaId, sucursal_id: session.sucursal_id, cajero_id: session.usuario_db_id ?? session.id,
        subtotal: cartSubtotal, total: cartTotal, metodo_pago: method,
        monto_recibido: mRecibido, cambio_entregado: mCambio, hash, ticket_number: ticketNumber, fecha_hora: fechaHora,
      });
      if (saleError) throw saleError;

      if (cart.length > 0) {
        const detalles = cart.map((item) => ({
          id: crypto.randomUUID(), venta_id: ventaId, producto_id: item.producto_id,
          cantidad_o_peso: item.cantidad, precio_unitario: item.precio_unitario, subtotal: item.subtotal,
          descuento: 0, costo_aplicado: null,
        }));
        const { error: detError } = await supabase.from('venta_detalles').insert(detalles);
        if (detError) throw detError;

        for (const item of cart) {
          const { error: decError } = await supabase.rpc('decrementar_inventario', {
            p_sucursal_id: session.sucursal_id, p_producto_id: item.producto_id,
            p_cantidad: item.cantidad, p_venta_id: ventaId, p_usuario_id: session.usuario_db_id ?? session.id,
          });
          if (decError) {
            console.error(`[STOCK] RPC decrementar_inventario falló para ${item.descripcion}:`, decError);
            throw new Error(`Error descontando stock de ${item.descripcion}: ${decError.message}`);
          }
        }
      }

      const metodoPagoDisplay = method === 'MIXTO'
        ? `MIXTO (EFECTIVO $${mixEfectivoNum.toLocaleString()} + QR $${mixQRNum.toLocaleString()})` : method;

      setLastCompletedSale({
        ticketNumber, items: cart.map((item) => ({
          descripcion: item.descripcion, cantidad: item.cantidad, precio_unitario: item.precio_unitario,
          precio_original: item.precio_original, descuento_porcentaje: item.descuento_porcentaje, subtotal: item.subtotal,
        })),
        subtotal: cartSubtotal, total: cartTotal,
        metodoPago: metodoPagoDisplay,
        montoRecibido: mRecibido, cambioEntregado: mCambio, fecha: fechaHora,
      });
      clearCart();
      setTimeout(() => { try { window.print(); } catch { /* ok */ } }, 200);
      setTimeout(() => onClose(), 1500);
    } catch (e) {
      console.error('Error guardando la venta', e);
      setErrorMessage(e instanceof Error ? e.message : 'Error al guardar la venta');
    } finally { setProcessing(false); }
  }, [processing, session, method, receivedAmount, mixEfectivoNum, mixQRNum, cartTotal, cart, cartSubtotal, change, computeVentaHash, nextTicketNumber, setLastCompletedSale, clearCart, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_150ms_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Procesar Pago</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1" disabled={processing}><CloseX size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-[var(--color-primary-light)] border border-[var(--color-primary-border)] rounded-lg p-4 text-center">
            <p className="text-xs text-[var(--color-primary)] font-semibold uppercase tracking-wider mb-1">Total a pagar</p>
            <p className="text-4xl font-black text-[var(--color-primary)]">${cartTotal.toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['EFECTIVO', 'BILLETERA', 'QR', 'MIXTO'] as Metodo[]).map((m) => (
              <button key={m} onClick={() => setMethod(m)}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${method === m ? 'bg-[var(--color-primary)] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                {m === 'BILLETERA' ? 'Billetera' : m === 'QR' ? 'Código QR' : m.charAt(0) + m.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          {method === 'EFECTIVO' && (
            <div>
              <label className="block text-gray-500 text-sm mb-1.5 font-medium">Monto recibido</label>
              <input ref={inputRef} type="number" step="0.01" min="0"
                className="w-full bg-white border-2 border-[var(--color-primary-border)] rounded-lg p-4 text-3xl text-gray-900 outline-none focus:border-[var(--color-primary)]"
                value={received} onChange={(e) => setReceived(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && isValid) handlePayment(); }} />
              {receivedAmount > 0 && change >= 0 && (
                <div className="mt-2 text-center text-sm">
                  <span className="text-gray-500">Cambio: </span>
                  <span className="text-green-600 font-bold">${change.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
          {method === 'MIXTO' && (
            <div className="space-y-2">
              <div><label className="text-xs text-gray-500">Efectivo</label>
                <input type="number" step="0.01" className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-900 outline-none" value={mixEfectivo} onChange={(e) => setMixEfectivo(e.target.value)} /></div>
              <div><label className="text-xs text-gray-500">Código QR</label>
                <input type="number" step="0.01" className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-900 outline-none" value={mixQR} onChange={(e) => setMixQR(e.target.value)} /></div>
              <p className="text-xs text-gray-400">{mixOk ? 'Coincide' : `Faltan $${(cartTotal - mixEfectivoNum - mixQRNum).toLocaleString()}`}</p>
            </div>
          )}
          {errorMessage && <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg p-3">{errorMessage}</div>}
          <button onClick={handlePayment} disabled={!isValid || processing}
            className={`w-full py-3.5 font-semibold rounded-lg text-sm transition-colors ${isValid && !processing ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {processing ? 'Procesando...' : 'Confirmar Pago (Enter)'}
          </button>
        </div>
      </div>
    </div>
  );
};