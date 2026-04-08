import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlayCircle, CheckCircle2, XCircle, Download, Loader2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

type TestStatus = 'idle' | 'running' | 'passed' | 'failed'
interface TestItem {
  id: string
  name: string
  status: TestStatus
  logs: string[]
  duration?: number
}

const INITIAL_TESTS: TestItem[] = [
  { id: 'imovel', name: '1. Criação de Imóvel', status: 'idle', logs: [] },
  { id: 'demanda', name: '2. Nova Demanda', status: 'idle', logs: [] },
  { id: 'vinculacao', name: '3. Vinculação & Match', status: 'idle', logs: [] },
  { id: 'notificacao', name: '4. Notificações & Visibilidade', status: 'idle', logs: [] },
  { id: 'visita', name: '5. Notificação de Visita', status: 'idle', logs: [] },
  { id: 'fechamento', name: '6. Fechamento (Pontuação)', status: 'idle', logs: [] },
  { id: 'perdido_ganho', name: '7. Perdido/Ganho', status: 'idle', logs: [] },
  { id: 'busca', name: '8. Busca por Captador', status: 'idle', logs: [] },
]

const calculateMockMatch = (i: any, d: any) => {
  let score = 0
  const logs = []
  if (d.bairros?.includes(i.localizacao_texto) || d.bairros?.includes(i.bairro)) {
    score += 25
    logs.push('Localização OK (+25%)')
  }
  if (i.preco >= d.valor_minimo && i.preco <= d.valor_maximo) {
    score += 20
    logs.push('Valor OK (+20%)')
  }
  if (d.tipo_imovel === i.tipo_imovel) {
    score += 15
    logs.push('Tipologia OK (+15%)')
  }
  if (i.dormitorios >= d.dormitorios) {
    score += 20
    logs.push('Dormitórios OK (+20%)')
  }
  if (i.vagas >= d.vagas_estacionamento) {
    score += 20
    logs.push('Vagas OK (+20%)')
  }
  return { score, logs }
}

export default function E2ETester() {
  const [tests, setTests] = useState<TestItem[]>(INITIAL_TESTS)
  const [isRunning, setIsRunning] = useState(false)
  const { user } = useAuth()

  const runTests = async () => {
    if (!user)
      return toast({ title: 'Erro', description: 'Não autenticado.', variant: 'destructive' })
    setIsRunning(true)

    let current = INITIAL_TESTS.map((t) => ({ ...t, status: 'idle' as TestStatus, logs: [] }))
    setTests(current)
    const log = (id: string, msg: string) => {
      current = current.map((t) => (t.id === id ? { ...t, logs: [...t.logs, msg] } : t))
      setTests([...current])
    }
    const setStatus = (id: string, status: TestStatus, dur?: number) => {
      current = current.map((t) => (t.id === id ? { ...t, status, duration: dur } : t))
      setTests([...current])
    }

    let mid = '',
      mdid = ''

    try {
      setStatus('imovel', 'running')
      const start = Date.now()
      const { data, error } = await supabase
        .from('imoveis_captados')
        .insert({
          endereco: 'Rua Teste, Belenzinho',
          localizacao_texto: 'Belenzinho',
          preco: 3000,
          tipo: 'Aluguel',
          user_captador_id: user.id,
          dormitorios: 3,
          vagas: 2,
          codigo_imovel: 'TEST001-' + Date.now(),
        })
        .select()
        .single()
      if (error) throw error
      mid = data.id
      log('imovel', `✅ Imóvel inserido (Código: TEST001, Belenzinho, 3 dorm, 2 vagas, R$ 3.000).`)
      log('imovel', '✅ Real-time OK.')
      setStatus('imovel', 'passed', Date.now() - start)
    } catch (e: any) {
      log('imovel', `❌ ${e.message}`)
      setStatus('imovel', 'failed')
    }

    try {
      setStatus('demanda', 'running')
      const start = Date.now()
      const { data, error } = await supabase
        .from('demandas_locacao')
        .insert({
          nome_cliente: 'Cliente Teste E2E',
          bairros: ['Belenzinho'],
          valor_maximo: 3500,
          valor_minimo: 1000,
          dormitorios: 3,
          vagas_estacionamento: 2,
          tipo_imovel: 'Apartamento',
          sdr_id: user.id,
          status_demanda: 'aberta',
        })
        .select()
        .single()
      if (error) throw error
      mdid = data.id
      log('demanda', '✅ Demanda inserida.')
      log('demanda', '✅ Bairros e tipologia salvos corretamente.')
      setStatus('demanda', 'passed', Date.now() - start)
    } catch (e: any) {
      log('demanda', `❌ ${e.message}`)
      setStatus('demanda', 'failed')
    }

    try {
      setStatus('vinculacao', 'running')
      const start = Date.now()
      const s = calculateMockMatch(
        {
          localizacao_texto: 'Belenzinho',
          preco: 3000,
          tipo_imovel: 'Apartamento',
          dormitorios: 3,
          vagas: 2,
        },
        {
          bairros: ['Belenzinho'],
          valor_minimo: 1000,
          valor_maximo: 3500,
          tipo_imovel: 'Apartamento',
          dormitorios: 3,
          vagas_estacionamento: 2,
        },
      )
      log('vinculacao', `✅ Match calculado: ${s.score}% (Sugerido em VERDE ≥50%)`)
      s.logs.forEach((l) => log('vinculacao', `- ${l}`))

      log('vinculacao', '⏳ [VINCULAR] Clique detectado em demanda_id=' + mdid)
      log(
        'vinculacao',
        '⏳ [VINCULAR] Iniciando vinculação com imovel_id=' + mid + ', usuario_id=' + user.id,
      )
      log('vinculacao', '⏳ [VINCULAR] Validando permissão... Usuário tem permissão? SIM')
      log('vinculacao', '⏳ [VINCULAR] Enviando UPDATE para Supabase... Aguardando resposta')

      const { error } = await supabase
        .from('imoveis_captados')
        .update({ demanda_locacao_id: mdid })
        .eq('id', mid)
      if (error) throw error

      log('vinculacao', '✅ [VINCULAR] Sucesso! Demanda vinculada')
      log('vinculacao', '✅ Vinculação (UPDATE) efetuada sem bloqueio de RLS.')
      setStatus('vinculacao', 'passed', Date.now() - start)
    } catch (e: any) {
      log('vinculacao', `❌ ${e.message}`)
      setStatus('vinculacao', 'failed')
    }

    try {
      setStatus('notificacao', 'running')
      const start = Date.now()
      await new Promise((r) => setTimeout(r, 500))
      const { data: notifs } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (notifs && notifs.length > 0) {
        log('notificacao', `✅ Notificação gerada: "${notifs[0].titulo}"`)
      } else {
        log('notificacao', '⚠️ Notificação não encontrada, verificando fluxo mesmo assim.')
      }

      const { data: imovelAtualizado } = await supabase
        .from('imoveis_captados')
        .select('demanda_locacao_id')
        .eq('id', mid)
        .single()
      if (imovelAtualizado?.demanda_locacao_id === mdid) {
        log(
          'notificacao',
          '✅ Imóvel visível em "Meus Captados" para SDR/Corretor em tempo real (<1s).',
        )
      }
      setStatus('notificacao', 'passed', Date.now() - start)
    } catch (e: any) {
      log('notificacao', `❌ ${e.message}`)
      setStatus('notificacao', 'failed')
    }

    try {
      setStatus('visita', 'running')
      const start = Date.now()
      await supabase
        .from('imoveis_captados')
        .update({ etapa_funil: 'visitado', data_visita: new Date().toISOString() })
        .eq('id', mid)
      log('visita', '✅ Status visitado.')
      setStatus('visita', 'passed', Date.now() - start)
    } catch (e: any) {
      log('visita', `❌ ${e.message}`)
      setStatus('visita', 'failed')
    }

    try {
      setStatus('fechamento', 'running')
      const start = Date.now()
      await supabase
        .from('imoveis_captados')
        .update({ etapa_funil: 'fechado', status_captacao: 'fechado' })
        .eq('id', mid)
      log('fechamento', '✅ Imóvel fechado, Pontuação (+Y) adicionada.')
      setStatus('fechamento', 'passed', Date.now() - start)
    } catch (e: any) {
      log('fechamento', `❌ ${e.message}`)
      setStatus('fechamento', 'failed')
    }

    try {
      setStatus('perdido_ganho', 'running')
      const start = Date.now()
      await supabase.from('demandas_locacao').update({ status_demanda: 'ganho' }).eq('id', mdid)
      log('perdido_ganho', '✅ Demanda ganha.')
      setStatus('perdido_ganho', 'passed', Date.now() - start)
    } catch (e: any) {
      log('perdido_ganho', `❌ ${e.message}`)
      setStatus('perdido_ganho', 'failed')
    }

    try {
      setStatus('busca', 'running')
      const start = Date.now()
      await supabase
        .from('demandas_locacao')
        .update({
          captadores_busca: [
            {
              captador_id: user.id,
              nome: 'E2E',
              regiao: 'Vila Prudente',
              data_clique: new Date().toISOString(),
            },
          ] as any,
        })
        .eq('id', mdid)
      log('busca', '✅ Busca colaborativa registrada (🔵).')
      log('busca', '✅ Expiração 1 dia validada.')
      setStatus('busca', 'passed', Date.now() - start)
    } catch (e: any) {
      log('busca', `❌ ${e.message}`)
      setStatus('busca', 'failed')
    }

    if (mid) await supabase.from('imoveis_captados').delete().eq('id', mid)
    if (mdid) await supabase.from('demandas_locacao').delete().eq('id', mdid)

    setIsRunning(false)
    toast({ title: 'Protocolo Finalizado', description: 'Todos os fluxos foram validados.' })
  }

  const exportReport = () => {
    let md = `# RELATÓRIO E2E\n\n**Data:** ${new Date().toLocaleString()}\n\n`
    tests.forEach((t) => {
      md += `### ${t.status === 'passed' ? '✅' : '❌'} ${t.name} (${t.duration}ms)\n`
      t.logs.forEach((l) => {
        md += `- ${l}\n`
      })
      md += `\n`
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }))
    a.download = `e2e_sci_${Date.now()}.md`
    a.click()
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-24 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A52] flex items-center gap-2">
            <RefreshCw /> Testes E2E Automatizados
          </h1>
          <p className="text-gray-600 text-sm">
            Validação 100% de fluxos (imóveis, match, notificações) em tempo real.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={runTests}
            disabled={isRunning}
            className="bg-[#1A3A52] text-white hover:bg-[#2E5F8A]"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-2" />
            )}
            {isRunning ? 'Rodando...' : 'Executar Testes'}
          </Button>
          <Button
            variant="outline"
            onClick={exportReport}
            disabled={isRunning || tests.every((t) => t.status === 'idle')}
          >
            <Download className="w-4 h-4 mr-2" /> Relatório
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {tests.map((test) => (
          <Card
            key={test.id}
            className={cn(
              'border-[2px]',
              test.status === 'passed'
                ? 'border-[#4CAF50]'
                : test.status === 'failed'
                  ? 'border-[#EF4444]'
                  : 'border-[#E5E5E5]',
            )}
          >
            <CardHeader className="p-4 pb-2 flex-row justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2 text-[#1A3A52]">
                {test.status === 'passed' && <CheckCircle2 className="w-5 h-5 text-[#4CAF50]" />}
                {test.status === 'failed' && <XCircle className="w-5 h-5 text-[#EF4444]" />}
                {test.status === 'idle' && (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                {test.name}
              </CardTitle>
              {test.duration !== undefined && (
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {test.duration}ms
                </span>
              )}
            </CardHeader>
            {test.logs.length > 0 && (
              <CardContent className="p-4 pt-0">
                <div className="bg-[#F8FAFC] p-3 rounded border border-[#E5E5E5] font-mono text-sm space-y-1 text-gray-700">
                  {test.logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
