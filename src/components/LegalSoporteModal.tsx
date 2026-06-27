import React, { useState, useEffect } from 'react';
import { CloseX, ShieldCheck, FileText, HelpCircle, Mail, BookOpen } from './Icons';

type Tab = 'terminos' | 'privacidad' | 'datos' | 'licencia' | 'contacto' | 'soporte';

const TABS: { key: Tab; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { key: 'terminos', label: 'Términos', icon: FileText },
  { key: 'privacidad', label: 'Privacidad', icon: ShieldCheck },
  { key: 'datos', label: 'Datos', icon: BookOpen },
  { key: 'licencia', label: 'Licencia', icon: FileText },
  { key: 'contacto', label: 'Contacto', icon: Mail },
  { key: 'soporte', label: 'Soporte', icon: HelpCircle },
];

const CONTENT: Record<Tab, { titulo: string; parrafos: string[] }> = {
  terminos: {
    titulo: 'Términos de Servicio',
    parrafos: [
      'VENXPOS proporciona un sistema POS (punto de venta) como servicio. Al usar este software, usted acepta cumplir con estos términos.',
      'El usuario es responsable de la veracidad de los datos ingresados y del uso adecuado del sistema. No está permitido utilizar el software para actividades ilegales.',
      'Nos reservamos el derecho de suspender el acceso si se detecta uso indebido, manipulación fraudulenta o violación de las leyes aplicables.',
      'Estos términos pueden actualizarse periódicamente. El uso continuado del sistema implica la aceptación de las modificaciones.',
    ],
  },
  privacidad: {
    titulo: 'Política de Privacidad',
    parrafos: [
      'VENXPOS recopila únicamente los datos necesarios para el funcionamiento del sistema: información de la empresa, productos, ventas y usuarios autorizados.',
      'Los datos se almacenan de forma segura en servidores cloud con cifrado en tránsito y en reposo. No compartimos información personal con terceros sin consentimiento explícito.',
      'El usuario puede solicitar la exportación o eliminación de sus datos en cualquier momento contactando a soporte.',
      'Las contraseñas se almacenan con hash y no son accesibles en texto plano.',
    ],
  },
  datos: {
    titulo: 'Protección de Datos',
    parrafos: [
      'De conformidad con la Ley 1581 de 2012 (Colombia) y el Reglamento General de Protección de Datos (GDPR), garantizamos la protección de sus datos personales.',
      'Los datos de ventas, clientes e inventario son propiedad exclusiva del titular de la cuenta. VENXPOS actúa como encargado del tratamiento.',
      'Se implementan medidas de seguridad técnicas y organizativas para proteger la información contra acceso no autorizado, pérdida o destrucción.',
      'Para ejercer sus derechos de acceso, rectificación, cancelación u oposición, escriba a privacidad@venxpos.com.',
    ],
  },
  licencia: {
    titulo: 'Licencia de Uso',
    parrafos: [
      'Este software se concede bajo licencia por suscripción. El usuario adquiere el derecho de uso, no la propiedad del software.',
      'No está permitido modificar, distribuir, realizar ingeniería inversa ni comercializar el software sin autorización expresa.',
      'La licencia está vinculada a la empresa y sucursales registradas. El uso en múltiples empresas requiere planes adicionales.',
      'Al cancelar la suscripción, el usuario podrá exportar sus datos durante 30 días. Pasado este plazo, los datos serán eliminados de forma segura.',
    ],
  },
  contacto: {
    titulo: 'Contacto',
    parrafos: [
      'Correo electrónico: soporte@venxpos.com',
      'Teléfono: +57 (1) 234 5678',
      'Dirección: Cra 15 # 88-64, Bogotá, Colombia',
      'Horario de atención: Lunes a viernes de 8:00 a 18:00',
    ],
  },
  soporte: {
    titulo: 'Soporte Técnico',
    parrafos: [
      'Nuestra base de conocimiento está disponible 24/7 en help.venxpos.com.',
      'Para incidencias críticas, contacte a soporte@venxpos.com con el asunto "URGENTE" más una descripción detallada del problema.',
      'Los tickets de soporte se responden en un máximo de 4 horas hábiles.',
      'Incluya siempre el nombre de su empresa y sucursal al reportar un incidente para una atención más rápida.',
    ],
  },
};

export const LegalSoporteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<Tab>('terminos');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const current = CONTENT[tab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_150ms_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl max-h-[85vh] flex flex-col animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Legal y Soporte</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1"><CloseX size={18} /></button>
        </div>
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                  tab === t.key ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={14} />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">{current.titulo}</h3>
          <div className="space-y-4">
            {current.parrafos.map((p, i) => (
              <p key={i} className="text-sm text-gray-600 leading-relaxed">{p}</p>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-center">
          <button onClick={onClose} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
