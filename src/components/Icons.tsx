import React from 'react';

const iconProps = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24' as const, fill: 'none' as const, stroke: 'currentColor' as const, strokeWidth: 2 as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

interface IconProps { size?: number; className?: string }

export const CloseX: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg {...iconProps(size)} className={className}><path d="M18 6L6 18M6 6l12 12" /></svg>
);

export const Check: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}><path d="M20 6L9 17l-5-5" /></svg>
);

export const CircleCheck: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" /><path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Box: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
  </svg>
);

export const Cart: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
  </svg>
);

export const Chart: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </svg>
);

export const CreditCard: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
  </svg>
);

export const ShoppingBag: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

export const Lock: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

export const Clipboard: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <rect x="9" y="2" width="6" height="4" rx="1" /><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
  </svg>
);

export const Banknote: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" />
  </svg>
);

export const ShieldCheck: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
  </svg>
);

export const AlertTriangle: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4M12 17h.01" />
  </svg>
);

export const TrendingDown: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M23 18l-9.5-9.5-5 5L1 6" /><path d="M17 18h6v-6" />
  </svg>
);

export const Gear: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

export const HelpCircle: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
  </svg>
);

export const Keyboard: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h2M10 10h4M16 10h2M6 14h.01M18 14h.01M10 14h4" />
  </svg>
);

export const Printer: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
  </svg>
);

export const ArrowReturn: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M3 7v6h6" /><path d="M21 17a9 9 0 00-9-9H3l7-7" />
  </svg>
);

export const CircleX: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Plus: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}><path d="M12 5v14M5 12h14" /></svg>
);

export const History: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
);

export const FileText: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

export const Package: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
  </svg>
);

export const BookOpen: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
  </svg>
);

export const Mail: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...iconProps(size)} className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" />
  </svg>
);
