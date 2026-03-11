import { useState } from 'react'
import { Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DemandCard } from '@/components/DemandCard'
import useAppStore from '@/stores/useAppStore'

export default function Demandas() {
  const { demands, getSimilarDemands } = useAppStore()
  const [search, setSearch] = useState('')

  const filtered = demands
    .filter(
      (d) =>
        d.clientName.toLowerCase().includes(search.toLowerCase()) ||
        d.location.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const aTotal = getSimilarDemands(a.id).length + 1
      const bTotal = getSimilarDemands(b.id).length + 1
      if (aTotal >= 5 && bTotal < 5) return -1
      if (bTotal >= 5 && aTotal < 5) return 1
      if (aTotal !== bTotal) return bTotal - aTotal
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Todas as Demandas</h1>
          <p className="text-muted-foreground text-sm">Lista completa do sistema.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar bairro ou cliente..."
            className="max-w-[250px] bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((demand) => (
          <DemandCard key={demand.id} demand={demand} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-8">
            Nenhuma demanda encontrada.
          </p>
        )}
      </div>
    </div>
  )
}
