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
  const { count, loading } = useQuickMatchCount({
    preco: imovel?.preco || imovel?.valor,
    endereco: imovel?.endereco,
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

  return (
    <span
      className={cn(
        'inline-flex items-center text-[10px] bg-gradient-to-r from-orange-100 to-amber-50 text-orange-700 px-2 py-0.5 rounded-full font-black animate-fade-in border border-orange-200 shadow-[0_2px_10px_rgba(249,115,22,0.15)]',
        className,
      )}
      title={`${count} clientes procurando imóvel semelhante`}
    >
      <Zap className="w-3 h-3 mr-1 fill-orange-500 text-orange-500 animate-pulse" />
      {count} {showLabel ? (count === 1 ? 'Match Rápido' : 'Matches Rápidos') : ''}
    </span>
  )
}
