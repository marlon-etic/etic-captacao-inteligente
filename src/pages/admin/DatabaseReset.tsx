import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Download, Trash2, ShieldAlert, CheckCircle2 } from 'lucide-react'
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

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3A52] flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          Reset da Base de Imóveis (Go-Live)
        </h1>
        <p className="text-gray-600 mt-1 max-w-3xl text-sm md:text-base">
          Esta ferramenta limpa todos os dados de teste (imóveis, demandas, visitas e negócios),
          preservando as contas de usuários, políticas de segurança e estrutura do sistema.
          Recomendado apenas antes do Go-Live.
        </p>
      </div>

      {success && (
        <div className="bg-[#E8F5E9] border-2 border-[#4CAF50] rounded-xl p-6 flex flex-col items-center text-center shadow-md animate-fade-in">
          <div className="bg-[#4CAF50] text-white p-3 rounded-full mb-3 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-[#1A3A52] mb-1">
            Base de imóveis resetada com sucesso! Pronto para iniciar do zero.
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
              Antes de deletar os dados, faça o download de um snapshot completo em JSON.
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
                loading || (counts.imoveis === 0 && counts.locacao === 0 && counts.vendas === 0)
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
              <Trash2 className="w-5 h-5" /> 2. Limpeza Seletiva (Purge)
            </CardTitle>
            <CardDescription>
              Deletar dados de teste criados até a data selecionada. Preserva usuários e RLS.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Limpar registros criados até:</Label>
              <Input
                type="datetime-local"
                value={dateLimit}
                onChange={(e) => setDateLimit(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Tabelas afetadas: imoveis_captados, demandas_locacao, demandas_vendas. <br />
                (Visitas e negócios fechados são excluídos junto com seus imóveis).
              </p>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              <AlertTriangle className="w-4 h-4 mr-2" /> Executar Reset da Base
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> ATENÇÃO: Ação Irreversível
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 text-base">
              Você está prestes a <strong>deletar permanentemente</strong> os imóveis, demandas,
              respostas e logs do sistema criados até a data selecionada.
              <br />
              <br />
              Os usuários (captadores, corretores, SDRs, admins), políticas RLS e regras do sistema{' '}
              <strong>NÃO</strong> serão afetados.
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
    </div>
  )
}
