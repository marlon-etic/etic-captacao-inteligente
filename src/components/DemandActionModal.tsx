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
import { Textarea } from '@/components/ui/textarea'
import { Demand } from '@/types'
import { BAIRROS_ETIC } from '@/lib/bairros'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'

const encontreiSchema = z
  .object({
    value: z.coerce.number().positive('O valor deve ser um número positivo'),
    neighborhood: z.string().min(1, 'Este bairro não está na lista de atuação da Étic Imóveis'),
    neighborhoodOther: z.string().max(50, 'Máximo 50 caracteres').optional(),
    code: z
      .string()
      .min(1, 'Obrigatório')
      .max(20, 'Máximo 20 caracteres')
      .regex(/^[a-zA-Z0-9-]+$/, 'Apenas letras, números e hifens'),
    docCompleta: z.boolean().default(false),
    obs: z.string().optional(),
  })
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

const naoEncontreiSchema = z.object({
  reason: z.string().min(1, 'Selecione um motivo'),
  continueSearch: z.boolean().default(true),
})

const REASONS = [
  'Valor incompatível',
  'Não há imóveis no perfil',
  'Proprietário não aceitou',
  'Perdido',
  'Outro',
]

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

function EncontreiForm({
  onSubmit,
  onClose,
  demandId,
}: {
  onSubmit: (data: any) => void
  onClose: () => void
  demandId: string
}) {
  const { submitDemandResponse } = useAppStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(encontreiSchema),
    mode: 'onChange',
    defaultValues: {
      value: 0,
      neighborhood: '',
      neighborhoodOther: '',
      code: '',
      docCompleta: false,
      obs: '',
    },
  })

  const selectedNeighborhood = form.watch('neighborhood')

  const handleFormSubmit = async (data: any) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 50))

    const finalNeighborhood =
      data.neighborhood === 'OUTROS' ? data.neighborhoodOther.trim() : data.neighborhood
    const bairro_tipo = data.neighborhood === 'OUTROS' ? 'outro' : 'listado'

    const payload = {
      ...data,
      neighborhood: finalNeighborhood,
      bairro_tipo,
    }

    const res = submitDemandResponse(demandId, 'encontrei', payload)
    setIsLoading(false)
    if (!res.success) {
      toast({ title: 'Atenção', description: res.message, variant: 'destructive' })
      return
    }

    onSubmit(payload)
    onClose()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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
                <FormLabel>Código do Imóvel</FormLabel>
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
          name="docCompleta"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-emerald-50/50 border-emerald-100">
              <div className="space-y-0.5">
                <FormLabel className="text-sm font-medium text-emerald-900">
                  Documentação Completa?
                </FormLabel>
                <p className="text-xs text-emerald-700">+20 Pontos de bônus</p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="obs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea className="resize-none h-20" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </span>
            ) : (
              'Registrar Imóvel'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function NaoEncontreiForm({
  onSubmit,
  onClose,
  demandId,
}: {
  onSubmit: (data: any) => void
  onClose: () => void
  demandId: string
}) {
  const { submitDemandResponse } = useAppStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(naoEncontreiSchema),
    defaultValues: { reason: '', continueSearch: true },
  })

  const handleFormSubmit = async (data: any) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 50))

    const res = submitDemandResponse(demandId, 'nao_encontrei', data)
    setIsLoading(false)
    if (!res.success) {
      toast({ title: 'Atenção', description: res.message, variant: 'destructive' })
      return
    }

    onSubmit(data)
    onClose()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {REASONS.map((r) => (
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
          control={form.control}
          name="continueSearch"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm mt-4 bg-orange-50/30 border-orange-100">
              <div className="space-y-0.5">
                <FormLabel className="text-base font-semibold text-orange-900">
                  Continuar buscando por mais 48h?
                </FormLabel>
                <p className="text-sm text-orange-800/80">
                  Manter a demanda no seu painel para continuar a busca
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="destructive" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirmando...
              </span>
            ) : (
              'Confirmar'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

interface DemandActionModalProps {
  demand: Demand | null
  actionType: 'encontrei' | 'nao_encontrei' | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: any) => void
}

export function DemandActionModal({
  demand,
  actionType,
  isOpen,
  onClose,
  onConfirm,
}: DemandActionModalProps) {
  if (!demand || !actionType) return null

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {actionType === 'encontrei' ? 'Registrar Captação' : 'Não Encontrei Imóvel'}
          </DialogTitle>
          <DialogDescription>
            <strong>{demand.clientName}</strong> • {demand.location} • Orçamento: até R${' '}
            {demand.maxBudget.toLocaleString('pt-BR')}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          {actionType === 'encontrei' ? (
            <EncontreiForm onSubmit={onConfirm} onClose={onClose} demandId={demand.id} />
          ) : (
            <NaoEncontreiForm onSubmit={onConfirm} onClose={onClose} demandId={demand.id} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
