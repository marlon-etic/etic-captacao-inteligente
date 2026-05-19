import React, { useState } from 'react'
import { Demand } from './BuscarDemandas'
import { Button } from '@/components/ui/button'
import { X, Unlink } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { unlinkImovelFromDemanda } from '@/services/vinculacao'
import { useToast } from '@/hooks/use-toast'

export function ModalDetalhes({
  demanda,
  onClose,
  onReload,
  onVincular,
}: {
  demanda: Demand | null
  onClose: () => void
  onReload?: () => void
  onVincular?: () => void
}) {
  const { currentUser } = useAppStore()
  const { toast } = useToast()
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null)

  if (!demanda) return null

  const handleUnlink = async (imovelId: string) => {
    try {
      console.log(`[NOTIFICACAO] Imóvel ${imovelId} desvinculado da demanda ${demanda.id}`)
      setIsUnlinking(imovelId)
      await unlinkImovelFromDemanda(imovelId, demanda.tipo === 'locacao')
      toast({
        title: 'Imóvel desvinculado',
        description: 'O imóvel foi desvinculado da demanda com sucesso.',
        className: 'bg-[#10B981] text-white border-none',
      })
      if (onReload) onReload()
      onClose()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao desvincular imóvel.',
        variant: 'destructive',
      })
    } finally {
      setIsUnlinking(null)
    }
  }

  const getUrgencyColor = (urgencia: string) => {
    switch (urgencia) {
      case 'Crítica':
      case 'Urgente':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'Alta':
        return 'text-orange-700 bg-orange-50 border-orange-200'
      default:
        return 'text-green-700 bg-green-50 border-green-200'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-[600px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 rounded-t-xl shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Detalhes da Demanda</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Client Info */}
          <div>
            <h3 className="mb-3 text-sm font-bold tracking-wider text-gray-500 uppercase">
              Dados do Cliente
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="block text-xs text-gray-500">Nome</span>
                <strong className="text-gray-900">{demanda.nome_cliente}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="block text-xs text-gray-500">Email</span>
                <strong className="text-gray-900 break-all">
                  {demanda.email || 'Não informado'}
                </strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="block text-xs text-gray-500">Telefone</span>
                <strong className="text-gray-900">{demanda.telefone || 'Não informado'}</strong>
              </div>
            </div>
          </div>

          {/* Demand Info */}
          <div>
            <h3 className="mb-3 text-sm font-bold tracking-wider text-gray-500 uppercase">
              Especificações
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="block text-xs text-gray-500">Tipo</span>
                <strong className="text-gray-900 capitalize">{demanda.tipo}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="block text-xs text-gray-500">Dormitórios</span>
                <strong className="text-gray-900">{demanda.dormitorios || 'Indiferente'}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="block text-xs text-gray-500">Vagas</span>
                <strong className="text-gray-900">{demanda.vagas || 'Indiferente'}</strong>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="block text-xs text-gray-500">Banheiros</span>
                <strong className="text-gray-900">{demanda.banheiros || 'Indiferente'}</strong>
              </div>
              <div className="col-span-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="block text-xs text-gray-500">Budget (Mín - Máx)</span>
                <strong className="text-gray-900">
                  R$ {demanda.valor_minimo.toLocaleString('pt-BR')} - R${' '}
                  {demanda.valor_maximo.toLocaleString('pt-BR')}
                </strong>
              </div>
              <div className="col-span-2 p-3 md:col-span-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="block text-xs text-gray-500">Bairros de Interesse</span>
                <strong className="text-gray-900">
                  {demanda.bairros?.join(', ') || 'Não especificado'}
                </strong>
              </div>
            </div>
          </div>

          {/* Imóveis Vinculados */}
          {demanda.imoveis && demanda.imoveis.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase">
                  Imóveis Vinculados
                </h3>
                {onVincular && (
                  <Button
                    onClick={onVincular}
                    size="sm"
                    className="bg-[#2E5F8A] hover:bg-[#1A3A52] text-white text-xs h-8"
                  >
                    + Vincular Novo Imóvel
                  </Button>
                )}
              </div>{' '}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {demanda.imoveis.map((imv) => {
                  const isMine =
                    imv.captador_id === currentUser?.id || imv.user_captador_id === currentUser?.id
                  const canUnlink =
                    isMine || currentUser?.role === 'admin' || currentUser?.role === 'gestor'

                  return (
                    <div
                      key={imv.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isMine ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">
                          {imv.codigo_imovel || 'Sem Código'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {isMine ? 'Vinculado por você' : 'Vinculado por outro captador'}
                        </span>
                      </div>
                      {canUnlink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlink(imv.id)}
                          disabled={isUnlinking === imv.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                        >
                          <Unlink className="w-4 h-4 mr-1" />
                          Desvincular
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Status & Meta */}
          <div>
            <h3 className="mb-3 text-sm font-bold tracking-wider text-gray-500 uppercase">
              Status e Metadados
            </h3>
            <div className="flex flex-wrap gap-3">
              <div
                className={`px-3 py-1.5 border rounded-lg text-sm font-semibold flex items-center gap-2 ${getUrgencyColor(demanda.urgencia)}`}
              >
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                Urgência: {demanda.urgencia}
              </div>
              <div className="px-3 py-1.5 border rounded-lg text-sm font-semibold bg-gray-50 text-gray-700 border-gray-200 capitalize">
                Status: {demanda.status}
              </div>
              <div className="px-3 py-1.5 border rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 border-blue-200">
                De: {demanda.criador_nome}
              </div>
              <div className="px-3 py-1.5 border rounded-lg text-sm font-semibold bg-gray-50 text-gray-700 border-gray-200">
                Em: {new Date(demanda.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-end shrink-0">
          <Button onClick={onClose} variant="outline" className="font-bold border-gray-300">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
