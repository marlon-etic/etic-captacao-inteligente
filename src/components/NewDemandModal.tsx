import { useEffect } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { LocationSelector } from '@/components/LocationSelector'
import { UrgencySelector } from '@/components/UrgencySelector'
import { CustomInput } from '@/components/CustomInput'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export const formSchema = z
  .object({
    clientName: z.string().min(3, 'Mínimo 3 caracteres'),
    clientPhone: z
      .string()
      .transform((v) => (v ? v.replace(/\D/g, '') : ''))
      .refine(
        (v) => v === '' || v.length === 10 || v.length === 11,
        'Telefone inválido. Use: (11) 99999-9999',
      )
      .optional()
      .or(z.literal('')),
    clientEmail: z
      .string()
      .refine(
        (v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        'Email inválido. Use: nome@dominio.com',
      )
      .optional()
      .or(z.literal('')),
    type: z.enum(['Venda', 'Aluguel']),
    location: z.array(z.string()).min(1, 'Selecione pelo menos um bairro'),
    minBudget: z.coerce.number({ invalid_type_error: 'Obrigatório' }).positive('Maior que zero'),
    maxBudget: z.coerce.number({ invalid_type_error: 'Obrigatório' }).positive('Maior que zero'),
    bedrooms: z.coerce.number({ invalid_type_error: 'Obrigatório' }).min(0, 'Valor inválido'),
    parkingSpots: z.coerce.number({ invalid_type_error: 'Obrigatório' }).min(0, 'Valor inválido'),
    timeframe: z.string().min(1, 'Selecione a urgência'),
    description: z.string().optional(),
  })
  .refine((data) => data.minBudget < data.maxBudget, {
    message: 'Mínimo deve ser menor que máximo',
    path: ['maxBudget'],
  })

export function NewDemandModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addDemand, currentUser } = useAppStore()
  const { toast } = useToast()
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      type: currentUser?.role === 'corretor' ? 'Venda' : 'Aluguel',
      location: [],
      minBudget: '' as any,
      maxBudget: '' as any,
      bedrooms: '' as any,
      parkingSpots: '' as any,
      timeframe: '',
      description: '',
    },
  })

  useEffect(() => {
    if (!isOpen) form.reset()
  }, [isOpen, form])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addDemand({
      clientName: values.clientName,
      phone: values.clientPhone,
      clientEmail: values.clientEmail || undefined,
      type: values.type,
      location: values.location,
      minBudget: values.minBudget,
      maxBudget: values.maxBudget,
      budget: values.maxBudget,
      bedrooms: values.bedrooms,
      parkingSpots: values.parkingSpots,
      timeframe: values.timeframe,
      description: values.description || 'Nova demanda via modal rápido',
    })
    toast({
      title: '✅ Demanda cadastrada com sucesso!',
      className: 'bg-emerald-600 text-white border-emerald-600',
      duration: 3000,
    })
    onClose()
    sessionStorage.setItem(
      'etic_filters_my_demands_view_all',
      JSON.stringify({ status: 'Ativos', prazo: 'Todos', bairro: '' }),
    )
    navigate('/app/demandas?tab=minhas-demandas')
  }

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed z-[110] flex flex-col bg-white overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 top-0 left-0 right-0 bottom-0 md:top-[50%] md:left-[50%] md:-translate-x-[50%] md:-translate-y-[50%] md:bottom-auto md:right-auto md:w-[640px] md:max-w-[90vw] md:max-h-[90vh] md:rounded-[12px]"
          aria-describedby={undefined}
        >
          <div className="h-[56px] shrink-0 border-b border-[#E0E0E0] flex items-center justify-between px-4 bg-white">
            <DialogPrimitive.Title className="text-[18px] font-bold text-[#1A3A52]">
              Nova Demanda
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="h-8 w-8 flex items-center justify-center rounded-full bg-[#E0E0E0] text-[#333333] hover:bg-[#D0D0D0]">
              <span className="sr-only">Fechar</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
            <Form {...form}>
              <form id="new-demand-form" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 px-4 py-6">
                  <CustomInput
                    control={form.control}
                    name="clientName"
                    label="Nome do Cliente"
                    placeholder="Ex: Maria Silva"
                    className="md:col-span-2"
                  />
                  <CustomInput
                    control={form.control}
                    name="clientPhone"
                    label="Telefone do Cliente"
                    placeholder="(11) 99999-9999 (opcional)"
                    optional
                  />
                  <CustomInput
                    control={form.control}
                    name="clientEmail"
                    label="Email do Cliente"
                    placeholder="email@exemplo.com (opcional)"
                    type="email"
                    optional
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-0">
                        <FormLabel className="flex items-center h-[20px] mb-[4px] text-[14px] text-[#333333] font-semibold">
                          Tipo
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4 h-[48px]"
                          >
                            <div
                              className={cn(
                                'flex-1 flex items-center space-x-2 bg-[#F5F5F5] px-4 rounded-[8px] border',
                                fieldState.error ? 'border-[#FF4444] border-2' : 'border-[#E0E0E0]',
                              )}
                            >
                              <RadioGroupItem value="Venda" id="venda-modal" />
                              <Label
                                htmlFor="venda-modal"
                                className="font-semibold text-[16px] cursor-pointer flex-1 py-3"
                              >
                                Venda
                              </Label>
                            </div>
                            <div
                              className={cn(
                                'flex-1 flex items-center space-x-2 bg-[#F5F5F5] px-4 rounded-[8px] border',
                                fieldState.error ? 'border-[#FF4444] border-2' : 'border-[#E0E0E0]',
                              )}
                            >
                              <RadioGroupItem value="Aluguel" id="aluguel-modal" />
                              <Label
                                htmlFor="aluguel-modal"
                                className="font-semibold text-[16px] cursor-pointer flex-1 py-3"
                              >
                                Aluguel
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage className="min-h-[16px] mt-1" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-0">
                        <FormLabel className="flex items-center h-[20px] mb-[4px] text-[14px] text-[#333333] font-semibold">
                          Bairros
                        </FormLabel>
                        <FormControl>
                          <LocationSelector
                            value={field.value}
                            onChange={field.onChange}
                            error={!!fieldState.error}
                          />
                        </FormControl>
                        <FormMessage className="min-h-[16px] mt-1" />
                      </FormItem>
                    )}
                  />
                  <CustomInput
                    control={form.control}
                    name="minBudget"
                    label="Valor mínimo (R$)"
                    type="number"
                    placeholder="Ex: 2000"
                  />
                  <CustomInput
                    control={form.control}
                    name="maxBudget"
                    label="Valor máximo (R$)"
                    type="number"
                    placeholder="Ex: 5000"
                  />
                  <CustomInput
                    control={form.control}
                    name="bedrooms"
                    label="Dormitórios"
                    type="number"
                    placeholder="Ex: 2"
                  />
                  <CustomInput
                    control={form.control}
                    name="parkingSpots"
                    label="Vagas"
                    type="number"
                    placeholder="Ex: 1"
                  />
                  <FormField
                    control={form.control}
                    name="timeframe"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-0 md:col-span-2">
                        <FormLabel className="flex items-center h-[20px] mb-[4px] text-[14px] text-[#333333] font-semibold">
                          Urgência
                        </FormLabel>
                        <FormControl>
                          <UrgencySelector
                            value={field.value}
                            onChange={field.onChange}
                            error={!!fieldState.error}
                          />
                        </FormControl>
                        <FormMessage className="min-h-[16px] mt-1" />
                      </FormItem>
                    )}
                  />
                  <CustomInput
                    control={form.control}
                    name="description"
                    label="Observações"
                    placeholder="Detalhes adicionais da demanda..."
                    className="md:col-span-2"
                    multiline
                  />
                </div>
              </form>
            </Form>
          </div>
          <div className="sticky bottom-0 bg-white border-t border-[#E0E0E0] p-4 shrink-0 flex flex-col md:flex-row md:justify-end gap-3 z-50">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full md:w-auto min-h-[44px] md:min-h-[48px] text-[#666666] hover:text-[#333333] hover:bg-transparent font-bold text-[16px] rounded-[8px] order-2 md:order-1 border border-[#E0E0E0] md:border-transparent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="new-demand-form"
              disabled={form.formState.isSubmitting}
              className="w-full md:w-[160px] min-h-[48px] bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold text-[16px] rounded-[8px] order-1 md:order-2"
            >
              ✅ Criar Demanda
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
