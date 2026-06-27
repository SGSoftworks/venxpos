import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CloseX } from './Icons';

export const ConfigPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { subscription } = useAppStore();

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_150ms_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center"><h2 className="text-lg font-bold text-gray-900">Configuración</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1"><CloseX size={18} /></button></div>
        <div className="p-4 space-y-4">
          {subscription ? (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Suscripción</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Plan</p>
                  <p className="font-semibold text-gray-900 capitalize">{subscription.plan}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Estado</p>
                  <p className={`font-semibold ${subscription.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {subscription.subscription_status === 'active' ? 'Activo' : subscription.subscription_status === 'past_due' ? 'Pendiente' : subscription.subscription_status === 'cancelled' ? 'Cancelado' : 'Vencido'}
                  </p>
                </div>
                {subscription.proximo_cobro && (
                  <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Próxima renovación</p>
                    <p className="font-semibold text-gray-900">{new Date(subscription.proximo_cobro).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                )}
              </div>
              <button onClick={() => window.open(import.meta.env.VITE_SAAS_URL || 'http://localhost:5174', '_blank')} className="w-full mt-3 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 text-sm transition-colors">
                Administrar suscripción
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Cargando información de suscripción...</p>
          )}
        </div>
      </div>
    </div>
  );
};
