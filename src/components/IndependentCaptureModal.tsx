import { useState } from 'react'
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
import useAppStore from '@/stores/useAppStore'

const indepSchema = z.object({
  neighborhood: z.string().min(1, 'Selecione um bairro'),
  code: z.string().min(1, 'Obrigatório').max(20, 'Máximo 20 caracteres'),
  value: z.coerce.number().positive('O valor deve ser positivo'),
  docCompleta: z.boolean().default(false),
})

const NEIGHBORHOODS = ['Jardins', 'Pinheiros', 'Moema', 'Vila Olímpia', 'Itaim Bibi', 'Centro']

export function IndependentCaptureModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { submitIndependentCapture } = useAppStore()

  const form = useForm({
    resolver: zodResolver(indepSchema),
    defaultValues: { neighborhood: '', code: '', value: 0, docCompleta: false },
  })

  const onSubmit = (data: any) => {
    submitIndependentCapture(data)
    form.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Captação Independente</DialogTitle>
          <DialogDescription>
            Registre um imóvel captado proativamente (sem demanda vinculada). Rende +35 pts base.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
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
                    <FormLabel>Código</FormLabel>
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
            <FormField
              control={form.control}
              name="docCompleta"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4 bg-muted/50">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">Documentação Completa?</FormLabel>
                    <p className="text-xs text-muted-foreground">Garante +20 pts de bônus</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
      </DialogContent>
    </Dialog>
  )
}
