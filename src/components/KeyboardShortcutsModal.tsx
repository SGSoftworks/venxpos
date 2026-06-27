import React, { useEffect } from 'react';
import { CloseX } from './Icons';

const SHORTCUTS = [
  { key: 'F1', desc: 'Buscar / Escanear producto / Abrir caja si no hay turno' },
  { key: 'F2', desc: 'Editar cantidad del ítem seleccionado' },
  { key: 'F3', desc: 'Aplicar descuento % o cambiar precio' },
  { key: 'F9', desc: 'Venta Libre (precio manual por categoría)' },
  { key: 'F10', desc: 'Ir a pago (cobrar)' },
  { key: 'F8', desc: 'Reimprimir último ticket' },
  { key: 'F12', desc: 'Abrir devolución' },
  { key: '↑↓', desc: 'Navegar entre resultados de búsqueda o carrito' },
  { key: 'Del', desc: 'Quitar ítem del carrito (requiere PIN admin si no es admin)' },
  { key: 'ESC', desc: 'Cerrar modal / panel / edición' },
  { key: 'Enter', desc: 'Confirmar búsqueda / edición / pago' },
];

export const KeyboardShortcutsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Atajos de Teclado</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1"><CloseX size={18} /></button>
        </div>
        <div className="p-4 space-y-1.5 max-h-[70vh] overflow-y-auto">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
              <code className="bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-xs px-2 py-1 rounded min-w-[60px] text-center border border-[var(--color-primary-light)]">
                {s.key}
              </code>
              <span className="text-sm text-gray-700">{s.desc}</span>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-200 text-center">
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            Cerrar (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};
