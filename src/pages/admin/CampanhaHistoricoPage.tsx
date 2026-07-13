import { CampanhaHistoricoDashboard } from '@/components/campanhas/CampanhaHistoricoDashboard'

export default function CampanhaHistoricoPage() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12 animate-fade-in-up">
      <div className="border-b border-[#2E5F8A]/20 pb-6">
        <h1 className="text-[28px] md:text-[32px] font-black text-[#1A3A52]">
          Histórico de Campanhas
        </h1>
        <p className="text-[14px] text-[#999999] font-bold mt-1 uppercase tracking-wider">
          Análise de campanhas encerradas
        </p>
      </div>
      <CampanhaHistoricoDashboard />
    </div>
  )
}
