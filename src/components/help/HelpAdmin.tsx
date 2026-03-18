import { SectionCard, FAQList, CodeBlock } from '@/components/help/SharedHelp'
import { Settings, ShieldAlert, Database, Terminal } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function HelpAdmin() {
  const troubleshooting = [
    {
      q: '1. Grouping Issues (Demandas não agrupam)',
      a: 'Verifique se o bairro tem a escrita idêntica. O orçamento deve cruzar na margem de ±10%. Tipologias diferentes nunca agrupam.',
    },
    {
      q: '2. WhatsApp Failures (Integração Evolux)',
      a: 'Consulte a aba Auditoria. O rate limit é 30 msg/min. Falhas entram em retry automático (5m, 15m) gerenciado pelo N8n.',
    },
    {
      q: '3. RLS Visibility (Visibilidade restrita)',
      a: 'Captadores não podem ler nomes de clientes (RLS Level). Se um Corretor não vê uma demanda, confirme se a role e o created_by estão corretos.',
    },
    {
      q: '4. Points Calculation (Erro de Gamificação)',
      a: 'Verifique os logs de sistema. O multiplicador de grupo exige que as demandas ativas não estejam com status "Perdida".',
    },
    {
      q: '5. Links (404 no Imóvel)',
      a: 'Evite barras (/) no código do imóvel durante o cadastro, pois isso quebra a rota da URL gerada.',
    },
    {
      q: '6. Performance (Lentidão no Dashboard)',
      a: 'Ajuste os filtros de período no Analytics para "7 dias" em vez de "Todas" para aliviar processamento client-side.',
    },
    {
      q: '7. Mobile Keyboard (UX no Celular)',
      a: 'O Input principal tem uma função scrollIntoView. Se falhar, verifique o z-index do modal flutuante.',
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in-up">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-[#F5F5F5]">
          <TabsTrigger value="manual">Manual Admin</TabsTrigger>
          <TabsTrigger value="trouble">Troubleshooting</TabsTrigger>
          <TabsTrigger value="tech">Tech Docs</TabsTrigger>
          <TabsTrigger value="env">Variáveis (Env)</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4 space-y-6">
          <SectionCard title="Manual do Administrador" icon={Settings}>
            <p>
              <strong>Gestão de Usuários:</strong> Altere roles, bloqueie e ative usuários em
              "Usuários".
            </p>
            <p>
              <strong>Monitoramento:</strong> O Dashboard Admin centraliza erros. A fila de webhooks
              (<CodeBlock>webhook_queue</CodeBlock>) mostra falhas de disparo para o N8n.
            </p>
            <p>
              <strong>Regras de Negócio Core:</strong>
              <br />- Agrupamento ocorre em real-time na criação da demanda.
              <br />- Aluguel vai para SDRs, Venda para Corretores.
              <br />- O sistema garante exclusividade do código do imóvel via restrição do banco.
            </p>
          </SectionCard>
        </TabsContent>

        <TabsContent value="trouble" className="mt-4 space-y-6">
          <SectionCard title="Solução de Problemas (7 Cenários)" icon={ShieldAlert}>
            <FAQList faqs={troubleshooting} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="tech" className="mt-4 space-y-6">
          <SectionCard title="Documentação Técnica (Supabase & Integrations)" icon={Database}>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Tabelas Core:</strong> <CodeBlock>demandas_locacao</CodeBlock>,{' '}
                <CodeBlock>demandas_vendas</CodeBlock>, <CodeBlock>imoveis_captados</CodeBlock>,{' '}
                <CodeBlock>grupos_demandas</CodeBlock>.
              </li>
              <li>
                <strong>RLS (Row Level Security):</strong> Políticas estritas aplicadas. Ex:
                Captadores não conseguem dar <CodeBlock>SELECT</CodeBlock> no{' '}
                <CodeBlock>client_name</CodeBlock>.
              </li>
              <li>
                <strong>Integração N8n:</strong> Ouve a tabela de eventos e dispara para a API da
                Evolux (WhatsApp).
              </li>
              <li>
                <strong>Frontend:</strong> React + Vite + Zustand (Estado) implementado via
                plataforma GoSkip.
              </li>
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="env" className="mt-4 space-y-6">
          <SectionCard title="Variáveis de Ambiente (Environment)" icon={Terminal}>
            <p className="mb-2">Configurações necessárias no servidor (.env):</p>
            <ul className="space-y-2">
              <li>
                <CodeBlock>VITE_N8N_WEBHOOK_URL</CodeBlock>: Endpoint de recepção do N8n.
              </li>
              <li>
                <CodeBlock>VITE_SUPABASE_URL</CodeBlock>: URL base do projeto no Supabase.
              </li>
              <li>
                <CodeBlock>VITE_SUPABASE_ANON_KEY</CodeBlock>: Chave pública.
              </li>
              <li>
                <CodeBlock>SUPABASE_SERVICE_KEY</CodeBlock>: Apenas backend/Edge Functions.
              </li>
              <li>
                <CodeBlock>EVOLUX_API_KEY</CodeBlock>: Token de disparo WhatsApp.
              </li>
              <li>
                <CodeBlock>SITE_BASE_URL</CodeBlock>: Raiz para geração de links.
              </li>
            </ul>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
