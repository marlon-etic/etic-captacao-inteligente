import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Activity, Database, Radio, Server, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HealthCheckTester() {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<{
    db: 'idle' | 'loading' | 'success' | 'error'
    realtime: 'idle' | 'loading' | 'success' | 'error'
    edge: 'idle' | 'loading' | 'success' | 'error'
  }>({
    db: 'idle',
    realtime: 'idle',
    edge: 'idle',
  })

  const runDiagnostics = async () => {
    setIsRunning(true)
    setResults({ db: 'loading', realtime: 'loading', edge: 'loading' })

    try {
      // 1. Database Check
      const { error: dbError } = await supabase.from('users').select('id').limit(1)
      setResults((prev) => ({ ...prev, db: dbError ? 'error' : 'success' }))

      // 2. Realtime Check
      let realtimeSuccess = false
      const channel = supabase.channel('health-check-test')

      const realtimePromise = new Promise((resolve) => {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            realtimeSuccess = true
            resolve(true)
          }
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            resolve(false)
          }
        })
        setTimeout(() => resolve(false), 3000)
      })

      const rtResult = await realtimePromise
      setResults((prev) => ({ ...prev, realtime: rtResult ? 'success' : 'error' }))
      supabase.removeChannel(channel)

      // 3. Edge Functions Check
      const { error: edgeError } = await supabase.functions.invoke('monitor-realtime', {
        method: 'POST',
        body: {},
      })
      setResults((prev) => ({
        ...prev,
        edge: edgeError && edgeError.message.includes('FetchError') ? 'error' : 'success',
      }))

      const allSuccess =
        !dbError && rtResult && (!edgeError || !edgeError.message.includes('FetchError'))

      if (allSuccess) {
        toast({
          title: 'Diagnóstico Completo',
          description: 'Todos os sistemas estão operacionais e respondendo normalmente.',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Atenção no Diagnóstico',
          description: 'Alguns serviços apresentaram instabilidade. Verifique os indicadores.',
        })
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Falha no Diagnóstico',
        description: err.message,
      })
    } finally {
      setIsRunning(false)
    }
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'idle') return <div className="w-5 h-5 rounded-full border-2 border-muted" />
    if (status === 'loading') return <Loader2 className="w-5 h-5 animate-spin text-primary" />
    if (status === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    return <XCircle className="w-5 h-5 text-destructive" />
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1A3A52]">Diagnóstico de Sistema</h1>
        <p className="text-muted-foreground">
          Monitore a saúde e funcionalidade dos serviços da plataforma.
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-white border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-emerald-600" />
            Execução de Testes
          </CardTitle>
          <CardDescription>
            Verifique a integridade do banco de dados, serviços em tempo real e edge functions
            instantaneamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 bg-[#F9FAFB]">
          <div className="grid gap-4 sm:grid-cols-3">
            <div
              className={cn(
                'flex flex-col p-4 rounded-xl border bg-white shadow-sm transition-all',
                results.db === 'error' && 'border-destructive/50 bg-destructive/5',
                results.db === 'success' && 'border-emerald-500/50 bg-emerald-50',
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <Database className="w-6 h-6 text-[#1A3A52]" />
                <StatusIcon status={results.db} />
              </div>
              <span className="font-bold text-[#1A3A52]">Banco de Dados</span>
              <span className="text-xs text-muted-foreground mt-1">PostgreSQL & Supabase API</span>
            </div>

            <div
              className={cn(
                'flex flex-col p-4 rounded-xl border bg-white shadow-sm transition-all',
                results.realtime === 'error' && 'border-destructive/50 bg-destructive/5',
                results.realtime === 'success' && 'border-emerald-500/50 bg-emerald-50',
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <Radio className="w-6 h-6 text-[#1A3A52]" />
                <StatusIcon status={results.realtime} />
              </div>
              <span className="font-bold text-[#1A3A52]">Realtime Engine</span>
              <span className="text-xs text-muted-foreground mt-1">WebSockets & Subscriptions</span>
            </div>

            <div
              className={cn(
                'flex flex-col p-4 rounded-xl border bg-white shadow-sm transition-all',
                results.edge === 'error' && 'border-destructive/50 bg-destructive/5',
                results.edge === 'success' && 'border-emerald-500/50 bg-emerald-50',
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <Server className="w-6 h-6 text-[#1A3A52]" />
                <StatusIcon status={results.edge} />
              </div>
              <span className="font-bold text-[#1A3A52]">Edge Functions</span>
              <span className="text-xs text-muted-foreground mt-1">Serverless Workers</span>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full sm:w-auto mt-4 bg-[#1A3A52] hover:bg-[#2E5F8A] text-white font-bold h-12 px-8"
            onClick={runDiagnostics}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Diagnosticando Componentes...
              </>
            ) : (
              <>
                <Activity className="w-5 h-5 mr-2" />
                Executar Diagnóstico Completo
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
