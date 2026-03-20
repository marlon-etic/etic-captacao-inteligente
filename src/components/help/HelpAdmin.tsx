import { SectionCard, FAQList, CodeBlock } from '@/components/help/SharedHelp'
import { Settings, ShieldAlert, Database, Terminal } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function HelpAdmin() {
  const troubleshooting = [
    {
      q: '1. Grouping Issues (Demandas não agrupam)',
      a: 'Verifique se o bairro tem a escrita idêntica. O orçamento deve cruzar na margem de ±10%. Tipologias (Venda x Aluguel) e Perfil (Qtd Quartos) diferentes nunca se agrupam.',
    },
    {
      q: '2. WhatsApp Failures (Integração N8n)',
      a: 'Consulte a tela "Auditoria Logs" para verificar a fila de Webhooks enviada para o N8n. Se houver falha de API ou erro 500, o endpoint no N8n deve estar indisponível.',
    },
    {
      q: '3. RLS Visibility (Acesso negado em massa)',
      a: 'Acesse o "Teste de RLS" (RLS Tester) no painel. O Supabase é blindado. Se corretores alegam não ver demandas, confirme as políticas das roles na documentação de banco de dados.',
    },
    {
      q: '4. Dashboard Loading (Demora de Perf.)',
      a: 'Utilize a aba de "Teste Perf." para avaliar a latência. Reduza o volume de logs armazenados na tabela de auditoria local ou implemente restrições de tempo (ex: últimos 30 dias).',
    },
    {
      q: '5. Missing Environment Variables',
      a: 'O sistema inteiro pode retornar erro de CORS ou Falha de Rede se as credenciais VITE_SUPABASE_URL estiverem incorretas no build.',
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in-up">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-[#F5F5F5]">
          <TabsTrigger value="manual">Manual Admin</TabsTrigger>
          <TabsTrigger value="trouble">Solução (Erros)</TabsTrigger>
          <TabsTrigger value="tech">Arquitetura</TabsTrigger>
          <TabsTrigger value="env">Váriaveis</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4 space-y-6">
          <SectionCard title="Painel Administrativo" icon={Settings}>
            <p>
              <strong>Gestão de Perfis:</strong> Você possui controle absoluto através do menu
              "Usuários". Pode alterar papéis, redefinir acesso ou inativar contas antigas.
            </p>
            <p>
              <strong>Ferramentas de Teste:</strong> Na barra lateral estão localizadas as
              ferramentas técnicas de simulação de carga (Perf Tester), Invasão/Blindagem de dados
              (RLS Tester) e testes de fluxo End-to-End.
            </p>
            <p>
              <strong>Monitoramento Logs:</strong> Qualquer evento atípico (Falha de webhook,
              deleção forçada, negação de login) constará na seção de "Auditoria Logs". Acompanhe-o
              diariamente.
            </p>
          </SectionCard>
        </TabsContent>

        <TabsContent value="trouble" className="mt-4 space-y-6">
          <SectionCard title="Troubleshooting Avançado e APIs" icon={ShieldAlert}>
            <FAQList faqs={troubleshooting} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="tech" className="mt-4 space-y-6">
          <SectionCard title="Supabase e Modelo de Dados" icon={Database}>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Tabelas Core:</strong> <CodeBlock>demandas_locacao</CodeBlock>,{' '}
                <CodeBlock>demandas_vendas</CodeBlock>, <CodeBlock>imoveis_captados</CodeBlock>,{' '}
                <CodeBlock>respostas_captador</CodeBlock>.
              </li>
              <li>
                <strong>Row Level Security (RLS):</strong> Segurança implementada a nível de linha.
                Impedindo totalmente consultas como <CodeBlock>SELECT *</CodeBlock> para perfis não
                autenticados ou fora do escopo.
              </li>
              <li>
                <strong>Estado Frontend:</strong> React 19 + Vite com gerenciamento de estado Global
                (Zustand + Context API). WebSockets abertos para Broadcast Sync e atualizações em
                tempo real.
              </li>
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="env" className="mt-4 space-y-6">
          <SectionCard title="Segredos do Ambiente (Env Vars)" icon={Terminal}>
            <p className="mb-2">Assegure a presença e validade das variáveis de Build (.env):</p>
            <ul className="space-y-2">
              <li>
                <CodeBlock>VITE_N8N_WEBHOOK_URL</CodeBlock>: Endpoint de comunicação externa.
              </li>
              <li>
                <CodeBlock>VITE_SUPABASE_URL</CodeBlock>: URL raiz do DB no provedor.
              </li>
              <li>
                <CodeBlock>VITE_SUPABASE_PUBLISHABLE_KEY</CodeBlock>: Token de anon key.
              </li>
            </ul>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
