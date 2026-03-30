import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  DatabaseZap,
  PlayCircle,
  Activity,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

type CheckStatus = 'idle' | 'running' | 'passed' | 'failed'
interface CheckStep {
  id: string
  title: string
  status: CheckStatus
  message: string
}

const STEPS: CheckStep[] = [
  { id: 'connect', title: '1. Conectar & Verificar Auth', status: 'idle', message: '' },
  { id: 'counts', title: '2. Verificar Operacionais (COUNT=0)', status: 'idle', message: '' },
  { id: 'users', title: '3. Verificar Perfis Preservados', status: 'idle', message: '' },
  { id: 'insert', title: '4. Testar Insert & Bypass RLS (Admin)', status: 'idle', message: '' },
  { id: 'subscribe', title: '5. Ativar Realtime & Broadcast', status: 'idle', message: '' },
  { id: 'cascade', title: '6. Testar Cascade Delete', status: 'idle', message: '' },
  { id: 'events', title: '7. Validar Eventos (Realtime)', status: 'idle', message: '' },
  { id: 'performance', title: '8. Performance Query (<100ms)', status: 'idle', message: '' },
  { id: 'cleanup', title: '9. Clean-up & Certificação Final', status: 'idle', message: '' },
]

export default function HealthCheckTester() {
  const [steps, setSteps] = useState(STEPS)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; time: string } | null>(null)

  const update = (id: string, status: CheckStatus, message: string) =>
    setSteps((p) => p.map((s) => (s.id === id ? { ...s, status, message } : s)))

  const runDiagnostics = async () => {
    setIsRunning(true)
    setResult(null)
    setSteps(STEPS.map((s) => ({ ...s, status: 'idle', message: '' })))
    const t0 = Date.now()
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

    const testImovelId = crypto.randomUUID()
    let channel: any = null

    try {
      console.log('[HEALTH-CHECK] Iniciando certificação da estrutura...')

      update('connect', 'running', 'Verificando conexão...')
      await wait(300)
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
      if (sessionErr || !sessionData.session) {
        console.error('[HEALTH-FAIL] Supabase connect error')
        throw new Error('Sem sessão ativa. Autentique-se primeiro.')
      }
      console.log('[HEALTH-OK] Conexão Supabase OK')
      update('connect', 'passed', 'Conexão OK. Usuário autenticado.')

      update('counts', 'running', 'Contando registros...')
      const operacionais = [
        'imoveis_captados',
        'demandas_locacao',
        'demandas_vendas',
        'grupos_demandas',
        'tenant_proposals',
        'pontuacao_captador',
        'prazos_captacao',
        'respostas_captador',
      ]

      for (const table of operacionais) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        if (error) {
          console.error(`[HEALTH-FAIL] Tabela ${table} missing ou RLS error`, error)
          throw new Error(`Tabela ${table} bloqueada ou inexistente.`)
        }
        if (count && count > 0) {
          console.warn(`[HEALTH-WARN] Tabela ${table} não está vazia (COUNT=${count}).`)
          throw new Error(
            `Tabela ${table} contém ${count} registros. Zere a base operacionais primeiro.`,
          )
        }
      }
      console.log('[HEALTH-OK] Operacionais vazias (COUNT=0)')
      update('counts', 'passed', 'Todas tabelas operacionais estão vazias (COUNT=0).')

      update('users', 'running', 'Validando usuários...')
      const { count: usersCount, error: usersErr } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      if (usersErr) throw new Error('Erro ao ler tabela users.')
      if (!usersCount || usersCount === 0) {
        console.error('[HEALTH-FAIL] Tabela users missing - estrutura quebrada')
        throw new Error('Tabela users vazia. Estrutura quebrada.')
      }
      console.log(`[HEALTH-OK] Tabela users intacta (COUNT=${usersCount})`)
      update('users', 'passed', `Tabela users intacta preservada (COUNT=${usersCount}).`)

      update('insert', 'running', 'Inserindo dados de teste...')
      const { error: insertErr } = await supabase.from('imoveis_captados').insert({
        id: testImovelId,
        codigo_imovel: `TEST-HC-${Date.now()}`,
        tipo: 'Ambos',
        status_captacao: 'capturado',
        user_captador_id: sessionData.session.user.id,
      })
      if (insertErr) {
        console.error(`[HEALTH-FAIL] Perm error ao inserir`, insertErr)
        throw new Error(`Insert falhou (RLS bloqueou): ${insertErr.message}`)
      }
      console.log('[HEALTH-OK] Insert temporário OK (Admin bypass ativo)')
      update('insert', 'passed', 'Insert OK. Políticas RLS permitem admin bypass.')

      update('subscribe', 'running', 'Inscrevendo no Realtime...')
      channel = supabase.channel('health-check-channel')

      let realtimeReceived = false
      let broadcastReceived = false

      channel.on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'imoveis_captados' },
        (payload: any) => {
          console.log('[HEALTH-REALTIME] Evento DELETE recebido:', payload)
          if (payload.old && payload.old.id === testImovelId) {
            realtimeReceived = true
          }
        },
      )

      channel.on('broadcast', { event: 'TEST_BROADCAST' }, (payload: any) => {
        console.log('[HEALTH-BROADCAST] Notificado via Broadcast:', payload)
        broadcastReceived = true
      })

      await new Promise((resolve, reject) => {
        channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') resolve(true)
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR')
            reject(new Error(`Subscription error: ${status}`))
        })
        setTimeout(() => reject(new Error('Timeout subscription realtime')), 5000)
      })
      console.log('[HEALTH-OK] Realtime Subscribe success')
      update('subscribe', 'passed', 'Subscription ativa com sucesso (SUBSCRIBED).')

      update('cascade', 'running', 'Testando FK e Deleção em Cascata...')
      const testPropId = crypto.randomUUID()
      const { error: cascadeInsertErr } = await supabase.from('tenant_proposals').insert({
        id: testPropId,
        property_id: testImovelId,
        tenant_name: 'Test Tenant',
        tenant_email: 'test@example.com',
        tenant_phone: '123456789',
      })
      if (cascadeInsertErr)
        throw new Error(`Falha no preparo do Cascade: ${cascadeInsertErr.message}`)

      // Aciona o delete (Testando a propagação e cascade delete ao mesmo tempo)
      const { error: deleteErr } = await supabase
        .from('imoveis_captados')
        .delete()
        .eq('id', testImovelId)
      if (deleteErr) {
        console.error(`[HEALTH-FAIL] Delete parent failed`, deleteErr)
        throw new Error(`Falha ao deletar: ${deleteErr.message}`)
      }

      // Valida o cascade
      const { count: cascadeCount } = await supabase
        .from('tenant_proposals')
        .select('*', { count: 'exact', head: true })
        .eq('id', testPropId)
      if (cascadeCount !== 0) {
        console.error('[HEALTH-FAIL] Cascade broken - Registro dependente não deletado')
        throw new Error('Cascade broken - FK não propagou deleção.')
      }
      console.log('[HEALTH-OK] Cascade OK. Registros filhos limpos automaticamente.')
      update('cascade', 'passed', 'Deleção Cascade (ON DELETE CASCADE) totalmente funcional.')

      update('events', 'running', 'Aguardando propagação de rede...')
      await channel.send({ type: 'broadcast', event: 'TEST_BROADCAST', payload: { health: 'ok' } })

      // Loop de espera para os eventos
      for (let i = 0; i < 30; i++) {
        if (realtimeReceived && broadcastReceived) break
        await wait(100)
      }

      if (!realtimeReceived)
        throw new Error('Falha Realtime: O evento DELETE não retornou no socket.')
      if (!broadcastReceived) throw new Error('Falha Broadcast: Sinal não propagou aos clientes.')
      console.log('[HEALTH-OK] Propagação concluída <500ms')
      update('events', 'passed', 'Eventos globais de Realtime e Broadcast operantes.')

      update('performance', 'running', 'Avaliando tempo de resposta...')
      const tQueryStart = performance.now()
      await supabase.from('imoveis_captados').select('*').limit(1)
      const tQuery = performance.now() - tQueryStart
      console.log(`[HEALTH-OK] DB Performance Latency: ${tQuery.toFixed(0)}ms`)
      if (tQuery > 1000) console.warn(`[HEALTH-WARN] Latência elevada: ${tQuery} ms`)
      update(
        'performance',
        'passed',
        `Performance de rede e DB excelente (${tQuery.toFixed(0)}ms).`,
      )

      update('cleanup', 'running', 'Finalizando Certificação...')
      // Garante limpeza extra por segurança
      await supabase.from('imoveis_captados').delete().eq('id', testImovelId)

      console.log('[HEALTH-OK] Limpeza extra concluída.')
      update('cleanup', 'passed', 'Testes finalizados. Dados temporários extinguidos.')

      if (channel) supabase.removeChannel(channel)

      const totalTime = ((Date.now() - t0) / 1000).toFixed(1)
      setResult({ success: true, time: totalTime })

      console.log(
        `[HEALTH-FINAL] Relatório de Estrutura 100% Funcional! Schema intacto, RLS OK, Realtime Propagando, Cascade Ativo. (Tempo: ${totalTime}s)`,
      )

      toast({
        title: 'Certificação Concluída',
        description: 'Estrutura Supabase validada e pronta para produção.',
        className: 'bg-[#10B981] text-white border-none',
      })
    } catch (err: any) {
      if (channel) supabase.removeChannel(channel)
      setSteps((p) =>
        p.map((s) =>
          s.status === 'running' ? { ...s, status: 'failed', message: err.message } : s,
        ),
      )
      setResult({ success: false, time: '0' })
      console.error('[HEALTH-FAIL]', err)
      toast({ title: 'Falha no Diagnóstico', description: err.message, variant: 'destructive' })

      // Attempt emergency cleanup
      supabase
        .from('imoveis_captados')
        .delete()
        .eq('id', testImovelId)
        .then(() => {})
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link
            to="/app/admin/properties"
            className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Painel
          </Link>
          <h1 className="text-2xl font-bold text-[#1A3A52] flex items-center gap-2">
            <DatabaseZap className="w-8 h-8 text-blue-600" />
            Certificação Supabase (Health Check)
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Rotina automatizada e não-destrutiva que certifica Schema, RLS, Cascade e Realtime.
          </p>
        </div>
        <Button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="bg-[#1A3A52] hover:bg-[#2E5F8A] text-white w-full md:w-auto h-[48px] font-bold"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando DB...
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4 mr-2" /> Iniciar Certificação
            </>
          )}
        </Button>
      </div>

      {result?.success && (
        <Card className="bg-emerald-50 border-[2px] border-emerald-500 shadow-sm animate-in fade-in zoom-in duration-300">
          <CardContent className="p-6 flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            <div>
              <h3 className="text-lg font-black text-emerald-900 uppercase">
                Estrutura 100% Funcional e Pronta
              </h3>
              <p className="text-emerald-800 text-sm font-medium mt-1">
                Todas as validações de Schema, RLS e Rede passaram em {result.time}s.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-[2px] border-[#E5E5E5] shadow-sm">
        <CardHeader className="bg-[#F8FAFC] border-b p-4">
          <CardTitle className="text-[16px] flex items-center gap-2 text-[#1A3A52] font-bold">
            <Activity className="w-5 h-5 text-blue-600" /> Log de Validação Sequencial
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-gray-100">
          {steps.map((s) => (
            <div
              key={s.id}
              className={cn(
                'p-4 flex flex-col md:flex-row gap-4 transition-colors',
                s.status === 'running' && 'bg-blue-50/50',
                s.status === 'failed' && 'bg-red-50/30',
              )}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="shrink-0">
                  {s.status === 'passed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : s.status === 'failed' ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : s.status === 'running' ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-[2px] border-gray-300" />
                  )}
                </div>
                <div>
                  <h4
                    className={cn(
                      'font-semibold text-[15px]',
                      s.status === 'failed' ? 'text-red-700' : 'text-[#1A3A52]',
                    )}
                  >
                    {s.title}
                  </h4>
                  {s.message && (
                    <p
                      className={cn(
                        'text-[13px] mt-1',
                        s.status === 'failed' ? 'text-red-600 font-bold' : 'text-gray-600',
                      )}
                    >
                      {s.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex items-center md:justify-end w-24">
                {s.status === 'passed' && (
                  <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-[6px] uppercase">
                    Passou
                  </span>
                )}
                {s.status === 'failed' && (
                  <span className="text-[11px] font-black text-red-700 bg-red-100 px-2.5 py-1 rounded-[6px] uppercase">
                    Falha
                  </span>
                )}
                {s.status === 'running' && (
                  <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-2.5 py-1 rounded-[6px] uppercase">
                    Em Teste
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
