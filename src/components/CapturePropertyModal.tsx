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
import { X, CheckCircle2, Image as ImageIcon } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BairroCombobox } from './BairroCombobox'
import { useQuickMatchCount } from '@/hooks/use-quick-match'

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
  const [tipo_imovel, setTipoImovel] = useState('Apartamento')
  const [notes, setNotes] = useState('')
  const [fotos, setFotos] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { count: matchCount } = useQuickMatchCount({
    preco: parseFloat(price) || undefined,
    endereco: address,
    tipo,
    tipo_imovel,
    dormitorios: parseInt(bedrooms || '0'),
    vagas: parseInt(parking || '0'),
  })

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
      setTipoImovel('Apartamento')
      setNotes('')
      setFotos([])
      setUploadProgress(0)
      setErrors({})
    }
  }, [isOpen, demand])

  if (!demand) return null

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFotos((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const max_size = 1200
          if (width > height) {
            if (width > max_size) {
              height *= max_size / width
              width = max_size
            }
          } else {
            if (height > max_size) {
              width *= max_size / height
              height = max_size
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Canvas to Blob failed'))
            },
            'image/jpeg',
            0.8,
          )
        }
      }
    })
  }

  const uploadFotos = async (imovelId: string): Promise<string[]> => {
    const urls: string[] = []
    if (fotos.length === 0) return urls

    for (let i = 0; i < fotos.length; i++) {
      const file = fotos[i]
      const fileName = `${imovelId}/${Math.random().toString(36).substring(2)}_${Date.now()}.jpg`

      setUploadProgress(Math.round((i / fotos.length) * 100))

      try {
        const compressedBlob = await compressImage(file)
        const { error, data } = await supabase.storage
          .from('imoveis-captados')
          .upload(fileName, compressedBlob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/jpeg',
          })

        if (!error && data) {
          const {
            data: { publicUrl },
          } = supabase.storage.from('imoveis-captados').getPublicUrl(fileName)
          urls.push(publicUrl)
        }
      } catch (err) {
        console.error('Erro na compressão ou upload', err)
      }
    }
    setUploadProgress(100)
    return urls
  }

  const validateAndNormalizeTipo = (
    preco: number,
    demandaVendaId?: string | null,
    demandaLocacaoId?: string | null,
    tipoAtual?: string,
  ): { isValid: boolean; tipo: 'Venda' | 'Locação' | 'Ambos'; erro?: string } => {
    if (!preco || preco === 0) {
      return { isValid: false, tipo: 'Ambos', erro: '❌ Preencha o valor do imóvel' }
    }
    if (tipoAtual === 'Locação' && preco > 100000) {
      return { isValid: false, tipo: 'Locação', erro: 'Aluguel deve ter valor até R$ 100.000' }
    }
    if (tipoAtual === 'Venda' && preco <= 100000) {
      return { isValid: false, tipo: 'Venda', erro: 'Venda deve ter valor acima de R$ 100.000' }
    }
    if (tipoAtual === 'Ambos' && preco <= 100000) {
      return { isValid: false, tipo: 'Ambos', erro: 'Ambos deve ter valor acima de R$ 100.000' }
    }
    return { isValid: true, tipo: (tipoAtual as any) || 'Ambos' }
  }

  const handleSubmit = async () => {
    if (!tipo) {
      toast({ title: '❌ Transação obrigatória', variant: 'destructive' })
      setErrors((prev) => ({ ...prev, tipo: 'Obrigatório' }))
      return
    }
    if (!tipo_imovel) {
      toast({ title: '❌ Tipo de imóvel obrigatório', variant: 'destructive' })
      setErrors((prev) => ({ ...prev, tipo_imovel: 'Obrigatório' }))
      return
    }

    const newErrors: Record<string, string> = {}
    if (!code) newErrors.code = 'Obrigatório'

    const bairrosArray: string[] = address
      ? address
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    if (!address || bairrosArray.length === 0) {
      newErrors.address = 'Obrigatório'
    }

    const parsedPrice = parseFloat(price)
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) newErrors.price = 'Inválido'

    let parsedBedrooms = parseInt(bedrooms || '0', 10)
    let parsedParking = parseInt(parking || '0', 10)

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({ title: '❌ Verifique os campos destacados.', variant: 'destructive' })
      return
    }

    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const extraInfo = `Dorms: ${parsedBedrooms}, Vagas: ${parsedParking}. Obs: ${notes || '-'}`
      const isLocacao = 'sdr_id' in demand || 'renda_mensal_estimada' in demand

      const payload = {
        codigo_imovel: code.toUpperCase(),
        endereco: bairrosArray.join(', '),
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
        tipo_imovel: tipo_imovel,
        observacoes: notes,
        etapa_funil: 'capturado',
      }

      const validation = validateAndNormalizeTipo(
        payload.preco,
        payload.demanda_venda_id,
        payload.demanda_locacao_id,
        payload.tipo,
      )

      if (!validation.isValid) {
        toast({ title: validation.erro || 'Erro de validação', variant: 'destructive' })
        setIsSubmitting(false)
        return
      }

      payload.tipo = validation.tipo

      const { data: newImovel, error } = await supabase
        .from('imoveis_captados')
        .insert(payload)
        .select('id')
        .single()

      if (error) {
        if (error.code === '23505') {
          setErrors({ code: 'Este código já está em uso.' })
          throw new Error('Código do imóvel já cadastrado.')
        }
        throw error
      }

      if (newImovel && fotos.length > 0) {
        const photoUrls = await uploadFotos(newImovel.id)
        if (photoUrls.length > 0) {
          await supabase
            .from('imoveis_captados')
            .update({ fotos: photoUrls })
            .eq('id', newImovel.id)
        }
      }

      toast({
        title: '✅ Imóvel Captado com Sucesso!',
        description: `O imóvel ${code.toUpperCase()} foi vinculado à demanda de ${demand.nome_cliente}.`,
        className: 'bg-[#10B981] text-white border-none',
      })

      trackEvent(currentUser?.id, 'property_created', {
        codigo_imovel: payload.codigo_imovel,
        tipo: payload.tipo,
        preco: payload.preco,
        demanda_id: demand.id,
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      toast({
        title: 'Erro ao captar imóvel',
        description: err.message || 'Tente novamente.',
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

              <div className="flex flex-col gap-1.5 md:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Transação *
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
                  <option value="">Selecione...</option>
                  <option value="Venda">Venda</option>
                  <option value="Locação">Locação</option>
                  <option value="Ambos">Venda e Locação</option>
                </select>
                {errors.tipo && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.tipo}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Tipo de Imóvel *
                </label>
                <select
                  value={tipo_imovel}
                  onChange={(e) => {
                    setTipoImovel(e.target.value)
                    setErrors((prev) => ({ ...prev, tipo_imovel: '' }))
                  }}
                  className={`w-full h-10 px-3 rounded-lg border bg-white text-[14px] outline-none transition-colors ${
                    errors.tipo_imovel
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                  }`}
                  required
                >
                  <option value="">Selecione o tipo</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa/Sobrado">Casa/Sobrado</option>
                  <option value="Prédio Comercial">Prédio Comercial</option>
                  <option value="Sala Comercial">Sala Comercial</option>
                  <option value="Galpão">Galpão</option>
                </select>
                {errors.tipo_imovel && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.tipo_imovel}</p>
                )}
              </div>

              <div>
                <Label className="font-bold text-[#333333] mb-1.5 block">Dormitórios</Label>
                <Input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => {
                    setBedrooms(e.target.value)
                    setErrors((prev) => ({ ...prev, bedrooms: '' }))
                  }}
                  placeholder="Ex: 2"
                  className={errors.bedrooms ? 'border-red-500 ring-red-500' : ''}
                />
              </div>

              <div>
                <Label className="font-bold text-[#333333] mb-1.5 block">Vagas</Label>
                <Input
                  type="number"
                  value={parking}
                  onChange={(e) => {
                    setParking(e.target.value)
                    setErrors((prev) => ({ ...prev, parking: '' }))
                  }}
                  placeholder="Ex: 1"
                  className={errors.parking ? 'border-red-500 ring-red-500' : ''}
                />
              </div>

              <div className="md:col-span-2">
                <Label className="font-bold text-[#333333] mb-1.5 block">Fotos do Imóvel</Label>
                <div className="border-2 border-dashed border-[#E5E5E5] rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-slate-700">Clique ou arraste fotos aqui</span>
                    <span className="text-xs text-slate-500">
                      {fotos.length} fotos selecionadas
                    </span>
                  </div>
                </div>
                {fotos.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {fotos.map((file, i) => (
                      <div
                        key={i}
                        className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border bg-slate-100 relative group"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            setFotos((prev) => prev.filter((_, idx) => idx !== i))
                          }}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
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

              {matchCount !== null && matchCount > 0 && (
                <div className="md:col-span-2 mt-2 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between animate-fade-in-up shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 shadow-inner">
                      <CheckCircle2 className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-orange-800">⚡ Matches Potenciais</p>
                      <p className="text-xs text-orange-700/80 font-bold mt-0.5">
                        Além da demanda selecionada, outros {matchCount} clientes procuram esse
                        perfil.
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
            className="min-h-[48px] bg-[#10B981] hover:bg-[#059669] text-white font-black px-6 pointer-events-auto flex items-center"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Salvando ({uploadProgress}%)
              </span>
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
