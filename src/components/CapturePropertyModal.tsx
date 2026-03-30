import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import { X, CheckCircle2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  demand: SupabaseDemand | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CapturePropertyModal({ demand, isOpen, onClose, onSuccess }: Props) {
  const { currentUser } = useAppStore()
  const { toast } = useToast()

  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [price, setPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [parking, setParking] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && demand) {
      setCode(`IMV-${Math.floor(Math.random() * 10000)}`)
      setAddress(demand.bairros?.[0] || '')
      setPrice(demand.valor_maximo?.toString() || '')
      setBedrooms(demand.dormitorios?.toString() || '')
      setParking(demand.vagas_estacionamento?.toString() || '')
      setNotes('')
      setErrors({})
    }
  }, [isOpen, demand])

  if (!demand) return null

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {}
    if (!code) newErrors.code = 'Código é obrigatório'
    if (!address) newErrors.address = 'Localização é obrigatória'
    if (!price || Number(price) <= 0) newErrors.price = 'Preço deve ser maior que zero'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
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
        demanda_locacao_id: demand.tipo === 'Aluguel' ? demand.id : null,
        demanda_venda_id: demand.tipo === 'Venda' ? demand.id : null,
        localizacao_texto: extraInfo,
        dormitorios: bedrooms ? Number(bedrooms) : null,
        vagas: parking ? Number(parking) : null,
        observacoes: notes,
        etapa_funil: 'capturado',
      }

      const { error } = await supabase.from('imoveis_captados').insert(payload)

      if (error) {
        if (error.code === '23505') {
          setErrors({ code: 'Este código já está em uso.' })
          throw new Error('Código do imóvel já cadastrado.')
        }
        throw error
      }

      toast({
        title: '✅ Imóvel Captado com Sucesso!',
        description: `O imóvel ${code.toUpperCase()} foi vinculado à demanda de ${demand.nome_cliente}.`,
        className: 'bg-[#10B981] text-white border-none',
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      toast({
        title: 'Erro ao captar imóvel',
        description: err.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[calc(100%-32px)] md:max-w-xl p-0 flex flex-col rounded-[16px] bg-[#FFFFFF] border-0 shadow-2xl overflow-hidden"
      >
        <DialogHeader className="p-4 md:p-6 border-b border-[#E5E5E5] shrink-0 bg-[#1A3A52] text-white relative">
          <DialogTitle className="text-xl font-black flex items-center gap-2 pr-8">
            Capturar Imóvel
          </DialogTitle>
          <DialogDescription className="text-white/80 mt-1">
            Preencha os dados do imóvel encontrado para:{' '}
            <strong className="text-white">{demand.nome_cliente}</strong>
          </DialogDescription>
          <DialogClose asChild>
            <button className="absolute right-4 top-[50%] -translate-y-[50%] h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
              <X className="w-5 h-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 md:p-6 bg-white" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Localização / Endereço <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value)
                    setErrors((prev) => ({ ...prev, address: '' }))
                  }}
                  placeholder="Ex: Rua das Flores, 123 - Jardins"
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
                  placeholder="Pré-preenchido"
                />
              </div>

              <div>
                <Label className="font-bold text-[#333333] mb-1.5 block">Vagas</Label>
                <Input
                  type="number"
                  value={parking}
                  onChange={(e) => setParking(e.target.value)}
                  placeholder="Pré-preenchido"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="font-bold text-[#333333] mb-1.5 block">
                  Observações do Imóvel
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalhes adicionais, estado de conservação, etc..."
                  className="resize-none min-h-[80px]"
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 md:p-6 border-t border-[#E5E5E5] bg-[#F8FAFC] shrink-0 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[48px] font-bold"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-h-[48px] bg-[#10B981] hover:bg-[#059669] text-white font-black px-6"
          >
            {isSubmitting ? (
              'Salvando...'
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" /> Confirmar Captura
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
