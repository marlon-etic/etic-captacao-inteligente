import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import useAppStore from '@/stores/useAppStore'
import { BAIRROS_ETIC } from '@/lib/bairros'
import { useToast } from '@/hooks/use-toast'

const indepSchema = z
  .object({
    tipoVinculacao: z.enum(['vinculado', 'solto'], { required_error: 'Selecione uma opção' }),
    demandId: z.string().optional(),
    neighborhood: z.string().min(1, 'Selecione um bairro'),
    neighborhoodOther: z.string().max(50, 'Máximo 50 caracteres').optional(),
    code: z.string().min(1, 'Obrigatório').max(20, 'Máximo 20 caracteres'),
    value: z.coerce.number().positive('O valor deve ser positivo'),
    docCompleta: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.tipoVinculacao === 'vinculado') {
        return !!data.demandId
      }
      return true
    },
    {
      message: 'Selecione uma demanda',
      path: ['demandId'],
    },
  )
  .refine(
    (data) => {
      if (data.neighborhood === 'OUTROS') {
        return data.neighborhoodOther && data.neighborhoodOther.trim().length > 0
      }
      return true
    },
    {
      message: 'Digite o bairro',
      path: ['neighborhoodOther'],
    },
  )

export function IndependentCaptureModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { submitIndependentCapture, submitDemandResponse, demands, currentUser } = useAppStore()
  const { toast } = useToast()

  const openDemands = demands.filter(
    (d) =>
      (d.status === 'Pendente' || d.status === 'Em Captação') &&
      (currentUser?.role === 'captador' ? d.assignedTo === currentUser.id : true),
  )

  const form = useForm({
    resolver: zodResolver(indepSchema),
    mode: 'onChange',
    defaultValues: {
      tipoVinculacao: undefined as any,
      demandId: '',
      neighborhood: '',
      neighborhoodOther: '',
      code: '',
      value: 0,
      docCompleta: false,
    },
  })

  const selectedNeighborhood = form.watch('neighborhood')
  const tipoVinculacao = form.watch('tipoVinculacao')

  const onSubmit = (data: any) => {
    const finalNeighborhood =
      data.neighborhood === 'OUTROS' ? data.neighborhoodOther.trim() : data.neighborhood
    const bairro_tipo = data.neighborhood === 'OUTROS' ? 'outro' : 'listado'

    if (data.tipoVinculacao === 'vinculado') {
      const res = submitDemandResponse(data.demandId, 'encontrei', {
        ...data,
        neighborhood: finalNeighborhood,
        bairro_tipo,
      })
      if (!res.success) {
        toast({ title: 'Erro', description: res.message, variant: 'destructive' })
        return
      }
    } else {
      submitIndependentCapture({
        ...data,
        neighborhood: finalNeighborhood,
        bairro_tipo,
      })
    }
    form.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Captação</DialogTitle>
          <DialogDescription>
            Registre um novo imóvel. Escolha se ele atende a um cliente específico ou se está solto
            para a base.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="tipoVinculacao"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Este imóvel é para:</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer data-[state=checked]:bg-indigo-50 data-[state=checked]:border-indigo-200">
                        <FormControl>
                          <RadioGroupItem value="vinculado" />
                        </FormControl>
                        <FormLabel className="font-medium cursor-pointer w-full flex items-center gap-2">
                          🔗 Uma demanda específica
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer data-[state=checked]:bg-blue-50 data-[state=checked]:border-blue-200">
                        <FormControl>
                          <RadioGroupItem value="solto" />
                        </FormControl>
                        <FormLabel className="font-medium cursor-pointer w-full flex items-center gap-2">
                          🔓 Qualquer cliente (Disponível para todos)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tipoVinculacao === 'vinculado' && (
              <FormField
                control={form.control}
                name="demandId"
                render={({ field }) => (
                  <FormItem className="animate-in fade-in slide-in-from-top-2">
                    <FormLabel>Demanda Associada</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a demanda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {openDemands.length === 0 ? (
                          <SelectItem value="none" disabled>
                            Nenhuma demanda ativa
                          </SelectItem>
                        ) : (
                          openDemands.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.clientName} - {d.location}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o bairro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Bairros da Étic</SelectLabel>
                          {BAIRROS_ETIC.map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectItem value="OUTROS" className="font-medium text-primary">
                          🔹 OUTROS (especifique abaixo)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: AP1023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedNeighborhood === 'OUTROS' && (
                <FormField
                  control={form.control}
                  name="neighborhoodOther"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <Input
                          placeholder="Digite o bairro onde o imóvel foi localizado"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Imóvel (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="docCompleta"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4 bg-muted/50">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">Documentação Completa?</FormLabel>
                    <p className="text-xs text-muted-foreground">Garante +20 pts de bônus</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Registrar Imóvel</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
