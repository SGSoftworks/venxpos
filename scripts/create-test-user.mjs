// Crea un usuario + sucursal de prueba en Supabase
// Uso: node scripts/create-test-user.mjs TU_SERVICE_ROLE_KEY
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://beacnoxukkoellhecofm.supabase.co";
const serviceKey = process.argv[2];

if (!serviceKey) {
  console.error("Uso: node scripts/create-test-user.mjs <SERVICE_ROLE_KEY>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Crear sucursal
  const { data: suc, error: errSuc } = await supabase
    .from("sucursales")
    .insert({
      nombre: "Sucursal Prueba 2",
      nit: "901234567-2",
      direccion: "Calle 100 #50-25, Bogotá",
      telefono: "6014445566",
    })
    .select("id")
    .single();

  if (errSuc) {
    console.error("Error creando sucursal:", errSuc.message);
    process.exit(1);
  }

  console.log("Sucursal creada:", suc.id);

  // 2. Crear usuario en auth.users
  const { data: authUser, error: errAuth } =
    await supabase.auth.admin.createUser({
      email: "cajero2@venxpos.com",
      password: "VenxPos2026!",
      email_confirm: true,
      user_metadata: { nombre: "María García" },
    });

  if (errAuth) {
    console.error("Error creando auth user:", errAuth.message);
    process.exit(1);
  }

  console.log("Auth user creado:", authUser.user.id);

  // 3. Insertar perfil en usuarios
  const { data: perfil, error: errPerfil } = await supabase
    .from("usuarios")
    .insert({
      user_id: authUser.user.id,
      sucursal_id: suc.id,
      rol: "cajero",
      nombre: "María García",
      pin_acceso: "1234",
      estado: "activo",
    })
    .select("id")
    .single();

  if (errPerfil) {
    console.error("Error creando perfil:", errPerfil.message);
    process.exit(1);
  }

  console.log("Perfil creado:", perfil.id);
  console.log("\n✅ Listo. Credenciales:");
  console.log("   Email: cajero2@venxpos.com");
  console.log("   Password: VenxPos2026!");
  console.log("   Sucursal:", suc.id);
  console.log("   Rol: cajero");
}

main().catch(console.error);
