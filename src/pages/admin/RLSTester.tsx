import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, ShieldCheck, PlayCircle, Clock } from 'lucide-react'
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
  role: string
  name: string
  status: TestStatus
  message?: string
}

const INITIAL_TESTS: TestStep[] = [
  { id: 'sdr-1', role: 'SDR', name: 'SDR A cria demanda 1 (Locação)', status: 'idle' },
  { id: 'sdr-2', role: 'SDR', name: 'SDR B cria demanda 2 (Locação)', status: 'idle' },
  { id: 'sdr-3', role: 'SDR', name: 'SDR A consegue ver demanda 1?', status: 'idle' },
  { id: 'sdr-4', role: 'SDR', name: 'SDR A consegue ver demanda 2?', status: 'idle' },
  { id: 'sdr-5', role: 'SDR', name: 'SDR A consegue editar demanda 2?', status: 'idle' },
  { id: 'sdr-6', role: 'SDR', name: 'SDR A consegue deletar demanda 2?', status: 'idle' },
  { id: 'cor-1', role: 'Corretor', name: 'Corretor A cria demanda 1 (Venda)', status: 'idle' },
  { id: 'cor-2', role: 'Corretor', name: 'Corretor B cria demanda 2 (Venda)', status: 'idle' },
  { id: 'cor-3', role: 'Corretor', name: 'Corretor A consegue ver demanda 1?', status: 'idle' },
  { id: 'cor-4', role: 'Corretor', name: 'Corretor A consegue ver demanda 2?', status: 'idle' },
  { id: 'cor-5', role: 'Corretor', name: 'Corretor A consegue editar demanda 2?', status: 'idle' },
  {
    id: 'cap-1',
    role: 'Captador',
    name: 'Captador consegue ver demanda de SDR A?',
    status: 'idle',
  },
  {
    id: 'cap-2',
    role: 'Captador',
    name: 'Captador consegue ver demanda de Corretor B?',
    status: 'idle',
  },
  {
    id: 'cap-3',
    role: 'Captador',
    name: 'Captador consegue editar demanda de SDR A?',
    status: 'idle',
  },
  {
    id: 'cap-4',
    role: 'Captador',
    name: 'Captador consegue deletar demanda de Corretor B?',
    status: 'idle',
  },
  { id: 'adm-1', role: 'Admin', name: 'Admin consegue ver todas as demandas?', status: 'idle' },
  { id: 'adm-2', role: 'Admin', name: 'Admin consegue editar qualquer demanda?', status: 'idle' },
  { id: 'adm-3', role: 'Admin', name: 'Admin consegue deletar qualquer demanda?', status: 'idle' },
  { id: 'qry-1', role: 'Geral', name: 'Queries diretas limitam resultados? (SDR)', status: 'idle' },
  { id: 'qry-2', role: 'Geral', name: 'UPDATE direto não autorizado falha?', status: 'idle' },
]

export default function RLSTester() {
  const [tests, setTests] = useState<TestStep[]>(INITIAL_TESTS)
  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (id: string, updates: Partial<TestStep>) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  const runTests = async () => {
    setIsRunning(true)
    setTests(INITIAL_TESTS.map((t) => ({ ...t, status: 'idle', message: '' })))

    const getClientAndUser = async (email: string) => {
      const c = getTestClient()
      const {
        data: { user },
        error,
      } = await c.auth.signInWithPassword({ email, password: TEST_PASSWORD })
      if (error)
        throw new Error(
          `Falha login ${email}: Verifique se as migrations de seeds rodaram. (${error.message})`,
        )
      return { client: c, user }
    }

    try {
      // 0. Setup clients (Autenticação isolada)
      const sdrA = await getClientAndUser('sdr_a@test.com')
      const sdrB = await getClientAndUser('sdr_b@test.com')
      const corA = await getClientAndUser('cor_a@test.com')
      const corB = await getClientAndUser('cor_b@test.com')
      const cap = await getClientAndUser('cap@test.com')
      const adm = await getClientAndUser('adm@test.com')

      let demLocA = ''
      let demLocB = ''
      let demVenA = ''
      let demVenB = ''

      // 1. SDR Tests
      updateTest('sdr-1', { status: 'running' })
      const { data: dLA, error: eLA } = await sdrA.client
        .from('demandas_locacao')
        .insert({
          nome_cliente: 'Cliente SDR A',
          status_demanda: 'aberta',
          sdr_id: sdrA.user?.id,
          valor_minimo: 100,
          valor_maximo: 200,
        })
        .select()
        .single()
      if (eLA) throw new Error(eLA.message)
      demLocA = dLA.id
      updateTest('sdr-1', { status: 'passed', message: '✅ SIM' })

      updateTest('sdr-2', { status: 'running' })
      const { data: dLB, error: eLB } = await sdrB.client
        .from('demandas_locacao')
        .insert({
          nome_cliente: 'Cliente SDR B',
          status_demanda: 'aberta',
          sdr_id: sdrB.user?.id,
          valor_minimo: 100,
          valor_maximo: 200,
        })
        .select()
        .single()
      if (eLB) throw new Error(eLB.message)
      demLocB = dLB.id
      updateTest('sdr-2', { status: 'passed', message: '✅ SIM' })

      updateTest('sdr-3', { status: 'running' })
      const { data: seeLA } = await sdrA.client
        .from('demandas_locacao')
        .select('id')
        .eq('id', demLocA)
      if (seeLA && seeLA.length > 0)
        updateTest('sdr-3', { status: 'passed', message: '✅ SIM (Vê própria)' })
      else throw new Error('Falha: Não viu a própria demanda')

      updateTest('sdr-4', { status: 'running' })
      const { data: seeLB } = await sdrA.client
        .from('demandas_locacao')
        .select('id')
        .eq('id', demLocB)
      if (seeLB && seeLB.length === 0)
        updateTest('sdr-4', { status: 'passed', message: '❌ NÃO (Correto, bloqueado pelo RLS)' })
      else throw new Error('Falha de Segurança: Viu demanda de outro usuário')

      updateTest('sdr-5', { status: 'running' })
      const { data: updLB } = await sdrA.client
        .from('demandas_locacao')
        .update({ nome_cliente: 'Hacked' })
        .eq('id', demLocB)
        .select()
      if (!updLB || updLB.length === 0)
        updateTest('sdr-5', { status: 'passed', message: '❌ NÃO (Correto, UPDATE bloqueado)' })
      else throw new Error('Falha Crítica: Conseguiu editar demanda de outro usuário')

      updateTest('sdr-6', { status: 'running' })
      const { data: delLB } = await sdrA.client
        .from('demandas_locacao')
        .delete()
        .eq('id', demLocB)
        .select()
      if (!delLB || delLB.length === 0)
        updateTest('sdr-6', { status: 'passed', message: '❌ NÃO (Correto, DELETE bloqueado)' })
      else throw new Error('Falha Crítica: Conseguiu deletar demanda de outro usuário')

      // 2. Corretor Tests
      updateTest('cor-1', { status: 'running' })
      const { data: dVA, error: eVA } = await corA.client
        .from('demandas_vendas')
        .insert({
          nome_cliente: 'Cliente Cor A',
          status_demanda: 'aberta',
          corretor_id: corA.user?.id,
          valor_minimo: 100,
          valor_maximo: 200,
        })
        .select()
        .single()
      if (eVA) throw new Error(eVA.message)
      demVenA = dVA.id
      updateTest('cor-1', { status: 'passed', message: '✅ SIM' })

      updateTest('cor-2', { status: 'running' })
      const { data: dVB, error: eVB } = await corB.client
        .from('demandas_vendas')
        .insert({
          nome_cliente: 'Cliente Cor B',
          status_demanda: 'aberta',
          corretor_id: corB.user?.id,
          valor_minimo: 100,
          valor_maximo: 200,
        })
        .select()
        .single()
      if (eVB) throw new Error(eVB.message)
      demVenB = dVB.id
      updateTest('cor-2', { status: 'passed', message: '✅ SIM' })

      updateTest('cor-3', { status: 'running' })
      const { data: seeVA } = await corA.client
        .from('demandas_vendas')
        .select('id')
        .eq('id', demVenA)
      if (seeVA && seeVA.length > 0)
        updateTest('cor-3', { status: 'passed', message: '✅ SIM (Vê própria)' })
      else throw new Error('Falha: Não viu a própria demanda')

      updateTest('cor-4', { status: 'running' })
      const { data: seeVB } = await corA.client
        .from('demandas_vendas')
        .select('id')
        .eq('id', demVenB)
      if (seeVB && seeVB.length === 0)
        updateTest('cor-4', { status: 'passed', message: '❌ NÃO (Correto, bloqueado)' })
      else throw new Error('Falha de Segurança: Viu demanda de outro usuário')

      updateTest('cor-5', { status: 'running' })
      const { data: updVB } = await corA.client
        .from('demandas_vendas')
        .update({ nome_cliente: 'Hacked' })
        .eq('id', demVenB)
        .select()
      if (!updVB || updVB.length === 0)
        updateTest('cor-5', { status: 'passed', message: '❌ NÃO (Correto, UPDATE bloqueado)' })
      else throw new Error('Falha Crítica: Conseguiu editar demanda de outro usuário')

      // 3. Captador Tests
      updateTest('cap-1', { status: 'running' })
      const { data: capSeeLA } = await cap.client
        .from('demandas_locacao')
        .select('id')
        .eq('id', demLocA)
      if (capSeeLA && capSeeLA.length > 0)
        updateTest('cap-1', { status: 'passed', message: '✅ SIM (Pública)' })
      else throw new Error('Falha: Captador não viu demanda aberta')

      updateTest('cap-2', { status: 'running' })
      const { data: capSeeVB } = await cap.client
        .from('demandas_vendas')
        .select('id')
        .eq('id', demVenB)
      if (capSeeVB && capSeeVB.length > 0)
        updateTest('cap-2', { status: 'passed', message: '✅ SIM (Pública)' })
      else throw new Error('Falha: Captador não viu demanda aberta')

      updateTest('cap-3', { status: 'running' })
      const { data: capUpdLA } = await cap.client
        .from('demandas_locacao')
        .update({ status_demanda: 'fechado' })
        .eq('id', demLocA)
        .select()
      if (!capUpdLA || capUpdLA.length === 0)
        updateTest('cap-3', { status: 'passed', message: '❌ NÃO (Correto, apenas leitura)' })
      else throw new Error('Falha Crítica: Captador conseguiu editar demanda')

      updateTest('cap-4', { status: 'running' })
      const { data: capDelVB } = await cap.client
        .from('demandas_vendas')
        .delete()
        .eq('id', demVenB)
        .select()
      if (!capDelVB || capDelVB.length === 0)
        updateTest('cap-4', { status: 'passed', message: '❌ NÃO (Correto, apenas leitura)' })
      else throw new Error('Falha Crítica: Captador conseguiu deletar demanda')

      // 4. Admin Tests
      updateTest('adm-1', { status: 'running' })
      const { data: admSeeL } = await adm.client
        .from('demandas_locacao')
        .select('id')
        .in('id', [demLocA, demLocB])
      if (admSeeL && admSeeL.length === 2)
        updateTest('adm-1', { status: 'passed', message: '✅ SIM (Acesso total)' })
      else throw new Error('Falha: Admin não conseguiu ver todas')

      updateTest('adm-2', { status: 'running' })
      const { data: admUpdLA } = await adm.client
        .from('demandas_locacao')
        .update({ observacoes: 'Editado Admin' })
        .eq('id', demLocA)
        .select()
      if (admUpdLA && admUpdLA.length === 1)
        updateTest('adm-2', { status: 'passed', message: '✅ SIM (Autorizado)' })
      else throw new Error('Falha: Admin não conseguiu editar')

      updateTest('adm-3', { status: 'running' })
      const { data: admDelLB } = await adm.client
        .from('demandas_locacao')
        .delete()
        .eq('id', demLocB)
        .select()
      if (admDelLB && admDelLB.length === 1)
        updateTest('adm-3', { status: 'passed', message: '✅ SIM (Autorizado)' })
      else throw new Error('Falha: Admin não conseguiu deletar')

      // 5. Query e Proteção de Dados
      updateTest('qry-1', { status: 'running' })
      const { data: sdrAll } = await sdrA.client.from('demandas_locacao').select('*')
      const otherDemands = sdrAll?.filter((d) => d.sdr_id !== sdrA.user?.id)
      if (!otherDemands || otherDemands.length === 0)
        updateTest('qry-1', {
          status: 'passed',
          message: '✅ SIM (Query global retorna apenas próprios registros)',
        })
      else throw new Error('Falha de Segurança: Query direta expôs dados de outros')

      updateTest('qry-2', { status: 'running' })
      updateTest('qry-2', {
        status: 'passed',
        message: '✅ SIM (Validado com sucesso nos testes sdr-5 e cor-5)',
      })

      // 6. Cleanup Data using Admin
      await adm.client.from('demandas_locacao').delete().eq('id', demLocA)
      await adm.client.from('demandas_vendas').delete().in('id', [demVenA, demVenB])
    } catch (error: any) {
      console.error('Test Execution Error:', error)
      const errMessage = error.message || 'Erro Desconhecido'
      setTests((prev) =>
        prev.map((t) =>
          t.status === 'running' || t.status === 'idle'
            ? { ...t, status: 'failed', message: `Erro: ${errMessage}` }
            : t,
        ),
      )
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
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A52] flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
            Auditoria de Segurança RLS
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Execute testes automatizados que simulam acessos diretos à API do Supabase garantindo o
            isolamento de dados por papel.
          </p>
        </div>
        <Button
          onClick={runTests}
          disabled={isRunning}
          className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto min-h-[48px]"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Validando Segurança...
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4 mr-2" /> Iniciar Auditoria
            </>
          )}
        </Button>
      </div>

      <Card className="border-[2px] border-[#2E5F8A]">
        <CardHeader className="bg-gray-50 rounded-t-[10px] border-b">
          <CardTitle>Resultados da Validação de Isolamento (RLS)</CardTitle>
          <CardDescription>
            Os testes abaixo efetuam chamadas reais ao banco com diferentes sessões JWT, validando
            que um usuário nunca consiga acessar ou modificar dados que não lhe pertencem.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-[#1A3A52] text-white">
                <tr>
                  <th className="p-4 border-b font-semibold whitespace-nowrap w-[15%]">
                    Papel / Ator
                  </th>
                  <th className="p-4 border-b font-semibold w-[40%]">Critério de Aceite Testado</th>
                  <th className="p-4 border-b font-semibold text-center whitespace-nowrap w-[10%]">
                    Status
                  </th>
                  <th className="p-4 border-b font-semibold min-w-[250px] w-[35%]">
                    Resultado da Execução
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y text-[#333333]">
                {tests.map((test) => (
                  <tr
                    key={test.id}
                    className={cn(
                      'transition-colors',
                      test.status === 'failed' ? 'bg-red-50/50' : 'hover:bg-gray-50/50',
                    )}
                  >
                    <td className="p-4 font-bold text-[#1A3A52]">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {test.role}
                      </span>
                    </td>
                    <td className="p-4">{test.name}</td>
                    <td className="p-4">
                      <div className="flex justify-center">{getStatusIcon(test.status)}</div>
                    </td>
                    <td className="p-4 text-xs sm:text-sm">
                      {test.message || (
                        <span className="text-gray-400 italic">Aguardando auditoria...</span>
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
