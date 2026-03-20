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
  { id: 'admin-1', role: 'Admin', name: 'Acesso total a locação (SELECT)', status: 'idle' },
  { id: 'admin-2', role: 'Admin', name: 'Acesso total a vendas (SELECT)', status: 'idle' },
  {
    id: 'sdr-1',
    role: 'SDR',
    name: 'Vê apenas próprias demandas de locação (Isolamento)',
    status: 'idle',
  },
  {
    id: 'sdr-2',
    role: 'SDR',
    name: 'Não vê demandas de vendas (Isolamento de Domínio)',
    status: 'idle',
  },
  {
    id: 'sdr-3',
    role: 'SDR',
    name: 'Não consegue editar demanda de outro (Proteção UPDATE)',
    status: 'idle',
  },
  {
    id: 'sdr-4',
    role: 'SDR',
    name: 'Não consegue deletar demanda de outro (Proteção DELETE)',
    status: 'idle',
  },
  {
    id: 'prop-3',
    role: 'SDR',
    name: 'Não consegue editar propriedades (Proteção UPDATE)',
    status: 'idle',
  },
  {
    id: 'corretor-1',
    role: 'Corretor',
    name: 'Vê apenas próprias demandas de vendas (Isolamento)',
    status: 'idle',
  },
  {
    id: 'corretor-2',
    role: 'Corretor',
    name: 'Não vê demandas de locação (Isolamento de Domínio)',
    status: 'idle',
  },
  {
    id: 'corretor-3',
    role: 'Corretor',
    name: 'Não consegue editar demanda de outro corretor',
    status: 'idle',
  },
  { id: 'captador-1', role: 'Captador', name: 'Vê apenas demandas abertas', status: 'idle' },
  {
    id: 'captador-2',
    role: 'Captador',
    name: 'Não consegue editar demandas (Proteção UPDATE)',
    status: 'idle',
  },
  {
    id: 'captador-3',
    role: 'Captador',
    name: 'Não consegue deletar demandas (Proteção DELETE)',
    status: 'idle',
  },
  {
    id: 'prop-1',
    role: 'Captador',
    name: 'Vê todas as propriedades (Info Pública)',
    status: 'idle',
  },
  {
    id: 'prop-2',
    role: 'Captador',
    name: 'Não consegue editar propriedade de outro',
    status: 'idle',
  },
]

export default function RLSTester() {
  const [tests, setTests] = useState<TestStep[]>(INITIAL_TESTS)
  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (id: string, updates: Partial<TestStep>) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  const runTests = async () => {
    setIsRunning(true)
    setTests(INITIAL_TESTS)

    try {
      // ===== ADMIN TESTS =====
      const adminClient = getTestClient()
      const { error: adminAuthErr } = await adminClient.auth.signInWithPassword({
        email: 'admin@test.com',
        password: TEST_PASSWORD,
      })
      if (adminAuthErr) throw new Error(`Falha login Admin: ${adminAuthErr.message}`)

      updateTest('admin-1', { status: 'running' })
      const { data: adminLoc } = await adminClient.from('demandas_locacao').select('*')
      if (adminLoc && adminLoc.length >= 5) {
        updateTest('admin-1', {
          status: 'passed',
          message: `Sucesso. Retornou ${adminLoc.length} registros.`,
        })
      } else {
        updateTest('admin-1', {
          status: 'failed',
          message: `Retornou ${adminLoc?.length || 0} registros. Esperado >= 5.`,
        })
      }

      updateTest('admin-2', { status: 'running' })
      const { data: adminVen } = await adminClient.from('demandas_vendas').select('*')
      if (adminVen && adminVen.length >= 5) {
        updateTest('admin-2', {
          status: 'passed',
          message: `Sucesso. Retornou ${adminVen.length} registros.`,
        })
      } else {
        updateTest('admin-2', {
          status: 'failed',
          message: `Retornou ${adminVen?.length || 0} registros. Esperado >= 5.`,
        })
      }
      await adminClient.auth.signOut()

      // ===== SDR TESTS =====
      const sdrClient = getTestClient()
      const { error: sdrAuthErr } = await sdrClient.auth.signInWithPassword({
        email: 'sdr@test.com',
        password: TEST_PASSWORD,
      })
      if (sdrAuthErr) throw new Error(`Falha login SDR: ${sdrAuthErr.message}`)

      updateTest('sdr-1', { status: 'running' })
      const { data: sdrLoc } = await sdrClient.from('demandas_locacao').select('*')
      const allSdrMine = sdrLoc?.every((d) => d.sdr_id === '22222222-2222-2222-2222-222222222222')
      if (sdrLoc && sdrLoc.length > 0 && allSdrMine) {
        updateTest('sdr-1', {
          status: 'passed',
          message: `Sucesso. Acessou ${sdrLoc.length} registros próprios isolados.`,
        })
      } else {
        updateTest('sdr-1', {
          status: 'failed',
          message: 'Retornou registros de terceiros ou vazio.',
        })
      }

      updateTest('sdr-2', { status: 'running' })
      const { data: sdrVen } = await sdrClient.from('demandas_vendas').select('*')
      if (!sdrVen || sdrVen.length === 0) {
        updateTest('sdr-2', {
          status: 'passed',
          message: 'Acesso negado com sucesso a demandas de vendas.',
        })
      } else {
        updateTest('sdr-2', {
          status: 'failed',
          message: 'Falha de segurança. SDR acessou vendas.',
        })
      }

      updateTest('sdr-3', { status: 'running' })
      const { data: sdrUpd } = await sdrClient
        .from('demandas_vendas')
        .update({ status_demanda: 'atendida' })
        .eq('id', '66666666-6666-6666-6666-666666666661')
        .select()
      if (!sdrUpd || sdrUpd.length === 0) {
        updateTest('sdr-3', {
          status: 'passed',
          message: 'Modificação bloqueada corretamente pelo RLS.',
        })
      } else {
        updateTest('sdr-3', {
          status: 'failed',
          message: 'Vulnerabilidade: Conseguiu atualizar registro de outro.',
        })
      }

      updateTest('sdr-4', { status: 'running' })
      const { data: sdrDel } = await sdrClient
        .from('demandas_locacao')
        .delete()
        .eq('id', '66666666-6666-6666-6666-666666666661')
        .select()
      if (!sdrDel || sdrDel.length === 0) {
        updateTest('sdr-4', {
          status: 'passed',
          message: 'Deleção bloqueada corretamente pelo RLS.',
        })
      } else {
        updateTest('sdr-4', {
          status: 'failed',
          message: 'Vulnerabilidade: Conseguiu deletar registro.',
        })
      }

      updateTest('prop-3', { status: 'running' })
      const { data: sdrPropUpd } = await sdrClient
        .from('imoveis_captados')
        .update({ preco: 8888 })
        .eq('id', '77777777-7777-7777-7777-777777777771')
        .select()
      if (!sdrPropUpd || sdrPropUpd.length === 0) {
        updateTest('prop-3', {
          status: 'passed',
          message: 'Edição de propriedade bloqueada para SDR.',
        })
      } else {
        updateTest('prop-3', { status: 'failed', message: 'SDR conseguiu editar propriedade.' })
      }
      await sdrClient.auth.signOut()

      // ===== CORRETOR TESTS =====
      const corClient = getTestClient()
      const { error: corAuthErr } = await corClient.auth.signInWithPassword({
        email: 'corretor1@test.com',
        password: TEST_PASSWORD,
      })
      if (corAuthErr) throw new Error(`Falha login Corretor: ${corAuthErr.message}`)

      updateTest('corretor-1', { status: 'running' })
      const { data: corVen } = await corClient.from('demandas_vendas').select('*')
      const allCorMine = corVen?.every(
        (d) => d.corretor_id === '33333333-3333-3333-3333-333333333331',
      )
      if (corVen && corVen.length > 0 && allCorMine) {
        updateTest('corretor-1', {
          status: 'passed',
          message: `Sucesso. Acessou ${corVen.length} registros próprios isolados.`,
        })
      } else {
        updateTest('corretor-1', {
          status: 'failed',
          message: 'Retornou registros de terceiros ou vazio.',
        })
      }

      updateTest('corretor-2', { status: 'running' })
      const { data: corLoc } = await corClient.from('demandas_locacao').select('*')
      if (!corLoc || corLoc.length === 0) {
        updateTest('corretor-2', {
          status: 'passed',
          message: 'Acesso negado com sucesso a demandas de locação.',
        })
      } else {
        updateTest('corretor-2', {
          status: 'failed',
          message: 'Falha de segurança. Corretor acessou locação.',
        })
      }

      updateTest('corretor-3', { status: 'running' })
      const { data: corUpd } = await corClient
        .from('demandas_vendas')
        .update({ status_demanda: 'atendida' })
        .eq('id', '66666666-6666-6666-6666-666666666662')
        .select()
      if (!corUpd || corUpd.length === 0) {
        updateTest('corretor-3', {
          status: 'passed',
          message: 'Modificação de demanda alheia bloqueada.',
        })
      } else {
        updateTest('corretor-3', {
          status: 'failed',
          message: 'Vulnerabilidade: Atualizou demanda de corretor2.',
        })
      }
      await corClient.auth.signOut()

      // ===== CAPTADOR TESTS =====
      const capClient = getTestClient()
      const { error: capAuthErr } = await capClient.auth.signInWithPassword({
        email: 'captador1@test.com',
        password: TEST_PASSWORD,
      })
      if (capAuthErr) throw new Error(`Falha login Captador: ${capAuthErr.message}`)

      updateTest('captador-1', { status: 'running' })
      const { data: capLoc } = await capClient.from('demandas_locacao').select('*')
      const allOpen = capLoc?.every((d) => d.status_demanda === 'aberta')
      const hasClosed = capLoc?.some((d) => d.id === '55555555-5555-5555-5555-555555555554') // This ID is 'atendida'
      if (capLoc && capLoc.length > 0 && allOpen && !hasClosed) {
        updateTest('captador-1', {
          status: 'passed',
          message: `Retornou ${capLoc.length} demandas abertas (ocultou fechadas).`,
        })
      } else {
        updateTest('captador-1', {
          status: 'failed',
          message: 'Retornou demandas com status não permitido.',
        })
      }

      updateTest('captador-2', { status: 'running' })
      const { data: capUpd } = await capClient
        .from('demandas_locacao')
        .update({ status_demanda: 'atendida' })
        .eq('id', '55555555-5555-5555-5555-555555555551')
        .select()
      if (!capUpd || capUpd.length === 0) {
        updateTest('captador-2', {
          status: 'passed',
          message: 'Edição bloqueada (somente leitura).',
        })
      } else {
        updateTest('captador-2', {
          status: 'failed',
          message: 'Vulnerabilidade: Captador conseguiu editar.',
        })
      }

      updateTest('captador-3', { status: 'running' })
      const { data: capDel } = await capClient
        .from('demandas_locacao')
        .delete()
        .eq('id', '55555555-5555-5555-5555-555555555551')
        .select()
      if (!capDel || capDel.length === 0) {
        updateTest('captador-3', {
          status: 'passed',
          message: 'Deleção bloqueada (somente leitura).',
        })
      } else {
        updateTest('captador-3', {
          status: 'failed',
          message: 'Vulnerabilidade: Captador conseguiu deletar.',
        })
      }

      updateTest('prop-1', { status: 'running' })
      const { data: capProps } = await capClient.from('imoveis_captados').select('*')
      if (capProps && capProps.length > 0) {
        updateTest('prop-1', {
          status: 'passed',
          message: `Sucesso. Retornou ${capProps.length} propriedades públicas.`,
        })
      } else {
        updateTest('prop-1', { status: 'failed', message: 'Falha ao acessar propriedades.' })
      }

      updateTest('prop-2', { status: 'running' })
      const { data: capPropUpd } = await capClient
        .from('imoveis_captados')
        .update({ preco: 999999 })
        .eq('id', '77777777-7777-7777-7777-777777777772')
        .select()
      if (!capPropUpd || capPropUpd.length === 0) {
        updateTest('prop-2', {
          status: 'passed',
          message: 'Edição bloqueada corretamente (pertence a outro).',
        })
      } else {
        updateTest('prop-2', {
          status: 'failed',
          message: 'Conseguiu editar propriedade de outro captador.',
        })
      }
      await capClient.auth.signOut()
    } catch (error: any) {
      console.error('Test Execution Error:', error)
      setTests((prev) =>
        prev.map((t) =>
          t.status === 'running' || t.status === 'idle'
            ? { ...t, status: 'failed', message: `Erro na execução: ${error.message}` }
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
            Validação de RLS (Row-Level Security)
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Execute testes automatizados para garantir o isolamento de dados no banco Supabase.
          </p>
        </div>
        <Button
          onClick={runTests}
          disabled={isRunning}
          className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Executando Testes...
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4 mr-2" /> Iniciar Validação
            </>
          )}
        </Button>
      </div>

      <Card className="border-[2px] border-[#2E5F8A]">
        <CardHeader className="bg-gray-50 rounded-t-[10px] border-b">
          <CardTitle>Resultados da Auditoria de Segurança</CardTitle>
          <CardDescription>
            Estes testes realizam chamadas reais à API REST do Supabase utilizando as credenciais de
            teste para simular acessos diretos.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-[#1A3A52] text-white">
                <tr>
                  <th className="p-4 border-b font-semibold whitespace-nowrap">Papel</th>
                  <th className="p-4 border-b font-semibold min-w-[250px]">Teste de Isolamento</th>
                  <th className="p-4 border-b font-semibold text-center whitespace-nowrap">
                    Status
                  </th>
                  <th className="p-4 border-b font-semibold min-w-[250px]">
                    Detalhes / Observações
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
                    <td className="p-4 font-bold text-[#1A3A52]">{test.role}</td>
                    <td className="p-4">{test.name}</td>
                    <td className="p-4">
                      <div className="flex justify-center">{getStatusIcon(test.status)}</div>
                    </td>
                    <td className="p-4 text-xs sm:text-sm">{test.message || '-'}</td>
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
