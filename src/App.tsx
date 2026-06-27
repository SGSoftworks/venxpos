import { useEffect, useState } from 'react';
import { POSLayout } from './components/POSLayout';
import { Receipt } from './components/Receipt';
import { Login } from './components/Login';
import { supabase } from './lib/supabase';
import { useAppStore } from './store/useAppStore';
import { ConnectionGuard } from './components/ConnectionGuard';

const SAAS_URL = 'https://venxpos-saas.vercel.app';

function App() {
  const { session, setSession, setSubscription } = useAppStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const { data: userData } = await supabase
            .from('usuarios')
            .select('id, rol, nombre, sucursal_id')
            .eq('user_id', data.session.user.id)
            .single();

          if (userData) {
            const { data: subInfo } = await supabase.rpc('get_subscription_info');
            if (subInfo) setSubscription(subInfo);

            if (!subInfo || subInfo.subscription_status !== 'active') {
              setSubscriptionBlocked(subInfo?.proximo_cobro
                ? `El plan "${subInfo.plan}" venció el ${new Date(subInfo.proximo_cobro).toLocaleDateString()}.`
                : 'Tu suscripción no está activa.');
              return;
            }

            setSession({
              id: data.session.user.id,
              usuario_db_id: userData.id,
              email: data.session.user.email ?? '',
              sucursal_id: userData.sucursal_id,
              rol: userData.rol as 'cajero' | 'admin',
              nombre: userData.nombre,
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token ?? '',
            });
          }
        }
      } catch {
        // no session, show login
      } finally {
        const splash = document.getElementById('splash');
        if (splash) {
          splash.classList.add('fade-out');
          setTimeout(() => splash.remove(), 300);
        }
        setTimeout(() => setIsInitializing(false), 350);
      }
    };

    initApp();
  }, [setSession, setSubscription]);

  if (isInitializing) return null;

  // Blocked by subscription — show modal on top of login
  if (subscriptionBlocked) {
    return (
      <>
        <Login />
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 max-w-md w-full mx-4 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cuenta pausada</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{subscriptionBlocked}</p>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Renueva desde el panel administrativo para reactivar tu cuenta.
            </p>
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
      </>
    );
  }

  if (!session) return <Login />;

  return (
    <ConnectionGuard>
      <div className="print:hidden">
        <POSLayout />
      </div>
      <div className="hidden print:block">
        <Receipt />
      </div>
    </ConnectionGuard>
  );
}

export default App;
