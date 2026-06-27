-- =============================================================================
-- VenxPOS SaaS Integration — RPC get_subscription_info()
-- Fecha: 2026-06-19
-- El POS consulta esta RPC para obtener info de suscripción sin conocer
-- la estructura interna de tenants/plans/payments.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_subscription_info()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_sucursal_id uuid;
  v_nombre_sucursal text;
  v_tenant_id uuid;
  v_plan_nombre text;
  v_sub_estado text;
  v_proximo_cobro timestamptz;
  v_plan_max_sucursales integer;
BEGIN
  -- 1. Obtener sucursal del usuario autenticado
  SELECT sucursal_id INTO v_sucursal_id
  FROM public.usuarios
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_sucursal_id IS NULL THEN
    RETURN jsonb_build_object(
      'sucursal_nombre', 'Desconocida',
      'plan', 'basico',
      'subscription_status', 'active',
      'proximo_cobro', null,
      'max_sucursales', 1
    );
  END IF;

  -- 2. Obtener nombre de sucursal
  SELECT nombre INTO v_nombre_sucursal
  FROM public.sucursales
  WHERE id = v_sucursal_id;

  -- 3. Subir a empresa → tenant
  SELECT e.tenant_id INTO v_tenant_id
  FROM public.empresas e
  JOIN public.sucursales s ON s.empresa_id = e.id
  WHERE s.id = v_sucursal_id;

  -- 4. Si hay tenant SaaS, consultar plan y suscripción
  IF v_tenant_id IS NOT NULL THEN
    SELECT p.nombre, s.estado, s.proximo_cobro, p.max_sucursales
    INTO v_plan_nombre, v_sub_estado, v_proximo_cobro, v_plan_max_sucursales
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.tenant_id = v_tenant_id
      AND s.estado != 'cancelled'
    ORDER BY s.fecha_inicio DESC
    LIMIT 1;
  END IF;

  -- 5. Fallback para cuentas legacy (sin tenant)
  RETURN jsonb_build_object(
    'sucursal_nombre', COALESCE(v_nombre_sucursal, 'Sucursal'),
    'plan', COALESCE(v_plan_nombre, 'basico'),
    'subscription_status', COALESCE(v_sub_estado, 'active'),
    'proximo_cobro', v_proximo_cobro,
    'max_sucursales', COALESCE(v_plan_max_sucursales, 1)
  );
END;
$$;

-- =============================================================================
-- Backfill: vincular usuarios existentes a sus tenants via branch_accounts
-- Solo para usuarios que tengan empresa con tenant_id asignado
-- =============================================================================

INSERT INTO public.branch_accounts (tenant_id, sucursal_id, user_id, nombre_sucursal, email, activo)
SELECT
  e.tenant_id,
  u.sucursal_id,
  u.user_id,
  s.nombre,
  (SELECT raw_user_meta_data->>'email' FROM auth.users WHERE id = u.user_id)::text,
  true
FROM public.usuarios u
JOIN public.sucursales s ON s.id = u.sucursal_id
JOIN public.empresas e ON e.id = s.empresa_id
WHERE e.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.branch_accounts ba
    WHERE ba.user_id = u.user_id AND ba.tenant_id = e.tenant_id
  );
