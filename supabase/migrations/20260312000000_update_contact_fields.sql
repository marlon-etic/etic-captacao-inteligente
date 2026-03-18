-- Allow NULL values for client contact information to make them optional
DO $$ 
BEGIN
    -- Demandas Locação
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demandas_locacao' AND column_name='cliente_telefone') THEN
        ALTER TABLE demandas_locacao ADD COLUMN cliente_telefone VARCHAR(20) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demandas_locacao' AND column_name='cliente_email') THEN
        ALTER TABLE demandas_locacao ADD COLUMN cliente_email VARCHAR(255) NULL;
    END IF;

    -- Demandas Vendas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demandas_vendas' AND column_name='cliente_telefone') THEN
        ALTER TABLE demandas_vendas ADD COLUMN cliente_telefone VARCHAR(20) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='demandas_vendas' AND column_name='cliente_email') THEN
        ALTER TABLE demandas_vendas ADD COLUMN cliente_email VARCHAR(255) NULL;
    END IF;

    -- Ensure they are nullable if they already existed
    ALTER TABLE demandas_locacao ALTER COLUMN cliente_telefone DROP NOT NULL;
    ALTER TABLE demandas_locacao ALTER COLUMN cliente_email DROP NOT NULL;
    ALTER TABLE demandas_vendas ALTER COLUMN cliente_telefone DROP NOT NULL;
    ALTER TABLE demandas_vendas ALTER COLUMN cliente_email DROP NOT NULL;
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;
