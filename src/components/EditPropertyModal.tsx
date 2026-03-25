import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
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

const editSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  address: z.string().min(1, 'Endereço é obrigatório'),
  price: z.coerce.number().positive('Preço deve ser maior que zero'),
  bedrooms: z.coerce.number().min(0).optional().catch(0),
  parking: z.coerce.number().min(0).optional().catch(0),
  obs: z.string().max(500, 'Máximo 500 caracteres').optional().catch(''),
})

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
      price: 0,
      bedrooms: 0,
      parking: 0,
      obs: '',
    },
  })

  useEffect(() => {
    if (property && isOpen) {
      form.reset({
        code: property.code || '',
        address: property.neighborhood || '',
        price: property.value || 0,
        bedrooms: property.bedrooms || 0,
        parking: property.parkingSpots || 0,
        obs: property.obs || '',
      })
    }
  }, [property, isOpen, form])

  const onSubmit = async (data: z.infer<typeof editSchema>) => {
    if (!property?.id) return
    setIsSubmitting(true)

    let attempt = 0
    let success = false
    let lastError: any = null

    // Lógica de Retry com Backoff
    while (attempt < 3 && !success) {
      try {
        const { error } = await supabase
          .from('imoveis_captados')
          .update({
            codigo_imovel: data.code.toUpperCase(),
            endereco: data.address,
            preco: data.price,
            dormitorios: data.bedrooms,
            vagas: data.parking,
            observacoes: data.obs,
          })
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
        if (err.message === 'Código do imóvel já cadastrado.') break // Não tenta retry se for erro de validação única
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
                <Label className="font-bold text-[#333333]">Endereço / Localização</Label>
                <Input {...form.register('address')} disabled={isSubmitting} />
                {form.formState.errors.address && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>

              <div>
                <Label className="font-bold text-[#333333]">Preço (R$)</Label>
                <Input type="number" {...form.register('price')} disabled={isSubmitting} />
                {form.formState.errors.price && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>

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
                  disabled={isSubmitting}
                  placeholder="Detalhes adicionais..."
                />
                <div className="text-right text-[11px] text-[#999999] mt-1 font-medium">
                  {form.watch('obs')?.length || 0}/500
                </div>
                {form.formState.errors.obs && (
                  <p className="text-red-500 text-xs mt-1 font-bold">
                    {form.formState.errors.obs.message}
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
