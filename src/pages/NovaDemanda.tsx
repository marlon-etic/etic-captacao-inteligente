import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DollarSign, User, Tag, Mail, AlignLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { LocationSelector } from '@/components/LocationSelector'
import { UrgencySelector } from '@/components/UrgencySelector'

const formSchema = z
  .object({
    clientName: z
      .string()
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(100, 'Nome no máximo de 100 caracteres'),
    clientEmail: z.string().email('Insira um e-mail válido'),
    location: z.array(z.string()).min(1, 'Selecione pelo menos um bairro'),
    minBudget: z.coerce
      .number({ invalid_type_error: 'Informe um valor' })
      .positive('Valor deve ser um número positivo'),
    maxBudget: z.coerce
      .number({ invalid_type_error: 'Informe um valor' })
      .positive('Valor deve ser um número positivo'),
    bedrooms: z.coerce
      .number({ invalid_type_error: 'Informe um valor' })
      .int()
      .min(0, 'Valor deve ser um número positivo'),
    parkingSpots: z.coerce
      .number({ invalid_type_error: 'Informe um valor' })
      .int()
      .min(0, 'Valor deve ser um número positivo'),
    description: z
      .string()
      .min(10, 'Descrição deve ter no mínimo 10 caracteres')
      .max(500, 'Descrição no máximo 500 caracteres'),
    timeframe: z.string().min(1, 'Selecione um prazo de aquisição'),
    type: z.enum(['Venda', 'Aluguel'], { required_error: 'Selecione um tipo' }),
  })
  .refine((data) => data.minBudget < data.maxBudget, {
    message: 'O orçamento máximo deve ser maior que o mínimo',
    path: ['maxBudget'],
  })

export default function NovaDemanda() {
  const { addDemand } = useAppStore()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      clientName: '',
      clientEmail: '',
      location: [],
      minBudget: '' as unknown as number,
      maxBudget: '' as unknown as number,
      bedrooms: '' as unknown as number,
      parkingSpots: '' as unknown as number,
      description: '',
      timeframe: '',
      type: 'Venda',
    },
  })

  const { isValid, isSubmitting } = form.formState

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    addDemand({
      clientName: values.clientName,
      clientEmail: values.clientEmail,
      location: values.location.join(', '),
      minBudget: values.minBudget,
      maxBudget: values.maxBudget,
      bedrooms: values.bedrooms,
      parkingSpots: values.parkingSpots,
      description: values.description,
      timeframe: values.timeframe,
      type: values.type,
      budget: values.maxBudget,
    })

    toast({
      title: 'Demanda registrada!',
      description: 'Os captadores foram notificados.',
      variant: 'default',
    })

    form.reset({
      clientName: '',
      clientEmail: '',
      location: [],
      minBudget: '' as unknown as number,
      maxBudget: '' as unknown as number,
      bedrooms: '' as unknown as number,
      parkingSpots: '' as unknown as number,
      description: '',
      timeframe: '',
      type: 'Venda',
    })
  }

  return (
    <div className="max-w-4xl mx-auto pb-8 px-4 sm:px-0">
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader className="bg-primary/5 border-b rounded-t-xl">
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Tag className="w-6 h-6" /> Nova Demanda
          </CardTitle>
          <CardDescription className="text-base">
            Cadastre rapidamente as necessidades do seu cliente para acionar os captadores.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cliente</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="Ex: João da Silva" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail do Cliente</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            className="pl-9"
                            placeholder="joao@exemplo.com"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairros de Interesse</FormLabel>
                      <FormControl>
                        <LocationSelector value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Negócio</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-wrap gap-4 pt-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 bg-muted/50 px-4 py-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors">
                            <FormControl>
                              <RadioGroupItem value="Venda" />
                            </FormControl>
                            <FormLabel className="font-medium cursor-pointer">Venda</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 bg-muted/50 px-4 py-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors">
                            <FormControl>
                              <RadioGroupItem value="Aluguel" />
                            </FormControl>
                            <FormLabel className="font-medium cursor-pointer">
                              Locação (Aluguel)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="timeframe"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Prazo de Aquisição (Prioridade)</FormLabel>
                      <FormControl>
                        <UrgencySelector value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="minBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orçamento Mínimo (R$)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            className="pl-9"
                            placeholder="Ex: 500000"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orçamento Máximo (R$)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            className="pl-9"
                            placeholder="Ex: 800000"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dormitórios</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parkingSpots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vagas de Garagem</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Necessidades do Imóvel / Descrição</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          className="pl-9 min-h-[100px] resize-y"
                          placeholder="Ex: Apartamento com 3 quartos, próximo ao metrô, com varanda gourmet..."
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>{field.value?.length || 0}/500 caracteres</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full text-lg h-14 mt-4 transition-all duration-300"
                disabled={!isValid || isSubmitting}
              >
                <Tag className="w-5 h-5 mr-2" />
                {isSubmitting ? 'Registrando...' : 'Disparar Demanda'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
