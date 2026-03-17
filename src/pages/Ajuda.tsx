import { Printer, BookOpen } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { SystemOverview } from '@/components/help/SystemOverview'
import { UserManuals } from '@/components/help/UserManuals'
import { DatabaseStructure } from '@/components/help/DatabaseStructure'
import { BusinessRules } from '@/components/help/BusinessRules'
import { Troubleshooting } from '@/components/help/Troubleshooting'

export default function Ajuda() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-12 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 print:hidden border-b border-[#2E5F8A]/20 pb-6">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-black text-[#1A3A52] flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-[#2E5F8A]" /> Central de Ajuda
          </h1>
          <p className="text-[14px] text-[#999999] font-medium mt-1">
            Manuais, documentação técnica, regras de negócio e guia rápido.
          </p>
        </div>
        <Button onClick={handlePrint} className="h-[44px] font-bold shrink-0">
          <Printer className="w-4 h-4 mr-2" /> Exportar / Imprimir PDF
        </Button>
      </div>

      {/* Visão de Impressão Oculta na Tela */}
      <div className="hidden print:block space-y-12">
        <div className="text-center border-b pb-6 mb-8">
          <h1 className="text-3xl font-black text-[#1A3A52]">
            Documentação do Sistema Étic Imóveis
          </h1>
          <p className="text-gray-500 mt-2">Exportado do Painel Administrativo</p>
        </div>
        <div className="break-inside-avoid">
          <SystemOverview />
        </div>
        <div className="break-inside-avoid pt-8">
          <UserManuals />
        </div>
        <div className="break-inside-avoid pt-8">
          <BusinessRules />
        </div>
        <div className="break-inside-avoid pt-8">
          <DatabaseStructure />
        </div>
        <div className="break-inside-avoid pt-8">
          <Troubleshooting />
        </div>
      </div>

      {/* Visão Normal de Tela */}
      <div className="print:hidden">
        <Tabs defaultValue="visao_geral" className="w-full">
          <div className="overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <TabsList className="inline-flex min-w-max w-full md:w-auto h-[56px] p-1 bg-[#F5F5F5] border-[2px] border-[#2E5F8A]/20 rounded-xl">
              <TabsTrigger value="visao_geral" className="h-full px-6 text-[14px]">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="manuais" className="h-full px-6 text-[14px]">
                Manuais de Uso
              </TabsTrigger>
              <TabsTrigger value="regras" className="h-full px-6 text-[14px]">
                Regras de Negócio
              </TabsTrigger>
              <TabsTrigger value="database" className="h-full px-6 text-[14px]">
                Banco de Dados
              </TabsTrigger>
              <TabsTrigger value="troubleshooting" className="h-full px-6 text-[14px]">
                Solução de Problemas
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-4 bg-white/50 rounded-xl">
            <TabsContent value="visao_geral" className="mt-0 focus-visible:outline-none">
              <SystemOverview />
            </TabsContent>
            <TabsContent value="manuais" className="mt-0 focus-visible:outline-none">
              <UserManuals />
            </TabsContent>
            <TabsContent value="regras" className="mt-0 focus-visible:outline-none">
              <BusinessRules />
            </TabsContent>
            <TabsContent value="database" className="mt-0 focus-visible:outline-none">
              <DatabaseStructure />
            </TabsContent>
            <TabsContent value="troubleshooting" className="mt-0 focus-visible:outline-none">
              <Troubleshooting />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
