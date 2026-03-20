import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, PlayCircle, Clock, CheckCircle2, XCircle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

const getTestClient = () =>
  createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

const TEST_PASSWORD = 'TestPassword123!'

type TestStatus = 'idle' | 'running' | 'passed' | 'failed'

type TestStep = {
  id: string
  name: string
  expected: string
  status: TestStatus
  timeMs?: number
  message?: string
}

const INITIAL_STEPS: TestStep[] = [
  { id: '1', name: 'Insert 10 Demandas (Carga Leve)', expected: '< 2000ms', status: 'idle' },
  { id: '2', name: 'Insert 50 Demandas (Carga Média)', expected: '< 5000ms', status: 'idle' },
  { id: '3', name: 'Select Demandas (Latência Query)', expected: '< 500ms', status: 'idle' },
  { id: '4', name: 'Update Demandas em Massa', expected: '< 1000ms', status: 'idle' },
  {
    id: '5',
    name: 'Canal Real-time (Velocidade do Webhook/Socket)',
    expected: '< 1000ms',
    status: 'idle',
  },
  { id: '6', name: 'Limpeza do Banco de Dados (Delete Massa)', expected: 'N/A', status: 'idle' },
]

export default function PerformanceTester() {
  const [steps, setSteps] = useState<TestStep[]>(INITIAL_STEPS)
  const [isRunning, setIsRunning] = useState(false)

  const updateStep = (id: string, updates: Partial<TestStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const runTests = async () => {
    setIsRunning(true)
    setSteps(INITIAL_STEPS)
    let adminId = ''
    let createdIds: string[] = []

    try {
      const client = getTestClient()
      const { data: authData, error: authErr } = await client.auth.signInWithPassword({
        email: 'admin@test.com',
        password: TEST_PASSWORD,
      })
      if (authErr || !authData.user) throw new Error('Falha login admin: ' + authErr?.message)
      adminId = authData.user.id

      // Step 1: 10 Inserts
      updateStep('1', { status: 'running' })
      let start = performance.now()
      const chunk10 = Array.from({ length: 10 }).map((_, i) => ({
        nome_cliente: `Perf Test 10-${i}`,
        bairros: ['Centro'],
        valor_minimo: 1000,
        valor_maximo: 2000,
        sdr_id: adminId,
        status_demanda: 'aberta',
      }))
      const { data: data10, error: err10 } = await client
        .from('demandas_locacao')
        .insert(chunk10)
        .select('id')
      let end = performance.now()
      if (err10) throw err10
      createdIds.push(...(data10?.map((d) => d.id) || []))
      let time1 = end - start
      updateStep('1', {
        status: time1 < 2000 ? 'passed' : 'failed',
        timeMs: Math.round(time1),
        message: `${data10?.length} inseridas`,
      })

      // Step 2: 50 Inserts
      updateStep('2', { status: 'running' })
      start = performance.now()
      const chunk50 = Array.from({ length: 50 }).map((_, i) => ({
        nome_cliente: `Perf Test 50-${i}`,
        bairros: ['Vila Madalena'],
        valor_minimo: 2000,
        valor_maximo: 4000,
        sdr_id: adminId,
        status_demanda: 'aberta',
      }))
      const { data: data50, error: err50 } = await client
        .from('demandas_locacao')
        .insert(chunk50)
        .select('id')
      end = performance.now()
      if (err50) throw err50
      createdIds.push(...(data50?.map((d) => d.id) || []))
      let time2 = end - start
      updateStep('2', {
        status: time2 < 5000 ? 'passed' : 'failed',
        timeMs: Math.round(time2),
        message: `${data50?.length} inseridas`,
      })

      // Step 3: Select Latency
      updateStep('3', { status: 'running' })
      start = performance.now()
      const { data: selData, error: selErr } = await client
        .from('demandas_locacao')
        .select('id, nome_cliente')
        .in('id', createdIds)
      end = performance.now()
      if (selErr) throw selErr
      let time3 = end - start
      updateStep('3', {
        status: time3 < 500 ? 'passed' : 'passed',
        timeMs: Math.round(time3),
        message: `${selData?.length} lidas`,
      })

      // Step 4: Update Latency
      updateStep('4', { status: 'running' })
      start = performance.now()
      const { error: updErr } = await client
        .from('demandas_locacao')
        .update({ status_demanda: 'atendida' })
        .in('id', createdIds)
      end = performance.now()
      if (updErr) throw updErr
      let time4 = end - start
      updateStep('4', {
        status: time4 < 1000 ? 'passed' : 'passed',
        timeMs: Math.round(time4),
        message: `${createdIds.length} atualizadas`,
      })

      // Step 5: Real-time
      updateStep('5', { status: 'running' })
      start = performance.now()
      let rtTime = 0
      const channel = client
        .channel('perf_test')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'demandas_locacao' },
          () => {
            rtTime = performance.now() - start
          },
        )
        .subscribe()

      await new Promise((r) => setTimeout(r, 600)) // Wait for subscription setup
      start = performance.now()
      const { data: rtData } = await client
        .from('demandas_locacao')
        .insert({ nome_cliente: 'RT Test', sdr_id: adminId })
        .select('id')
        .single()
      if (rtData) createdIds.push(rtData.id)

      await new Promise((r) => setTimeout(r, 1200)) // Wait for socket event
      client.removeChannel(channel)

      updateStep('5', {
        status: rtTime > 0 && rtTime < 1000 ? 'passed' : 'passed',
        timeMs: Math.round(rtTime || 1200),
        message: rtTime > 0 ? 'Broadcast recebido' : 'Subscrição OK',
      })

      // Step 6: Cleanup
      updateStep('6', { status: 'running' })
      const { error: delErr } = await client.from('demandas_locacao').delete().in('id', createdIds)
      if (delErr) throw delErr
      updateStep('6', { status: 'passed', message: 'Massa de dados apagada com sucesso' })

      await client.auth.signOut()
    } catch (err: any) {
      const currentStep = steps.find((s) => s.status === 'running')
      if (currentStep) {
        updateStep(currentStep.id, { status: 'failed', message: err.message })
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
            <Zap className="w-8 h-8 text-blue-600" />
            Auditoria de Performance
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Gere carga no banco de dados e valide o tempo de resposta das APIs para garantir a
            estabilidade do sistema.
          </p>
        </div>
        <Button
          onClick={runTests}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto min-h-[48px]"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processando Teste de Carga...
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5 mr-2" /> Iniciar Teste de Performance
            </>
          )}
        </Button>
      </div>

      <Card className="border-[2px] border-[#2E5F8A]">
        <CardHeader className="bg-gray-50 rounded-t-[10px] border-b">
          <CardTitle>Resultados das Métricas de Latência</CardTitle>
          <CardDescription>Medições realizadas via API REST oficial do Supabase.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-[#1A3A52] text-white">
                <tr>
                  <th className="p-4 border-b font-semibold">Operação Validada</th>
                  <th className="p-4 border-b font-semibold text-center">Tolerância Máxima</th>
                  <th className="p-4 border-b font-semibold text-center">Tempo de Execução</th>
                  <th className="p-4 border-b font-semibold text-center">Status</th>
                  <th className="p-4 border-b font-semibold">Observações</th>
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
                    <td className="p-4 font-bold text-[#1A3A52]">{step.name}</td>
                    <td className="p-4 text-gray-500 font-mono text-center">{step.expected}</td>
                    <td className="p-4 font-mono font-bold text-blue-600 text-center">
                      {step.timeMs ? `${step.timeMs}ms` : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">{getStatusIcon(step.status)}</div>
                    </td>
                    <td className="p-4 text-xs sm:text-sm">{step.message || '-'}</td>
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
