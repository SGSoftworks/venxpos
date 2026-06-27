import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import logoPos from '../assets/branding/logo-pos.png';

const SAAS_URL = 'https://venxpos-saas.vercel.app';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState<{ message: string; detail: string } | null>(null);
  const isMounted = useRef(true);

  useEffect(() => () => { isMounted.current = false; }, []);

  const { setSession, setOnlineStatus, setSubscription } = useAppStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (!authData.user) throw new Error('No user data returned');

      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, rol, nombre, sucursal_id')
        .eq('user_id', authData.user.id)
        .single();
      if (userError) throw userError;

      const { data: subInfo, error: subError } = await supabase.rpc('get_subscription_info');
      if (subError) throw subError;

      // Block access if subscription is not active
      if (!subInfo || subInfo.subscription_status !== 'active') {
        setBlocked({
          message: 'Cuenta pausada',
          detail: subInfo?.subscription_status === 'past_due'
            ? `Tu plan "${subInfo.plan}" está vencido desde el ${new Date(subInfo.proximo_cobro).toLocaleDateString()}. Renueva desde el panel administrativo para reactivar tu cuenta.`
            : 'Tu cuenta se encuentra pausada. Comunícate con el administrador para más información.',
        });
        return;
      }

      setOnlineStatus(true);
      setSubscription(subInfo as Parameters<typeof setSubscription>[0]);
      setSession({
        id: authData.user.id,
        usuario_db_id: userData.id,
        email: authData.user.email ?? email,
        sucursal_id: userData.sucursal_id,
        rol: userData.rol as 'cajero' | 'admin',
        nombre: userData.nombre,
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      });
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Error al iniciar sesión');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center mb-8 animate-[fadeUp_0.5s_ease-out]">
          <img src={logoPos} alt="VENXPOS" className="w-60 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Sistema de Gestión Comercial</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-600 mb-1.5 text-sm font-medium">Correo electrónico</label>
            <input autoFocus type="email" required className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-colors" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          </div>
          <div>
            <label className="block text-gray-600 mb-1.5 text-sm font-medium">Contraseña</label>
            <input type="password" required className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] transition-colors" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
          </div>
          <button type="submit" disabled={loading} className={`w-full py-3 font-semibold rounded-lg transition-colors text-sm ${loading ? 'bg-gray-200 text-gray-400 cursor-wait' : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]'}`}>
            {loading ? 'Iniciando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>

      {/* Subscription blocked modal */}
      {blocked && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50" onClick={() => setBlocked(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 max-w-md w-full mx-4 p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{blocked.message}</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{blocked.detail}</p>
            <a
              href={SAAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors text-sm"
            >
              Ir al panel de administración
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
