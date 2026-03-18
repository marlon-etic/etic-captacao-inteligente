import { SectionCard } from '@/components/help/SharedHelp'
import { BookOpen } from 'lucide-react'

export function HelpGlossary() {
  const terms = [
    {
      term: 'Captador',
      def: 'Usuário focado no trabalho de rua, prospectando e registrando imóveis no sistema.',
    },
    {
      term: 'SDR',
      def: 'Sales Development Representative. Foca na qualificação e atendimento inicial de demandas de Locação (Aluguel).',
    },
    {
      term: 'Corretor',
      def: 'Profissional focado no fechamento de negócios e atendimento de demandas de Venda.',
    },
    {
      term: 'Demanda',
      def: 'O registro no sistema das necessidades de um cliente (orçamento, bairro, quartos, etc).',
    },
    {
      term: 'Grupo / Agrupamento',
      def: 'Conjunto de demandas similares unificadas pelo sistema para maximizar a eficiência do captador. (Bairro igual, valor ±10%).',
    },
    {
      term: 'RLS',
      def: 'Row Level Security. Regra de banco de dados que garante que usuários só vejam os dados que têm permissão.',
    },
    {
      term: 'Webhook',
      def: 'Mecanismo que envia informações em tempo real do nosso sistema para outros (ex: notificações).',
    },
    {
      term: 'N8n',
      def: 'Plataforma de automação de fluxo de trabalho utilizada para conectar o SCI ao WhatsApp.',
    },
    {
      term: 'Evolux',
      def: 'Plataforma de telefonia e integração de WhatsApp homologada no projeto.',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionCard title="Glossário de Termos" icon={BookOpen}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {terms.map((t, idx) => (
            <div
              key={idx}
              className="bg-[#FFFFFF] p-4 rounded-lg border border-[#E0E0E0] shadow-sm"
            >
              <h4 className="font-bold text-[#1A3A52] text-[15px] mb-1">{t.term}</h4>
              <p className="text-[13px] text-[#666666] leading-relaxed">{t.def}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
