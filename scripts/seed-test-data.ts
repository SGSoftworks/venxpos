import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Cargar variables de .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://beacnoxukkoellhecofm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY no está configurada');
  console.error('   Asegúrate de que .env.local existe con las credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTestData() {
  console.log('🌱 Iniciando seeding de datos de prueba...\n');

  try {
    // 1. Crear sucursal de prueba
    console.log('📍 Creando sucursal de prueba...');
    const { data: sucursal, error: sucursalError } = await supabase
      .from('sucursales')
      .insert({
        nombre: 'Sucursal Test',
        nit: '900.123.456-7',
        direccion: 'Calle Falsa 123',
        telefono: '555-0192',
        resolucion_dian: '187620',
      })
      .select()
      .single();

    if (sucursalError) {
      console.error('❌ Error creando sucursal:', sucursalError);
      return;
    }

    console.log('✅ Sucursal creada:', sucursal.nombre, `(ID: ${sucursal.id})\n`);

    // 2. Crear usuario de administrador en Auth
    console.log('👤 Creando usuario administrador en Auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@venxpos.test',
      password: 'Admin@123456',
      email_confirm: true,
    });

    if (authError) {
      console.error('❌ Error creando usuario en Auth:', authError);
      return;
    }

    console.log('✅ Usuario Auth creado:', authUser.user?.email, `(ID: ${authUser.user?.id})\n`);

    // 3. Vincular usuario con sucursal en tabla usuarios
    console.log('🔗 Vinculando usuario con sucursal...');
    const { error: usuarioError } = await supabase
      .from('usuarios')
      .insert({
        user_id: authUser.user?.id,
        sucursal_id: sucursal.id,
        rol: 'admin',
        nombre: 'Administrador Test',
        pin_acceso: '1234',
        estado: 'activo',
      })
      .select()
      .single();

    if (usuarioError) {
      console.error('❌ Error vinculando usuario:', usuarioError);
      return;
    }

    console.log('✅ Usuario vinculado exitosamente\n');

    // 4. Crear configuración fiscal para la sucursal
    console.log('💰 Creando configuración fiscal...');
    const { error: configError } = await supabase
      .from('configuracion_fiscal')
      .insert({
        sucursal_id: sucursal.id,
        regimen_tributario: 'comun',
        tarifa_iva_default: 0.19,
      })
      .select()
      .single();

    if (configError) {
      console.error('❌ Error creando configuración fiscal:', configError);
      return;
    }

    console.log('✅ Configuración fiscal creada\n');

    // Resumen
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE\n');
    console.log('📍 SUCURSAL:');
    console.log(`   Nombre: ${sucursal.nombre}`);
    console.log(`   NIT: ${sucursal.nit}`);
    console.log(`   ID: ${sucursal.id}\n`);
    console.log('👤 ADMINISTRADOR:');
    console.log(`   Email: admin@venxpos.test`);
    console.log(`   Contraseña: Admin@123456`);
    console.log(`   PIN: 1234`);
    console.log(`   Rol: admin`);
    console.log(`   User ID: ${authUser.user?.id}\n`);
    console.log('═══════════════════════════════════════════════════════');
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

seedTestData();
