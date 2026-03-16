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
import { PropertyTimeline } from '@/components/PropertyTimeline'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'

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

const editSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  value: z.coerce.number().positive('O valor deve ser maior que zero'),
  bedrooms: z.coerce.number().min(0, 'Inválido'),
  bathrooms: z.coerce.number().min(0, 'Inválido'),
  parkingSpots: z.coerce.number().min(0, 'Inválido'),
  obs: z.string().optional(),
})

const LOST_REASONS = [
  'Cliente não gostou',
  'Fora do orçamento',
  'Já alugado/vendido',
  'Proprietário não atende',
  'Outro',
]

const BAIRROS = [
  'Mooca',
  'Tatuapé',
  'Carrão',
  'Vila Prudente',
  'Ipiranga',
  'Vila Ema',
  'Jardins',
  'Pinheiros',
  'Centro',
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
  actionType: 'visita' | 'proposta' | 'negocio' | 'lost' | 'details' | 'edit' | null
  onClose: () => void
  onSubmitVisita: (data: any) => void
  onSubmitProposta: (data: any) => void
  onSubmitNegocio: (data: any) => void
  onSubmitLost?: (data: any) => void
}) {
  const { updatePropertyDetails } = useAppStore()
  const { toast } = useToast()

  const isVisita = actionType === 'visita'
  const isProposta = actionType === 'proposta'
  const isNegocio = actionType === 'negocio'
  const isLost = actionType === 'lost'
  const isDetails = actionType === 'details'
  const isEdit = actionType === 'edit'
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

  const formEdit = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      code: '',
      neighborhood: '',
      value: 0,
      bedrooms: 0,
      bathrooms: 0,
      parkingSpots: 0,
      obs: '',
    },
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
      if (isEdit) {
        formEdit.reset({
          code: property.code || '',
          neighborhood: property.neighborhood || '',
          value: property.value || 0,
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          parkingSpots: property.parkingSpots || 0,
          obs: property.obs || '',
        })
      }
    }
  }, [demand, property, isNegocio, isProposta, isEdit, formNegocio, formProposta, formEdit])

  const handleEditSubmit = (data: z.infer<typeof editSchema>) => {
    try {
      updatePropertyDetails(demand!.id, property!.code, data)
      toast({
        title: 'Sucesso',
        description: 'Imóvel atualizado com sucesso.',
        className: 'bg-[#4CAF50] text-white border-none',
      })
      onClose()
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar. Tente novamente',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-bold text-[#1A3A52]">
            {isVisita && 'Agendar Visita'}
            {isProposta && 'Registrar Proposta'}
            {isNegocio && 'Registrar Negócio Fechado'}
            {isLost && 'Dispensar Imóvel'}
            {isDetails && 'Detalhes do Imóvel'}
            {isEdit && `Editar Imóvel ${property?.code}`}
          </DialogTitle>
          {demand && property && !isDetails && !isEdit && (
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

          {isEdit && (
            <Form {...formEdit}>
              <form onSubmit={formEdit.handleSubmit(handleEditSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={formEdit.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[12px] text-gray-500">
                          Código do Imóvel
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formEdit.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[12px] text-gray-500">Localização</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o bairro" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BAIRROS.map((r) => (
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
                </div>

                <FormField
                  control={formEdit.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[12px] text-gray-500">Valor (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          className="text-[#1A3A52] font-bold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={formEdit.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[12px] text-gray-500">Dorms</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formEdit.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[12px] text-gray-500">Banheiros</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formEdit.control}
                    name="parkingSpots"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[12px] text-gray-500">Vagas</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={formEdit.control}
                  name="obs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[12px] text-gray-500">Observações</FormLabel>
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
                  <Button type="submit" className="bg-[#1A3A52] text-white hover:bg-[#1A3A52]/90">
                    Salvar
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
                  <Button type="submit" className="bg-[#4CAF50] hover:bg-[#388E3C] text-white">
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
              <div className="grid grid-cols-2 gap-4 bg-[#F5F5F5] p-4 rounded-[8px]">
                <div>
                  <p className="text-[#999999] text-[12px]">Imóvel</p>
                  <p className="font-bold text-[#1A3A52]">{property.code}</p>
                </div>
                <div>
                  <p className="text-[#999999] text-[12px]">Captador</p>
                  <p className="font-bold text-[#1A3A52]">
                    {property.captador_name || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-[#999999] text-[12px]">Valor</p>
                  <p className="font-bold text-[#1A3A52]">
                    R$ {property.value?.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-[#999999] text-[12px]">Data de Captação</p>
                  <p className="font-bold text-[#1A3A52]">
                    {new Date(property.capturedAt || '').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-[#999999] text-[12px]">Tipo</p>
                  <p className="font-bold text-[#1A3A52]">{property.propertyType || demand.type}</p>
                </div>
                <div>
                  <p className="text-[#999999] text-[12px]">Perfil</p>
                  <p className="font-bold text-[#1A3A52]">
                    {property.bedrooms || 0} dorm, {property.bathrooms || 0} banh,{' '}
                    {property.parkingSpots || 0} vagas
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-[14px] font-bold text-[#1A3A52] mb-3">
                  Histórico de Alterações
                </h4>
                <PropertyTimeline history={property.history || []} />
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto border-[#2E5F8A] text-[#1A3A52]"
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
