import { useState, useEffect } from 'react'
import { Filter, X, Search as SearchIcon, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { BAIRROS_ETIC } from '@/lib/bairros'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface FilterDef {
  id: string
  label: string
  options: { value: string; label: string; icon?: string }[]
  isSearch?: boolean
}

interface Props {
  filters: FilterDef[]
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  resultsCount: number
  stickyTop?: string
}

export function StickyFilterBar({
  filters,
  values,
  onChange,
  resultsCount,
  stickyTop = 'top-[72px]',
}: Props) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [mobileValues, setMobileValues] = useState(values)

  useEffect(() => {
    if (isOpen) setMobileValues(values)
  }, [isOpen, values])

  const defaultValues = filters.reduce(
    (acc, f) => {
      acc[f.id] = f.options[0]?.value || ''
      return acc
    },
    {} as Record<string, string>,
  )

  const activeCount = Object.keys(values).filter((k) => values[k] !== defaultValues[k]).length

  const handleMobileApply = () => {
    onChange(mobileValues)
    setIsOpen(false)
  }

  const handleClearAll = () => {
    onChange(defaultValues)
    setMobileValues(defaultValues)
  }

  const removeFilter = (id: string) => {
    onChange({ ...values, [id]: defaultValues[id] })
  }

  const renderActiveChips = () => {
    const active = Object.keys(values).filter((k) => values[k] !== defaultValues[k])
    if (active.length === 0) return null

    const visible = isMobile ? active.slice(0, 3) : active

    return (
      <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide px-1 py-1">
        {visible.map((id) => {
          const val = values[id]
          const def = filters.find((f) => f.id === id)
          const opt = def?.options.find((o) => o.value === val)
          const displayLabel = opt ? `${opt.icon ? opt.icon + ' ' : ''}${opt.label}` : val
          return (
            <Badge
              key={id}
              className="bg-[#1A3A52] text-white hover:bg-[#1A3A52] border-transparent flex items-center gap-1 shrink-0 h-[36px] px-3 whitespace-nowrap font-bold shadow-[0_2px_4px_rgba(26,58,82,0.1)]"
            >
              {displayLabel}
              <X
                className="w-3.5 h-3.5 ml-1.5 cursor-pointer hover:text-red-300 opacity-80 hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFilter(id)
                }}
              />
            </Badge>
          )
        })}
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className={cn('sticky z-30 bg-[#F5F5F5] pb-2 -mx-4 px-4 sm:mx-0 sm:px-0', stickyTop)}>
        <div className="flex flex-col gap-2">
          <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-2 flex items-center gap-3 shadow-[0_2px_8px_rgba(26,58,82,0.05)] min-h-[60px] w-full">
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  className="shrink-0 h-[52px] px-4 bg-[#FFFFFF] hover:bg-[#F5F5F5] text-[#1A3A52] border-[2px] border-[#2E5F8A]/20 font-bold w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    🔽 Filtros {activeCount > 0 && `(${activeCount})`}
                  </span>
                  <span className="text-[#999999] text-[12px] font-normal">
                    {resultsCount} res.
                  </span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh] h-[65vh] flex flex-col rounded-t-[24px] bg-[#F5F5F5] outline-none">
                <DrawerHeader className="px-6 py-4 text-left border-b border-[#E5E5E5] shrink-0 bg-[#F5F5F5]">
                  <DrawerTitle className="text-[20px] font-black text-[#1A3A52]">
                    Filtros
                  </DrawerTitle>
                </DrawerHeader>
                <ScrollArea className="flex-1 px-6 py-4 bg-white">
                  <div className="space-y-8 pb-6">
                    {filters.map((f) => (
                      <div key={f.id} className="space-y-3">
                        <h3 className="text-[13px] font-bold text-[#999999] uppercase tracking-wider">
                          {f.label}
                        </h3>
                        {f.isSearch ? (
                          <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
                            <Input
                              placeholder="Buscar bairro..."
                              className="pl-9 h-12 bg-[#F5F5F5] border-transparent focus-visible:ring-[#1A3A52] font-medium"
                              value={mobileValues[f.id] || ''}
                              onChange={(e) =>
                                setMobileValues((p) => ({ ...p, [f.id]: e.target.value }))
                              }
                            />
                            <div className="flex flex-wrap gap-2 mt-3">
                              {BAIRROS_ETIC.filter((b) =>
                                mobileValues[f.id]
                                  ? b.toLowerCase().includes(mobileValues[f.id].toLowerCase())
                                  : false,
                              )
                                .slice(0, 5)
                                .map((b) => (
                                  <Badge
                                    key={b}
                                    variant="outline"
                                    className="cursor-pointer bg-white h-8 hover:bg-[#F5F5F5]"
                                    onClick={() => setMobileValues((p) => ({ ...p, [f.id]: b }))}
                                  >
                                    {b}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {f.options.map((o) => {
                              const isSelected = mobileValues[f.id] === o.value
                              return (
                                <Button
                                  key={o.value}
                                  variant="outline"
                                  onClick={() =>
                                    setMobileValues((p) => ({ ...p, [f.id]: o.value }))
                                  }
                                  className={cn(
                                    'h-12 justify-start font-bold border-[2px] transition-all px-3',
                                    isSelected
                                      ? 'bg-[#1A3A52] text-white border-[#1A3A52] shadow-[0_2px_8px_rgba(26,58,82,0.2)]'
                                      : 'bg-white text-[#333333] border-[#E5E5E5] hover:border-[#1A3A52]/30 hover:bg-[#F5F5F5]',
                                  )}
                                >
                                  {o.icon && <span className="mr-2 text-[16px]">{o.icon}</span>}
                                  <span className="truncate">{o.label}</span>
                                </Button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 bg-white border-t border-[#E5E5E5] flex items-center justify-between gap-4 shrink-0 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                  <Button
                    variant="ghost"
                    onClick={handleClearAll}
                    className="font-bold text-[#999999] hover:bg-[#F5F5F5] hover:text-[#333333] h-12 px-2"
                  >
                    Limpar tudo
                  </Button>
                  <Button
                    onClick={handleMobileApply}
                    className="bg-[#1A3A52] hover:bg-[#2E5F8A] text-white font-bold h-12 flex-1 shadow-[0_4px_12px_rgba(26,58,82,0.2)]"
                  >
                    Ver resultados ({resultsCount})
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
          {activeCount > 0 && renderActiveChips()}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('sticky z-30 bg-[#F5F5F5] pb-4 -mx-4 px-4 sm:mx-0 sm:px-0', stickyTop)}>
      <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-3 flex items-center gap-3 shadow-[0_4px_12px_rgba(26,58,82,0.05)] min-h-[56px] flex-wrap">
        <span className="font-black text-[#1A3A52] mr-2 flex items-center gap-2 uppercase tracking-wide text-[14px]">
          <Filter className="w-4 h-4" /> Filtros
        </span>

        {filters.map((f) => {
          if (f.isSearch) {
            return (
              <div key={f.id} className="relative w-[220px]">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
                <Input
                  placeholder="Buscar bairro..."
                  className="pl-9 h-[44px] bg-[#F5F5F5] border-transparent focus-visible:ring-[#1A3A52] font-medium transition-all"
                  value={values[f.id] || ''}
                  onChange={(e) => onChange({ ...values, [f.id]: e.target.value })}
                />
              </div>
            )
          }

          const currentOpt = f.options.find((o) => o.value === values[f.id]) || f.options[0]
          const isActive = values[f.id] !== f.options[0]?.value

          return (
            <DropdownMenu key={f.id}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'h-[44px] font-bold border-[2px] transition-all px-4',
                    isActive
                      ? 'bg-[#1A3A52] text-white border-[#1A3A52] shadow-[0_2px_8px_rgba(26,58,82,0.2)]'
                      : 'bg-white text-[#333333] border-[#E5E5E5] hover:border-[#1A3A52]/30 hover:bg-[#F5F5F5]',
                  )}
                >
                  {currentOpt?.icon && <span className="mr-2 text-[16px]">{currentOpt.icon}</span>}
                  {currentOpt?.label} <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[220px] p-2 border-[#E5E5E5] shadow-lg rounded-xl"
              >
                {f.options.map((o) => (
                  <DropdownMenuItem
                    key={o.value}
                    className={cn(
                      'font-medium cursor-pointer rounded-[8px] py-2.5 mb-1 last:mb-0',
                      values[f.id] === o.value
                        ? 'bg-[#1A3A52] text-white font-bold'
                        : 'hover:bg-[#F5F5F5] text-[#333333]',
                    )}
                    onClick={() => onChange({ ...values, [f.id]: o.value })}
                  >
                    {o.icon && <span className="mr-2 text-[16px]">{o.icon}</span>}
                    {o.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        })}

        {activeCount > 0 && (
          <Button
            variant="ghost"
            onClick={handleClearAll}
            className="ml-auto font-bold text-[#F44336] hover:bg-[#F44336]/10 h-[44px] px-4 rounded-[8px]"
          >
            <X className="w-4 h-4 mr-2" /> Limpar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
