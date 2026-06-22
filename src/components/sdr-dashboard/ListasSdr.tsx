import { useSdrStore } from '@/hooks/use-sdr-store'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { LogVisitSection } from '@/components/checkin/LogVisitSection'
import { LogClosingSection } from '@/components/checkin/LogClosingSection'

export function ListasSdr({
  data,
  loading,
  isLocacao,
}: {
  data: any
  loading: boolean
  isLocacao: boolean
}) {
  const { cardFiltrado } = useSdrStore()

  if (loading) return null

  const demandasList = Array.isArray(data?.demandas) ? data.demandas : []
  const imoveisLivresList = Array.isArray(data?.imoveisLivres) ? data.imoveisLivres : []
  const imoveisSobDemandaList = Array.isArray(data?.imoveisSobDemanda) ? data.imoveisSobDemanda : []
  const visitasList = Array.isArray(data?.visitas) ? data.visitas : []
  const fechadosList = Array.isArray(data?.fechados) ? data.fechados : []

  const activeDemands =
    demandasList.map((d: any) => ({
      id: d.id,
      tipo: isLocacao ? 'Locação' : 'Venda',
      nome_cliente: d.nome_cliente || d.cliente_nome || 'Cliente',
    })) || []

  const allProperties = [...imoveisLivresList, ...imoveisSobDemandaList]

  let listData: any[] = []
  let columns: string[] = []
  let renderRow: (item: any) => React.ReactNode

  if (cardFiltrado === 'novas' || cardFiltrado === 'nenhum') {
    listData =
      demandasList.filter((d: any) => !d?.status_demanda || d.status_demanda === 'aberta') || []
    columns = ['Cliente', 'Specs', 'Data', 'Status']
    renderRow = (d) => (
      <TableRow
        key={d.id}
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => (window.location.href = `/app/demandas?id=${d.id}`)}
      >
        <TableCell className="font-bold text-gray-800">
          {d.nome_cliente || d.cliente_nome || 'N/A'}
        </TableCell>
        <TableCell className="text-gray-500">
          {d.dormitorios || 0} Dorm, {d.vagas_estacionamento || 0} Vagas
        </TableCell>
        <TableCell className="text-gray-500">
          {format(new Date(d.created_at), 'dd/MM/yyyy')}
        </TableCell>
        <TableCell>
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none font-bold uppercase tracking-wider text-[10px]">
            Nova
          </Badge>
        </TableCell>
      </TableRow>
    )
  } else if (cardFiltrado === 'ativas') {
    listData =
      demandasList.filter((d: any) =>
        ['aberta', 'em busca', 'em visita', 'em negociação'].includes(
          d?.status_demanda?.toLowerCase() || '',
        ),
      ) || []
    columns = ['Cliente', 'Budget', 'Criada em', 'Status']
    renderRow = (d) => (
      <TableRow
        key={d.id}
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => (window.location.href = `/app/demandas?id=${d.id}`)}
      >
        <TableCell className="font-bold text-gray-800">
          {d.nome_cliente || d.cliente_nome || 'N/A'}
        </TableCell>
        <TableCell className="font-medium text-emerald-600">R$ {d.valor_maximo || 0}</TableCell>
        <TableCell className="text-gray-500">
          {format(new Date(d.created_at), 'dd/MM/yyyy')}
        </TableCell>
        <TableCell>
          <Badge className="bg-blue-100 text-blue-800 border-none font-bold uppercase tracking-wider text-[10px]">
            Em Busca
          </Badge>
        </TableCell>
      </TableRow>
    )
  } else if (cardFiltrado === 'livres') {
    listData = imoveisLivresList
    columns = ['Endereço', 'Tipo', 'Valor', 'Specs', 'Status']
    renderRow = (i) => (
      <TableRow key={i.id} className="hover:bg-gray-50">
        <TableCell className="font-bold text-gray-800">
          {i.endereco || i.localizacao_texto || 'N/A'}
        </TableCell>
        <TableCell className="text-gray-500">{i.tipo_imovel}</TableCell>
        <TableCell className="font-medium text-emerald-600">R$ {i.preco || i.valor || 0}</TableCell>
        <TableCell className="text-gray-500">
          {i.dormitorios || 0} Dorm, {i.vagas || 0} Vagas
        </TableCell>
        <TableCell>
          <Badge className="bg-amber-100 text-amber-800 border-none font-bold uppercase tracking-wider text-[10px]">
            Disponível
          </Badge>
        </TableCell>
      </TableRow>
    )
  } else if (cardFiltrado === 'sob_demanda') {
    listData = imoveisSobDemandaList
    columns = ['Código', 'Endereço', 'Valor', 'Captador']
    renderRow = (i) => {
      const captadorNome = i.users?.nome || 'Desconhecido'
      return (
        <TableRow key={i.id} className="hover:bg-gray-50">
          <TableCell className="font-bold text-gray-500 text-xs">
            #{i.codigo_imovel || i.id?.split('-')[0] || 'N/A'}
          </TableCell>
          <TableCell
            className="font-bold text-gray-800 truncate max-w-[200px]"
            title={i.endereco || i.localizacao_texto}
          >
            {i.endereco || i.localizacao_texto || 'N/A'}
          </TableCell>
          <TableCell className="font-medium text-emerald-600">
            R$ {i.preco || i.valor || 0}
          </TableCell>
          <TableCell className="text-gray-500 text-sm">{captadorNome}</TableCell>
        </TableRow>
      )
    }
  } else if (cardFiltrado === 'visitas') {
    listData = visitasList
    columns = ['Data Visita', 'Tipo', 'Endereço', 'Ações']
    renderRow = (v) => (
      <TableRow key={v.id} className="hover:bg-gray-50">
        <TableCell className="font-bold text-gray-800">
          {format(new Date(v.data_visita || v.created_at), 'dd/MM/yyyy HH:mm')}
        </TableCell>
        <TableCell className="text-gray-500">{v.tipo_demanda}</TableCell>
        <TableCell className="text-gray-500">{v.novo_imovel_endereco || 'N/A'}</TableCell>
        <TableCell>
          <Button size="sm" variant="outline" className="h-8 font-bold">
            Detalhes
          </Button>
        </TableCell>
      </TableRow>
    )
  } else if (cardFiltrado === 'fechados') {
    listData = fechadosList
    columns = ['Data', 'Tipo', 'Valor', 'Status']
    renderRow = (f) => (
      <TableRow key={f.id} className="hover:bg-gray-50">
        <TableCell className="font-bold text-gray-800">
          {format(new Date(f.created_at), 'dd/MM/yyyy')}
        </TableCell>
        <TableCell className="text-gray-500">{f.tipo_demanda}</TableCell>
        <TableCell className="font-medium text-emerald-600">R$ {f.valor || 0}</TableCell>
        <TableCell>
          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold uppercase tracking-wider text-[10px]">
            {f.status || 'Fechado'}
          </Badge>
        </TableCell>
      </TableRow>
    )
  } else {
    listData = []
    columns = ['N/A']
    renderRow = () => (
      <TableRow>
        <TableCell></TableCell>
      </TableRow>
    )
  }

  const title =
    cardFiltrado === 'nenhum' ? 'Novas Demandas' : cardFiltrado.toUpperCase().replace('_', ' ')

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h2 className="font-black text-[#1A3A52] text-lg">{title}</h2>
        <div className="flex items-center gap-3">
          {cardFiltrado === 'visitas' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#0070f3] hover:bg-[#005bb5] text-white">
                  Registrar Visita
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white">
                <DialogTitle className="sr-only">Registrar Visita</DialogTitle>
                <LogVisitSection
                  demands={activeDemands}
                  properties={allProperties}
                  onVisitLogged={() => window.location.reload()}
                />
              </DialogContent>
            </Dialog>
          )}
          {cardFiltrado === 'fechados' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#10B981] hover:bg-[#059669] text-white">
                  Registrar Fechamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white">
                <DialogTitle className="sr-only">Registrar Fechamento</DialogTitle>
                <LogClosingSection
                  demands={activeDemands}
                  properties={allProperties}
                  onClosingLogged={() => window.location.reload()}
                />
              </DialogContent>
            </Dialog>
          )}
          <Badge variant="outline" className="bg-white font-bold">
            {listData.length} registros
          </Badge>
        </div>
      </div>
      <div className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-white">
              {columns.map((c) => (
                <TableHead
                  key={c}
                  className="font-bold text-gray-500 uppercase tracking-wider text-xs h-10"
                >
                  {c}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {listData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12 text-gray-400 font-bold bg-white"
                >
                  Nenhum registro encontrado para este filtro no período.
                </TableCell>
              </TableRow>
            ) : (
              listData.map(renderRow)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
