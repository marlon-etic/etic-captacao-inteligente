import { SectionCard, FAQList, CodeBlock } from '@/components/help/SharedHelp'
import { Rocket, CheckCircle, Users, Trophy, AlertTriangle } from 'lucide-react'

export function HelpCaptador() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionCard title="1. Primeiros Passos" icon={Rocket}>
        <p>
          Bem-vindo ao SCI! Seu objetivo é encontrar os imóveis perfeitos para os clientes. Navegue
          pelo painel principal usando as abas <strong>Minhas Demandas</strong> e{' '}
          <strong>Captados</strong>.
        </p>
        <p>
          Sempre que encontrar uma oportunidade, clique no botão verde flutuante{' '}
          <strong>➕ Nova Captação</strong> no canto inferior direito para registrar a propriedade.
        </p>
      </SectionCard>

      <SectionCard title="2. Respondendo Demandas" icon={CheckCircle}>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>✅ Encontrei Imóvel:</strong> Insira os detalhes. Use um código curto e único
            (Ex: <CodeBlock>MOC-2024-001</CodeBlock>).
          </li>
          <li>
            <strong>🔗 Link do Site:</strong> O sistema gera uma URL de pré-visualização no formato{' '}
            <CodeBlock>https://www.eticimoveis.com.br/imovel/&#123;codigo&#125;</CodeBlock>.
          </li>
          <li>
            <strong>❌ Não Encontrei:</strong> Reporte se a região está esgotada. Isso alerta o SDR
            e inicia um prazo crítico de 24h.
          </li>
        </ul>
      </SectionCard>

      <SectionCard title="3. Entendendo os Grupos" icon={Users}>
        <p>
          O sistema agrupa clientes com interesses parecidos automaticamente para otimizar seu tempo
          na rua. Um grupo é formado quando:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Mesmo <strong>Bairro</strong> e <strong>Tipologia</strong> (Venda/Aluguel).
          </li>
          <li>
            Valor dentro de uma margem de <strong>±10%</strong>.
          </li>
        </ul>
        <p className="text-sm text-[#999999] mt-2">
          Dica: Captar para um grupo rende muito mais pontos!
        </p>
      </SectionCard>

      <SectionCard title="4. Gamificação e Pontos" icon={Trophy}>
        <p>Sua performance é medida em pontos no Ranking Oficial:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div className="bg-[#F5F5F5] p-3 rounded-lg border border-[#E0E0E0]">
            <p className="text-sm font-bold">Captação Individual</p>
            <p className="text-lg text-[#4CAF50] font-black">+50 pts</p>
          </div>
          <div className="bg-[#F5F5F5] p-3 rounded-lg border border-[#E0E0E0]">
            <p className="text-sm font-bold">Grupo 2 a 3 Clientes</p>
            <p className="text-lg text-[#4CAF50] font-black">+75 pts</p>
          </div>
          <div className="bg-[#F5F5F5] p-3 rounded-lg border border-[#E0E0E0]">
            <p className="text-sm font-bold">Grupo 4 a 6 Clientes</p>
            <p className="text-lg text-[#4CAF50] font-black">+100 pts</p>
          </div>
          <div className="bg-[#F5F5F5] p-3 rounded-lg border border-[#E0E0E0]">
            <p className="text-sm font-bold">Grupo 7+ Clientes</p>
            <p className="text-lg text-[#4CAF50] font-black">+150 pts</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Troubleshooting (Problemas Comuns)" icon={AlertTriangle}>
        <ul className="list-disc pl-5 space-y-2 text-[#333333]">
          <li>
            <strong>"Não consigo ver demandas no feed":</strong> Verifique se você aplicou algum
            filtro acidentalmente na barra de filtros lateral. Caso tenha ocultado a aba de filtros
            no celular, recarregue a página ou clique em Limpar Filtros.
          </li>
          <li>
            <strong>"Botão de captar sumiu":</strong> Atualize a página do seu navegador. O botão
            verde deve sempre estar flutuando visivelmente no canto inferior direito da tela.
          </li>
          <li>
            <strong>"Erro de Código Duplicado":</strong> Cada imóvel no sistema necessita de um
            código exclusivo. Se você tentar cadastrar um código já usado, precisará alterá-lo.
          </li>
        </ul>
      </SectionCard>
    </div>
  )
}
