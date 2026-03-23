import { useState, useMemo, useEffect } from 'react'
import { Check, ChevronDown, X, Search as SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { REGIONS_DATA, normalizeString } from '@/lib/regions'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'

interface LocationSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
  error?: boolean
}

export function LocationSelector({ value = [], onChange, error }: LocationSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [tempValue, setTempValue] = useState<string[]>(value)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (open) setTempValue(value)
  }, [open, value])

  const filteredRegions = useMemo(() => {
    if (!search) return REGIONS_DATA
    const term = normalizeString(search)
    return REGIONS_DATA.map((r) => {
      const isAnchorMatch = normalizeString(r.anchor).includes(term)
      const matchingSatellites = r.satellites.filter((s) => normalizeString(s).includes(term))
      if (isAnchorMatch) return r
      if (matchingSatellites.length > 0) return { ...r, satellites: matchingSatellites }
      return null
    }).filter(Boolean) as typeof REGIONS_DATA
  }, [search])

  const handleToggleRegion = (region: (typeof REGIONS_DATA)[0]) => {
    const regionItems = [region.anchor, ...region.satellites]
    const allSelected = regionItems.every((item) => tempValue.includes(item))

    if (allSelected) {
      setTempValue((prev) => prev.filter((item) => !regionItems.includes(item)))
    } else {
      setTempValue((prev) => Array.from(new Set([...prev, ...regionItems])))
    }
  }

  const handleToggleItem = (item: string) => {
    setTempValue((prev) => (prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]))
  }

  const handleConfirm = () => {
    onChange(tempValue)
    setOpen(false)
    setSearch('')
  }

  const handleClear = () => {
    setTempValue([])
  }

  const displayValue = () => {
    if (value.length === 0) return <span className="text-[#999999]">Selecione os bairros...</span>
    if (value.length === 1)
      return <span className="text-[#333333] font-bold">1 bairro selecionado</span>
    return <span className="text-[#333333] font-bold">{value.length} bairros selecionados</span>
  }

  const ListContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-[#E0E0E0] shrink-0 sticky top-0 bg-white z-10">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999999]" />
          <input
            type="text"
            placeholder="🔍 Buscar bairro..."
            className="w-full h-[40px] pl-9 pr-4 rounded-[8px] bg-[#F5F5F5] border-transparent focus:outline-none focus:ring-2 focus:ring-[#1A3A52] text-[14px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="p-2 space-y-2 pb-6">
          {filteredRegions.length === 0 ? (
            <p className="text-center text-[#999999] text-[14px] py-6">
              Nenhum bairro encontrado para "{search}"
            </p>
          ) : (
            filteredRegions.map((region) => {
              const regionItems = [region.anchor, ...region.satellites]
              const visibleItemsCount = region.satellites.length + 1
              const selectedInRegion = regionItems.filter((i) => tempValue.includes(i)).length
              const allSelected = selectedInRegion === visibleItemsCount && visibleItemsCount > 0

              return (
                <div
                  key={region.anchor}
                  className="flex flex-col rounded-[8px] border border-[#E0E0E0] overflow-hidden"
                >
                  <div
                    className={cn(
                      'flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-[#E8F0F8]',
                      allSelected ? 'bg-[#E8F0F8]' : 'bg-[#F0F4F8]',
                    )}
                    onClick={() => handleToggleRegion(region)}
                  >
                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-[2px] transition-colors',
                        allSelected ? 'bg-[#1A3A52] border-[#1A3A52]' : 'bg-white border-[#999999]',
                      )}
                    >
                      {allSelected && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <span className="font-bold text-[14px] uppercase tracking-wide text-[#1A3A52]">
                      📍 {region.anchor}
                    </span>
                  </div>

                  {region.satellites.map((satellite) => {
                    const isSelected = tempValue.includes(satellite)
                    return (
                      <div
                        key={satellite}
                        className={cn(
                          'flex items-center gap-3 h-[40px] pl-[44px] pr-3 cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-[#E8F0F8] text-[#1A3A52]'
                            : 'hover:bg-[#F5F5F5] text-[#333333]',
                        )}
                        onClick={() => handleToggleItem(satellite)}
                      >
                        <div
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-[2px] transition-colors',
                            isSelected
                              ? 'bg-[#1A3A52] border-[#1A3A52]'
                              : 'bg-white border-[#999999]',
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span
                          className={cn('text-[14px]', isSelected ? 'font-bold' : 'font-medium')}
                        >
                          {satellite}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="p-3 border-t border-[#E0E0E0] flex items-center justify-between bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Button
          variant="ghost"
          className="text-[#999999] hover:text-[#333333] font-bold px-4"
          onClick={handleClear}
        >
          Limpar tudo
        </Button>
        <Button
          className="bg-[#1A3A52] hover:bg-[#2E5F8A] text-white font-bold px-6"
          onClick={handleConfirm}
        >
          Confirmar
        </Button>
      </div>
    </div>
  )

  const TriggerButton = () => (
    <div
      className={cn(
        'flex h-[48px] w-full items-center justify-between rounded-[8px] border bg-[#FFFFFF] px-[16px] py-[12px] text-[16px] hover:border-[#1A3A52] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A3A52] focus:ring-offset-0 cursor-pointer select-none',
        error ? 'border-2 border-[#FF4444]' : 'border-[#E0E0E0]',
        open && 'border-[#1A3A52] ring-2 ring-[#1A3A52] ring-offset-0',
      )}
      onClick={() => setOpen(!open)}
    >
      {displayValue()}
      <ChevronDown className="h-4 w-4 shrink-0 opacity-50 text-[#1A3A52]" />
    </div>
  )

  if (isMobile) {
    return (
      <>
        <TriggerButton />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-screen h-screen max-w-none m-0 p-0 rounded-none flex flex-col bg-white overflow-hidden gap-0 z-[99999]">
            <DialogHeader className="p-4 border-b border-[#E0E0E0] shrink-0 bg-[#F5F5F5] flex flex-row items-center justify-between">
              <DialogTitle className="text-[18px] font-bold text-[#1A3A52] m-0">
                Selecionar Bairros
              </DialogTitle>
              <DialogClose asChild>
                <button className="h-8 w-8 flex items-center justify-center rounded-full bg-[#E0E0E0] text-[#333333]">
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </DialogHeader>
            <div className="flex-1 overflow-hidden min-h-0 bg-white flex flex-col">
              <ListContent />
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="w-full relative">
          <TriggerButton />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0 border-[#E0E0E0] shadow-lg rounded-[12px] z-[9999] overflow-hidden flex flex-col bg-white"
        style={{ maxHeight: '380px' }}
        align="start"
        sideOffset={8}
      >
        <ListContent />
      </PopoverContent>
    </Popover>
  )
}
