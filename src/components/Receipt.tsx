import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export const Receipt: React.FC = () => {
  const { lastCompletedSale: sale, subscription, session } = useAppStore();
  const [sucursalData, setSucursalData] = useState<{ nit: string; direccion: string; telefono: string }>({ nit: '', direccion: '', telefono: '' });

  useEffect(() => {
    if (!session?.sucursal_id) return;
    (async () => {
      const { data } = await supabase.from('sucursales').select('nit, direccion, telefono').eq('id', session.sucursal_id).single();
      if (data) setSucursalData({ nit: data.nit || '', direccion: data.direccion || '', telefono: data.telefono || '' });
    })();
  }, [session?.sucursal_id]);

  if (!sale) return null;

  const businessName = subscription?.sucursal_nombre || 'VENXPOS';
  const nit = sucursalData.nit;
  const address = sucursalData.direccion;
  const phone = sucursalData.telefono;
  const fmt2 = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="receipt-container hidden print:block" style={{ width: '300px', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.3', color: 'black', backgroundColor: 'white', padding: '10px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 3px 0', fontWeight: 'bold' }}>{businessName}</h2>
        {nit && <p style={{ margin: '0', fontSize: '11px' }}>NIT: {nit}</p>}
        {address && <p style={{ margin: '0', fontSize: '11px' }}>{address}</p>}
        {phone && <p style={{ margin: '0', fontSize: '11px' }}>Tel: {phone}</p>}
      </div>
      <div style={{ borderBottom: '1px dashed #666', margin: '6px 0' }} />
      <div style={{ marginBottom: '6px', fontSize: '11px' }}>
        <p style={{ margin: '0' }}>Fecha: {new Date(sale.fecha).toLocaleString()}</p>
        <p style={{ margin: '0' }}>Cajero: {session?.nombre || '—'}</p>
        <p style={{ margin: '0' }}><b>Ticket POS #{sale.ticketNumber}</b></p>
        <p style={{ margin: '0' }}>Pago: {sale.metodoPago}</p>
      </div>
      <div style={{ borderBottom: '1px dashed #666', margin: '6px 0' }} />
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '11px' }}>
        <thead><tr style={{ borderBottom: '1px solid black' }}><th style={{ textAlign: 'left', paddingBottom: '3px' }}>CANT</th><th style={{ textAlign: 'left', paddingBottom: '3px' }}>DESCRIPCIÓN</th><th style={{ textAlign: 'right', paddingBottom: '3px' }}>TOTAL</th></tr></thead>
        <tbody>{sale.items.map((item, idx) => (<tr key={idx}><td style={{ verticalAlign: 'top', paddingTop: '4px', whiteSpace: 'nowrap' }}>{item.cantidad.toFixed(3)}</td><td style={{ verticalAlign: 'top', paddingTop: '4px', paddingRight: '4px' }}>{item.descripcion}{item.tarifa_iva === 0 && item.tarifa_impoconsumo === 0 && <span style={{ fontSize: '9px', color: '#888' }}> (Exento)</span>}{item.descuento_porcentaje > 0 && <span style={{ fontSize: '9px', color: '#c70' }}> -{item.descuento_porcentaje}%</span>}</td><td style={{ verticalAlign: 'top', paddingTop: '4px', textAlign: 'right', whiteSpace: 'nowrap' }}>${fmt2(item.subtotal)}</td></tr>))}</tbody>
      </table>
      <div style={{ borderBottom: '1px dashed #666', margin: '6px 0' }} />
      {sale.taxBreakdown.length > 0 && sale.taxBreakdown.map((row) => (<div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginLeft: '8px' }}><span>{row.label}:</span><span>${fmt2(row.tax)}</span></div>))}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}><span>SUBTOTAL:</span><span>${fmt2(sale.subtotal)}</span></div>
      {sale.items.reduce((sum, i) => sum + (i.descuento_porcentaje > 0 ? i.cantidad * i.precio_original * (i.descuento_porcentaje / 100) : 0), 0) > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#c70' }}><span>DTO TOTAL:</span><span>-${fmt2(sale.items.reduce((sum, i) => sum + (i.descuento_porcentaje > 0 ? i.cantidad * i.precio_original * (i.descuento_porcentaje / 100) : 0), 0))}</span></div>)}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '4px', borderTop: '1px solid black', paddingTop: '3px' }}><span>TOTAL:</span><span>${fmt2(sale.total)}</span></div>
      {sale.montoRecibido > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '2px' }}><span>Recibido:</span><span>${fmt2(sale.montoRecibido)}</span></div>)}
      {sale.cambioEntregado > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}><span>Cambio:</span><span>${fmt2(sale.cambioEntregado)}</span></div>)}
      <div style={{ borderBottom: '1px dashed #666', margin: '8px 0' }} />
      <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '10px' }}><p style={{ margin: '0', fontStyle: 'italic' }}>*** GRACIAS POR SU COMPRA ***</p><p style={{ margin: '4px 0 0 0', fontSize: '9px', color: '#888' }}>VenxPOS — Desarrollado por JGSoftworks</p><p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#888' }}>www.venxpos.com</p></div>
    </div>
  );
};
