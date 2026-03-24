import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, XCircle, ClipboardCheck, PlayCircle, Save, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

type TestStatus = 'idle' | 'passed' | 'failed'

interface TestItem {
  id: string
  name: string
  criteria: string[]
  status: TestStatus
  notes: string
}

const INITIAL_TESTS: TestItem[] = [
  {
    id: '1',
    name: 'TESTE 1: Botão "Ver Detalhes"',
    criteria: [
      'Clique abre drawer/modal com informações completas',
      'Drawer mostra: código, localização, preço, dormitórios, etc.',
      'Drawer tem botões de ação (VINCULAR, Ver no site, Compartilhar)',
      'Fechar drawer (X ou clique fora) funciona',
      'Funciona em todos os navegadores, resoluções e perfis',
    ],
    status: 'idle',
    notes: '',
  },
  {
    id: '2',
    name: 'TESTE 2: Botão "VINCULAR"',
    criteria: [
      'Clique abre modal de vinculação de clientes',
      'Modal mostra seletor de cliente e comparação',
      'Botão "Vincular Cliente" funciona',
      'Toast de sucesso aparece e modal fecha',
      'Funciona em todos os navegadores, resoluções e perfis',
    ],
    status: 'idle',
    notes: '',
  },
  {
    id: '3',
    name: 'TESTE 3: Botão "Ver no site"',
    criteria: [
      'Clique abre URL em nova aba',
      'URL segue padrão: https://www.eticimoveis.com.br/imovel/{codigo}',
      'Não substitui página atual',
      'Funciona em todos os navegadores, resoluções e perfis',
    ],
    status: 'idle',
    notes: '',
  },
  {
    id: '4',
    name: 'TESTE 4: Botão "VISITA AGENDADA"',
    criteria: [
      'Clique abre modal de agendamento de visita',
      'Modal mostra seletor de data/hora',
      'Botão "Agendar" funciona e exibe toast de sucesso',
      'Funciona em todos os navegadores, resoluções e perfis',
    ],
    status: 'idle',
    notes: '',
  },
  {
    id: '5',
    name: 'TESTE 5: Botão "Compartilhar"',
    criteria: [
      'Clique copia link para clipboard',
      'Link segue padrão correto com o código do imóvel',
      'Toast de sucesso aparece ("Link copiado!")',
      'Funciona em todos os navegadores, resoluções e perfis',
    ],
    status: 'idle',
    notes: '',
  },
  {
    id: '6',
    name: 'TESTE 6: Validação por Telas',
    criteria: [
      'Botões funcionam em "Minhas Demandas"',
      'Botões funcionam em "Disponível Geral"',
      'Botões funcionam em "Todos Captados"',
      'Botões funcionam em "Últimos Imóveis"',
      'Botões funcionam em "Histórico"',
    ],
    status: 'idle',
    notes: '',
  },
  {
    id: '7',
    name: 'TESTE 7: Validação por Perfis',
    criteria: [
      'Botões funcionam e respeitam permissões do SDR',
      'Botões funcionam e respeitam permissões do Corretor',
      'Botões funcionam e respeitam permissões do Captador',
      'Botões funcionam e respeitam permissões do Admin',
    ],
    status: 'idle',
    notes: '',
  },
  {
    id: '8',
    name: 'TESTE 8: Cross-Browser',
    criteria: [
      'Funciona no Chrome (versão atual)',
      'Funciona no Firefox (versão atual)',
      'Funciona no Safari (versão atual)',
      'Funciona no Edge (versão atual)',
    ],
    status: 'idle',
    notes: '',
  },
  {
    id: '9',
    name: 'TESTE 9: Resoluções (Responsividade)',
    criteria: [
      'Mobile (375px) - Layout e cliques perfeitos',
      'Tablet (768px) - Layout e cliques perfeitos',
      'Desktop (1024px+) - Layout e cliques perfeitos',
      '4K (2560px+) - Layout e cliques perfeitos',
    ],
    status: 'idle',
    notes: '',
  },
  {
    id: '10',
    name: 'TESTE 10: Rede e Offline',
    criteria: [
      'Funciona em rede boa (WiFi)',
      'Funciona em rede instável (4G throttle)',
      'Funciona em rede lenta (3G throttle)',
      'Ações offline sincronizam perfeitamente após reconectar',
    ],
    status: 'idle',
    notes: '',
  },
]

export default function FunctionalTester() {
  const [tests, setTests] = useState<TestItem[]>(() => {
    const saved = localStorage.getItem('sci_functional_tests')
    return saved ? JSON.parse(saved) : INITIAL_TESTS
  })

  useEffect(() => {
    localStorage.setItem('sci_functional_tests', JSON.stringify(tests))
  }, [tests])

  const updateTestStatus = (id: string, status: TestStatus) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  const updateTestNotes = (id: string, notes: string) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, notes } : t)))
  }

  const resetTests = () => {
    if (confirm('Tem certeza que deseja limpar todos os resultados?')) {
      setTests(INITIAL_TESTS)
      toast({ title: 'Testes resetados', description: 'O formulário de QA foi limpo.' })
    }
  }

  const exportReport = () => {
    const reportText = tests
      .map((t) => {
        const statusText =
          t.status === 'passed' ? '✅ PASSED' : t.status === 'failed' ? '❌ FAILED' : '⏳ PENDING'
        return (
          `### ${t.name} - ${statusText}\n` +
          `Critérios:\n${t.criteria.map((c) => `- ${c}`).join('\n')}\n\n` +
          `Notas/Bugs:\n${t.notes || 'Nenhuma nota registrada.'}\n\n` +
          `-----------------------------------------\n`
        )
      })
      .join('\n')

    const blob = new Blob([reportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qa_report_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Relatório Exportado', description: 'Arquivo TXT gerado com sucesso.' })
  }

  const passedCount = tests.filter((t) => t.status === 'passed').length
  const failedCount = tests.filter((t) => t.status === 'failed').length
  const progress = Math.round(((passedCount + failedCount) / tests.length) * 100)

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A52] flex items-center gap-2">
            <ClipboardCheck className="w-8 h-8 text-[#1A3A52]" />
            QA Funcional - Botões e Interações
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base max-w-3xl">
            Checklist de validação 360º para garantir que 100% dos botões operam corretamente em
            todos os cenários, navegadores e redes. Documente falhas para isolamento de bugs.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={resetTests}
            className="w-full md:w-auto font-bold border-[#E5E5E5]"
          >
            <PlayCircle className="w-4 h-4 mr-2" /> Resetar
          </Button>
          <Button
            onClick={exportReport}
            className="w-full md:w-auto font-bold bg-[#1A3A52] text-white hover:bg-[#2E5F8A]"
          >
            <Download className="w-4 h-4 mr-2" /> Exportar Relatório
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-[#E5E5E5]">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-[#1A3A52]">{progress}%</span>
            <span className="text-xs font-bold text-gray-500 uppercase">Progresso do Teste</span>
          </CardContent>
        </Card>
        <Card className="bg-[#F2FBF5] border-[#4CAF50]/30">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-[#4CAF50]">{passedCount}</span>
            <span className="text-xs font-bold text-[#2E7D32] uppercase">Passaram (✅)</span>
          </CardContent>
        </Card>
        <Card className="bg-[#FEF2F2] border-[#EF4444]/30">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-[#EF4444]">{failedCount}</span>
            <span className="text-xs font-bold text-[#B91C1C] uppercase">Falharam (❌)</span>
          </CardContent>
        </Card>
        <Card className="bg-[#F8FAFC] border-[#E5E5E5]">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-[#64748B]">
              {tests.length - (passedCount + failedCount)}
            </span>
            <span className="text-xs font-bold text-[#475569] uppercase">Pendentes (⏳)</span>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {tests.map((test) => (
          <Card
            key={test.id}
            className={cn(
              'border-[2px] transition-all',
              test.status === 'passed'
                ? 'border-[#4CAF50] bg-white shadow-sm'
                : test.status === 'failed'
                  ? 'border-[#EF4444] bg-[#FEF2F2] shadow-sm'
                  : 'border-[#E5E5E5] bg-white',
            )}
          >
            <CardHeader className="p-4 md:p-6 pb-2">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <CardTitle className="text-[18px] font-black text-[#1A3A52]">{test.name}</CardTitle>
                <div className="flex bg-[#F5F5F5] p-1 rounded-[8px] gap-1 shrink-0 w-full md:w-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateTestStatus(test.id, 'passed')}
                    className={cn(
                      'flex-1 md:w-[100px] h-9 font-bold rounded-[6px]',
                      test.status === 'passed'
                        ? 'bg-[#4CAF50] text-white hover:bg-[#4CAF50] hover:text-white'
                        : 'text-gray-500 hover:text-[#4CAF50]',
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Passou
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateTestStatus(test.id, 'failed')}
                    className={cn(
                      'flex-1 md:w-[100px] h-9 font-bold rounded-[6px]',
                      test.status === 'failed'
                        ? 'bg-[#EF4444] text-white hover:bg-[#EF4444] hover:text-white'
                        : 'text-gray-500 hover:text-[#EF4444]',
                    )}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Falhou
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-2 space-y-4">
              <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E5E5E5]">
                <h4 className="text-xs font-bold text-[#64748B] uppercase mb-2">
                  Critérios de Aceite
                </h4>
                <ul className="space-y-1.5">
                  {test.criteria.map((c, i) => (
                    <li key={i} className="text-sm text-[#333333] flex items-start gap-2">
                      <span className="text-[#94A3B8] font-mono mt-0.5">•</span> {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#64748B] uppercase mb-2 flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5" /> Notas de Diagnóstico (Bugs, Dispositivos, Erros)
                </h4>
                <Textarea
                  value={test.notes}
                  onChange={(e) => updateTestNotes(test.id, e.target.value)}
                  placeholder="Ex: No Safari mobile, o toast não apareceu ao compartilhar."
                  className="min-h-[80px] text-sm resize-y"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {progress === 100 && failedCount === 0 && (
        <div className="bg-[#E8F5E9] border-[2px] border-[#4CAF50] rounded-[12px] p-6 mt-6 flex flex-col items-center justify-center text-center animate-fade-in-up shadow-xl">
          <div className="bg-[#4CAF50] w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-[#1A3A52] mb-2">
            SISTEMA 100% VALIDADO PARA PRODUÇÃO
          </h2>
          <p className="text-[#333333] font-medium text-lg max-w-2xl">
            Todos os testes funcionais foram concluídos com sucesso. Os botões estão blindados e
            operando perfeitamente em todas as condições testadas.
          </p>
        </div>
      )}
    </div>
  )
}
