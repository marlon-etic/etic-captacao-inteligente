import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, LogIn, Building2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'

export default function Index() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { currentUser, login } = useAppStore()
  const { signIn, loading: authLoading, session } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && (currentUser || session)) {
      navigate('/app', { replace: true })
    }
  }, [currentUser, session, authLoading, navigate])

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
    try {
      await new Promise((r) => setTimeout(r, 600)) // Visual feedback delay

      const { error: supaError } = await signIn(email, password)

      // Tratativa de erro amigável para credenciais inválidas ou erro no Supabase
      if (supaError) {
        if (
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
        className: 'bg-[#F44336] text-white border-none',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const quickLogin = async (mockEmail: string) => {
    const pass = mockEmail === 'captador@etic.com' ? 'captacao123' : 'Password1'
    setEmail(mockEmail)
    setPassword(pass)
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 600))

      const { error: authError } = await signIn(mockEmail, pass)

      // Auto-register mock users if they don't exist in Supabase yet
      if (
        authError &&
        (authError.message.includes('Invalid login') || authError.message.includes('credentials'))
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
            })

            await signIn(mockEmail, pass)
          }
        } catch (seedErr) {
          console.error('[Diagnostic] Error during auto-registration:', seedErr)
        }
      }

      await login(mockEmail, pass)
      navigate('/app', { replace: true })
    } catch (err: any) {
      toast({
        title: 'Erro de Autenticação',
        description: err.message,
        className: 'bg-[#F44336] text-white border-none',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1A3A52]" />
      </div>
    )
  }

  if (currentUser || session) return null

  return (
    <div className="min-h-screen flex items-center justify-center p-[16px] bg-[#F5F5F5]">
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

          <div className="mt-[32px] pt-[24px] border-t border-[#2E5F8A]/20 space-y-[12px]">
            <p className="text-[12px] font-bold uppercase tracking-wider text-center text-[#999999] mb-[16px]">
              Ambiente de Teste (Atalhos)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px]">
              <Button
                variant="secondary"
                onClick={() => quickLogin('captador@etic.com')}
                className="text-[12px]"
                disabled={isLoading}
              >
                Captador
              </Button>
              <Button
                variant="secondary"
                onClick={() => quickLogin('sdr@etic.com')}
                className="text-[12px]"
                disabled={isLoading}
              >
                SDR
              </Button>
              <Button
                variant="secondary"
                onClick={() => quickLogin('corretor@etic.com')}
                className="text-[12px]"
                disabled={isLoading}
              >
                Corretor
              </Button>
              <Button
                variant="secondary"
                onClick={() => quickLogin('gestor@etic.com')}
                className="text-[12px]"
                disabled={isLoading}
              >
                Gestor / Admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
