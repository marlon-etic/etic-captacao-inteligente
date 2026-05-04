import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { usePeriodStore } from '@/stores/use-period-store'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function useCaptadorDashboard() {
  const { period } = usePeriodStore()
  const { user } = useAuth()

  const [metrics, setMetrics] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [charts, setCharts] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    try {
      const now = new Date()
      let startDate = new Date()
      if (period === 'today') {
        startDate.setHours(0, 0, 0, 0)
      } else if (period === 'week') {
        startDate.setDate(now.getDate() - 7)
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1)
      }

      const isoStart = startDate.toISOString()

      const { data: imoveis, error } = await supabase
        .from('imoveis_captados')
        .select('*')
        .eq('user_captador_id', user.id)
        .gte('created_at', isoStart)
        .order('created_at', { ascending: false })

      if (error) throw error

      const validImoveis = imoveis || []

      const convertidos = validImoveis.filter((i) => i.status_captacao === 'fechado')
      const receita = convertidos.reduce((acc, i) => acc + Number(i.preco || i.valor || 0), 0)

      setMetrics({
        total: validImoveis.length,
        convertidos: convertidos.length,
        receita,
        taxa: validImoveis.length
          ? ((convertidos.length / validImoveis.length) * 100).toFixed(1)
          : 0,
      })

      setLeads(validImoveis)

      const lineDataMap: Record<string, number> = {}
      const statusMap: Record<string, number> = {
        pendente: 0,
        capturado: 0,
        visitado: 0,
        fechado: 0,
        perdido: 0,
      }

      validImoveis.forEach((i) => {
        const dateStr = new Date(i.created_at).toLocaleDateString('pt-BR', {
          month: 'short',
          day: 'numeric',
        })
        lineDataMap[dateStr] = (lineDataMap[dateStr] || 0) + 1

        const st = i.status_captacao || 'pendente'
        statusMap[st] = (statusMap[st] || 0) + 1
      })

      const lineData = Object.entries(lineDataMap)
        .map(([date, count]) => ({ date, count }))
        .reverse()
      const pieData = Object.entries(statusMap)
        .filter(([_, count]) => count > 0)
        .map(([name, value]) => ({ name, value }))

      setCharts({ lineData, pieData })
    } catch (err: any) {
      toast.error('Erro ao carregar dados: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [period, user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('dashboard_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'imoveis_captados',
          filter: `user_captador_id=eq.${user.id}`,
        },
        () => {
          fetchData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchData])

  return { metrics, leads, charts, loading, refetch: fetchData }
}
