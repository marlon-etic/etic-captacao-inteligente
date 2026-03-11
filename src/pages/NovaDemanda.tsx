import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, DollarSign, User, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'

export default function NovaDemanda() {
  const [clientName, setClientName] = useState('')
  const [location, setLocation] = useState('')
  const [budget, setBudget] = useState('')
  const [type, setType] = useState<'Venda' | 'Aluguel'>('Venda')

  const { addDemand } = useAppStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName || !location || !budget) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    addDemand({
      clientName,
      location,
      budget: Number(budget),
      type,
    })

    toast({ title: 'Sucesso!', description: 'Demanda enviada para os captadores.' })
    navigate('/app')
  }

  const bairrosSP = [
    'Pinheiros',
    'Jardins',
    'Vila Olímpia',
    'Moema',
    'Centro',
    'Itaim Bibi',
    'Vila Mariana',
  ]

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-xl">Cadastrar Nova Demanda</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Nome do Cliente</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="pl-9"
                  placeholder="Ex: João da Silva"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bairro de Interesse</Label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="pl-9">
                    <SelectValue placeholder="Selecione o bairro" />
                  </SelectTrigger>
                  <SelectContent>
                    {bairrosSP.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Orçamento Máximo (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="pl-9"
                    placeholder="Ex: 500000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Negócio</Label>
                <RadioGroup
                  value={type}
                  onValueChange={(v) => setType(v as 'Venda' | 'Aluguel')}
                  className="flex gap-4 pt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Venda" id="r1" />
                    <Label htmlFor="r1">Venda</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Aluguel" id="r2" />
                    <Label htmlFor="r2">Aluguel</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <Button type="submit" className="w-full py-6 mt-4 text-base">
              <Tag className="w-5 h-5 mr-2" /> Disparar Demanda
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
