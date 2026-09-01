import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CloseX } from './Icons';

interface Props {
  productId: string;
  codigoBarras: string;
  descripcion: string;
  precioUnitario: number;
  onConfirm: (cantidad: number) => void;
  onCancel: () => void;
}

export const WeightModal: React.FC<Props> = ({
  productId,
  codigoBarras,
  descripcion,
  precioUnitario,
  onConfirm,
  onCancel,
}) => {
  const { addToCart } = useAppStore();
  const [kg, setKg] = useState('1.00');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  const presets = [0.25, 0.50, 0.75, 1.00, 1.50, 2.00];

  const handleConfirm = () => {
    const qty = parseFloat(kg);
    if (isNaN(qty) || qty <= 0) {
      setError('Ingrese un peso válido mayor a 0');
      return;
    }
    setError(null);

    addToCart({
      producto_id: productId,
      codigo_barras: codigoBarras,
      descripcion,
      cantidad: qty,
      precio_unitario: precioUnitario,
    });

    onConfirm(qty);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_150ms_ease-out]" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Producto por Peso</h2>
            <p className="text-sm text-[var(--color-primary)] font-semibold mt-1">{descripcion}</p>
            <p className="text-xs text-gray-500">${precioUnitario.toLocaleString()} / kg</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 p-1"><CloseX size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-gray-500 text-sm mb-1.5 font-medium">Kilogramos</label>
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              min="0.01"
              className="w-full bg-white border-2 border-[var(--color-primary-border)] rounded-lg p-4 text-3xl text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]"
              value={kg}
              onChange={(e) => { setKg(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onCancel(); }}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => { setKg(String(p)); setError(null); }}
                className="bg-white border border-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {p.toFixed(2)} kg
              </button>
            ))}
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
            <span className="text-gray-500 text-sm">Total: </span>
            <span className="text-[var(--color-primary)] text-3xl font-bold">
              ${((parseFloat(kg) || 0) * precioUnitario).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onCancel} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors text-sm">
              Cancelar
            </button>
            <button onClick={handleConfirm} className="px-8 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors">
              Agregar ({kg} kg)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
