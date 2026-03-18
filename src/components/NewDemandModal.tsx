import { useState, useEffect } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { LocationSelector } from '@/components/LocationSelector'
import { UrgencySelector } from '@/components/UrgencySelector'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { useNavigate } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'

const formSchema = z
  .object({
    clientName: z.string().min(3, 'Mínimo 3 caracteres'),
    clientPhone: z.string().min(8, 'Telefone inválido'),
    type: z.enum(['Venda', 'Aluguel']),
    location: z.array(z.string()).min(1, 'Selecione um bairro'),
    minBudget: z.coerce.number().positive('Maior que zero'),
    maxBudget: z.coerce.number().positive('Maior que zero'),
    bedrooms: z.coerce.number().min(0, 'Valor inválido'),
    parkingSpots: z.coerce.number().min(0, 'Valor inválido'),
    timeframe: z.string().min(1, 'Selecione a urgência'),
    clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  })
  .refine((data) => data.minBudget < data.maxBudget, {
    message: 'Mínimo deve ser menor que máximo',
    path: ['maxBudget'],
  })

export function NewDemandModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addDemand, currentUser } = useAppStore()
  const { toast } = useToast()
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: '',
      clientPhone: '',
      type: currentUser?.role === 'corretor' ? 'Venda' : 'Aluguel',
      location: [],
      minBudget: '' as any,
      maxBudget: '' as any,
      bedrooms: '' as any,
      parkingSpots: '' as any,
      timeframe: '',
      clientEmail: '',
    },
  })

  useEffect(() => {
    if (!isOpen) form.reset()
  }, [isOpen, form])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addDemand({
      clientName: values.clientName,
      phone: values.clientPhone,
      clientEmail: values.clientEmail || undefined,
      type: values.type,
      location: values.location.join(', '),
      minBudget: values.minBudget,
      maxBudget: values.maxBudget,
      budget: values.maxBudget,
      bedrooms: values.bedrooms,
      parkingSpots: values.parkingSpots,
      timeframe: values.timeframe,
      description: 'Nova demanda via modal rápido',
    })

    toast({
      title: '✅ Demanda cadastrada com sucesso!',
      className: 'bg-emerald-600 text-white border-emerald-600',
    })

    onClose()

    sessionStorage.setItem(
      'etic_filters_my_demands_view_all',
      JSON.stringify({ status: 'Ativos', prazo: 'Todos', bairro: '' }),
    )
    navigate('/app/demandas?tab=minhas-demandas')
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[95vh] flex flex-col transition-transform duration-300">
        <DrawerHeader className="border-b pb-4 shrink-0 text-left px-6">
          <DrawerTitle className="text-2xl font-bold text-[#1A3A52]">Nova Demanda</DrawerTitle>
          <DrawerDescription className="text-[14px]">
            SDR: Locação | Corretor: Venda
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <Form {...form}>
            <form
              id="new-demand-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 pb-[40px]"
            >
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-[#333333]">Nome do cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Maria Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[#333333]">Telefone</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Somente números" {...field} />
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
                      <FormLabel className="font-bold text-[#333333]">
                        Email do Cliente{' '}
                        <span className="text-[#999999] font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@exemplo.com"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-[#333333]">Tipo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2 bg-[#F5F5F5] px-4 py-2 rounded-[8px] border border-[#E5E5E5] h-[48px]">
                          <RadioGroupItem value="Venda" id="venda-modal" />
                          <Label
                            htmlFor="venda-modal"
                            className="font-bold cursor-pointer h-full flex items-center"
                          >
                            Venda
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-[#F5F5F5] px-4 py-2 rounded-[8px] border border-[#E5E5E5] h-[48px]">
                          <RadioGroupItem value="Aluguel" id="aluguel-modal" />
                          <Label
                            htmlFor="aluguel-modal"
                            className="font-bold cursor-pointer h-full flex items-center"
                          >
                            Aluguel
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-[#333333]">Bairro</FormLabel>
                    <FormControl>
                      <LocationSelector value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[#333333]">Valor mínimo (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 2000" {...field} />
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
                      <FormLabel className="font-bold text-[#333333]">Valor máximo (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 5000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[#333333]">Dormitórios</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 2" {...field} />
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
                      <FormLabel className="font-bold text-[#333333]">Vagas</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="timeframe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-[#333333]">Urgência</FormLabel>
                    <FormControl>
                      <UrgencySelector value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <div className="p-4 border-t border-[#E5E5E5] bg-white shrink-0 flex flex-col gap-2 pb-safe z-50">
          <Button
            type="submit"
            form="new-demand-form"
            className="w-full min-h-[48px] bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold text-[16px] shadow-[0_4px_12px_rgba(76,175,80,0.3)]"
          >
            ✅ Criar Demanda
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full min-h-[48px] text-[#999999] hover:text-[#333333] font-bold bg-transparent border-none"
          >
            Cancelar
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
