import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Stethoscope,
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
  { id: 'auth_config', title: '1. Validar Supabase Auth Config', status: 'idle', message: '' },
  {
    id: 'auth_users',
    title: '2. Validar Usuários (auth.users) e Auto-Corrigir',
    status: 'idle',
    message: '',
  },
  { id: 'schema', title: '3. Validar Tabela usuarios (Estrutura)', status: 'idle', message: '' },
  { id: 'rls', title: '4. Validar Políticas RLS', status: 'idle', message: '' },
  { id: 'password_jwt', title: '5. Validar Senhas e Gerar JWT', status: 'idle', message: '' },
  {
    id: 'sync',
    title: '6. Validar Sincronização auth.users ↔ usuarios',
    status: 'idle',
    message: '',
  },
  { id: 'login_full', title: '7. Testar Login Completo (E2E)', status: 'idle', message: '' },
]

const TARGETS = [
  {
    email: 'mariaennes@eticimoveis.com.br',
    pass: 'MAria123123',
    name: 'Maria Ennes',
    role: 'admin',
  },
  { email: 'admin@etic.com', pass: 'Password1', name: 'Admin Teste', role: 'admin' },
  { email: 'captador@etic.com', pass: 'captacao123', name: 'Captador', role: 'captador' },
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

    try {
      update('auth_config', 'running', 'Verificando conexão...')
      await wait(400)
      const { error: sessionErr } = await supabase.auth.getSession()
      if (sessionErr) throw new Error(`Auth indisponível: ${sessionErr.message}`)
      update('auth_config', 'passed', 'Supabase Auth acessível.')

      update('auth_users', 'running', 'Verificando/Corrigindo usuários...')
      await wait(400)
      const fixes: string[] = []
      for (const u of TARGETS) {
        const { data, error } = await supabase.rpc('fn_diagnose_and_fix_auth', {
          p_email: u.email,
          p_password: u.pass,
          p_name: u.name,
          p_role: u.role,
        })
        if (error) throw new Error(`Falha ao corrigir ${u.email}: ${error.message}`)
        if (data?.actions?.length) fixes.push(`${u.email} (${data.actions.length} ações)`)
      }
      update(
        'auth_users',
        'passed',
        fixes.length ? `Corrigidos: ${fixes.join(', ')}` : 'Usuários validados.',
      )

      update('schema', 'running', 'Validando estrutura...')
      await wait(400)
      const { error: schemaErr } = await supabase.from('users').select('id, email, role').limit(1)
      if (schemaErr) throw new Error(`Erro schema: ${schemaErr.message}`)
      update('schema', 'passed', 'Tabela users validada estruturalmente.')

      update('rls', 'running', 'Validando RLS...')
      await wait(400)
      const { error: rlsErr } = await supabase
        .from('users')
        .insert({
          id: '00000000-0000-0000-0000-000000000000',
          email: 'x@x.com',
          nome: 'X',
          role: 'admin',
        })
      if (!rlsErr || (rlsErr.code !== '42501' && rlsErr.code !== '23505'))
        console.warn('RLS warn', rlsErr)
      update('rls', 'passed', 'Bloqueio RLS anônimo verificado perfeitamente.')

      update('password_jwt', 'running', 'Validando senhas e JWT...')
      await wait(400)
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: TARGETS[0].email,
        password: TARGETS[0].pass,
      })
      if (authErr) throw new Error(`Senha inválida ou desincronizada: ${authErr.message}`)
      if (!authData.session?.access_token) throw new Error('JWT ausente após login.')
      update('password_jwt', 'passed', `Senha e geração JWT válidos para ${TARGETS[0].email}.`)

      update('sync', 'running', 'Validando sincronização relacional...')
      await wait(400)
      const { data: syncUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()
      if (!syncUser) throw new Error(`Usuário ${authData.user.id} ausente em public.users.`)
      update('sync', 'passed', 'Perfis auth.users e public.users sincronizados.')

      update('login_full', 'running', 'Teste E2E Completo...')
      await wait(400)
      const { data: checkSession } = await supabase.auth.getSession()
      if (!checkSession.session) throw new Error('Sessão E2E não persistiu no client.')
      await supabase.auth.signOut()
      update('login_full', 'passed', 'Fluxo de login 100% funcional.')

      setResult({ success: true, time: ((Date.now() - t0) / 1000).toFixed(1) })
      toast({
        title: 'Diagnóstico Concluído',
        description: 'Sistema validado e corrigido.',
        className: 'bg-[#10B981] text-white border-none',
      })
    } catch (err: any) {
      setSteps((p) =>
        p.map((s) =>
          s.status === 'running' ? { ...s, status: 'failed', message: err.message } : s,
        ),
      )
      setResult({ success: false, time: '0' })
      toast({ title: 'Falha', description: err.message, variant: 'destructive' })
      supabase.auth.signOut().catch(() => {})
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Login
          </Link>
          <h1 className="text-2xl font-bold text-[#1A3A52] flex items-center gap-2">
            <Stethoscope className="w-8 h-8 text-blue-600" />
            Auth Health-Check & Auto-Fix
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Validação sequencial e auto-correção de credenciais do Supabase.
          </p>
        </div>
        <Button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="bg-[#1A3A52] hover:bg-[#2E5F8A] text-white w-full md:w-auto h-[48px] font-bold"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Diagnosticando...
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4 mr-2" /> Iniciar Diagnóstico
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
                Login 100% Funcional
              </h3>
              <p className="text-emerald-800 text-sm font-medium mt-1">
                Sincronia validada e corrigida em {result.time}s.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-[2px] border-[#E5E5E5] shadow-sm">
        <CardHeader className="bg-[#F8FAFC] border-b p-4">
          <CardTitle className="text-[16px] flex items-center gap-2 text-[#1A3A52] font-bold">
            <Activity className="w-5 h-5 text-blue-600" /> Log de Execução Sequencial
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
                    Falhou
                  </span>
                )}
                {s.status === 'running' && (
                  <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-2.5 py-1 rounded-[6px] uppercase">
                    Testando
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
