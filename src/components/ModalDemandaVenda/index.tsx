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
import { Check, CheckSquare, ChevronDown } from 'lucide-react'
import { insertDemandaVenda } from '@/services/demandas_vendas'
import { cn } from '@/lib/utils'
import { formSchema, FormValues, BAIRROS_LIST } from './schema'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useKeyboard } from '@/hooks/use-keyboard'
import { useIsMobile } from '@/hooks/use-mobile'

function BairrosDropdownVenda({ field }: { field: any }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full justify-between bg-white border-gray-300 font-normal min-h-[48px]',
          !field.value?.length && 'text-muted-foreground',
          open && 'border-[#1A3A52] ring-2 ring-[#1A3A52] ring-offset-0',
        )}
      >
        <span className="truncate">
          {field.value?.length > 0
            ? `${field.value.length} bairros selecionados`
            : 'Selecione os bairros...'}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
      </Button>

      {open && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] overflow-hidden flex flex-col">
          <div
            className="max-h-[250px] overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            onTouchMove={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            {BAIRROS_LIST.map((b) => {
              const isSelected = field.value?.includes(b)
              return (
                <div
                  key={b}
                  onClick={() => {
                    const cur = field.value || []
                    field.onChange(isSelected ? cur.filter((x: string) => x !== b) : [...cur, b])
                  }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 last:border-0 transition-colors',
                    isSelected ? 'bg-[#F5F8FA]' : 'hover:bg-gray-50',
                  )}
                >
                  <div
                    className={cn(
                      'h-5 w-5 border rounded flex items-center justify-center shrink-0 transition-colors',
                      isSelected ? 'bg-[#1A3A52] border-[#1A3A52]' : 'border-gray-300',
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span
                    className={cn(
                      'text-[14px]',
                      isSelected ? 'text-[#1A3A52] font-semibold' : 'text-gray-800',
                    )}
                  >
                    {b}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">
              {field.value?.length || 0} selecionados
            </span>
            <Button
              size="sm"
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
              }}
              className="bg-[#1A3A52] text-white hover:bg-[#1A3A52]/90"
            >
              Concluir
            </Button>
          </div>
        </div>
      )}
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
    <div className="mt-2 text-[12px] text-gray-600 bg-[#F5F5F5] p-2.5 rounded-[8px] border border-[#E0E0E0] animate-in fade-in slide-in-from-top-2 text-left font-normal shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="font-bold text-[#1A3A52] mb-1.5 uppercase tracking-wider text-[10px]">
        Resumo
      </div>
      <div className="flex gap-2 truncate items-center">
        <span className="font-medium shrink-0 text-[14px]">👤</span>{' '}
        <span className="truncate font-medium">{values.nome_cliente || '...'}</span>
      </div>
      <div className="flex gap-2 truncate items-center">
        <span className="font-medium shrink-0 text-[14px]">📍</span>{' '}
        <span className="truncate font-medium">
          {values.bairros?.length ? values.bairros.join(', ') : '...'}
        </span>
      </div>
      <div className="flex gap-2 truncate items-center">
        <span className="font-medium shrink-0 text-[14px]">💰</span>{' '}
        <span className="truncate font-medium">
          R$ {values.valor_minimo || 0} - R$ {values.valor_maximo || 0}
        </span>
      </div>
    </div>
  )
}

export function ModalDemandaVenda({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { isKeyboardOpen, viewportHeight, keyboardHeight } = useKeyboard()
  const isMobile = useIsMobile()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nivel_urgencia: 'Média', bairros: [] },
  })

  const values = useWatch({ control: form.control })
  const progress = useMemo(() => {
    let filled = 0
    const total = 6
    if (values.nome_cliente) filled++
    if (values.tipo_imovel) filled++
    if (values.bairros && values.bairros.length > 0) filled++
    if (values.valor_minimo || values.valor_maximo) filled++
    if (values.dormitorios) filled++
    if (values.nivel_urgencia) filled++
    return Math.round((filled / total) * 100)
  }, [values])

  useEffect(() => {
    if (!isOpen) form.reset()
  }, [isOpen, form])

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      const result = await insertDemandaVenda({
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

      console.log('[Diagnostic] Disparando evento demanda-created:', result)
      window.dispatchEvent(
        new CustomEvent('demanda-created', { detail: { tipo: 'Venda', data: result } }),
      )

      toast({ title: '✅ Demanda criada com sucesso!', className: 'bg-emerald-600 text-white' })
      form.reset()
      onClose()
      setIsSubmitting(false)
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Falha ao registrar',
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && !isSubmitting && onClose()}>
      <DialogContent
        className={cn(
          'sm:max-w-[700px] flex flex-col gap-0 p-0 overflow-hidden shadow-2xl z-[1010]',
          isMobile
            ? '!fixed !left-0 !right-0 !bottom-0 !top-auto !translate-x-0 !translate-y-0 !w-full !max-w-none rounded-t-xl rounded-b-none border-x-0 border-b-0'
            : 'max-h-[90vh]',
        )}
        style={{
          height: isMobile ? (viewportHeight ? `${viewportHeight}px` : '100dvh') : undefined,
          maxHeight: isMobile ? '100dvh' : undefined,
        }}
      >
        {progress > 0 && progress < 100 && (
          <div className="absolute top-0 left-0 w-full h-[4px] bg-[#E0E0E0] z-[1020]">
            <div
              className="h-full bg-[#10B981] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
            <span className="absolute top-[8px] right-[16px] text-[10px] font-bold text-[#10B981] bg-white px-2 py-0.5 rounded-full shadow-sm border border-[#E0E0E0]">
              {progress}% completo
            </span>
          </div>
        )}

        <DialogHeader className="p-4 md:p-6 border-b shrink-0 bg-white z-10 sticky top-0 text-left mt-[4px]">
          <DialogTitle className="text-xl font-bold text-[#1A3A52]">
            Nova Demanda de Venda
          </DialogTitle>
          <FormSummary control={form.control} isKeyboardOpen={isKeyboardOpen} isMobile={isMobile} />
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 relative bg-[#F9FAFB]">
          <Form {...form}>
            <form id="venda-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome_cliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 font-bold">Nome do Cliente *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white border-gray-300"
                          placeholder="Ex: João Silva"
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
                      <FormLabel className="text-gray-800 font-bold">Tipo de Imóvel *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-300 min-h-[48px]">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-[1050]">
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
                      <FormLabel className="text-gray-800 font-bold">Bairros *</FormLabel>
                      <FormControl>
                        <BairrosDropdownVenda field={field} />
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
                      <FormLabel className="text-gray-800 font-bold">Valor Máximo (R$)</FormLabel>
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
                      <FormLabel className="text-gray-800 font-bold">Dormitórios</FormLabel>
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
                      <FormLabel className="text-gray-800 font-bold">Vagas</FormLabel>
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
                      <FormLabel className="text-gray-800 font-bold">Urgência *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-300 min-h-[48px]">
                            <SelectValue placeholder="Selecione" />
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
              </div>
              <FormField
                control={form.control}
                name="necessidades_especificas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-800 font-bold">
                      Necessidades Específicas
                    </FormLabel>
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
              {/* Spacer for mobile to avoid the fixed footer covering last input */}
              {isMobile && <div className="h-[80px] md:hidden w-full shrink-0" />}
            </form>
          </Form>
        </div>

        <div
          className={cn(
            'bg-white border-t border-[#E0E0E0] p-3 md:p-4 flex gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-[1050]',
            isMobile ? 'fixed left-0 right-0' : 'shrink-0 flex-col md:flex-row md:justify-end',
            isMobile && isKeyboardOpen ? 'flex-row' : '',
          )}
          style={{
            bottom: isMobile ? `${keyboardHeight}px` : 'auto',
          }}
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
            form="venda-form"
            disabled={form.formState.isSubmitting}
            className={cn(
              'min-h-[44px] md:min-h-[48px] bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[16px] rounded-[8px] shadow-[0_4px_12px_rgba(16,185,129,0.3)]',
              isMobile && isKeyboardOpen
                ? 'flex-1 order-2'
                : 'min-w-[140px] order-1 sm:order-2 w-full sm:w-auto',
            )}
          >
            <CheckSquare className="mr-2 h-4 w-4" />{' '}
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
