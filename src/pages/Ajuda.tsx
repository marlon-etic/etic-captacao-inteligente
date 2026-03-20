import { useState } from 'react'
import {
  Search,
  BookOpen,
  Activity,
  ClipboardList,
  Building,
  Settings,
  ArrowLeft,
  ChevronRight,
  Rocket,
  HelpCircle,
  CheckSquare,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useAppStore from '@/stores/useAppStore'

import { HelpCaptador } from '@/components/help/HelpCaptador'
import { HelpSDR } from '@/components/help/HelpSDR'
import { HelpCorretor } from '@/components/help/HelpCorretor'
import { HelpAdmin } from '@/components/help/HelpAdmin'
import { HelpGlossary } from '@/components/help/HelpGlossary'
import { HelpOnboarding } from '@/components/help/HelpOnboarding'
import { HelpFAQ } from '@/components/help/HelpFAQ'
import { HelpGoLive } from '@/components/help/HelpGoLive'

type ViewState =
  | 'home'
  | 'captador'
  | 'sdr'
  | 'corretor'
  | 'admin'
  | 'glossary'
  | 'onboarding'
  | 'faq'
  | 'golive'

const SEARCH_INDEX = [
  {
    title: 'Primeiros Passos - Onboarding',
    keywords: 'login aplicativo interface inicio senha alternar painel primeiro',
    view: 'onboarding' as ViewState,
  },
  {
    title: 'Manual do Captador',
    keywords: 'pontos ranking ganhar score bônus cadastro nova captação campo regras',
    view: 'captador' as ViewState,
  },
  {
    title: 'Manual do SDR',
    keywords: 'nova demanda sdr aluguel locacao cliente vincular status',
    view: 'sdr' as ViewState,
  },
  {
    title: 'Manual do Corretor',
    keywords: 'nova demanda corretor venda cliente link url whatsapp negocio',
    view: 'corretor' as ViewState,
  },
  {
    title: 'Manual do Administrador',
    keywords: 'erro bug problema admin rls lentidão webhook env vars n8n',
    view: 'admin' as ViewState,
  },
  {
    title: 'Dúvidas Frequentes (FAQ)',
    keywords: 'senha suporte contato erro bug duvida notificacao sumiu nao aparece',
    view: 'faq' as ViewState,
  },
  {
    title: 'Checklist Go-Live',
    keywords: 'lancamento validacao check go-live live pronto iniciar arrancar start',
    view: 'golive' as ViewState,
  },
  {
    title: 'O que é Agrupamento?',
    keywords: 'agrupamento grupo definicao conceito',
    view: 'glossary' as ViewState,
  },
]

export default function Ajuda() {
  const { currentUser } = useAppStore()
  const [view, setView] = useState<ViewState>('home')
  const [search, setSearch] = useState('')

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    if (view !== 'home' && e.target.value.length > 0) {
      setView('home')
    }
  }

  const filteredResults =
    search.length >= 2
      ? SEARCH_INDEX.filter(
          (item) =>
            item.keywords.toLowerCase().includes(search.toLowerCase()) ||
            item.title.toLowerCase().includes(search.toLowerCase()),
        )
      : []

  const isAdmin = currentUser?.role === 'admin'

  const navigateTo = (newView: ViewState) => {
    if (newView === 'admin' && !isAdmin) return
    if (newView === 'golive' && !isAdmin) return
    setView(newView)
    setSearch('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderContent = () => {
    switch (view) {
      case 'onboarding':
        return <HelpOnboarding />
      case 'captador':
        return <HelpCaptador />
      case 'sdr':
        return <HelpSDR />
      case 'corretor':
        return <HelpCorretor />
      case 'admin':
        return isAdmin ? <HelpAdmin /> : renderHome()
      case 'faq':
        return <HelpFAQ />
      case 'golive':
        return isAdmin ? <HelpGoLive /> : renderHome()
      case 'glossary':
        return <HelpGlossary />
      default:
        return renderHome()
    }
  }

  const renderHome = () => {
    if (search.length >= 2) {
      return (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm font-bold text-[#999999] mb-4">
            Resultados da busca para "{search}"
          </p>
          {filteredResults.length === 0 ? (
            <div className="text-center py-12 text-[#999999] bg-white rounded-xl border border-[#E5E5E5]">
              Nenhum resultado encontrado.
            </div>
          ) : (
            filteredResults.map((result, idx) => (
              <Card
                key={idx}
                className="cursor-pointer hover:border-[#1A3A52] transition-colors border-[#E5E5E5]"
                onClick={() => navigateTo(result.view)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#1A3A52]">{result.title}</h3>
                    <p className="text-xs text-[#666666] uppercase tracking-wider mt-1">
                      Sessão: {result.view}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#999999]" />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
        <Card
          onClick={() => navigateTo('onboarding')}
          className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border-[2px] border-transparent hover:border-[#10B981] group"
        >
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#10B981]/10 flex items-center justify-center shrink-0 group-hover:bg-[#10B981] transition-colors">
              <Rocket className="w-7 h-7 text-[#10B981] group-hover:text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1A3A52] mb-1">Guia de Onboarding</h3>
              <p className="text-sm text-[#666666]">
                Primeiros passos no sistema, login e visão da interface.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigateTo('captador')}
          className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border-[2px] border-transparent hover:border-[#4CAF50] group"
        >
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#4CAF50]/10 flex items-center justify-center shrink-0 group-hover:bg-[#4CAF50] transition-colors">
              <Activity className="w-7 h-7 text-[#4CAF50] group-hover:text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1A3A52] mb-1">Manual do Captador</h3>
              <p className="text-sm text-[#666666]">
                Regras de pontuação e rotina de cadastro de imóveis.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigateTo('sdr')}
          className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border-[2px] border-transparent hover:border-[#2E5F8A] group"
        >
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#2E5F8A]/10 flex items-center justify-center shrink-0 group-hover:bg-[#2E5F8A] transition-colors">
              <ClipboardList className="w-7 h-7 text-[#2E5F8A] group-hover:text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1A3A52] mb-1">Manual do SDR</h3>
              <p className="text-sm text-[#666666]">
                Gestão de demandas de locação e fluxo de aprovação.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigateTo('corretor')}
          className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border-[2px] border-transparent hover:border-[#2E5F8A] group"
        >
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#2E5F8A]/10 flex items-center justify-center shrink-0 group-hover:bg-[#2E5F8A] transition-colors">
              <Building className="w-7 h-7 text-[#2E5F8A] group-hover:text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1A3A52] mb-1">Manual do Corretor</h3>
              <p className="text-sm text-[#666666]">
                Tratativas de vendas, propostas e fechamentos comerciais.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigateTo('faq')}
          className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border-[2px] border-transparent hover:border-[#9C27B0] group"
        >
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#9C27B0]/10 flex items-center justify-center shrink-0 group-hover:bg-[#9C27B0] transition-colors">
              <HelpCircle className="w-7 h-7 text-[#9C27B0] group-hover:text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1A3A52] mb-1">Dúvidas Frequentes (FAQ)</h3>
              <p className="text-sm text-[#666666]">
                Respostas rápidas e orientações de contato com o suporte.
              </p>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <>
            <Card
              onClick={() => navigateTo('admin')}
              className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border-[2px] border-transparent hover:border-[#1A3A52] group bg-[#F8FAFC]"
            >
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#1A3A52]/10 flex items-center justify-center shrink-0 group-hover:bg-[#1A3A52] transition-colors">
                  <Settings className="w-7 h-7 text-[#1A3A52] group-hover:text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1A3A52] mb-1 flex items-center gap-2">
                    Admin & Tech <Badge className="h-5 text-[10px]">Restrito</Badge>
                  </h3>
                  <p className="text-sm text-[#666666]">
                    Controle de acesso e resolução técnica de problemas.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              onClick={() => navigateTo('golive')}
              className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border-[2px] border-transparent hover:border-[#F44336] group md:col-span-2 lg:col-span-3 bg-[#FEF2F2]"
            >
              <CardContent className="p-6 flex items-center justify-center text-center gap-4">
                <CheckSquare className="w-8 h-8 text-[#F44336]" />
                <div className="text-left">
                  <h3 className="text-lg font-bold text-[#1A3A52]">
                    Acessar o Checklist de Go-Live
                  </h3>
                  <p className="text-sm text-[#666666]">
                    Validações críticas para o Gestor Oficial antes do lançamento.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto pb-12 animate-fade-in-up pt-4">
      <div className="bg-[#1A3A52] text-white rounded-2xl p-6 md:p-10 mb-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <BookOpen className="w-64 h-64 -mt-10 -mr-10" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-white/20 border-white/30 text-white font-mono">
              v2.0 — Sistema Atualizado
            </Badge>
          </div>
          <h1 className="text-[28px] md:text-[36px] font-black leading-tight mb-2">
            📚 Central de Documentação
          </h1>
          <p className="text-white/80 text-[16px] md:text-[18px] mb-8 font-medium">
            Tudo o que você precisa saber para operar o sistema com máxima eficiência.
          </p>

          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
            <Input
              type="text"
              placeholder="Ex: Como recuperar a senha, Erro de grupo..."
              value={search}
              onChange={handleSearch}
              className="h-14 pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white focus-visible:bg-white focus-visible:text-[#1A3A52] transition-all text-[16px]"
            />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-0">
        {view !== 'home' && (
          <Button
            variant="ghost"
            onClick={() => setView('home')}
            className="mb-6 hover:bg-transparent px-0 text-[#666666] hover:text-[#1A3A52]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para os manuais
          </Button>
        )}

        {renderContent()}
      </div>
    </div>
  )
}
