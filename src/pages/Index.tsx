import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, LogIn, Building2, KeyRound, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'

export default function Index() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const { login, requestPasswordReset } = useAppStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({ title: 'Erro', description: 'Preencha todos os campos.', variant: 'destructive' })
      return
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      toast({
        title: 'Erro de Validação',
        description: 'A senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número.',
        variant: 'destructive',
      })
      return
    }

    try {
      login(email, password)
      navigate('/app')
      toast({ title: 'Sucesso', description: 'Login realizado com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro de Autenticação', description: err.message, variant: 'destructive' })
    }
  }

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({ title: 'Erro', description: 'Preencha seu e-mail.', variant: 'destructive' })
      return
    }
    try {
      requestPasswordReset(email)
      toast({
        title: 'Email enviado',
        description:
          'Verifique sua caixa de entrada com o link de recuperação (válido por 1 hora).',
      })
      setIsResetting(false)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const quickLogin = (mockEmail: string) => {
    setEmail(mockEmail)
    setPassword('Password1')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 ring-1 ring-border/50 animate-fade-in-up">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Étic Imóveis</CardTitle>
          <CardDescription>Gestão Inteligente de Captação</CardDescription>
        </CardHeader>
        <CardContent>
          {!isResetting ? (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Senha</Label>
                    <button
                      type="button"
                      onClick={() => setIsResetting(true)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full py-6 text-base font-semibold">
                  <LogIn className="w-5 h-5 mr-2" /> Entrar
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t space-y-3">
                <p className="text-xs text-center text-muted-foreground mb-4">
                  Ambiente de Teste (Atalhos)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('captador@etic.com')}
                    className="text-xs"
                  >
                    Captador
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('sdr@etic.com')}
                    className="text-xs"
                  >
                    SDR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('corretor@etic.com')}
                    className="text-xs"
                  >
                    Corretor
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('gestor@etic.com')}
                    className="text-xs"
                  >
                    Gestor / Admin
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleReset} className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email para recuperação</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Um link com validade de 1 hora será enviado.
                </p>
              </div>
              <Button type="submit" className="w-full py-6 text-base font-semibold">
                <KeyRound className="w-5 h-5 mr-2" /> Recuperar Senha
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsResetting(false)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
