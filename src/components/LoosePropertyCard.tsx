import { MapPin, Calendar, Bed, Car, Bath, UserCircle, Hand } from 'lucide-react'
import { CapturedProperty } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function LoosePropertyCard({
  property,
  onClaim,
  onIgnore,
}: {
  property: CapturedProperty
  onClaim: (p: CapturedProperty) => void
  onIgnore?: (code: string) => void
}) {
  return (
    <Card className="overflow-hidden flex flex-col h-full border-2 border-blue-200 hover:shadow-md relative transition-all bg-card">
      <div className="relative h-48 w-full bg-muted">
        <img
          src={
            property.photoUrl ||
            `https://img.usecurling.com/p/400/300?q=house&seed=${property.code}`
          }
          alt="Imóvel Disponível"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge
            variant="outline"
            className="font-medium shadow-sm bg-blue-50 text-blue-800 border-blue-300"
          >
            🔓 Disponível para todos
          </Badge>
        </div>
        <div className="absolute bottom-2 left-3.5 flex flex-col gap-1">
          <Badge
            variant="secondary"
            className="bg-black/70 text-white border-none shadow-sm self-start"
          >
            Cód: {property.code}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 flex-grow flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-semibold text-lg line-clamp-1 flex-1 text-blue-900">
            {property.propertyType === 'Aluguel' ? '🏠 Locação' : '🏢 Venda'}
          </h4>
          <span className="font-bold text-primary whitespace-nowrap">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(property.value)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {property.bairro_tipo === 'outro' && <span className="mr-1">🔹</span>}
            {property.neighborhood}
          </span>
        </p>

        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
          {property.bedrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5" /> {property.bedrooms}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground bg-blue-50/50 p-2 rounded-md border border-blue-100">
          <p className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            Captação: {new Date(property.capturedAt || '').toLocaleDateString('pt-BR')}
          </p>
          <p className="flex items-center gap-1.5">
            <UserCircle className="w-3.5 h-3.5 shrink-0" />
            Captador:{' '}
            <span className="font-medium text-foreground">{property.captador_name || 'N/A'}</span>
          </p>
        </div>

        {property.obs && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">"{property.obs}"</p>
        )}
      </CardContent>

      <div className="p-4 pt-0 mt-auto flex flex-col gap-2">
        <Button
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold h-[44px]"
          onClick={() => onClaim(property)}
        >
          ✅ Usar para meu cliente
        </Button>
        {onIgnore && (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-[44px]"
            onClick={() => onIgnore(property.code)}
          >
            ❌ Não me interessa
          </Button>
        )}
      </div>
    </Card>
  )
}
