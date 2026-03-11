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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Demand } from '@/types'

const encontreiSchema = z.object({
  value: z.coerce.number().positive('O valor deve ser um número positivo'),
  neighborhood: z.string().min(1, 'Selecione um bairro'),
  code: z
    .string()
    .min(1, 'Obrigatório')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9]+$/, 'Apenas letras e números'),
  docCompleta: z.boolean().default(false),
  obs: z.string().optional(),
})

const naoEncontreiSchema = z.object({
  reason: z.string().min(1, 'Selecione um motivo'),
  continueSearch: z.boolean().default(true),
})

const NEIGHBORHOODS = ['Jardins', 'Pinheiros', 'Moema', 'Vila Olímpia', 'Itaim Bibi', 'Centro']
const REASONS = [
  'Valor incompatível',
  'Não há imóveis no perfil',
  'Proprietário não aceitou',
  'Outro',
]

function EncontreiForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: any) => void
  onClose: () => void
}) {
  const form = useForm({
    resolver: zodResolver(encontreiSchema),
    defaultValues: { value: 0, neighborhood: '', code: '', docCompleta: false, obs: '' },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {NEIGHBORHOODS.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
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
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Registrar Imóvel</Button>
        </div>
      </form>
    </Form>
  )
}

function NaoEncontreiForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: any) => void
  onClose: () => void
}) {
  const form = useForm({
    resolver: zodResolver(naoEncontreiSchema),
    defaultValues: { reason: '', continueSearch: true },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm mt-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Continuar a busca?</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Manter a demanda ativa para outros captadores
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="destructive">
            Confirmar
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
      <DialogContent className="sm:max-w-[425px]">
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
            <EncontreiForm onSubmit={onConfirm} onClose={onClose} />
          ) : (
            <NaoEncontreiForm onSubmit={onConfirm} onClose={onClose} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
