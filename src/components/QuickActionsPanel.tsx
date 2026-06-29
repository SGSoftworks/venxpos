import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Plus, Banknote, CreditCard } from './Icons';
import { lastScanAt } from '../lib/barcodeScanner';

export type QAMode = 'idle' | 'payment';

interface QuickActionsPanelProps {
  mode: QAMode;
  onModeChange: (mode: QAMode) => void;
  onOpenPaymentModal: () => void;
  onOpenFreeSaleModal: (initialValue?: string) => void;
  aperturaBloqueada: boolean;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  mode,
  onModeChange,
  onOpenPaymentModal,
  onOpenFreeSaleModal,
  aperturaBloqueada,
}) => {
  const { cart, cartTotal } = useAppStore();
  const [display, setDisplay] = useState('');
  const lastScanCheckedRef = useRef(0);

  useEffect(() => { setDisplay(''); }, [mode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (aperturaBloqueada) return;
      if (lastScanAt > lastScanCheckedRef.current) {
        lastScanCheckedRef.current = lastScanAt;
        setDisplay('');
      }
      if (e.defaultPrevented) return;
      const isNum = e.key >= '0' && e.key <= '9';
      const isDot = e.key === '.';
      const isEnter = e.key === 'Enter';
      const isBS = e.key === 'Backspace' || e.key === 'Delete';

      const target = (e.target as HTMLElement)?.closest('input, textarea, select, [contenteditable]');
      const isInInput = !!target;

      if (mode === 'payment') {
        if (isInInput) return;
        if (isNum) { e.preventDefault(); setDisplay(d => d + e.key); return; }
        if (isDot) { e.preventDefault(); setDisplay(d => d.includes('.') ? d : d + '.'); return; }
        if (isBS) { e.preventDefault(); setDisplay(d => d.slice(0, -1)); return; }
        if (isEnter) { e.preventDefault(); if (cart.length > 0) onOpenPaymentModal(); return; }
        return;
      }

      if (mode === 'idle') {
        if (isInInput) return;
        if (isNum) { setDisplay(d => d + e.key); return; }
        if (isDot) { setDisplay(d => d.includes('.') ? d : d + '.'); return; }
        if (isBS) { setDisplay(d => d.slice(0, -1)); return; }
        if (isEnter && display) { e.preventDefault(); setDisplay(''); onOpenFreeSaleModal(display); return; }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, aperturaBloqueada, display, cart.length, onOpenPaymentModal, onOpenFreeSaleModal]);

  const keypadPress = (k: string) => {
    if (aperturaBloqueada) return;
    if (k === 'C') { setDisplay(''); return; }
    setDisplay(d => d.includes('.') && k === '.' ? d : d + k);
  };

  const totalItems = cart.reduce((s, i) => s + i.cantidad, 0);

  if (aperturaBloqueada) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-amber-500 font-semibold text-sm">Sin apertura de caja</p>
          <p className="text-gray-400 text-xs mt-1">Presione F1 para abrir turno</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 animate-[fadeIn_200ms_ease-out]">
      {mode === 'idle' && (
        <>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-right">
            <span className="text-3xl font-bold text-gray-900 tabular-nums">{display || '0'}</span>
            {display && <span className="text-gray-400 text-xs ml-1">ingresado</span>}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {['7','8','9','4','5','6','1','2','3','0','.','C'].map((k) => (
              <button key={k} onClick={() => keypadPress(k)}
                className={`py-3 rounded-lg text-lg font-bold transition-colors active:scale-95 ${
                  k === 'C'
                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                    : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm'
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={() => { setDisplay(''); onOpenFreeSaleModal(display || undefined); }}
              className="flex items-center justify-center gap-1.5 bg-white border border-[var(--color-primary-border)] text-[var(--color-primary)] py-3 rounded-lg font-semibold text-sm hover:bg-[var(--color-primary-light)] transition-colors active:scale-95"
            >
              <Plus size={16} />
              Venta Libre
              <span className="text-[10px] opacity-60 ml-0.5">F9</span>
            </button>
            <button onClick={() => { if (cart.length > 0) onOpenPaymentModal(); }}
              disabled={cart.length === 0}
              className={`flex items-center justify-center gap-1.5 py-3 rounded-lg font-semibold text-sm transition-colors active:scale-95 ${
                cart.length > 0
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Banknote size={16} />
              Pagar
              <span className="text-[10px] opacity-60 ml-0.5">F10</span>
            </button>
          </div>

          <div className="mt-auto pt-3 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{totalItems > 0 ? `${cart.length} productos (${totalItems.toFixed(1)} und)` : 'Carrito vacío'}</span>
              {cartTotal > 0 && (
                <span className="font-bold text-gray-900 tabular-nums">${cartTotal.toLocaleString()}</span>
              )}
            </div>
          </div>
        </>
      )}

      {mode === 'payment' && (
        <div className="space-y-3 animate-[fadeIn_150ms_ease-out]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <CreditCard size={16} className="text-green-600" />
              Pago Rápido
            </h3>
            <button onClick={() => onModeChange('idle')}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1"
            >
              Cancelar (Esc)
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-xs text-green-700 font-semibold uppercase tracking-wider">Total a pagar</p>
            <p className="text-3xl font-black text-green-700 tabular-nums mt-1">
              ${cartTotal.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Monto recibido</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-right">
              <span className="text-3xl font-bold text-gray-900 tabular-nums">{display || '0'}</span>
            </div>
          </div>

          {display && parseFloat(display) >= cartTotal && (
            <div className="text-center py-1">
              <span className="text-gray-500 text-sm">Cambio: </span>
              <span className="text-green-600 font-bold text-lg tabular-nums">
                ${(parseFloat(display) - cartTotal).toLocaleString()}
              </span>
            </div>
          )}

          {display && parseFloat(display) > 0 && parseFloat(display) < cartTotal && (
            <div className="text-center py-1">
              <span className="text-amber-600 text-sm font-medium">
                Faltan ${(cartTotal - parseFloat(display)).toLocaleString()}
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-1.5">
            {['7','8','9','4','5','6','1','2','3','0','.','C'].map((k) => (
              <button key={k} onClick={() => keypadPress(k)}
                className={`py-3 rounded-lg text-lg font-bold transition-colors active:scale-95 ${
                  k === 'C'
                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                    : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-sm'
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          <button onClick={() => { if (cart.length > 0) onOpenPaymentModal(); }}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors active:scale-95 shadow-sm ${
              cart.length > 0
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Ir a Pago ({cart.length} productos)
          </button>
        </div>
      )}
    </div>
  );
};
