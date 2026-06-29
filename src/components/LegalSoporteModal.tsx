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

const SAAS_URL = 'https://venxpos.vercel.app';
const WHATSAPP = '+57 322 8372341';
const EMAIL = 'juan.dev1809@gmail.com';
const HORARIO = 'Lunes a viernes de 7:00 AM a 7:00 PM';
const EMPRESA = 'JGSoftworks';

const CONTENT: Record<Tab, { titulo: string; parrafos: string[] }> = {
  terminos: {
    titulo: 'Términos de Servicio',
    parrafos: [
      `${EMPRESA} (VenxPOS) proporciona un sistema POS (punto de venta) como servicio SaaS. Al usar este software usted acepta estos términos.`,
      'El usuario es responsable de la veracidad de los datos ingresados y del uso adecuado del sistema. No está permitido utilizar el software para actividades ilegales o fraudulentas.',
      'La suscripción es mensual con renovación automática. El cargo se realiza a través de Wompi (pasarela de pagos) y puede cancelarse en cualquier momento desde el panel de administración.',
      'Nos reservamos el derecho de suspender el acceso si se detecta uso indebido, manipulación del sistema, intento de vulnerar la seguridad o impago de la suscripción.',
      'Estos términos pueden actualizarse periódicamente. El uso continuado del sistema implica la aceptación de las modificaciones publicadas en el sitio web.',
    ],
  },
  privacidad: {
    titulo: 'Política de Privacidad',
    parrafos: [
      'VenxPOS recopila únicamente los datos necesarios para el funcionamiento del sistema: información de la empresa (nombre, NIT, teléfono), productos, ventas, transacciones y usuarios autorizados.',
      'Los datos se almacenan de forma segura en servidores cloud de Supabase con cifrado en tránsito (TLS) y en reposo. No compartimos información personal con terceros sin su consentimiento explícito.',
      'Los pagos se procesan a través de Wompi. VenxPOS no almacena números de tarjeta de crédito, códigos de seguridad ni datos bancarios sensibles.',
      'El usuario puede solicitar la exportación o eliminación completa de sus datos en cualquier momento contactando a soporte. Los datos se eliminan definitivamente 30 días después de la cancelación.',
      'Las contraseñas se almacenan con hash bcrypt y no son accesibles en texto plano por ningún miembro del equipo.',
    ],
  },
  datos: {
    titulo: 'Protección de Datos',
    parrafos: [
      'De conformidad con la Ley 1581 de 2012 (Colombia) y el Reglamento General de Protección de Datos (GDPR), garantizamos la protección de sus datos personales.',
      'Los datos de ventas, clientes e inventario son propiedad exclusiva del titular de la cuenta. VenxPOS actúa como encargado del tratamiento.',
      'Se implementan medidas de seguridad técnicas y organizativas para proteger la información contra acceso no autorizado, pérdida, alteración o destrucción accidental.',
      'Para ejercer sus derechos de acceso, rectificación, cancelación, oposición o portabilidad, escríbanos al correo electrónico con el asunto "DERECHOS DATOS".',
    ],
  },
  licencia: {
    titulo: 'Licencia de Uso',
    parrafos: [
      'Este software se concede bajo licencia por suscripción mensual. El usuario adquiere el derecho de uso, no la propiedad del software.',
      'No está permitido modificar, distribuir, realizar ingeniería inversa, subarrendar ni comercializar el software sin autorización expresa por escrito de JGSoftworks.',
      'La licencia está vinculada a la empresa titular de la cuenta y a las sucursales registradas según el plan contratado.',
      'Al cancelar la suscripción, el usuario dispone de 30 días para exportar sus datos. Pasado este plazo, los datos se eliminan de forma segura e irreversible.',
      'El uso del software no implica cesión de derechos de propiedad intelectual sobre el código fuente, marcas o nombres comerciales asociados.',
    ],
  },
  contacto: {
    titulo: 'Contacto',
    parrafos: [
      `Correo electrónico: ${EMAIL}`,
      `WhatsApp: ${WHATSAPP}`,
      `Sitio web: ${SAAS_URL}`,
      `Horario de atención: ${HORARIO}`,
    ],
  },
  soporte: {
    titulo: 'Soporte Técnico',
    parrafos: [
      `Escríbenos por WhatsApp al ${WHATSAPP} para atención rápida de incidencias.`,
      `También puedes enviar un correo a ${EMAIL} con una descripción detallada del problema.`,
      'Los tickets de soporte se responden en un máximo de 4 horas hábiles en horario de atención.',
      `Incluye siempre el nombre de tu empresa y sucursal al reportar un incidente.`,
      `Visita ${SAAS_URL} para gestionar tu suscripción, facturación y datos de la cuenta.`,
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
