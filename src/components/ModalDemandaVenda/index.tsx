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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Check, CheckSquare } from 'lucide-react'
import { insertDemandaVenda } from '@/services/demandas_vendas'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formSchema, FormValues, BAIRROS_LIST } from './schema'
import { useEffect } from 'react'

export function ModalDemandaVenda({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nivel_urgencia: 'Média', bairros: [] },
  })

  useEffect(() => {
    if (!isOpen) form.reset()
  }, [isOpen, form])

  const onSubmit = async (values: FormValues) => {
    try {
      await insertDemandaVenda({
        nome_cliente: values.nome_cliente,
        telefone: values.telefone || null,
        tipo_imovel: values.tipo_imovel,
        bairros: values.bairros,
        valor_minimo: values.valor_minimo ? Number(values.valor_minimo) : null,
        valor_maximo: values.valor_maximo ? Number(values.valor_maximo) : null,
        dormitorios: values.dormitorios ? Number(values.dormitorios) : null,
        vagas_estacionamento: values.vagas_estacionamento
          ? Number(values.vagas_estacionamento)
          : null,
        nivel_urgencia: values.nivel_urgencia,
        necessidades_especificas: values.necessidades_especificas || null,
      })
      toast({ title: 'Demanda criada com sucesso!', className: 'bg-emerald-600 text-white' })
      setTimeout(onClose, 2000)
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Falha ao registrar',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Nova Demanda de Venda</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome_cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-800">Nome do Cliente *</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white border-gray-300" />
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
                    <FormLabel className="text-gray-800">Telefone</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-white border-gray-300"
                        placeholder="(XX) 9XXXX-XXXX"
                        value={field.value || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '')
                          if (v.length > 11) v = v.substring(0, 11)
                          if (v.length > 2) v = `(${v.substring(0, 2)}) ${v.substring(2)}`
                          if (v.length > 10) v = `${v.substring(0, 10)}-${v.substring(10)}`
                          field.onChange(v)
                        }}
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
                    <FormLabel className="text-gray-800">Tipo de Imóvel *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-gray-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Casa">Casa</SelectItem>
                        <SelectItem value="Apartamento">Apartamento</SelectItem>
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
                  <FormItem>
                    <FormLabel className="text-gray-800">Bairros *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-between bg-white border-gray-300 font-normal',
                              !field.value?.length && 'text-muted-foreground',
                            )}
                          >
                            {field.value?.length > 0
                              ? `${field.value.length} selecionados`
                              : 'Selecione...'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 z-[9999]">
                        <div className="max-h-[200px] overflow-y-auto p-2 space-y-1">
                          {BAIRROS_LIST.map((b) => (
                            <div
                              key={b}
                              onClick={() => {
                                const cur = field.value || []
                                field.onChange(
                                  cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b],
                                )
                              }}
                              className="flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer text-sm rounded border border-transparent"
                            >
                              <div
                                className={cn(
                                  'h-4 w-4 border rounded flex items-center justify-center',
                                  field.value?.includes(b)
                                    ? 'bg-[#1A3A52] border-[#1A3A52]'
                                    : 'border-gray-400',
                                )}
                              >
                                {field.value?.includes(b) && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              {b}
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valor_minimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-800">Valor Mínimo (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ''}
                        className="bg-white border-gray-300"
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
                    <FormLabel className="text-gray-800">Valor Máximo (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ''}
                        className="bg-white border-gray-300"
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
                    <FormLabel className="text-gray-800">Dormitórios</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ''}
                        className="bg-white border-gray-300"
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
                    <FormLabel className="text-gray-800">Vagas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ''}
                        className="bg-white border-gray-300"
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
                    <FormLabel className="text-gray-800">Urgência *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-gray-300">
                          <SelectValue placeholder="Selecione" />
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
            </div>
            <FormField
              control={form.control}
              name="necessidades_especificas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-800">Necessidades Específicas</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      className="bg-white border-gray-300 min-h-[80px]"
                      maxLength={500}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between w-full pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} className="border-gray-300">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
              >
                <CheckSquare className="mr-2 h-4 w-4" /> Criar Demanda
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
