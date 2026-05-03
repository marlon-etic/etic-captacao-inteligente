import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { checkinService } from '@/services/checkinService'

export function NewClientCheckInForm({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    tipo: 'Locação',
    budgetMin: '',
    budgetMax: '',
    bairros: '',
    tipoImovel: 'Apartamento',
    dormitorios: '1',
    vagas: '1',
    observacoes: '',
    dataLimite: '',
  })
  const [errors, setErrors] = useState<any>({})

  const validate = () => {
    const newErrors: any = {}
    if (formData.nome.length < 3) newErrors.nome = 'Mínimo 3 caracteres'
    if (!formData.email.includes('@')) newErrors.email = 'Email inválido'
    if (formData.telefone.replace(/\D/g, '').length < 10) newErrors.telefone = 'Telefone inválido'
    if (!formData.budgetMin || Number(formData.budgetMin) < 0)
      newErrors.budgetMin = 'Valor inválido'
    if (!formData.budgetMax || Number(formData.budgetMax) < 0)
      newErrors.budgetMax = 'Valor inválido'
    if (!formData.bairros.trim()) newErrors.bairros = 'Obrigatório'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !user) return
    setLoading(true)
    try {
      const table = formData.tipo === 'Locação' ? 'demandas_locacao' : 'demandas_vendas'
      const payload: any = {
        nome_cliente: formData.nome,
        cliente_nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        bairros: formData.bairros.split(',').map((b) => b.trim()),
        valor_minimo: Number(formData.budgetMin),
        valor_maximo: Number(formData.budgetMax),
        dormitorios: Number(formData.dormitorios),
        vagas_estacionamento: Number(formData.vagas),
        tipo_imovel: formData.tipoImovel,
        observacoes: formData.observacoes,
        status_demanda: 'aberta',
        nivel_urgencia: 'Média',
      }

      if (formData.tipo === 'Locação') {
        payload.sdr_id = user.id
      } else {
        payload.corretor_id = user.id
      }

      if (formData.dataLimite) {
        payload.data_prazo_resposta = new Date(formData.dataLimite).toISOString()
      }

      const { error } = await supabase.from(table).insert([payload])
      if (error) throw error

      const today = await checkinService.getTodayStats(user.id)
      await checkinService.updateTodayStats(user.id, {
        novos_clientes: (today?.novos_clientes || 0) + 1,
      })

      toast({ title: 'Cliente registrado com sucesso!' })
      onSuccess()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b shrink-0 bg-gray-50">
          <DialogTitle>Registrar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados obrigatórios para iniciar a demanda.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          <form id="new-client-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome Cliente *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
              {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email *</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="11999999999"
                />
                {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>}
              </div>
            </div>

            <div>
              <Label>Tipo de Demanda *</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              >
                <option value="Locação">Locação</option>
                <option value="Venda">Venda</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Budget Mínimo *</Label>
                <Input
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                />
                {errors.budgetMin && (
                  <p className="text-red-500 text-xs mt-1">{errors.budgetMin}</p>
                )}
              </div>
              <div>
                <Label>Budget Máximo *</Label>
                <Input
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                />
                {errors.budgetMax && (
                  <p className="text-red-500 text-xs mt-1">{errors.budgetMax}</p>
                )}
              </div>
            </div>

            <div>
              <Label>Bairros Desejados (separados por vírgula) *</Label>
              <Input
                value={formData.bairros}
                onChange={(e) => setFormData({ ...formData, bairros: e.target.value })}
              />
              {errors.bairros && <p className="text-red-500 text-xs mt-1">{errors.bairros}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <Label>Tipo de Imóvel *</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.tipoImovel}
                  onChange={(e) => setFormData({ ...formData, tipoImovel: e.target.value })}
                >
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Comercial">Comercial</option>
                </select>
              </div>
              <div className="col-span-3 sm:col-span-1">
                <Label>Dormitórios *</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.dormitorios}
                  onChange={(e) => setFormData({ ...formData, dormitorios: e.target.value })}
                >
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3 sm:col-span-1">
                <Label>Vagas *</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.vagas}
                  onChange={(e) => setFormData({ ...formData, vagas: e.target.value })}
                >
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Data Limite de Resposta (Opcional)</Label>
              <Input
                type="datetime-local"
                value={formData.dataLimite}
                onChange={(e) => setFormData({ ...formData, dataLimite: e.target.value })}
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Input
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </div>
          </form>
        </ScrollArea>

        <div className="p-4 border-t shrink-0 flex justify-end gap-3 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="new-client-form"
            disabled={loading}
            className="bg-[#10B981] hover:bg-[#059669] text-white"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Salvar Cliente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
