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
import { Demand } from '@/types'

const visitaSchema = z.object({
  date: z
    .string()
    .min(1, 'Obrigatório')
    .refine((val) => {
      const d = new Date(val + 'T00:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return d >= today
    }, 'Data não pode ser no passado'),
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
    }, 'Data não pode ser no futuro'),
  value: z.coerce.number().positive('Valor deve ser um número positivo'),
  type: z.enum(['Venda', 'Aluguel'], { required_error: 'Selecione o tipo (Venda ou Aluguel)' }),
  obs: z.string().optional(),
})

export function CapturedPropertyModals({
  demand,
  actionType,
  onClose,
  onSubmitVisita,
  onSubmitProposta,
  onSubmitNegocio,
}: {
  demand: Demand | null
  actionType: 'visita' | 'proposta' | 'negocio' | null
  onClose: () => void
  onSubmitVisita: (data: any) => void
  onSubmitProposta: (data: any) => void
  onSubmitNegocio: (data: any) => void
}) {
  const isVisita = actionType === 'visita'
  const isProposta = actionType === 'proposta'
  const isNegocio = actionType === 'negocio'
  const isOpen = !!demand && !!actionType

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

  useEffect(() => {
    if (demand) {
      if (isNegocio) {
        formNegocio.reset({
          date: '',
          value: demand.capturedProperty?.value || 0,
          type: demand.type,
          obs: '',
        })
      }
      if (isProposta) {
        formProposta.reset({
          date: new Date().toISOString().split('T')[0],
          value: demand.capturedProperty?.value || demand.budget || demand.maxBudget || 0,
          obs: '',
        })
      }
    }
  }, [demand, isNegocio, isProposta, formNegocio, formProposta])

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isVisita && 'Agendar Visita'}
            {isProposta && 'Registrar Proposta'}
            {isNegocio && 'Registrar Negócio Fechado'}
          </DialogTitle>
          {demand && (
            <DialogDescription>
              Cliente: <strong>{demand.clientName}</strong> • Cód: {demand.capturedProperty?.code}
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
                  <Button type="submit">Agendar Visita</Button>
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
                    Confirmar Negócio
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
