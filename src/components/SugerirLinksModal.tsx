import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { z } from 'zod'

interface SugerirLinksDemand {
  id: string
  tipo: string
  links_sugeridos?: string[] | null
}

export function SugerirLinksModal({
  demanda,
  open,
  onOpenChange,
  onSuccess,
}: {
  demanda: SugerirLinksDemand
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (links: string[]) => void
}) {
  const { toast } = useToast()
  const [url, setUrl] = useState('')
  const [links, setLinks] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setLinks(demanda.links_sugeridos || [])
      setUrl('')
    }
  }, [open, demanda.links_sugeridos])

  const handleAddLink = () => {
    if (!url.trim()) return
    const schema = z.string().url()
    const normalizedUrl =
      url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    const result = schema.safeParse(normalizedUrl)
    if (!result.success) {
      toast({
        title: 'URL Inválida',
        description: 'Por favor, insira um link válido para o imóvel.',
        variant: 'destructive',
      })
      return
    }
    if (links.includes(result.data)) {
      toast({
        title: 'Link já adicionado',
        description: 'Este link já está na lista.',
        variant: 'destructive',
      })
      return
    }
    setLinks([...links, result.data])
    setUrl('')
  }

  const handleRemoveLink = (linkToRemove: string) => {
    setLinks(links.filter((l) => l !== linkToRemove))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const table =
        demanda.tipo === 'locacao' || demanda.tipo === 'Aluguel'
          ? 'demandas_locacao'
          : 'demandas_vendas'
      const { error } = await supabase
        .from(table)
        .update({ links_sugeridos: links })
        .eq('id', demanda.id)

      if (error) throw error

      toast({
        title: 'Links Salvos',
        description: 'Os links já estão visíveis para os captadores.',
        className: 'bg-[#10B981] text-white border-none',
      })
      onSuccess(links)
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100%-32px)] sm:max-w-[500px] p-4 md:p-6 rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[16px] md:text-[18px] font-bold text-[#1A3A52]">
            <LinkIcon className="w-5 h-5 text-[#2E5F8A]" /> Sugerir Imóveis para Captação
          </DialogTitle>
          <DialogDescription className="text-[14px] text-[#333333]">
            Adicione links de referência para guiar os captadores na busca por imóveis com o perfil
            desejado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddLink()
                }
              }}
              placeholder="Ex: https://portal.com.br/imovel/123"
              className="flex-1"
            />
            <Button
              onClick={handleAddLink}
              className="bg-[#2E5F8A] hover:bg-[#1A3A52] text-white px-3"
              size="icon"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Links Adicionados ({links.length})
            </h4>
            {links.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nenhum link adicionado ainda.</p>
            ) : (
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
                {links.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-100"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#2E5F8A] hover:underline truncate max-w-[80%] flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{link}</span>
                    </a>
                    <button
                      onClick={() => handleRemoveLink(link)}
                      className="text-red-500 hover:text-red-700 p-1 shrink-0"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-[#10B981] hover:bg-[#059669] text-white font-bold"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Sugestões'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
