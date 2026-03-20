import { SectionCard, FAQList, CodeBlock } from '@/components/help/SharedHelp'
import { ClipboardList, Home, Link as LinkIcon, AlertTriangle } from 'lucide-react'

export function HelpSDR() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionCard title="1. Criação de Demandas (Locação)" icon={ClipboardList}>
        <p>
          O SDR é o responsável por injetar as necessidades de <strong>Aluguel</strong> no sistema.
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Acesse a tela de Nova Demanda via menu principal ou clicando no botão +.</li>
          <li>
            Os campos <strong>Telefone</strong> e <strong>Email</strong> são opcionais.
          </li>
          <li>
            Preste muita atenção na escrita do <strong>Bairro</strong> e no limite mínimo/máximo de
            Orçamento para que o algoritmo de agrupamento una os seus clientes de forma inteligente
            para os Captadores.
          </li>
        </ul>
      </SectionCard>

      <SectionCard title="2. Gerenciando Imóveis Captados" icon={Home}>
        <p>
          Quando um Captador encontra uma opção para a sua demanda, você receberá uma notificação em
          tempo real. Acesse a demanda e avalie o imóvel apresentado.
        </p>
        <p className="mt-2">Você deve avançar o status do imóvel utilizando as ações no Card:</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="bg-[#E3F2FD] text-[#2E7D32] px-2 py-1 rounded text-sm font-bold">
            Agendar Visita
          </span>
          <span className="bg-[#FFF8E1] text-[#F57F17] px-2 py-1 rounded text-sm font-bold">
            Registrar Proposta
          </span>
          <span className="bg-[#E8F5E9] text-[#4CAF50] px-2 py-1 rounded text-sm font-bold">
            Negócio Fechado
          </span>
          <span className="bg-[#FFEBEE] text-[#D32F2F] px-2 py-1 rounded text-sm font-bold">
            Imóvel Dispensado
          </span>
        </div>
      </SectionCard>

      <SectionCard title="3. Compartilhamento e Links" icon={LinkIcon}>
        <p>
          Para apresentar o imóvel ao seu cliente, use a ação <strong>🔗 Copiar Link</strong>{' '}
          presente nos detalhes da captação. O sistema exibirá a notificação{' '}
          <CodeBlock>Link copiado!</CodeBlock> para você colar diretamente no WhatsApp.
        </p>
        <p className="mt-2">
          Você também pode explorar imóveis em aberto na seção lateral{' '}
          <strong>"Disponível Geral"</strong> e vinculá-los manualmente aos clientes de sua base.
        </p>
      </SectionCard>

      <SectionCard title="Troubleshooting (Problemas Comuns)" icon={AlertTriangle}>
        <ul className="list-disc pl-5 space-y-2 text-[#333333]">
          <li>
            <strong>"Não consigo criar demanda":</strong> O formulário exige que campos obrigatórios
            com asterisco vermelho (*) sejam devidamente preenchidos. Revise os campos Bairros,
            Valor, Quartos e Urgência.
          </li>
          <li>
            <strong>"Cliente sumiu da tela principal":</strong> Verifique se a demanda não mudou de
            status para "Perdido", "Fechado" ou "Impossível". Altere o filtro "Status" para "Todos
            os Status" para visualizar clientes que já não estão ativos.
          </li>
        </ul>
      </SectionCard>
    </div>
  )
}
