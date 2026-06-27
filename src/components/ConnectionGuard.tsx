import React, { useState, useEffect } from 'react';

export const ConnectionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const go = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', go);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', go); window.removeEventListener('offline', off); };
  }, []);

  if (!online) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-red-500 text-3xl">!</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sin conexión a internet</h1>
          <p className="text-gray-500 text-sm mb-6">
            VenxPos requiere conexión a internet para operar. Verifique su conexión e intente nuevamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--color-primary-dark)] transition-colors text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
