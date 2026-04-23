import { useState } from 'react'
import { linkImovelToDemanda } from '@/services/vinculacaoService'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConfirmacaoVinculacaoMatchProps {
  match: {
    id: string
    imovel_id: string
    demanda_id: string
    demanda_tipo: 'Venda' | 'Locação'
    score: number
    imovel?: any
    demanda?: any
  }
  onClose: () => void
  onSuccess: () => void
}

export function ConfirmacaoVinculacaoMatch({
  match,
  onClose,
  onSuccess,
}: ConfirmacaoVinculacaoMatchProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleConfirm = async () => {
    try {
      setLoading(true)

      await linkImovelToDemanda(match.imovel_id, match.demanda_id, match.demanda_tipo === 'Locação')

      toast({
        title: '✅ Vinculação realizada com sucesso!',
        description: 'Imóvel vinculado à demanda.',
      })

      onSuccess()
    } catch (error: any) {
      console.error('[CONFIRMACAO] Erro ao vincular:', error)
      toast({
        title: '❌ Erro ao vincular',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="bg-[#1A3A52] px-6 py-4 text-white flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold">Confirmar Vinculação</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 w-8 h-8 rounded-lg transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* SCORE */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-blue-800 uppercase tracking-wider block mb-1">
                Compatibilidade
              </span>
              <p className="text-sm text-blue-600 font-medium">
                Este imóvel é altamente compatível com a demanda selecionada
              </p>
            </div>
            <span className="text-4xl font-black text-blue-600">{match.score}%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* IMÓVEL */}
            <div className="border-l-4 border-green-500 pl-4 space-y-3">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider">Imóvel</h3>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Código</p>
                <p className="text-base font-bold text-gray-800">
                  {match.imovel?.codigo_imovel || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Localização</p>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {match.imovel?.localizacao_texto || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Valor</p>
                <p className="text-lg font-black text-green-600">
                  R${' '}
                  {match.imovel?.preco?.toLocaleString('pt-BR') ||
                    match.imovel?.valor?.toLocaleString('pt-BR') ||
                    '0,00'}
                </p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Dormitórios</p>
                  <p className="text-sm font-bold text-gray-800">
                    {match.imovel?.dormitorios || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Vagas</p>
                  <p className="text-sm font-bold text-gray-800">{match.imovel?.vagas || 0}</p>
                </div>
              </div>
            </div>

            {/* DEMANDA */}
            <div className="border-l-4 border-purple-500 pl-4 space-y-3">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider">Demanda</h3>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Cliente</p>
                <p className="text-base font-bold text-gray-800 line-clamp-1">
                  {match.demanda?.nome_cliente || match.demanda?.cliente_nome || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Tipo</p>
                <p className="text-sm text-gray-700 font-medium">
                  {match.demanda_tipo === 'Venda' ? '🏷️ Venda' : '🔑 Locação'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Orçamento</p>
                <p className="text-sm font-bold text-gray-800">
                  R$ {match.demanda?.valor_minimo?.toLocaleString('pt-BR') || 0} - R${' '}
                  {match.demanda?.valor_maximo?.toLocaleString('pt-BR') || 0}
                </p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Dormitórios</p>
                  <p className="text-sm font-bold text-gray-800">
                    {match.demanda?.dormitorios || match.demanda?.quartos || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Vagas</p>
                  <p className="text-sm font-bold text-gray-800">
                    {match.demanda?.vagas_estacionamento || match.demanda?.vagas || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AVISO */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ Ao confirmar, este imóvel será vinculado à demanda do cliente. Você poderá
              desvincular depois se necessário.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex gap-3 justify-end shrink-0">
          <Button variant="outline" onClick={onClose} disabled={loading} className="px-6 bg-white">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Vinculando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirmar Vinculação
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
