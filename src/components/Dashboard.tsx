import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { Banknote, ShieldCheck, AlertTriangle, TrendingDown, Cart } from './Icons';

interface TodayStats {
  totalVentas: number; conteoVentas: number; aperturaAbierta: boolean;
  stockBajo: number; agotados: number; ultimasVentas: Array<{ ticket: number; total: number; metodo: string; fecha: string }>;
  ultimoCierre: { fecha: string; usuario: string; diferencia: number; status: string } | null;
}

export const Dashboard: React.FC<{ onGoToPOS: () => void; onReports: () => void; onHistory: () => void }> = ({ onGoToPOS, onReports, onHistory }) => {
  const { session, currentAperturaId } = useAppStore();
  const aperturaAbierta = currentAperturaId !== null;
  const [stats, setStats] = useState<TodayStats>({ totalVentas: 0, conteoVentas: 0, aperturaAbierta: false, stockBajo: 0, agotados: 0, ultimasVentas: [], ultimoCierre: null });
  const [loading, setLoading] = useState(true);
  const cargarStats = async () => {
    if (!session) return;
    setLoading(true);
    const hoy = new Date().toISOString().slice(0, 10);
    try {
      const [{ data: ventasHoy }, { count: pendientes }, { data: ultimas }] = await Promise.all([
        supabase.from('ventas').select('total, id').gte('fecha_hora', hoy).eq('sucursal_id', session.sucursal_id),
        supabase.from('ventas').select('*', { count: 'exact', head: true }).gte('fecha_hora', hoy).eq('sucursal_id', session.sucursal_id),
        supabase.from('ventas').select('ticket_number, total, metodo_pago, fecha_hora').eq('sucursal_id', session.sucursal_id).order('fecha_hora', { ascending: false }).limit(5),
      ]);
      const totalVentas = (ventasHoy || []).reduce((s, v) => s + (v.total as number), 0);
      const conteo = pendientes ?? 0;

      const [{ data: stockData }, { data: ultimoCierreData }] = await Promise.all([
        supabase.from('inventario_sucursal').select('stock_actual, productos(stock_minimo)').eq('sucursal_id', session.sucursal_id),
        supabase.from('cierres_caja').select('fecha_cierre, cajero_id, diferencia').eq('sucursal_id', session.sucursal_id).order('fecha_cierre', { ascending: false }).limit(1),
      ]);

      const agotados = (stockData || []).filter(s => (s.stock_actual as number) <= 0).length
      const stockBajo = (stockData || []).filter(s => {
        const stock = s.stock_actual as number
        if (stock <= 0) return false
        const prod = s.productos as unknown as { stock_minimo: number } | null
        return stock <= (prod?.stock_minimo ?? 10)
      }).length

      setStats({
        totalVentas, conteoVentas: conteo, aperturaAbierta,
        stockBajo, agotados,
        ultimasVentas: (ultimas || []).map((v) => ({ ticket: v.ticket_number as number, total: v.total as number, metodo: v.metodo_pago as string, fecha: v.fecha_hora as string })),
        ultimoCierre: (ultimoCierreData && ultimoCierreData.length > 0) ? { fecha: ultimoCierreData[0].fecha_cierre as string, usuario: ultimoCierreData[0].cajero_id as string, diferencia: ultimoCierreData[0].diferencia as number, status: (ultimoCierreData[0].diferencia as number) === 0 ? 'CUADRADO' : 'DESCUADRE' } : null,
      });
      setLoading(false);
    } catch { setLoading(false); }
  };

  useEffect(() => { cargarStats(); const iv = setInterval(cargarStats, 10000); return () => clearInterval(iv); }, [session]);

  const fmt2 = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
      {loading ? (<>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => (<div key={i} className="animate-pulse bg-white rounded-xl border border-gray-200 p-4"><div className="h-3 bg-gray-200 rounded w-16 mb-3" /><div className="h-7 bg-gray-200 rounded w-20 mb-2" /><div className="h-3 bg-gray-200 rounded w-24" /></div>))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
          {[1,2,3].map(i => (<div key={i} className="flex gap-3 mb-3"><div className="h-4 bg-gray-200 rounded w-16" /><div className="h-4 bg-gray-200 rounded w-12" /><div className="h-4 bg-gray-200 rounded w-20" /><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></div>))}
        </div>
      </>) : (<>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card titulo="Ventas Hoy" valor={`$${fmt2(stats.totalVentas)}`} subtitulo={`${stats.conteoVentas} transacciones`} color="blue" />
        <Card titulo="Caja" valor={aperturaAbierta ? 'Abierta' : 'Cerrada'} subtitulo={aperturaAbierta ? 'Turno activo' : 'Requiere apertura'} color={aperturaAbierta ? 'green' : 'red'} />
        <Card titulo="Stock Bajo" valor={String(stats.stockBajo)} subtitulo="Bajo el mínimo" color="amber" />
        <Card titulo="Agotados" valor={String(stats.agotados)} subtitulo="Sin stock" color="red" />
      </div>
      {stats.ultimoCierre && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Último Cierre</p>
          <p className="text-sm text-gray-700">{new Date(stats.ultimoCierre.fecha).toLocaleString('es-CO')} — <span className={stats.ultimoCierre.status === 'CUADRADO' ? 'text-green-600' : 'text-red-600'}>{stats.ultimoCierre.status}</span></p>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Últimas Ventas</p>
        {stats.ultimasVentas.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <div className="text-center">
              <Cart size={32} className="mb-2 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500">Sin ventas hoy</p>
              <p className="text-xs text-gray-400 mt-1">Las ventas realizadas aparecerán aquí</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-400 text-xs"><th className="pb-2">Hora</th><th className="pb-2">Ticket</th><th className="pb-2">Método</th><th className="pb-2 text-right">Total</th></tr></thead>
            <tbody>{stats.ultimasVentas.map((v, i) => (<tr key={i} className="border-t border-gray-100"><td className="py-1.5 text-gray-500">{new Date(v.fecha).toLocaleTimeString('es-CO')}</td><td className="py-1.5 font-mono text-gray-700">#{v.ticket}</td><td className="py-1.5 text-gray-500">{v.metodo}</td><td className="py-1.5 text-right font-semibold">${fmt2(v.total)}</td></tr>))}</tbody></table>
        )}
      </div>
      </>)}
      <div className="flex gap-3">
        <button onClick={onGoToPOS} className="bg-[var(--color-primary)] text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-dark)]">Ir a Caja</button>
        <button onClick={onReports} className="bg-white border border-gray-300 text-gray-700 px-5 py-3 rounded-lg text-sm font-medium hover:bg-gray-50">Reportes</button>
        <button onClick={onHistory} className="bg-white border border-gray-300 text-gray-700 px-5 py-3 rounded-lg text-sm font-medium hover:bg-gray-50">Historial</button>
      </div>
    </div>
  );
};

const cardStyles: Record<string, { bg: string; icon: React.FC<{ size?: number; className?: string }>; dot: string; text: string; iconColor: string }> = {
  blue:   { bg: 'bg-[var(--color-primary-light)]', icon: Banknote, dot: 'bg-[var(--color-primary)]', text: 'text-[var(--color-primary)]', iconColor: 'text-[var(--color-primary)]' },
  green:  { bg: 'bg-[var(--color-success-light)]', icon: ShieldCheck, dot: 'bg-[var(--color-success)]', text: 'text-[var(--color-success)]', iconColor: 'text-[var(--color-success)]' },
  amber:  { bg: 'bg-amber-50', icon: AlertTriangle, dot: 'bg-amber-500', text: 'text-amber-700', iconColor: 'text-amber-600' },
  red:    { bg: 'bg-red-50', icon: TrendingDown, dot: 'bg-red-500', text: 'text-red-700', iconColor: 'text-red-600' },
};

const Card: React.FC<{ titulo: string; valor: string; subtitulo: string; color: string }> = ({ titulo, valor, subtitulo, color }) => {
  const s = cardStyles[color] || cardStyles.blue;
  const Icon = s.icon;
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow duration-300">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0 ${s.iconColor}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">{titulo}</p>
          <p className={`text-xl font-bold ${s.text} truncate`}>{valor}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className={`w-1.5 h-1.5 ${s.dot} rounded-full`} />
            <p className="text-[11px] text-gray-400">{subtitulo}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
