import { SectionCard } from '@/components/help/SharedHelp'
import { Rocket, LogIn, Repeat, Layout, CheckCircle } from 'lucide-react'

export function HelpOnboarding() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionCard title="1. Como fazer login" icon={LogIn}>
        <p>
          Acesse o aplicativo pela URL fornecida pela equipe (ex: <i>etic.goskip.app</i>).
        </p>
        <p>Insira seu e-mail cadastrado e a senha enviada pelo administrador do sistema.</p>
        <p>
          Caso tenha esquecido sua senha, clique em "Esqueceu a senha?" na tela de login para
          receber um link de redefinição no seu email.
        </p>
      </SectionCard>

      <SectionCard title="2. Como alternar entre perfis" icon={Repeat}>
        <p>
          Seu perfil de usuário é fixo (SDR, Corretor, Captador ou Admin) e determina o que você
          pode visualizar no sistema.
        </p>
        <p>
          Caso precise mudar de função (ex: de Captador para Corretor), você deve solicitar ao
          Administrador do sistema para alterar seu papel (Role) no painel de Gestão de Usuários.
        </p>
      </SectionCard>

      <SectionCard title="3. Visão geral da interface" icon={Layout}>
        <p>
          <strong>Menu Principal:</strong> Fica na lateral esquerda no Desktop, ou no ícone de
          hambúrguer (☰) no canto superior esquerdo no Celular. Use-o para navegar entre todas as
          telas principais.
        </p>
        <p>
          <strong>Dashboard:</strong> É a sua tela inicial. É aqui que você verá as demandas abertas
          (se for Captador) ou as demandas dos seus clientes (se for SDR/Corretor).
        </p>
        <p>
          <strong>Notificações:</strong> O ícone de sino (🔔) no topo direito da tela alertará você
          sobre novos imóveis captados, mensagens, fechamentos de negócio e atualizações
          importantes.
        </p>
      </SectionCard>

      <SectionCard title="4. Seu primeiro passo" icon={CheckCircle}>
        <p className="font-bold text-[#1A3A52] mb-2">Para SDRs e Corretores:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Acesse a tela de Dashboard ou clique no botão de "Nova Demanda".</li>
          <li>Preencha os dados do cliente, bairro de interesse e faixa de preço.</li>
          <li>Acompanhe no Dashboard a evolução da captação.</li>
        </ul>

        <p className="font-bold text-[#1A3A52] mb-2">Para Captadores:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Abra o menu de "Demandas Abertas" e visualize o que os clientes estão buscando na sua
            região.
          </li>
          <li>
            Ao encontrar um imóvel, utilize o botão flutuante verde{' '}
            <strong>"➕ ADICIONAR IMÓVEL"</strong> no canto inferior direito para registrá-lo no
            sistema.
          </li>
        </ul>
      </SectionCard>
    </div>
  )
}
