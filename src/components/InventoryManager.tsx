import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { exportPdf } from '../lib/pdfExport';
import { saveFile } from '../lib/saveFile';
import { Box, CloseX, Plus } from './Icons';
import * as XLSX from 'xlsx';

type ProductRow = { id: string; codigo_barras: string; descripcion: string; precio_venta: number; costo: number; stock_actual: number; stock_minimo: number; activo: number; requiere_peso: number; tarifa_iva: number; tarifa_impoconsumo: number; categoria_nombre: string | null; };
type FilterMode = 'todos' | 'stock_bajo' | 'inactivos';



export const InventoryManager: React.FC = () => {
  const { session, scannedBarcode, setScannedBarcode } = useAppStore();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [filtered, setFiltered] = useState<ProductRow[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('todos');
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ descripcion: '', codigo_barras: '', precio_venta: '', costo: '', tarifa_iva: '', tarifa_impoconsumo: '', stock_minimo: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ codigo_barras: '', descripcion: '', precio_venta: '', costo: '', tarifa_iva: '0.19', tarifa_impoconsumo: '0', categoria_id: '', stock_inicial: '', stock_minimo: '10' });
  const [adjustProduct, setAdjustProduct] = useState<{ id: string; name: string; stock: number } | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 25;

  const loadProducts = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const [{ data: prodRows }, { data: invRows }] = await Promise.all([
        supabase.from('productos').select('id, codigo_barras, descripcion, precio_venta, costo, stock_minimo, activo, requiere_peso, tarifa_iva, tarifa_impoconsumo, categorias(nombre)').eq('sucursal_id', session.sucursal_id).order('descripcion'),
        supabase.from('inventario_sucursal').select('producto_id, stock_actual').eq('sucursal_id', session.sucursal_id),
      ]);
      const stockMap = new Map<string, number>(); (invRows || []).forEach(i => stockMap.set(i.producto_id as string, i.stock_actual as number));
      const rows: ProductRow[] = (prodRows || []).map(p => ({
        id: p.id, codigo_barras: p.codigo_barras, descripcion: `${p.descripcion}`, precio_venta: p.precio_venta, costo: p.costo, stock_minimo: p.stock_minimo,
        activo: p.activo, requiere_peso: p.requiere_peso, tarifa_iva: p.tarifa_iva, tarifa_impoconsumo: p.tarifa_impoconsumo,
        stock_actual: stockMap.get(p.id as string) ?? 0, categoria_nombre: (p.categorias as unknown as { nombre: string } | null)?.nombre ?? null,
      }));
      setProducts(rows);
    } catch (e) { console.error(e); setError('Error al cargar productos'); } finally { setLoading(false); }
  }, [session]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { if (scannedBarcode) { setSearch(scannedBarcode); setPage(0); setScannedBarcode(null); } }, [scannedBarcode]);
  useEffect(() => { let result = [...products]; if (search.trim()) { const q = search.toLowerCase(); result = result.filter(p => p.descripcion.toLowerCase().includes(q) || p.codigo_barras.includes(q)); } if (filter === 'stock_bajo') result = result.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo); else if (filter === 'inactivos') result = result.filter(p => !p.activo); setFiltered(result); setPage(0); }, [products, search, filter]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleCreateProduct = async () => {
    if (!session) return;
    const precio = parseFloat(createForm.precio_venta);
    if (!createForm.codigo_barras.trim() || !createForm.descripcion.trim() || isNaN(precio) || precio <= 0) { setError('Código, descripción y precio son obligatorios'); return; }
    try {
      const newId = crypto.randomUUID();
      const stockInit = parseInt(createForm.stock_inicial) || 0;
      const stockMinimo = parseInt(createForm.stock_minimo) || 10
      await supabase.from('productos').insert({ id: newId, sucursal_id: session.sucursal_id, codigo_barras: createForm.codigo_barras.trim(), descripcion: createForm.descripcion.trim(), precio_venta: precio, costo: parseFloat(createForm.costo || '0'), tarifa_iva: parseFloat(createForm.tarifa_iva), tarifa_impoconsumo: parseFloat(createForm.tarifa_impoconsumo || '0'), activo: true, categoria_id: createForm.categoria_id || null, stock_minimo: stockMinimo, requiere_peso: false });
      await supabase.from('inventario_sucursal').upsert({ sucursal_id: session.sucursal_id, producto_id: newId, stock_actual: stockInit, version: 1 }, { onConflict: 'sucursal_id, producto_id' });
      setShowCreateForm(false); setCreateForm({ codigo_barras: '', descripcion: '', precio_venta: '', costo: '', tarifa_iva: '0.19', tarifa_impoconsumo: '0', categoria_id: '', stock_inicial: '', stock_minimo: '10' });
      setStatusMsg('Producto creado'); setTimeout(() => setStatusMsg(null), 2000); loadProducts();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('409') || msg.includes('Conflict') || msg.includes('duplicate')) {
        setError('El código de barras ya existe en esta sucursal');
      } else {
        setError('Error al crear producto');
      }
    }
  };

  const startEdit = (p: ProductRow) => { setEditingId(p.id); setEditForm({ descripcion: p.descripcion, codigo_barras: p.codigo_barras, precio_venta: String(p.precio_venta), costo: String(p.costo), tarifa_iva: String(p.tarifa_iva), tarifa_impoconsumo: String(p.tarifa_impoconsumo), stock_minimo: String(p.stock_minimo) }); };
  const saveEdit = async () => {
    if (!session || !editingId) return;
    try {
      await supabase.from('productos').update({ descripcion: editForm.descripcion, codigo_barras: editForm.codigo_barras, precio_venta: parseFloat(editForm.precio_venta), costo: parseFloat(editForm.costo), tarifa_iva: parseFloat(editForm.tarifa_iva), tarifa_impoconsumo: parseFloat(editForm.tarifa_impoconsumo || '0'), stock_minimo: parseInt(editForm.stock_minimo) || 10 }).eq('id', editingId);
      setEditingId(null); setStatusMsg('Producto actualizado'); setTimeout(() => setStatusMsg(null), 2000); loadProducts();
    } catch (e) { console.error(e); setError('Error al guardar'); }
  };

  const toggleActive = async (id: string, current: number) => { if (!session) return; await supabase.from('productos').update({ activo: !current }).eq('id', id).eq('sucursal_id', session.sucursal_id); loadProducts(); };

  const handleDeleteProduct = async () => {
    if (!session || !deleteProduct) return;
    try {
      await supabase.from('inventario_sucursal').delete().eq('producto_id', deleteProduct.id).eq('sucursal_id', session.sucursal_id);
      await supabase.from('productos').delete().eq('id', deleteProduct.id).eq('sucursal_id', session.sucursal_id);
      setDeleteProduct(null); setStatusMsg('Producto eliminado permanentemente'); setTimeout(() => setStatusMsg(null), 2000); loadProducts();
    } catch (e) { console.error(e); setError('Error al eliminar producto'); setDeleteProduct(null); }
  };

  const handleDownloadTemplate = async () => {
    try {
      const ws = XLSX.utils.json_to_sheet([{ codigo_barras: '7701234567890', descripcion: 'Ejemplo — Producto', categoria: 'Ejemplo', costo: 2500, precio_venta: 5000, stock: 100, stock_minimo: 10, requiere_peso: 'NO' }], { header: ['codigo_barras', 'descripcion', 'categoria', 'costo', 'precio_venta', 'stock', 'stock_minimo', 'requiere_peso'] });
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Productos');
      const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      await saveFile('Plantilla_Productos.xlsx', new Uint8Array(buf as unknown as ArrayBuffer), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); setStatusMsg('Plantilla descargada'); setTimeout(() => setStatusMsg(null), 3000);
    } catch (e) { setStatusMsg('Error descargando plantilla'); }
  };

  const handleExport = async () => {
    setStatusMsg('Exportando Excel...');
    try {
      const data = products.map(p => ({ 'Código Barras': p.codigo_barras, Descripción: p.descripcion, Categoría: p.categoria_nombre || '', Costo: p.costo, 'Precio Venta': p.precio_venta, Stock: p.stock_actual, 'Stock Mínimo': p.stock_minimo, 'Por Peso': p.requiere_peso ? 'Sí' : 'No', Activo: p.activo ? 'Sí' : 'No' }));
      const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
      const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      await saveFile(`inventario_${new Date().toISOString().slice(0, 10)}.xlsx`, new Uint8Array(buf as unknown as ArrayBuffer), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      setStatusMsg('Excel generado'); setTimeout(() => setStatusMsg(null), 3000);
    } catch (e) { setStatusMsg('Error exportando Excel'); }
  };

  const exportPdfInventory = async () => {
    if (products.length === 0) { setError('No hay productos para exportar'); return; }
    setStatusMsg('Generando PDF...');
    const { data: sRows } = await supabase.from('sucursales').select('nombre').eq('id', session?.sucursal_id).limit(1);
    const name = (sRows && sRows.length > 0) ? sRows[0].nombre : session?.sucursal_id ?? '';
    const headers = ['Código', 'Descripción', 'Categoría', 'Costo', 'Precio', 'Stock', 'Stock Mín', 'IVA', 'IC'];
    const data = products.map(p => [p.codigo_barras, p.descripcion, p.categoria_nombre || '', String(p.costo), String(p.precio_venta), String(p.stock_actual), String(p.stock_minimo), `${(p.tarifa_iva * 100).toFixed(0)}%`, p.tarifa_impoconsumo > 0 ? `${(p.tarifa_impoconsumo * 100).toFixed(0)}%` : '0%']);
    const r = await exportPdf(headers, data, { titulo: 'Inventario', sucursal: name, subtitulo: `${products.length} productos` });
    setStatusMsg(r.success ? 'PDF generado' : `Error: ${r.error}`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!session || !e.target.files?.[0]) return;
    setStatusMsg('Importando...');
    setError(null);
    try {
      const file = e.target.files[0];
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
      if (rows.length === 0) { setError('Archivo vacío'); return; }

      const required = ['codigo_barras', 'descripcion', 'precio_venta'];
      const missing = required.filter(c => !(c in (rows[0] || {})));
      if (missing.length > 0) { setError(`Faltan columnas: ${missing.join(', ')}`); return; }

      let creados = 0, actualizados = 0, omitidos = 0, errores = 0;
      const erroresLog: string[] = [];

      for (const r of rows) {
        try {
          const code = String(r.codigo_barras || '').trim();
          const desc = String(r.descripcion || '').trim();
          const precio = parseFloat(String(r.precio_venta || '0').replace(',', '.'));
          if (!code || !desc || isNaN(precio) || precio <= 0) { omitidos++; continue; }
          const stock = parseInt(String(r.stock || '0')) || 0;
          const costo = parseFloat(String(r.costo || '0').replace(',', '.')) || 0;
          const stockMinimo = parseInt(String(r.stock_minimo || '10')) || 10;
          const categoriaRaw = String(r.categoria || '').trim();

          let categoriaId: string | null = null;
          if (categoriaRaw) {
            const { data: cat } = await supabase
              .from('categorias')
              .select('id')
              .eq('sucursal_id', session.sucursal_id)
              .ilike('nombre', categoriaRaw)
              .maybeSingle();
            if (cat) categoriaId = cat.id;
          }

          const { data: existing } = await supabase
            .from('productos')
            .select('id')
            .eq('sucursal_id', session.sucursal_id)
            .eq('codigo_barras', code)
            .maybeSingle();

          let productId: string;
          if (existing) {
            productId = existing.id;
            const { error: updErr } = await supabase
              .from('productos')
              .update({
                descripcion: desc,
                precio_venta: precio,
                costo,
                stock_minimo: stockMinimo,
                categoria_id: categoriaId,
              })
              .eq('id', productId)
              .eq('sucursal_id', session.sucursal_id);
            if (updErr) throw updErr;
            actualizados++;
          } else {
            productId = crypto.randomUUID();
            const { error: insErr } = await supabase
              .from('productos')
              .insert({
                id: productId,
                sucursal_id: session.sucursal_id,
                codigo_barras: code,
                descripcion: desc,
                precio_venta: precio,
                costo,
                tarifa_iva: 0.19,
                tarifa_impoconsumo: 0,
                activo: true,
                stock_minimo: stockMinimo,
                requiere_peso: false,
                categoria_id: categoriaId,
              });
            if (insErr) throw insErr;
            creados++;
          }

          const { error: invErr } = await supabase
            .from('inventario_sucursal')
            .upsert(
              { sucursal_id: session.sucursal_id, producto_id: productId, stock_actual: stock },
              { onConflict: 'sucursal_id, producto_id' }
            );
          if (invErr) throw invErr;
        } catch (rowErr) {
          errores++;
          const msg = rowErr instanceof Error ? rowErr.message : 'Error desconocido';
          erroresLog.push(`Fila ${rows.indexOf(r) + 2}: ${msg}`);
        }
      }

      const total = rows.length;
      let resumen = `Importación completada: ${total} procesados`;
      if (creados > 0) resumen += `, ${creados} creados`;
      if (actualizados > 0) resumen += `, ${actualizados} actualizados`;
      if (omitidos > 0) resumen += `, ${omitidos} omitidos`;
      if (errores > 0) resumen += `, ${errores} errores`;

      if (erroresLog.length > 0) {
        const wsLog = XLSX.utils.json_to_sheet(erroresLog.map(m => ({ error: m })));
        const wbLog = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wbLog, wsLog, 'Errores');
        const bufLog = XLSX.write(wbLog, { type: 'array', bookType: 'xlsx' });
        await saveFile(`errores_importacion_${new Date().toISOString().slice(0, 10)}.xlsx`, new Uint8Array(bufLog as unknown as ArrayBuffer), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        resumen += '. Se descargó un archivo con los errores.';
      }

      setStatusMsg(resumen);
      setTimeout(() => setStatusMsg(null), 6000);
      loadProducts();
    } catch (err) {
      console.error(err);
      setError('Error al importar archivo');
    }
    finally { e.target.value = ''; }
  };

  const fmtPrice = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });
  if (!session) return null;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 items-center">
          <input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] w-64" />
          <select value={filter} onChange={e => setFilter(e.target.value as FilterMode)} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="todos">Todos</option><option value="stock_bajo">Stock Bajo</option><option value="inactivos">Inactivos</option>
          </select>
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)]">{showCreateForm ? 'Cancelar' : '+ Nuevo'}</button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadTemplate} className="text-xs px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Plantilla</button>
          <label className="text-xs px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer">Importar<input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" /></label>
          <button onClick={handleExport} className="text-xs px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Excel</button>
          <button onClick={exportPdfInventory} className="text-xs px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">PDF</button>
        </div>
      </div>

      {showCreateForm && (
        <div className="p-5 border-b border-gray-200 bg-gradient-to-b from-blue-50/50 to-white animate-[slideUp_250ms_ease-out]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white"><Plus size={14} /></div>
            <h3 className="text-sm font-semibold text-gray-900">Nuevo producto</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs text-gray-500 font-medium mb-1">Código de barras *</label>
              <input autoFocus placeholder="Ej: 7701234567890" value={createForm.codigo_barras} onChange={e => setCreateForm({ ...createForm, codigo_barras: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-all" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 font-medium mb-1">Descripción *</label>
              <input placeholder="Nombre del producto" value={createForm.descripcion} onChange={e => setCreateForm({ ...createForm, descripcion: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-all" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Precio venta *</label>
              <input type="number" step="0.01" min="0" placeholder="$ 0.00" value={createForm.precio_venta} onChange={e => setCreateForm({ ...createForm, precio_venta: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-all" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Costo</label>
              <input type="number" step="0.01" min="0" placeholder="$ 0.00" value={createForm.costo} onChange={e => setCreateForm({ ...createForm, costo: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-all" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Stock inicial</label>
              <input type="number" step="1" min="0" placeholder="0" value={createForm.stock_inicial} onChange={e => setCreateForm({ ...createForm, stock_inicial: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-all" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Stock mínimo</label>
              <input type="number" step="1" min="1" placeholder="10" value={createForm.stock_minimo} onChange={e => setCreateForm({ ...createForm, stock_minimo: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-all" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">IVA</label>
              <select value={createForm.tarifa_iva} onChange={e => setCreateForm({ ...createForm, tarifa_iva: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-all">
                <option value="0.19">19%</option>
                <option value="0.05">5%</option>
                <option value="0">Exento</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1">Impoconsumo</label>
              <select value={createForm.tarifa_impoconsumo} onChange={e => setCreateForm({ ...createForm, tarifa_impoconsumo: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-all">
                <option value="0">Ninguno</option>
                <option value="0.08">8%</option>
                <option value="0.16">16%</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleCreateProduct} className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 active:scale-[0.98] transition-all shadow-sm shadow-green-500/20">Crear producto</button>
              <button onClick={() => setShowCreateForm(false)} className="bg-white border border-gray-300 text-gray-500 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mx-4 mt-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg p-2 flex items-center justify-between">{error}<button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><CloseX size={14} /></button></div>}
      {statusMsg && <div className="mx-4 mt-2 bg-green-50 border border-green-200 text-green-600 text-xs rounded-lg p-2">{statusMsg}</div>}

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-2 p-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="animate-pulse flex gap-3 p-3 bg-white rounded-lg border border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded flex-1" />
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <Box size={48} className="mb-4 mx-auto text-gray-300" />
              <p className="text-lg font-medium text-gray-500">Sin productos</p>
              <p className="text-sm mt-1">Haga clic en "+ Nuevo" para crear su primer producto</p>
            </div>
          </div>
        ) : (
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
            <th className="p-3">Código</th><th className="p-3">Descripción</th><th className="p-3 text-right">Precio</th><th className="p-3 text-right">Costo</th><th className="p-3 text-right">Stock Min</th><th className="p-3 text-right">Stock</th><th className="p-3 text-center">IVA</th><th className="p-3 text-center">IC</th><th className="p-3 text-center">Estado</th><th className="p-3 text-center w-44">Acciones</th>
          </tr></thead>
          <tbody>{paged.map(p => (
            <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
              {editingId === p.id ? (
                <>
                  <td className="p-1"><input value={editForm.codigo_barras} onChange={e => setEditForm({ ...editForm, codigo_barras: e.target.value })} className="w-32 bg-white border border-[var(--color-primary-border)] rounded px-2 py-1 text-xs" /></td>
                  <td className="p-1"><input value={editForm.descripcion} onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })} className="w-44 bg-white border border-[var(--color-primary-border)] rounded px-2 py-1 text-xs" /></td>
                  <td className="p-1"><input type="number" value={editForm.precio_venta} onChange={e => setEditForm({ ...editForm, precio_venta: e.target.value })} className="w-20 bg-white border border-[var(--color-primary-border)] rounded px-2 py-1 text-xs text-right" /></td>
                  <td className="p-1"><input type="number" value={editForm.costo} onChange={e => setEditForm({ ...editForm, costo: e.target.value })} className="w-20 bg-white border border-[var(--color-primary-border)] rounded px-2 py-1 text-xs text-right" /></td>
                  <td className="p-1"><input type="number" value={editForm.stock_minimo} onChange={e => setEditForm({ ...editForm, stock_minimo: e.target.value })} className="w-16 bg-white border border-[var(--color-primary-border)] rounded px-2 py-1 text-xs text-right" title="Stock mínimo" /></td>
                  <td className="p-3 text-right text-gray-500">{p.stock_actual}</td>
                  <td className="p-1"><select value={editForm.tarifa_iva} onChange={e => setEditForm({ ...editForm, tarifa_iva: e.target.value })} className="bg-white border border-[var(--color-primary-border)] rounded px-2 py-1 text-xs"><option value="0">0%</option><option value="0.05">5%</option><option value="0.19">19%</option></select></td>
                  <td className="p-1"><select value={editForm.tarifa_impoconsumo} onChange={e => setEditForm({ ...editForm, tarifa_impoconsumo: e.target.value })} className="bg-white border border-[var(--color-primary-border)] rounded px-2 py-1 text-xs"><option value="0">0%</option><option value="0.08">8%</option></select></td>
                  <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td className="p-1 text-center"><div className="flex gap-1"><button onClick={saveEdit} className="text-xs bg-[var(--color-primary)] text-white px-2 py-1 rounded">Guardar</button><button onClick={() => setEditingId(null)} className="text-xs bg-white border px-2 py-1 rounded">Cancelar</button></div></td>
                </>
              ) : (
                <>
                  <td className="p-3 text-gray-500 text-xs">{p.codigo_barras}</td>
                  <td className="p-3"><div className="font-medium text-gray-900 truncate max-w-[200px]">{p.descripcion}</div>{p.categoria_nombre && <div className="text-gray-400 text-[10px]">{p.categoria_nombre}</div>}</td>
                  <td className="p-3 text-right text-[var(--color-primary)] font-semibold">${fmtPrice(p.precio_venta)}</td>
                  <td className="p-3 text-right text-gray-500">${fmtPrice(p.costo)}</td>
                  <td className="p-3 text-right text-gray-500 text-xs">{p.stock_minimo}</td>
                  <td className="p-3 text-right"><div className="flex items-center justify-end gap-1.5"><span className={`inline-block w-2 h-2 rounded-full ${p.stock_actual <= 0 ? 'bg-red-500' : p.stock_actual <= p.stock_minimo ? 'bg-amber-400' : 'bg-green-500'}`} /><span className={`font-semibold ${p.stock_actual <= 0 ? 'text-red-600' : p.stock_actual <= p.stock_minimo ? 'text-amber-600' : 'text-gray-700'}`}>{p.stock_actual}</span></div></td>
                  <td className="p-3 text-center text-xs text-gray-500">{(p.tarifa_iva * 100).toFixed(0)}%</td>
                  <td className="p-3 text-center text-xs text-gray-500">{p.tarifa_impoconsumo > 0 ? `${(p.tarifa_impoconsumo * 100).toFixed(0)}%` : '-'}</td>
                  <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td className="p-3 text-center"><div className="flex gap-1 justify-center">
                    <button onClick={() => startEdit(p)} className="text-xs bg-white border border-gray-300 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50">Editar</button>
                    <button onClick={() => toggleActive(p.id, p.activo)} className={`text-xs px-2 py-1 rounded-lg ${p.activo ? 'bg-white border border-gray-300 text-gray-500' : 'bg-red-100 text-red-700'}`}>{p.activo ? 'Desactivar' : 'Activar'}</button>
                    <button onClick={() => setAdjustProduct({ id: p.id, name: p.descripcion, stock: p.stock_actual })} className="text-xs px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg">Stock</button>
                    <button onClick={() => setDeleteProduct({ id: p.id, name: p.descripcion })} className="text-xs px-2 py-1 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100" title="Eliminar permanentemente">🗑</button>
                  </div></td>
                </>
              )}
            </tr>
          ))}</tbody>
        </table>
        )}
      </div>
      <div className="p-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
        <span>{filtered.length} productos</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 bg-white border rounded disabled:opacity-30">Anterior</button>
          <span className="px-3 py-1">{page + 1} / {totalPages || 1}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1 bg-white border rounded disabled:opacity-30">Siguiente</button>
        </div>
      </div>
      {deleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_150ms_ease-out]" onClick={() => setDeleteProduct(null)}>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-sm w-full p-6 animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><span className="text-red-500 text-xl">🗑</span></div>
              <h2 className="text-lg font-bold text-gray-900">Eliminar producto</h2>
              <p className="text-sm text-gray-500 mt-1">¿Eliminar permanentemente <strong>{deleteProduct.name}</strong>?</p>
              <p className="text-xs text-red-500 mt-2">Esta acción no puede deshacerse.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteProduct(null)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDeleteProduct} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
      {adjustProduct && <StockAdjustmentModal productId={adjustProduct.id} productName={adjustProduct.name} currentStock={adjustProduct.stock} onSuccess={() => { setAdjustProduct(null); loadProducts(); }} onClose={() => setAdjustProduct(null)} />}
    </div>
  );
};
