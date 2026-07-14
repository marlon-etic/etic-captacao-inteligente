import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Loader2 } from 'lucide-react'
import { updateCampanha } from '@/services/campanhaService'
import { Campanha } from '@/services/campanhaService'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { BairroSelector } from '@/components/BairroSelector'
import { REGIONS_DATA } from '@/lib/regions'

interface EditCampanhaModalProps {
  campanha: Campanha | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function toDateInput(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  } catch {
    return ''
  }
}

export function EditCampanhaModal({
  campanha,
  isOpen,
  onClose,
  onSuccess,
}: EditCampanhaModalProps) {
  const { toast } = useToast()
  const [tipoImovel, setTipoImovel] = useState('')
  const [valorMin, setValorMin] = useState('')
  const [valorMax, setValorMax] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [meta, setMeta] = useState('')
  const [status, setStatus] = useState('ativa')
  const [activateNow, setActivateNow] = useState(true)
  const [bairros, setBairros] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (campanha && isOpen) {
      setTipoImovel(campanha.tipo_imovel)
      setValorMin(String(campanha.faixa_valor_min))
      setValorMax(String(campanha.faixa_valor_max))
      setDataInicio(toDateInput(campanha.data_inicio))
      setDataFim(toDateInput(campanha.data_fim))
      setMeta(String(campanha.meta))
      setStatus(campanha.status)
      setActivateNow(campanha.status === 'ativa')
      setBairros(campanha.bairros_alvo || [])
      setErrors({})
    }
  }, [campanha, isOpen])

  const toggleAncora = (nome: string) => {
    const region = REGIONS_DATA.find((r) => r.anchor === nome)
    if (!region) return
    const allItems = [nome, ...region.satellites]
    const isSelected = bairros.includes(nome)
    if (isSelected) {
      setBairros((prev) => prev.filter((b) => !allItems.includes(b)))
    } else {
      setBairros((prev) => [...prev, ...allItems.filter((b) => !prev.includes(b))])
    }
  }

  const toggleSatelite = (nome: string) => {
    setBairros((prev) => (prev.includes(nome) ? prev.filter((b) => b !== nome) : [...prev, nome]))
  }

  const clearBairros = () => {
    setBairros([])
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!tipoImovel) e.tipoImovel = 'Selecione um tipo de imóvel'
    const min = parseFloat(valorMin)
    const max = parseFloat(valorMax)
    if (!valorMin || isNaN(min) || min < 0) e.valorMin = 'Valor mínimo inválido'
    if (!valorMax || isNaN(max) || max < 0) e.valorMax = 'Valor máximo inválido'
    if (!e.valorMin && !e.valorMax && min >= max) e.valorMax = 'Máximo deve ser maior que o mínimo'
    if (!dataInicio) e.dataInicio = 'Data de início é obrigatória'
    if (!dataFim) {
      e.dataFim = 'Data de fim é obrigatória'
    } else if (dataInicio) {
      const inicio = new Date(dataInicio)
      const fim = new Date(dataFim)
      if (fim <= inicio) e.dataFim = 'Data de fim deve ser após a data de início'
    }
    if (!meta || isNaN(parseInt(meta)) || parseInt(meta) < 1) e.meta = 'Meta deve ser maior que 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!campanha || !validate()) return
    setIsSubmitting(true)
    try {
      const finalStatus = status === 'fechada' ? 'fechada' : activateNow ? 'ativa' : 'pausada'
      await updateCampanha(campanha.id, {
        tipo_imovel: tipoImovel,
        faixa_valor_min: parseFloat(valorMin),
        faixa_valor_max: parseFloat(valorMax),
        data_inicio: new Date(dataInicio).toISOString(),
        data_fim: new Date(dataFim).toISOString(),
        meta: parseInt(meta),
        status: finalStatus,
        bairros_alvo: bairros.length > 0 ? bairros : null,
      })
      toast({
        title: '✅ Campanha atualizada com sucesso!',
        className: 'bg-emerald-600 text-white',
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Falha ao atualizar campanha',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v && !isSubmitting) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 bg-[#1A3A52] text-white relative">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Editar Campanha de Captação
          </DialogTitle>
          <DialogClose asChild>
            <button className="absolute right-4 top-[50%] -translate-y-[50%] h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
              <X className="w-5 h-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <Label className="font-bold text-[#333333] mb-1.5 block">Tipo de Imóvel *</Label>
            <Select
              value={tipoImovel}
              onValueChange={(v) => {
                setTipoImovel(v)
                setErrors((p) => ({ ...p, tipoImovel: '' }))
              }}
            >
              <SelectTrigger className={cn(errors.tipoImovel && 'border-red-500')}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartamento">Apartamento</SelectItem>
                <SelectItem value="casa">Casa</SelectItem>
                <SelectItem value="galpao">Galpão</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
              </SelectContent>
            </Select>
            {errors.tipoImovel && (
              <p className="text-red-500 text-xs mt-1 font-medium">{errors.tipoImovel}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-bold text-[#333333] mb-1.5 block">Valor Mínimo (R$) *</Label>
              <Input
                type="number"
                placeholder="Ex: 100000"
                value={valorMin}
                onChange={(e) => {
                  setValorMin(e.target.value)
                  setErrors((p) => ({ ...p, valorMin: '' }))
                }}
                className={cn(errors.valorMin && 'border-red-500')}
              />
              {errors.valorMin && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.valorMin}</p>
              )}
            </div>
            <div>
              <Label className="font-bold text-[#333333] mb-1.5 block">Valor Máximo (R$) *</Label>
              <Input
                type="number"
                placeholder="Ex: 500000"
                value={valorMax}
                onChange={(e) => {
                  setValorMax(e.target.value)
                  setErrors((p) => ({ ...p, valorMax: '' }))
                }}
                className={cn(errors.valorMax && 'border-red-500')}
              />
              {errors.valorMax && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.valorMax}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-bold text-[#333333] mb-1.5 block">Data de Início *</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => {
                  setDataInicio(e.target.value)
                  setErrors((p) => ({ ...p, dataInicio: '' }))
                }}
                className={cn(errors.dataInicio && 'border-red-500')}
              />
              {errors.dataInicio && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.dataInicio}</p>
              )}
            </div>
            <div>
              <Label className="font-bold text-[#333333] mb-1.5 block">
                Data de Encerramento *
              </Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => {
                  setDataFim(e.target.value)
                  setErrors((p) => ({ ...p, dataFim: '' }))
                }}
                className={cn(errors.dataFim && 'border-red-500')}
              />
              {errors.dataFim && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.dataFim}</p>
              )}
            </div>
          </div>

          <div>
            <Label className="font-bold text-[#333333] mb-1.5 block">Meta (nº de imóveis) *</Label>
            <Input
              type="number"
              placeholder="Ex: 5"
              value={meta}
              onChange={(e) => {
                setMeta(e.target.value)
                setErrors((p) => ({ ...p, meta: '' }))
              }}
              className={cn(errors.meta && 'border-red-500')}
            />
            {errors.meta && <p className="text-red-500 text-xs mt-1 font-medium">{errors.meta}</p>}
          </div>

          <div>
            <Label className="font-bold text-[#333333] mb-1.5 block">
              Bairros de Foco (opcional)
            </Label>
            <BairroSelector
              selectedBairros={bairros}
              toggleAncora={toggleAncora}
              toggleSatelite={toggleSatelite}
              onClear={clearBairros}
            />
            <p className="text-xs text-[#999999] mt-1">
              Se vazio, a campanha abrangerá todos os bairros.
            </p>
          </div>

          {status !== 'fechada' && (
            <div className="flex items-center justify-between rounded-lg border border-[#E0E0E0] bg-[#F5F5F5] p-3">
              <div>
                <Label className="text-[14px] font-bold text-[#1A3A52]">Campanha ativa</Label>
                <p className="text-[12px] text-[#666666]">
                  Quando ativada, a campanha continuará captando imóveis
                </p>
              </div>
              <Switch checked={activateNow} onCheckedChange={setActivateNow} />
            </div>
          )}
        </div>

        <div className="p-6 pt-0 flex justify-end gap-3 border-t border-[#E5E5E5] bg-[#F8FAFC]">
          <Button
            variant="outline"
            onClick={() => {
              if (!isSubmitting) onClose()
            }}
            disabled={isSubmitting}
            className="h-12"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-12 bg-[#2E5F8A] hover:bg-[#1A3A52] text-white font-bold px-6"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
