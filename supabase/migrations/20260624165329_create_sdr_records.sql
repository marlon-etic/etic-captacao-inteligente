-- Create visit_records
CREATE TABLE IF NOT EXISTS public.visit_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_link_id UUID NOT NULL REFERENCES public.imovel_demand_match(id) ON DELETE CASCADE,
    sdr_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ NOT NULL,
    notes TEXT
);

-- Unique index for same day visits by SDR on same property_link_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_visit_records_unique_daily 
ON public.visit_records (property_link_id, sdr_user_id, (visited_at::date));

-- Create feedback_records
CREATE TABLE IF NOT EXISTS public.feedback_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_link_id UUID NOT NULL REFERENCES public.imovel_demand_match(id) ON DELETE CASCADE,
    sdr_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interest_level TEXT NOT NULL CHECK (interest_level IN ('interested', 'not_interested')),
    feedback_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create negotiation_records
CREATE TABLE IF NOT EXISTS public.negotiation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_link_id UUID NOT NULL REFERENCES public.imovel_demand_match(id) ON DELETE CASCADE,
    negotiated_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    negotiation_status TEXT NOT NULL CHECK (negotiation_status IN ('negotiated', 'failed')),
    negotiation_date DATE NOT NULL,
    notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_visit_records_property_link_id ON public.visit_records(property_link_id);
CREATE INDEX IF NOT EXISTS idx_visit_records_sdr_user_id ON public.visit_records(sdr_user_id);

CREATE INDEX IF NOT EXISTS idx_feedback_records_property_link_id ON public.feedback_records(property_link_id);
CREATE INDEX IF NOT EXISTS idx_feedback_records_sdr_user_id ON public.feedback_records(sdr_user_id);

CREATE INDEX IF NOT EXISTS idx_negotiation_records_property_link_id ON public.negotiation_records(property_link_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_records_user_id ON public.negotiation_records(negotiated_by_user_id);

-- Enable RLS
ALTER TABLE public.visit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_records ENABLE ROW LEVEL SECURITY;

-- Policies for visit_records
DROP POLICY IF EXISTS "SDRs can insert own visit_records" ON public.visit_records;
CREATE POLICY "SDRs can insert own visit_records" ON public.visit_records 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = sdr_user_id);

DROP POLICY IF EXISTS "SDRs can select own visit_records" ON public.visit_records;
CREATE POLICY "SDRs can select own visit_records" ON public.visit_records 
    FOR SELECT TO authenticated 
    USING (auth.uid() = sdr_user_id);

DROP POLICY IF EXISTS "Captadores can select visit_records for their properties" ON public.visit_records;
CREATE POLICY "Captadores can select visit_records for their properties" ON public.visit_records 
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.imovel_demand_match idm
            JOIN public.imoveis_captados ic ON idm.imovel_id = ic.id
            WHERE idm.id = visit_records.property_link_id AND ic.user_captador_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins/Managers can select all visit_records" ON public.visit_records;
CREATE POLICY "Admins/Managers can select all visit_records" ON public.visit_records 
    FOR SELECT TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor'))
    );


-- Policies for feedback_records
DROP POLICY IF EXISTS "SDRs can insert own feedback_records" ON public.feedback_records;
CREATE POLICY "SDRs can insert own feedback_records" ON public.feedback_records 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = sdr_user_id);

DROP POLICY IF EXISTS "SDRs can select own feedback_records" ON public.feedback_records;
CREATE POLICY "SDRs can select own feedback_records" ON public.feedback_records 
    FOR SELECT TO authenticated 
    USING (auth.uid() = sdr_user_id);

DROP POLICY IF EXISTS "Captadores can select feedback_records for their properties" ON public.feedback_records;
CREATE POLICY "Captadores can select feedback_records for their properties" ON public.feedback_records 
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.imovel_demand_match idm
            JOIN public.imoveis_captados ic ON idm.imovel_id = ic.id
            WHERE idm.id = feedback_records.property_link_id AND ic.user_captador_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins/Managers can select all feedback_records" ON public.feedback_records;
CREATE POLICY "Admins/Managers can select all feedback_records" ON public.feedback_records 
    FOR SELECT TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor'))
    );


-- Policies for negotiation_records
DROP POLICY IF EXISTS "SDRs can insert own negotiation_records" ON public.negotiation_records;
CREATE POLICY "SDRs can insert own negotiation_records" ON public.negotiation_records 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = negotiated_by_user_id);

DROP POLICY IF EXISTS "SDRs can select own negotiation_records" ON public.negotiation_records;
CREATE POLICY "SDRs can select own negotiation_records" ON public.negotiation_records 
    FOR SELECT TO authenticated 
    USING (auth.uid() = negotiated_by_user_id);

DROP POLICY IF EXISTS "Captadores can select negotiation_records for their properties" ON public.negotiation_records;
CREATE POLICY "Captadores can select negotiation_records for their properties" ON public.negotiation_records 
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.imovel_demand_match idm
            JOIN public.imoveis_captados ic ON idm.imovel_id = ic.id
            WHERE idm.id = negotiation_records.property_link_id AND ic.user_captador_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins/Managers can select all negotiation_records" ON public.negotiation_records;
CREATE POLICY "Admins/Managers can select all negotiation_records" ON public.negotiation_records 
    FOR SELECT TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role::text IN ('admin', 'gestor'))
    );
