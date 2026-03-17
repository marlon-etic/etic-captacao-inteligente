import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Demand, CapturedProperty } from '@/types'
import { useToast } from '@/hooks/use-toast'

interface Props {
  demand: Demand | null
  property: CapturedProperty | null
  actionType: 'visita' | 'proposta' | 'negocio' | 'lost' | 'details' | 'edit' | null
  onClose: () => void
  onSubmitVisita: (data: any) => void
  onSubmitProposta: (data: any) => void
  onSubmitNegocio: (data: any) => void
  onSubmitLost: (data: any) => void
}

export function CapturedPropertyModals({
  demand,
  property,
  actionType,
  onClose,
  onSubmitVisita,
  onSubmitProposta,
  onSubmitNegocio,
  onSubmitLost,
}: Props) {
  const { toast } = useToast()
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [val, setVal] = useState('')
  const [obs, setObs] = useState('')
  const [reason, setReason] = useState('')
  const [dealType, setDealType] = useState('Venda')

  useEffect(() => {
    if (actionType) {
      setDate('')
      setTime('')
      setVal('')
      setObs('')
      setReason('')
      setDealType('Venda')
    }
  }, [actionType])

  const handleVisita = () => {
    if (!date || !time) {
      toast({ title: 'Erro', description: 'Preencha data e hora', variant: 'destructive' })
      return
    }
    const [year, month, day] = date.split('-')
    const [hours, minutes] = time.split(':')
    const inputDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
    )
    if (inputDate < new Date()) {
      toast({
        title: 'Erro',
        description: 'A data e hora da visita não podem estar no passado.',
        variant: 'destructive',
      })
      return
    }
    onSubmitVisita({ date, time, obs })
  }

  const handleNegocio = () => {
    if (!date || !val) {
      toast({ title: 'Erro', description: 'Preencha data e valor', variant: 'destructive' })
      return
    }
    const inputDate = new Date(date + 'T00:00:00')
    const today = new Date()
    inputDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    if (inputDate > today) {
      toast({
        title: 'Erro',
        description: 'A data não pode estar no futuro.',
        variant: 'destructive',
      })
      return
    }
    if (Number(val) <= 0) {
      toast({
        title: 'Erro',
        description: 'O valor deve ser positivo.',
        variant: 'destructive',
      })
      return
    }
    onSubmitNegocio({ date, value: Number(val), type: dealType, obs })
  }

  const handleProposta = () => {
    if (!date || !val) {
      toast({ title: 'Erro', description: 'Preencha data e valor', variant: 'destructive' })
      return
    }
    onSubmitProposta({ date, value: Number(val), obs })
  }

  const handleLost = () => {
    if (!reason) {
      toast({ title: 'Erro', description: 'Preencha o motivo', variant: 'destructive' })
      return
    }
    onSubmitLost({ reason, obs })
  }

  return (
    <>
      <Dialog open={actionType === 'visita'} onOpenChange={(v) => !v && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Visita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label>Hora</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={obs} onChange={(e) => setObs(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleVisita}>Confirmar Visita</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionType === 'negocio'} onOpenChange={(v) => !v && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Negócio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data do Fechamento</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Valor do Fechamento (R$)</Label>
              <Input type="number" value={val} onChange={(e) => setVal(e.target.value)} />
            </div>
            <div>
              <Label>Tipo de Negócio</Label>
              <Select value={dealType} onValueChange={setDealType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Venda">Venda</SelectItem>
                  <SelectItem value="Aluguel">Aluguel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={obs} onChange={(e) => setObs(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleNegocio} className="bg-emerald-600 hover:bg-emerald-700">
              Registrar Negócio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionType === 'proposta'} onOpenChange={(v) => !v && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Proposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Valor da Proposta (R$)</Label>
              <Input type="number" value={val} onChange={(e) => setVal(e.target.value)} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={obs} onChange={(e) => setObs(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleProposta}>Salvar Proposta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionType === 'lost'} onOpenChange={(v) => !v && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispensar Imóvel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Não gostou">Cliente não gostou</SelectItem>
                  <SelectItem value="Caro">Muito caro</SelectItem>
                  <SelectItem value="Localização">Localização ruim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={obs} onChange={(e) => setObs(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleLost}>
              Dispensar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
