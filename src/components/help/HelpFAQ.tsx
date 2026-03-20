import { SectionCard, FAQList } from '@/components/help/SharedHelp'
import { HelpCircle, PhoneCall, AlertTriangle } from 'lucide-react'

export function HelpFAQ() {
  const faqs = [
    {
      q: 'Esqueci minha senha, o que faço?',
      a: 'Clique em "Esqueceu a senha?" na tela de login, insira seu e-mail cadastrado e siga as instruções enviadas para sua caixa de entrada para criar uma nova senha.',
    },
    {
      q: 'Não recebi a notificação de um novo imóvel. Por quê?',
      a: 'Primeiro, verifique o sino de notificações 🔔 no canto superior direito do sistema. Se você aguardava uma notificação via WhatsApp, verifique se o seu número cadastrado no perfil contém o DDD correto.',
    },
    {
      q: 'A demanda que eu criei não aparece no meu feed',
      a: 'Se você for Captador, ela pode já ter sido marcada como "Atendida", "Perdida" ou "Impossível". Se você for Corretor ou SDR, verifique os filtros do seu Dashboard (se a opção "Ativos" está selecionada) e lembre-se que você visualiza apenas clientes criados por você mesmo.',
    },
    {
      q: 'Encontrei um erro ao cadastrar um imóvel. Como editar?',
      a: 'Apenas o Captador que registrou a propriedade originalmente ou um Administrador do sistema possuem permissão de segurança para editar os detalhes da propriedade captada.',
    },
    {
      q: 'O agrupamento de clientes (Grupo de Demanda) não funcionou',
      a: 'O sistema apenas agrupa clientes se: 1) A tipologia for exatamente igual (Venda com Venda). 2) Os nomes dos Bairros forem idênticos. 3) O limite de orçamento não tiver uma variação superior a ±10%. Edite a demanda para ajustar essas variáveis.',
    },
    {
      q: 'Tento clicar em "Aplicar Filtros" no celular mas o teclado atrapalha',
      a: 'Arraste suavemente a tela para que o teclado se feche. Na nova versão do sistema, o botão de ações também fica flutuando acima do teclado virtual.',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionCard title="Perguntas Frequentes (FAQ)" icon={HelpCircle}>
        <FAQList faqs={faqs} />
      </SectionCard>

      <SectionCard
        title="Reporte de Erros e Suporte"
        icon={PhoneCall}
        className="border-[#2E5F8A]/30"
      >
        <p className="mb-3">
          Se o seu problema não foi resolvido com as respostas acima ou caso enfrente um bug crítico
          (tela travada, erro vermelho), entre em contato imediato com o suporte técnico da
          operação:
        </p>
        <ul className="space-y-2 font-medium text-[#1A3A52] bg-[#F5F5F5] p-4 rounded-xl border border-[#E0E0E0]">
          <li className="flex items-center gap-2">
            ✉️ Email: <strong>suporte@eticimoveis.com.br</strong>
          </li>
          <li className="flex items-center gap-2">
            📱 WhatsApp: <strong>(11) 99999-9999</strong>
          </li>
          <li className="flex items-center gap-2">
            ⏰ Horário de Atendimento: <strong>Seg a Sex, 09h às 18h</strong>
          </li>
        </ul>
        <p className="mt-3 text-[13px] text-[#666666] flex items-start gap-1">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF9800]" />
          Dica: Sempre que reportar um problema, tire um print screen (captura de tela) para
          agilizar o diagnóstico técnico.
        </p>
      </SectionCard>
    </div>
  )
}
