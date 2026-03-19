import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
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
    tipo_demanda: z.enum(['Venda', 'Aluguel']).default('Aluguel'),
    bairros: z.array(z.string()).min(1, 'Selecione pelo menos um bairro'),
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

export function ModalDemandaLocacao({ isOpen, onClose }: Props) {
  const { toast } = useToast()
  const { currentUser } = useAppStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        .from('demandas_locacao')
        .insert({
          ...values,
          telefone: values.telefone || null,
          email: values.email || null,
          observacoes: values.observacoes || null,
          status_demanda: 'aberta',
          sdr_id: currentUser?.id,
        })
        .select('id')
        .single()

      if (error) throw error

      toast({
        title: `✅ Demanda criada com sucesso! ID: ${data.id}`,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-[#F9FAFB] rounded-xl border-none">
        <DialogHeader className="p-6 pb-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <DialogTitle className="text-2xl font-bold text-[#1A3A52]">Nova Demanda</DialogTitle>
        </DialogHeader>
        <div className="p-6 bg-white">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
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
                  name="tipo_demanda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-bold">Tipo</FormLabel>
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
                      <FormLabel className="text-gray-700 font-bold">Vagas</FormLabel>
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
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-gray-700 font-bold">Observações</FormLabel>
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
              <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="text-gray-500 font-semibold px-6 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold h-[48px] px-8"
                >
                  <Check className="mr-2 h-5 w-5" />
                  {isSubmitting ? 'Salvando...' : 'Criar Demanda'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
