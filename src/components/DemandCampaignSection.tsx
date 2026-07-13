import React, { useState, useMemo } from 'react'
import { getCaptadorColor, getCaptadorInitials } from '@/lib/captador-colors'
import { useActiveCampaigns } from '@/hooks/use-active-campaigns'
import { ChevronDown, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DemandCampaignSectionProps {
  demandId: string
  demandType: string
  minBudget: number
  maxBudget: number
  tipoImovel?: string
}

const tipoLabels: Record<string, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  galpao: 'Galpão',
  comercial: 'Comercial',
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val)

function normalizeTipo(s: string): string {
  return s.toLowerCase().trim()
}

interface Contributor {
  id: string
  nome: string
  count: number
}

interface CampaignData {
  id: string
  tipo_imovel: string
  faixa_valor_min: number
  faixa_valor_max: number
  meta: number
  totalCount: number
  progressPct: number
  isOverMeta: boolean
  contributors: Contributor[]
  imoveis: Array<{
    id: string
    endereco: string | null
    codigo_imovel: string | null
    preco: number | null
    captador_id: string | null
    captador_nome: string
  }>
}

function CampaignItem({ data }: { data: CampaignData }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-[12px] border border-[#E5E5E5] bg-gradient-to-br from-[#F0F7FF] to-[#FAFBFF] overflow-hidden transition-all duration-200">
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setExpanded((v) => !v)
        }}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-[#E8F0F8]/50 transition-colors duration-150"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#1A3A52] flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-black text-[#1A3A52] uppercase tracking-wide leading-tight">
              {tipoLabels[data.tipo_imovel] || data.tipo_imovel}
            </p>
            <p className="text-[10px] text-[#666] font-bold leading-tight">
              {formatCurrency(data.faixa_valor_min)} — {formatCurrency(data.faixa_valor_max)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              'text-[12px] font-black px-2 py-0.5 rounded-md',
              data.isOverMeta ? 'bg-green-100 text-green-700' : 'bg-[#1A3A52] text-white',
            )}
          >
            {data.totalCount}/{data.meta}
            {data.isOverMeta &&
              data.totalCount > data.meta &&
              ` (${Math.round((data.totalCount / data.meta) * 100)}%)`}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-[#666] transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
        </div>
      </button>

      <div className="px-3 pb-2">
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full bg-gradient-to-r transition-all duration-500',
              data.isOverMeta ? 'from-green-400 to-green-600' : 'from-[#2E5F8A] to-[#4CAF50]',
            )}
            style={{ width: `${data.progressPct}%` }}
          />
        </div>
      </div>

      <div className="px-3 pb-2 flex flex-wrap items-center gap-1.5">
        {data.contributors.slice(0, 3).map((contributor) => {
          const color = getCaptadorColor(contributor.id)
          return (
            <div
              key={contributor.id}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2 py-0.5 border',
                color.light,
                color.border,
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold',
                  color.bg,
                )}
              >
                {getCaptadorInitials(contributor.nome)}
              </div>
              <span className="text-[10px] font-bold text-[#333]">
                {contributor.nome.split(' ')[0]} ({contributor.count})
              </span>
            </div>
          )
        })}
        {data.contributors.length > 3 && (
          <span className="text-[10px] font-bold text-[#999] px-1">
            +{data.contributors.length - 3} mais
          </span>
        )}
      </div>

      {expanded && (
        <div className="border-t border-[#E5E5E5] bg-white/60 p-3 space-y-1.5 animate-fade-in-down">
          {data.imoveis.length === 0 ? (
            <p className="text-[11px] text-[#999] text-center py-2">
              Nenhum imóvel capturado ainda.
            </p>
          ) : (
            data.imoveis.map((item) => {
              const color = getCaptadorColor(item.captador_id || 'unknown')
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-white/80 border border-[#E5E5E5]/50"
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0',
                      color.bg,
                    )}
                  >
                    {getCaptadorInitials(item.captador_nome)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#1A3A52] truncate">
                      {item.endereco || 'Endereço não informado'}
                    </p>
                    <p className="text-[10px] text-[#999]">
                      {item.codigo_imovel && `Cód: ${item.codigo_imovel}`}
                      {item.preco != null && ` · ${formatCurrency(item.preco)}`}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-[#666] shrink-0">
                    {item.captador_nome.split(' ')[0]}
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export const DemandCampaignSection = React.memo(function DemandCampaignSection({
  demandId,
  demandType: _demandType,
  minBudget,
  maxBudget,
  tipoImovel,
}: DemandCampaignSectionProps) {
  const { campanhas, imoveis } = useActiveCampaigns()

  const campaignDataList = useMemo<CampaignData[]>(() => {
    const matching = campanhas.filter((c) => {
      if (c.status !== 'ativa') return false
      const valueOverlap = c.faixa_valor_min <= maxBudget && c.faixa_valor_max >= minBudget
      if (!valueOverlap) return false
      if (tipoImovel) {
        return normalizeTipo(c.tipo_imovel) === normalizeTipo(tipoImovel)
      }
      return true
    })

    return matching.map((campaign) => {
      const campaignImoveis = imoveis.filter((i) => i.campanha_id === campaign.id)

      const contributorMap = new Map<string, Contributor>()
      for (const item of campaignImoveis) {
        const captadorId = item.captador_id || 'unknown'
        const nome = item.captador?.nome || 'Captador'
        const existing = contributorMap.get(captadorId)
        if (existing) {
          existing.count++
        } else {
          contributorMap.set(captadorId, { id: captadorId, nome, count: 1 })
        }
      }

      const contributors = Array.from(contributorMap.values()).sort((a, b) => b.count - a.count)
      const totalCount = campaignImoveis.length
      const meta = campaign.meta || 5
      const progressPct = Math.min(100, (totalCount / meta) * 100)
      const isOverMeta = totalCount >= meta

      const mappedImoveis = campaignImoveis.map((item) => ({
        id: item.id,
        endereco: item.imovel?.endereco || null,
        codigo_imovel: item.imovel?.codigo_imovel || null,
        preco: item.imovel?.preco ?? null,
        captador_id: item.captador_id,
        captador_nome: item.captador?.nome || 'N/D',
      }))

      return {
        id: campaign.id,
        tipo_imovel: campaign.tipo_imovel,
        faixa_valor_min: campaign.faixa_valor_min,
        faixa_valor_max: campaign.faixa_valor_max,
        meta,
        totalCount,
        progressPct,
        isOverMeta,
        contributors,
        imoveis: mappedImoveis,
      }
    })
  }, [campanhas, imoveis, minBudget, maxBudget, tipoImovel])

  if (campaignDataList.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      {campaignDataList.map((data) => (
        <CampaignItem key={data.id} data={data} />
      ))}
    </div>
  )
})
