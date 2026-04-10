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
import { BairroCombobox } from './BairroCombobox'

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
  const [tipo, setTipo] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && demand) {
      setCode(`IMV-${Math.floor(Math.random() * 10000)}`)
      const isLocacao =
        'sdr_id' in demand ||
        'renda_mensal_estimada' in demand ||
        demand.tipo_demanda === 'Aluguel' ||
        demand.tipo_demanda === 'Locação' ||
        (demand as any).tipo === 'Locação'
      setTipo(isLocacao ? 'Locação' : 'Venda')
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
    if (!tipo) {
      toast({
        title: '❌ Tipo de imóvel é obrigatório',
        description: 'Selecione se o imóvel é para Venda, Locação ou Ambos',
        variant: 'destructive',
      })
      setErrors((prev) => ({ ...prev, tipo: 'Tipo de imóvel é obrigatório' }))
      return
    }

    const newErrors: Record<string, string> = {}
    if (!code) newErrors.code = 'Código é obrigatório'

    const bairrosArray: string[] = address
      ? address
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    if (!address || !Array.isArray(bairrosArray) || bairrosArray.length === 0) {
      newErrors.address = 'Bairro é obrigatório (deve ser um array de strings)'
    }

    const parsedPrice = parseFloat(price)
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      newErrors.price = 'Preço deve ser maior que zero'
    }

    let parsedBedrooms = 0
    if (bedrooms.trim() !== '') {
      if (!/^\d+$/.test(bedrooms.trim())) {
        newErrors.bedrooms = 'Apenas números permitidos'
      } else {
        parsedBedrooms = parseInt(bedrooms, 10)
        if (isNaN(parsedBedrooms) || parsedBedrooms < 0) {
          newErrors.bedrooms = 'Valor inválido'
        }
      }
    }

    let parsedParking = 0
    if (parking.trim() !== '') {
      if (!/^\d+$/.test(parking.trim())) {
        newErrors.parking = 'Apenas números permitidos'
      } else {
        parsedParking = parseInt(parking, 10)
        if (isNaN(parsedParking) || parsedParking < 0) {
          newErrors.parking = 'Valor inválido'
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({
        title: '❌ Erro de validação',
        description: 'Verifique os campos destacados antes de salvar.',
        variant: 'destructive',
      })
      return
    }

    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const extraInfo = `Dorms: ${parsedBedrooms}, Vagas: ${parsedParking}. Obs: ${notes || '-'}`
      const enderecoValue = bairrosArray.length > 0 ? bairrosArray.join(', ') : address

      const isLocacao = 'sdr_id' in demand || 'renda_mensal_estimada' in demand

      const payload = {
        codigo_imovel: code.toUpperCase(),
        endereco: enderecoValue,
        preco: parsedPrice,
        status_captacao: 'pendente',
        user_captador_id: currentUser?.id,
        captador_id: currentUser?.id,
        demanda_locacao_id: isLocacao ? demand.id : null,
        demanda_venda_id: !isLocacao ? demand.id : null,
        localizacao_texto: extraInfo,
        dormitorios: parsedBedrooms,
        vagas: parsedParking,
        tipo: tipo,
        observacoes: notes,
        etapa_funil: 'capturado',
      }

      console.log('[CapturaImovel] Tipos de dados processados:', {
        dormitorios: { value: payload.dormitorios, type: typeof payload.dormitorios },
        vagas: { value: payload.vagas, type: typeof payload.vagas },
        endereco: { value: bairrosArray, type: 'Array<string>' },
      })

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
        className="w-full max-w-[calc(100%-32px)] md:max-w-xl p-0 flex flex-col rounded-[16px] bg-[#FFFFFF] border-0 shadow-2xl overflow-hidden z-[1050] pointer-events-auto"
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

        <ScrollArea className="flex-1 p-4 md:p-6 bg-white">
          <div className="space-y-4">
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
                  Bairro <span className="text-red-500">*</span>
                </Label>
                <BairroCombobox
                  value={address}
                  onChange={(val) => {
                    setAddress(val)
                    setErrors((prev) => ({ ...prev, address: '' }))
                  }}
                  error={!!errors.address}
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.address}</p>
                )}
              </div>

              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Tipo de Imóvel *
                </label>
                <select
                  value={tipo}
                  onChange={(e) => {
                    setTipo(e.target.value)
                    setErrors((prev) => ({ ...prev, tipo: '' }))
                  }}
                  className={`w-full h-10 px-3 rounded-lg border bg-white text-[14px] outline-none transition-colors ${
                    errors.tipo
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                  }`}
                  required
                >
                  <option value="">Selecione o tipo</option>
                  <option value="Venda">Venda</option>
                  <option value="Locação">Locação</option>
                  <option value="Ambos">Venda e Locação</option>
                </select>
                {errors.tipo && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.tipo}</p>
                )}
              </div>

              <div>
                <Label className="font-bold text-[#333333] mb-1.5 block">Dormitórios</Label>
                <Input
                  type="text"
                  value={bedrooms}
                  onChange={(e) => {
                    setBedrooms(e.target.value)
                    setErrors((prev) => ({ ...prev, bedrooms: '' }))
                  }}
                  placeholder="Ex: 2"
                  className={errors.bedrooms ? 'border-red-500 ring-red-500' : ''}
                />
                {errors.bedrooms && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.bedrooms}</p>
                )}
              </div>

              <div>
                <Label className="font-bold text-[#333333] mb-1.5 block">Vagas</Label>
                <Input
                  type="text"
                  value={parking}
                  onChange={(e) => {
                    setParking(e.target.value)
                    setErrors((prev) => ({ ...prev, parking: '' }))
                  }}
                  placeholder="Ex: 1"
                  className={errors.parking ? 'border-red-500 ring-red-500' : ''}
                />
                {errors.parking && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.parking}</p>
                )}
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
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[48px] font-bold pointer-events-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-h-[48px] bg-[#10B981] hover:bg-[#059669] text-white font-black px-6 pointer-events-auto"
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
