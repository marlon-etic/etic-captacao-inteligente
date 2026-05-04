import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { DemandasAbertasView } from '@/components/DemandasAbertasView'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import { DemandasPerdidasView } from '@/components/DemandasPerdidasView'
import { ScrollableTabs } from '@/components/ScrollableTabs'
import { CaptadorDashboardOverview } from '@/components/dashboard/CaptadorDashboardOverview'
import { CaptadorEngajamentoModal } from '@/components/dashboard/CaptadorEngajamentoModal'
import useAppStore from '@/stores/useAppStore'

export function CaptadorDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'dashboard'
  const { demands, currentUser } = useAppStore()

  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const lastShown = localStorage.getItem('captador_engajamento_modal_last_shown')
    const today = new Date().toDateString()
    if (lastShown !== today) {
      setShowModal(true)
      localStorage.setItem('captador_engajamento_modal_last_shown', today)
    }
  }, [])

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  const tabs = [
    { value: 'dashboard', label: 'Visão Geral' },
    { value: 'demandas-abertas', label: 'Demandas Atuais' },
    { value: 'meus-captados', label: 'Meus Captados' },
    { value: 'perdidos', label: 'Perdidos' },
  ]

  return (
    <div className="space-y-[16px] md:space-y-[24px]">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <ScrollableTabs
          tabs={tabs}
          activeTab={currentTab}
          onTabChange={handleTabChange}
          className="sticky top-[64px] lg:top-[72px] bg-[#F5F5F5] pt-2 z-[40] -mx-4 px-4 sm:mx-0 sm:px-0"
        />

        <div className="mt-4 transition-opacity duration-300 ease-in animate-in fade-in">
          <TabsContent value="dashboard" className="m-0 border-none">
            {currentUser && <CaptadorDashboardOverview onTabChange={handleTabChange} />}
          </TabsContent>
          <TabsContent value="demandas-abertas" className="m-0 border-none">
            <DemandasAbertasView />
          </TabsContent>
          <TabsContent value="meus-captados" className="m-0 border-none">
            <CapturedPropertiesView emptyStateText="Você ainda não captou nenhum imóvel." />
          </TabsContent>
          <TabsContent value="perdidos" className="m-0 border-none">
            <DemandasPerdidasView />
          </TabsContent>
        </div>
      </Tabs>
      <CaptadorEngajamentoModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
