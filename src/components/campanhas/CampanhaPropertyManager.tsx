import { useState, useEffect, useCallback } from 'react'
import { Search, Loader2, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useUserRole } from '@/hooks/use-user-role'
import {
  Campanha,
  SuggestedImovel,
  fetchSuggestedProperties,
  linkPropertyToCampanha,
  discardPropertyFromCampanha,
} from '@/services/campanhaService'

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val)

interface CampanhaPropertyManagerProps {
  campanha: Campanha
  onLinked: (newProgress: number) => void
  refreshSignal: number
}

export function CampanhaPropertyManager({
  campanha,
  onLinked,
  refreshSignal,
}: CampanhaPropertyManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { isAdmin, isGestor } = useUserRole()
  const [suggestions, setSuggestions] = useState<SuggestedImovel[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [linkingId, setLinkingId] = useState<string | null>(null)
  const [discardingId, setDiscardingId] = useState<string | null>(null)

  const canDiscard = isAdmin || isGestor

  const loadSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchSuggestedProperties(campanha)
      setSuggestions(data)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [campanha])

  useEffect(() => {
    loadSuggestions()
  }, [loadSuggestions, refreshSignal])

  const handleLink = async (imovel: SuggestedImovel) => {
    if (!user) return
    setLinkingId(imovel.id)
    try {
      const newProgress = await linkPropertyToCampanha(
        campanha.id,
        imovel.id,
        user.id,
        imovel.user_captador_id,
      )
      toast({
        title: 'Imóvel vinculado!',
        description: `${imovel.codigo_imovel || 'Imóvel'} adicionado à campanha.`,
        className: 'bg-[#4CAF50] text-white',
      })
      setSuggestions((prev) => prev.filter((s) => s.id !== imovel.id))
      onLinked(newProgress)
    } catch (err: any) {
      toast({
        title: 'Erro ao vincular',
        description: err.message || 'Erro ao vincular imóvel à campanha.',
        variant: 'destructive',
      })
    } finally {
      setLinkingId(null)
    }
  }

  const handleDiscard = async (imovel: SuggestedImovel) => {
    setDiscardingId(imovel.id)
    try {
      await discardPropertyFromCampanha(campanha.id, imovel.id)
      setSuggestions((prev) => prev.filter((s) => s.id !== imovel.id))
      toast({
        title: 'Imóvel descartado',
        description: `${imovel.codigo_imovel || 'Imóvel'} removido das sugestões.`,
        className: 'bg-gray-100 text-gray-800',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao descartar',
        description: err.message || 'Erro ao descartar imóvel.',
        variant: 'destructive',
      })
    } finally {
      setDiscardingId(null)
    }
  }

  const filtered = suggestions.filter((s) => {
    if (!search) return true
    const str =
      `${s.codigo_imovel || ''} ${s.endereco || ''} ${s.localizacao_texto || ''}`.toLowerCase()
    return str.includes(search.toLowerCase())
  })

  const isBusy = linkingId !== null || discardingId !== null

  return (
    <div className="border-t border-[#E5E5E5] pt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-[#1A3A52] text-sm">Imóveis Sugeridos</h4>
        <Badge variant="secondary" className="text-xs">
          {filtered.length} disponível{filtered.length !== 1 ? 'eis' : ''}
        </Badge>
      </div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999] w-4 h-4" />
        <Input
          placeholder="Buscar por código ou endereço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
      <ScrollArea className="max-h-[200px] rounded-lg border border-[#E5E5E5]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#1A3A52]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-[#999999] font-medium text-sm">
            Nenhum imóvel sugerido disponível.
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E5]">
            {filtered.map((imovel) => (
              <div
                key={imovel.id}
                className="p-2.5 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#1A3A52] text-sm truncate">
                    {imovel.codigo_imovel || 'Sem código'}
                  </p>
                  <p className="text-xs text-[#999999] truncate">
                    {imovel.endereco || imovel.localizacao_texto || 'Endereço não informado'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {(imovel.valor || imovel.preco) && (
                      <span className="text-xs text-[#666666] font-medium">
                        {formatCurrency(imovel.valor || imovel.preco || 0)}
                      </span>
                    )}
                    {imovel.tipo_imovel && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
                        {imovel.tipo_imovel}
                      </span>
                    )}
                    {imovel.created_at && (
                      <span className="text-[10px] text-[#999999] font-medium">
                        {new Date(imovel.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <Button
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handleLink(imovel)}
                    className="h-8 px-3 bg-[#2E5F8A] hover:bg-[#1A3A52] text-white"
                  >
                    {linkingId === imovel.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Vincular
                      </>
                    )}
                  </Button>
                  {canDiscard && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => handleDiscard(imovel)}
                      className="h-8 px-2.5 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                    >
                      {discardingId === imovel.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5 mr-1" />
                          Descartar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
