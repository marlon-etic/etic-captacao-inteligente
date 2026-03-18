import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useNavigate } from 'react-router-dom'
import { Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { LocationSelector } from '@/components/LocationSelector'
import { UrgencySelector } from '@/components/UrgencySelector'
import { CustomInput } from '@/components/CustomInput'
import { formSchema } from '@/components/NewDemandModal'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

export default function NovaDemanda() {
  const { addDemand } = useAppStore()
  const { toast } = useToast()
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      clientName: '',
      clientPhone: '',
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

  const { isSubmitting } = form.formState

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      addDemand({
        clientName: values.clientName,
        phone: values.clientPhone,
        clientEmail: values.clientEmail || undefined,
        location: values.location.join(', '),
        minBudget: values.minBudget,
        maxBudget: values.maxBudget,
        budget: values.maxBudget,
        bedrooms: values.bedrooms,
        parkingSpots: values.parkingSpots,
        description: values.description || 'Nova demanda via página dedicada',
        timeframe: values.timeframe,
        type: values.type,
      })

      toast({
        title: '✅ Demanda cadastrada com sucesso!',
        className: 'bg-emerald-600 text-white border-emerald-600',
        duration: 3000,
      })

      sessionStorage.setItem(
        'etic_filters_my_demands_view_all',
        JSON.stringify({ status: 'Ativos', prazo: 'Todos', bairro: '' }),
      )
      navigate('/app/demandas?tab=minhas-demandas')
    } catch (error) {
      toast({
        title: 'Erro ao salvar. Tente novamente.',
        variant: 'destructive',
      })
    }
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
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <CustomInput
                  control={form.control}
                  name="clientName"
                  label="Nome do Cliente"
                  placeholder="Ex: Maria Silva"
                  className="md:col-span-2"
                />
                <CustomInput
                  control={form.control}
                  name="clientPhone"
                  label="Telefone do Cliente"
                  placeholder="(11) 99999-9999 (opcional)"
                  optional
                />
                <CustomInput
                  control={form.control}
                  name="clientEmail"
                  label="Email do Cliente"
                  placeholder="email@exemplo.com (opcional)"
                  type="email"
                  optional
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="flex items-center h-[20px] mb-[4px] text-[14px] text-[#333333] font-semibold">
                        Tipo
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4 h-[48px]"
                        >
                          <div
                            className={cn(
                              'flex-1 flex items-center space-x-2 bg-[#F5F5F5] px-4 rounded-[8px] border',
                              fieldState.error ? 'border-[#FF4444] border-2' : 'border-[#E0E0E0]',
                            )}
                          >
                            <RadioGroupItem value="Venda" id="venda-page" />
                            <Label
                              htmlFor="venda-page"
                              className="font-semibold text-[16px] cursor-pointer flex-1 py-3"
                            >
                              Venda
                            </Label>
                          </div>
                          <div
                            className={cn(
                              'flex-1 flex items-center space-x-2 bg-[#F5F5F5] px-4 rounded-[8px] border',
                              fieldState.error ? 'border-[#FF4444] border-2' : 'border-[#E0E0E0]',
                            )}
                          >
                            <RadioGroupItem value="Aluguel" id="aluguel-page" />
                            <Label
                              htmlFor="aluguel-page"
                              className="font-semibold text-[16px] cursor-pointer flex-1 py-3"
                            >
                              Aluguel
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="min-h-[16px] mt-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="flex items-center h-[20px] mb-[4px] text-[14px] text-[#333333] font-semibold">
                        Bairro
                      </FormLabel>
                      <FormControl>
                        <LocationSelector
                          value={field.value}
                          onChange={field.onChange}
                          error={!!fieldState.error}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[16px] mt-1" />
                    </FormItem>
                  )}
                />

                <CustomInput
                  control={form.control}
                  name="minBudget"
                  label="Valor Mínimo (R$)"
                  type="number"
                  placeholder="Ex: 2000"
                />
                <CustomInput
                  control={form.control}
                  name="maxBudget"
                  label="Valor Máximo (R$)"
                  type="number"
                  placeholder="Ex: 5000"
                />
                <CustomInput
                  control={form.control}
                  name="bedrooms"
                  label="Dormitórios"
                  type="number"
                  placeholder="Ex: 2"
                />
                <CustomInput
                  control={form.control}
                  name="parkingSpots"
                  label="Vagas"
                  type="number"
                  placeholder="Ex: 1"
                />

                <FormField
                  control={form.control}
                  name="timeframe"
                  render={({ field, fieldState }) => (
                    <FormItem className="space-y-0 md:col-span-2">
                      <FormLabel className="flex items-center h-[20px] mb-[4px] text-[14px] text-[#333333] font-semibold">
                        Urgência
                      </FormLabel>
                      <FormControl>
                        <UrgencySelector
                          value={field.value}
                          onChange={field.onChange}
                          error={!!fieldState.error}
                        />
                      </FormControl>
                      <FormMessage className="min-h-[16px] mt-1" />
                    </FormItem>
                  )}
                />

                <CustomInput
                  control={form.control}
                  name="description"
                  label="Observações"
                  placeholder="Detalhes adicionais da demanda..."
                  className="md:col-span-2"
                  multiline
                />
              </div>

              <div className="flex flex-col md:flex-row md:justify-end gap-3 mt-6 pt-6 border-t border-[#E0E0E0]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="w-full md:w-auto min-h-[44px] md:min-h-[48px] text-[#666666] hover:text-[#333333] hover:bg-transparent font-bold text-[16px] rounded-[8px] order-2 md:order-1 border border-[#E0E0E0] md:border-transparent"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-[160px] min-h-[48px] bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold text-[16px] rounded-[8px] order-1 md:order-2"
                >
                  <Tag className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'Salvando...' : 'Criar Demanda'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
