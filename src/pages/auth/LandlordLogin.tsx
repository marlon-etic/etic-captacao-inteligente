import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLandlordAuth } from '@/hooks/useLandlordAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Mail, Lock, LogIn, Loader2, Building } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function LandlordLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useLandlordAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({ title: 'Atenção', description: 'Preencha todos os campos.', variant: 'destructive' })
      return
    }
    setIsLoading(true)
    try {
      const { error } = await login(email, password)
      if (error) throw error
      navigate('/landlord/dashboard')
    } catch (err: any) {
      toast({ title: 'Erro de Autenticação', description: err.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 animate-fade-in">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-[#1A3A52]">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-inner">
            <Building className="w-8 h-8 text-[#1A3A52]" />
          </div>
          <CardTitle className="text-2xl font-black text-[#1A3A52] tracking-tight">
            Portal do Proprietário
          </CardTitle>
          <CardDescription className="text-sm font-medium">
            Gerencie seus imóveis e acompanhe propostas em tempo real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs uppercase tracking-wider font-bold text-gray-500"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-[14px] h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs uppercase tracking-wider font-bold text-gray-500"
              >
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-[14px] h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-[#1A3A52] hover:bg-[#122839] shadow-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5 mr-2" />
              )}
              Acessar Painel
            </Button>
            <div className="text-center mt-6 space-y-4 pt-4 border-t border-gray-100">
              <Link
                to="/landlord/signup"
                className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Ainda não tem cadastro? Crie sua conta
              </Link>
              <div className="pt-2">
                <Link
                  to="/"
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Voltar para o sistema principal
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
