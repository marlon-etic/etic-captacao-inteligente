-- Migration: Add manual_property_reference column to negotiation_records
ALTER TABLE IF EXISTS public.negotiation_records
  ADD COLUMN IF NOT EXISTS manual_property_reference TEXT;

-- Ensure RLS policies allow authenticated users to use the new column
DROP POLICY IF EXISTS "authenticated_insert_negotiation_records" ON public.negotiation_records;
CREATE POLICY "authenticated_insert_negotiation_records" ON public.negotiation_records
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_negotiation_records" ON public.negotiation_records;
CREATE POLICY "authenticated_select_negotiation_records" ON public.negotiation_records
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_update_negotiation_records" ON public.negotiation_records;
CREATE POLICY "authenticated_update_negotiation_records" ON public.negotiation_records
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
