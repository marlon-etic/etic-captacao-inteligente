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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BAIRROS_ETIC } from '@/lib/bairros'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório').max(20, 'Máximo 20 caracteres'),
  neighborhood: z.string().min(1, 'Este bairro não está na lista de atuação da Étic Imóveis'),
  value: z.coerce.number().positive('Valor deve ser um número positivo'),
  bedrooms: z.coerce.number().int().min(0, 'Valor deve ser 0 ou positivo'),
  parkingSpots: z.coerce.number().int().min(0, 'Valor deve ser 0 ou positivo'),
  obs: z.string().optional(),
})

export function EncontreiGrupoModal({
  isOpen,
  onClose,
  demandIds,
}: {
  isOpen: boolean
  onClose: () => void
  demandIds: string[]
}) {
  const { submitGroupCapture } = useAppStore()
  const { toast } = useToast()

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { code: '', neighborhood: '', value: 0, bedrooms: 0, parkingSpots: 0, obs: '' },
  })

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const res = submitGroupCapture(demandIds, data)
    if (!res.success) {
      toast({ title: 'Atenção', description: res.message, variant: 'destructive' })
      return
    }
    form.reset()
    onClose()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-[#1A3A52] font-bold text-[18px]">
            ✅ ENCONTREI IMÓVEL PARA ESTE GRUPO
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do imóvel que atende a este grupo de clientes.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BAIRROS_ETIC.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
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
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
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
                name="bedrooms"
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
                name="parkingSpots"
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold"
              >
                Salvar Imóvel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
