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

type ViewState = 'home' | 'captador' | 'sdr' | 'corretor' | 'admin' | 'glossary'

const SEARCH_INDEX = [
  {
    title: 'Primeiros Passos - Captador',
    keywords: 'login app nova captação cadastrar botão flutuante',
    view: 'captador' as ViewState,
  },
  {
    title: 'Tabela de Pontos (Gamificação)',
    keywords: 'pontos ranking ganhar score bônus',
    view: 'captador' as ViewState,
  },
  {
    title: 'Criação de Demanda (Locação)',
    keywords: 'nova demanda sdr aluguel cliente',
    view: 'sdr' as ViewState,
  },
  {
    title: 'Vínculo Manual e Funil',
    keywords: 'vincular funil status disponível geral',
    view: 'sdr' as ViewState,
  },
  {
    title: 'Criação de Demanda (Venda)',
    keywords: 'nova demanda corretor venda cliente',
    view: 'corretor' as ViewState,
  },
  {
    title: 'Copiar Link e Compartilhar',
    keywords: 'link url cliente whatsapp enviar',
    view: 'corretor' as ViewState,
  },
  {
    title: 'Troubleshooting & Erros',
    keywords: 'erro bug problema admin rls lentidão',
    view: 'admin' as ViewState,
  },
  {
    title: 'Variáveis de Ambiente',
    keywords: 'env supabase n8n evolux chaves',
    view: 'admin' as ViewState,
  },
  {
    title: 'O que é Agrupamento?',
    keywords: 'agrupamento grupo definicao conceito',
    view: 'glossary' as ViewState,
  },
  {
    title: 'Significado de RLS e Webhook',
    keywords: 'rls webhook segurança integração',
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
    setView(newView)
    setSearch('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderContent = () => {
    switch (view) {
      case 'captador':
        return <HelpCaptador />
      case 'sdr':
        return <HelpSDR />
      case 'corretor':
        return <HelpCorretor />
      case 'admin':
        return isAdmin ? <HelpAdmin /> : renderHome()
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
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
                Regras de pontuação, cadastro de imóveis e boas práticas de campo.
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
                Gestão de demandas de locação, atualização de status e vínculos.
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
                Tratativas de vendas, fechamento de negócios e envio de links.
              </p>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
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
                  Documentação técnica, troubleshooting e monitoramento do sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card
          onClick={() => navigateTo('glossary')}
          className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border-[2px] border-transparent hover:border-[#FF9800] group md:col-span-2"
        >
          <CardContent className="p-6 flex items-center justify-center text-center gap-3">
            <BookOpen className="w-6 h-6 text-[#FF9800]" />
            <h3 className="text-lg font-bold text-[#1A3A52]">Acessar o Glossário de Termos</h3>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1000px] mx-auto pb-12 animate-fade-in-up pt-4">
      <div className="bg-[#1A3A52] text-white rounded-2xl p-6 md:p-10 mb-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <BookOpen className="w-64 h-64 -mt-10 -mr-10" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-white/20 border-white/30 text-white font-mono">
              v2.0 — Março 2026
            </Badge>
          </div>
          <h1 className="text-[28px] md:text-[36px] font-black leading-tight mb-2">
            📚 Central de Ajuda — Sistema SCI
          </h1>
          <p className="text-white/80 text-[16px] md:text-[18px] mb-8 font-medium">
            Étic Imóveis — Sistema de Captação Imobiliária
          </p>

          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar na documentação..."
              value={search}
              onChange={handleSearch}
              className="h-14 pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white focus-visible:bg-white focus-visible:text-[#1A3A52] transition-all text-[16px]"
            />
          </div>
        </div>
      </div>

      <div className="px-2 sm:px-0">
        {view !== 'home' && (
          <Button
            variant="ghost"
            onClick={() => setView('home')}
            className="mb-6 hover:bg-transparent px-0 text-[#666666] hover:text-[#1A3A52]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o início
          </Button>
        )}

        {renderContent()}
      </div>
    </div>
  )
}
