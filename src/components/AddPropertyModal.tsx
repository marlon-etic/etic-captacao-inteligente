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
import { Link2, Search, Unlock, ArrowLeft } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { BAIRROS_ETIC } from '@/lib/bairros'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function AddPropertyModal({ isOpen, onClose }: Props) {
  const { demands, submitIndependentCapture, submitDemandResponse } = useAppStore()
  const { toast } = useToast()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [option, setOption] = useState<'A' | 'B' | 'C' | null>(null)
  const [selectedDemandId, setSelectedDemandId] = useState<string>('')

  const [code, setCode] = useState('')
  const [type, setType] = useState('Venda')
  const [neighborhood, setNeighborhood] = useState('')
  const [value, setValue] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [parkingSpots, setParkingSpots] = useState('')
  const [obs, setObs] = useState('')

  const [errors, setErrors] = useState<{ code?: string; value?: string }>({})

  const pendingDemands = demands.filter((d) => d.status === 'Pendente')

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
    setNeighborhood('')
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
      propertyType: type,
      neighborhood,
      value: Number(value),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      parkingSpots: Number(parkingSpots),
      obs,
      docCompleta: true,
      bairro_tipo: 'listado',
    }

    let res
    if (option === 'C') {
      res = submitIndependentCapture(payload)
    } else {
      res = submitDemandResponse(selectedDemandId, 'encontrei', payload)
    }

    if (res?.success) {
      toast({
        title: `✅ Imóvel ${code} cadastrado com sucesso!`,
        description: 'O imóvel já está disponível no sistema.',
        className: 'bg-[#4CAF50] text-white border-none',
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
      toast({
        title: 'Erro',
        description: res?.message || 'Falha ao cadastrar imóvel',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="flex flex-row items-center gap-3">
          {step > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -ml-2 shrink-0"
              onClick={() => (step === 3 && option !== 'C' ? setStep(2) : setStep(1))}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="flex flex-col gap-1 text-left">
            <DialogTitle className="text-xl">Adicionar Novo Imóvel</DialogTitle>
            <DialogDescription>
              {step === 1
                ? 'Selecione a forma de vinculação do imóvel'
                : step === 2
                  ? 'Identifique a demanda'
                  : 'Preencha os dados do imóvel'}
            </DialogDescription>
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
            <button
              onClick={() => {
                setOption('A')
                setStep(2)
              }}
              className="flex flex-col items-center justify-center p-6 border-2 border-[#1A3A52]/20 rounded-xl hover:border-[#1A3A52] hover:bg-[#1A3A52]/5 transition-all text-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-full bg-[#1A3A52]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Link2 className="w-7 h-7 text-[#1A3A52]" />
              </div>
              <span className="font-bold text-[14px] text-[#1A3A52]">
                PARA UMA DEMANDA ESPECÍFICA
              </span>
            </button>

            <button
              onClick={() => {
                setOption('B')
                setStep(2)
              }}
              className="flex flex-col items-center justify-center p-6 border-2 border-[#FF9800]/20 rounded-xl hover:border-[#FF9800] hover:bg-[#FF9800]/5 transition-all text-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-full bg-[#FF9800]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search className="w-7 h-7 text-[#FF9800]" />
              </div>
              <span className="font-bold text-[14px] text-[#FF9800]">
                SELECIONAR DEMANDA DA LISTA
              </span>
            </button>

            <button
              onClick={() => {
                setOption('C')
                setStep(3)
              }}
              className="flex flex-col items-center justify-center p-6 border-2 border-[#4CAF50]/20 rounded-xl hover:border-[#4CAF50] hover:bg-[#4CAF50]/5 transition-all text-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-full bg-[#4CAF50]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Unlock className="w-7 h-7 text-[#4CAF50]" />
              </div>
              <span className="font-bold text-[14px] text-[#4CAF50]">SEM DEMANDA ESPECÍFICA</span>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-4 max-w-md mx-auto w-full">
            {option === 'A' && (
              <div className="space-y-4">
                <Label>ID da Demanda</Label>
                <Input
                  value={selectedDemandId}
                  onChange={(e) => setSelectedDemandId(e.target.value)}
                  placeholder="Digite o código da demanda"
                />
              </div>
            )}
            {option === 'B' && (
              <div className="space-y-4">
                <Label>Selecione a Demanda</Label>
                <Select value={selectedDemandId} onValueChange={setSelectedDemandId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma demanda pendente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingDemands.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.clientName} - {d.location} ({d.type})
                      </SelectItem>
                    ))}
                    {pendingDemands.length === 0 && (
                      <SelectItem value="none" disabled>
                        Nenhuma demanda pendente
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              className="w-full h-[48px]"
              disabled={!selectedDemandId}
              onClick={() => setStep(3)}
            >
              Avançar para Detalhes
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>
                  Código do Imóvel <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="Ex: AP123"
                />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                <p className="text-[11px] text-muted-foreground mt-1 font-mono bg-muted/50 p-1.5 rounded truncate">
                  https://www.eticimoveis.com.br/imovel/{code || '{codigo}'}
                </p>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Venda">Venda</SelectItem>
                    <SelectItem value="Aluguel">Aluguel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bairro</Label>
                <Select value={neighborhood} onValueChange={setNeighborhood}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o bairro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BAIRROS_ETIC.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                    <SelectItem value="OUTROS">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  Valor (R$) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleValueChange(e.target.value)}
                  placeholder="Ex: 500000"
                />
                {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Dormitórios</Label>
                <Input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                />
              </div>
              <div>
                <Label>Banheiros</Label>
                <Input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                />
              </div>
              <div>
                <Label>Vagas</Label>
                <Input
                  type="number"
                  value={parkingSpots}
                  onChange={(e) => setParkingSpots(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Detalhes adicionais do imóvel..."
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                className="w-full md:w-auto h-[48px] px-8 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold transition-colors"
                onClick={handleSubmit}
              >
                SALVAR IMÓVEL
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
