import { Users, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import useAppStore from '@/stores/useAppStore'

export function RespostasBadge({ respostas }: { respostas: any[] }) {
  const { users } = useAppStore()
  if (!respostas || respostas.length === 0) return null
  const captadoresCount =
    users.filter((u) => u.role === 'captador' && u.status === 'ativo').length || 3

  return (
    <Badge className="bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2] border border-[#FECACA] text-[10px] font-black px-2 py-1 shadow-sm transition-colors cursor-default">
      ❌ {respostas.length}/{captadoresCount} MARCARAM PERDIDO
    </Badge>
  )
}

export function RespostasHistory({ respostas }: { respostas: any[] }) {
  const { users } = useAppStore()

  if (!respostas || respostas.length === 0) return null

  return (
    <div className="mt-3 bg-[#FFF5F5] rounded-[8px] border border-[#FECACA] p-3 shadow-sm pointer-events-auto relative z-10">
      <div className="flex items-center gap-2 mb-2 border-b border-[#FECACA]/50 pb-2">
        <span className="text-[12px] font-black text-[#B91C1C] uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Histórico de Buscas (NÃO ENCONTRADO)
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {respostas.map((r) => {
          const user = users.find((u) => u.id === r.captador_id)
          const name = user?.name || 'Captador'
          const date = new Date(r.created_at || new Date()).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
          return (
            <div
              key={r.id || Math.random().toString()}
              className="text-[12px] text-[#7F1D1D] bg-white p-2.5 rounded-[6px] border border-[#FECACA]/50 shadow-sm transition-all hover:border-[#EF4444]/30"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span>
                  {name}
                </span>
                <span className="text-[10px] text-[#991B1B] font-bold flex items-center gap-1 bg-[#FEF2F2] px-1.5 py-0.5 rounded">
                  <Clock className="w-3 h-3" /> {date}
                </span>
              </div>
              <div className="font-medium text-[11px] leading-tight text-[#450a0a]">
                Motivo: <span className="font-bold">"{r.motivo}"</span>
                {r.observacao && (
                  <span className="block mt-1 text-[#7f1d1d] opacity-90 italic">
                    Obs: {r.observacao}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
