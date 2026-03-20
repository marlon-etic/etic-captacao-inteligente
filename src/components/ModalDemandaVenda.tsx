import { useState } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, X, ChevronDown } from 'lucide-react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useKeyboard } from '@/hooks/use-keyboard'
import { useIsMobile } from '@/hooks/use-mobile'

const BAIRROS_OPCOES = [
  'Vila Mariana',
  'Pinheiros',
  'Itaim Bibi',
  'Mooca',
  'Tatuapé',
  'Vila Madalena',
  'Consolação',
  'Bela Vista',
  'Lapa',
  'Vila Leopoldina',
]

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
    tipo_imovel: z.enum(['Casa', 'Apartamento', 'Terreno']).default('Apartamento'),
    bairros: z.array(z.string()).min(1, 'Selecione pelo menos um bairro'),
    valor_minimo: z.coerce.number().positive('Deve ser maior que zero'),
    valor_maximo: z.coerce.number().positive('Deve ser maior que zero'),
    dormitorios: z.coerce.number().min(0, 'Mínimo 0').max(10, 'Máximo 10'),
    vagas_estacionamento: z.coerce.number().min(0, 'Mínimo 0').max(10, 'Máximo 10'),
    nivel_urgencia: z.enum(['Baixa', 'Média', 'Alta']).default('Média'),
    necessidades_especificas: z.string().optional(),
  })
  .refine((data) => data.valor_maximo >= data.valor_minimo, {
    message: 'Valor máximo deve ser maior que o mínimo',
    path: ['valor_maximo'],
  })

interface Props {
  isOpen: boolean
  onClose: () => void
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
    <div className="mt-3 text-[12px] text-gray-600 bg-gray-50 p-2 rounded-md border border-gray-200 animate-in fade-in slide-in-from-top-2 text-left font-normal">
      <div className="font-semibold text-gray-800 mb-1">Resumo</div>
      <div className="flex gap-2 truncate">
        <span className="font-medium shrink-0">👤</span>{' '}
        <span className="truncate">{values.nome_cliente || '...'}</span>
      </div>
      <div className="flex gap-2 truncate">
        <span className="font-medium shrink-0">📍</span>{' '}
        <span className="truncate">
          {values.bairros?.length ? values.bairros.join(', ') : '...'}
        </span>
      </div>
      <div className="flex gap-2 truncate">
        <span className="font-medium shrink-0">💰</span>{' '}
        <span className="truncate">
          R$ {values.valor_minimo || 0} - R$ {values.valor_maximo || 0}
        </span>
      </div>
    </div>
  )
}

export function ModalDemandaVenda({ isOpen, onClose }: Props) {
  const { toast } = useToast()
  const { currentUser } = useAppStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { isKeyboardOpen, viewportHeight } = useKeyboard()
  const isMobile = useIsMobile()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_cliente: '',
      telefone: '',
      email: '',
      tipo_imovel: 'Apartamento',
      bairros: [],
      valor_minimo: 0 as any,
      valor_maximo: 0 as any,
      dormitorios: 0 as any,
      vagas_estacionamento: 0 as any,
      nivel_urgencia: 'Média',
      necessidades_especificas: '',
    },
    mode: 'onChange',
  })

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
      const { data, error } = await supabase
        .from('demandas_vendas')
        .insert({
          ...values,
          telefone: values.telefone || null,
          email: values.email || null,
          necessidades_especificas: values.necessidades_especificas || null,
          status_demanda: 'aberta',
          corretor_id: currentUser?.id,
        })
        .select('id')
        .single()

      if (error) throw error

      toast({
        title: `✅ Demanda de venda criada! ID: ${data.id}`,
        className: 'bg-emerald-600 text-white border-emerald-600',
        duration: 3000,
      })

      setTimeout(() => {
        form.reset()
        onClose()
        setIsSubmitting(false)
      }, 2000)
    } catch (error: any) {
      toast({ title: 'Erro ao criar demanda', description: error.message, variant: 'destructive' })
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent
        className={cn(
          'max-w-3xl flex flex-col gap-0 p-0 bg-[#F9FAFB] border-none overflow-hidden',
          isMobile
            ? '!fixed !left-0 !right-0 !bottom-0 !top-auto !translate-x-0 !translate-y-0 !w-full !max-w-none rounded-t-xl rounded-b-none'
            : 'max-h-[90vh] rounded-xl',
        )}
        style={{
          height: isMobile ? (viewportHeight ? `${viewportHeight}px` : '100dvh') : undefined,
          maxHeight: isMobile ? '100dvh' : undefined,
        }}
      >
        <DialogHeader className="p-4 md:p-6 pb-4 border-b border-gray-200 bg-white shrink-0 sticky top-0 z-10 text-left">
          <DialogTitle className="text-2xl font-bold text-[#1A3A52]">
            Nova Demanda de Venda
          </DialogTitle>
          <FormSummary control={form.control} isKeyboardOpen={isKeyboardOpen} isMobile={isMobile} />
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white relative">
          <Form {...form}>
            <form
              id="venda-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-6">
                <FormField
                  control={form.control}
                  name="nome_cliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-bold">Nome do Cliente</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-white border-gray-300"
                          placeholder="Ex: Carlos Mendes"
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
                      <FormLabel className="text-gray-700 font-bold">Telefone</FormLabel>
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
                      <FormLabel className="text-gray-700 font-bold">Email</FormLabel>
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
                  name="tipo_imovel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-bold">Tipo Imóvel</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-300 h-[48px]">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Apartamento">Apartamento</SelectItem>
                          <SelectItem value="Casa">Casa</SelectItem>
                          <SelectItem value="Terreno">Terreno</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bairros"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-gray-700 font-bold">Bairros</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-between bg-white border-gray-300 font-normal h-[48px]',
                                !field.value.length && 'text-muted-foreground',
                                form.formState.errors.bairros && 'border-red-500',
                              )}
                            >
                              {field.value.length
                                ? `${field.value.length} bairros selecionados`
                                : 'Selecione os bairros alvo...'}
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                              <CommandList className="max-h-[200px]">
                                <CommandGroup>
                                  {BAIRROS_OPCOES.map((b) => (
                                    <CommandItem
                                      key={b}
                                      onSelect={() =>
                                        field.onChange(
                                          field.value.includes(b)
                                            ? field.value.filter((v: string) => v !== b)
                                            : [...field.value, b],
                                        )
                                      }
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          field.value.includes(b) ? 'opacity-100' : 'opacity-0',
                                        )}
                                      />
                                      {b}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
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
                      <FormLabel className="text-gray-700 font-bold">Valor Mínimo (R$)</FormLabel>
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
                      <FormLabel className="text-gray-700 font-bold">Valor Máximo (R$)</FormLabel>
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
                      <FormLabel className="text-gray-700 font-bold">Dormitórios</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-white border-gray-300"
                          placeholder="Ex: 3"
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
                      <FormLabel className="text-gray-700 font-bold">Vagas</FormLabel>
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
                  name="nivel_urgencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-bold">Urgência</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-300 h-[48px]">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                  name="necessidades_especificas"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-gray-700 font-bold">
                        Necessidades Específicas
                      </FormLabel>
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
            </form>
          </Form>
        </div>

        <div
          className={cn(
            'p-4 border-t border-gray-100 bg-white shrink-0 z-20 flex gap-3',
            isMobile && isKeyboardOpen
              ? 'flex-row'
              : 'flex-col sm:flex-row sm:justify-between items-center',
          )}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className={cn(
              'text-gray-500 font-semibold hover:bg-gray-100',
              isMobile && isKeyboardOpen ? 'flex-1 px-4 order-1' : 'px-6 order-2 sm:order-1',
            )}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="venda-form"
            disabled={isSubmitting}
            className={cn(
              'bg-[#1A3A52] hover:bg-[#1A3A52]/90 text-white font-bold h-[48px]',
              isMobile && isKeyboardOpen ? 'flex-1 px-4 order-2' : 'px-8 order-1 sm:order-2',
            )}
          >
            <Check className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Salvando...' : isMobile && isKeyboardOpen ? 'Criar' : 'Criar Demanda'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
