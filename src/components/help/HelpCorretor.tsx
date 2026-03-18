import { SectionCard, FAQList, CodeBlock } from '@/components/help/SharedHelp'
import { Building, Link as LinkIcon, HelpCircle } from 'lucide-react'

export function HelpCorretor() {
  const faqs = [
    {
      q: 'Qual a diferença da minha demanda para a do SDR?',
      a: 'O perfil Corretor opera exclusivamente no mercado de Vendas. O fluxo sistêmico é idêntico, porém isolado em outra tabela no banco de dados para evitar conflitos de notificação.',
    },
    {
      q: 'Como fechar negócio no sistema?',
      a: 'No detalhe do imóvel captado, clique em "Ações" > "Fechar Negócio". Insira o valor final da transação e a data. Isso recompensará o captador com 50 pontos extras.',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionCard title="1. Criação de Demandas (Venda)" icon={Building}>
        <p>
          O Corretor é o foco das operações de <strong>Venda</strong>. O processo de criação é
          idêntico ao do SDR, mas o sistema roteará automaticamente as captações de venda para o seu
          perfil.
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>
            Preencha os valores mínimo e máximo com precisão para habilitar o{' '}
            <strong>Agrupamento Inteligente</strong> (margem de tolerância ±10%).
          </li>
          <li>Acompanhe seus clientes ativos pela aba "Minhas Demandas".</li>
        </ul>
      </SectionCard>

      <SectionCard title="2. Links e Apresentação" icon={LinkIcon}>
        <p>
          Assim que notificado de um novo imóvel, clique em <strong>🔗 Copiar Link</strong> no card.
          O sistema validará com o toast <CodeBlock>Link copiado!</CodeBlock>. Envie este link ao
          seu cliente para avaliação rápida.
        </p>
        <p className="mt-2 text-sm text-[#999999]">
          Se o cliente não gostar, use a ação de dispensar imóvel e preencha o motivo para gerar
          inteligência de mercado (Analytics).
        </p>
      </SectionCard>

      <SectionCard title="3. Dúvidas Frequentes (FAQ)" icon={HelpCircle}>
        <FAQList faqs={faqs} />
      </SectionCard>
    </div>
  )
}
