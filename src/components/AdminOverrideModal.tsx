import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { CloseX } from './Icons';

export const AdminOverrideModal: React.FC<{ actionName: string; onCancel: () => void; onSuccess: () => void }> = ({ actionName, onCancel, onSuccess }) => {
  const { session } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  const verify = async () => {
    if (!session) return;
    const { data } = await supabase.from('usuarios').select('pin_acceso').eq('user_id', session.id).single();
    if (data && data.pin_acceso === pin) { onSuccess(); } else { setError('PIN incorrecto'); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_150ms_ease-out]" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-sm w-full animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Autorización Admin — {actionName}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 p-1"><CloseX size={18} /></button>
        </div>
        <input type="password" maxLength={6} autoFocus placeholder="PIN de administrador" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') verify(); }} className="w-full bg-white border border-gray-300 rounded-lg p-3 text-center text-2xl tracking-widest outline-none focus:border-[var(--color-primary)] mb-4" />
        {error && <div className="text-red-600 text-sm text-center mb-4">{error}</div>}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium">Cancelar</button>
          <button onClick={verify} className="flex-1 bg-[var(--color-primary)] text-white py-2.5 rounded-lg font-semibold">Autorizar</button>
        </div>
      </div>
    </div>
  );
};
