import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Building2, Home } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface FocoData {
  tipo: string
  tipo_imovel: string
  bairro_alvo: string
  qtd_clientes_aguardando: number
  ticket_medio: number
}

export function DashboardFoco({ className }: { className?: string }) {
  const [data, setData] = useState<FocoData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: result, error } = await supabase
          .from('vw_foco_captacao_v6')
          .select('*')
          .order('qtd_clientes_aguardando', { ascending: false })
          .limit(6)

        if (!error && result) {
          setData(result)
        }
      } catch (err) {
        console.error('Failed to fetch foco captacao', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <Card className={cn('rounded-xl shadow-sm bg-white animate-pulse', className)}>
        <CardHeader className="pb-2">
          <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg w-full"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return null
  }

  return (
    <Card className={cn('rounded-xl shadow-sm bg-white', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-red-500" />
          Foco de Captação
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Bairros com clientes aguardando e sem imóveis disponíveis.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const isComercial = item.tipo_imovel?.toLowerCase().includes('comercial')
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border-l-4 border-l-blue-500 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isComercial ? (
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                      <Building2 className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md">
                      <Home className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {item.bairro_alvo} • {item.tipo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.qtd_clientes_aguardando} cliente(s) aguardando
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      item.ticket_medio,
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">Ticket Médio</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
