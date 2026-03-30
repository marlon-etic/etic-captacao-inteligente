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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import { X, CheckCircle2, Link as LinkIcon, Unlink } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DemandSelector } from './DemandSelector'
import { cn } from '@/lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddPropertyModal({ isOpen, onClose, onSuccess }: Props) {
  const { currentUser } = useAppStore()
  const { toast } = useToast()

  const [step, setStep] = useState<1 | 2>(1)

  // Property Data
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [price, setPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [parking, setParking] = useState('')
  const [notes, setNotes] = useState('')
  const [type, setType] = useState<'Venda' | 'Aluguel'>('Venda')

  // Linking Data
  const [demandId, setDemandId] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setCode(`IMV-${Math.floor(Math.random() * 10000)}`)
      setAddress('')
      setPrice('')
      setBedrooms('')
      setParking('')
      setNotes('')
      setType('Venda')
      setDemandId(null)
      setErrors({})
    }
  }, [isOpen])

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!code) newErrors.code = 'Código é obrigatório'
    if (!address) newErrors.address = 'Localização é obrigatória'
    if (!price || Number(price) <= 0) newErrors.price = 'Preço deve ser maior que zero'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return false
    }
    setErrors({})
    return true
  }

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (skipLink = false) => {
    if (!skipLink && !demandId) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma demanda para vincular ou escolha "Salvar sem vincular".',
        variant: 'destructive',
      })
      return
    }

    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const extraInfo = `Dorms: ${bedrooms || 'Indif'}, Vagas: ${parking || 'Indif'}. Obs: ${notes || '-'}`

      const payload = {
        codigo_imovel: code.toUpperCase(),
        endereco: address,
        preco: Number(price),
        status_captacao: 'pendente',
        user_captador_id: currentUser?.id,
        captador_id: currentUser?.id,
        demanda_locacao_id: type === 'Aluguel' ? demandId : null,
        demanda_venda_id: type === 'Venda' ? demandId : null,
        localizacao_texto: extraInfo,
      }

      const { error } = await supabase.from('imoveis_captados').insert(payload)

      if (error) {
        if (error.code === '23505') {
          setErrors({ code: 'Este código já está em uso.' })
          setStep(1)
          throw new Error('Código do imóvel já cadastrado.')
        }
        throw error
      }

      toast({
        title: '✅ Imóvel Cadastrado!',
        description: demandId
          ? `Vinculado à demanda com sucesso.`
          : `Salvo no banco de imóveis geral.`,
        className: 'bg-[#10B981] text-white border-none',
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const propertyDataForSelector = {
    neighborhood: address,
    price: Number(price) || undefined,
    bedrooms: Number(bedrooms) || undefined,
    parking: Number(parking) || undefined,
    type,
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className={cn(
          'w-full p-0 flex flex-col rounded-[16px] bg-[#FFFFFF] border-0 shadow-2xl overflow-hidden transition-all duration-300 z-[1050] pointer-events-auto',
          step === 1 ? 'max-w-xl' : 'max-w-5xl',
        )}
      >
        <DialogHeader className="p-4 md:p-6 border-b border-[#E5E5E5] shrink-0 bg-[#1A3A52] text-white relative">
          <DialogTitle className="text-xl font-black flex items-center gap-2 pr-8">
            {step === 1 ? 'Cadastrar Novo Imóvel' : 'Vincular a uma Demanda (Opcional)'}
          </DialogTitle>
          <DialogClose asChild>
            <button className="absolute right-4 top-[50%] -translate-y-[50%] h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
              <X className="w-5 h-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        {step === 1 ? (
          <>
            <ScrollArea className="flex-1 p-4 md:p-6 bg-white max-h-[70vh]">
              <div className="space-y-4">
                {' '}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="font-bold text-[#333333] mb-1.5 block">Finalidade</Label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                      <SelectTrigger className="min-h-[48px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Venda">Venda</SelectItem>
                        <SelectItem value="Aluguel">Aluguel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="font-bold text-[#333333] mb-1.5 block">
                      Código do Imóvel <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase())
                        setErrors((prev) => ({ ...prev, code: '' }))
                      }}
                      placeholder="Ex: AP1234"
                      className={errors.code ? 'border-red-500 ring-red-500' : ''}
                    />
                    {errors.code && (
                      <p className="text-red-500 text-xs mt-1 font-medium">{errors.code}</p>
                    )}
                  </div>

                  <div>
                    <Label className="font-bold text-[#333333] mb-1.5 block">
                      Preço (R$) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value)
                        setErrors((prev) => ({ ...prev, price: '' }))
                      }}
                      placeholder="Ex: 500000"
                      className={errors.price ? 'border-red-500 ring-red-500' : ''}
                    />
                    {errors.price && (
                      <p className="text-red-500 text-xs mt-1 font-medium">{errors.price}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label className="font-bold text-[#333333] mb-1.5 block">
                      Bairro / Endereço <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value)
                        setErrors((prev) => ({ ...prev, address: '' }))
                      }}
                      placeholder="Ex: Jardins"
                      className={errors.address ? 'border-red-500 ring-red-500' : ''}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1 font-medium">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <Label className="font-bold text-[#333333] mb-1.5 block">Dormitórios</Label>
                    <Input
                      type="number"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>

                  <div>
                    <Label className="font-bold text-[#333333] mb-1.5 block">Vagas</Label>
                    <Input
                      type="number"
                      value={parking}
                      onChange={(e) => setParking(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="font-bold text-[#333333] mb-1.5 block">
                      Observações do Imóvel
                    </Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Detalhes adicionais..."
                      className="resize-none min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="p-4 md:p-6 border-t border-[#E5E5E5] bg-[#F8FAFC] shrink-0 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="min-h-[48px] font-bold pointer-events-auto"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                className="min-h-[48px] bg-[#1A3A52] text-white font-black px-6 pointer-events-auto"
              >
                Próximo: Vincular Demanda <LinkIcon className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 p-4 md:p-6 bg-white overflow-hidden flex flex-col">
              <DemandSelector
                propertyData={propertyDataForSelector}
                onSelectDemand={(id) => setDemandId(id)}
              />
              {demandId && (
                <div className="mt-4 p-3 bg-[#E8F5E9] border border-[#A7F3D0] rounded-[8px] text-[#065F46] font-bold flex items-center justify-between animate-fade-in">
                  <span>✅ Demanda selecionada pronta para vinculação.</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDemandId(null)}
                    className="h-8 hover:bg-[#A7F3D0]/50 text-[#065F46]"
                  >
                    Desfazer
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 border-t border-[#E5E5E5] bg-[#F8FAFC] shrink-0 flex flex-col sm:flex-row justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="min-h-[48px] font-bold order-2 sm:order-1 pointer-events-auto"
              >
                Voltar
              </Button>
              <div className="flex gap-2 order-1 sm:order-2 flex-col sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting || demandId !== null}
                  className="min-h-[48px] font-bold text-[#666666] hover:bg-[#F5F5F5] pointer-events-auto"
                >
                  <Unlink className="w-4 h-4 mr-2" /> Salvar Sem Vincular
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting || demandId === null}
                  className="min-h-[48px] bg-[#10B981] hover:bg-[#059669] text-white font-black px-6 shadow-[0_4px_12px_rgba(16,185,129,0.3)] pointer-events-auto"
                >
                  {isSubmitting ? (
                    'Salvando...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" /> Confirmar e Vincular
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
