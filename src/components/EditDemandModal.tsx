import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import { LocationSelector } from '@/components/LocationSelector'
import { UrgencySelector } from '@/components/UrgencySelector'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

const formSchema = z
  .object({
    nome_cliente: z.string().min(1, 'Obrigatório'),
    telefone: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    bairros: z
      .array(z.string())
      .min(1, 'Selecione pelo menos um bairro')
      .max(20, 'Máximo de 20 bairros'),
    valor_minimo: z.coerce.number().min(0),
    valor_maximo: z.coerce.number().min(0),
    dormitorios: z.coerce.number().min(0),
    vagas_estacionamento: z.coerce.number().min(0),
    nivel_urgencia: z.string().min(1, 'Obrigatório'),
    observacoes: z.string().optional(),
  })
  .refine((data) => data.valor_maximo >= data.valor_minimo, {
    message: 'Máximo deve ser >= Mínimo',
    path: ['valor_maximo'],
  })

export function EditDemandModal({
  demand,
  isOpen,
  onClose,
}: {
  demand: SupabaseDemand | null
  isOpen: boolean
  onClose: () => void
}) {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_cliente: '',
      telefone: '',
      email: '',
      bairros: [],
      valor_minimo: 0,
      valor_maximo: 0,
      dormitorios: 0,
      vagas_estacionamento: 0,
      nivel_urgencia: 'Média',
      observacoes: '',
    },
  })

  useEffect(() => {
    if (demand && isOpen) {
      form.reset({
        nome_cliente: demand.nome_cliente,
        telefone: demand.telefone || '',
        email: demand.email || '',
        bairros: demand.bairros,
        valor_minimo: demand.valor_minimo,
        valor_maximo: demand.valor_maximo,
        dormitorios: demand.dormitorios || 0,
        vagas_estacionamento: demand.vagas_estacionamento || 0,
        nivel_urgencia: demand.nivel_urgencia,
        observacoes: demand.observacoes || '',
      })
    }
  }, [demand, isOpen, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!demand) return
    setIsSubmitting(true)
    try {
      const table = demand.tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'

      const payload: any = {
        nome_cliente: values.nome_cliente,
        telefone: values.telefone || null,
        email: values.email || null,
        bairros: values.bairros,
        valor_minimo: values.valor_minimo,
        valor_maximo: values.valor_maximo,
        dormitorios: values.dormitorios,
        vagas_estacionamento: values.vagas_estacionamento,
        nivel_urgencia: values.nivel_urgencia,
      }

      if (demand.tipo === 'Aluguel') {
        payload.observacoes = values.observacoes
      } else {
        payload.necessidades_especificas = values.observacoes
      }

      const { error, data } = await supabase
        .from(table)
        .update(payload)
        .eq('id', demand.id)
        .select()
        .single()
      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Demanda atualizada.',
        className: 'bg-emerald-600 text-white border-emerald-600',
      })
      window.dispatchEvent(
        new CustomEvent('demanda-updated', { detail: { tipo: demand.tipo, data } }),
      )
      onClose()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && !isSubmitting && onClose()}>
      <DialogContent
        className={cn(
          'sm:max-w-[700px] p-0 flex flex-col gap-0 shadow-2xl z-[1010] bg-[#F9FAFB]',
          isMobile
            ? '!fixed !inset-0 !w-full !max-w-none rounded-none'
            : 'max-h-[90vh] overflow-hidden',
        )}
      >
        <DialogHeader className="p-4 md:p-6 border-b shrink-0 bg-white sticky top-0 z-10 text-left mt-[4px]">
          <DialogTitle className="text-xl font-bold text-[#1A3A52]">Editar Demanda</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F9FAFB]">
          <Form {...form}>
            <form
              id="edit-demand-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome_cliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-800">Nome do Cliente *</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-800">Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-800">Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bairros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-800">Bairros *</FormLabel>
                      <FormControl>
                        <LocationSelector
                          value={field.value}
                          onChange={field.onChange}
                          demandId={demand?.id}
                          demandType={demand?.tipo}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valor_minimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-800">Valor Mínimo</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valor_maximo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-800">Valor Máximo</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dormitorios"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-800">Dormitórios</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vagas_estacionamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-800">Vagas</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nivel_urgencia"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-bold text-gray-800">Urgência *</FormLabel>
                      <FormControl>
                        <UrgencySelector value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-bold text-gray-800">Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="bg-white min-h-[80px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        <div
          className={cn(
            'bg-white border-t p-4 flex justify-end gap-3 shrink-0',
            isMobile && 'flex-row',
          )}
        >
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className={cn('text-[#666666] font-bold min-h-[48px]', isMobile && 'flex-1')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="edit-demand-form"
            disabled={isSubmitting}
            className={cn(
              'bg-[#10B981] hover:bg-[#059669] text-white font-bold min-h-[48px]',
              isMobile && 'flex-1',
            )}
          >
            <Check className="mr-2 h-5 w-5" /> {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
