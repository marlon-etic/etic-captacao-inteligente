import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'

export default function AdminProperties() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [properties, setProperties] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminAndFetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const checkAdminAndFetch = async () => {
    if (!user) {
      navigate('/')
      return
    }

    setIsLoading(true)

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()

    if (profile?.role !== 'admin') {
      toast({
        title: 'Acesso Restrito',
        description: 'Acesso restrito a administradores.',
        variant: 'destructive',
      })
      navigate('/app')
      return
    }

    setIsAdmin(true)
    await fetchProperties()
  }

  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from('imoveis_captados')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({ title: 'Erro', description: 'Falha ao carregar imóveis.', variant: 'destructive' })
      setIsLoading(false)
      return
    }

    const userIds = [
      ...new Set(data.map((p) => p.user_captador_id || p.captador_id).filter(Boolean)),
    ]
    let usersMap: Record<string, string> = {}

    if (userIds.length > 0) {
      const { data: usersData } = await supabase.from('users').select('id, nome').in('id', userIds)

      if (usersData) {
        usersMap = usersData.reduce(
          (acc, u) => {
            acc[u.id] = u.nome
            return acc
          },
          {} as Record<string, string>,
        )
      }
    }

    const propertiesWithUsers = data.map((p) => ({
      ...p,
      captador_nome: usersMap[p.user_captador_id || p.captador_id] || '-',
    }))

    setProperties(propertiesWithUsers)
    setIsLoading(false)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(properties.map((p) => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    setIsDeleting(true)

    try {
      const { error } = await supabase.from('imoveis_captados').delete().in('id', selectedIds)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: `${selectedIds.length} imóveis deletados com sucesso.`,
      })

      setProperties((prev) => prev.filter((p) => !selectedIds.includes(p.id)))
      setSelectedIds([])
    } catch (err) {
      console.error('Error deleting properties:', err)
      toast({
        title: 'Erro',
        description: 'Erro ao deletar imóveis. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading || !isAdmin) {
    return (
      <div className="p-8 flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-[100vw] overflow-hidden flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Imóveis</h1>
          <p className="text-muted-foreground mt-1">
            Visualização e deleção em massa de imóveis captados (Acesso Admin).
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={selectedIds.length === 0}
              className="whitespace-nowrap shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar Selecionados ({selectedIds.length})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a deletar <strong>{selectedIds.length}</strong> imóveis. Esta ação
                é irreversível e excluirá em cascata todos os registros associados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
              >
                {isDeleting ? 'Deletando...' : 'Confirmar Deletar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 w-[40px] text-center">
                  <Checkbox
                    checked={properties.length > 0 && selectedIds.length === properties.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Preço</th>
                <th className="px-4 py-3 font-semibold">Bairro / Local</th>
                <th className="px-4 py-3 font-semibold text-center">Dorm.</th>
                <th className="px-4 py-3 font-semibold text-center">Vagas</th>
                <th className="px-4 py-3 font-semibold">Data Criação</th>
                <th className="px-4 py-3 font-semibold">Captador</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {properties.map((prop) => (
                <tr key={prop.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <Checkbox
                      checked={selectedIds.includes(prop.id)}
                      onCheckedChange={(checked) => handleSelectOne(checked as boolean, prop.id)}
                      aria-label={`Selecionar imóvel ${prop.codigo_imovel}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground" title={prop.id}>
                    {prop.id.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-3 font-medium">{prop.codigo_imovel || '-'}</td>
                  <td className="px-4 py-3 capitalize">{prop.tipo || '-'}</td>
                  <td className="px-4 py-3">
                    {prop.preco ? `R$ ${Number(prop.preco).toLocaleString('pt-BR')}` : '-'}
                  </td>
                  <td
                    className="px-4 py-3 max-w-[150px] truncate"
                    title={prop.localizacao_texto || prop.endereco || '-'}
                  >
                    {prop.localizacao_texto || prop.endereco || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">{prop.dormitorios ?? '-'}</td>
                  <td className="px-4 py-3 text-center">{prop.vagas ?? '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(prop.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 max-w-[120px] truncate">{prop.captador_nome}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                      {prop.status_captacao || prop.etapa_funil || '-'}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 max-w-[150px] truncate text-muted-foreground"
                    title={prop.observacoes || '-'}
                  >
                    {prop.observacoes || '-'}
                  </td>
                </tr>
              ))}
              {properties.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>Nenhum imóvel cadastrado no banco de dados.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-muted/30 p-3 border-t text-sm text-muted-foreground flex justify-between items-center">
          <span>Total de imóveis: {properties.length}</span>
          <span>{selectedIds.length} selecionado(s)</span>
        </div>
      </div>
    </div>
  )
}
