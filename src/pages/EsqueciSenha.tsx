import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [countdown, setCountdown] = useState(0)

  const { requestPasswordReset } = useAppStore()
  const { toast } = useToast()

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({ title: 'Atenção', description: 'Preencha seu e-mail.', variant: 'destructive' })
      return
    }

    setStatus('loading')
    try {
      await requestPasswordReset(email)
      setStatus('success')
      setCountdown(60)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
      setStatus('idle')
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    try {
      await requestPasswordReset(email)
      setCountdown(60)
      toast({
        title: 'Email reenviado',
        description: 'Verifique sua caixa de entrada.',
        className: 'bg-[#10B981] text-white border-none',
      })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-[24px] bg-[#F5F5F5]">
      <Card className="w-full max-w-[400px] shadow-[0_8px_32px_rgba(26,58,82,0.15)] border-[2px] border-transparent animate-fade-in-up bg-[#FFFFFF]">
        {status === 'success' ? (
          <CardContent className="p-[32px] flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-[#e6f8f1] rounded-full flex items-center justify-center animate-bounce-scale">
              <CheckCircle2 className="w-[40px] h-[40px] text-[#10B981]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-[24px] font-bold text-[#1A3A52]">Email enviado!</h2>
              <p className="text-[14px] text-[#333333]">
                Enviamos um link de redefinição seguro para <strong>{email}</strong>. Verifique sua
                caixa de entrada e spam. O link expira em <strong>24 horas</strong>.
              </p>
            </div>
            <div className="w-full space-y-4 pt-4">
              <Button
                variant="ghost"
                className="w-full text-[#10B981] hover:text-[#0d9b6b] hover:bg-[#f0fdf8] font-bold disabled:opacity-50"
                onClick={handleResend}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `Reenviar em ${countdown}s...` : 'Reenviar email'}
              </Button>
              <Link to="/">
                <Button variant="outline" className="w-full min-h-[48px]">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o login
                </Button>
              </Link>
            </div>
          </CardContent>
        ) : (
          <>
            <CardHeader className="space-y-[12px] text-center pb-[24px]">
              <CardTitle className="text-[24px] font-bold tracking-tight text-[#1A3A52]">
                🔑 Redefinir Senha
              </CardTitle>
              <CardDescription className="text-[#333333] text-[14px]">
                Digite seu email cadastrado para receber o link de redefinição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-[24px]">
                <div className="space-y-[8px]">
                  <Label
                    htmlFor="email"
                    className="text-[#333333] text-[12px] font-bold uppercase tracking-wider"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-[12px] top-[14px] h-[20px] w-[20px] text-[#999999]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      className="pl-[40px] h-[48px] text-[16px] focus-visible:ring-[#10B981]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={status === 'loading'}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-[48px] text-[14px] font-bold bg-[#10B981] text-white hover:bg-[#0d9b6b] border-none shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-[20px] h-[20px] mr-[8px] animate-spin" />
                  ) : (
                    <Mail className="w-[20px] h-[20px] mr-[8px]" />
                  )}
                  {status === 'loading' ? 'Enviando...' : 'Enviar Link de Redefinição'}
                </Button>

                <div className="pt-2 text-center">
                  <Link
                    to="/"
                    className="inline-flex items-center text-[14px] text-[#1A3A52] hover:text-[#10B981] hover:underline font-bold transition-all"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o login
                  </Link>
                </div>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
