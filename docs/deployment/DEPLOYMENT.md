# Deployment — VenxPos

## Requisitos

- Node.js 20+
- Rust (para Tauri builds)
- Supabase project configurado con `supabase_schema.sql`

## Variables de Entorno

Crear `.env.local` en la raíz:

```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## Supabase Setup

1. Crear proyecto en https://supabase.com
2. Ejecutar `supabase_schema.sql` en el SQL Editor
3. Configurar Auth: habilitar Email/Password provider
4. Crear usuarios en `auth.users` + `usuarios` + `usuario_sucursal`

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:5173
npm run tauri dev    # Tauri desktop window
```

## Build Producción

```bash
npm run build        # tsc -b && vite build → dist/
npm run tauri build  # Tauri installer (.msi / .dmg / .AppImage)
```

## Estructura post-build

```
dist/
├── index.html
├── assets/
│   ├── index-*.js
│   └── index-*.css

src-tauri/target/release/
└── venxpos.exe      (Windows)
```
