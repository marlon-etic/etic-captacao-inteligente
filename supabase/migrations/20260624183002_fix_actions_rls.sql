-- visit_records
DROP POLICY IF EXISTS "authenticated_insert_visit_records" ON public.visit_records;
CREATE POLICY "authenticated_insert_visit_records" ON public.visit_records
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_visit_records" ON public.visit_records;
CREATE POLICY "authenticated_select_visit_records" ON public.visit_records
  FOR SELECT TO authenticated USING (true);

-- feedback_records
DROP POLICY IF EXISTS "authenticated_insert_feedback_records" ON public.feedback_records;
CREATE POLICY "authenticated_insert_feedback_records" ON public.feedback_records
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_feedback_records" ON public.feedback_records;
CREATE POLICY "authenticated_select_feedback_records" ON public.feedback_records
  FOR SELECT TO authenticated USING (true);

-- negotiation_records
DROP POLICY IF EXISTS "authenticated_insert_negotiation_records" ON public.negotiation_records;
CREATE POLICY "authenticated_insert_negotiation_records" ON public.negotiation_records
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_negotiation_records" ON public.negotiation_records;
CREATE POLICY "authenticated_select_negotiation_records" ON public.negotiation_records
  FOR SELECT TO authenticated USING (true);
