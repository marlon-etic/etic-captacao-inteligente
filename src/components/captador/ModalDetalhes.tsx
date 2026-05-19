import React from 'react'
import { Demand } from './BuscarDemandas'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function ModalDetalhes({
  demanda,
  onClose,
}: {
  demanda: Demand | null
  onClose: () => void
}) {
  if (!demanda) return null

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
