import { useState } from 'react'
import { useUltimosImoveis } from '@/hooks/use-ultimos-imoveis'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Building,
  MapPin,
  Bed,
  Car,
  Calendar,
  DollarSign,
  User,
  Link as LinkIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export function UltimosImoveisTab() {
  const [periodo, setPeriodo] = useState<'24h' | '7d' | '30d' | 'todos'>('30d')
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'meus'>('todos')

  const { imoveis, loading } = useUltimosImoveis(periodo, tipoFiltro)
  const navigate = useNavigate()

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-4 rounded-[12px] shadow-sm border border-[#E5E5E5]">
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 text-[#1A3A52]" />
          <h2 className="font-bold text-[18px] text-[#1A3A52]">Últimos Imóveis Cadastrados</h2>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={periodo} onValueChange={(v: any) => setPeriodo(v)}>
            <SelectTrigger className="w-full sm:w-[150px] min-h-[44px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tipoFiltro} onValueChange={(v: any) => setTipoFiltro(v)}>
            <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
              <SelectValue placeholder="Filtro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os imóveis</SelectItem>
              <SelectItem value="meus">Minhas Demandas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[200px] rounded-[12px]" />
          ))}
        </div>
      ) : imoveis.length === 0 ? (
        <div className="bg-white p-10 text-center rounded-[12px] border border-dashed border-[#E5E5E5] flex flex-col items-center justify-center">
          <Building className="w-12 h-12 text-[#999999] opacity-30 mb-3" />
          <p className="font-bold text-[16px] text-[#333333]">
            Nenhum imóvel encontrado neste período.
          </p>
          <p className="text-[14px] text-[#666666]">Altere os filtros para ver mais resultados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {imoveis.map((imovel) => (
            <Card
              key={imovel.id}
              onClick={() => {
                if (imovel.demanda_id) {
                  navigate(`/app/demandas?id=${imovel.demanda_id}`)
                } else {
                  navigate(`/app/disponivel-geral`)
                }
              }}
              className={cn(
                'overflow-hidden transition-all hover:shadow-md border-l-[6px] cursor-pointer',
                imovel.is_minha_demanda
                  ? 'border-l-[#10B981]'
                  : !imovel.has_demanda
                    ? 'border-l-[#3B82F6]'
                    : 'border-l-[#F59E0B]',
              )}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <Badge
                    variant="outline"
                    className="font-mono bg-[#F5F5F5] text-[#333333] border-[#E5E5E5]"
                  >
                    {imovel.codigo_imovel}
                  </Badge>
                  <span className="text-[12px] font-medium text-[#666666] flex items-center gap-1 bg-[#F9FAFB] px-2 py-1 rounded-md">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDistanceToNow(new Date(imovel.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="font-black text-[20px] text-[#1A3A52] flex items-center gap-1.5">
                    <DollarSign className="w-5 h-5 text-[#10B981]" />
                    R$ {imovel.preco.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[14px] text-[#333333] flex items-start gap-1.5 font-medium">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#666666]" />
                    <span className="line-clamp-2 leading-tight">
                      {imovel.endereco || 'Endereço não informado'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[13px] text-[#666666] font-bold">
                  <div className="flex items-center gap-1 bg-[#F5F5F5] px-2 py-1 rounded-md">
                    <Bed className="w-4 h-4" /> {imovel.dormitorios}
                  </div>
                  <div className="flex items-center gap-1 bg-[#F5F5F5] px-2 py-1 rounded-md">
                    <Car className="w-4 h-4" /> {imovel.vagas}
                  </div>
                  <div className="flex items-center gap-1 ml-auto bg-[#E8F0F8] text-[#1A3A52] px-2 py-1 rounded-md max-w-[120px]">
                    <User className="w-3.5 h-3.5 shrink-0" />{' '}
                    <span className="truncate">{imovel.captador_nome}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between">
                  <span
                    className={cn(
                      'text-[12px] font-black px-2.5 py-1 rounded-[6px] uppercase tracking-wide',
                      imovel.is_minha_demanda
                        ? 'bg-[#10B981]/10 text-[#059669]'
                        : !imovel.has_demanda
                          ? 'bg-[#3B82F6]/10 text-[#1D4ED8]'
                          : 'bg-[#F59E0B]/10 text-[#B45309]',
                    )}
                  >
                    {imovel.is_minha_demanda
                      ? 'Sua Demanda'
                      : !imovel.has_demanda
                        ? 'Disponível (Genérico)'
                        : 'Demanda de Outro'}
                  </span>

                  {!imovel.has_demanda && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-[12px] gap-1.5 text-[#1D4ED8] hover:text-[#1e3a8a] hover:bg-[#3B82F6]/10 font-bold px-2"
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> Vincular
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
