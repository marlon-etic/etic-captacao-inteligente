import { useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from '@/components/ui/dialog'
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
  const [selectedProperty, setSelectedProperty] = useState<any>(null)

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
    columns = ['Bairro', 'Código do Imóvel', 'Valor', 'Specs', 'Link de acesso']
    renderRow = (i) => (
      <TableRow key={i.id} className="hover:bg-gray-50">
        <TableCell className="font-bold text-gray-800">
          {i.localizacao_texto || i.endereco?.split(',')[0] || 'N/A'}
        </TableCell>
        <TableCell className="text-gray-500 font-medium">{i.codigo_imovel || 'N/A'}</TableCell>
        <TableCell className="font-medium text-emerald-600">R$ {i.preco || i.valor || 0}</TableCell>
        <TableCell className="text-gray-500">
          {i.dormitorios || 0} qtos, {i.vagas || 0} vagas
        </TableCell>
        <TableCell>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedProperty(i)}
            className="font-bold text-xs h-8"
          >
            Ver Detalhes
          </Button>
        </TableCell>
      </TableRow>
    )
  } else if (cardFiltrado === 'sob_demanda') {
    listData = imoveisSobDemandaList
    columns = ['Bairro', 'Código do Imóvel', 'Valor', 'Specs', 'Link de acesso']
    renderRow = (i) => (
      <TableRow key={i.id} className="hover:bg-gray-50">
        <TableCell className="font-bold text-gray-800">
          {i.localizacao_texto || i.endereco?.split(',')[0] || 'N/A'}
        </TableCell>
        <TableCell className="text-gray-500 font-medium">{i.codigo_imovel || 'N/A'}</TableCell>
        <TableCell className="font-medium text-emerald-600">R$ {i.preco || i.valor || 0}</TableCell>
        <TableCell className="text-gray-500">
          {i.dormitorios || 0} qtos, {i.vagas || 0} vagas
        </TableCell>
        <TableCell>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedProperty(i)}
            className="font-bold text-xs h-8"
          >
            Ver Detalhes
          </Button>
        </TableCell>
      </TableRow>
    )
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

      <Dialog open={!!selectedProperty} onOpenChange={(open) => !open && setSelectedProperty(null)}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#1A3A52]">
              Detalhes do Imóvel
            </DialogTitle>
            <DialogDescription>Informações completas do imóvel selecionado.</DialogDescription>
          </DialogHeader>

          {selectedProperty && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                    Código
                  </p>
                  <p className="font-bold text-gray-800">
                    {selectedProperty.codigo_imovel || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                    Valor
                  </p>
                  <p className="font-bold text-emerald-600">
                    R$ {selectedProperty.preco || selectedProperty.valor || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                    Status
                  </p>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none capitalize">
                    {selectedProperty.status_captacao ||
                      selectedProperty.etapa_funil ||
                      'Disponível'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                    Localização
                  </p>
                  <p className="font-medium text-gray-700">{selectedProperty.endereco || 'N/A'}</p>
                  <p className="text-sm text-gray-500 mt-1">{selectedProperty.localizacao_texto}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                    Características
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline">{selectedProperty.tipo_imovel || 'N/A'}</Badge>
                    <Badge variant="outline">{selectedProperty.dormitorios || 0} Quartos</Badge>
                    <Badge variant="outline">{selectedProperty.vagas || 0} Vagas</Badge>
                    <Badge variant="outline">{selectedProperty.banheiros || 0} Banheiros</Badge>
                  </div>
                </div>
              </div>

              {selectedProperty.observacoes && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                    Observações
                  </p>
                  <p className="text-sm text-gray-700 bg-blue-50/50 p-4 rounded-md border border-blue-100 leading-relaxed whitespace-pre-wrap">
                    {selectedProperty.observacoes}
                  </p>
                </div>
              )}

              {selectedProperty.fotos && selectedProperty.fotos.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                    Fotos ({selectedProperty.fotos.length})
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
                    {selectedProperty.fotos.map((foto: string, idx: number) => (
                      <img
                        key={idx}
                        src={foto}
                        alt={`Foto ${idx + 1}`}
                        className="h-32 w-32 md:h-40 md:w-40 object-cover rounded-lg border border-gray-200 snap-center shadow-sm"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
