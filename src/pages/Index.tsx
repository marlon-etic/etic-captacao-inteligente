import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, LogIn, Building2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'

export default function Index() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAppStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({ title: 'Erro', description: 'Preencha todos os campos.', variant: 'destructive' })
      return
    }
    login(email)
    navigate('/app')
    toast({ title: 'Sucesso', description: 'Login realizado com sucesso!' })
  }

  const quickLogin = (mockEmail: string) => {
    setEmail(mockEmail)
    setPassword('123456')
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
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
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
                SDR / Corretor
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin('gestor@etic.com')}
                className="text-xs col-span-2"
              >
                Gestor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
