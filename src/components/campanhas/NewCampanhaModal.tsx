import { useState } from 'react'
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
import { createCampanha, checkDuplicateCampanha } from '@/services/campanhaService'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { BairroSelector } from '@/components/BairroSelector'
import { REGIONS_DATA } from '@/lib/regions'

interface NewCampanhaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function NewCampanhaModal({ isOpen, onClose, onSuccess }: NewCampanhaModalProps) {
  const { toast } = useToast()
  const [tipoImovel, setTipoImovel] = useState('')
  const [valorMin, setValorMin] = useState('')
  const [valorMax, setValorMax] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [activateNow, setActivateNow] = useState(true)
  const [bairros, setBairros] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const reset = () => {
    setTipoImovel('')
    setValorMin('')
    setValorMax('')
    setDataFim('')
    setActivateNow(true)
    setBairros([])
    setErrors({})
  }

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
    if (!dataFim) {
      e.dataFim = 'Data de fim é obrigatória'
    } else {
      const fim = new Date(dataFim)
      if (fim <= new Date()) e.dataFim = 'Data não pode ser no passado'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const min = parseFloat(valorMin)
      const max = parseFloat(valorMax)

      const isDup = await checkDuplicateCampanha(tipoImovel, min, max)
      if (isDup) {
        setErrors({ valorMax: 'Já existe uma campanha ativa com este tipo e faixa de valor' })
        toast({
          title: 'Campanha duplicada',
          description: 'Já existe uma campanha ativa idêntica.',
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      await createCampanha({
        tipo_imovel: tipoImovel,
        faixa_valor_min: min,
        faixa_valor_max: max,
        data_fim: new Date(dataFim).toISOString(),
        activate_now: activateNow,
        bairros_alvo: bairros.length > 0 ? bairros : null,
      })

      toast({ title: '✅ Campanha criada com sucesso!', className: 'bg-emerald-600 text-white' })
      reset()
      onSuccess()
      onClose()
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Falha ao criar campanha',
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
        if (!v && !isSubmitting) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 bg-[#1A3A52] text-white relative">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Nova Campanha de Captação
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

          <div>
            <Label className="font-bold text-[#333333] mb-1.5 block">Data de Encerramento *</Label>
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

          <div className="flex items-center justify-between rounded-lg border border-[#E0E0E0] bg-[#F5F5F5] p-3">
            <div>
              <Label className="text-[14px] font-bold text-[#1A3A52]">Ativar imediatamente</Label>
              <p className="text-[12px] text-[#666666]">
                A campanha começará a captar imóveis agora
              </p>
            </div>
            <Switch checked={activateNow} onCheckedChange={setActivateNow} />
          </div>
        </div>

        <div className="p-6 pt-0 flex justify-end gap-3 border-t border-[#E5E5E5] bg-[#F8FAFC]">
          <Button
            variant="outline"
            onClick={() => {
              reset()
              onClose()
            }}
            disabled={isSubmitting}
            className="h-12"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-12 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold px-6"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Criar Campanha
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
