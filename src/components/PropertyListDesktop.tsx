import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Props {
  properties: any[]
  onSelect: (p: any) => void
}

export function PropertyListDesktop({ properties, onSelect }: Props) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-[0_4px_12px_rgba(26,58,82,0.05)] overflow-hidden">
      <Table>
        <TableHeader className="bg-[#F8FAFC]">
          <TableRow className="border-[#E5E5E5] hover:bg-[#F8FAFC]">
            <TableHead className="font-black text-[#1A3A52] whitespace-nowrap h-[48px]">
              Código / Tipo
            </TableHead>
            <TableHead className="font-black text-[#1A3A52] h-[48px]">Localização</TableHead>
            <TableHead className="font-black text-[#1A3A52] h-[48px]">Preço</TableHead>
            <TableHead className="font-black text-[#1A3A52] whitespace-nowrap h-[48px]">
              Perfil
            </TableHead>
            <TableHead className="font-black text-[#1A3A52] h-[48px]">Captador</TableHead>
            <TableHead className="font-black text-[#1A3A52] h-[48px]">Demanda Vinculada</TableHead>
            <TableHead className="font-black text-[#1A3A52] h-[48px]">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((p: any) => {
            const isRecent = new Date().getTime() - new Date(p.created_at).getTime() < 86400000
            return (
              <TableRow
                key={p.id}
                className="cursor-pointer hover:bg-[#F8FAFC] transition-colors border-[#E5E5E5]"
                onClick={() => onSelect(p)}
              >
                <TableCell className="py-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-[#1A3A52] text-sm bg-gray-50 w-fit px-1.5 py-0.5 rounded border border-gray-200">
                      {p.codigo_imovel}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px]">{p.tipo === 'Aluguel' ? '🏠' : '🏢'}</span>
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                        {p.tipo}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <span className="line-clamp-2 text-sm font-medium text-gray-700 max-w-[220px]">
                    {p.endereco}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <span className="font-black text-emerald-600 whitespace-nowrap text-[15px]">
                    {formatCurrency(p.preco)}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-col gap-0.5 text-[12px] text-gray-600 font-bold whitespace-nowrap">
                    <span>🛏️ {p.dormitorios || 0} Dorm.</span>
                    <span>🚗 {p.vagas || 0} Vagas</span>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <span className="text-sm font-bold text-[#1A3A52] line-clamp-1 max-w-[120px]">
                    {p.captador_nome}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  {p.demanda ? (
                    <div className="flex flex-col items-start gap-1">
                      <Badge
                        variant="outline"
                        className={
                          p.tipo === 'Aluguel'
                            ? 'text-blue-700 bg-blue-50 border-blue-200 font-black shadow-sm'
                            : 'text-green-700 bg-green-50 border-green-200 font-black shadow-sm'
                        }
                      >
                        {p.demanda.clientName}
                      </Badge>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Solicitante: {p.demanda.createdBy ? 'SDR/Corretor' : 'N/A'}
                      </span>
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[11px] text-gray-500 bg-gray-50 border-gray-200 italic font-medium"
                    >
                      Avulso
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-col gap-1.5 items-start whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-500">
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {isRecent && (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0 h-4 shadow-sm border-none uppercase tracking-wider font-black animate-pulse">
                        Novo
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
          {properties.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-[200px]">
                <div className="flex flex-col items-center justify-center gap-3">
                  <span className="text-4xl">🏢</span>
                  <p className="text-sm font-bold text-gray-500">
                    Nenhum imóvel encontrado com os filtros atuais.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
