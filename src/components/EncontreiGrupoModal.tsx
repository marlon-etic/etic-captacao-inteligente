import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import useAppStore from '@/stores/useAppStore'
import { BAIRROS_ETIC } from '@/lib/bairros'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  isOpen: boolean
  onClose: () => void
  demandIds: string[]
}

export function EncontreiGrupoModal({ isOpen, onClose, demandIds }: Props) {
  const { submitGroupCapture } = useAppStore()
  const { toast } = useToast()

  const [code, setCode] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [value, setValue] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [parkingSpots, setParkingSpots] = useState('')
  const [obs, setObs] = useState('')

  const [errors, setErrors] = useState<{ code?: string; value?: string }>({})

  const handleCodeChange = (val: string) => {
    const sanitized = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    setCode(sanitized)
    if (sanitized) setErrors((prev) => ({ ...prev, code: undefined }))
  }

  const handleValueChange = (val: string) => {
    setValue(val)
    if (Number(val) > 0) setErrors((prev) => ({ ...prev, value: undefined }))
  }

  const handleSubmit = () => {
    const newErrors: any = {}
    if (!code) newErrors.code = 'Código é obrigatório'
    if (!value || Number(value) <= 0) newErrors.value = 'Valor deve ser maior que zero'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const payload = {
      code,
      neighborhood,
      value: Number(value),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      parkingSpots: Number(parkingSpots),
      obs,
    }

    const res = submitGroupCapture(demandIds, payload)
    if (res.success) {
      onClose()
      setCode('')
      setNeighborhood('')
      setValue('')
      setBedrooms('')
      setBathrooms('')
      setParkingSpots('')
      setObs('')
    } else {
      if (res.message === 'Código já cadastrado') {
        setErrors({ code: 'Código já cadastrado' })
      }
      toast({ title: 'Erro', description: res.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white border-[2px] border-[#1A3A52] rounded-[12px] h-[85vh] sm:h-auto max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 md:p-6 border-b border-[#E5E5E5] bg-[#F5F5F5] shrink-0">
          <DialogTitle className="text-xl font-bold text-[#1A3A52]">
            Captar Imóvel para o Grupo
          </DialogTitle>
          <DialogDescription className="text-[#333333] font-medium">
            Preencha os dados do imóvel que atende a este grupo de clientes.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="font-bold text-[#333333]">
                  Código do Imóvel <span className="text-[#F44336]">*</span>
                </Label>
                <Input
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="Ex: AP123"
                  className="min-h-[48px]"
                />
                {errors.code && (
                  <p className="text-[#F44336] text-xs mt-1 font-bold">{errors.code}</p>
                )}
              </div>
              <div>
                <Label className="font-bold text-[#333333]">Bairro</Label>
                <Select value={neighborhood} onValueChange={setNeighborhood}>
                  <SelectTrigger className="min-h-[48px]">
                    <SelectValue placeholder="Selecione o bairro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BAIRROS_ETIC.map((b) => (
                      <SelectItem key={b} value={b} className="min-h-[48px]">
                        {b}
                      </SelectItem>
                    ))}
                    <SelectItem value="OUTROS" className="min-h-[48px]">
                      Outros
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="font-bold text-[#333333]">
                Valor (R$) <span className="text-[#F44336]">*</span>
              </Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="Ex: 500000"
                className="min-h-[48px]"
              />
              {errors.value && (
                <p className="text-[#F44336] text-xs mt-1 font-bold">{errors.value}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="font-bold text-[#333333]">Dormitórios</Label>
                <Input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="min-h-[48px]"
                />
              </div>
              <div>
                <Label className="font-bold text-[#333333]">Banheiros</Label>
                <Input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="min-h-[48px]"
                />
              </div>
              <div>
                <Label className="font-bold text-[#333333]">Vagas</Label>
                <Input
                  type="number"
                  value={parkingSpots}
                  onChange={(e) => setParkingSpots(e.target.value)}
                  className="min-h-[48px]"
                />
              </div>
            </div>

            <div>
              <Label className="font-bold text-[#333333]">Observações</Label>
              <Textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Detalhes adicionais do imóvel..."
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 md:p-6 border-t border-[#E5E5E5] shrink-0 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[48px] font-bold text-[14px]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="w-full sm:w-auto min-h-[48px] font-bold text-[14px] bg-[#4CAF50] hover:bg-[#388E3C] text-white"
          >
            ✅ CONFIRMAR CAPTAÇÃO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
