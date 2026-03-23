import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Link2, Search, Unlock, ArrowLeft, Building2 } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { LocationSelector } from '@/components/LocationSelector'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DemandSelector } from '@/components/DemandSelector'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function AddPropertyModal({ isOpen, onClose }: Props) {
  const { submitIndependentCapture, submitDemandResponse } = useAppStore()
  const { toast } = useToast()

  // New Flow: 1 (Form) -> 2 (Options) -> 3 (Selector or ID)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [option, setOption] = useState<'A' | 'B' | 'C' | null>(null)

  // Data State
  const [code, setCode] = useState('')
  const [type, setType] = useState('Venda')
  const [neighborhoods, setNeighborhoods] = useState<string[]>([])
  const [value, setValue] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [parkingSpots, setParkingSpots] = useState('')
  const [obs, setObs] = useState('')
  const [selectedDemandId, setSelectedDemandId] = useState<string>('')

  const [errors, setErrors] = useState<{ code?: string; value?: string; neighborhoods?: string }>(
    {},
  )

  useEffect(() => {
    if (!isOpen) {
      setTimeout(resetForm, 300)
    }
  }, [isOpen])

  const resetForm = () => {
    setStep(1)
    setOption(null)
    setSelectedDemandId('')
    setCode('')
    setType('Venda')
    setNeighborhoods([])
    setValue('')
    setBedrooms('')
    setBathrooms('')
    setParkingSpots('')
    setObs('')
    setErrors({})
  }

  const handleCodeChange = (val: string) => {
    const sanitized = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    setCode(sanitized)
    if (sanitized) setErrors((prev) => ({ ...prev, code: undefined }))
  }

  const handleValueChange = (val: string) => {
    setValue(val)
    if (Number(val) > 0) setErrors((prev) => ({ ...prev, value: undefined }))
  }

  // Validate form before moving to Step 2
  const handleNextToStep2 = () => {
    const newErrors: any = {}
    if (!code) newErrors.code = 'Código é obrigatório'
    if (!value || Number(value) <= 0) newErrors.value = 'Valor deve ser maior que zero'
    if (neighborhoods.length === 0) newErrors.neighborhoods = 'Selecione pelo menos um bairro'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setStep(2)
  }

  const handleFinalSubmit = (submitOption: 'A' | 'B' | 'C', demandId?: string) => {
    const payload = {
      code,
      propertyType: type,
      neighborhood: neighborhoods,
      value: Number(value),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      parkingSpots: Number(parkingSpots),
      obs,
      docCompleta: true,
      bairro_tipo: 'listado',
    }

    let res
    if (submitOption === 'C') {
      res = submitIndependentCapture(payload)
    } else {
      if (!demandId) {
        toast({
          title: 'Erro',
          description: 'ID da demanda não informado.',
          variant: 'destructive',
        })
        return
      }
      res = submitDemandResponse(demandId, 'encontrei', payload)
    }

    if (res?.success) {
      toast({
        title: `✅ Imóvel ${code} cadastrado com sucesso!`,
        description:
          submitOption === 'C'
            ? 'Salvo no banco de dados geral.'
            : 'Vinculado com sucesso à demanda.',
        className: 'bg-[#10B981] text-white border-none',
        action: (
          <ToastAction
            altText="Adicionar outro imóvel"
            onClick={(e) => {
              e.preventDefault()
              setTimeout(() => {
                document.getElementById('btn-add-property-trigger')?.click()
              }, 100)
            }}
          >
            Adicionar outro
          </ToastAction>
        ),
      })
      onClose()
    } else {
      if (res?.message === 'Código já cadastrado') {
        setErrors({ code: 'Código já cadastrado' })
        setStep(1) // Return to form to fix code
      }
      toast({
        title: 'Erro',
        description: res?.message || 'Falha ao cadastrar imóvel',
        variant: 'destructive',
      })
    }
  }

  const goBack = () => {
    if (step === 3) setStep(2)
    if (step === 2) setStep(1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="w-full max-w-[calc(100%-32px)] sm:max-w-3xl h-[90vh] sm:h-auto max-h-[90vh] p-0 flex flex-col rounded-[16px] bg-white border-0 shadow-2xl overflow-hidden z-[9999]">
        <DialogHeader className="p-4 md:p-6 border-b border-[#E5E5E5] shrink-0 bg-[#F8FAFC] flex flex-row items-center gap-3">
          {step > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 min-w-10 min-h-10 -ml-2 shrink-0 bg-white hover:bg-[#E2E8F0] text-[#1A3A52] border border-[#CBD5E1]"
              onClick={goBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex flex-col gap-1 text-left">
            <DialogTitle className="text-xl text-[#1A3A52] font-black flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#10B981]" />
              Novo Imóvel Captado
            </DialogTitle>
            <DialogDescription className="text-[#64748B] font-medium">
              {step === 1
                ? 'Passo 1 de 2: Preencha as informações do imóvel encontrado.'
                : step === 2
                  ? 'Passo 2 de 2: Como deseja vincular este imóvel?'
                  : 'Selecione a demanda ideal para este imóvel.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 md:p-6 bg-white">
          {step === 1 && (
            <div className="space-y-5 pb-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label className="font-bold text-[#333333] mb-1.5 block">
                    Código do Imóvel <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="Ex: AP123"
                    className={cn('min-h-[48px]', errors.code && 'border-red-500 ring-red-500')}
                  />
                  {errors.code && (
                    <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.code}</p>
                  )}
                </div>

                <div>
                  <Label className="font-bold text-[#333333] mb-1.5 block">Tipo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="min-h-[48px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Venda" className="min-h-[48px]">
                        Venda
                      </SelectItem>
                      <SelectItem value="Aluguel" className="min-h-[48px]">
                        Aluguel
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label className="font-bold text-[#333333] mb-1.5 block">
                    Bairros de Localização <span className="text-red-500">*</span>
                  </Label>
                  <LocationSelector
                    value={neighborhoods}
                    onChange={(val) => {
                      setNeighborhoods(val)
                      if (val.length > 0)
                        setErrors((prev) => ({ ...prev, neighborhoods: undefined }))
                    }}
                    error={!!errors.neighborhoods}
                  />
                  {errors.neighborhoods && (
                    <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.neighborhoods}</p>
                  )}
                </div>

                <div>
                  <Label className="font-bold text-[#333333] mb-1.5 block">
                    Valor (R$) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleValueChange(e.target.value)}
                    placeholder="Ex: 500000"
                    className={cn('min-h-[48px]', errors.value && 'border-red-500 ring-red-500')}
                  />
                  {errors.value && (
                    <p className="text-red-500 text-xs mt-1.5 font-bold">{errors.value}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="font-bold text-[#333333] mb-1.5 block">Dormitórios</Label>
                  <Input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="min-h-[48px]"
                  />
                </div>
                <div>
                  <Label className="font-bold text-[#333333] mb-1.5 block">Banheiros</Label>
                  <Input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="min-h-[48px]"
                  />
                </div>
                <div>
                  <Label className="font-bold text-[#333333] mb-1.5 block">Vagas</Label>
                  <Input
                    type="number"
                    value={parkingSpots}
                    onChange={(e) => setParkingSpots(e.target.value)}
                    className="min-h-[48px]"
                  />
                </div>
              </div>

              <div>
                <Label className="font-bold text-[#333333] mb-1.5 block">
                  Observações (Opcional)
                </Label>
                <Textarea
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Detalhes adicionais do imóvel, estado de conservação, etc..."
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => {
                  setOption('A')
                  setStep(3)
                }}
                className="flex flex-col items-center justify-center p-6 border-[2px] border-[#10B981]/30 rounded-xl hover:border-[#10B981] hover:bg-[#10B981]/5 transition-all text-center gap-3 group min-h-[180px] bg-white shadow-sm"
              >
                <div className="w-14 h-14 rounded-full bg-[#10B981]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Search className="w-7 h-7 text-[#10B981]" />
                </div>
                <span className="font-black text-[15px] text-[#1A3A52]">
                  BUSCAR DEMANDA COMPATÍVEL
                </span>
                <p className="text-[12px] text-[#64748B] font-medium leading-relaxed">
                  Sistema inteligente sugerirá demandas ideais baseadas nos dados preenchidos.
                </p>
              </button>

              <button
                onClick={() => {
                  setOption('B')
                  setStep(3)
                }}
                className="flex flex-col items-center justify-center p-6 border-[2px] border-[#3B82F6]/30 rounded-xl hover:border-[#3B82F6] hover:bg-[#3B82F6]/5 transition-all text-center gap-3 group min-h-[180px] bg-white shadow-sm"
              >
                <div className="w-14 h-14 rounded-full bg-[#3B82F6]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Link2 className="w-7 h-7 text-[#3B82F6]" />
                </div>
                <span className="font-black text-[15px] text-[#1A3A52]">
                  VINCULAR POR ID MANUAL
                </span>
                <p className="text-[12px] text-[#64748B] font-medium leading-relaxed">
                  Se você já sabe o ID exato da demanda para a qual buscou o imóvel.
                </p>
              </button>

              <button
                onClick={() => handleFinalSubmit('C')}
                className="flex flex-col items-center justify-center p-6 border-[2px] border-[#64748B]/30 rounded-xl hover:border-[#64748B] hover:bg-[#F8FAFC] transition-all text-center gap-3 group min-h-[180px] bg-white shadow-sm"
              >
                <div className="w-14 h-14 rounded-full bg-[#F1F5F9] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Unlock className="w-7 h-7 text-[#64748B]" />
                </div>
                <span className="font-black text-[15px] text-[#1A3A52]">SALVAR SEM DEMANDA</span>
                <p className="text-[12px] text-[#64748B] font-medium leading-relaxed">
                  Apenas salvar no banco geral de imóveis disponíveis (soltos).
                </p>
              </button>
            </div>
          )}

          {step === 3 && option === 'A' && (
            <DemandSelector
              propertyData={{
                type,
                neighborhoods,
                value: Number(value),
                bedrooms: Number(bedrooms),
                parkingSpots: Number(parkingSpots),
              }}
              onSelect={(id) => handleFinalSubmit('A', id)}
            />
          )}

          {step === 3 && option === 'B' && (
            <div className="space-y-6 max-w-md mx-auto w-full py-8 animate-in slide-in-from-right-4">
              <div className="space-y-3">
                <Label className="font-bold text-[#333333] text-[16px]">ID da Demanda</Label>
                <Input
                  value={selectedDemandId}
                  onChange={(e) => setSelectedDemandId(e.target.value)}
                  placeholder="Ex: DEM-12345"
                  className="min-h-[56px] text-lg text-center tracking-widest font-mono uppercase"
                />
              </div>
              <Button
                className="w-full min-h-[56px] font-black text-[16px] bg-[#1A3A52] hover:bg-[#2E5F8A] text-white transition-all shadow-[0_4px_12px_rgba(26,58,82,0.2)]"
                disabled={!selectedDemandId}
                onClick={() => handleFinalSubmit('B', selectedDemandId)}
              >
                CONFIRMAR VINCULAÇÃO
              </Button>
            </div>
          )}
        </ScrollArea>

        {step === 1 && (
          <div className="p-4 md:p-6 border-t border-[#E5E5E5] bg-[#F8FAFC] shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
            <Button
              className="w-full min-h-[56px] bg-[#1A3A52] hover:bg-[#0F2333] text-white font-black text-[16px] tracking-wide transition-all shadow-[0_4px_12px_rgba(26,58,82,0.2)]"
              onClick={handleNextToStep2}
            >
              AVANÇAR PARA VINCULAÇÃO
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
