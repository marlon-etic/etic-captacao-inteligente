import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Download, Trash2, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function DatabaseReset() {
  const [loading, setLoading] = useState(false)
  const [counts, setCounts] = useState({ imoveis: 0, locacao: 0, vendas: 0 })
  const [confirmText, setConfirmText] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dateLimit, setDateLimit] = useState(() => new Date().toISOString().slice(0, 16))
  const [success, setSuccess] = useState(false)

  // Hard Reset State
  const [hardResetConfirm, setHardResetConfirm] = useState('')
  const [hardResetOpen, setHardResetOpen] = useState(false)
  const [hardResetLoading, setHardResetLoading] = useState(false)

  const loadCounts = async () => {
    try {
      const [imoveis, locacao, vendas] = await Promise.all([
        supabase.from('imoveis_captados').select('id', { count: 'exact', head: true }),
        supabase.from('demandas_locacao').select('id', { count: 'exact', head: true }),
        supabase.from('demandas_vendas').select('id', { count: 'exact', head: true }),
      ])
      setCounts({
        imoveis: imoveis.count || 0,
        locacao: locacao.count || 0,
        vendas: vendas.count || 0,
      })
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadCounts()
  }, [])

  const handleBackup = async () => {
    setLoading(true)
    toast({ title: 'Gerando backup...', description: 'Aguarde enquanto os dados são exportados.' })
    try {
      const [imoveis, locacao, vendas] = await Promise.all([
        supabase.from('imoveis_captados').select('*'),
        supabase.from('demandas_locacao').select('*'),
        supabase.from('demandas_vendas').select('*'),
      ])

      const backup = {
        timestamp: new Date().toISOString(),
        imoveis_captados: imoveis.data,
        demandas_locacao: locacao.data,
        demandas_vendas: vendas.data,
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sci_backup_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast({ title: 'Backup concluído', description: 'Arquivo JSON baixado com sucesso.' })
    } catch (e: any) {
      toast({ title: 'Erro no backup', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (confirmText !== 'CONFIRMAR') {
      toast({
        title: 'Erro',
        description: 'Digite CONFIRMAR para prosseguir.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const deleteBefore = new Date(dateLimit).toISOString()

      const { data, error } = await supabase.rpc('fn_reset_database', {
        p_delete_before: deleteBefore,
      })

      if (error) throw error

      setSuccess(true)
      setDialogOpen(false)
      loadCounts()
      setConfirmText('')

      toast({
        title: 'Sucesso!',
        description: `Foram deletados ${data?.deleted?.imoveis_captados} imóveis e ${data?.deleted?.demandas_locacao + data?.deleted?.demandas_vendas} demandas.`,
      })
    } catch (e: any) {
      toast({ title: 'Erro ao resetar', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const executeHardReset = async () => {
    if (hardResetConfirm !== 'ESVAZIAR') {
      toast({
        title: 'Erro',
        description: 'Digite ESVAZIAR para confirmar.',
        variant: 'destructive',
      })
      return
    }

    setHardResetLoading(true)
    try {
      // 1. Executar DELETE no Supabase
      const { error } = await supabase.rpc('fn_hard_reset_imoveis')
      if (error) {
        if (error.message.includes('does not exist')) {
          await supabase.rpc('fn_reset_database', {
            p_delete_before: new Date('2100-01-01').toISOString(),
          })
        } else {
          throw error
        }
      }

      // 2 & 3. Limpar localStorage e sessionStorage completamente
      const localKeysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (
          key &&
          (key.includes('imoveis') ||
            key.includes('properties') ||
            key.includes('poll_') ||
            key.includes('vistasoft'))
        ) {
          localKeysToRemove.push(key)
        }
      }
      localKeysToRemove.forEach((k) => localStorage.removeItem(k))

      const sessionKeysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (
          key &&
          (key.includes('imoveis') || key.includes('properties') || key.includes('poll_'))
        ) {
          sessionKeysToRemove.push(key)
        }
      }
      sessionKeysToRemove.forEach((k) => sessionStorage.removeItem(k))

      // 4. Desconectar subscriptions
      await supabase.removeAllChannels()

      setSuccess(true)
      setHardResetOpen(false)
      setHardResetConfirm('')

      toast({
        title: 'Reset Completo Efetuado',
        description:
          'Base de imóveis esvaziada, cache limpo e conexões encerradas. Recarregando a aplicação...',
      })

      // 5 & 6. Forçar reload do componente/aplicação para limpar memória
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (e: any) {
      toast({ title: 'Erro no Hard Reset', description: e.message, variant: 'destructive' })
    } finally {
      setHardResetLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3A52] flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          Reset da Base de Dados (Go-Live)
        </h1>
        <p className="text-gray-600 mt-1 max-w-3xl text-sm md:text-base">
          Ferramentas para limpeza segura dos dados antes de entrar em produção. Contas de usuários,
          permissões, RLS e configurações de segurança são sempre preservados.
        </p>
      </div>

      {success && (
        <div className="bg-[#E8F5E9] border-2 border-[#4CAF50] rounded-xl p-6 flex flex-col items-center text-center shadow-md animate-fade-in">
          <div className="bg-[#4CAF50] text-white p-3 rounded-full mb-3 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-[#1A3A52] mb-1">
            Base limpa com sucesso! Pronto para operar.
          </h2>
          <p className="text-[#333333] font-medium max-w-xl">
            Todos os usuários, permissões, roles e configurações de segurança foram totalmente
            preservados.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-orange-200">
          <CardHeader className="bg-orange-50/50 pb-4">
            <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
              <Download className="w-5 h-5" /> 1. Backup de Segurança
            </CardTitle>
            <CardDescription>
              Faça o download de um snapshot completo em JSON antes de remover os dados.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
              <div className="space-y-1 w-full">
                <p className="text-sm font-medium text-gray-500">Registros Atuais na Base:</p>
                <div className="flex justify-between gap-2 text-sm font-bold text-[#1A3A52] w-full">
                  <span>{counts.imoveis} Imóveis</span>
                  <span>{counts.locacao} Dem. Locação</span>
                  <span>{counts.vendas} Dem. Vendas</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleBackup}
              disabled={
                loading ||
                hardResetLoading ||
                (counts.imoveis === 0 && counts.locacao === 0 && counts.vendas === 0)
              }
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" /> Exportar Dados (JSON)
            </Button>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="bg-red-50/50 pb-4">
            <CardTitle className="text-lg text-red-800 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> 2. Limpeza Seletiva (Por Data)
            </CardTitle>
            <CardDescription>
              Deleta dados de teste criados até a data selecionada. Preserva usuários e RLS.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Limpar registros criados até:</Label>
              <Input
                type="datetime-local"
                value={dateLimit}
                onChange={(e) => setDateLimit(e.target.value)}
                disabled={loading || hardResetLoading}
              />
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              disabled={loading || hardResetLoading}
              variant="outline"
              className="w-full border-red-200 text-red-700 hover:bg-red-50"
            >
              <AlertTriangle className="w-4 h-4 mr-2" /> Executar Limpeza Seletiva
            </Button>
          </CardContent>
        </Card>

        <Card className="border-red-500 md:col-span-2 shadow-sm bg-red-50/30">
          <CardHeader className="bg-red-100/50 pb-4 border-b border-red-200">
            <CardTitle className="text-lg text-red-900 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" /> 3. Reset Completo Sem Cache (Purge Total)
            </CardTitle>
            <CardDescription className="text-red-700 font-medium">
              Esvazia <strong>TODA</strong> a base de imóveis captados de uma só vez. Limpa todos os
              caches locais (localStorage/sessionStorage), derruba conexões real-time e força o
              reload da interface.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button
              onClick={() => setHardResetOpen(true)}
              disabled={loading || hardResetLoading}
              variant="destructive"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-base"
            >
              <RefreshCw className="w-5 h-5 mr-2" /> Esvaziar Imóveis e Limpar Cache Frontend
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para Reset Seletivo */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> ATENÇÃO: Limpeza Seletiva
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 text-base">
              Você está prestes a <strong>deletar</strong> os imóveis e demandas criados até a data
              selecionada.
              <br />
              <br />
              Para confirmar, digite <strong>CONFIRMAR</strong> no campo abaixo:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-2">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Digite CONFIRMAR"
              className="border-red-300 focus-visible:ring-red-500 font-bold"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText('')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleReset()
              }}
              disabled={confirmText !== 'CONFIRMAR' || loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Processando...' : 'Deletar Dados'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para Hard Reset */}
      <AlertDialog open={hardResetOpen} onOpenChange={setHardResetOpen}>
        <AlertDialogContent className="border-red-500 border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700 flex items-center gap-2 text-xl">
              <AlertTriangle className="w-6 h-6" /> RESET EXTREMO DA BASE (SEM CACHE)
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-800 text-base leading-relaxed">
              Você está prestes a fazer um <strong>DELETE completo</strong> na tabela de imóveis
              captados.
              <br />
              <br />
              Esta ação irá automaticamente:
              <ul className="list-disc pl-5 mt-2 space-y-1 font-medium text-red-900/80">
                <li>
                  Esvaziar todos os registros da tabela{' '}
                  <code className="bg-red-100 px-1 rounded">imoveis_captados</code>
                </li>
                <li>
                  Limpar os caches <code className="bg-red-100 px-1 rounded">localStorage</code> e{' '}
                  <code className="bg-red-100 px-1 rounded">sessionStorage</code>
                </li>
                <li>Desconectar todas as assinaturas ativas de tempo real</li>
                <li>Forçar o recarregamento total da página (F5)</li>
              </ul>
              <br />
              Digite <strong>ESVAZIAR</strong> abaixo para prosseguir:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-2">
            <Input
              value={hardResetConfirm}
              onChange={(e) => setHardResetConfirm(e.target.value)}
              placeholder="Digite ESVAZIAR"
              className="border-red-400 focus-visible:ring-red-600 font-bold text-center text-lg uppercase"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setHardResetConfirm('')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                executeHardReset()
              }}
              disabled={hardResetConfirm !== 'ESVAZIAR' || hardResetLoading}
              className="bg-red-700 hover:bg-red-800 text-white w-full sm:w-auto"
            >
              {hardResetLoading ? 'Esvaziando Sistema...' : 'Confirmar Esvaziamento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
