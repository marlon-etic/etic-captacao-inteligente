import { useState, useMemo, useEffect, Fragment } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import type { CampanhaFechada, CampanhaImovelDetalhe } from '@/services/campanhaHistoricoService'
import { getCaptadorColor, getCaptadorInitials } from '@/lib/captador-colors'
import {
  TIPO_LABELS,
  formatCurrency,
  formatDate,
  calcDuracaoDias,
} from '@/lib/campanha-historico-utils'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

interface HistoricoRankingTableProps {
  campanhas: CampanhaFechada[]
  imoveis: CampanhaImovelDetalhe[]
}

export function HistoricoRankingTable({ campanhas, imoveis }: HistoricoRankingTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  useEffect(() => {
    setPage(0)
  }, [campanhas])

  const totalPages = Math.ceil(campanhas.length / PAGE_SIZE)
  const pageData = campanhas.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const imoveisByCampanha = useMemo(() => {
    const map = new Map<string, CampanhaImovelDetalhe[]>()
    for (const imv of imoveis) {
      const arr = map.get(imv.campanha_id) || []
      arr.push(imv)
      map.set(imv.campanha_id, arr)
    }
    return map
  }, [imoveis])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] overflow-hidden">
      <div className="p-4 border-b border-[#E5E5E5] bg-[#F5F5F5]">
        <h2 className="font-bold text-[#1A3A52]">Ranking de Campanhas Encerradas</h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Tipo</TableHead>
              <TableHead>Faixa de Valor</TableHead>
              <TableHead className="text-center">Imóveis</TableHead>
              <TableHead className="text-center">Captadores</TableHead>
              <TableHead className="text-center">Tempo (dias)</TableHead>
              <TableHead>Data Fechamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((c) => {
              const cImoveis = imoveisByCampanha.get(c.id) || []
              const captadorCount = new Set(cImoveis.map((i) => i.captador_id).filter(Boolean)).size
              const duracao = calcDuracaoDias(c.data_inicio, c.data_fechamento_real || c.data_fim)
              const isExpanded = expandedId === c.id
              return (
                <Fragment key={c.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-[#F8FAFC] transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  >
                    <TableCell className="text-[#999999]">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-[#1A3A52]">
                      {TIPO_LABELS[c.tipo_imovel] || c.tipo_imovel}
                    </TableCell>
                    <TableCell className="text-xs text-[#666666]">
                      {formatCurrency(c.faixa_valor_min)} — {formatCurrency(c.faixa_valor_max)}
                    </TableCell>
                    <TableCell className="text-center font-bold">{cImoveis.length}</TableCell>
                    <TableCell className="text-center">{captadorCount}</TableCell>
                    <TableCell className="text-center">{duracao}</TableCell>
                    <TableCell className="text-xs">
                      {formatDate(c.data_fechamento_real || c.data_fim)}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-[#F8FAFC] p-4">
                        {cImoveis.length === 0 ? (
                          <p className="text-sm text-[#999999] text-center py-4">
                            Nenhum imóvel vinculado.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {cImoveis.map((imv) => {
                              const color = imv.captador_id
                                ? getCaptadorColor(imv.captador_id)
                                : null
                              return (
                                <div
                                  key={imv.id}
                                  className="flex items-center justify-between bg-white rounded-lg p-3 border border-[#E5E5E5]"
                                >
                                  <div>
                                    <p className="font-bold text-sm text-[#1A3A52]">
                                      {imv.imovel?.codigo_imovel || 'Sem código'}
                                    </p>
                                    <p className="text-xs text-[#999999]">
                                      {imv.imovel?.endereco || 'Endereço não informado'}
                                      {imv.imovel?.preco
                                        ? ` · ${formatCurrency(imv.imovel.preco)}`
                                        : ''}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {color && (
                                      <div
                                        className={cn(
                                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                                          color.bg,
                                        )}
                                      >
                                        {getCaptadorInitials(imv.captador?.nome || '?')}
                                      </div>
                                    )}
                                    <div className="text-right">
                                      <p className="text-xs font-bold text-[#1A3A52]">
                                        {imv.captador?.nome || 'N/D'}
                                      </p>
                                      <p className="text-xs text-[#999999]">
                                        {formatDate(imv.data_adicionado)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
            {campanhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-[#999999]">
                  Nenhuma campanha encerrada encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-[#E5E5E5]">
          <p className="text-xs text-[#999999]">
            Página {page + 1} de {totalPages} · {campanhas.length} campanhas
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
