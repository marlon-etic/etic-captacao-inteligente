import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Demand, CapturedProperty } from '@/types'

const visitaSchema = z.object({
  date: z
    .string()
    .min(1, 'Obrigatório')
    .refine((val) => {
      const d = new Date(val + 'T00:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return d >= today
    }, 'A data não pode estar no passado'),
  time: z.string().min(1, 'Obrigatório'),
  obs: z.string().optional(),
})

const propostaSchema = z.object({
  date: z.string().min(1, 'Obrigatório'),
  value: z.coerce.number().positive('Valor deve ser um número positivo'),
  obs: z.string().optional(),
})

const negocioSchema = z.object({
  date: z
    .string()
    .min(1, 'Obrigatório')
    .refine((val) => {
      const d = new Date(val + 'T00:00:00')
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      return d <= today
    }, 'A data não pode estar no futuro'),
  value: z.coerce.number().positive('Valor deve ser um número positivo'),
  type: z.enum(['Venda', 'Aluguel'], { required_error: 'Selecione o tipo (Venda ou Aluguel)' }),
  obs: z.string().optional(),
})

const lostSchema = z.object({
  reason: z.string().min(1, 'Selecione um motivo'),
  obs: z.string().optional(),
})

const LOST_REASONS = [
  'Cliente não gostou',
  'Fora do orçamento',
  'Já alugado/vendido',
  'Proprietário não atende',
  'Outro',
]

export function CapturedPropertyModals({
  demand,
  property,
  actionType,
  onClose,
  onSubmitVisita,
  onSubmitProposta,
  onSubmitNegocio,
  onSubmitLost,
}: {
  demand: Demand | null
  property: CapturedProperty | null
  actionType: 'visita' | 'proposta' | 'negocio' | 'lost' | 'details' | null
  onClose: () => void
  onSubmitVisita: (data: any) => void
  onSubmitProposta: (data: any) => void
  onSubmitNegocio: (data: any) => void
  onSubmitLost?: (data: any) => void
}) {
  const isVisita = actionType === 'visita'
  const isProposta = actionType === 'proposta'
  const isNegocio = actionType === 'negocio'
  const isLost = actionType === 'lost'
  const isDetails = actionType === 'details'
  const isOpen = !!demand && !!property && !!actionType

  const formVisita = useForm({
    resolver: zodResolver(visitaSchema),
    defaultValues: { date: '', time: '', obs: '' },
  })

  const formProposta = useForm({
    resolver: zodResolver(propostaSchema),
    defaultValues: { date: '', value: 0, obs: '' },
  })

  const formNegocio = useForm({
    resolver: zodResolver(negocioSchema),
    defaultValues: { date: '', value: 0, type: undefined as any, obs: '' },
  })

  const formLost = useForm({
    resolver: zodResolver(lostSchema),
    defaultValues: { reason: '', obs: '' },
  })

  useEffect(() => {
    if (demand && property) {
      if (isNegocio) {
        formNegocio.reset({
          date: '',
          value: property.value || demand.budget || 0,
          type: demand.type,
          obs: '',
        })
      }
      if (isProposta) {
        formProposta.reset({
          date: new Date().toISOString().split('T')[0],
          value: property.value || demand.budget || demand.maxBudget || 0,
          obs: '',
        })
      }
    }
  }, [demand, property, isNegocio, isProposta, formNegocio, formProposta])

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isVisita && 'Agendar Visita'}
            {isProposta && 'Registrar Proposta'}
            {isNegocio && 'Registrar Negócio Fechado'}
            {isLost && 'Dispensar Imóvel'}
            {isDetails && 'Detalhes do Imóvel'}
          </DialogTitle>
          {demand && property && !isDetails && (
            <DialogDescription>
              Cliente: <strong>{demand.clientName}</strong> • Cód: {property.code}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-2">
          {isVisita && (
            <Form {...formVisita}>
              <form
                onSubmit={formVisita.handleSubmit((d) => {
                  onSubmitVisita(d)
                  formVisita.reset()
                })}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={formVisita.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formVisita.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={formVisita.control}
                  name="obs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit">✅ Confirmar Visita</Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {isProposta && (
            <Form {...formProposta}>
              <form
                onSubmit={formProposta.handleSubmit((d) => {
                  onSubmitProposta(d)
                  formProposta.reset()
                })}
                className="space-y-4"
              >
                <FormField
                  control={formProposta.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Proposta</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formProposta.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Proposto (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formProposta.control}
                  name="obs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detalhes da Proposta</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descreva as condições da proposta..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                    Registrar Proposta
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {isNegocio && (
            <Form {...formNegocio}>
              <form
                onSubmit={formNegocio.handleSubmit((d) => {
                  onSubmitNegocio(d)
                  formNegocio.reset()
                })}
                className="space-y-4"
              >
                <FormField
                  control={formNegocio.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fechamento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formNegocio.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Negócio (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formNegocio.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo do Negócio</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Venda" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">Venda</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Aluguel" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">Aluguel</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formNegocio.control}
                  name="obs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    ✅ Confirmar Negócio
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {isLost && onSubmitLost && (
            <Form {...formLost}>
              <form
                onSubmit={formLost.handleSubmit((d) => {
                  onSubmitLost(d)
                  formLost.reset()
                })}
                className="space-y-4"
              >
                <FormField
                  control={formLost.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo da Dispensa</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o motivo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LOST_REASONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formLost.control}
                  name="obs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="destructive">
                    Confirmar Dispensa
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {isDetails && demand && property && (
            <div className="space-y-4 text-sm mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-xs">Imóvel</p>
                  <p className="font-medium">{property.code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Captador</p>
                  <p className="font-medium">{property.captador_name || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Valor</p>
                  <p className="font-medium">R$ {property.value?.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Data de Captação</p>
                  <p className="font-medium">
                    {new Date(property.capturedAt || '').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Tipo</p>
                  <p className="font-medium">{property.propertyType || demand.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Perfil</p>
                  <p className="font-medium">
                    {property.bedrooms || 0} dorm, {property.bathrooms || 0} banh,{' '}
                    {property.parkingSpots || 0} vagas
                  </p>
                </div>
              </div>

              {property.visitaDate && (
                <div className="bg-orange-50 p-3 rounded-md border border-orange-100">
                  <p className="font-bold text-xs text-orange-800 mb-1 flex items-center gap-1">
                    <span>🟠</span> Visita Agendada
                  </p>
                  <p className="text-orange-900">
                    Data: {new Date(property.visitaDate + 'T00:00:00').toLocaleDateString('pt-BR')}{' '}
                    às {property.visitaTime}
                  </p>
                  {property.visitaObs && (
                    <p className="mt-1 text-orange-800/80 italic text-xs">"{property.visitaObs}"</p>
                  )}
                </div>
              )}

              {property.fechamentoDate && (
                <div className="bg-emerald-50 p-3 rounded-md border border-emerald-100">
                  <p className="font-bold text-xs text-emerald-800 mb-1 flex items-center gap-1">
                    <span>🟢</span> Negócio Fechado ({property.fechamentoType})
                  </p>
                  <p className="text-emerald-900">
                    Data:{' '}
                    {new Date(property.fechamentoDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-emerald-900">
                    Valor: R$ {property.fechamentoValue?.toLocaleString('pt-BR')}
                  </p>
                  {property.fechamentoObs && (
                    <p className="mt-1 text-emerald-800/80 italic text-xs">
                      "{property.fechamentoObs}"
                    </p>
                  )}
                </div>
              )}

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={onClose}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
