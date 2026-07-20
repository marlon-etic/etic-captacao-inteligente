import { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { X, Building2, User, Calendar, Loader2, Trophy, MapPin, Trash2 } from 'lucide-react'
import {
  Campanha,
  CampanhaImovel,
  fetchCampanhaImoveis,
  unlinkPropertyFromCampanha,
} from '@/services/campanhaService'
import { CampanhaPropertyManager } from './CampanhaPropertyManager'
import { Progress } from '@/components/ui/progress'
import { useUserRole } from '@/hooks/use-user-role'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface CampanhaDetailsModalProps {
  campanha: Campanha | null
  isOpen: boolean
  onClose: () => void
}

const tipoLabels: Record<string, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  galpao: 'Galpão',
  comercial: 'Comercial',
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val)

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function CampanhaDetailsModal({ campanha, isOpen, onClose }: CampanhaDetailsModalProps) {
  const [imoveis, setImoveis] = useState<CampanhaImovel[]>([])
  const [loading, setLoading] = useState(false)
  const [localProgress, setLocalProgress] = useState(0)
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)
  const [refreshSignal, setRefreshSignal] = useState(0)

  const { isAdmin } = useUserRole()
  const { user } = useAuth()
  const { toast } = useToast()

  const loadImoveis = useCallback(async () => {
    if (!campanha) return
    setLoading(true)
    try {
      const data = await fetchCampanhaImoveis(campanha.id)
      setImoveis(data)
      setLocalProgress(data.length)
    } catch {
      setImoveis([])
    } finally {
      setLoading(false)
    }
  }, [campanha])

  useEffect(() => {
    if (campanha && isOpen) {
      setLocalProgress(campanha.progresso)
      loadImoveis()
    } else {
      setImoveis([])
    }
  }, [campanha, isOpen, loadImoveis])

  const handleUnlink = async (imovelId: string) => {
    if (!campanha || !user) return
    setUnlinkingId(imovelId)
    try {
      const newProgress = await unlinkPropertyFromCampanha(campanha.id, imovelId, user.id)
      setImoveis((prev) => prev.filter((i) => i.imovel_id !== imovelId))
      setLocalProgress(newProgress)
      setRefreshSignal((s) => s + 1)
      toast({
        title: 'Imóvel removido',
        description: 'O imóvel foi desvinculado da campanha.',
        className: 'bg-[#2E5F8A] text-white',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao remover',
        description: err.message || 'Erro ao desvincular imóvel da campanha.',
        variant: 'destructive',
      })
    } finally {
      setUnlinkingId(null)
    }
  }

  if (!campanha) return null

  const pct = Math.min(100, (localProgress / campanha.meta) * 100)
  const goalReached = localProgress >= campanha.meta

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3 bg-[#1A3A52] text-white relative">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {tipoLabels[campanha.tipo_imovel] || campanha.tipo_imovel}
          </DialogTitle>
          <DialogClose asChild>
            <button className="absolute right-4 top-[50%] -translate-y-[50%] h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
              <X className="w-5 h-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#F5F5F5] rounded-lg p-3">
              <p className="text-xs text-[#999999] font-bold uppercase mb-1">Faixa de Valor</p>
              <p className="text-sm font-bold text-[#1A3A52]">
                {formatCurrency(campanha.faixa_valor_min)}
              </p>
              <p className="text-sm font-bold text-[#1A3A52]">
                {formatCurrency(campanha.faixa_valor_max)}
              </p>
            </div>
            <div className="bg-[#F5F5F5] rounded-lg p-3">
              <p className="text-xs text-[#999999] font-bold uppercase mb-1">Encerramento</p>
              <p className="text-sm font-bold text-[#1A3A52]">{formatDate(campanha.data_fim)}</p>
            </div>
            <div className="bg-[#F5F5F5] rounded-lg p-3">
              <p className="text-xs text-[#999999] font-bold uppercase mb-1">Status</p>
              <p
                className={cn(
                  'text-sm font-bold',
                  campanha.status === 'ativa' ? 'text-green-600' : 'text-gray-500',
                )}
              >
                {campanha.status === 'ativa'
                  ? 'Ativa'
                  : campanha.status === 'pausada'
                    ? 'Pausada'
                    : 'Fechada'}
              </p>
            </div>
          </div>

          {campanha.bairros_alvo && campanha.bairros_alvo.length > 0 && (
            <div>
              <h4 className="font-bold text-[#1A3A52] text-sm mb-2 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#2E5F8A]" />
                Bairros de Foco
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {campanha.bairros_alvo.map((bairro) => (
                  <span
                    key={bairro}
                    className="px-2 py-1 rounded-full bg-[#EFF6FF] text-[#1A3A52] text-xs font-medium"
                  >
                    {bairro}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-[#666666]">Progresso da Meta</span>
              <span
                className={cn(
                  'text-lg font-black',
                  goalReached ? 'text-green-600' : 'text-[#1A3A52]',
                )}
              >
                {localProgress}/{campanha.meta}
                {goalReached && <Trophy className="inline-block w-4 h-4 ml-1" />}
              </span>
            </div>
            <Progress
              value={pct}
              className={cn(
                'h-3',
                campanha.status === 'ativa' ? '[&>div]:bg-green-500' : '[&>div]:bg-gray-400',
              )}
            />
            {goalReached && (
              <p className="text-green-600 font-bold text-xs mt-1.5">Meta atingida!</p>
            )}
          </div>

          <div>
            <h4 className="font-bold text-[#1A3A52] text-sm mb-2">
              Imóveis Vinculados ({imoveis.length})
            </h4>
            <ScrollArea className="max-h-[300px] rounded-lg border border-[#E5E5E5]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1A3A52]" />
                </div>
              ) : imoveis.length === 0 ? (
                <div className="text-center py-12 text-[#999999] font-medium text-sm">
                  Nenhum imóvel vinculado ainda.
                </div>
              ) : (
                <div className="divide-y divide-[#E5E5E5]">
                  {imoveis.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#1A3A52] text-sm">
                          {item.imovel?.codigo_imovel || 'Sem código'}
                        </p>
                        <p className="text-xs text-[#999999] truncate">
                          {item.imovel?.endereco || 'Endereço não informado'}
                        </p>
                        {item.imovel?.localizacao_texto && (
                          <p className="text-xs text-[#666666] font-medium flex items-center gap-1 mt-0.5">
                            <span>📍 {item.imovel.localizacao_texto}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {(item.imovel?.preco || item.imovel?.valor) && (
                            <p className="text-xs text-[#666666] font-medium">
                              {formatCurrency(item.imovel?.preco || item.imovel?.valor || 0)}
                            </p>
                          )}
                          {item.imovel?.status_captacao && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
                              {item.imovel.status_captacao}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-bold text-[#1A3A52] flex items-center gap-1 justify-end">
                            <User className="w-3 h-3" />
                            {item.captador?.nome || 'N/D'}
                          </p>
                          <p className="text-xs text-[#999999] flex items-center gap-1 justify-end mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.data_adicionado)}
                          </p>
                        </div>
                        {isAdmin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={unlinkingId === item.imovel_id}
                            onClick={() => handleUnlink(item.imovel_id)}
                            className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Remover da campanha"
                          >
                            {unlinkingId === item.imovel_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
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

          {isAdmin && (
            <CampanhaPropertyManager
              campanha={campanha}
              onLinked={(newProgress) => {
                setLocalProgress(newProgress)
                loadImoveis()
              }}
              refreshSignal={refreshSignal}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
