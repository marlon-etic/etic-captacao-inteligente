import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  properties: any[]
  onSelect: (p: any) => void
}

export function PropertyListMobile({ properties, onSelect }: Props) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  if (properties.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border-[2px] border-dashed border-gray-300 flex flex-col items-center justify-center gap-3">
        <span className="text-5xl">🏢</span>
        <p className="text-[15px] font-bold text-gray-500">Nenhum imóvel encontrado.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {properties.map((p: any) => {
        const isRecent = new Date().getTime() - new Date(p.created_at).getTime() < 86400000
        return (
          <Card
            key={p.id}
            className="cursor-pointer active:scale-[0.98] transition-transform overflow-hidden border-[2px] border-[#E5E5E5] shadow-[0_4px_12px_rgba(26,58,82,0.05)] hover:border-[#1A3A52] hover:shadow-md"
            onClick={() => onSelect(p)}
          >
            <CardContent className="p-4 flex flex-col gap-3.5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      p.tipo === 'Aluguel'
                        ? 'bg-blue-600 border-none font-black shadow-sm'
                        : p.tipo === 'Ambos'
                          ? 'bg-purple-600 border-none font-black shadow-sm'
                          : 'bg-green-600 border-none font-black shadow-sm'
                    }
                  >
                    {p.tipo === 'Aluguel' ? '🏠' : p.tipo === 'Ambos' ? '🔄' : '🏢'} {p.tipo}
                  </Badge>
                  {isRecent && (
                    <Badge className="bg-amber-500 border-none font-black uppercase tracking-wider shadow-sm animate-pulse">
                      Novo
                    </Badge>
                  )}
                </div>
                <span className="font-black text-[#1A3A52] text-[13px] bg-slate-100 px-2 py-1 rounded border border-slate-200">
                  {p.codigo_imovel}
                </span>
              </div>

              <div className="space-y-1.5">
                <p className="font-black text-emerald-600 text-[20px] tracking-tight">
                  {formatCurrency(p.preco)}
                </p>
                <p className="text-[13px] font-medium text-gray-700 line-clamp-2 leading-snug">
                  {p.endereco}
                </p>
              </div>

              <div className="flex items-center gap-4 text-[12px] font-bold text-gray-600 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-100">
                <span className="flex items-center gap-1.5">🛏️ {p.dormitorios || 0} Dorm</span>
                <span className="w-[2px] h-3 bg-gray-300 rounded-full"></span>
                <span className="flex items-center gap-1.5">🚗 {p.vagas || 0} Vagas</span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    Captador
                  </span>
                  <span className="font-black text-[#1A3A52]">{p.captador_nome}</span>
                </div>
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    Demanda
                  </span>
                  {p.demanda ? (
                    <Badge
                      variant="outline"
                      className="text-[11px] px-2 py-0.5 h-[22px] font-black border-gray-300 text-gray-700 shadow-sm"
                    >
                      {p.demanda.clientName}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 italic font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                      Avulso
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
