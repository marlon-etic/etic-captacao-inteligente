import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CapturedProperty } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { BairroCombobox } from './BairroCombobox'
import { normalizeTipo } from '@/lib/roleFilters'

const editSchema = z
  .object({
    code: z.string().min(1, 'Código é obrigatório'),
    address: z.string().min(1, 'Bairro é obrigatório'),
    modalidade: z.enum(['Venda', 'Aluguel', 'Ambos']),
    precoVenda: z.coerce.number().min(0).optional().catch(0),
    valorAluguel: z.coerce.number().min(0).optional().catch(0),
    bedrooms: z.coerce.number().min(0).optional().catch(0),
    parking: z.coerce.number().min(0).optional().catch(0),
    obs: z.string().max(500, 'Máximo 500 caracteres').optional().catch(''),
    tipo_imovel: z.string().min(1, 'Tipo de imóvel é obrigatório'),
  })
  .refine(
    (data) => {
      if (data.modalidade === 'Venda' || data.modalidade === 'Ambos') {
        if (!data.precoVenda || data.precoVenda <= 0) return false
      }
      if (data.modalidade === 'Aluguel' || data.modalidade === 'Ambos') {
        if (!data.valorAluguel || data.valorAluguel <= 0) return false
      }
      return true
    },
    {
      message: 'Preencha os valores obrigatórios para a modalidade selecionada.',
      path: ['modalidade'],
    },
  )

export function validateAndNormalizeTipo(
  modalidade: 'Venda' | 'Aluguel' | 'Ambos',
  precoVenda: number,
  valorAluguel: number,
  demandaVendaId?: string | null,
  demandaLocacaoId?: string | null,
): {
  isValid: boolean
  tipo: 'Venda' | 'Aluguel' | 'Ambos'
  erro?: string
} {
  if (modalidade === 'Venda' || modalidade === 'Ambos') {
    if (!precoVenda || precoVenda <= 0) {
      return { isValid: false, tipo: 'Ambos', erro: '❌ Preencha o valor de venda.' }
    }
  }

  if (modalidade === 'Aluguel' || modalidade === 'Ambos') {
    if (!valorAluguel || valorAluguel <= 0) {
      return { isValid: false, tipo: 'Ambos', erro: '❌ Preencha o valor de aluguel.' }
    }
  }

  // Se tem dupla vinculação, obrigatoriamente é Ambos
  if (demandaVendaId && demandaLocacaoId) {
    if (modalidade !== 'Ambos') {
      return {
        isValid: false,
        tipo: 'Ambos',
        erro: '❌ Este imóvel está vinculado a demandas de venda e aluguel. A modalidade deve ser "Venda e Aluguel (Ambos)".',
      }
    }
  }

  if (demandaVendaId && modalidade === 'Aluguel') {
    return {
      isValid: false,
      tipo: 'Venda',
      erro: '❌ Este imóvel está vinculado a uma demanda de venda. A modalidade deve ser Venda ou Ambos.',
    }
  }

  if (demandaLocacaoId && modalidade === 'Venda') {
    return {
      isValid: false,
      tipo: 'Aluguel',
      erro: '❌ Este imóvel está vinculado a uma demanda de aluguel. A modalidade deve ser Aluguel ou Ambos.',
    }
  }

  return { isValid: true, tipo: modalidade }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  property: CapturedProperty | null
}

export function EditPropertyModal({ isOpen, onClose, property }: Props) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      code: '',
      address: '',
      modalidade: 'Venda',
      precoVenda: 0,
      valorAluguel: 0,
      bedrooms: 0,
      parking: 0,
      obs: '',
      tipo_imovel: '',
    },
  })

  const originalObs = property ? ((property as any).observacoes ?? property.obs ?? '') : ''
  const hasOriginalObs = originalObs && String(originalObs).trim() !== ''

  useEffect(() => {
    if (property && isOpen) {
      const propertyTipo = normalizeTipo(
        (property as any).tipo,
        (property as any).preco,
        (property as any).valor,
      )

      form.reset({
        code: property.code || (property as any).codigo_imovel || '',
        address: property.neighborhood || (property as any).endereco || '',
        modalidade:
          propertyTipo === 'Ambos' ? 'Ambos' : propertyTipo === 'Aluguel' ? 'Aluguel' : 'Venda',
        precoVenda: property.value || (property as any).preco || 0,
        valorAluguel: (property as any).rentValue || (property as any).valor || 0,
        bedrooms: (property as any).dormitorios ?? property.bedrooms ?? 0,
        parking: (property as any).vagas ?? property.parkingSpots ?? 0,
        obs: originalObs,
        tipo_imovel: (property as any).tipo_imovel || property.propertyType || '',
      })
    }
  }, [property, isOpen, form, originalObs])

  const onSubmit = async (data: z.infer<typeof editSchema>) => {
    if (!property?.id) return
    setIsSubmitting(true)

    const propertyDemandaVendaId = (property as any).demanda_venda_id || null
    const propertyDemandaLocacaoId = (property as any).demanda_locacao_id || null

    const validation = validateAndNormalizeTipo(
      data.modalidade,
      data.precoVenda,
      data.valorAluguel,
      propertyDemandaVendaId,
      propertyDemandaLocacaoId,
    )

    if (!validation.isValid) {
      toast({
        title: validation.erro || 'Erro de validação',
        variant: 'destructive',
      })
      setIsSubmitting(false)
      return
    }

    const payload: any = {
      codigo_imovel: data.code.toUpperCase(),
      endereco: data.address,
      preco: data.modalidade === 'Venda' || data.modalidade === 'Ambos' ? data.precoVenda : null,
      valor:
        data.modalidade === 'Aluguel' || data.modalidade === 'Ambos' ? data.valorAluguel : null,
      dormitorios: data.bedrooms,
      vagas: data.parking,
      tipo_imovel: data.tipo_imovel,
      tipo: validation.tipo,
    }

    if (!hasOriginalObs) {
      payload.observacoes = data.obs
    } else {
      payload.observacoes = originalObs
    }

    let attempt = 0
    let success = false
    let lastError: any = null

    while (attempt < 3 && !success) {
      try {
        const { error } = await supabase
          .from('imoveis_captados')
          .update(payload)
          .eq('id', property.id)

        if (error) {
          if (error.code === '23505') {
            form.setError('code', { message: 'Código já em uso.' })
            throw new Error('Código do imóvel já cadastrado.')
          }
          throw error
        }
        success = true
      } catch (err: any) {
        lastError = err
        attempt++
        if (err.message === 'Código do imóvel já cadastrado.') break
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt))
      }
    }

    setIsSubmitting(false)

    if (success) {
      toast({
        title: '✅ Captação atualizada com sucesso!',
        className: 'bg-[#10B981] text-white border-none',
        duration: 3000,
      })
      onClose()
    } else {
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente. ' + (lastError?.message || ''),
        variant: 'destructive',
      })
    }
  }

  const modalidade = form.watch('modalidade')

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && !isSubmitting && onClose()}>
      <DialogContent className="max-w-md w-[95vw] p-0 overflow-hidden bg-white border-[2px] border-[#1A3A52] rounded-[16px] shadow-2xl z-[1050]">
        <DialogHeader className="p-4 md:p-6 border-b border-[#E5E5E5] bg-[#F8FAFC]">
          <DialogTitle className="text-[20px] font-black text-[#1A3A52]">
            Editar Captação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
          <ScrollArea className="max-h-[60vh] p-4 md:p-6">
            <div className="space-y-4">
              <div>
                <Label className="font-bold text-[#333333]">Código do Imóvel</Label>
                <Input
                  {...form.register('code')}
                  disabled={isSubmitting}
                  className="uppercase font-medium"
                />
                {form.formState.errors.code && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {form.formState.errors.code.message}
                  </p>
                )}
              </div>

              <div>
                <Label className="font-bold text-[#333333]">Bairro</Label>
                <Controller
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <BairroCombobox
                      value={field.value}
                      onChange={field.onChange}
                      error={!!form.formState.errors.address}
                      disabled={isSubmitting}
                    />
                  )}
                />
                {form.formState.errors.address && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>

              <div>
                <Label className="font-bold text-[#333333]">Tipo de Imóvel *</Label>
                <select
                  {...form.register('tipo_imovel')}
                  disabled={isSubmitting}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-medium"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Casa/Sobrado">Casa/Sobrado</option>
                  <option value="Prédio Comercial">Prédio Comercial</option>
                  <option value="Sala Comercial">Sala Comercial</option>
                  <option value="Galpão">Galpão</option>
                </select>
                {form.formState.errors.tipo_imovel && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {form.formState.errors.tipo_imovel.message}
                  </p>
                )}
              </div>

              <div>
                <Label className="font-bold text-[#333333]">Modalidade *</Label>
                <select
                  {...form.register('modalidade')}
                  disabled={isSubmitting}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-medium"
                >
                  <option value="Venda">Venda</option>
                  <option value="Aluguel">Aluguel</option>
                  <option value="Ambos">Venda e Aluguel (Ambos)</option>
                </select>
                {form.formState.errors.modalidade && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {form.formState.errors.modalidade.message}
                  </p>
                )}
              </div>

              {(modalidade === 'Venda' || modalidade === 'Ambos') && (
                <div className="animate-fade-in-down">
                  <Label className="font-bold text-[#333333]">Preço de Venda (R$)</Label>
                  <Input type="number" {...form.register('precoVenda')} disabled={isSubmitting} />
                  {form.formState.errors.precoVenda && (
                    <p className="text-red-500 text-xs mt-1 font-bold">
                      {form.formState.errors.precoVenda.message}
                    </p>
                  )}
                </div>
              )}

              {(modalidade === 'Aluguel' || modalidade === 'Ambos') && (
                <div className="animate-fade-in-down">
                  <Label className="font-bold text-[#333333]">Valor do Aluguel (R$)</Label>
                  <Input type="number" {...form.register('valorAluguel')} disabled={isSubmitting} />
                  {form.formState.errors.valorAluguel && (
                    <p className="text-red-500 text-xs mt-1 font-bold">
                      {form.formState.errors.valorAluguel.message}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-bold text-[#333333]">Dormitórios</Label>
                  <Input type="number" {...form.register('bedrooms')} disabled={isSubmitting} />
                </div>
                <div>
                  <Label className="font-bold text-[#333333]">Vagas</Label>
                  <Input type="number" {...form.register('parking')} disabled={isSubmitting} />
                </div>
              </div>

              <div>
                <Label className="font-bold text-[#333333]">Observações</Label>
                <Textarea
                  {...form.register('obs')}
                  className="min-h-[80px]"
                  disabled={isSubmitting || hasOriginalObs}
                  placeholder="Detalhes adicionais..."
                />
                <div className="text-right text-[11px] text-[#999999] mt-1 font-medium">
                  {form.watch('obs')?.length || 0}/500
                </div>
                {hasOriginalObs && (
                  <p className="text-[#999999] text-[11px] mt-1 italic">
                    * Observações originais preservadas.
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 md:p-6 border-t border-[#E5E5E5] bg-[#F8FAFC] flex gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="font-bold min-h-[48px] w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1A3A52] hover:bg-[#2E5F8A] text-white font-bold min-h-[48px] w-full sm:w-auto shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
