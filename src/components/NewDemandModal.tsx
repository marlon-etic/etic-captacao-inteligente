import { useEffect } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { LocationSelector } from '@/components/LocationSelector'
import { UrgencySelector } from '@/components/UrgencySelector'
import { Textarea } from '@/components/ui/textarea'
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
import { X } from 'lucide-react'

const formSchema = z
  .object({
    clientName: z.string().min(3, 'Mínimo 3 caracteres'),
    clientPhone: z.string().optional().or(z.literal('')),
    type: z.enum(['Venda', 'Aluguel']),
    location: z.array(z.string()).min(1, 'Selecione um bairro'),
    minBudget: z.coerce.number().positive('Maior que zero'),
    maxBudget: z.coerce.number().positive('Maior que zero'),
    bedrooms: z.coerce.number().min(0, 'Valor inválido'),
    parkingSpots: z.coerce.number().min(0, 'Valor inválido'),
    timeframe: z.string().min(1, 'Selecione a urgência'),
    clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
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
      type: currentUser?.role === 'corretor' ? 'Venda' : 'Aluguel',
      location: [],
      minBudget: '' as any,
      maxBudget: '' as any,
      bedrooms: '' as any,
      parkingSpots: '' as any,
      timeframe: '',
      clientEmail: '',
      description: '',
    },
  })

  useEffect(() => {
    if (!isOpen) form.reset()
  }, [isOpen, form])

  useEffect(() => {
    if (!isOpen) return

    const updateVh = () => {
      const vh = (window.visualViewport?.height || window.innerHeight) * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    updateVh()
    window.visualViewport?.addEventListener('resize', updateVh)
    window.visualViewport?.addEventListener('scroll', updateVh)

    return () => {
      window.visualViewport?.removeEventListener('resize', updateVh)
      window.visualViewport?.removeEventListener('scroll', updateVh)
    }
  }, [isOpen])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addDemand({
      clientName: values.clientName,
      phone: values.clientPhone,
      clientEmail: values.clientEmail || undefined,
      type: values.type,
      location: values.location.join(', '),
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
          className="fixed top-0 left-0 right-0 bottom-0 z-[110] flex flex-col bg-white overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          style={{ maxHeight: 'calc(var(--vh, 1vh) * 100)', height: 'auto' }}
          aria-describedby={undefined}
        >
          <div className="h-[56px] shrink-0 border-b border-[#E0E0E0] flex items-center justify-between px-4 bg-white">
            <DialogPrimitive.Title className="text-[18px] font-bold text-[#1A3A52]">
              Nova Demanda
            </DialogPrimitive.Title>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <X className="h-6 w-6 text-[#999999]" />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex-1 px-4 py-6 pb-[120px]">
              <Form {...form}>
                <form
                  id="new-demand-form"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[14px] text-[#333333] font-semibold">
                          Nome
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Maria Silva"
                            inputMode="text"
                            autoCapitalize="words"
                            enterKeyHint="next"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[#FF4444]" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="clientPhone"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[14px] text-[#333333] font-semibold">
                            Telefone <span className="text-[#999999] font-normal">(opcional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              inputMode="tel"
                              enterKeyHint="next"
                              placeholder="Somente números"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[#FF4444]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clientEmail"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[14px] text-[#333333] font-semibold">
                            Email <span className="text-[#999999] font-normal">(opcional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              inputMode="email"
                              autoCapitalize="none"
                              enterKeyHint="next"
                              placeholder="email@exemplo.com"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage className="text-[#FF4444]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[14px] text-[#333333] font-semibold">
                          Tipo
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex-1 flex items-center space-x-2 bg-[#F5F5F5] px-4 py-2 rounded-[8px] border border-[#E0E0E0] min-h-[48px]">
                              <RadioGroupItem value="Venda" id="venda-modal" />
                              <Label
                                htmlFor="venda-modal"
                                className="font-semibold text-[16px] text-[#333333] cursor-pointer flex-1 h-full flex items-center"
                              >
                                Venda
                              </Label>
                            </div>
                            <div className="flex-1 flex items-center space-x-2 bg-[#F5F5F5] px-4 py-2 rounded-[8px] border border-[#E0E0E0] min-h-[48px]">
                              <RadioGroupItem value="Aluguel" id="aluguel-modal" />
                              <Label
                                htmlFor="aluguel-modal"
                                className="font-semibold text-[16px] text-[#333333] cursor-pointer flex-1 h-full flex items-center"
                              >
                                Aluguel
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage className="text-[#FF4444]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[14px] text-[#333333] font-semibold">
                          Bairro
                        </FormLabel>
                        <FormControl>
                          <LocationSelector value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage className="text-[#FF4444]" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minBudget"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[14px] text-[#333333] font-semibold">
                            Valor mínimo (R$)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              enterKeyHint="next"
                              placeholder="Ex: 2000"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[#FF4444]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxBudget"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[14px] text-[#333333] font-semibold">
                            Valor máximo (R$)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              enterKeyHint="next"
                              placeholder="Ex: 5000"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[#FF4444]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[14px] text-[#333333] font-semibold">
                            Dormitórios
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              enterKeyHint="next"
                              placeholder="Ex: 2"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[#FF4444]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="parkingSpots"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[14px] text-[#333333] font-semibold">
                            Vagas
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              enterKeyHint="next"
                              placeholder="Ex: 1"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[#FF4444]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="timeframe"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[14px] text-[#333333] font-semibold">
                          Urgência
                        </FormLabel>
                        <FormControl>
                          <UrgencySelector value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage className="text-[#FF4444]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[14px] text-[#333333] font-semibold">
                          Observações
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detalhes adicionais da demanda..."
                            enterKeyHint="done"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[#FF4444]" />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-[#E0E0E0] p-4 shrink-0 flex flex-col gap-3 z-50">
              <Button
                type="submit"
                form="new-demand-form"
                className="w-full min-h-[48px] bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold text-[16px] rounded-[8px]"
              >
                ✅ Criar Demanda
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full min-h-[48px] text-[#999999] hover:text-[#333333] font-bold text-[16px] rounded-[8px]"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
