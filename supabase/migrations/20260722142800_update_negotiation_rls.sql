-- Add UPDATE policies for visit_records, feedback_records, and negotiation_records
-- Allows SDRs and Admins to update records they own or manage

-- UPDATE policies for visit_records
DROP POLICY IF EXISTS "SDRs can update own visit_records" ON public.visit_records;
CREATE POLICY "SDRs can update own visit_records" ON public.visit_records 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = sdr_user_id)
    WITH CHECK (auth.uid() = sdr_user_id);

DROP POLICY IF EXISTS "Admins/Managers can update all visit_records" ON public.visit_records;
CREATE POLICY "Admins/Managers can update all visit_records" ON public.visit_records 
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor'))
    );

-- UPDATE policies for negotiation_records
DROP POLICY IF EXISTS "SDRs can update own negotiation_records" ON public.negotiation_records;
CREATE POLICY "SDRs can update own negotiation_records" ON public.negotiation_records 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = negotiated_by_user_id)
    WITH CHECK (auth.uid() = negotiated_by_user_id);

DROP POLICY IF EXISTS "Admins/Managers can update all negotiation_records" ON public.negotiation_records;
CREATE POLICY "Admins/Managers can update all negotiation_records" ON public.negotiation_records 
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor'))
    );

-- UPDATE policies for feedback_records
DROP POLICY IF EXISTS "SDRs can update own feedback_records" ON public.feedback_records;
CREATE POLICY "SDRs can update own feedback_records" ON public.feedback_records 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = sdr_user_id)
    WITH CHECK (auth.uid() = sdr_user_id);

DROP POLICY IF EXISTS "Admins/Managers can update all feedback_records" ON public.feedback_records;
CREATE POLICY "Admins/Managers can update all feedback_records" ON public.feedback_records 
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor'))
    );
