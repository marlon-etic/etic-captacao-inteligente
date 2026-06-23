import { Zap, Loader2 } from 'lucide-react'
import { useQuickMatchCount } from '@/hooks/use-quick-match'
import { cn } from '@/lib/utils'

export function QuickMatchBadge({
  imovel,
  className,
  showLabel = true,
}: {
  imovel: any
  className?: string
  showLabel?: boolean
}) {
  const { count, matchedClients, loading } = useQuickMatchCount({
    preco: imovel?.preco || imovel?.valor,
    endereco: imovel?.endereco || imovel?.bairros?.join(', '),
    tipo: imovel?.tipo,
    tipo_imovel: imovel?.tipo_imovel,
    dormitorios: imovel?.dormitorios,
    vagas: imovel?.vagas,
  })

  if (loading) {
    return (
      <span
        className={cn('inline-flex items-center text-[10px] text-orange-400 font-bold', className)}
      >
        <Loader2 className="w-3 h-3 animate-spin mr-1" /> Calc...
      </span>
    )
  }

  if (!count || count === 0) return null

  const names = matchedClients.map((c) => c.nome).join(', ')
  const description = `${count} ${count === 1 ? 'cliente ativo' : 'clientes ativos'} (${names}) procurando imóvel com este perfil`

  return (
    <span
      className={cn(
        'inline-flex items-center text-[10px] bg-gradient-to-r from-orange-100 to-amber-50 text-orange-700 px-2 py-0.5 rounded-full font-black animate-fade-in border border-orange-200 shadow-[0_2px_10px_rgba(249,115,22,0.15)] max-w-full',
        className,
      )}
      title={description}
    >
      <Zap className="w-3 h-3 mr-1 fill-orange-500 text-orange-500 animate-pulse shrink-0" />
      <span className="truncate">{showLabel ? description : count}</span>
    </span>
  )
}
