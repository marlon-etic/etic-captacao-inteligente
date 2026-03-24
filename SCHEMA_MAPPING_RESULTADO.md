# Resultado do Mapeamento de Schema (PROMPT-002-ALINHAMENTO)

Conforme solicitado para alinhar as divergências do banco de dados antes de rodar o PROMPT-003, aqui estão os nomes reais das estruturas no Supabase:

### 1. Nomes Reais das Tabelas Principais

- **Tabela de Usuários:** `users` _(NÃO é usuarios)_
- **Tabela de Auditoria:** `audit_log` _(NÃO é auditoria)_
- **Tabelas Ausentes no Schema Atual:** `grupos_demandas` e `webhook_queue` não constam nas definições ativas do schema atual do Supabase. As demandas são tratadas através das tabelas `demandas_locacao` e `demandas_vendas`.

### 2. Nomes Reais de Todos os Triggers

- **Na tabela `users`:**
  - `audit_users`
  - `update_users_updated_at`
- **Na tabela `demandas_locacao`:**
  - `audit_demandas_locacao`
  - `criar_prazo_locacao_trigger`
  - `pontuacao_ganho_locacao_trigger`
  - `trg_notify_nova_demanda_locacao`
  - `update_demandas_locacao_updated_at`
- **Na tabela `demandas_vendas`:**
  - `audit_demandas_vendas`
  - `criar_prazo_vendas_trigger`
  - `pontuacao_ganho_vendas_trigger`
  - `trg_notify_nova_demanda_vendas`
  - `update_demandas_vendas_updated_at`
- **Na tabela `imoveis_captados`:**
  - `audit_imoveis_captados`
  - `marcar_prazo_imovel_trigger`
  - `pontuacao_imovel_trigger`
  - `trg_notify_imovel_atualizado`
  - `trg_notify_novo_imovel`
  - `update_imoveis_captados_updated_at`
- **Na tabela `respostas_captador`:**
  - `marcar_prazo_resposta_trigger`
  - `trg_notify_resposta_captador`
  - `update_respostas_captador_updated_at`

### 3. Nomes Reais de Todas as Functions

- `atualizar_prazos_vencidos`
- `audit_log_function`
- `criar_prazo_captacao`
- `marcar_prazo_respondido_imovel`
- `marcar_prazo_respondido_resposta`
- `notify_imovel_atualizado`
- `notify_nova_demanda`
- `notify_novo_imovel`
- `notify_resposta_captador`
- `rls_auto_enable`
- `set_updated_at`
- `trg_pontuacao_ganho_locacao`
- `trg_pontuacao_ganho_vendas`
- `trg_pontuacao_imovel`

---

**Instrução para a IA no PROMPT-003:**
Utilize exclusivamente os nomes reais documentados acima nas próximas instruções e scripts SQL.
