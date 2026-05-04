import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle } from 'lucide-react'

export function LeadDetailsModal({
  lead,
  onClose,
  refetch,
}: {
  lead: any
  onClose: () => void
  refetch: () => void
}) {
  const [updating, setUpdating] = useState(false)

  const marcarConvertido = async () => {
    setUpdating(true)
    const { error } = await supabase
      .from('imoveis_captados')
      .update({ status_captacao: 'fechado', etapa_funil: 'fechado' })
      .eq('id', lead.id)

    setUpdating(false)
    if (error) {
      toast.error('Erro ao atualizar: ' + error.message)
    } else {
      toast.success('Imóvel marcado como convertido com sucesso!')
      refetch()
      onClose()
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] rounded-2xl p-0 overflow-hidden bg-white">
        <DialogHeader className="bg-gray-50 p-6 border-b border-gray-100">
          <DialogTitle className="text-xl font-bold text-[#1A3A52]">
            Detalhes do Lead (Imóvel)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-gray-500 font-medium mb-1">Código</p>
              <p className="font-bold text-gray-900 text-lg">{lead.codigo_imovel || '-'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-gray-500 font-medium mb-1">Status Atual</p>
              <Badge variant="secondary" className="uppercase font-bold tracking-wider">
                {lead.status_captacao || 'pendente'}
              </Badge>
            </div>
            <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-gray-500 font-medium mb-1">Endereço Completo</p>
              <p className="text-gray-900 font-medium">{lead.endereco || '-'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-gray-500 font-medium mb-1">Tipo de Imóvel</p>
              <p className="text-gray-900 font-medium">{lead.tipo_imovel || '-'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-gray-500 font-medium mb-1">Valor VGV</p>
              <p className="text-emerald-600 font-black text-lg">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  lead.preco || lead.valor || 0,
                )}
              </p>
            </div>
            <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-gray-500 font-medium mb-1">Observações de Captação</p>
              <p className="text-gray-700 mt-1 min-h-[60px] font-medium leading-relaxed">
                {lead.observacoes || 'Nenhuma observação informada durante a captação.'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Button variant="outline" className="font-bold rounded-lg px-6" onClick={onClose}>
              Fechar
            </Button>
            {lead.status_captacao !== 'fechado' && (
              <Button
                onClick={marcarConvertido}
                disabled={updating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md shadow-emerald-600/20 rounded-lg"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {updating ? 'Salvando...' : 'Marcar como Convertido'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
