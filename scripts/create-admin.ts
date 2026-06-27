import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
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

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciales de Supabase no encontradas en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  try {
    console.log('👤 Creando usuario administrador...');
    
    // Usar email único con timestamp para evitar rate limit
    const timestamp = Date.now();
    const email = `admin+${timestamp}@example.com`;
    
    // Sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: 'Admin@123456',
      options: {
        emailRedirectTo: 'http://localhost:5173',
      }
    });

    if (signUpError) {
      console.error('❌ Error creando usuario:', signUpError);
      return;
    }

    const userId = signUpData.user?.id;
    console.log('✅ Usuario creado en Auth:', userId);
    console.log(`   Email: ${email}`);
    console.log('   Password: Admin@123456\n');

    // Get the sucursal ID
    console.log('📍 Obteniendo ID de sucursal...');
    const { data: sucursales, error: sucError } = await supabase
      .from('sucursales')
      .select('id')
      .eq('nombre', 'Sucursal Test')
      .single();

    if (sucError || !sucursales) {
      console.error('❌ No se encontró la sucursal:', sucError);
      return;
    }

    const sucursalId = sucursales.id;
    console.log('✅ Sucursal encontrada:', sucursalId, '\n');

    // Create usuario record (without RLS temporarily)
    console.log('🔗 Vinculando usuario con sucursal...');
    const { error: usuarioError } = await supabase
      .from('usuarios')
      .insert({
        user_id: userId,
        sucursal_id: sucursalId,
        rol: 'admin',
        nombre: 'Administrador Test',
        pin_acceso: '1234',
        estado: 'activo',
      })
      .select()
      .single();

    if (usuarioError) {
      console.error('❌ Error vinculando usuario:', usuarioError);
      // Si falla por RLS, continuamos
      console.log('   (Continuando...)\n');
    } else {
      console.log('✅ Usuario vinculado exitosamente\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE\n');
    console.log('📍 SUCURSAL:');
    console.log(`   Nombre: Sucursal Test`);
    console.log(`   NIT: 900.123.456-7`);
    console.log(`   ID: ${sucursalId}\n`);
    console.log('👤 ADMINISTRADOR:');
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: Admin@123456`);
    console.log(`   PIN: 1234`);
    console.log(`   Rol: admin`);
    console.log(`   User ID: ${userId}\n`);
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

createAdminUser();
