import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { exportPdf } from '../lib/pdfExport';
import { CloseX } from './Icons';
import iconApp from '../assets/branding/icon-app.png';

interface Props { aperturaId: string; onClose: () => void; onLogout: () => void; }
type CloseStatus = 'CUADRADO' | 'SOBRANTE' | 'FALTANTE';
type Step = 'loading' | 'form' | 'confirm' | 'done';
const fmt2 = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

export const CashRegisterClose: React.FC<Props> = ({ aperturaId, onClose, onLogout }) => {
  const { session } = useAppStore();
  const [step, setStep] = useState<Step>('loading');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [efectivoContado, setEfectivoContado] = useState('');
  const [branchName, setBranchName] = useState('');
  const [doneData, setDoneData] = useState<{ status: CloseStatus; diferencia: number; ventas: number; articulos: number; totalVendido: number; efectivoEsperado: number; efectivoContado: number; } | null>(null);
  const [aperturaData, setAperturaData] = useState<{ fondoInicial: number; fechaApertura: string; efectivoEsperado: number; ventas: { total: number; count: number; subtotal: number; impuestos: number }; articulos: number; metodos: { metodo: string; total: number }[]; } | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && step !== 'done') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose, step]);

  useEffect(() => {
    if (step !== 'done') return;
    setCountdown(3);
    const timer = setInterval(() => { setCountdown(c => c - 1); }, 1000);
    const redirect = setTimeout(() => onLogout(), 3000);
    return () => { clearInterval(timer); clearTimeout(redirect); };
  }, [step, onLogout]);

  useEffect(() => { (async () => {
    if (!session) return;
    try {
      const [{ data: ap }, { data: sRows }] = await Promise.all([
        supabase.from('aperturas_caja').select('fondo_inicial, fecha_apertura').eq('id', aperturaId).single(),
        supabase.from('sucursales').select('nombre').eq('id', session.sucursal_id).limit(1),
      ]);
      if (!ap) throw new Error('Apertura no encontrada');
      if (sRows && sRows.length > 0) setBranchName(sRows[0].nombre);
      const [{ data: ventasData }, { data: metodosData }] = await Promise.all([
        supabase.from('ventas').select('total, subtotal, impuestos').eq('sucursal_id', session.sucursal_id).gte('fecha_hora', ap.fecha_apertura),
        supabase.from('ventas').select('metodo_pago, monto_recibido, cambio_entregado').eq('sucursal_id', session.sucursal_id).gte('fecha_hora', ap.fecha_apertura),
      ]);
      const ventas = { total: 0, count: 0, subtotal: 0, impuestos: 0 };
      const articulos = 0;
      if (ventasData) { ventasData.forEach(v => { ventas.total += v.total as number; ventas.subtotal += v.subtotal as number; ventas.impuestos += v.impuestos as number; ventas.count++; }); }
      const efectivoVentas = (metodosData || []).filter(m => m.metodo_pago === 'EFECTIVO').reduce((s, m) => s + ((m.monto_recibido as number) - (m.cambio_entregado as number)), 0);
      const metodosMap = new Map<string, number>();
      (metodosData || []).forEach(m => { const k = m.metodo_pago as string; metodosMap.set(k, (metodosMap.get(k) || 0) + ((m.monto_recibido as number) - (m.cambio_entregado as number))); });
      setAperturaData({ fondoInicial: ap.fondo_inicial, fechaApertura: ap.fecha_apertura, efectivoEsperado: ap.fondo_inicial + efectivoVentas, ventas, articulos, metodos: Array.from(metodosMap.entries()).map(([k, v]) => ({ metodo: k, total: v })) });
      setStep('form');
    } catch (e) { console.error(e); setError('Error al cargar datos'); setStep('form'); }
  })(); }, [session, aperturaId]);

  const contadoNum = parseFloat(efectivoContado) || 0;
  const diferencia = contadoNum - (aperturaData?.efectivoEsperado ?? 0);
  const status: CloseStatus = diferencia === 0 ? 'CUADRADO' : diferencia > 0 ? 'SOBRANTE' : 'FALTANTE';
  const handleConfirm = () => { if (!efectivoContado.trim() || isNaN(parseFloat(efectivoContado))) { setError('Ingrese el efectivo contado'); return; } setError(null); setStep('confirm'); };

  const handleClose = async (print: boolean) => {
    if (!session || !aperturaData) return; setSaving(true); setError(null);
    try {
      const now = new Date().toISOString(); const diff = diferencia; const cierreId = crypto.randomUUID();
      await supabase.from('cierres_caja').insert({ id: cierreId, sucursal_id: session.sucursal_id, cajero_id: session.usuario_db_id ?? session.id, fecha_apertura: aperturaData.fechaApertura, fecha_cierre: now, total_sistema: aperturaData.efectivoEsperado, total_fisico: contadoNum, diferencia: diff, apertura_caja_id: aperturaId });
      await supabase.from('aperturas_caja').update({ estado: 'cerrada', fecha_cierre: now, efectivo_esperado: aperturaData.efectivoEsperado }).eq('id', aperturaId);
      await supabase.from('eventos_auditoria').insert({ id: crypto.randomUUID(), sucursal_id: session.sucursal_id, usuario_id: session.usuario_db_id ?? session.id, tipo: 'cierre_caja', descripcion: `Cierre de caja — ${status}`, metadata: { apertura_id: aperturaId, system_total: aperturaData.efectivoEsperado, physical_total: contadoNum, diff }, created_at: now });
      if (print) exportPdf(
        ['Concepto', 'Valor'],
        [['Fecha', new Date().toLocaleDateString('es-CO')], ['Usuario', session.nombre || ''], ['Ventas', String(aperturaData.ventas.count)], ['Artículos', String(aperturaData.articulos)], ['Total vendido', `$${fmt2(aperturaData.ventas.total)}`], ['Efectivo esperado', `$${fmt2(aperturaData.efectivoEsperado)}`], ['Efectivo contado', `$${fmt2(contadoNum)}`], ['Diferencia', `$${fmt2(Math.abs(diff))}`], ['Estado', status]],
        { titulo: 'Cierre de Caja', sucursal: branchName || session.sucursal_id, usuario: session.nombre || '' },
      );
      setDoneData({ status, diferencia: diff, ventas: aperturaData.ventas.count, articulos: aperturaData.articulos, totalVendido: aperturaData.ventas.total, efectivoEsperado: aperturaData.efectivoEsperado, efectivoContado: contadoNum });
      setStep('done');
    } catch (e) { console.error(e); setError('Error al cerrar: ' + (e instanceof Error ? e.message : String(e))); setStep('form'); }
    finally { setSaving(false); }
  };

  if (!session) return null;
  if (step === 'loading') return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}><div className="bg-white rounded-xl p-8 shadow-lg flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}><div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" /><p className="text-gray-500 text-sm">Cargando datos de cierre...</p></div></div>);
  if (!aperturaData) return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}><div className="bg-white rounded-xl p-8 shadow-lg max-w-sm w-full" onClick={(e) => e.stopPropagation()}><p className="text-red-600 mb-4">{error || 'Error al cargar datos'}</p><button onClick={onClose} className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg">Cerrar</button></div></div>);
  const d = aperturaData;

  if (step === 'done' && doneData) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-lg w-full p-8 animate-[scaleIn_300ms_ease-out]">
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 animate-[fadeIn_400ms_ease-out]">
          <img src={iconApp} alt="" className="w-16 h-16 animate-[scaleIn_600ms_ease-out]" style={{ animationFillMode: 'backwards', animationDelay: '200ms' }} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 animate-[fadeIn_300ms_ease-out]" style={{ animationFillMode: 'backwards', animationDelay: '400ms' }}>Turno cerrado correctamente</h2>
        <p className="text-sm text-gray-500 mt-1 animate-[fadeIn_300ms_ease-out]" style={{ animationFillMode: 'backwards', animationDelay: '500ms' }}>El cierre ha sido registrado exitosamente</p>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3 mb-6 animate-[slideUp_300ms_ease-out]" style={{ animationFillMode: 'backwards', animationDelay: '300ms' }}>
        {[['Ventas realizadas', doneData.ventas], ['Artículos vendidos', doneData.articulos.toFixed(0)], ['Total vendido', `$${fmt2(doneData.totalVendido)}`], ['Efectivo esperado', `$${fmt2(doneData.efectivoEsperado)}`], ['Efectivo contado', `$${fmt2(doneData.efectivoContado)}`]].map(([l, v]) => (<div key={l as string} className="flex justify-between text-sm"><span className="text-gray-500">{l}</span><span className="font-semibold">{v}</span></div>))}
        <div className={`rounded-lg px-4 py-2 text-center font-bold text-sm ${doneData.status === 'CUADRADO' ? 'bg-green-50 text-green-700 border border-green-200' : doneData.status === 'SOBRANTE' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{doneData.status}{doneData.status !== 'CUADRADO' ? `: $${fmt2(Math.abs(doneData.diferencia))}` : ''}</div>
      </div>
      <button onClick={onLogout} className="w-full bg-[var(--color-primary)] text-white font-semibold py-3 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-sm animate-[fadeIn_300ms_ease-out]" style={{ animationFillMode: 'backwards', animationDelay: '700ms' }}>Volver al Login</button>
      <div className="mt-4 animate-[fadeIn_300ms_ease-out]" style={{ animationFillMode: 'backwards', animationDelay: '900ms' }}>
        <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Regresando al inicio</span><span>{countdown}s</span></div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-[var(--color-primary)] rounded-full" style={{ animation: 'progressBar 3s linear forwards' }} /></div>
      </div>
    </div></div>
  );

  if (step === 'confirm') return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setStep('form')}><div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
      <div className="text-center mb-6"><img src={iconApp} alt="" className="w-12 h-12 mx-auto mb-4" /><h2 className="text-lg font-bold text-gray-900">¿Desea cerrar el turno?</h2><p className="text-sm text-gray-500 mt-2">Una vez cerrado, no podrá realizar más operaciones.</p></div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 space-y-2">
        {[['Efectivo esperado', `$${fmt2(d.efectivoEsperado)}`], ['Efectivo contado', `$${fmt2(contadoNum)}`], ['Diferencia', `${status}${status !== 'CUADRADO' ? ` $${fmt2(Math.abs(diferencia))}` : ''}`]].map(([l, v], i) => (<div key={i} className="flex justify-between text-sm"><span className="text-gray-500">{l}</span><span className={`font-semibold ${i === 2 ? (diferencia < 0 ? 'text-red-600' : diferencia > 0 ? 'text-amber-600' : 'text-green-600') : ''}`}>{v}</span></div>))}
      </div>
      <div className="flex gap-3"><button onClick={() => setStep('form')} disabled={saving} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium">Cancelar</button><button onClick={() => handleClose(false)} disabled={saving} className="flex-1 bg-[var(--color-primary)] text-white py-2.5 rounded-lg text-sm font-semibold">{saving ? 'Guardando...' : 'Confirmar cierre'}</button></div>
      <button onClick={() => handleClose(true)} disabled={saving} className="w-full mt-2 bg-white border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm font-medium">Exportar PDF</button>
    </div></div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}><div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-2xl w-full flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
      <div className="p-4 border-b border-gray-200 flex justify-between items-center"><h2 className="text-lg font-bold text-gray-900">Cierre de Caja</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1"><CloseX size={18} /></button></div>
      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[['Efectivo esperado', `$${fmt2(d.efectivoEsperado)}`, `Fondo $${fmt2(d.fondoInicial)} + Ventas efectivo`], ['Efectivo contado', '', ''], ['Diferencia', diferencia === 0 ? 'CUADRADO' : `${status === 'SOBRANTE' ? '+' : '-'}$${fmt2(Math.abs(diferencia))}`, '']].map(([l, v, sub], i) => (
            <div key={i} className={`rounded-lg p-3 sm:p-4 border-2 ${i === 2 ? (diferencia < 0 ? 'bg-red-50 border-red-200' : diferencia > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200') + ' transition-colors duration-500' : i === 0 ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-1">{l}</p>
              {i === 1 ? <input type="number" step="0.01" min="0" autoFocus value={efectivoContado} onChange={(e) => setEfectivoContado(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }} className="w-full text-lg sm:text-2xl font-bold text-gray-900 outline-none bg-transparent" placeholder="0" /> : <p className={`text-lg sm:text-2xl font-bold ${i === 2 ? (diferencia < 0 ? 'text-red-700' : diferencia > 0 ? 'text-amber-700' : 'text-green-700') : 'text-gray-900'}`}>{v}</p>}
              {sub && <p className="text-[10px] text-gray-400 mt-1 hidden sm:block">{sub}</p>}
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen operativo</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">{[['Ventas', d.ventas.count], ['Artículos', d.articulos.toFixed(0)], ['Subtotal', `$${fmt2(d.ventas.subtotal)}`], ['Impuestos', `$${fmt2(d.ventas.impuestos)}`]].map(([l, v], i) => (<div key={i} className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 text-center"><p className="text-[10px] sm:text-xs text-gray-500">{l}</p><p className={`text-base sm:text-xl font-bold text-gray-900`}>{v}</p></div>))}</div>
          <div className="bg-[var(--color-primary-light)] border border-[var(--color-primary-border)] rounded-lg p-3 flex justify-between items-center mb-3"><span className="text-sm font-semibold text-[var(--color-navy)]">Total vendido</span><span className="text-xl font-bold text-[var(--color-primary)]">${fmt2(d.ventas.total)}</span></div>
          {d.metodos.length > 0 && <div><p className="text-xs text-gray-500 font-medium mb-1.5">Métodos de pago</p><div className="grid grid-cols-2 gap-2">{d.metodos.map((m) => (<div key={m.metodo} className="bg-gray-50 rounded-lg border border-gray-200 p-2.5 flex justify-between items-center"><span className="text-sm text-gray-700 font-medium">{m.metodo}</span><span className="text-sm font-bold text-gray-900">${fmt2(m.total)}</span></div>))}</div></div>}
        </div>
      </div>
      {error && <div className="px-6 pb-2"><div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg p-3">{error}</div></div>}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between items-center gap-3"><button onClick={onClose} className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium">Cancelar</button><button onClick={handleConfirm} className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-5 py-2.5 rounded-lg text-sm font-semibold">Confirmar cierre</button></div>
    </div></div>
  );
};
