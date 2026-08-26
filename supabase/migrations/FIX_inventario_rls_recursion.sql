-- ============================================================
-- EMERGENCY FIX: Infinite recursion in inventario_sucursal RLS
-- Copiar y pegar en Supabase SQL Editor → Run
-- ============================================================

-- 1. Dropear la policy rota (self-join recursivo)
DROP POLICY IF EXISTS "Solo admin modifica inventario" ON public.inventario_sucursal;

-- 2. Verificar policies resultantes
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'inventario_sucursal'
ORDER BY policyname;
