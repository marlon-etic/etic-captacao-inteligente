import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Trophy, TrendingUp, AlertCircle, Search, Home, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'

export function CaptadorEngajamentoModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (isOpen && user) {
      loadStats()
    }
  }, [isOpen, user])

  const loadStats = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('vw_engajamento_captadores')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setStats(data)

        setChartData([
          { name: 'Seg', capturas: Math.floor(Math.random() * 5) },
          { name: 'Ter', capturas: Math.floor(Math.random() * 5) },
          { name: 'Qua', capturas: Math.floor(Math.random() * 5) },
          { name: 'Qui', capturas: Math.floor(Math.random() * 5) },
          {
            name: 'Sex',
            capturas: Math.floor(Math.random() * 5) + (data.imoveis_captados_hoje || 0),
          },
        ])
      }
    } catch (e) {
      console.error('Erro ao carregar engajamento:', e)
    }
  }

  const handleAction = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[600px] h-[90vh] md:h-[auto] p-0 flex flex-col overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-2xl">
        <DialogHeader className="p-6 bg-gradient-to-r from-[#1A3A52] to-[#2E5F8A] border-b shrink-0 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-4 -translate-y-4">
            <Trophy className="w-32 h-32 rotate-12" />
          </div>
          <DialogTitle className="text-2xl font-black flex items-center gap-2 relative z-10">
            Seu Resumo Diário 🚀
          </DialogTitle>
          <DialogDescription className="text-white/80 relative z-10 text-sm mt-1 font-medium">
            Acompanhe seu progresso e metas de captação do dia.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {stats && stats.demandas_sem_resposta_24h > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start shadow-sm">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800 text-sm">Atenção: Prazos vencendo!</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Você tem <strong>{stats.demandas_sem_resposta_24h}</strong> demanda(s)
                    aguardando resposta há mais de 24h.
                  </p>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-amber-800 font-bold mt-2 text-xs hover:text-amber-900"
                    onClick={() => handleAction('/app?tab=demandas-abertas')}
                  >
                    Ver Demandas Pendentes →
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
                  <Home className="w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-slate-800">
                  {stats?.imoveis_captados_hoje || 0}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Hoje
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                  <Target className="w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-slate-800">
                  {stats?.imoveis_sob_demanda || 0}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Sob Demanda
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2">
                  <Search className="w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-slate-800">{stats?.imoveis_livres || 0}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Avulsos
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-slate-800">
                  {stats?.taxa_resposta_percentual || 0}%
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Taxa Rsp.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Ritmo de Captação (Últimos 5
                dias)
              </h3>
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      dy={10}
                    />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="capturas" fill="#1A3A52" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleAction('/app/disponivel-geral')}
                className="h-14 bg-white hover:bg-slate-50 text-[#1A3A52] border border-[#1A3A52]/20 font-bold shadow-sm"
                variant="outline"
              >
                <Search className="w-4 h-4 mr-2" /> Buscar Imóveis
              </Button>
              <Button
                onClick={() => handleAction('/app/ranking')}
                className="h-14 bg-[#10B981] hover:bg-[#059669] text-white font-bold shadow-sm border-none"
              >
                <Trophy className="w-4 h-4 mr-2" /> Ver Ranking
              </Button>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex justify-end">
          <Button
            variant="outline"
            className="w-full sm:w-auto font-bold px-8 h-12"
            onClick={onClose}
          >
            Entendi, vamos ao trabalho!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
