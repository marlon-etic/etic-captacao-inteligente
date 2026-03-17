import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Demand } from '@/types'

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)

export function GroupedCard({ group, onEncontrei, onNaoEncontrei }: any) {
  const { demands, clientCount } = group
  const base = demands[0]

  let badgeClass = 'bg-[#1A3A52] text-white'
  let badgeText = `👥 GRUPO — ${clientCount} clientes`

  if (clientCount >= 7) {
    badgeClass = 'bg-[#F44336] text-white'
    badgeText = `🔥 GRUPO — ${clientCount} clientes`
  } else if (clientCount >= 4) {
    badgeClass = 'bg-[#FF9800] text-white'
    badgeText = `🟠 GRUPO — ${clientCount} clientes`
  }

  const minB = Math.min(...demands.map((d: any) => d.minBudget || d.budget || 0))
  const maxB = Math.max(...demands.map((d: any) => d.maxBudget || d.budget || 0))

  return (
    <div className="flex flex-col bg-[#E8F0F8] border-[2px] border-[#1A3A52] rounded-[12px] p-5 shadow-sm h-full gap-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <Badge className={cn('font-bold text-[12px] border-none shadow-none', badgeClass)}>
          {badgeText}
        </Badge>
      </div>

      <div className="flex flex-col gap-2.5 flex-grow">
        <p className="text-[15px] text-[#333333] flex items-center gap-2">
          📍 <strong className="truncate">{base.location}</strong>
        </p>
        <p className="text-[14px] text-[#333333] flex items-center gap-2">
          🏠 <span>Imóvel Residencial</span>
        </p>
        <p className="text-[15px] font-black text-[#1A3A52] flex items-center gap-2">
          💰 R$ {formatCurrency(minB)} - R$ {formatCurrency(maxB)}
        </p>
        <div className="flex items-center gap-4">
          <p className="text-[14px] text-[#333333] flex items-center gap-2">
            🛏 {base.bedrooms || 0} dorm
          </p>
          <p className="text-[14px] text-[#333333] flex items-center gap-2">
            🚗 {base.parkingSpots || 0} vagas
          </p>
        </div>
        <p className="text-[14px] text-[#333333] flex items-center gap-2">🏷️ {base.type}</p>
        <p className="text-[14px] mt-2 font-bold text-[#1A3A52]">
          👥 {clientCount} clientes interessados
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-4 shrink-0">
        <Button
          className="flex-1 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold h-auto min-h-[44px] py-2 whitespace-normal leading-tight text-[12px] md:text-[13px]"
          onClick={onEncontrei}
        >
          ✅ ENCONTREI IMÓVEL PARA ESTE GRUPO
        </Button>
        <Button
          className="sm:w-auto min-h-[44px] bg-[#FFFFFF] hover:bg-[#F5F5F5] text-[#F44336] border border-[#F44336]/30 font-bold text-[12px] md:text-[13px]"
          onClick={onNaoEncontrei}
        >
          ❌ Não Encontrei
        </Button>
      </div>
    </div>
  )
}

export function IndividualCard({ demand, onEncontrei, onNaoEncontrei, creatorName }: any) {
  return (
    <div className="flex flex-col bg-[#FFFFFF] border-[2px] border-[#2E5F8A] rounded-[12px] p-5 shadow-sm h-full gap-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <Badge className="bg-[#2E5F8A] text-white font-bold text-[12px] border-none shadow-none">
          👤 INDIVIDUAL
        </Badge>
      </div>

      <div className="flex flex-col gap-2.5 flex-grow">
        <p className="text-[16px] font-black text-[#1A3A52] break-words">👤 {demand.clientName}</p>
        <p className="text-[15px] text-[#333333] flex items-center gap-2">
          📍 <strong className="truncate">{demand.location}</strong>
        </p>
        <p className="text-[14px] text-[#333333] flex items-center gap-2">
          🏠 <span>Imóvel Residencial</span>
        </p>
        <p className="text-[15px] font-bold text-[#1A3A52] flex items-center gap-2">
          💰 R$ {formatCurrency(demand.minBudget || demand.budget || 0)} - R${' '}
          {formatCurrency(demand.maxBudget || demand.budget || 0)}
        </p>
        <div className="flex items-center gap-4">
          <p className="text-[14px] text-[#333333] flex items-center gap-2">
            🛏 {demand.bedrooms || 0} dorm
          </p>
          <p className="text-[14px] text-[#333333] flex items-center gap-2">
            🚗 {demand.parkingSpots || 0} vagas
          </p>
        </div>
        <p className="text-[14px] text-[#333333] flex items-center gap-2">🏷️ {demand.type}</p>
        <p className="text-[13px] text-[#999999] mt-2 font-medium">
          👤 Solicitado por: {creatorName}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-4 shrink-0">
        <Button
          className="flex-1 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold h-auto min-h-[44px] py-2 whitespace-normal leading-tight text-[12px] md:text-[13px]"
          onClick={onEncontrei}
        >
          ✅ ENCONTREI IMÓVEL
        </Button>
        <Button
          className="sm:w-auto min-h-[44px] bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#F44336] border border-[#F44336]/20 font-bold text-[12px] md:text-[13px]"
          onClick={onNaoEncontrei}
        >
          ❌ Não Encontrei
        </Button>
      </div>
    </div>
  )
}

export function LooseCard({ demand, onEncontrei, onNaoEncontrei }: any) {
  return (
    <div className="flex flex-col bg-[#E8F5E9] border-[2px] border-[#4CAF50] rounded-[12px] p-5 shadow-sm h-full gap-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <Badge className="bg-[#4CAF50] text-white font-bold text-[12px] border-none shadow-none">
          🔓 DISPONÍVEL PARA TODOS
        </Badge>
      </div>

      <div className="flex flex-col gap-2.5 flex-grow">
        <p className="text-[15px] text-[#333333] flex items-center gap-2">
          📍 <strong className="truncate">{demand.location}</strong>
        </p>
        <p className="text-[14px] text-[#333333] flex items-center gap-2">
          🏠 <span>Imóvel Residencial</span>
        </p>
        <p className="text-[15px] font-black text-[#4CAF50] flex items-center gap-2">
          💰 R$ {formatCurrency(demand.minBudget || demand.budget || 0)} - R${' '}
          {formatCurrency(demand.maxBudget || demand.budget || 0)}
        </p>
        <div className="flex items-center gap-4">
          <p className="text-[14px] text-[#333333] flex items-center gap-2">
            🛏 {demand.bedrooms || 0} dorm
          </p>
          <p className="text-[14px] text-[#333333] flex items-center gap-2">
            🚗 {demand.parkingSpots || 0} vagas
          </p>
        </div>
        <p className="text-[14px] text-[#333333] flex items-center gap-2">🏷️ {demand.type}</p>

        <div className="mt-3 bg-[#4CAF50]/10 p-3 rounded-[8px] flex gap-2 items-start">
          <span className="text-[16px] shrink-0 mt-0.5">ℹ️</span>
          <span className="text-[13px] text-[#2E7D32] font-medium leading-tight">
            Nenhum cliente específico — qualquer imóvel que se encaixe serve!
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-4 shrink-0">
        <Button
          className="flex-1 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold h-auto min-h-[44px] py-2 whitespace-normal leading-tight text-[12px] md:text-[13px]"
          onClick={onEncontrei}
        >
          ✅ ENCONTREI IMÓVEL
        </Button>
        <Button
          className="sm:w-auto min-h-[44px] bg-[#FFFFFF] hover:bg-[#F5F5F5] text-[#F44336] border border-[#F44336]/30 font-bold text-[12px] md:text-[13px]"
          onClick={onNaoEncontrei}
        >
          ❌ Não Encontrei
        </Button>
      </div>
    </div>
  )
}
