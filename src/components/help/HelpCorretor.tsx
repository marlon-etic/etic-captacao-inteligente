import { SectionCard, FAQList, CodeBlock } from '@/components/help/SharedHelp'
import { Building, Link as LinkIcon, AlertTriangle } from 'lucide-react'

export function HelpCorretor() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionCard title="1. Criação de Demandas (Venda)" icon={Building}>
        <p>
          O Corretor é o foco das operações de <strong>Venda</strong>. O processo de criação de
          clientes é idêntico ao do SDR, mas o sistema irá rotear automaticamente todas as captações
          de venda diretamente para o seu perfil e bloquear aluguéis.
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>
            Preencha os valores mínimo e máximo com precisão para habilitar o{' '}
            <strong>Agrupamento Inteligente</strong> (o sistema unifica pedidos com valores
            similares na margem de ±10%).
          </li>
          <li>
            Acompanhe seus clientes ativos facilmente através da tela de Dashboard em "Minhas
            Demandas".
          </li>
        </ul>
      </SectionCard>

      <SectionCard title="2. Links e Apresentação para Cliente" icon={LinkIcon}>
        <p>
          Assim que for notificado sobre um novo imóvel encontrado, clique no botão{' '}
          <strong>🔗 Copiar Link</strong> no card da propriedade. O sistema confirmará com{' '}
          <CodeBlock>Link copiado!</CodeBlock>. Envie imediatamente para seu cliente e marque se há
          visita.
        </p>
        <p className="mt-2 text-sm text-[#999999]">
          Se o cliente não gostar, use a ação de dispensar imóvel. Lembre-se de sempre preencher o
          motivo do descarte (Ex: Muito pequeno, Área perigosa) para gerar inteligência de mercado e
          não frustrar os Captadores.
        </p>
      </SectionCard>

      <SectionCard title="Troubleshooting (Problemas Comuns)" icon={AlertTriangle}>
        <ul className="list-disc pl-5 space-y-2 text-[#333333]">
          <li>
            <strong>"Estou tentando cadastrar Locação, mas falha":</strong> O Perfil de Corretor
            está estritamente limitado pelo sistema a gerenciar demandas e imóveis de Vendas. Caso
            necessite trabalhar com aluguéis, contate a Administração.
          </li>
          <li>
            <strong>"Não consigo registrar um fechamento":</strong> Lembre-se que para marcar
            negócio fechado e premiar seu Captador, você precisará informar o valor final da
            transação e o tipo. Verifique se digitou o valor corretamente.
          </li>
        </ul>
      </SectionCard>
    </div>
  )
}
