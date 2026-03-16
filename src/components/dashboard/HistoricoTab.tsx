import { Demand } from '@/types'
import { PerformanceChart } from './PerformanceChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function HistoricoTab({ userDemands }: { userDemands: Demand[] }) {
  const closedDemands = userDemands
    .filter((d) => ['Negócio', 'Perdida', 'Impossível'].includes(d.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="flex flex-col gap-[20px] animate-fade-in w-full max-w-[1400px] mx-auto">
      <PerformanceChart userDemands={userDemands} />

      <Card className="shadow-sm border-[2px] border-[#2E5F8A]/20">
        <CardHeader className="bg-[#F5F5F5] border-b border-[#E5E5E5] pb-4">
          <CardTitle className="text-[18px] font-bold text-[#1A3A52]">
            Histórico de Demandas Finalizadas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {closedDemands.length === 0 ? (
            <div className="p-12 text-center text-[#999999] font-medium text-[16px]">
              Nenhum histórico disponível no momento.
            </div>
          ) : (
            <div className="divide-y divide-[#E5E5E5]">
              {closedDemands.map((d) => (
                <div
                  key={d.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9F9F9] transition-colors"
                >
                  <div>
                    <p className="font-bold text-[16px] text-[#333333] leading-tight mb-1">
                      {d.clientName}
                    </p>
                    <p className="text-[14px] text-[#999999] leading-tight">📍 {d.location}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[14px] font-medium text-[#999999]">
                      {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    <Badge
                      className="font-bold text-[12px] min-w-[80px] justify-center"
                      variant={d.status === 'Negócio' ? 'default' : 'secondary'}
                      style={{
                        backgroundColor: d.status === 'Negócio' ? '#4CAF50' : '#999999',
                        color: '#FFFFFF',
                        border: 'none',
                      }}
                    >
                      {d.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
