import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MapPin, Home, DollarSign, ExternalLink, CheckCircle2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ImoveisCadastradosList({ imoveis, loading, onSelect }: any) {
  if (loading) {
    return (
      <Card className="border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-black text-[#1A3A52]">
            🏠 Seus Imóveis Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full mb-2 rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden bg-white h-full flex flex-col">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4 flex flex-row items-center justify-between shrink-0">
        <div>
          <CardTitle className="text-lg font-black text-[#1A3A52]">
            🏠 Seus Imóveis Cadastrados
          </CardTitle>
          <CardDescription className="font-bold text-xs mt-1">
            Mais recentes no topo
          </CardDescription>
        </div>
        <Badge variant="outline" className="font-bold text-gray-500 bg-white">
          {imoveis.length} listados
        </Badge>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        {imoveis.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-bold">
            Sem imóveis cadastrados para este filtro.
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-bold text-[#1A3A52]">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Endereço
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-[#1A3A52]">
                    <div className="flex items-center gap-1">
                      <Home className="w-3 h-3" /> Tipo / Specs
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-[#1A3A52]">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Valor
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-[#1A3A52]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imoveis.map((imv: any) => (
                  <TableRow
                    key={imv.id}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                    onClick={() => onSelect(imv)}
                  >
                    <TableCell className="font-bold text-gray-800">
                      <div className="flex items-center gap-3">
                        {imv.fotos?.[0] && imv.fotos[0] !== 'SEM' ? (
                          <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                            <img
                              src={imv.fotos[0]}
                              alt="Thumb"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 text-[10px] font-bold text-center leading-[1.1] p-1 break-all uppercase border border-slate-200 shadow-sm"
                            title={imv.codigo_imovel}
                          >
                            {imv.codigo_imovel || 'SEM'}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="truncate max-w-[180px] text-sm">
                            {imv.endereco || 'Endereço não informado'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {imv.status_captacao || 'pendente'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-gray-700 text-xs">
                          {imv.tipo_imovel || 'Imóvel'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">
                          {imv.dormitorios || 0}D, {imv.vagas || 0}V
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-emerald-600 text-sm">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        maximumFractionDigits: 0,
                      }).format(imv.preco || imv.valor || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex gap-1">
                          {imv.demanda_locacao_id || imv.demanda_venda_id ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-none shadow-none text-[9px] px-1.5">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Vinculado
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-gray-100 text-gray-500 border-gray-200 text-[9px] px-1.5 font-bold hover:bg-gray-200"
                            >
                              Livre
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-2 font-bold text-gray-600 bg-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(
                                `https://www.eticimoveis.com.br/imovel/${imv.codigo_imovel}`,
                                '_blank',
                              )
                            }}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" /> Ver
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-6 text-[10px] px-2 font-bold bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelect(imv)
                            }}
                          >
                            <Zap className="w-3 h-3 mr-1" /> Matches
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
