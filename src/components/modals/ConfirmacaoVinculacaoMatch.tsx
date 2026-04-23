import { useState } from 'react'
import { linkImovelToDemanda } from '@/services/vinculacaoService'
import { useToast } from '@/components/ui/use-toast'
import { useUserRole } from '@/hooks/use-user-role'

interface ConfirmacaoVinculacaoMatchProps {
  match: {
    id: string
    imovel_id: string
    demanda_id: string
    demanda_tipo: 'Venda' | 'Locação'
    score: number
    imovel: any
    demanda: any
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
  const { role } = useUserRole()
  const { toast } = useToast()

  const handleConfirm = async () => {
    try {
      setLoading(true)

      await linkImovelToDemanda(
        match.imovel_id,
        match.demanda_id,
        match.demanda_tipo === 'Locação',
        role,
      )

      toast({
        title: '✅ Vinculação realizada com sucesso!',
        description: 'Imóvel vinculado à demanda',
      })

      onSuccess()
      onClose()
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div className="sticky top-0 bg-[#1A3A52] px-6 py-4 text-white flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">Confirmar Vinculação</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-700">Compatibilidade</span>
              <span className="text-3xl font-black text-blue-600">{match.score}%</span>
            </div>
            <p className="text-xs text-blue-600 mt-2 font-medium">
              Este imóvel é altamente compatível com a demanda selecionada
            </p>
          </div>

          <div className="border-l-4 border-emerald-500 pl-4">
            <h3 className="text-sm font-black text-gray-500 uppercase mb-3">Imóvel</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Código</p>
                <p className="text-lg font-black text-gray-800">
                  {match.imovel?.codigo_imovel || 'Sem código'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Localização</p>
                <p className="text-sm text-gray-700 font-medium">
                  {match.imovel?.localizacao_texto || 'Não informada'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Valor</p>
                <p className="text-lg font-black text-emerald-600">
                  R$ {(match.imovel?.preco || match.imovel?.valor || 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-6 pt-2">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Dormitórios</p>
                  <p className="text-sm font-black text-gray-700">
                    {match.imovel?.dormitorios || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Vagas</p>
                  <p className="text-sm font-black text-gray-700">{match.imovel?.vagas || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="text-sm font-black text-gray-500 uppercase mb-3">Demanda</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Cliente</p>
                <p className="text-lg font-black text-gray-800">
                  {match.demanda?.nome_cliente || match.demanda?.cliente_nome}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Tipo</p>
                <p className="text-sm font-black text-gray-700 bg-gray-100 w-fit px-2 py-1 rounded">
                  {match.demanda_tipo === 'Venda' ? '🏷️ Venda' : '🔑 Locação'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Orçamento</p>
                <p className="text-sm font-medium text-gray-700">
                  R$ {(match.demanda?.valor_minimo || 0).toLocaleString('pt-BR')} - R${' '}
                  {(match.demanda?.valor_maximo || 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-6 pt-2">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Dormitórios</p>
                  <p className="text-sm font-black text-gray-700">
                    {match.demanda?.dormitorios || match.demanda?.quartos || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Vagas</p>
                  <p className="text-sm font-black text-gray-700">
                    {match.demanda?.vagas_estacionamento || match.demanda?.vagas || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs text-amber-700 font-medium">
              ⚠️ Ao confirmar, este imóvel será vinculado à demanda do cliente. Você poderá
              desvincular depois se necessário.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end z-10">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Vinculando...
              </>
            ) : (
              <>✓ Confirmar Vinculação</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
