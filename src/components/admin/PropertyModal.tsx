import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
  property?: any | null
}

const formSchema = z.object({
  codigo_imovel: z.string().optional(),
  tipo: z.string().optional(),
  preco: z.coerce.number().optional(),
  localizacao_texto: z.string().optional(),
  dormitorios: z.coerce.number().optional(),
  vagas: z.coerce.number().optional(),
  observacoes: z.string().optional(),
  status_captacao: z.string().optional(),
})

export function PropertyModal({ isOpen, onClose, property }: Props) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo_imovel: '',
      tipo: 'Ambos',
      preco: 0,
      localizacao_texto: '',
      dormitorios: 0,
      vagas: 0,
      observacoes: '',
      status_captacao: 'pendente',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (property) {
        form.reset({
          codigo_imovel: property.codigo_imovel || '',
          tipo: property.tipo || 'Ambos',
          preco: property.preco || property.valor || 0,
          localizacao_texto: property.localizacao_texto || property.endereco || '',
          dormitorios: property.dormitorios || 0,
          vagas: property.vagas || 0,
          observacoes: property.observacoes || '',
          status_captacao: property.status_captacao || property.etapa_funil || 'pendente',
        })
      } else {
        form.reset({
          codigo_imovel: '',
          tipo: 'Ambos',
          preco: 0,
          localizacao_texto: '',
          dormitorios: 0,
          vagas: 0,
          observacoes: '',
          status_captacao: 'pendente',
        })
      }
    }
  }, [isOpen, property, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsProcessing(true)
    try {
      const dataToSave = {
        codigo_imovel: values.codigo_imovel,
        tipo: values.tipo,
        preco: values.preco,
        localizacao_texto: values.localizacao_texto,
        endereco: values.localizacao_texto,
        dormitorios: values.dormitorios,
        vagas: values.vagas,
        observacoes: values.observacoes,
        status_captacao: values.status_captacao,
        etapa_funil: values.status_captacao,
      }

      if (property) {
        const { error } = await supabase
          .from('imoveis_captados')
          .update(dataToSave)
          .eq('id', property.id)
        if (error) throw error
        toast({
          title: '✅ Imóvel atualizado com sucesso!',
          className: 'bg-emerald-600 text-white',
        })
      } else {
        const { error } = await supabase.from('imoveis_captados').insert(dataToSave)
        if (error) throw error
        toast({ title: '✅ Imóvel criado com sucesso!', className: 'bg-emerald-600 text-white' })
      }
      onClose()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao processar. Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-[#1A3A52]">
            {property ? 'Editar Imóvel' : 'Criar Novo Imóvel'}
          </DialogTitle>
        </DialogHeader>
        <div
          className={cn(
            'p-6 pt-2 overflow-y-auto max-h-[75vh]',
            isProcessing && 'pointer-events-none opacity-80',
          )}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="codigo_imovel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: AP123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ambos">Ambos</SelectItem>
                          <SelectItem value="Venda">Venda</SelectItem>
                          <SelectItem value="Aluguel">Aluguel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status_captacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="capturado">Capturado</SelectItem>
                          <SelectItem value="visitado">Visitado</SelectItem>
                          <SelectItem value="fechado">Fechado</SelectItem>
                          <SelectItem value="perdido">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="localizacao_texto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro / Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Centro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dormitorios"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dormitórios</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vagas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vagas</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Input placeholder="Notas extras..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto h-12"
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full sm:w-auto h-12 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold px-8 transition-all"
                >
                  {property ? '💾 Salvar Alterações' : '✅ Criar Imóvel'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
