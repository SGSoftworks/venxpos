-- Script para completar el setup de prueba
-- Este script crea un registro de usuario vinculado a la sucursal Test

-- 1. Obtener el ID de la sucursal Test
-- SELECT id FROM sucursales WHERE nombre = 'Sucursal Test';

-- 2. Crear un registro de usuario (nota: el user_id debe corresponder a un usuario de Auth)
-- Para pruebas, vamos a usar un UUID placeholder
INSERT INTO usuarios (user_id, sucursal_id, rol, nombre, pin_acceso, estado)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000'::uuid as user_id,  -- UUID placeholder
  id,
  'admin',
  'Administrador Test',
  '1234',
  'activo'
FROM sucursales 
WHERE nombre = 'Sucursal Test'
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- 3. Verificar que fue creado
SELECT * FROM usuarios WHERE rol = 'admin' AND nombre = 'Administrador Test';
