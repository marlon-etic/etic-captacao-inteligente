import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { REGIONS_DATA } from '@/lib/regions'

interface UseBairrosSelectionProps {
  initialBairros?: string[]
  demandId?: string
  demandType?: 'Aluguel' | 'Venda'
  onChange?: (bairros: string[]) => void
}

export function useBairrosSelection(props?: UseBairrosSelectionProps) {
  const { initialBairros = [], demandId, demandType, onChange } = props || {}

  const [selectedBairros, setSelectedBairros] = useState<string[]>(initialBairros)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saving' | 'success' | 'error' | null>(null)

  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (JSON.stringify(initialBairros) !== JSON.stringify(selectedBairros)) {
      setSelectedBairros(initialBairros)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBairros])

  const saveBairrosToSupabase = useCallback(
    async (bairrosToSave: string[]) => {
      if (!demandId || !demandType) return

      setIsSaving(true)
      setSaveStatus('saving')

      try {
        const table = demandType === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
        const { error } = await supabase
          .from(table)
          .update({ bairros: bairrosToSave })
          .eq('id', demandId)

        if (error) throw error

        setSaveStatus('success')
        toast({
          title: 'Bairros salvos com sucesso',
          className: 'bg-[#10B981] text-white border-transparent',
          duration: 2000,
        })

        setTimeout(() => setSaveStatus(null), 2000)
      } catch (err: any) {
        setSaveStatus('error')
        toast({
          title: 'Erro ao salvar bairros. Tente novamente.',
          description: 'Clique nesta notificação para tentar novamente.',
          variant: 'destructive',
          duration: 10000,
          onClick: () => saveBairrosToSupabase(bairrosToSave),
        })
      } finally {
        setIsSaving(false)
      }
    },
    [demandId, demandType],
  )

  const handleChange = useCallback(
    (next: string[]) => {
      if (next.length === 0 && demandId) {
        toast({ title: 'Selecione pelo menos um bairro', variant: 'destructive' })
        return
      }

      if (next.length > 20) {
        toast({ title: 'Máximo 20 bairros permitidos', variant: 'destructive' })
        return
      }

      setSelectedBairros(next)
      if (onChange) onChange(next)

      if (demandId) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        setSaveStatus('saving')
        saveTimeoutRef.current = setTimeout(() => {
          saveBairrosToSupabase(next)
        }, 500)
      }
    },
    [onChange, demandId, saveBairrosToSupabase],
  )

  const toggleAncora = useCallback(
    (ancora: string) => {
      const region = REGIONS_DATA.find((r) => r.anchor === ancora)
      if (!region) return

      const allItems = [ancora, ...region.satellites]
      const isSelected = selectedBairros.includes(ancora)

      let next: string[]
      if (isSelected) {
        next = selectedBairros.filter((b) => !allItems.includes(b))
      } else {
        const toAdd = allItems.filter((b) => !selectedBairros.includes(b))
        next = [...selectedBairros, ...toAdd]
      }

      handleChange(next)
    },
    [selectedBairros, handleChange],
  )

  const toggleSatelite = useCallback(
    (satelite: string) => {
      const isSelected = selectedBairros.includes(satelite)

      let next: string[]
      if (isSelected) {
        next = selectedBairros.filter((b) => b !== satelite)
      } else {
        next = [...selectedBairros, satelite]
      }

      handleChange(next)
    },
    [selectedBairros, handleChange],
  )

  const clearAll = useCallback(() => {
    if (demandId) {
      toast({ title: 'Selecione pelo menos um bairro', variant: 'destructive' })
      return
    }
    handleChange([])
  }, [handleChange, demandId])

  return {
    selectedBairros,
    isSaving,
    saveStatus,
    toggleAncora,
    toggleSatelite,
    clearAll,
  }
}
