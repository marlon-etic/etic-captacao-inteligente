import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'

export function ImoveisPerdidosTable({ perdidos }: { perdidos: any[] }) {
  if (perdidos.length === 0)
    return (
      <Card className="mb-8 border-gray-100 shadow-sm rounded-xl bg-white">
        <CardContent className="p-8 text-center text-emerald-600 font-bold text-lg">
          🎉 Nenhum imóvel perdido neste período!
        </CardContent>
      </Card>
    )

  return (
    <Card className="mb-8 border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden bg-white">
      <CardHeader className="bg-red-50/50 border-b border-gray-100 pb-4">
        <CardTitle className="text-red-700 font-black text-lg">
          ❌ Imóveis Perdidos (Acompanhar)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-bold text-[#1A3A52]">Código</TableHead>
                <TableHead className="font-bold text-[#1A3A52]">Endereço</TableHead>
                <TableHead className="font-bold text-[#1A3A52]">Status</TableHead>
                <TableHead className="font-bold text-[#1A3A52]">Data Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perdidos.map((p) => (
                <TableRow key={p.id} className="hover:bg-red-50/50 transition-colors">
                  <TableCell className="font-bold text-gray-700">
                    {p.codigo_imovel || 'S/N'}
                  </TableCell>
                  <TableCell className="font-bold text-gray-600 truncate max-w-[200px]">
                    {p.endereco || 'Não informado'}
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600 font-bold uppercase text-[10px] bg-red-100 px-2 py-1 rounded-md tracking-wider">
                      {p.status_captacao}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500 font-bold text-sm">
                    {format(new Date(p.created_at), 'dd/MM/yyyy')}
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
