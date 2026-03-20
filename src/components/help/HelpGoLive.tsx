import { SectionCard } from '@/components/help/SharedHelp'
import { CheckSquare, AlertTriangle, Rocket } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export function HelpGoLive() {
  const checklist = [
    'A infraestrutura do Supabase (Banco de Dados e Auth) está operando normalmente.',
    'Todos os usuários (SDR, Corretores, Captadores) receberam convites e conseguem fazer login.',
    "Todos os usuários leram a documentação de 'Guia de Onboarding' e entenderam a ferramenta.",
    'Os SDRs conseguiram criar ao menos uma demanda de teste de Locação na plataforma.',
    'Os Corretores conseguiram criar ao menos uma demanda de teste de Venda na plataforma.',
    'Os Captadores visualizaram as demandas de teste em tempo real e conseguiram registrar uma captação fictícia.',
    "O status da demanda foi alterado corretamente de 'Aberta' para 'Atendida' após a captação.",
    'As notificações push/in-app foram recebidas com sucesso pelos perfis responsáveis.',
    'Os testes de segurança (RLS Tester) no painel de Admin foram executados e retornaram com Status 100% OK.',
    'O contato e os canais de Suporte Técnico foram divulgados para toda a equipe operacional.',
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionCard title="Checklist Oficial de Go-Live" icon={CheckSquare}>
        <p className="mb-4 text-[#666666]">
          Este é o roteiro final de validação estrutural. Antes de lançar o sistema oficialmente
          para uso diário da operação (Go-Live), o Gestor responsável deve certificar-se de validar
          todos os pontos abaixo:
        </p>
        <div className="space-y-3">
          {checklist.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-lg hover:border-[#10B981]/50 transition-colors"
            >
              <Checkbox id={`check-${index}`} className="mt-0.5" />
              <label
                htmlFor={`check-${index}`}
                className="text-[14px] text-[#333333] cursor-pointer leading-tight font-medium"
              >
                {item}
              </label>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <div className="bg-[#10B981] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg opacity-90 hover:opacity-100 transition-opacity">
            <Rocket className="w-5 h-5" />
            TODOS OS PONTOS VALIDADOS
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Atenção Antes do Lançamento"
        icon={AlertTriangle}
        className="border-yellow-500/30 bg-yellow-50/50"
      >
        <p className="text-yellow-800 text-[14px] font-medium leading-relaxed">
          Recomenda-se realizar a rotina de <strong>"Limpar Banco de Testes"</strong> através do
          painel E2E Tester ou diretamente no Banco de Dados para remover os registros fictícios
          (demanda de teste, imóvel de teste) antes de permitir que sua equipe insira dados
          comerciais reais no primeiro dia de operação oficial.
        </p>
      </SectionCard>
    </div>
  )
}
