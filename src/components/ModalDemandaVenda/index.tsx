import { useForm, useWatch } from 'react-hook-form'
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
import { useKeyboard } from '@/hooks/use-keyboard'
import { useIsMobile } from '@/hooks/use-mobile'

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
    <div className="mt-3 text-[12px] text-gray-600 bg-gray-50 p-2 rounded-md border border-gray-100 animate-in fade-in slide-in-from-top-2 text-left font-normal">
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

export function ModalDemandaVenda({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast()

  const { isKeyboardOpen, viewportHeight } = useKeyboard()
  const isMobile = useIsMobile()

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
      <DialogContent
        className={cn(
          'sm:max-w-[700px] flex flex-col gap-0 p-0 overflow-hidden',
          isMobile
            ? '!fixed !left-0 !right-0 !bottom-0 !top-auto !translate-x-0 !translate-y-0 !w-full !max-w-none rounded-t-xl rounded-b-none border-x-0 border-b-0'
            : 'max-h-[90vh]',
        )}
        style={{
          height: isMobile ? (viewportHeight ? `${viewportHeight}px` : '100dvh') : undefined,
          maxHeight: isMobile ? '100dvh' : undefined,
        }}
      >
        <DialogHeader className="p-4 md:p-6 border-b shrink-0 bg-white z-10 sticky top-0 text-left">
          <DialogTitle className="text-xl font-bold">Nova Demanda de Venda</DialogTitle>
          <FormSummary control={form.control} isKeyboardOpen={isKeyboardOpen} isMobile={isMobile} />
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 relative bg-white">
          <Form {...form}>
            <form id="venda-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            </form>
          </Form>
        </div>

        <div
          className={cn(
            'p-4 border-t bg-white shrink-0 z-20 flex gap-3',
            isMobile && isKeyboardOpen ? 'flex-row' : 'flex-col sm:flex-row sm:justify-end',
          )}
        >
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={cn(
              'border-gray-300',
              isMobile && isKeyboardOpen ? 'flex-1 order-1' : 'order-2 sm:order-1',
            )}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="venda-form"
            disabled={form.formState.isSubmitting}
            className={cn(
              'bg-emerald-600 hover:bg-emerald-700 text-white',
              isMobile && isKeyboardOpen ? 'flex-1 order-2' : 'min-w-[140px] order-1 sm:order-2',
            )}
          >
            <CheckSquare className="mr-2 h-4 w-4" />{' '}
            {isMobile && isKeyboardOpen ? 'Criar' : 'Criar Demanda'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
