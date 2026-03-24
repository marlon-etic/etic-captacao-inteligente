import React, { useState } from 'react'
import { Check, ChevronDown, Star, Diamond, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/hooks/use-mobile'
import { REGIONS_DATA } from '@/lib/regions'

interface BairroItemProps {
  nome: string
  isAncora: boolean
  isSelected: boolean
  onChange: (nome: string) => void
}

const BairroItem = React.memo(({ nome, isAncora, isSelected, onChange }: BairroItemProps) => {
  return (
    <div
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onChange(nome)
      }}
      className={cn(
        'group flex items-center gap-3 py-3 cursor-pointer transition-colors duration-200 min-h-[44px]',
        isAncora ? 'px-4 bg-white' : 'pl-[36px] pr-4 bg-white',
        isSelected ? 'bg-[#EFF6FF] hover:bg-[#E0E7FF]' : 'hover:bg-[#F3F4F6] active:bg-[#EFF6FF]',
      )}
    >
      <div
        className={cn(
          'h-5 w-5 rounded-[4px] border-[2px] flex items-center justify-center shrink-0 transition-all duration-200',
          isSelected ? 'bg-[#10B981] border-[#10B981]' : 'bg-white border-[#6B7280]',
        )}
      >
        {isSelected && (
          <Check className="h-3.5 w-3.5 text-white stroke-[3] animate-in zoom-in-50 duration-200" />
        )}
      </div>

      {isAncora ? (
        <Star
          className={cn(
            'h-4 w-4 shrink-0 transition-colors duration-200',
            isSelected ? 'text-[#10B981] fill-[#10B981]' : 'text-[#1E3A8A] fill-[#1E3A8A]',
          )}
        />
      ) : (
        <Diamond
          className={cn(
            'h-3 w-3 shrink-0 transition-colors duration-200',
            isSelected ? 'text-[#10B981] fill-[#10B981]' : 'text-[#38BDF8] fill-[#38BDF8]',
          )}
        />
      )}

      <span
        className={cn(
          'text-[14px] transition-colors duration-200',
          isAncora ? 'font-bold' : 'font-medium',
          isSelected ? 'text-[#10B981]' : 'text-[#6B7280]',
        )}
      >
        {nome}
      </span>
    </div>
  )
})
BairroItem.displayName = 'BairroItem'

export interface BairroSelectorProps {
  selectedBairros: string[]
  toggleAncora: (nome: string) => void
  toggleSatelite: (nome: string) => void
  onClear: () => void
  isSaving?: boolean
  saveStatus?: 'saving' | 'success' | 'error' | null
  error?: boolean
}

export function BairroSelector({
  selectedBairros,
  toggleAncora,
  toggleSatelite,
  onClear,
  saveStatus = null,
  error = false,
}: BairroSelectorProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  const displayValueNode = () => {
    if (!selectedBairros || selectedBairros.length === 0)
      return (
        <span className="text-[#999999] truncate flex-1 text-left">Selecione os bairros...</span>
      )
    if (selectedBairros.length <= 2)
      return (
        <span className="text-[#1A3A52] font-bold truncate flex-1 text-left">
          {selectedBairros.join(', ')}
        </span>
      )
    return (
      <span className="text-[#1A3A52] font-bold truncate flex-1 text-left">
        {selectedBairros.length} bairros selecionados
      </span>
    )
  }

  const listContentNode = (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="flex-1 overflow-y-auto overscroll-contain bg-white pb-6 min-h-0 pt-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onWheel={(e) => e.stopPropagation()}
        onWheelCapture={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchMoveCapture={(e) => e.stopPropagation()}
      >
        {REGIONS_DATA.map((region) => (
          <div
            key={region.anchor}
            className="border-b border-[#F3F4F6] last:border-0 flex flex-col"
          >
            <BairroItem
              nome={region.anchor}
              isAncora={true}
              isSelected={selectedBairros.includes(region.anchor)}
              onChange={toggleAncora}
            />
            {region.satellites.map((satelite) => (
              <BairroItem
                key={satelite}
                nome={satelite}
                isAncora={false}
                isSelected={selectedBairros.includes(satelite)}
                onChange={toggleSatelite}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-[#E0E0E0] flex items-center justify-between bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-10">
        <Button
          type="button"
          variant="ghost"
          className="text-[#999999] hover:text-[#333333] font-bold px-4 h-[40px]"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClear()
          }}
        >
          Limpar tudo
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#6B7280] font-medium hidden sm:inline-block">
            {selectedBairros.length} selecionados
          </span>
          <Button
            type="button"
            className="bg-[#1A3A52] hover:bg-[#2E5F8A] text-white font-bold px-6 h-[40px]"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setOpen(false)
            }}
          >
            Concluir
          </Button>
        </div>
      </div>
    </div>
  )

  const triggerButtonNode = (
    <div
      className={cn(
        'flex min-h-[48px] w-full items-center justify-between rounded-[8px] border bg-[#FFFFFF] px-[16px] py-[12px] text-[16px] hover:border-[#1A3A52] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A3A52] focus:ring-offset-0 cursor-pointer select-none',
        error ? 'border-2 border-[#FF4444]' : 'border-[#E0E0E0]',
        open && 'border-[#1A3A52] ring-2 ring-[#1A3A52] ring-offset-0',
      )}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center gap-2 flex-1 overflow-hidden">
        {displayValueNode()}

        {saveStatus === 'saving' && (
          <Badge
            variant="secondary"
            className="bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE] font-medium text-[10px] px-2 py-0 h-[22px] shrink-0"
          >
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Salvando...
          </Badge>
        )}
        {saveStatus === 'success' && (
          <Badge
            variant="secondary"
            className="bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] font-medium text-[10px] px-2 py-0 h-[22px] shrink-0"
          >
            <Check className="h-3 w-3 mr-1" /> Salvo
          </Badge>
        )}
      </div>
      <ChevronDown className="h-4 w-4 shrink-0 opacity-50 text-[#1A3A52] ml-2" />
    </div>
  )

  if (isMobile) {
    return (
      <>
        {triggerButtonNode}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-screen h-[100dvh] max-w-none m-0 p-0 rounded-none flex flex-col bg-white overflow-hidden gap-0 z-[99999] animate-in slide-in-from-bottom-full duration-300">
            <DialogHeader className="p-4 border-b border-[#E0E0E0] shrink-0 bg-[#F5F5F5] flex flex-row items-center justify-between">
              <DialogTitle className="text-[18px] font-bold text-[#1A3A52] m-0">
                Selecionar Bairros
              </DialogTitle>
              <DialogClose asChild>
                <button className="h-8 w-8 flex items-center justify-center rounded-full bg-[#E0E0E0] hover:bg-[#D1D5DB] text-[#333333] transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </DialogHeader>
            <div className="flex-1 overflow-hidden min-h-0 bg-white flex flex-col">
              {listContentNode}
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="w-full relative">{triggerButtonNode}</div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0 border-[#E0E0E0] shadow-2xl rounded-[12px] z-[9999] overflow-hidden flex flex-col bg-white"
        style={{ maxHeight: '450px' }}
        align="start"
        sideOffset={8}
      >
        {listContentNode}
      </PopoverContent>
    </Popover>
  )
}
