import { useState, useMemo } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { BAIRROS_ETIC } from '@/lib/bairros'
import { useIsMobile } from '@/hooks/use-mobile'

interface LocationSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  const handleSelect = (currentValue: string) => {
    const selected = value.includes(currentValue)
      ? value.filter((v) => v !== currentValue)
      : [...value, currentValue]
    onChange(selected)
  }

  const handleRemove = (itemToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== itemToRemove))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className="flex min-h-[48px] w-full items-center justify-between rounded-[8px] border-[1.5px] border-[#2E5F8A]/30 bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#1A3A52] hover:border-[#2E5F8A]/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A3A52] focus:ring-offset-0 relative"
        >
          <div className="flex flex-wrap gap-1 pr-6 flex-1 h-full items-center">
            {value.length === 0 ? (
              <span className="text-[#999999] font-medium ml-1">
                Selecione um ou mais bairros...
              </span>
            ) : (
              value.map((v) => (
                <Badge
                  key={v}
                  variant="secondary"
                  className="bg-[#1A3A52] text-white hover:bg-[#1A3A52] px-2 py-0.5 h-[28px] rounded-md text-[12px] font-bold"
                >
                  {v}
                  <X
                    className="ml-1.5 h-3.5 w-3.5 cursor-pointer text-white/70 hover:text-white"
                    onClick={(e) => handleRemove(v, e)}
                  />
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 text-[#1A3A52] absolute right-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-full p-0 border-[#2E5F8A]/20',
          isMobile ? 'w-[calc(100vw-48px)]' : 'w-[400px]',
        )}
        align="start"
      >
        <Command>
          <CommandInput placeholder="Buscar bairro..." className="h-12 text-[14px]" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-sm text-[#999999]">
              Nenhum bairro encontrado.
            </CommandEmpty>
            <CommandGroup>
              {BAIRROS_ETIC.map((bairro) => (
                <CommandItem
                  key={bairro}
                  value={bairro}
                  onSelect={() => handleSelect(bairro)}
                  className="flex items-center gap-2 py-3 px-4 cursor-pointer hover:bg-[#F5F5F5] aria-selected:bg-[#F5F5F5] min-h-[48px]"
                >
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-md border border-[#2E5F8A]/30',
                      value.includes(bairro) ? 'bg-[#1A3A52] border-[#1A3A52]' : 'bg-transparent',
                    )}
                  >
                    {value.includes(bairro) && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <span className="font-medium text-[#1A3A52] text-[14px]">{bairro}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
