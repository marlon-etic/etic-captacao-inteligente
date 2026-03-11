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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CapturedProperty } from '@/types'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'

const claimSchema = z.object({
  demandId: z.string().min(1, 'Selecione uma demanda'),
})

export function ClaimPropertyModal({
  isOpen,
  onClose,
  property,
}: {
  isOpen: boolean
  onClose: () => void
  property: CapturedProperty | null
}) {
  const { demands, currentUser, claimLooseProperty } = useAppStore()
  const { toast } = useToast()

  const myOpenDemands = demands.filter(
    (d) =>
      d.createdBy === currentUser?.id &&
      (d.status === 'Pendente' || d.status === 'Em Captação' || d.status === 'Captado sob demanda'),
  )

  const form = useForm({
    resolver: zodResolver(claimSchema),
    defaultValues: { demandId: '' },
  })

  const onSubmit = (data: any) => {
    if (!property) return
    const res = claimLooseProperty(property.code, data.demandId)
    if (res.success) {
      toast({
        title: 'Imóvel Reivindicado! 🎉',
        description: 'O imóvel foi vinculado ao seu cliente com sucesso.',
        className: 'bg-emerald-600 text-white border-emerald-600',
      })
      form.reset()
      onClose()
    } else {
      toast({ title: 'Erro', description: res.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reivindicar Imóvel</DialogTitle>
          <DialogDescription>
            Vincule o imóvel <strong>{property?.code}</strong> a uma das suas demandas ativas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="demandId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selecione seu Cliente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma demanda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {myOpenDemands.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Você não possui demandas ativas
                        </SelectItem>
                      ) : (
                        myOpenDemands.map((d) => (
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
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Vincular ao Cliente
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
