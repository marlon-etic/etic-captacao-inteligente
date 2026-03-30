import { useState, useMemo } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BAIRROS_ETIC } from '@/lib/bairros'

interface BairroComboboxProps {
  value: string
  onChange: (value: string) => void
  error?: boolean
  disabled?: boolean
}

export function BairroCombobox({ value, onChange, error, disabled }: BairroComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredBairros = useMemo(() => {
    if (!search) return BAIRROS_ETIC
    const searchLower = search.toLowerCase()
    return BAIRROS_ETIC.filter((b) => b.toLowerCase().includes(searchLower))
  }, [search])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearch('')
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal min-h-[48px]',
            !value && 'text-muted-foreground',
            error ? 'border-red-500 ring-red-500' : '',
          )}
        >
          {value ? value : 'Selecione o bairro...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 z-[1060]"
        align="start"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Buscar bairro..."
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-none shadow-none focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()} // Evita que atalhos (como espaço) fechem o popover
            autoFocus
          />
        </div>

        {/* Substituído ScrollArea por div com scroll nativo para corrigir problema de mouse wheel travado */}
        <div
          className="max-h-[300px] overflow-y-auto overscroll-contain touch-pan-y p-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {filteredBairros.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Nenhum bairro encontrado.
            </p>
          ) : (
            filteredBairros.map((bairro, index) => (
              <div
                key={`bairro-${index}-${bairro}`}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  value === bairro ? 'bg-accent text-accent-foreground font-medium' : '',
                )}
                onClick={() => {
                  onChange(bairro)
                  setOpen(false)
                  setSearch('')
                }}
              >
                <Check
                  className={cn('mr-2 h-4 w-4', value === bairro ? 'opacity-100' : 'opacity-0')}
                />
                {bairro}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
