import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Flame, ThermometerSun, MapPin, TrendingUp } from 'lucide-react'

interface TopDemand {
  bairro: string
  tipo_imovel: string
  count: number
  urgencia: number
}

export function TermometroDemanda() {
  const [demands, setDemands] = useState<TopDemand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('grupos_demandas')
        .select('bairro, tipologia, total_demandas_ativas')
        .order('total_demandas_ativas', { ascending: false })
        .limit(5)

      if (!error && data) {
        const aggregated = data
          .map((d) => ({
            bairro: d.bairro,
            tipo_imovel: d.tipologia || 'Diversos',
            count: d.total_demandas_ativas || 0,
            urgencia: Math.min(100, (d.total_demandas_ativas || 0) * 15),
          }))
          .filter((d) => d.count > 0)
        setDemands(aggregated)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return null
  if (demands.length === 0) return null

  return (
    <Card className="border-orange-100 shadow-[0_8px_24px_rgba(249,115,22,0.08)] bg-gradient-to-br from-white to-orange-50/50 rounded-2xl overflow-hidden h-full flex flex-col relative">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <ThermometerSun className="w-24 h-24 text-orange-500" />
      </div>
      <CardHeader className="pb-4 border-b border-orange-100/50 bg-white/50 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-orange-100 to-red-100 text-orange-600 rounded-xl shadow-inner">
            <ThermometerSun className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-black text-gray-800">
              Termômetro de Demanda
            </CardTitle>
            <CardDescription className="text-xs font-bold text-orange-600/90 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> Zonas Quentes do Mercado
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex-1 z-10 space-y-5">
        {demands.map((d, i) => (
          <div key={i} className="flex flex-col gap-2 group">
            <div className="flex justify-between items-center text-sm">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-gray-800 font-black">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  <span className="truncate max-w-[160px]">{d.bairro}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold ml-5 uppercase tracking-wider">
                  {d.tipo_imovel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-red-600 font-black text-xs bg-red-50 border border-red-100 px-2.5 py-1 rounded-full shadow-sm group-hover:scale-105 transition-transform">
                <Flame className="w-3.5 h-3.5 fill-red-500" />
                {d.count} <span className="hidden sm:inline">clientes</span>
              </div>
            </div>
            <div className="w-full bg-orange-100/50 rounded-full h-2 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${d.urgencia}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
