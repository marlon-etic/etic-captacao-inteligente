DO $$
BEGIN
    ALTER TABLE public.demandas_locacao DROP CONSTRAINT IF EXISTS demandas_locacao_nivel_urgencia_check;
    ALTER TABLE public.demandas_locacao ADD CONSTRAINT demandas_locacao_nivel_urgencia_check 
      CHECK (nivel_urgencia IN ('Baixa', 'Média', 'Alta', 'Urgente', 'Até 15 dias', 'Até 30 dias', 'Até 90 dias ou +'));
      
    ALTER TABLE public.demandas_vendas DROP CONSTRAINT IF EXISTS demandas_vendas_nivel_urgencia_check;
    ALTER TABLE public.demandas_vendas ADD CONSTRAINT demandas_vendas_nivel_urgencia_check 
      CHECK (nivel_urgencia IN ('Baixa', 'Média', 'Alta', 'Urgente', 'Até 15 dias', 'Até 30 dias', 'Até 90 dias ou +'));
END $$;
