import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { reporteVentasDia, reporteMetodosPago, reporteCierres, reporteMovimientos, reporteProductos, csvExport } from '../lib/reports';
import { exportPdf } from '../lib/pdfExport';
import { saveFile } from '../lib/saveFile';
import { CloseX, ShoppingBag, Lock, Clipboard, Chart, CreditCard } from './Icons';
import * as XLSX from 'xlsx';

type Tab = 'ventas' | 'metodos' | 'productos' | 'cierres' | 'movimientos';
type DateFilterMode = 'hoy' | 'semana' | 'mes' | 'personalizado';
const fmt2 = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });
const TAB_LABELS: Record<Tab, string> = { ventas: 'Ventas', metodos: 'Métodos', productos: 'Productos', cierres: 'Cierres', movimientos: 'Movimientos' };

const getFilter = (mode: DateFilterMode, cs?: string, ce?: string) => {
  const now = new Date(); const y = now.getFullYear(); const m = String(now.getMonth() + 1).padStart(2, '0'); const d = String(now.getDate()).padStart(2, '0');
  if (mode === 'hoy') return { start: `${y}-${m}-${d}T00:00:00`, end: `${y}-${m}-${d}T23:59:59`, label: 'Hoy' };
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); const ws = String(startOfWeek.getFullYear()); const wm = String(startOfWeek.getMonth() + 1).padStart(2, '0'); const wd = String(startOfWeek.getDate()).padStart(2, '0');
  if (mode === 'semana') return { start: `${ws}-${wm}-${wd}T00:00:00`, end: `${y}-${m}-${d}T23:59:59`, label: 'Semana' };
  if (mode === 'mes') return { start: `${y}-${m}-01T00:00:00`, end: `${y}-${m}-${d}T23:59:59`, label: 'Mes' };
  return { start: cs ? `${cs}T00:00:00` : `${y}-${m}-${d}T00:00:00`, end: ce ? `${ce}T23:59:59` : `${y}-${m}-${d}T23:59:59`, label: 'Personalizado' };
};

export const ReportsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { session } = useAppStore();
  const [tab, setTab] = useState<Tab>('ventas');
  const [branchName, setBranchName] = useState('');
  const [filtroFecha, setFiltroFecha] = useState<DateFilterMode>('hoy');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [ventaDia, setVentaDia] = useState<{ subtotal: number; total: number; transacciones: number; ticketPromedio: number } | null>(null);
  const [metodos, setMetodos] = useState<{ metodo: string; total: number; porcentaje: number }[]>([]);
  const [productos, setProductos] = useState<{ descripcion: string; cantidad: number; ingresos: number }[]>([]);
  const [cierres, setCierres] = useState<{ fecha: string; usuario: string; ventas: number; articulos: number; esperado: number; contado: number; diferencia: number }[]>([]);
  const [movimientos, setMovimientos] = useState<{ fecha: string; tipo: string; descripcion: string; usuario: string }[]>([]);
  const _productoMode = 'mas'; void _productoMode;

  useEffect(() => { (async () => { if (!session) return; const { data } = await supabase.from('sucursales').select('nombre').eq('id', session.sucursal_id).limit(1); if (data && data.length > 0) setBranchName(data[0].nombre); })(); }, [session]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const loadAll = useCallback(async () => {
    if (!session) return; setLoading(true);
    const f = getFilter(filtroFecha, customStart, customEnd);
    try {
      const [vd, mp, pr, cr, mv] = await Promise.all([reporteVentasDia(session.sucursal_id, f.start, f.end), reporteMetodosPago(session.sucursal_id, f.start, f.end), reporteProductos(session.sucursal_id, f.start, f.end), reporteCierres(session.sucursal_id, f.start, f.end), reporteMovimientos(session.sucursal_id, f.start, f.end)]);
      setVentaDia(vd); setMetodos(mp); setProductos(pr); setCierres(cr); setMovimientos(mv);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [session, filtroFecha, customStart, customEnd]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleExportPdf = async () => {
    setStatusMsg('Generando PDF...');
    const sn = branchName || ''; const un = session?.nombre || '';
    try {
      let r: { success: boolean; error?: string } = { success: false };
      switch (tab) {
        case 'ventas': { const vd = ventaDia; r = await exportPdf(['Indicador', 'Valor'], [['Fecha', new Date().toLocaleDateString('es-CO')], ['Subtotal', `$${fmt2(vd?.subtotal ?? 0)}`], ['Total', `$${fmt2(vd?.total ?? 0)}`], ['Transacciones', String(vd?.transacciones ?? 0)], ['Ticket Promedio', `$${fmt2(vd?.ticketPromedio ?? 0)}`]], { titulo: 'Ventas', sucursal: sn, usuario: un }); break; }
        case 'metodos': r = await exportPdf(['Método', 'Total', '%'], metodos.map(m => [m.metodo, `$${fmt2(m.total)}`, `${m.porcentaje.toFixed(1)}%`]), { titulo: 'Métodos', sucursal: sn, usuario: un }); break;
        case 'productos': r = await exportPdf(['#', 'Producto', 'Cantidad', 'Ingresos'], productos.map((p, i) => [String(i + 1), p.descripcion, p.cantidad.toFixed(3), `$${fmt2(p.ingresos)}`]), { titulo: 'Productos', sucursal: sn, usuario: un }); break;
        case 'cierres': r = await exportPdf(['Fecha', 'Usuario', 'Ventas', 'Artículos', 'Esperado', 'Contado', 'Diferencia'], cierres.map(c => [new Date(c.fecha).toLocaleDateString('es-CO'), c.usuario, String(c.ventas), c.articulos.toFixed(0), `$${fmt2(c.esperado)}`, `$${fmt2(c.contado)}`, `$${fmt2(c.diferencia)}`]), { titulo: 'Cierres', sucursal: sn, usuario: un }); break;
        case 'movimientos': r = await exportPdf(['Fecha', 'Tipo', 'Descripción', 'Usuario'], movimientos.map(m => [new Date(m.fecha).toLocaleString('es-CO'), m.tipo, m.descripcion, m.usuario]), { titulo: 'Movimientos', sucursal: sn, usuario: un }); break;
      }
      setStatusMsg(r.success ? 'PDF generado' : `Error: ${r.error || 'Sin datos'}`);
    } catch (e) { setStatusMsg(`Error: ${e instanceof Error ? e.message : 'Error'}`); }
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleExportExcel = async () => {
    setStatusMsg('Generando Excel...');
    try {
      let ws; let name = '';
      switch (tab) {
        case 'ventas': { const vd = ventaDia; ws = XLSX.utils.json_to_sheet([{ Fecha: new Date().toLocaleDateString('es-CO'), Subtotal: vd?.subtotal ?? 0, Total: vd?.total ?? 0, Transacciones: vd?.transacciones ?? 0, Ticket_Promedio: vd?.ticketPromedio ?? 0 }]); name = 'ventas'; break; }
        case 'metodos': ws = XLSX.utils.json_to_sheet(metodos.map(m => ({ Metodo: m.metodo, Total: m.total, Porcentaje: `${m.porcentaje.toFixed(1)}%` }))); name = 'metodos'; break;
        case 'productos': ws = XLSX.utils.json_to_sheet(productos.map(p => ({ Producto: p.descripcion, Cantidad: p.cantidad, Ingresos: p.ingresos }))); name = 'productos'; break;
        case 'cierres': ws = XLSX.utils.json_to_sheet(cierres.map(c => ({ Fecha: new Date(c.fecha).toLocaleDateString('es-CO'), Usuario: c.usuario, Ventas: c.ventas, Articulos: c.articulos, Esperado: c.esperado, Contado: c.contado, Diferencia: c.diferencia }))); name = 'cierres'; break;
        case 'movimientos': ws = XLSX.utils.json_to_sheet(movimientos.map(m => ({ Fecha: new Date(m.fecha).toLocaleString('es-CO'), Tipo: m.tipo, Descripcion: m.descripcion, Usuario: m.usuario }))); name = 'movimientos'; break;
      }
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, name);
      const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      await saveFile(`${name}_${new Date().toISOString().slice(0, 10)}.xlsx`, new Uint8Array(buf as unknown as ArrayBuffer), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      setStatusMsg('Excel generado');
    } catch (e) { setStatusMsg(`Error: ${e instanceof Error ? e.message : 'Error'}`); }
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const exportCsv = () => {
    if (!session) return; setStatusMsg('Generando CSV...');
    try {
      switch (tab) {
        case 'ventas': { const vd = ventaDia; csvExport([{ Fecha: new Date().toLocaleDateString('es-CO'), Subtotal: vd?.subtotal ?? 0, Total: vd?.total ?? 0, Transacciones: vd?.transacciones ?? 0, Ticket_Promedio: vd?.ticketPromedio ?? 0 }], `ventas_${new Date().toISOString().slice(0, 10)}.csv`); break; }
        case 'metodos': csvExport(metodos.map(m => ({ Metodo: m.metodo, Total: m.total, Porcentaje: `${m.porcentaje.toFixed(1)}%` })), `metodos_${new Date().toISOString().slice(0, 10)}.csv`); break;
        case 'productos': csvExport(productos.map(p => ({ Producto: p.descripcion, Cantidad: p.cantidad, Ingresos: p.ingresos })), `productos_${new Date().toISOString().slice(0, 10)}.csv`); break;
        case 'cierres': csvExport(cierres.map(c => ({ Fecha: new Date(c.fecha).toLocaleDateString('es-CO'), Usuario: c.usuario, Ventas: c.ventas, Articulos: c.articulos, Esperado: c.esperado, Contado: c.contado, Diferencia: c.diferencia })), `cierres_${new Date().toISOString().slice(0, 10)}.csv`); break;
        case 'movimientos': csvExport(movimientos.map(m => ({ Fecha: new Date(m.fecha).toLocaleString('es-CO'), Tipo: m.tipo, Descripcion: m.descripcion, Usuario: m.usuario })), `movimientos_${new Date().toISOString().slice(0, 10)}.csv`); break;
      }
      setStatusMsg('CSV generado');
    } catch (e) { setStatusMsg(`Error: ${e instanceof Error ? e.message : 'Error'}`); }
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const filter = getFilter(filtroFecha, customStart, customEnd);
  void filter;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_150ms_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-4xl flex flex-col max-h-[85vh] animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center"><h2 className="text-lg font-bold text-gray-900">Reportes</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">{(['hoy', 'semana', 'mes'] as DateFilterMode[]).map(m => (<button key={m} onClick={() => setFiltroFecha(m)} className={`text-xs px-2.5 py-1 rounded-md font-medium ${filtroFecha === m ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500'}`}>{m === 'hoy' ? 'Hoy' : m === 'semana' ? 'Semana' : 'Mes'}</button>))}<button onClick={() => setFiltroFecha('personalizado')} className={`text-xs px-2.5 py-1 rounded-md font-medium ${filtroFecha === 'personalizado' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500'}`}>Personalizado</button></div>
            {filtroFecha === 'personalizado' && (<div className="flex gap-1"><input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="text-xs bg-white border rounded px-2 py-1" /><input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="text-xs bg-white border rounded px-2 py-1" /></div>)}
            {branchName && <span className="text-xs text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2 py-0.5 rounded-full">{branchName}</span>}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1"><CloseX size={18} /></button>
          </div>
        </div>
        <div className="flex border-b border-gray-200">{(Object.keys(TAB_LABELS) as Tab[]).map(t => (<button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === t ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-gray-500 hover:text-gray-700'}`}>{TAB_LABELS[t]}</button>))}</div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[1,2,3,4,5].map(i => (<div key={i} className="animate-pulse bg-white rounded-lg border border-gray-200 p-3"><div className="h-3 bg-gray-200 rounded w-16 mb-2" /><div className="h-6 bg-gray-200 rounded w-20" /></div>))}
              </div>
              {[1,2,3,4].map(i => (<div key={i} className="animate-pulse flex gap-3 p-2"><div className="h-4 bg-gray-200 rounded w-24" /><div className="h-4 bg-gray-200 rounded w-16" /><div className="h-4 bg-gray-200 rounded w-12 ml-auto" /></div>))}
            </div>
          ) : (
            <>
              {tab === 'ventas' && ventaDia && (<div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[['Subtotal', ventaDia.subtotal], ['Total', ventaDia.total], ['Transacciones', ventaDia.transacciones], ['Ticket Promedio', ventaDia.ticketPromedio]].map(([l, v]) => (<div key={l} className="bg-white rounded-lg border border-gray-200 p-3 text-center"><p className="text-xs text-gray-500">{l}</p><p className={`text-xl font-bold ${l === 'Total' ? 'text-[var(--color-primary)]' : 'text-gray-900'}`}>{l === 'Transacciones' ? String(v) : `$${fmt2(v as number)}`}</p></div>))}</div>
              </div>)}
              {tab === 'metodos' && metodos.length > 0 && (<table className="w-full text-sm"><thead><tr className="text-left text-xs text-gray-500"><th className="pb-2">Método</th><th className="pb-2 text-right">Total</th><th className="pb-2 text-right">%</th></tr></thead><tbody>{metodos.map((m, i) => (<tr key={i}><td className="py-1.5">{m.metodo}</td><td className="py-1.5 text-right font-semibold">${fmt2(m.total)}</td><td className="py-1.5 text-right">{m.porcentaje.toFixed(1)}%</td></tr>))}</tbody></table>)}
              {tab === 'productos' && productos.length > 0 && (<table className="w-full text-sm"><thead><tr className="text-left text-xs text-gray-500"><th className="pb-2">Producto</th><th className="pb-2 text-right">Cantidad</th><th className="pb-2 text-right">Ingresos</th></tr></thead><tbody>{productos.map((p, i) => (<tr key={i}><td className="py-1.5">{p.descripcion}</td><td className="py-1.5 text-right">{p.cantidad.toFixed(3)}</td><td className="py-1.5 text-right font-semibold">${fmt2(p.ingresos)}</td></tr>))}</tbody></table>)}
              {tab === 'productos' && productos.length === 0 && !loading && (
                <div className="flex items-center justify-center h-48 text-gray-400"><div className="text-center"><ShoppingBag size={40} className="mb-3 mx-auto text-gray-300" /><p className="text-sm text-gray-500">Sin productos vendidos en este período</p></div></div>
              )}
              {tab === 'cierres' && cierres.length > 0 && (<table className="w-full text-sm"><thead><tr className="text-left text-xs text-gray-500"><th className="pb-2">Fecha</th><th className="pb-2 text-right">Ventas</th><th className="pb-2 text-right">Esperado</th><th className="pb-2 text-right">Contado</th><th className="pb-2 text-right">Diferencia</th></tr></thead><tbody>{cierres.map((c, i) => (<tr key={i}><td className="py-1.5">{new Date(c.fecha).toLocaleDateString('es-CO')}</td><td className="py-1.5 text-right">{c.ventas}</td><td className="py-1.5 text-right">${fmt2(c.esperado)}</td><td className="py-1.5 text-right">${fmt2(c.contado)}</td><td className={`py-1.5 text-right ${c.diferencia < 0 ? 'text-red-600' : c.diferencia > 0 ? 'text-amber-600' : 'text-green-600'}`}>{c.diferencia === 0 ? 'CUADRADO' : `$${fmt2(c.diferencia)}`}</td></tr>))}</tbody></table>)}
              {tab === 'cierres' && cierres.length === 0 && !loading && (
                <div className="flex items-center justify-center h-48 text-gray-400"><div className="text-center"><Lock size={40} className="mb-3 mx-auto text-gray-300" /><p className="text-sm text-gray-500">Sin cierres de caja en este período</p></div></div>
              )}
              {tab === 'movimientos' && movimientos.length > 0 && (<table className="w-full text-sm"><thead><tr className="text-left text-xs text-gray-500"><th className="pb-2">Fecha</th><th className="pb-2">Tipo</th><th className="pb-2">Usuario</th></tr></thead><tbody>{movimientos.map((m, i) => (<tr key={i}><td className="py-1.5">{new Date(m.fecha).toLocaleString('es-CO')}</td><td className="py-1.5">{m.tipo}</td><td className="py-1.5 text-gray-500">{m.usuario}</td></tr>))}</tbody></table>)}
              {tab === 'movimientos' && movimientos.length === 0 && !loading && (
                <div className="flex items-center justify-center h-48 text-gray-400"><div className="text-center"><Clipboard size={40} className="mb-3 mx-auto text-gray-300" /><p className="text-sm text-gray-500">Sin movimientos de inventario en este período</p></div></div>
              )}
              {tab === 'ventas' && !ventaDia && !loading && (
                <div className="flex items-center justify-center h-48 text-gray-400"><div className="text-center"><Chart size={40} className="mb-3 mx-auto text-gray-300" /><p className="text-sm text-gray-500">Sin datos para el período seleccionado</p></div></div>
              )}
              {tab === 'metodos' && metodos.length === 0 && !loading && (
                <div className="flex items-center justify-center h-48 text-gray-400"><div className="text-center"><CreditCard size={40} className="mb-3 mx-auto text-gray-300" /><p className="text-sm text-gray-500">Sin datos de métodos de pago</p></div></div>
              )}
            </>
          )}
        </div>
        <div className="p-3 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-xl">
          <button onClick={loadAll} disabled={loading} className="text-xs px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">{loading ? 'Cargando...' : 'Refrescar'}</button>
          <div className="flex gap-2">
            <button onClick={exportCsv} className="bg-white border border-gray-300 hover:bg-gray-50 text-xs text-gray-700 px-3 py-1.5 rounded-lg">CSV</button>
            <button onClick={handleExportExcel} className="bg-white border border-gray-300 hover:bg-gray-50 text-xs text-gray-700 px-3 py-1.5 rounded-lg">Excel</button>
            <button onClick={handleExportPdf} className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-xs text-white px-3 py-1.5 rounded-lg">PDF</button>
          </div>
        </div>
        {statusMsg && <div className={`text-xs px-2 py-1 rounded font-medium text-center ${statusMsg.includes('Error') ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>{statusMsg}</div>}
      </div>
    </div>
  );
};
