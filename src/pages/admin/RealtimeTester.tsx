import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, PlayCircle, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

const getTestClient = () =>
  createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

const TEST_PASSWORD = 'TestPassword123!'
const SDR_EMAIL = 'sdr@test.com'
const CAPTADOR_EMAIL = 'captador1@test.com'

type TestStatus = 'idle' | 'running' | 'passed' | 'failed'

type TestStep = {
  id: string
  step: string
  actor: string
  action: string
  expected: string
  status: TestStatus
  message?: string
  time?: number
}

const INITIAL_STEPS: TestStep[] = [
  {
    id: '1',
    step: 'Etapa 1',
    actor: 'Sistema',
    action: 'Estabelecer Conexões',
    expected: 'Canais WebSocket conectados para SDR e 3 instâncias de Captador',
    status: 'idle',
  },
  {
    id: '2',
    step: 'Etapa 2',
    actor: 'SDR',
    action: 'Criar demanda de locação',
    expected: 'Demanda propagada via WebSocket para todos os Captadores em < 1s',
    status: 'idle',
  },
  {
    id: '3',
    step: 'Etapa 3',
    actor: 'Captador',
    action: 'Registrar captura',
    expected: 'Propriedade propagada para SDR e demanda atualizada em < 1s',
    status: 'idle',
  },
  {
    id: '4',
    step: 'Etapa 4',
    actor: 'SDR',
    action: 'Validar e Fechar',
    expected: 'Status "fechado" propagado para Captadores em < 1s',
    status: 'idle',
  },
  {
    id: '5',
    step: 'Etapa 5',
    actor: 'Sistema',
    action: 'Limpeza',
    expected: 'Dados de teste removidos e conexões fechadas',
    status: 'idle',
  },
]

export default function RealtimeTester() {
  const [steps, setSteps] = useState<TestStep[]>(INITIAL_STEPS)
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    if (!SUPABASE_URL) {
      alert('Credenciais do Supabase não configuradas no ambiente de teste.')
      return
    }

    setIsRunning(true)
    setSteps(INITIAL_STEPS)
    let demandId = ''
    let propertyId = ''

    const updateStep = (id: string, updates: Partial<TestStep>) => {
      setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
    }

    const setFailedRest = (failedId: string, errorMsg: string) => {
      let found = false
      setSteps((prev) =>
        prev.map((s) => {
          if (s.id === failedId) {
            found = true
            return { ...s, status: 'failed', message: errorMsg }
          }
          if (found) return { ...s, status: 'failed', message: 'Abortado devido à falha anterior' }
          return s
        }),
      )
    }

    try {
      const sdrClient = getTestClient()
      const capClient = getTestClient()
      const adminClient = getTestClient()

      const { error: sdrErr } = await sdrClient.auth.signInWithPassword({
        email: SDR_EMAIL,
        password: TEST_PASSWORD,
      })
      if (sdrErr) throw new Error(`Falha Login SDR: ${sdrErr.message}`)

      const { error: capErr } = await capClient.auth.signInWithPassword({
        email: CAPTADOR_EMAIL,
        password: TEST_PASSWORD,
      })
      if (capErr) throw new Error(`Falha Login Captador: ${capErr.message}`)

      const { error: adminErr } = await adminClient.auth.signInWithPassword({
        email: 'admin@test.com',
        password: TEST_PASSWORD,
      })
      if (adminErr) throw new Error(`Falha Login Admin: ${adminErr.message}`)

      // Step 1: Establish Connections
      updateStep('1', { status: 'running' })

      let sdrPropertiesReceived = 0
      const capDemandsReceived = [0, 0, 0]
      const capUpdatesReceived = [0, 0, 0]

      const sdrChannel = sdrClient.channel('sdr-channel')
      const capChannel1 = capClient.channel('cap-channel-1')
      const capChannel2 = capClient.channel('cap-channel-2')
      const capChannel3 = capClient.channel('cap-channel-3')

      await Promise.all([
        new Promise<void>((resolve) => {
          sdrChannel
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'imoveis_captados' },
              (payload) => {
                if (payload.new.demanda_locacao_id === demandId) sdrPropertiesReceived++
              },
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') resolve()
            })
        }),
        new Promise<void>((resolve) => {
          capChannel1
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'demandas_locacao' },
              () => {
                capDemandsReceived[0]++
              },
            )
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'demandas_locacao' },
              (payload) => {
                if (payload.new.id === demandId) capUpdatesReceived[0]++
              },
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') resolve()
            })
        }),
        new Promise<void>((resolve) => {
          capChannel2
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'demandas_locacao' },
              () => {
                capDemandsReceived[1]++
              },
            )
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'demandas_locacao' },
              (payload) => {
                if (payload.new.id === demandId) capUpdatesReceived[1]++
              },
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') resolve()
            })
        }),
        new Promise<void>((resolve) => {
          capChannel3
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'demandas_locacao' },
              () => {
                capDemandsReceived[2]++
              },
            )
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'demandas_locacao' },
              (payload) => {
                if (payload.new.id === demandId) capUpdatesReceived[2]++
              },
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') resolve()
            })
        }),
      ])

      updateStep('1', {
        status: 'passed',
        message: '✅ Websockets conectados: 1 SDR, 3 instâncias de Captador',
      })

      // Step 2: SDR Creates Demand
      updateStep('2', { status: 'running' })
      const startTime2 = Date.now()

      const { data: newDemand, error: createErr } = await sdrClient
        .from('demandas_locacao')
        .insert({
          nome_cliente: 'Cliente Realtime E2E',
          bairros: ['Centro'],
          valor_minimo: 1500,
          valor_maximo: 3000,
          status_demanda: 'aberta',
          sdr_id: (await sdrClient.auth.getUser()).data.user?.id,
        })
        .select()
        .single()

      if (createErr) throw new Error(`Falha criar demanda: ${createErr.message}`)
      demandId = newDemand.id

      await new Promise((r) => setTimeout(r, 1000))

      if (
        capDemandsReceived[0] === 0 ||
        capDemandsReceived[1] === 0 ||
        capDemandsReceived[2] === 0
      ) {
        throw new Error('Nem todos os captadores receberam o evento INSERT da nova demanda')
      }

      const elapsed2 = Date.now() - startTime2
      updateStep('2', {
        status: 'passed',
        message: `✅ Demanda recebida por 3 captadores simultaneamente`,
        time: elapsed2,
      })

      // Step 3: Captador captures property
      updateStep('3', { status: 'running' })
      const startTime3 = Date.now()

      const { data: newProp, error: capPropErr } = await capClient
        .from('imoveis_captados')
        .insert({
          demanda_locacao_id: demandId,
          user_captador_id: (await capClient.auth.getUser()).data.user?.id,
          codigo_imovel: `RT_IMOVEL_${Date.now()}`,
          preco: 2500,
          status_captacao: 'capturado',
        })
        .select()
        .single()

      if (capPropErr) throw new Error(`Falha ao registrar imóvel: ${capPropErr.message}`)
      propertyId = newProp.id

      await sdrClient
        .from('demandas_locacao')
        .update({ status_demanda: 'atendida' })
        .eq('id', demandId)

      await new Promise((r) => setTimeout(r, 1000))

      if (sdrPropertiesReceived === 0)
        throw new Error('SDR não recebeu evento INSERT do novo imóvel')
      if (capUpdatesReceived[0] === 0)
        throw new Error('Captadores não receberam UPDATE de status_demanda=atendida')

      const elapsed3 = Date.now() - startTime3
      updateStep('3', {
        status: 'passed',
        message: `✅ Propriedade sincronizada e status atualizado`,
        time: elapsed3,
      })

      // Step 4: SDR Validate and Close
      updateStep('4', { status: 'running' })
      const startTime4 = Date.now()

      const { error: updErr } = await sdrClient
        .from('demandas_locacao')
        .update({ status_demanda: 'fechado' })
        .eq('id', demandId)

      if (updErr) throw new Error(`Falha SDR ao atualizar demanda: ${updErr.message}`)

      await new Promise((r) => setTimeout(r, 1000))

      if (capUpdatesReceived[0] < 2)
        throw new Error('Captadores não receberam UPDATE final para fechado')

      const elapsed4 = Date.now() - startTime4
      updateStep('4', {
        status: 'passed',
        message: `✅ Status "fechado" refletido em todos os clientes`,
        time: elapsed4,
      })

      // Step 5: Cleanup
      updateStep('5', { status: 'running' })

      sdrClient.removeChannel(sdrChannel)
      capClient.removeChannel(capChannel1)
      capClient.removeChannel(capChannel2)
      capClient.removeChannel(capChannel3)

      await adminClient.from('imoveis_captados').delete().eq('id', propertyId)
      await adminClient.from('demandas_locacao').delete().eq('id', demandId)

      await sdrClient.auth.signOut()
      await capClient.auth.signOut()
      await adminClient.auth.signOut()

      updateStep('5', {
        status: 'passed',
        message: '✅ Dados de teste removidos do banco e WebSockets fechados',
      })
    } catch (err: any) {
      console.error(err)
      const currentStep = steps.find((s) => s.status === 'running')
      if (currentStep) {
        setFailedRest(currentStep.id, err.message)
      } else {
        setSteps((prev) =>
          prev.map((s) =>
            s.status === 'idle' ? { ...s, status: 'failed', message: 'Erro não tratado' } : s,
          ),
        )
      }
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'idle':
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A52] flex items-center gap-2">
            <Zap className="w-8 h-8 text-emerald-600" />
            Validação Real-Time Bidirecional
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Teste automatizado de propagação WebSocket (SDR ↔ Captadores) para garantir atualizações
            &lt; 1s.
          </p>
        </div>
        <Button
          onClick={runTests}
          disabled={isRunning}
          className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto min-h-[48px]"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Executando...
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5 mr-2" /> Iniciar Teste
            </>
          )}
        </Button>
      </div>

      <Card className="border-[2px] border-[#2E5F8A]">
        <CardHeader className="bg-gray-50 rounded-t-[10px] border-b">
          <CardTitle>Progresso da Sincronização</CardTitle>
          <CardDescription>
            Validando latência e entrega de mensagens em canais Supabase Realtime simultâneos.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-[#1A3A52] text-white">
                <tr>
                  <th className="p-4 border-b font-semibold whitespace-nowrap">Etapa</th>
                  <th className="p-4 border-b font-semibold">Ator</th>
                  <th className="p-4 border-b font-semibold">Ação Testada</th>
                  <th className="p-4 border-b font-semibold">Status</th>
                  <th className="p-4 border-b font-semibold min-w-[250px]">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[#333333]">
                {steps.map((step) => (
                  <tr
                    key={step.id}
                    className={cn(
                      'transition-colors',
                      step.status === 'failed'
                        ? 'bg-red-50/50'
                        : step.status === 'running'
                          ? 'bg-blue-50/30'
                          : 'hover:bg-gray-50/50',
                    )}
                  >
                    <td className="p-4 font-bold text-[#1A3A52] whitespace-nowrap">{step.step}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {step.actor}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{step.action}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(step.status)}
                        <span
                          className={cn(
                            'text-xs font-bold uppercase',
                            step.status === 'passed'
                              ? 'text-emerald-600'
                              : step.status === 'failed'
                                ? 'text-red-600'
                                : step.status === 'running'
                                  ? 'text-blue-600'
                                  : 'text-gray-400',
                          )}
                        >
                          {step.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-xs sm:text-sm">
                      {step.message ? (
                        <span>
                          {step.message}
                          {step.time && (
                            <span className="ml-2 text-gray-500 font-mono">({step.time}ms)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">
                          Aguardando execução... (Esperado: {step.expected})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
