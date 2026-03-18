import { SectionCard, FAQList, CodeBlock } from '@/components/help/SharedHelp'
import { ClipboardList, Home, Link as LinkIcon, HelpCircle } from 'lucide-react'

export function HelpSDR() {
  const faqs = [
    {
      q: 'Como criar uma demanda de cliente?',
      a: 'Vá até o menu "Nova Demanda", selecione o tipo (Aluguel para SDR), preencha o bairro exato, orçamento e envie. Os dados de contato são opcionais.',
    },
    {
      q: 'Como alterar o status de um imóvel?',
      a: 'Dentro do card da demanda, clique no imóvel captado e use os botões de ação para Agendar Visita ou Fechar Negócio.',
    },
    {
      q: 'O que é o Vínculo Manual?',
      a: 'Quando um captador registra um imóvel como "Disponível", você pode reivindicá-lo para o seu cliente específico usando a aba "Disponíveis Geral".',
    },
    {
      q: 'O que é um Grupo de Demanda?',
      a: 'O sistema une automaticamente clientes buscando o mesmo perfil (bairro e preço) para otimizar o trabalho do captador na rua.',
    },
    {
      q: 'Como copiar o link do imóvel para enviar ao cliente?',
      a: 'Clique no botão 🔗 (Copiar Link) presente no card do imóvel captado. Você verá a mensagem "Link copiado!" e poderá colar no WhatsApp.',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionCard title="1. Criação de Demandas (Locação)" icon={ClipboardList}>
        <p>
          O SDR é o responsável por injetar as necessidades de <strong>Aluguel</strong> no sistema.
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Acesse a tela de Nova Demanda via menu principal.</li>
          <li>
            Os campos <strong>Telefone</strong> e <strong>Email</strong> são opcionais.
          </li>
          <li>
            Preste muita atenção na escrita do <strong>Bairro</strong> para que o algoritmo de
            agrupamento funcione perfeitamente.
          </li>
        </ul>
      </SectionCard>

      <SectionCard title="2. Gerenciando Imóveis Captados" icon={Home}>
        <p>
          Quando um Captador encontra uma opção, você receberá uma notificação. Acesse a demanda e
          avalie o imóvel.
        </p>
        <p className="mt-2">Você deve avançar o funil utilizando os status:</p>
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
            Marcar como Perdido
          </span>
        </div>
      </SectionCard>

      <SectionCard title="3. Compartilhamento e Links" icon={LinkIcon}>
        <p>
          Para apresentar o imóvel ao seu cliente, use a ação <strong>🔗 Copiar Link</strong>. Um
          feedback visual de <CodeBlock>Link copiado!</CodeBlock> aparecerá.
        </p>
        <p className="mt-2">
          Você também pode explorar imóveis que não foram captados para uma demanda específica na
          aba <strong>"Disponíveis Geral"</strong> e vinculá-los manualmente ao seu cliente.
        </p>
      </SectionCard>

      <SectionCard title="4. Dúvidas Frequentes (FAQ)" icon={HelpCircle}>
        <FAQList faqs={faqs} />
      </SectionCard>
    </div>
  )
}
