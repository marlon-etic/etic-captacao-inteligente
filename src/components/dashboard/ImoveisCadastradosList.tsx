import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { MapPin, Home, DollarSign, Tag } from 'lucide-react'

export function ImoveisCadastradosList({ imoveis, loading, onSelect }: any) {
  if (loading) {
    return (
      <Card className="mb-8 border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-black text-[#1A3A52]">
            🏠 Seus Imóveis Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full mb-2 rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (imoveis.length === 0) {
    return (
      <div className="p-8 mb-8 text-center text-gray-500 font-bold bg-white rounded-xl border border-gray-100 shadow-sm">
        Sem imóveis cadastrados neste período.
      </div>
    )
  }

  return (
    <Card className="mb-8 border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden bg-white">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-black text-[#1A3A52]">
          🏠 Seus Imóveis Cadastrados
        </CardTitle>
        <Badge variant="outline" className="font-bold text-gray-500 bg-white">
          {imoveis.length} listados
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-bold text-[#1A3A52] w-[35%]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Endereço
                  </div>
                </TableHead>
                <TableHead className="font-bold text-[#1A3A52]">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4" /> Tipo
                  </div>
                </TableHead>
                <TableHead className="font-bold text-[#1A3A52]">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Specs
                  </div>
                </TableHead>
                <TableHead className="font-bold text-[#1A3A52]">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Valor
                  </div>
                </TableHead>
                <TableHead className="font-bold text-[#1A3A52]">Status</TableHead>
                <TableHead className="font-bold text-[#1A3A52]">Vinculado?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imoveis.map((imv: any) => (
                <TableRow
                  key={imv.id}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => onSelect(imv)}
                >
                  <TableCell className="font-bold text-gray-800">
                    <div className="flex items-center gap-3">
                      {imv.fotos?.[0] ? (
                        <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                          <img
                            src={imv.fotos[0]}
                            alt="Thumb"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400 text-xs font-bold">
                          Sem
                        </div>
                      )}
                      <span className="truncate max-w-[200px] md:max-w-xs">
                        {imv.endereco || 'Endereço não informado'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-gray-600 text-sm">
                    {imv.tipo_imovel || 'Imóvel'}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-500 whitespace-nowrap">
                    {imv.dormitorios || 0}D, {imv.vagas || 0}V
                  </TableCell>
                  <TableCell className="font-black text-emerald-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      imv.preco || imv.valor || 0,
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="uppercase tracking-wider text-[10px] font-bold"
                    >
                      {imv.status_captacao || 'pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {imv.demanda_locacao_id || imv.demanda_venda_id ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-none hover:bg-emerald-100 shadow-none">
                        ✅ Sim
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="font-bold bg-gray-100 text-gray-500 hover:bg-gray-100"
                      >
                        Não
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
