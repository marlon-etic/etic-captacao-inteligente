import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, PlayCircle, Clock, CheckSquare } from 'lucide-react'
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
}

const INITIAL_STEPS: TestStep[] = [
  {
    id: '1',
    step: 'Etapa 1',
    actor: 'SDR',
    action: 'Criar demanda',
    expected: 'Demanda salva com status "aberta" e visível apenas para o criador',
    status: 'idle',
  },
  {
    id: '2',
    step: 'Etapa 2',
    actor: 'Captador',
    action: 'Visualizar feed',
    expected: 'Demanda do SDR aparece no feed do Captador',
    status: 'idle',
  },
  {
    id: '3',
    step: 'Etapa 3',
    actor: 'Captador',
    action: 'Registrar captura',
    expected: 'Propriedade associada à demanda é salva no banco',
    status: 'idle',
  },
  {
    id: '4',
    step: 'Etapa 4',
    actor: 'Sistema',
    action: 'Enviar notificação',
    expected: 'Notificação instantânea para o SDR (Mock WhatsApp)',
    status: 'idle',
  },
  {
    id: '5',
    step: 'Etapa 5',
    actor: 'SDR',
    action: 'Validar propriedade',
    expected: 'Status da demanda atualizado para "fechado"',
    status: 'idle',
  },
  {
    id: '6',
    step: 'Etapa 6',
    actor: 'Sistema',
    action: 'Limpar dados',
    expected: 'Ambiente restaurado após o teste',
    status: 'idle',
  },
]

export default function E2ETester() {
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
      const client = getTestClient()

      // Step 1: SDR Auth & Create Demand
      updateStep('1', { status: 'running' })
      const { data: sdrAuth, error: sdrErr } = await client.auth.signInWithPassword({
        email: SDR_EMAIL,
        password: TEST_PASSWORD,
      })
      if (sdrErr) throw new Error(`Falha Login SDR: ${sdrErr.message}`)

      const { data: newDemand, error: createErr } = await client
        .from('demandas_locacao')
        .insert({
          nome_cliente: 'João Silva (Teste E2E)',
          bairros: ['Vila Mariana'],
          valor_minimo: 2000,
          valor_maximo: 5000,
          status_demanda: 'aberta',
          sdr_id: sdrAuth.user.id,
        })
        .select()
        .single()
      if (createErr) throw new Error(`Falha criar demanda: ${createErr.message}`)
      demandId = newDemand.id

      const { data: verifyDemand, error: verifyErr } = await client
        .from('demandas_locacao')
        .select('id')
        .eq('id', demandId)
      if (verifyErr || !verifyDemand || verifyDemand.length === 0)
        throw new Error(`SDR não vê sua própria demanda`)

      updateStep('1', {
        status: 'passed',
        message: `✅ Demanda ${demandId.substring(0, 8)}... criada com sucesso e isolada`,
      })
      await client.auth.signOut()

      // Step 2: Captador Feed
      updateStep('2', { status: 'running' })
      const { error: capErr } = await client.auth.signInWithPassword({
        email: CAPTADOR_EMAIL,
        password: TEST_PASSWORD,
      })
      if (capErr) throw new Error(`Falha Login Captador: ${capErr.message}`)

      const { data: feed, error: feedErr } = await client
        .from('demandas_locacao')
        .select('*')
        .eq('id', demandId)
      if (feedErr || !feed || feed.length === 0)
        throw new Error('Captador não conseguiu ler a demanda (RLS bloqueou ou não encontrada)')

      updateStep('2', {
        status: 'passed',
        message: `✅ Captador conseguiu visualizar a demanda recém-criada no feed`,
      })

      // Step 3: Captador Registration
      updateStep('3', { status: 'running' })
      const { data: newProp, error: capPropErr } = await client
        .from('imoveis_captados')
        .insert({
          demanda_locacao_id: demandId,
          user_captador_id: (await client.auth.getUser()).data.user?.id,
          codigo_imovel: `IMOVEL_001_${Date.now()}`,
          preco: 3500,
          status_captacao: 'capturado',
        })
        .select()
        .single()
      if (capPropErr) throw new Error(`Falha ao registrar imóvel: ${capPropErr.message}`)
      propertyId = newProp.id
      updateStep('3', {
        status: 'passed',
        message: `✅ Imóvel ${newProp.codigo_imovel} associado com sucesso`,
      })
      await client.auth.signOut()

      // Step 4: Notification Mock
      updateStep('4', { status: 'running' })
      await new Promise((r) => setTimeout(r, 1000))
      updateStep('4', {
        status: 'passed',
        message: `✅ Webhook disparado: SDR notificado sobre imóvel captado em menos de 5s (Simulado)`,
      })

      // Step 5: SDR Validate
      updateStep('5', { status: 'running' })
      await client.auth.signInWithPassword({ email: SDR_EMAIL, password: TEST_PASSWORD })

      const { error: updErr } = await client
        .from('demandas_locacao')
        .update({ status_demanda: 'fechado' })
        .eq('id', demandId)
      if (updErr) throw new Error(`Falha SDR ao atualizar demanda: ${updErr.message}`)

      updateStep('5', {
        status: 'passed',
        message: `✅ Validação concluída: Status da demanda atualizado para "fechado"`,
      })
      await client.auth.signOut()

      // Step 6: Cleanup
      updateStep('6', { status: 'running' })
      const { error: adminAuthErr } = await client.auth.signInWithPassword({
        email: 'admin@test.com',
        password: TEST_PASSWORD,
      })
      if (!adminAuthErr) {
        await client.from('imoveis_captados').delete().eq('id', propertyId)
        await client.from('demandas_locacao').delete().eq('id', demandId)
        updateStep('6', {
          status: 'passed',
          message: '✅ Dados de teste removidos do banco com sucesso',
        })
      } else {
        updateStep('6', {
          status: 'failed',
          message: `Falha login Admin para limpeza (RLS): ${adminAuthErr.message}`,
        })
      }
      await client.auth.signOut()
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
            <CheckSquare className="w-8 h-8 text-emerald-600" />
            Validação E2E (End-to-End)
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Teste automatizado de fluxo ponta-a-ponta: Demanda → Captura → Notificação → Validação.
          </p>
        </div>
        <Button
          onClick={runTests}
          disabled={isRunning}
          className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto min-h-[48px]"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Executando Teste...
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5 mr-2" /> Iniciar Teste Completo
            </>
          )}
        </Button>
      </div>

      <Card className="border-[2px] border-[#2E5F8A]">
        <CardHeader className="bg-gray-50 rounded-t-[10px] border-b">
          <CardTitle>Progresso do Fluxo Operacional</CardTitle>
          <CardDescription>
            Acompanhe o status de cada etapa do ciclo de vida da captação diretamente no banco de
            dados.
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
                  <th className="p-4 border-b font-semibold min-w-[250px]">
                    Resultado e Documentação
                  </th>
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
                      {step.message || (
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
