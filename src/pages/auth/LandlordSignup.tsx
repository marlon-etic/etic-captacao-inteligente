import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLandlordAuth } from '@/hooks/useLandlordAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { User, Mail, Lock, Phone, UserPlus, Loader2, Building } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function LandlordSignup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const { signup } = useLandlordAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Atenção', description: 'As senhas não coincidem.', variant: 'destructive' })
      return
    }
    setIsLoading(true)
    try {
      const { error } = await signup(formData.email, formData.password, {
        name: formData.name,
        phone: formData.phone,
      })
      if (error) throw error
      toast({
        title: 'Sucesso!',
        description: 'Sua conta foi criada. Faça login para continuar.',
        className: 'bg-green-600 text-white',
      })
      navigate('/landlord/login')
    } catch (err: any) {
      toast({ title: 'Erro ao cadastrar', description: err.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 animate-fade-in py-8">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-[#1A3A52]">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-inner">
            <Building className="w-8 h-8 text-[#1A3A52]" />
          </div>
          <CardTitle className="text-2xl font-black text-[#1A3A52] tracking-tight">
            Cadastro de Proprietário
          </CardTitle>
          <CardDescription className="text-sm font-medium">
            Crie sua conta para gerenciar seus imóveis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">
                Nome Completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-[14px] h-5 w-5 text-gray-400" />
                <Input
                  required
                  placeholder="Seu nome"
                  className="pl-10 h-12"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-[14px] h-5 w-5 text-gray-400" />
                <Input
                  required
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 h-12"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">
                Telefone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-[14px] h-5 w-5 text-gray-400" />
                <Input
                  required
                  placeholder="(11) 99999-9999"
                  className="pl-10 h-12"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-[14px] h-5 w-5 text-gray-400" />
                <Input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">
                Confirmar Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-[14px] h-5 w-5 text-gray-400" />
                <Input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-[#1A3A52] hover:bg-[#122839] shadow-md mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5 mr-2" />
              )}
              Criar Conta
            </Button>
            <div className="text-center pt-6 border-t border-gray-100 mt-6">
              <Link
                to="/landlord/login"
                className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Já tem uma conta? Faça login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
