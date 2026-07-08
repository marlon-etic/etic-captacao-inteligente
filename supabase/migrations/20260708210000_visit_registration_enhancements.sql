-- Add UPDATE policies for visit_records (allow SDRs to update their own visits)
DROP POLICY IF EXISTS "SDRs can update own visit_records" ON public.visit_records;
CREATE POLICY "SDRs can update own visit_records" ON public.visit_records 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = sdr_user_id);

-- Add UPDATE policy for visitas_imovel
DROP POLICY IF EXISTS "Users can update own visitas" ON public.visitas_imovel;
CREATE POLICY "Users can update own visitas" ON public.visitas_imovel 
    FOR UPDATE USING (user_sdr_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gestor')));

-- Add DELETE policy for visit_records (allow SDRs to delete their own visits)
DROP POLICY IF EXISTS "SDRs can delete own visit_records" ON public.visit_records;
CREATE POLICY "SDRs can delete own visit_records" ON public.visit_records 
    FOR DELETE TO authenticated 
    USING (auth.uid() = sdr_user_id);

-- Add DELETE policy for visitas_imovel
DROP POLICY IF EXISTS "Users can delete own visitas" ON public.visitas_imovel;
CREATE POLICY "Users can delete own visitas" ON public.visitas_imovel 
    FOR DELETE USING (user_sdr_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gestor')));

-- Add UPDATE policy for feedback_records
DROP POLICY IF EXISTS "SDRs can update own feedback_records" ON public.feedback_records;
CREATE POLICY "SDRs can update own feedback_records" ON public.feedback_records
    FOR UPDATE TO authenticated
    USING (auth.uid() = sdr_user_id);

-- Add UPDATE policy for negotiation_records
DROP POLICY IF EXISTS "SDRs can update own negotiation_records" ON public.negotiation_records;
CREATE POLICY "SDRs can update own negotiation_records" ON public.negotiation_records
    FOR UPDATE TO authenticated
    USING (auth.uid() = negotiated_by_user_id);
