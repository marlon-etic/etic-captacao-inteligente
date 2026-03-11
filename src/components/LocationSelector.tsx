import React, { useState } from 'react'
import { MapPin, Circle, Check, X, Search, ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
  DrawerHeader,
} from '@/components/ui/drawer'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { regionsData } from '@/lib/regions'

interface LocationSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function LocationSelector({ value = [], onChange }: LocationSelectorProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')

  const handleSelectAnchor = (anchor: string, satellites: string[]) => {
    const allItems = [anchor, ...satellites]
    const isAllSelected = allItems.every((i) => value.includes(i))
    if (isAllSelected) {
      onChange(value.filter((i) => !allItems.includes(i)))
    } else {
      onChange(Array.from(new Set([...value, ...allItems])))
    }
  }

  const handleSelect = (item: string) => {
    if (value.includes(item)) onChange(value.filter((i) => i !== item))
    else onChange([...value, item])
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const ListContent = () => (
    <Command shouldFilter={false} className="border-0">
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Buscar bairros..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <CommandList className="max-h-[50vh] overflow-y-auto pb-2">
        {search.length > 0 &&
          regionsData.every(
            (r) =>
              !r.anchor.toLowerCase().includes(search.toLowerCase()) &&
              !r.satellites.some((s) => s.toLowerCase().includes(search.toLowerCase())),
          ) && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum bairro encontrado para '{search}'
            </div>
          )}

        {regionsData.map((region) => {
          const matchAnchor = region.anchor.toLowerCase().includes(search.toLowerCase())
          const matchedSatellites = region.satellites.filter((s) =>
            s.toLowerCase().includes(search.toLowerCase()),
          )

          if (search && !matchAnchor && matchedSatellites.length === 0) return null

          const allRegionItems = [region.anchor, ...region.satellites]
          const isAnchorSelected = allRegionItems.every((i) => value.includes(i))

          return (
            <CommandGroup key={region.anchor} className="mt-2">
              {(!search || matchAnchor) && (
                <CommandItem
                  onSelect={() => handleSelectAnchor(region.anchor, region.satellites)}
                  className="flex items-center gap-2 font-semibold text-primary/90 mb-1 cursor-pointer"
                >
                  <MapPin className="h-4 w-4" />
                  <span>{region.anchor} (Região Completa)</span>
                  {isAnchorSelected && <Check className="h-4 w-4 text-primary ml-auto" />}
                </CommandItem>
              )}
              {(search ? matchedSatellites : region.satellites).map((satellite) => (
                <CommandItem
                  key={satellite}
                  onSelect={() => handleSelect(satellite)}
                  className="pl-8 flex items-center gap-2 cursor-pointer"
                >
                  <Circle className="h-2 w-2 opacity-50" />
                  <span>{satellite}</span>
                  {value.includes(satellite) && <Check className="h-4 w-4 text-primary ml-auto" />}
                </CommandItem>
              ))}
            </CommandGroup>
          )
        })}
      </CommandList>
    </Command>
  )

  const triggerText =
    value.length > 0 ? `${value.length} bairro(s) selecionado(s)` : 'Selecione os bairros'

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-auto min-h-[2.5rem] py-2 bg-background"
          >
            <span className={cn('truncate', !value.length && 'text-muted-foreground')}>
              {triggerText}
            </span>
            <div className="flex items-center gap-2">
              {value.length > 0 && (
                <X className="h-4 w-4 opacity-50 hover:opacity-100" onClick={clearAll} />
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh]">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle>Bairros de Interesse</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden flex flex-col">
            <ListContent />
          </div>
          <div className="p-4 border-t mt-auto">
            <Button className="w-full" onClick={() => setOpen(false)}>
              Confirmar
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-auto min-h-[2.5rem] py-2 bg-background hover:bg-background"
        >
          <span className={cn('truncate', !value.length && 'text-muted-foreground')}>
            {triggerText}
          </span>
          <div className="flex items-center gap-2">
            {value.length > 0 && (
              <X className="h-4 w-4 opacity-50 hover:opacity-100" onClick={clearAll} />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <ListContent />
      </PopoverContent>
    </Popover>
  )
}
