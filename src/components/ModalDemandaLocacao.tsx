import { useState, useMemo, useEffect } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, X } from 'lucide-react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useKeyboard } from '@/hooks/use-keyboard'
import { useIsMobile } from '@/hooks/use-mobile'
import { LocationSelector } from '@/components/LocationSelector'
import useAppStore from '@/stores/useAppStore'

const formSchema = z
  .object({
    nome_cliente: z
      .string()
      .min(1, 'Nome do cliente é obrigatório')
      .max(100, 'Máximo 100 caracteres'),
    telefone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\(\d{2}\) 9\d{4}-\d{4}$/.test(val),
        'Telefone inválido. Use formato: (XX) 9XXXX-XXXX',
      ),
    email: z
      .string()
      .email('Email inválido. Use formato: exemplo@email.com')
      .optional()
      .or(z.literal('')),
    tipo_demanda: z.enum(['Venda', 'Aluguel']).default('Aluguel'),
    bairros: z
      .array(z.string())
      .min(1, 'Selecione pelo menos um bairro')
      .max(20, 'Máximo 20 bairros'),
    valor_minimo: z.coerce.number().positive('Deve ser maior que zero'),
    valor_maximo: z.coerce.number().positive('Deve ser maior que zero'),
    dormitorios: z.coerce.number().min(0, 'Mínimo 0').max(10, 'Máximo 10'),
    vagas_estacionamento: z.coerce.number().min(0, 'Mínimo 0').max(10, 'Máximo 10'),
    nivel_urgencia: z.enum(['Baixa', 'Média', 'Alta']).default('Média'),
    observacoes: z.string().optional(),
  })
  .refine((data) => data.valor_maximo >= data.valor_minimo, {
    message: 'Valor máximo deve ser maior que o mínimo',
    path: ['valor_maximo'],
  })

interface Props {
  isOpen: boolean
  onClose: () => void
}

function ProgressBar({ control }: { control: any }) {
  const values = useWatch({ control })
  const progress = useMemo(() => {
    let filled = 0
    const total = 7
    if (values.nome_cliente) filled++
    if (values.tipo_demanda) filled++
    if (values.bairros && values.bairros.length > 0) filled++
    if (values.valor_minimo || values.valor_maximo) filled++
    if (values.dormitorios) filled++
    if (values.vagas_estacionamento) filled++
    if (values.nivel_urgencia) filled++
    return Math.round((filled / total) * 100)
  }, [values])

  if (progress <= 0 || progress >= 100) return null

  return (
    <div className="absolute top-0 left-0 w-full h-[4px] bg-[#E0E0E0] z-[1020]">
      <div
        className="h-full bg-[#10B981] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
      <span className="absolute top-[8px] right-[16px] text-[10px] font-bold text-[#10B981] bg-white px-2 py-0.5 rounded-full shadow-sm border border-[#E0E0E0]">
        {progress}% completo
      </span>
    </div>
  )
}

export function ModalDemandaLocacao({ isOpen, onClose }: Props) {
  const { toast } = useToast()
  const { addDemand } = useAppStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { isKeyboardOpen, viewportHeight } = useKeyboard()
  const isMobile = useIsMobile()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_cliente: '',
      telefone: '',
      email: '',
      tipo_demanda: 'Aluguel',
      bairros: [],
      valor_minimo: 0 as any,
      valor_maximo: 0 as any,
      dormitorios: 0 as any,
      vagas_estacionamento: 0 as any,
      nivel_urgencia: 'Média',
      observacoes: '',
    },
    mode: 'onTouched',
  })

  useEffect(() => {
    if (!isOpen) form.reset()
  }, [isOpen, form])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: any) => {
    let v = e.target.value.replace(/\D/g, '')
    if (v.length > 11) v = v.slice(0, 11)
    let formatted = v
    if (v.length > 2) formatted = `(${v.slice(0, 2)}) ${v.slice(2)}`
    if (v.length > 7) formatted = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
    onChange(formatted)
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('demandas_locacao')
        .insert({
          ...values,
          telefone: values.telefone || null,
          email: values.email || null,
          observacoes: values.observacoes || null,
          status_demanda: 'aberta',
          sdr_id: authData.user.id,
        })
        .select('*')
        .single()

      if (error) {
        console.error('[Supabase RLS Error] Falha ao inserir demanda de locação:', error)
        throw error
      }

      if (import.meta.env.DEV) {
        console.log('✅ Policy INSERT SDR ativa: Demanda registrada com sucesso!', data?.id)
      }

      window.dispatchEvent(
        new CustomEvent('demanda-created', { detail: { tipo: 'Aluguel', data } }),
      )

      addDemand({
        clientName: values.nome_cliente,
        phone: values.telefone || undefined,
        email: values.email || undefined,
        type: 'Aluguel',
        location: values.bairros,
        minBudget: Number(values.valor_minimo),
        maxBudget: Number(values.valor_maximo),
        bedrooms: Number(values.dormitorios),
        parkingSpots: Number(values.vagas_estacionamento),
        timeframe: values.nivel_urgencia,
        description: values.observacoes || '',
      })

      toast({
        title: `✅ Demanda criada com sucesso!`,
        className: 'bg-emerald-600 text-white border-emerald-600',
        duration: 3000,
      })

      form.reset()
      onClose()
      setIsSubmitting(false)
    } catch (error: any) {
      toast({ title: 'Erro ao criar demanda', description: error.message, variant: 'destructive' })
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent
        className={cn(
          'max-w-3xl flex flex-col gap-0 p-0 bg-[#F9FAFB] border-none overflow-hidden shadow-2xl z-[1010]',
          isMobile
            ? '!fixed !left-0 !right-0 !top-0 !bottom-auto !translate-x-0 !translate-y-0 !w-full !max-w-none rounded-none'
            : 'max-h-[90vh] rounded-xl',
        )}
        style={{
          height: isMobile ? (viewportHeight ? `${viewportHeight}px` : '100dvh') : undefined,
          maxHeight: isMobile ? '100dvh' : undefined,
        }}
      >
        <ProgressBar control={form.control} />

        <DialogHeader className="p-4 md:p-6 pb-4 border-b border-gray-200 bg-white shrink-0 sticky top-0 z-10 text-left mt-[4px]">
          <DialogTitle className="text-xl font-bold text-[#1A3A52]">Nova Demanda</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white relative" id="modal-scroll-area">
          <Form {...form}>
            <form
              id="locacao-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-4">
                <FormField
                  control={form.control}
                  name="nome_cliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 font-bold">Nome do Cliente</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-white border-gray-300"
                          placeholder="Ex: Maria Silva"
                          {...field}
                        />
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
                      <FormLabel className="text-gray-800 font-bold">Telefone</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-white border-gray-300"
                          placeholder="(11) 99999-9999"
                          value={field.value}
                          onChange={(e) => handlePhoneChange(e, field.onChange)}
                        />
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
                      <FormLabel className="text-gray-800 font-bold">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          className="bg-white border-gray-300"
                          placeholder="email@exemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo_demanda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 font-bold">Tipo</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4 h-[48px]"
                        >
                          <div
                            className={cn(
                              'flex-1 flex items-center px-4 rounded-lg border',
                              field.value === 'Venda'
                                ? 'border-[#1A3A52] bg-[#E8F0F8]'
                                : 'border-gray-300 bg-white',
                            )}
                          >
                            <RadioGroupItem value="Venda" id="t-venda" />
                            <Label
                              htmlFor="t-venda"
                              className="ml-2 cursor-pointer flex-1 py-3 font-semibold"
                            >
                              Venda
                            </Label>
                          </div>
                          <div
                            className={cn(
                              'flex-1 flex items-center px-4 rounded-lg border',
                              field.value === 'Aluguel'
                                ? 'border-[#1A3A52] bg-[#E8F0F8]'
                                : 'border-gray-300 bg-white',
                            )}
                          >
                            <RadioGroupItem value="Aluguel" id="t-aluguel" />
                            <Label
                              htmlFor="t-aluguel"
                              className="ml-2 cursor-pointer flex-1 py-3 font-semibold"
                            >
                              Aluguel
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bairros"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-gray-800 font-bold">Bairros</FormLabel>
                      <FormControl>
                        <LocationSelector
                          value={field.value}
                          onChange={field.onChange}
                          error={!!form.formState.errors.bairros}
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
                      <FormLabel className="text-gray-800 font-bold">Valor Mínimo (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-white border-gray-300"
                          placeholder="0"
                          {...field}
                        />
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
                      <FormLabel className="text-gray-800 font-bold">Valor Máximo (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-white border-gray-300"
                          placeholder="0"
                          {...field}
                        />
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
                      <FormLabel className="text-gray-800 font-bold">Dormitórios</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-white border-gray-300"
                          placeholder="Ex: 2"
                          {...field}
                        />
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
                      <FormLabel className="text-gray-800 font-bold">Vagas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-white border-gray-300"
                          placeholder="Ex: 1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nivel_urgencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 font-bold">Urgência</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-300 min-h-[48px]">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-[1050]">
                          <SelectItem value="Baixa">Baixa</SelectItem>
                          <SelectItem value="Média">Média</SelectItem>
                          <SelectItem value="Alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-gray-800 font-bold">Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          className="bg-white border-gray-300 min-h-[100px]"
                          placeholder="Detalhes adicionais..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {isMobile && <div className="h-[80px] md:hidden w-full shrink-0" />}
            </form>
          </Form>
        </div>

        <div
          className={cn(
            'bg-white border-t border-[#E0E0E0] p-3 md:p-4 flex gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-[1050] shrink-0',
            isMobile && isKeyboardOpen ? 'flex-row' : 'flex-col md:flex-row md:justify-end',
          )}
        >
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className={cn(
              'min-h-[44px] md:min-h-[48px] text-[#666666] hover:text-[#333333] hover:bg-transparent font-bold text-[16px] rounded-[8px] border border-[#E0E0E0] md:border-transparent bg-white',
              isMobile && isKeyboardOpen ? 'flex-1 order-1' : 'order-2 sm:order-1 w-full sm:w-auto',
            )}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="locacao-form"
            disabled={isSubmitting}
            className={cn(
              'min-h-[44px] md:min-h-[48px] bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[16px] rounded-[8px] shadow-[0_4px_12px_rgba(16,185,129,0.3)]',
              isMobile && isKeyboardOpen
                ? 'flex-1 order-2'
                : 'min-w-[140px] order-1 sm:order-2 w-full sm:w-auto',
            )}
          >
            <Check className="mr-2 h-5 w-5" />
            {isSubmitting
              ? 'Salvando...'
              : isMobile && isKeyboardOpen
                ? 'Confirmar'
                : 'Criar Demanda'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
