import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'
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
    bairros: z
      .array(z.string())
      .min(1, 'Selecione pelo menos um bairro')
      .max(20, 'Máximo 20 bairros'),
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

export function ModalDemandaVenda({ isOpen, onClose }: Props) {
  const { toast } = useToast()
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
        .from('demandas_vendas')
        .insert({
          ...values,
          telefone: values.telefone || null,
          email: values.email || null,
          necessidades_especificas: values.necessidades_especificas || null,
          status_demanda: 'aberta',
          corretor_id: authData.user.id,
        })
        .select('*')
        .single()

      if (error) throw error

      window.dispatchEvent(new CustomEvent('demanda-created', { detail: { tipo: 'Venda', data } }))

      toast({
        title: `✅ Demanda de venda criada!`,
        className: 'bg-emerald-600 text-white border-emerald-600',
        duration: 3000,
      })

      sessionStorage.setItem(
        'etic_filters_my_demands_view_supabase_Venda',
        JSON.stringify({ status: 'Todos', urgencia: 'Todos', data: 'Todos', bairro: '' }),
      )
      sessionStorage.setItem(
        'etic_filters_my_demands_view_supabase_Aluguel',
        JSON.stringify({ status: 'Todos', urgencia: 'Todos', data: 'Todos', bairro: '' }),
      )
      window.dispatchEvent(new Event('filters-updated'))

      setTimeout(() => {
        form.reset()
        onClose()
        setIsSubmitting(false)
      }, 1000)
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
            ? '!fixed !left-0 !right-0 !top-0 !bottom-auto !translate-x-0 !translate-y-0 !w-full !max-w-none rounded-none'
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
                {isMobile && <div className="h-[80px] md:hidden w-full shrink-0 md:col-span-2" />}
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
