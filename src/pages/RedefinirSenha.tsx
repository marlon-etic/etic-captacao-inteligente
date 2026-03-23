import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

const getStrength = (p: string) => {
  if (!p) return { score: 0, label: '', color: 'bg-[#E0E0E0]' }
  if (p.length < 8) return { score: 33, label: 'Fraca', color: 'bg-red-500' }
  const hasLetters = /[a-zA-Z]/.test(p)
  const hasNumbers = /[0-9]/.test(p)
  const hasSpecial = /[^a-zA-Z0-9]/.test(p)

  if (hasLetters && hasNumbers && hasSpecial)
    return { score: 100, label: 'Forte', color: 'bg-[#10B981]' }
  if (hasLetters && hasNumbers) return { score: 66, label: 'Média', color: 'bg-yellow-500' }
  return { score: 33, label: 'Fraca', color: 'bg-red-500' }
}

export default function RedefinirSenha() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [status, setStatus] = useState<'idle' | 'loading' | 'error_expired'>('idle')
  const [token, setToken] = useState<string | null>(null)

  const { resetPassword } = useAppStore()

  useEffect(() => {
    // Extract token from either query parameters or hash (Supabase default behavior)
    const searchParams = new URLSearchParams(location.search)
    let extractedToken = searchParams.get('token')

    if (!extractedToken && location.hash) {
      const hashParams = new URLSearchParams(location.hash.substring(1))
      extractedToken = hashParams.get('access_token')

      if (
        hashParams.get('error_code') === '404' ||
        hashParams.get('error_description')?.includes('expired') ||
        hashParams.get('error') === 'unauthorized_client'
      ) {
        extractedToken = 'expired'
      }
    }

    if (extractedToken === 'expired' || extractedToken === 'used') {
      setStatus('error_expired')
    }

    setToken(extractedToken)
  }, [location])

  const strength = getStrength(pass)
  const passwordsMatch = pass && confirm && pass === confirm
  const isLengthValid = pass.length >= 8
  const isValid = isLengthValid && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setStatus('loading')
    try {
      await resetPassword(pass, token || '')

      toast({
        title: 'Senha redefinida com sucesso!',
        description: 'Sua senha foi atualizada. Faça login para continuar.',
        className: 'bg-[#10B981] text-white border-none',
      })

      navigate('/')
    } catch (err: any) {
      if (err.message === 'Token expirado' || err.message?.includes('expired')) {
        setStatus('error_expired')
      } else {
        toast({ title: 'Erro', description: err.message, variant: 'destructive' })
        setStatus('idle')
      }
    }
  }

  if (status === 'error_expired') {
    return (
      <div className="min-h-screen flex items-center justify-center p-[24px] bg-[#F5F5F5]">
        <Card className="w-full max-w-[400px] shadow-[0_8px_32px_rgba(26,58,82,0.15)] border-[2px] border-red-200 animate-fade-in-up bg-[#FFFFFF]">
          <CardContent className="p-[32px] flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-[48px] h-[48px] text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-[24px] font-bold text-[#1A3A52]">Link Expirado</h2>
              <p className="text-[14px] text-[#333333]">
                Este link de recuperação de senha expirou (limite de 24 horas) ou já foi utilizado.
              </p>
            </div>
            <div className="w-full space-y-4 pt-4">
              <Link to="/esqueci-senha" className="w-full block">
                <Button className="w-full h-[48px] font-bold bg-[#1A3A52] hover:bg-[#112739]">
                  Solicitar novo link
                </Button>
              </Link>
              <Link to="/" className="w-full block">
                <Button variant="outline" className="w-full min-h-[48px]">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-[24px] bg-[#F5F5F5]">
      <Card className="w-full max-w-[400px] shadow-[0_8px_32px_rgba(26,58,82,0.15)] border-[2px] border-transparent animate-fade-in-up bg-[#FFFFFF]">
        <CardHeader className="space-y-[12px] text-center pb-[24px]">
          <CardTitle className="text-[24px] font-bold tracking-tight text-[#1A3A52]">
            🔐 Criar Nova Senha
          </CardTitle>
          <CardDescription className="text-[#333333] text-[14px]">
            Crie uma nova senha segura para sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-[24px]">
            <div className="space-y-[8px]">
              <Label
                htmlFor="pass"
                className="text-[#333333] text-[12px] font-bold uppercase tracking-wider"
              >
                Nova Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-[12px] top-[14px] h-[20px] w-[20px] text-[#999999]" />
                <Input
                  id="pass"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-[40px] pr-[40px] h-[48px] text-[16px] focus-visible:ring-[#10B981]"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  disabled={status === 'loading'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-[12px] top-[14px] text-[#999999] hover:text-[#333333] focus:outline-none"
                >
                  {showPass ? (
                    <EyeOff className="w-[20px] h-[20px]" />
                  ) : (
                    <Eye className="w-[20px] h-[20px]" />
                  )}
                </button>
              </div>

              {pass.length > 0 && (
                <div className="pt-1 space-y-1 animate-fade-in">
                  <Progress value={strength.score} indicatorClassName={strength.color} />
                  <p className="text-[12px] text-[#666666] font-medium text-right">
                    Força:{' '}
                    <span className={cn('font-bold', strength.color.replace('bg-', 'text-'))}>
                      {strength.label}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-[8px]">
              <Label
                htmlFor="confirm"
                className="text-[#333333] text-[12px] font-bold uppercase tracking-wider"
              >
                Confirmar Nova Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-[12px] top-[14px] h-[20px] w-[20px] text-[#999999]" />
                <Input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-[40px] pr-[40px] h-[48px] text-[16px] focus-visible:ring-[#10B981]"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={status === 'loading'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-[12px] top-[14px] text-[#999999] hover:text-[#333333] focus:outline-none"
                >
                  {showConfirm ? (
                    <EyeOff className="w-[20px] h-[20px]" />
                  ) : (
                    <Eye className="w-[20px] h-[20px]" />
                  )}
                </button>
              </div>

              {confirm.length > 0 && (
                <div className="pt-1 animate-fade-in flex items-center gap-1.5">
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      <span className="text-[12px] font-bold text-[#10B981]">
                        As senhas coincidem
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-[12px] font-bold text-red-500">
                        As senhas não coincidem
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-[48px] text-[14px] font-bold bg-[#10B981] text-white hover:bg-[#0d9b6b] disabled:opacity-50 disabled:bg-[#999999] shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
              disabled={!isValid || status === 'loading'}
            >
              {status === 'loading' ? (
                <Loader2 className="w-[20px] h-[20px] mr-[8px] animate-spin" />
              ) : (
                <CheckCircle2 className="w-[20px] h-[20px] mr-[8px]" />
              )}
              {status === 'loading' ? 'Salvando...' : 'Salvar Nova Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
