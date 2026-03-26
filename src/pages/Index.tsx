import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, LogIn, Building2, Loader2, AlertTriangle, Stethoscope } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'

export default function Index() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  const { currentUser, login, logout, isRestoringUser } = useAppStore()
  const { signIn, signInWithGoogle, loading: authLoading, session } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    if (authLoading || isRestoringUser) return

    if (currentUser && session) {
      navigate('/app', { replace: true })
    } else if (currentUser && !session) {
      logout()
    }
  }, [currentUser, session, authLoading, isRestoringUser, navigate, logout])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    setInitError(null)
    try {
      const { error: supaError } = await signIn(email, password)

      if (supaError) {
        if (
          supaError.message.toLowerCase().includes('banned') ||
          supaError.message.toLowerCase().includes('disabled') ||
          supaError.message.toLowerCase().includes('suspended')
        ) {
          throw new Error('Sua conta foi bloqueada pelo administrador.')
        } else if (
          supaError.status === 400 ||
          supaError.message.includes('Invalid login') ||
          supaError.message.includes('credentials')
        ) {
          throw new Error('E-mail ou senha incorretos. Verifique suas credenciais.')
        } else if (supaError.message.includes('Email not confirmed')) {
          throw new Error('Por favor, confirme seu e-mail antes de fazer login.')
        } else {
          throw new Error(supaError.message || 'Erro ao autenticar. Tente novamente.')
        }
      }

      await login(email, password)
      navigate('/app', { replace: true })
    } catch (err: any) {
      toast({
        title: 'Erro de Autenticação',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setInitError(null)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        if (error.message?.toLowerCase().includes('validation') || error.status === 400) {
          throw new Error(
            `A URL atual (${window.location.origin}) não está autorizada no Supabase. Vá em Authentication > URL Configuration > Redirect URLs e adicione: ${window.location.origin}/*`,
          )
        }
        throw new Error(error.message || 'Erro ao conectar com o Google.')
      }
      // O redirect será automático pelo Supabase Auth
    } catch (err: any) {
      setInitError(err.message)
      toast({
        title: 'Ação Necessária (Google Auth)',
        description: err.message,
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  const quickLogin = async (mockEmail: string) => {
    const pass = mockEmail === 'captador@etic.com' ? 'captacao123' : 'Password1'
    setEmail(mockEmail)
    setPassword(pass)
    setIsLoading(true)
    setInitError(null)
    try {
      const { error: authError } = await signIn(mockEmail, pass)

      if (authError) {
        if (
          authError.message.toLowerCase().includes('banned') ||
          authError.message.toLowerCase().includes('disabled')
        ) {
          throw new Error('Sua conta foi bloqueada pelo administrador.')
        } else if (
          authError.status === 400 ||
          authError.message.includes('Invalid login') ||
          authError.message.includes('credentials')
        ) {
          console.warn(
            '[Diagnostic] User not found in Supabase. Attempting to seed via signup:',
            mockEmail,
          )
          try {
            const { data: signUpData } = await supabase.auth.signUp({
              email: mockEmail,
              password: pass,
            })
            if (signUpData.user) {
              let role = 'captador'
              if (mockEmail.includes('sdr')) role = 'sdr'
              if (mockEmail.includes('corretor')) role = 'corretor'
              if (mockEmail.includes('gestor') || mockEmail.includes('admin')) role = 'admin'

              await supabase.from('users').insert({
                id: signUpData.user.id,
                email: mockEmail,
                nome: mockEmail.split('@')[0],
                role: role as any,
                status: 'ativo',
              })

              await signIn(mockEmail, pass)
            }
          } catch (seedErr) {
            console.error('[Diagnostic] Error during auto-registration:', seedErr)
          }
        } else {
          throw new Error(authError.message || 'Erro ao autenticar. Tente novamente.')
        }
      }

      await login(mockEmail, pass)
      navigate('/app', { replace: true })
    } catch (err: any) {
      toast({
        title: 'Erro de Autenticação',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isRestoringUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1A3A52]" />
      </div>
    )
  }

  if (currentUser) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-[16px] bg-[#F5F5F5]">
      <Card className="w-full max-w-md shadow-[0_8px_32px_rgba(26,58,82,0.15)] border-[2px] border-[#2E5F8A] animate-fade-in-up bg-[#FFFFFF]">
        <CardHeader className="space-y-[12px] text-center pb-[24px]">
          <div className="mx-auto w-[64px] h-[64px] bg-[#1A3A52] rounded-[16px] flex items-center justify-center mb-[8px] shadow-[0_4px_12px_rgba(26,58,82,0.2)]">
            <Building2 className="w-[32px] h-[32px] text-white" />
          </div>
          <CardTitle className="text-[24px] font-bold tracking-tight text-[#1A3A52]">
            Étic Imóveis
          </CardTitle>
          <CardDescription className="text-[#333333] text-[14px]">
            Gestão Inteligente de Captação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initError && (
            <div className="mb-6 animate-fade-in-down">
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <AlertDescription className="text-red-800 ml-2 font-medium text-sm text-left">
                  {initError}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-[16px]">
            <div className="space-y-[8px]">
              <Label
                htmlFor="email"
                className="text-[#333333] text-[12px] font-bold uppercase tracking-wider"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-[12px] top-[12px] h-[20px] w-[20px] text-[#999999]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="username"
                  className="pl-[40px]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-[8px]">
              <Label
                htmlFor="password"
                className="text-[#333333] text-[12px] font-bold uppercase tracking-wider"
              >
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-[12px] top-[12px] h-[20px] w-[20px] text-[#999999]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pl-[40px]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-[48px] text-[14px] font-bold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-[20px] h-[20px] mr-[8px] animate-spin" />
                ) : (
                  <LogIn className="w-[20px] h-[20px] mr-[8px]" />
                )}
                {isLoading ? 'Entrando...' : 'Entrar no Sistema'}
              </Button>
            </div>
            <div className="flex justify-end pt-1">
              <Link
                to="/esqueci-senha"
                className="text-[14px] text-[#1A3A52] hover:underline font-bold transition-all duration-200"
              >
                Esqueci minha senha
              </Link>
            </div>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E5E5E5]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[#999999] font-bold tracking-wider">Ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-[48px] text-[14px] font-bold border-[#E5E5E5] text-[#333333] hover:bg-[#F8FAFC]"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </Button>

          <div className="mt-[32px] pt-[24px] border-t border-[#2E5F8A]/20 space-y-[12px]">
            <p className="text-[12px] font-bold uppercase tracking-wider text-center text-[#999999] mb-[16px]">
              Ambiente de Teste (Atalhos)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => quickLogin('captador@etic.com')}
                className="text-[12px]"
                disabled={isLoading}
              >
                Captador
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => quickLogin('sdr@etic.com')}
                className="text-[12px]"
                disabled={isLoading}
              >
                SDR
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => quickLogin('corretor@etic.com')}
                className="text-[12px]"
                disabled={isLoading}
              >
                Corretor
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => quickLogin('admin@etic.com')}
                className="text-[12px]"
                disabled={isLoading}
              >
                Gestor / Admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 animate-fade-in-up">
        <Link
          to="/diagnostico"
          className="text-[13px] text-[#666666] hover:text-[#1A3A52] font-semibold transition-all duration-300 flex items-center gap-2 bg-white px-4 py-2 rounded-full border-[2px] border-transparent hover:border-[#E5E5E5] shadow-sm hover:shadow"
        >
          <Stethoscope className="w-4 h-4 text-blue-500" />
          Problemas no Login? Rodar Diagnóstico
        </Link>
      </div>
    </div>
  )
}
