-- Desactivar RLS temporalmente para el seeding
ALTER TABLE sucursales DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_fiscal DISABLE ROW LEVEL SECURITY;

-- Crear sucursal de prueba
INSERT INTO sucursales (nombre, nit, direccion, telefono, resolucion_dian) 
VALUES ('Sucursal Test', '900.123.456-7', 'Calle Falsa 123', '555-0192', '187620');

-- Crear categoría de prueba
INSERT INTO categorias (sucursal_id, nombre, activo)
SELECT id, 'Bebidas', true FROM sucursales WHERE nombre = 'Sucursal Test'
LIMIT 1;

-- Crear configuración fiscal
INSERT INTO configuracion_fiscal (sucursal_id, regimen_tributario, tarifa_iva_default)
SELECT id, 'comun', 0.19 FROM sucursales WHERE nombre = 'Sucursal Test'
LIMIT 1;

-- Reactivar RLS
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_fiscal ENABLE ROW LEVEL SECURITY;
