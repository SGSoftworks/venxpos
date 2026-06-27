import { supabase } from './supabase';

export const reporteVentasDia = async (sucursalId: string, start: string, end: string) => {
  const { data } = await supabase.from('ventas').select('total').eq('sucursal_id', sucursalId).gte('fecha_hora', start).lte('fecha_hora', end);
  const rows = data || [];
  const total = rows.reduce((s, r) => s + (r.total as number), 0);
  return { subtotal: total, impuestos: 0, total, transacciones: rows.length, ticketPromedio: rows.length > 0 ? total / rows.length : 0 };
};

export const reporteMetodosPago = async (sucursalId: string, start: string, end: string) => {
  const { data } = await supabase.from('ventas').select('metodo_pago, total').eq('sucursal_id', sucursalId).gte('fecha_hora', start).lte('fecha_hora', end);
  const map = new Map<string, number>();
  let granTotal = 0;
  (data || []).forEach(v => { const m = v.metodo_pago as string; const t = v.total as number; map.set(m, (map.get(m) || 0) + t); granTotal += t; });
  return Array.from(map.entries()).map(([metodo, total]) => ({ metodo, total, porcentaje: granTotal > 0 ? (total / granTotal) * 100 : 0 }));
};

export const reporteImpuestos = async (_sucursalId: string, _start: string, _end: string) => {
  return []; // simplified — requires join on ventas via foreign table filter
};

export const reporteProductos = async (sucursalId: string, start: string, end: string, _mode: 'mas' | 'menos') => {
  const { data: ventas } = await supabase.from('ventas').select('id').eq('sucursal_id', sucursalId).gte('fecha_hora', start).lte('fecha_hora', end);
  const ventaIds = (ventas || []).map(v => v.id);
  if (ventaIds.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < ventaIds.length; i += 100) chunks.push(ventaIds.slice(i, i + 100));
  const map = new Map<string, { descripcion: string; cantidad: number; ingresos: number }>();
  for (const ch of chunks) {
    const { data: detalles } = await supabase.from('venta_detalles').select('producto_id, cantidad_o_peso, subtotal, productos!venta_detalles_producto_id_fkey(descripcion)').in('venta_id', ch);
    (detalles || []).forEach(d => {
      const pid = d.producto_id as string;
      const e = map.get(pid);
      if (e) { e.cantidad += (d.cantidad_o_peso as number); e.ingresos += (d.subtotal as number); }
      else map.set(pid, { descripcion: ((d.productos as unknown as { descripcion: string }) || {}).descripcion || 'Sin nombre', cantidad: d.cantidad_o_peso as number, ingresos: d.subtotal as number });
    });
  }
  return Array.from(map.values()).map(e => ({ ...e, cantidad: parseFloat(e.cantidad.toFixed(3)) }));
};

export const reporteCierres = async (sucursalId: string, start: string, end: string) => {
  const { data } = await supabase.from('cierres_caja').select('*').eq('sucursal_id', sucursalId).gte('fecha_cierre', start).lte('fecha_cierre', end).order('fecha_cierre', { ascending: false });
  return (data || []).map(r => ({ fecha: r.fecha_cierre as string, usuario: r.cajero_id as string, ventas: 0, articulos: 0, esperado: r.total_sistema as number, contado: r.total_fisico as number, diferencia: r.diferencia as number }));
};

export const reporteUtilidad = async (_sucursalId: string, _start: string, _end: string) => {
  return { ingresos: 0, costo: 0, utilidad: 0, margen: 0 };
};

export const reporteMovimientos = async (sucursalId: string, start: string, end: string) => {
  const { data } = await supabase.from('movimientos_inventario').select('*').eq('sucursal_id', sucursalId).gte('created_at', start).lte('created_at', end).order('created_at', { ascending: false });
  return (data || []).map(r => ({ fecha: r.created_at as string, tipo: r.tipo as string, descripcion: `${r.tipo} de ${r.cantidad}`, usuario: r.usuario_id as string }));
};

export function csvExport(rows: Record<string, unknown>[], filename: string, headers?: string[]): void {
  if (rows.length === 0 && !headers) return;
  const cols = headers ?? Object.keys(rows[0]);
  const lines = rows.length > 0 ? rows.map(r => cols.map(h => { const v = r[h]; if (v === null || v === undefined) return ''; const s = String(v); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')) : [];
  const csv = [cols.join(','), ...lines].join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
