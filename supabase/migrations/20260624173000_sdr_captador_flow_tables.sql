-- Migration: Add SDR-Captador flow tracking tables
-- Features: Visit tracking, Feedback records, Negotiation records

-- CREATE visit_records TABLE
CREATE TABLE IF NOT EXISTS public.visit_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_link_id UUID NOT NULL REFERENCES public.imovel_demand_match(id) ON DELETE CASCADE,
    sdr_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    visited_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CREATE feedback_records TABLE
CREATE TABLE IF NOT EXISTS public.feedback_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_link_id UUID NOT NULL REFERENCES public.imovel_demand_match(id) ON DELETE CASCADE,
    sdr_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interest_level TEXT NOT NULL CHECK (interest_level IN ('interested', 'not_interested')),
    feedback_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CREATE negotiation_records TABLE
CREATE TABLE IF NOT EXISTS public.negotiation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_link_id UUID NOT NULL REFERENCES public.imovel_demand_match(id) ON DELETE CASCADE,
    negotiated_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    negotiation_status TEXT NOT NULL CHECK (negotiation_status IN ('negotiated', 'failed')),
    negotiation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UNIQUE INDEX for visit_records (prevent duplicate visits same day)
CREATE UNIQUE INDEX IF NOT EXISTS visit_records_unique_daily_visit_idx ON public.visit_records (property_link_id, sdr_user_id, visited_date);

-- PERFORMANCE INDEXES on Foreign Keys
CREATE INDEX IF NOT EXISTS visit_records_property_link_id_idx ON public.visit_records(property_link_id);
CREATE INDEX IF NOT EXISTS visit_records_sdr_user_id_idx ON public.visit_records(sdr_user_id);

CREATE INDEX IF NOT EXISTS feedback_records_property_link_id_idx ON public.feedback_records(property_link_id);
CREATE INDEX IF NOT EXISTS feedback_records_sdr_user_id_idx ON public.feedback_records(sdr_user_id);

CREATE INDEX IF NOT EXISTS negotiation_records_property_link_idx ON public.negotiation_records(property_link_id);
CREATE INDEX IF NOT EXISTS negotiation_records_user_idx ON public.negotiation_records(negotiated_by_user_id);

-- ENABLE RLS
ALTER TABLE public.visit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_records ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR visit_records
DROP POLICY IF EXISTS "SDR insert visit_records" ON public.visit_records;
CREATE POLICY "SDR insert visit_records" ON public.visit_records
FOR INSERT TO authenticated
WITH CHECK (sdr_user_id = auth.uid());

DROP POLICY IF EXISTS "SDR select visit_records" ON public.visit_records;
CREATE POLICY "SDR select visit_records" ON public.visit_records
FOR SELECT TO authenticated
USING (sdr_user_id = auth.uid());

DROP POLICY IF EXISTS "SDR update visit_records" ON public.visit_records;
CREATE POLICY "SDR update visit_records" ON public.visit_records
FOR UPDATE TO authenticated
USING (sdr_user_id = auth.uid())
WITH CHECK (sdr_user_id = auth.uid());

DROP POLICY IF EXISTS "Captador select visit_records" ON public.visit_records;
CREATE POLICY "Captador select visit_records" ON public.visit_records
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.imovel_demand_match m
        JOIN public.imoveis_captados ic ON m.imovel_id = ic.id
        WHERE m.id = visit_records.property_link_id AND ic.user_captador_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admin/Gestor select visit_records" ON public.visit_records;
CREATE POLICY "Admin/Gestor select visit_records" ON public.visit_records
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'gestor')
    )
);

-- POLICIES FOR feedback_records
DROP POLICY IF EXISTS "SDR insert feedback_records" ON public.feedback_records;
CREATE POLICY "SDR insert feedback_records" ON public.feedback_records
FOR INSERT TO authenticated
WITH CHECK (sdr_user_id = auth.uid());

DROP POLICY IF EXISTS "SDR select feedback_records" ON public.feedback_records;
CREATE POLICY "SDR select feedback_records" ON public.feedback_records
FOR SELECT TO authenticated
USING (sdr_user_id = auth.uid());

DROP POLICY IF EXISTS "SDR update feedback_records" ON public.feedback_records;
CREATE POLICY "SDR update feedback_records" ON public.feedback_records
FOR UPDATE TO authenticated
USING (sdr_user_id = auth.uid())
WITH CHECK (sdr_user_id = auth.uid());

DROP POLICY IF EXISTS "Captador select feedback_records" ON public.feedback_records;
CREATE POLICY "Captador select feedback_records" ON public.feedback_records
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.imovel_demand_match m
        JOIN public.imoveis_captados ic ON m.imovel_id = ic.id
        WHERE m.id = feedback_records.property_link_id AND ic.user_captador_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admin/Gestor select feedback_records" ON public.feedback_records;
CREATE POLICY "Admin/Gestor select feedback_records" ON public.feedback_records
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'gestor')
    )
);

-- POLICIES FOR negotiation_records
DROP POLICY IF EXISTS "SDR insert negotiation_records" ON public.negotiation_records;
CREATE POLICY "SDR insert negotiation_records" ON public.negotiation_records
FOR INSERT TO authenticated
WITH CHECK (negotiated_by_user_id = auth.uid());

DROP POLICY IF EXISTS "SDR select negotiation_records" ON public.negotiation_records;
CREATE POLICY "SDR select negotiation_records" ON public.negotiation_records
FOR SELECT TO authenticated
USING (negotiated_by_user_id = auth.uid());

DROP POLICY IF EXISTS "SDR update negotiation_records" ON public.negotiation_records;
CREATE POLICY "SDR update negotiation_records" ON public.negotiation_records
FOR UPDATE TO authenticated
USING (negotiated_by_user_id = auth.uid())
WITH CHECK (negotiated_by_user_id = auth.uid());

DROP POLICY IF EXISTS "Captador select negotiation_records" ON public.negotiation_records;
CREATE POLICY "Captador select negotiation_records" ON public.negotiation_records
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.imovel_demand_match m
        JOIN public.imoveis_captados ic ON m.imovel_id = ic.id
        WHERE m.id = negotiation_records.property_link_id AND ic.user_captador_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admin/Gestor select negotiation_records" ON public.negotiation_records;
CREATE POLICY "Admin/Gestor select negotiation_records" ON public.negotiation_records
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin', 'gestor')
    )
);
