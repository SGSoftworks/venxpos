-- =============================================================================
-- VenxPos — Supabase Schema v6 (Online-First, SaaS-Ready)
-- Fuente única de verdad para el esquema de producción.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TABLAS
-- =============================================================================

-- 1a. Empresas (SaaS-ready)
CREATE TABLE empresas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre          TEXT NOT NULL,
    plan            TEXT NOT NULL DEFAULT 'basico',
    estado          TEXT NOT NULL DEFAULT 'activo',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1b. Sucursales
CREATE TABLE sucursales (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id      UUID REFERENCES empresas(id) ON DELETE SET NULL,
    nombre          TEXT NOT NULL,
    nit             TEXT NOT NULL,
    direccion       TEXT,
    telefono        TEXT,
    resolucion_dian TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1c. Categorías de producto
CREATE TABLE categorias (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id     UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    nombre          TEXT NOT NULL,
    parent_id       UUID REFERENCES categorias(id) ON DELETE SET NULL,
    activo          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1d. Productos (con tarifas de impuesto por ítem)
CREATE TABLE productos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id         UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    codigo_barras       TEXT NOT NULL,
    descripcion         TEXT NOT NULL,
    precio_venta        DECIMAL(12,2) NOT NULL CHECK (precio_venta >= 0),
    costo               DECIMAL(12,2) NOT NULL CHECK (costo >= 0),
    requiere_peso       BOOLEAN NOT NULL DEFAULT false,
    tarifa_iva          DECIMAL(5,3) NOT NULL DEFAULT 0.19 CHECK (tarifa_iva IN (0, 0.05, 0.19)),
    tarifa_impoconsumo  DECIMAL(5,3) NOT NULL DEFAULT 0 CHECK (tarifa_impoconsumo IN (0, 0.08)),
    activo              BOOLEAN NOT NULL DEFAULT true,
    categoria_id        UUID REFERENCES categorias(id) ON DELETE SET NULL,
    stock_minimo        DECIMAL(12,3) NOT NULL DEFAULT 10,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sucursal_id, codigo_barras)
);

-- 1e. Inventario por sucursal
CREATE TABLE inventario_sucursal (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id     UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    producto_id     UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    stock_actual    DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    version         INTEGER NOT NULL DEFAULT 1,
    last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sucursal_id, producto_id)
);

-- 1f. Usuarios (1 usuario = 1 sucursal)
CREATE TABLE usuarios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sucursal_id     UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    rol             TEXT NOT NULL CHECK (rol IN ('cajero', 'admin')),
    nombre          TEXT NOT NULL,
    pin_acceso      TEXT NOT NULL,
    estado          TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1g. Aperturas de caja
CREATE TABLE aperturas_caja (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id       UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    usuario_id        UUID NOT NULL REFERENCES usuarios(id),
    fondo_inicial     DECIMAL(12,2) NOT NULL CHECK (fondo_inicial >= 0),
    efectivo_esperado DECIMAL(12,2),
    fecha_apertura    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_cierre      TIMESTAMPTZ,
    estado            TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
    observaciones     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1h. Ventas
CREATE TABLE ventas (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id       UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    cajero_id         UUID NOT NULL REFERENCES usuarios(id),
    subtotal          DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    impuestos         DECIMAL(12,2) NOT NULL CHECK (impuestos >= 0),
    total             DECIMAL(12,2) NOT NULL CHECK (total >= 0),
    metodo_pago       TEXT NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA', 'BILLETERA', 'MIXTO')),
    monto_recibido    DECIMAL(12,2) NOT NULL CHECK (monto_recibido >= 0),
    cambio_entregado  DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (cambio_entregado >= 0),
    hash              TEXT,
    ticket_number     BIGINT,
    conflicto_stock   BOOLEAN NOT NULL DEFAULT false,
    fecha_hora        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sucursal_id, ticket_number)
);

-- 1i. Detalle de ventas
CREATE TABLE venta_detalles (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id                    UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id                 UUID NOT NULL REFERENCES productos(id),
    cantidad_o_peso             DECIMAL(12,3) NOT NULL CHECK (cantidad_o_peso > 0),
    precio_unitario             DECIMAL(12,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal                    DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    tarifa_iva_aplicada         DECIMAL(5,3) NOT NULL,
    tarifa_impoconsumo_aplicada DECIMAL(5,3) NOT NULL DEFAULT 0,
    descuento                   DECIMAL(12,2) NOT NULL DEFAULT 0,
    costo_aplicado              DECIMAL(12,2),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1j. Cierres de caja
CREATE TABLE cierres_caja (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id       UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    cajero_id         UUID NOT NULL REFERENCES usuarios(id),
    apertura_caja_id  UUID REFERENCES aperturas_caja(id) ON DELETE SET NULL,
    fecha_apertura    TIMESTAMPTZ NOT NULL,
    fecha_cierre      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_sistema     DECIMAL(12,2) NOT NULL CHECK (total_sistema >= 0),
    total_fisico      DECIMAL(12,2) NOT NULL CHECK (total_fisico >= 0),
    diferencia        DECIMAL(12,2) NOT NULL,
    observaciones     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1k. Conflictos de inventario
CREATE TABLE ventas_conflicto (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id          UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    tipo              TEXT NOT NULL CHECK (tipo IN ('stock_insuficiente', 'colision_concurrente')),
    producto_id       UUID NOT NULL REFERENCES productos(id),
    cantidad_solicitada DECIMAL(12,3) NOT NULL,
    stock_disponible    DECIMAL(12,3) NOT NULL,
    version_conflicto   INTEGER,
    detalle           TEXT,
    resuelto          BOOLEAN NOT NULL DEFAULT false,
    resuelto_por      UUID REFERENCES usuarios(id),
    resuelto_en       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1l. Auditoría de eventos
CREATE TABLE eventos_auditoria (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id     UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    usuario_id      UUID NOT NULL REFERENCES usuarios(id),
    tipo            TEXT NOT NULL CHECK (tipo IN (
                        'apertura_cajon', 'inicio_sesion', 'inicio_sesion_fallido',
                        'cierre_sesion', 'admin_override', 'reimpresion_ticket',
                        'cierre_z', 'cierre_caja',
                        'conflicto_resuelto', 'ajuste_inventario', 'apertura_caja'
                    )),
    descripcion     TEXT NOT NULL,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1m. Movimientos de inventario
CREATE TABLE movimientos_inventario (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id     UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    producto_id     UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    tipo            TEXT NOT NULL CHECK (tipo IN ('venta','ajuste','entrada_manual','salida_manual','devolucion','inventario_inicial')),
    cantidad        DECIMAL(12,3) NOT NULL,
    stock_resultante DECIMAL(12,3) NOT NULL,
    costo_unitario  DECIMAL(12,2),
    referencia_id   TEXT,
    referencia_tipo TEXT,
    usuario_id      UUID NOT NULL REFERENCES usuarios(id),
    observacion     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1n. Configuración fiscal
CREATE TABLE configuracion_fiscal (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id         UUID UNIQUE NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    regimen_tributario  TEXT NOT NULL DEFAULT 'comun' CHECK (regimen_tributario IN ('comun', 'simplificado')),
    tarifa_iva_default  DECIMAL(5,3) NOT NULL DEFAULT 0.19,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1o. Devoluciones
CREATE TABLE devoluciones (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id         UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    cajero_id           UUID NOT NULL REFERENCES usuarios(id),
    venta_original_id   UUID NOT NULL REFERENCES ventas(id),
    ticket_original     BIGINT,
    subtotal            DECIMAL(12,2) NOT NULL CHECK (subtotal <= 0),
    impuestos           DECIMAL(12,2) NOT NULL CHECK (impuestos <= 0),
    total               DECIMAL(12,2) NOT NULL CHECK (total <= 0),
    metodo_pago         TEXT NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA', 'BILLETERA', 'MIXTO')),
    fecha_hora          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    motivo              TEXT,
    hash                TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE devolucion_detalles (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    devolucion_id               UUID NOT NULL REFERENCES devoluciones(id) ON DELETE CASCADE,
    producto_id                 UUID NOT NULL REFERENCES productos(id),
    cantidad                    DECIMAL(12,3) NOT NULL CHECK (cantidad < 0),
    precio_unitario             DECIMAL(12,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal                    DECIMAL(12,2) NOT NULL CHECK (subtotal <= 0),
    tarifa_iva_aplicada         DECIMAL(5,3) NOT NULL,
    tarifa_impoconsumo_aplicada DECIMAL(5,3) NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 2. FUNCIONES
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_sucursal()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT sucursal_id FROM public.usuarios WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT rol = 'admin' FROM public.usuarios WHERE user_id = auth.uid() LIMIT 1;
$$;

-- =============================================================================
-- 3. ÍNDICES
-- =============================================================================

CREATE INDEX idx_productos_sucursal ON productos(sucursal_id);
CREATE INDEX idx_productos_barras  ON productos(sucursal_id, codigo_barras);
CREATE INDEX idx_inventario_sucursal ON inventario_sucursal(sucursal_id, producto_id);
CREATE INDEX idx_ventas_sucursal   ON ventas(sucursal_id);
CREATE INDEX idx_ventas_fecha      ON ventas(fecha_hora DESC);
CREATE INDEX idx_ventas_cajero     ON ventas(cajero_id);
CREATE INDEX idx_ventas_hash       ON ventas(hash);
CREATE INDEX idx_ventas_ticket_sucursal ON ventas(sucursal_id, ticket_number DESC);
CREATE INDEX idx_venta_detalles_venta ON venta_detalles(venta_id);
CREATE INDEX idx_cierres_sucursal  ON cierres_caja(sucursal_id);
CREATE INDEX idx_conflictos_venta  ON ventas_conflicto(venta_id);
CREATE INDEX idx_eventos_sucursal  ON eventos_auditoria(sucursal_id, created_at DESC);
CREATE INDEX idx_eventos_tipo      ON eventos_auditoria(tipo);
CREATE INDEX idx_categorias_sucursal ON categorias(sucursal_id);
CREATE INDEX idx_movimientos_inventario_lookup ON movimientos_inventario(sucursal_id, producto_id, created_at DESC);
CREATE INDEX idx_movimientos_inventario_tipo ON movimientos_inventario(sucursal_id, tipo, created_at DESC);
CREATE INDEX idx_aperturas_caja_sucursal ON aperturas_caja(sucursal_id, fecha_apertura DESC);
CREATE INDEX idx_config_fiscal_sucursal ON configuracion_fiscal(sucursal_id);
CREATE INDEX idx_devoluciones_sucursal ON devoluciones(sucursal_id, fecha_hora DESC);
CREATE INDEX idx_devoluciones_original ON devoluciones(venta_original_id);
CREATE INDEX idx_devolucion_detalles_dev ON devolucion_detalles(devolucion_id);

-- =============================================================================
-- 4. TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_sucursales BEFORE UPDATE ON sucursales FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_categorias BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_productos BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_usuarios BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_ventas BEFORE UPDATE ON ventas FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_cierres BEFORE UPDATE ON cierres_caja FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_aperturas BEFORE UPDATE ON aperturas_caja FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_config_fiscal BEFORE UPDATE ON configuracion_fiscal FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_devoluciones BEFORE UPDATE ON devoluciones FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================================
-- 5. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE sucursales           ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias           ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_sucursal  ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE aperturas_caja       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_detalles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cierres_caja         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_conflicto     ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_auditoria    ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_fiscal ENABLE ROW LEVEL SECURITY;
ALTER TABLE devoluciones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE devolucion_detalles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas             ENABLE ROW LEVEL SECURITY;

-- 5a. SELECT policies
CREATE POLICY "Leer sucursales" ON sucursales FOR SELECT USING (id = get_user_sucursal());
CREATE POLICY "Leer categorias" ON categorias FOR SELECT USING (sucursal_id = get_user_sucursal());
CREATE POLICY "Leer productos" ON productos FOR SELECT USING (sucursal_id = get_user_sucursal());
CREATE POLICY "Leer inventario" ON inventario_sucursal FOR SELECT USING (sucursal_id = get_user_sucursal());
CREATE POLICY "Leer usuarios" ON usuarios FOR SELECT USING (sucursal_id = get_user_sucursal());
CREATE POLICY "Leer aperturas" ON aperturas_caja FOR SELECT USING (sucursal_id = get_user_sucursal());
CREATE POLICY "Leer ventas" ON ventas FOR SELECT USING (sucursal_id = get_user_sucursal());
CREATE POLICY "Leer detalles venta" ON venta_detalles FOR SELECT USING (venta_id IN (SELECT id FROM ventas WHERE sucursal_id = get_user_sucursal()));
CREATE POLICY "Leer cierres" ON cierres_caja FOR SELECT USING (sucursal_id = get_user_sucursal());
CREATE POLICY "Leer conflictos" ON ventas_conflicto FOR SELECT USING (venta_id IN (SELECT id FROM ventas WHERE sucursal_id = get_user_sucursal()));
CREATE POLICY "Leer eventos" ON eventos_auditoria FOR SELECT USING (sucursal_id = get_user_sucursal());
CREATE POLICY "Leer movimientos" ON movimientos_inventario FOR SELECT USING (sucursal_id = get_user_sucursal());
CREATE POLICY "Leer config fiscal" ON configuracion_fiscal FOR SELECT USING (sucursal_id = get_user_sucursal());
CREATE POLICY "Leer devoluciones" ON devoluciones FOR SELECT USING (sucursal_id = get_user_sucursal());
CREATE POLICY "Leer detalles devolucion" ON devolucion_detalles FOR SELECT USING (devolucion_id IN (SELECT id FROM devoluciones WHERE sucursal_id = get_user_sucursal()));

-- 5b. INSERT policies
CREATE POLICY "Insertar ventas" ON ventas FOR INSERT WITH CHECK (sucursal_id = get_user_sucursal());
CREATE POLICY "Insertar detalles" ON venta_detalles FOR INSERT WITH CHECK (venta_id IN (SELECT id FROM ventas WHERE sucursal_id = get_user_sucursal()));
CREATE POLICY "Insertar cierres" ON cierres_caja FOR INSERT WITH CHECK (sucursal_id = get_user_sucursal());
CREATE POLICY "Insertar eventos" ON eventos_auditoria FOR INSERT WITH CHECK (sucursal_id = get_user_sucursal());
CREATE POLICY "Insertar movimientos" ON movimientos_inventario FOR INSERT WITH CHECK (sucursal_id = get_user_sucursal());
CREATE POLICY "Insertar aperturas" ON aperturas_caja FOR INSERT WITH CHECK (sucursal_id = get_user_sucursal());
CREATE POLICY "Insertar devoluciones" ON devoluciones FOR INSERT WITH CHECK (sucursal_id = get_user_sucursal());
CREATE POLICY "Insertar detalles devolucion" ON devolucion_detalles FOR INSERT WITH CHECK (devolucion_id IN (SELECT id FROM devoluciones WHERE sucursal_id = get_user_sucursal()));

-- 5c. ADMIN policies
CREATE POLICY "Admin gestiona productos" ON productos FOR ALL USING (sucursal_id = get_user_sucursal() AND is_admin());
CREATE POLICY "Admin gestiona inventario" ON inventario_sucursal FOR ALL USING (sucursal_id = get_user_sucursal() AND is_admin());
CREATE POLICY "Admin gestiona conflictos" ON ventas_conflicto FOR ALL USING (venta_id IN (SELECT id FROM ventas WHERE sucursal_id = get_user_sucursal()) AND is_admin());
CREATE POLICY "Admin gestiona usuarios" ON usuarios FOR ALL USING (sucursal_id = get_user_sucursal() AND is_admin());
CREATE POLICY "Admin gestiona categorias" ON categorias FOR ALL USING (sucursal_id = get_user_sucursal() AND is_admin());
CREATE POLICY "Admin gestiona aperturas" ON aperturas_caja FOR ALL USING (sucursal_id = get_user_sucursal() AND is_admin());
CREATE POLICY "Admin gestiona config fiscal" ON configuracion_fiscal FOR ALL USING (sucursal_id = get_user_sucursal() AND is_admin());

-- =============================================================================
-- 6. RPCs
-- =============================================================================

-- 6a. decrementar_inventario
CREATE OR REPLACE FUNCTION decrementar_inventario(
    p_sucursal_id UUID,
    p_producto_id UUID,
    p_cantidad DECIMAL(12,3),
    p_venta_id UUID DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_version INTEGER;
    v_current_stock DECIMAL(12,3);
    v_usuario_id UUID;
BEGIN
    SELECT version, stock_actual INTO v_current_version, v_current_stock
    FROM inventario_sucursal
    WHERE sucursal_id = p_sucursal_id AND producto_id = p_producto_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto % no encontrado en inventario de sucursal %', p_producto_id, p_sucursal_id;
    END IF;

    UPDATE inventario_sucursal
    SET stock_actual = v_current_stock - p_cantidad,
        version = v_current_version + 1,
        last_updated = NOW()
    WHERE sucursal_id = p_sucursal_id
      AND producto_id = p_producto_id
      AND version = v_current_version;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Colisión de concurrencia en producto % (version %)', p_producto_id, v_current_version;
    END IF;

    v_usuario_id := COALESCE(p_usuario_id, '00000000-0000-0000-0000-000000000000');

    INSERT INTO movimientos_inventario (id, sucursal_id, producto_id, tipo, cantidad, stock_resultante, referencia_id, referencia_tipo, usuario_id, created_at)
    VALUES (gen_random_uuid(), p_sucursal_id, p_producto_id, 'venta', -p_cantidad, v_current_stock - p_cantidad, p_venta_id, 'venta', v_usuario_id, NOW());
END;
$$;

-- 6b. incrementar_inventario
CREATE OR REPLACE FUNCTION incrementar_inventario(
    p_sucursal_id UUID,
    p_producto_id UUID,
    p_cantidad DECIMAL(12,3),
    p_devolucion_id UUID DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_version INTEGER;
    v_current_stock DECIMAL(12,3);
    v_usuario_id UUID;
BEGIN
    SELECT version, stock_actual INTO v_current_version, v_current_stock
    FROM inventario_sucursal
    WHERE sucursal_id = p_sucursal_id AND producto_id = p_producto_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto % no encontrado en inventario de sucursal %', p_producto_id, p_sucursal_id;
    END IF;

    UPDATE inventario_sucursal
    SET stock_actual = v_current_stock + p_cantidad,
        version = v_current_version + 1,
        last_updated = NOW()
    WHERE sucursal_id = p_sucursal_id
      AND producto_id = p_producto_id
      AND version = v_current_version;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Colision de concurrencia en producto % (version %)', p_producto_id, v_current_version;
    END IF;

    v_usuario_id := COALESCE(p_usuario_id, '00000000-0000-0000-0000-000000000000');

    INSERT INTO movimientos_inventario (id, sucursal_id, producto_id, tipo, cantidad, stock_resultante, referencia_id, referencia_tipo, usuario_id, created_at)
    VALUES (gen_random_uuid(), p_sucursal_id, p_producto_id, 'devolucion', p_cantidad, v_current_stock + p_cantidad, p_devolucion_id, 'devolucion', v_usuario_id, NOW());
END;
$$;

-- 6c. next_ticket_number
CREATE OR REPLACE FUNCTION next_ticket_number(p_sucursal_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next BIGINT;
BEGIN
    SELECT COALESCE(MAX(ticket_number), 0) + 1 INTO v_next
    FROM ventas WHERE sucursal_id = p_sucursal_id;

    RETURN v_next;
END;
$$;
