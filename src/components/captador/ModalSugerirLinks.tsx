import React, { useState } from 'react'
import { Demand } from './BuscarDemandas'
import { Button } from '@/components/ui/button'
import { X, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { z } from 'zod'

export function ModalSugerirLinks({
  demanda,
  onClose,
  onSuccess,
}: {
  demanda: Demand
  onClose: () => void
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [url, setUrl] = useState('')
  const [links, setLinks] = useState<string[]>(demanda.links_sugeridos || [])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddLink = () => {
    if (!url.trim()) return

    const schema = z.string().url()
    const result = schema.safeParse(
      url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`,
    )

    if (!result.success) {
      toast({
        title: 'URL Inválida',
        description: 'Por favor, insira um link válido para o imóvel.',
        variant: 'destructive',
      })
      return
    }

    const validUrl = result.data
    if (links.includes(validUrl)) {
      toast({
        title: 'Link já adicionado',
        description: 'Este link já está na lista.',
        variant: 'destructive',
      })
      return
    }

    setLinks([...links, validUrl])
    setUrl('')
  }

  const handleRemoveLink = (linkToRemove: string) => {
    setLinks(links.filter((l) => l !== linkToRemove))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const table = demanda.tipo === 'locacao' ? 'demandas_locacao' : 'demandas_vendas'
      const { error } = await supabase
        .from(table)
        .update({ links_sugeridos: links })
        .eq('id', demanda.id)

      if (error) throw error

      toast({
        title: 'Links Sugeridos',
        description: 'Os links foram salvos e já estão visíveis para os captadores.',
        className: 'bg-[#10B981] text-white border-none',
      })
      onSuccess()
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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#F8FAFC]">
          <h3 className="text-lg font-bold text-[#1A3A52] flex items-center gap-2">
            🔗 Sugerir Imóveis para Captação
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-700 bg-blue-50 text-blue-800 p-3 rounded-md border border-blue-100">
            Estes links ajudarão a equipe de captadores a prospectar imóveis com perfil similar ao
            deste cliente.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Adicionar Link de Referência
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                placeholder="Ex: https://portal.com.br/imovel/123"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E5F8A]/50 focus:border-[#2E5F8A]"
              />
              <Button
                onClick={handleAddLink}
                className="bg-[#2E5F8A] hover:bg-[#1A3A52] text-white px-3"
              >
                <Plus size={18} />
              </Button>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Links Adicionados ({links.length})
            </h4>
            {links.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nenhum link adicionado ainda.</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {links.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-100"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#2E5F8A] hover:underline truncate max-w-[85%]"
                    >
                      {link}
                    </a>
                    <button
                      onClick={() => handleRemoveLink(link)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#10B981] hover:bg-[#059669] text-white font-bold"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Sugestões'}
          </Button>
        </div>
      </div>
    </div>
  )
}
