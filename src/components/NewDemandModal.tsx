import { useEffect, useMemo, useState } from 'react'
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
import { useForm, useWatch } from 'react-hook-form'
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
import { useKeyboard } from '@/hooks/use-keyboard'
import { useIsMobile } from '@/hooks/use-mobile'
import { supabase } from '@/lib/supabase/client'

export const formSchema = z
  .object({
    clientName: z.string().min(3, 'Mínimo 3 caracteres'),
    clientPhone: z
      .string()
      .transform((v) => (v ? v.replace(/\D/g, '') : ''))
      .refine((v) => v === '' || v.length >= 8, 'Telefone inválido. Mínimo de 8 dígitos numéricos.')
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
    tipo_imovel: z.array(z.string()).min(1, 'Selecione pelo menos um tipo de imóvel'),
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

function ProgressBar({ control }: { control: any }) {
  const values = useWatch({ control })
  const progress = useMemo(() => {
    let filled = 0
    const total = 7
    if (values.clientName) filled++
    if (values.type) filled++
    if (values.location && values.location.length > 0) filled++
    if (values.minBudget) filled++
    if (values.maxBudget) filled++
    if (values.bedrooms) filled++
    if (values.timeframe) filled++
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

function FormSummary({
  control,
  isKeyboardOpen,
  isMobile,
}: {
  control: any
  isKeyboardOpen: boolean
  isMobile: boolean
}) {
  const values = useWatch({ control })
  if (!isKeyboardOpen || !isMobile) return null

  return (
    <div className="px-4 pb-3 text-[12px] text-gray-600 animate-in fade-in slide-in-from-top-2 text-left mt-2">
      <div className="bg-[#F5F5F5] rounded-[8px] p-2.5 border border-[#E0E0E0] space-y-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="font-bold text-[#1A3A52] mb-1.5 uppercase tracking-wider text-[10px]">
          Resumo
        </div>
        <div className="flex gap-2 truncate items-center">
          <span className="font-medium shrink-0 text-[14px]">👤</span>{' '}
          <span className="truncate font-medium">{values.clientName || '...'}</span>
        </div>
        <div className="flex gap-2 truncate items-center">
          <span className="font-medium shrink-0 text-[14px]">📍</span>{' '}
          <span className="truncate font-medium">
            {values.location?.length ? values.location.join(', ') : '...'}
          </span>
        </div>
        <div className="flex gap-2 truncate items-center">
          <span className="font-medium shrink-0 text-[14px]">💰</span>{' '}
          <span className="truncate font-medium">
            R$ {values.minBudget || 0} - R$ {values.maxBudget || 0}
          </span>
        </div>
      </div>
    </div>
  )
}

export function NewDemandModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addDemand, currentUser } = useAppStore()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { isKeyboardOpen, viewportHeight } = useKeyboard()
  const isMobile = useIsMobile()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      type: currentUser?.role === 'corretor' ? 'Venda' : 'Aluguel',
      tipo_imovel: ['Apartamento'],
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const { data: authData } = await supabase.auth.getUser()

      let formattedPhone = null
      if (values.clientPhone) {
        const digits = values.clientPhone.replace(/\D/g, '')
        if (digits.length === 11) {
          formattedPhone = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
        } else if (digits.length === 10) {
          formattedPhone = `(${digits.slice(0, 2)}) 9${digits.slice(2, 6)}-${digits.slice(6)}`
        } else {
          formattedPhone = values.clientPhone
        }
      }

      if (authData?.user) {
        if (values.type === 'Aluguel') {
          const { data, error } = await supabase
            .from('demandas_locacao')
            .insert({
              nome_cliente: values.clientName,
              telefone: formattedPhone,
              email: values.clientEmail || null,
              tipo_imovel: values.tipo_imovel,
              bairros: values.location,
              valor_minimo: values.minBudget,
              valor_maximo: values.maxBudget,
              dormitorios:
                values.bedrooms !== undefined && values.bedrooms !== null && values.bedrooms !== ''
                  ? Number(values.bedrooms)
                  : 0,
              vagas_estacionamento:
                values.parkingSpots !== undefined &&
                values.parkingSpots !== null &&
                values.parkingSpots !== ''
                  ? Number(values.parkingSpots)
                  : 0,
              nivel_urgencia: values.timeframe,
              observacoes: values.description || null,
              status_demanda: 'aberta',
              sdr_id: authData.user.id,
            })
            .select('*')
            .single()

          if (error) throw error

          if (data) {
            window.dispatchEvent(
              new CustomEvent('demanda-created', { detail: { tipo: 'Aluguel', data } }),
            )
          }
        } else {
          const { data, error } = await supabase
            .from('demandas_vendas')
            .insert({
              nome_cliente: values.clientName,
              telefone: formattedPhone,
              email: values.clientEmail || null,
              tipo_imovel: values.tipo_imovel,
              bairros: values.location,
              valor_minimo: values.minBudget,
              valor_maximo: values.maxBudget,
              dormitorios:
                values.bedrooms !== undefined && values.bedrooms !== null && values.bedrooms !== ''
                  ? Number(values.bedrooms)
                  : 0,
              vagas_estacionamento:
                values.parkingSpots !== undefined &&
                values.parkingSpots !== null &&
                values.parkingSpots !== ''
                  ? Number(values.parkingSpots)
                  : 0,
              nivel_urgencia: values.timeframe,
              necessidades_especificas: values.description || null,
              status_demanda: 'aberta',
              corretor_id: authData.user.id,
            })
            .select('*')
            .single()

          if (error) throw error

          if (data) {
            window.dispatchEvent(
              new CustomEvent('demanda-created', { detail: { tipo: 'Venda', data } }),
            )
          }
        }
      }

      // Fallback para visualização legado
      addDemand({
        clientName: values.clientName,
        phone: formattedPhone || undefined,
        clientEmail: values.clientEmail || undefined,
        type: values.type,
        location: values.location,
        minBudget: values.minBudget,
        maxBudget: values.maxBudget,
        budget: values.maxBudget,
        bedrooms:
          values.bedrooms !== undefined && values.bedrooms !== null && values.bedrooms !== ''
            ? Number(values.bedrooms)
            : 0,
        parkingSpots:
          values.parkingSpots !== undefined &&
          values.parkingSpots !== null &&
          values.parkingSpots !== ''
            ? Number(values.parkingSpots)
            : 0,
        timeframe: values.timeframe,
        description: values.description || 'Nova demanda via modal rápido',
      })

      toast({
        title: '✅ Demanda cadastrada com sucesso!',
        className: 'bg-emerald-600 text-white border-emerald-600',
        duration: 3000,
      })

      form.reset()
      onClose()
      sessionStorage.setItem(
        'etic_filters_my_demands_view_supabase_Venda',
        JSON.stringify({ status: 'Todos', urgencia: 'Todos', data: 'Todos', bairro: '' }),
      )
      sessionStorage.setItem(
        'etic_filters_my_demands_view_supabase_Aluguel',
        JSON.stringify({ status: 'Todos', urgencia: 'Todos', data: 'Todos', bairro: '' }),
      )
      window.dispatchEvent(new Event('filters-updated'))
      navigate('/app?tab=minhas-demandas')
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Ocorreu um erro ao salvar.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[1000] bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-[1010] flex flex-col bg-white overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 shadow-2xl',
            isMobile
              ? '!fixed !left-0 !right-0 !top-0 !bottom-auto !translate-x-0 !translate-y-0 !w-full !max-w-none rounded-none'
              : 'top-0 left-0 right-0 bottom-0 md:top-[50%] md:left-[50%] md:-translate-x-[50%] md:-translate-y-[50%] md:bottom-auto md:right-auto md:w-[640px] md:max-w-[90vw] md:max-h-[90vh] md:rounded-[12px]',
          )}
          style={{
            height: isMobile ? (viewportHeight ? `${viewportHeight}px` : '100dvh') : undefined,
            maxHeight: isMobile ? '100dvh' : undefined,
          }}
          aria-describedby={undefined}
        >
          <ProgressBar control={form.control} />

          <div className="shrink-0 border-b border-[#E0E0E0] bg-white z-10 sticky top-0 mt-[4px]">
            <div className="h-[56px] flex items-center justify-between px-4">
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
            <FormSummary
              control={form.control}
              isKeyboardOpen={isKeyboardOpen}
              isMobile={isMobile}
            />
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative bg-[#F9FAFB]">
            <Form {...form}>
              <form id="new-demand-form" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 px-4 py-6">
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
                    placeholder="(11) 99999-9999"
                    optional
                  />
                  <CustomInput
                    control={form.control}
                    name="clientEmail"
                    label="Email do Cliente"
                    placeholder="email@exemplo.com"
                    type="email"
                    optional
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-0">
                        <FormLabel className="flex items-center h-[20px] mb-[4px] text-[14px] text-[#333333] font-semibold">
                          Transação *
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4 h-[48px]"
                          >
                            <div
                              className={cn(
                                'flex-1 flex items-center space-x-2 bg-[#FFFFFF] px-4 rounded-[8px] border',
                                fieldState.error
                                  ? 'border-[#FF4444] border-2'
                                  : 'border-[#E0E0E0] hover:border-[#1A3A52]',
                                field.value === 'Venda' && 'border-[#1A3A52] bg-[#E8F0F8]',
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
                                'flex-1 flex items-center space-x-2 bg-[#FFFFFF] px-4 rounded-[8px] border',
                                fieldState.error
                                  ? 'border-[#FF4444] border-2'
                                  : 'border-[#E0E0E0] hover:border-[#1A3A52]',
                                field.value === 'Aluguel' && 'border-[#1A3A52] bg-[#E8F0F8]',
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
                    name="tipo_imovel"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-0 md:col-span-2">
                        <FormLabel className="flex items-center h-[20px] mb-[4px] text-[14px] text-[#333333] font-semibold">
                          Tipo de Imóvel (Múltipla Seleção) *
                        </FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-3">
                            {[
                              'Apartamento',
                              'Casa/Sobrado',
                              'Prédio Comercial',
                              'Sala Comercial',
                              'Galpão',
                            ].map((tipo) => (
                              <label
                                key={tipo}
                                className="flex items-center gap-2 cursor-pointer bg-white border border-[#E0E0E0] px-3 py-2 rounded-[8px] hover:border-[#1A3A52] transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={field.value?.includes(tipo) || false}
                                  onChange={(e) => {
                                    const current = field.value || []
                                    const updated = e.target.checked
                                      ? [...current, tipo]
                                      : current.filter((t: string) => t !== tipo)
                                    field.onChange(updated)
                                  }}
                                  className="w-4 h-4 text-[#10B981] rounded border-[#E0E0E0] focus:ring-[#10B981]"
                                />
                                <span className="text-[14px] font-medium text-[#333333]">
                                  {tipo}
                                </span>
                              </label>
                            ))}
                          </div>
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
                          Bairros *
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

                  {/* Spacer for mobile to avoid the fixed footer covering last input */}
                  {isMobile && <div className="h-[80px] md:hidden w-full shrink-0" />}
                </div>
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
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className={cn(
                'min-h-[44px] md:min-h-[48px] text-[#666666] hover:text-[#333333] hover:bg-transparent font-bold text-[16px] rounded-[8px] border border-[#E0E0E0] md:border-transparent',
                isMobile && isKeyboardOpen
                  ? 'flex-1 order-1'
                  : 'w-full md:w-auto order-2 md:order-1',
              )}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="new-demand-form"
              disabled={isSubmitting || form.formState.isSubmitting}
              className={cn(
                'min-h-[44px] md:min-h-[48px] bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[16px] rounded-[8px] shadow-[0_4px_12px_rgba(16,185,129,0.3)]',
                isMobile && isKeyboardOpen
                  ? 'flex-1 order-2'
                  : 'w-full md:w-[160px] order-1 md:order-2',
              )}
            >
              {isSubmitting
                ? 'Salvando...'
                : isMobile && isKeyboardOpen
                  ? '✅ Confirmar'
                  : '✅ Criar Demanda'}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
