-- Migration: Normalize existing respostas_captador data before re-adding standardized constraint
-- The previous migration 20260708183700 failed because existing rows violated the new check constraint.
-- This migration normalizes all 'perdido' rows so their motivo is one of the 9 standardized values,
-- then re-attempts adding the constraint idempotently.

-- 1. Ensure resposta column allows 'perdido' (drop any remaining check on resposta column)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.respostas_captador'::regclass
      AND contype = 'c'
      AND conkey @> ARRAY[(
        SELECT attnum FROM pg_attribute
        WHERE attrelid = 'public.respostas_captador'::regclass
          AND attname = 'resposta'
      )]
  ) LOOP
    EXECUTE 'ALTER TABLE public.respostas_captador DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- 2. Normalize existing rows where resposta = 'perdido' and motivo is not one of the 9 standardized values
--    Map known legacy values to their standardized equivalents; set everything else to 'Outros'.
UPDATE public.respostas_captador
SET motivo = CASE
    WHEN motivo ILIKE '%valor%' AND (motivo ILIKE '%aluguel%' OR motivo ILIKE '%locacao%') THEN
      'Sem imóveis no perfil - Valor (Aluguel)'
    WHEN motivo ILIKE '%localiza%' AND (motivo ILIKE '%aluguel%' OR motivo ILIKE '%locacao%') THEN
      'Sem imóveis no perfil - Localização (Aluguel)'
    WHEN motivo ILIKE '%perfil%inexistente%' AND (motivo ILIKE '%aluguel%' OR motivo ILIKE '%locacao%') THEN
      'Imóvel de perfil inexistente (Aluguel)'
    WHEN motivo ILIKE '%valor%' AND motivo ILIKE '%venda%' THEN
      'Sem imóveis no perfil - Valor (Venda)'
    WHEN motivo ILIKE '%localiza%' AND motivo ILIKE '%venda%' THEN
      'Sem imóveis no perfil - Localização (Venda)'
    WHEN motivo ILIKE '%perfil%inexistente%' AND motivo ILIKE '%venda%' THEN
      'Imóvel de perfil inexistente (Venda)'
    WHEN motivo ILIKE '%2.000%' OR motivo ILIKE '%2000%' THEN
      'Abaixo valor mínimo R$ 2.000,00'
    WHEN motivo ILIKE '%250.000%' OR motivo ILIKE '%250000%' THEN
      'Abaixo valor mínimo R$ 250.000,00'
    ELSE
      'Outros'
  END
WHERE resposta = 'perdido'
  AND (
    motivo IS NULL
    OR TRIM(motivo) = ''
    OR motivo NOT IN (
      'Sem imóveis no perfil - Valor (Aluguel)',
      'Sem imóveis no perfil - Localização (Aluguel)',
      'Imóvel de perfil inexistente (Aluguel)',
      'Sem imóveis no perfil - Valor (Venda)',
      'Sem imóveis no perfil - Localização (Venda)',
      'Imóvel de perfil inexistente (Venda)',
      'Abaixo valor mínimo R$ 2.000,00',
      'Abaixo valor mínimo R$ 250.000,00',
      'Outros'
    )
  );

-- 3. Re-add the standardized check constraint (idempotent)
ALTER TABLE public.respostas_captador DROP CONSTRAINT IF EXISTS check_perdido_motivo_standardized;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_perdido_motivo_standardized'
      AND conrelid = 'public.respostas_captador'::regclass
  ) THEN
    ALTER TABLE public.respostas_captador ADD CONSTRAINT check_perdido_motivo_standardized
    CHECK (
      resposta != 'perdido' OR motivo IN (
        'Sem imóveis no perfil - Valor (Aluguel)',
        'Sem imóveis no perfil - Localização (Aluguel)',
        'Imóvel de perfil inexistente (Aluguel)',
        'Sem imóveis no perfil - Valor (Venda)',
        'Sem imóveis no perfil - Localização (Venda)',
        'Imóvel de perfil inexistente (Venda)',
        'Abaixo valor mínimo R$ 2.000,00',
        'Abaixo valor mínimo R$ 250.000,00',
        'Outros'
      )
    );
  END IF;
END $$;

-- 4. Re-ensure RLS policies for respostas_captador (idempotent, matching the failed migration's intent)
DROP POLICY IF EXISTS "Captadores insert respostas" ON public.respostas_captador;
CREATE POLICY "Captadores insert respostas" ON public.respostas_captador
  FOR INSERT TO authenticated
  WITH CHECK (captador_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated read respostas" ON public.respostas_captador;
CREATE POLICY "Authenticated read respostas" ON public.respostas_captador
  FOR SELECT TO authenticated
  USING (true);
