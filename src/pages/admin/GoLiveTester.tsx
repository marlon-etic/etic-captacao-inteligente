import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  PlayCircle,
  Download,
  ServerCrash,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'

type TestStatus = 'idle' | 'passed' | 'failed'
interface TestItem {
  id: string
  cat: string
  name: string
  status: TestStatus
  notes: string
}

const TEST_DEFS = [
  [
    'Autenticação',
    'Login com email/senha funciona (todos os roles: admin, captador, SDR, corretor)',
    'Login com Google funciona (cria usuário automaticamente em auth.users e usuarios)',
    'Logout funciona (session é destruída, redirecionamento para login)',
    'Password reset funciona (email enviado, link válido, senha atualizada)',
    'RLS está ativo (usuário não consegue acessar dados de outro usuário)',
  ],
  [
    'Captador',
    'Adicionar imóvel funciona (todos os campos: finalidade, código, preço, bairro, dormitórios, vagas, observações)',
    'Dropdown de bairro funciona (scroll com mouse, filtro ao digitar, seleção correta)',
    'Editar imóvel funciona (dormitórios/vagas aparecem preenchidos, não zerados)',
    'Observações não sobrescrevem dados existentes (lógica condicional funciona)',
    'Vincular demanda funciona (lista de demandas aparece com scoring)',
    'Scoring de match calcula corretamente (25% valor, 25% bairro, 25% dorm, 25% vagas)',
    'Cores de scoring corretas (verde ≥50%, vermelho <50%)',
    'Botão "CONFIRMAR E VINCULAR" visível e clicável (não escondido)',
    'Vinculação salva no Supabase (demanda atualizada com imovel_id)',
    'Aba "Meus Captados" lista imóveis corretamente (com dados completos)',
    'Aba "Perdidos" lista demandas marcadas como perdidas',
    'Botão "Reabrir" em "Perdidos" funciona (status muda para ABERTA, sync em <1s)',
    'Histórico de "PERDIDO" aparece (nome captador, data, motivo)',
  ],
  [
    'SDR',
    'Criar demanda de locação funciona (todos os campos)',
    'Vincular demanda a imóvel captado funciona (matching automático)',
    'Aba "Minhas Demandas" lista demandas do SDR',
    'Notificação ao captador quando demanda é criada (toast/email)',
    'Histórico de respostas de captadores aparece (quem marcou perdido, quando)',
  ],
  [
    'Corretor',
    'Criar demanda de venda funciona (todos os campos)',
    'Vincular demanda a imóvel captado funciona (matching automático)',
    'Agendar visita funciona (campo de visitas atualiza no captador em <1s)',
    'Notificação ao captador quando visita é agendada',
    "Fechar negócio funciona (status='CONCLUIDO', sync para todos em <1s)",
  ],
  [
    'Sincronização Multi-role',
    'Reabrir demanda propaga para SDR/Corretor/Captador em <1s',
    'Agendar visita propaga para captador em <1s',
    'Fechar negócio propaga para todos em <1s',
    'Editar imóvel propaga para SDR/Corretor em <1s',
    'Real-time subscriptions funcionam (não há delay >2s)',
  ],
  [
    'Responsividade',
    'Mobile (375px): Todos os botões clicáveis, sem z-index conflito',
    'Mobile (375px): Scroll funciona em dropdowns e listas',
    'Desktop (1024px+): Layout correto, sem quebras visuais',
    'Desktop (1024px+): Todos os campos visíveis e acessíveis',
  ],
  [
    'Performance',
    'Load inicial <500ms (abrir app, carregar dashboard)',
    'Sync <1s (mudança de status propaga em <1s)',
    'Cliques respondem <300ms (sem lag perceptível)',
  ],
  [
    'Segurança',
    'RLS bloqueia acesso a dados de outro usuário (testar com 2 usuários diferentes)',
    'Captador não consegue editar demanda de outro SDR/Corretor',
    'SDR não consegue editar imóvel de outro captador',
    'Sem erros de segurança no console',
  ],
  [
    'Erro',
    'Rede instável (throttle 3G): Sistema mantém consistência, retry funciona',
    'Offline: Fila local funciona, sync ao reconectar',
    'Validação de campos: Erros aparecem sem fechar modais',
    'Console limpo: Sem erros de JavaScript, warnings mínimos',
  ],
]

const INITIAL_TESTS: TestItem[] = TEST_DEFS.flatMap((g, i) =>
  g
    .slice(1)
    .map((n, j) => ({ id: `${i}-${j}`, cat: g[0], name: n as string, status: 'idle', notes: '' })),
)

export default function GoLiveTester() {
  const [tests, setTests] = useState<TestItem[]>(() => {
    const saved = localStorage.getItem('sci_golive_tests_v2')
    return saved ? JSON.parse(saved) : INITIAL_TESTS
  })

  useEffect(() => {
    localStorage.setItem('sci_golive_tests_v2', JSON.stringify(tests))
  }, [tests])

  const setStatus = (id: string, status: TestStatus) => {
    setTests((p) => p.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  const setNotes = (id: string, notes: string) => {
    setTests((p) => p.map((t) => (t.id === id ? { ...t, notes } : t)))
  }

  const reset = () => {
    if (confirm('Limpar todos os resultados do teste Go-Live?')) {
      setTests(INITIAL_TESTS)
      toast({ title: 'Testes resetados com sucesso' })
    }
  }

  const exportReport = () => {
    const text = tests
      .map(
        (t) =>
          `[${t.status === 'passed' ? '✅ PASSOU' : t.status === 'failed' ? '❌ FALHOU' : '⏳ PENDENTE'}] ${t.cat}: ${t.name}\n${t.notes ? `Notas/Bug: ${t.notes}\n` : ''}`,
      )
      .join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qa_golive_report_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Relatório Exportado' })
  }

  const passed = tests.filter((t) => t.status === 'passed').length
  const failed = tests.filter((t) => t.status === 'failed').length
  const prog = Math.round(((passed + failed) / tests.length) * 100)

  const grouped = tests.reduce(
    (acc, t) => {
      if (!acc[t.cat]) acc[t.cat] = []
      acc[t.cat].push(t)
      return acc
    },
    {} as Record<string, TestItem[]>,
  )

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-24 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A52] flex items-center gap-2">
            <ClipboardCheck className="w-8 h-8" />
            Checklist de Go-Live QA
          </h1>
          <p className="text-gray-600 mt-1 max-w-3xl text-sm md:text-base">
            Execute os 48 testes funcionais completos listados abaixo para certificar que o sistema
            está 100% pronto para produção.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button
            asChild
            variant="outline"
            className="flex-1 md:flex-none border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            <Link to="/app/database-reset">
              <ServerCrash className="w-4 h-4 mr-2" /> Resetar Base de Produção
            </Link>
          </Button>
          <Button variant="outline" onClick={reset} className="flex-1 md:flex-none">
            <PlayCircle className="w-4 h-4 mr-2" /> Limpar QA
          </Button>
          <Button
            onClick={exportReport}
            className="flex-1 md:flex-none bg-[#1A3A52] hover:bg-[#2E5F8A]"
          >
            <Download className="w-4 h-4 mr-2" /> Gerar Relatório
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-3xl font-black text-[#1A3A52]">{prog}%</span>
            <br />
            <span className="text-xs font-bold text-gray-500 uppercase">Progresso</span>
          </CardContent>
        </Card>
        <Card className="bg-[#F2FBF5] border-[#4CAF50]/30">
          <CardContent className="p-4 text-center text-[#2E7D32]">
            <span className="text-3xl font-black text-[#4CAF50]">{passed}</span>
            <br />
            <span className="text-xs font-bold uppercase">Passaram (✅)</span>
          </CardContent>
        </Card>
        <Card className="bg-[#FEF2F2] border-[#EF4444]/30">
          <CardContent className="p-4 text-center text-[#B91C1C]">
            <span className="text-3xl font-black text-[#EF4444]">{failed}</span>
            <br />
            <span className="text-xs font-bold uppercase">Falharam (❌)</span>
          </CardContent>
        </Card>
        <Card className="bg-[#F8FAFC]">
          <CardContent className="p-4 text-center text-[#64748B]">
            <span className="text-3xl font-black">{tests.length - passed - failed}</span>
            <br />
            <span className="text-xs font-bold uppercase">Pendentes (⏳)</span>
          </CardContent>
        </Card>
      </div>

      {prog === 100 && failed === 0 && (
        <div className="bg-[#E8F5E9] border-2 border-[#4CAF50] rounded-xl p-6 flex flex-col items-center text-center shadow-md animate-fade-in-up">
          <div className="bg-[#4CAF50] text-white p-3 rounded-full mb-3 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-[#1A3A52] mb-1">
            SISTEMA APROVADO PARA GO-LIVE!
          </h2>
          <p className="text-[#333333] font-medium max-w-xl">
            Todos os 48 testes essenciais foram validados com sucesso. O sistema está estável,
            funcional e aderente às especificações de produção.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([cat, items]) => (
          <Card key={cat} className="border-[2px] border-gray-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-gray-50 py-3 px-4 border-b border-gray-200">
              <CardTitle className="text-base font-bold text-[#1A3A52] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1A3A52]"></span> {cat} ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-gray-200">
              {items.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    'p-4 flex flex-col md:flex-row gap-4 transition-colors',
                    t.status === 'passed'
                      ? 'bg-[#F2FBF5]'
                      : t.status === 'failed'
                        ? 'bg-[#FEF2F2]'
                        : 'hover:bg-gray-50/50',
                  )}
                >
                  <div className="flex-1">
                    <span
                      className={cn(
                        'font-medium text-sm block mb-2 md:mb-0',
                        t.status === 'passed'
                          ? 'text-[#2E7D32]'
                          : t.status === 'failed'
                            ? 'text-[#B91C1C]'
                            : 'text-gray-800',
                      )}
                    >
                      {t.name}
                    </span>
                    {t.status === 'failed' && (
                      <Textarea
                        placeholder="Descreva o erro encontrado detalhadamente..."
                        value={t.notes}
                        onChange={(e) => setNotes(t.id, e.target.value)}
                        className="mt-2 min-h-[80px] text-sm resize-y"
                      />
                    )}
                  </div>
                  <div className="flex bg-white p-1 rounded-lg border border-gray-200 gap-1 shrink-0 h-fit">
                    <Button
                      size="sm"
                      variant={t.status === 'passed' ? 'default' : 'ghost'}
                      className={cn(
                        'h-8 px-3 font-bold text-xs',
                        t.status === 'passed'
                          ? 'bg-[#4CAF50] hover:bg-[#4CAF50]'
                          : 'text-gray-500 hover:text-[#4CAF50]',
                      )}
                      onClick={() => setStatus(t.id, 'passed')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> PASSOU
                    </Button>
                    <Button
                      size="sm"
                      variant={t.status === 'failed' ? 'default' : 'ghost'}
                      className={cn(
                        'h-8 px-3 font-bold text-xs',
                        t.status === 'failed'
                          ? 'bg-[#EF4444] hover:bg-[#EF4444]'
                          : 'text-gray-500 hover:text-[#EF4444]',
                      )}
                      onClick={() => setStatus(t.id, 'failed')}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" /> FALHOU
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
