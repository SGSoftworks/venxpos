import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import iconApp from '../assets/branding/icon-app.png';

interface Props {
  onSuccess: (aperturaId: string, fondo: number) => void;
  onCancel: () => void;
}

export const AperturaTurnoModal: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const { session } = useAppStore();
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const fondo = parseFloat(monto);
    if (isNaN(fondo) || fondo < 0) { setError('Ingrese un monto válido (0 o superior)'); return; }
    setLoading(true); setError('');
    try {
      const aperturaId = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error: insertError } = await supabase.from('aperturas_caja').insert({
        id: aperturaId, sucursal_id: session.sucursal_id, usuario_id: session.usuario_db_id ?? session.id,
        fondo_inicial: fondo, fecha_apertura: now, estado: 'abierta',
      });
      if (insertError) throw insertError;
      onSuccess(aperturaId, fondo);
    } catch (e) { console.error(e); setError('Error al abrir turno'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <img src={iconApp} alt="" className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Apertura de Turno</h2>
        <p className="text-gray-500 text-sm text-center mb-6">{session?.nombre}</p>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div><label className="block text-gray-600 mb-2 text-sm font-medium">Fondo inicial de caja ($)</label>
            <input ref={inputRef} type="number" step="100" min="0" required className="w-full bg-white border-2 border-[var(--color-primary-border)] rounded-lg p-4 text-3xl text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-center" placeholder="0" value={monto} onChange={(e) => setMonto(e.target.value)} disabled={loading} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[var(--color-primary)] text-white font-semibold py-3.5 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-sm">{loading ? 'Abriendo turno...' : 'Iniciar turno (Enter)'}</button>
        </form>
      </div>
    </div>
  );
};
