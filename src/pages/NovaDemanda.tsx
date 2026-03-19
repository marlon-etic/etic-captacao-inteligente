import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModalDemandaVenda } from '@/components/ModalDemandaVenda'

export default function NovaDemanda() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="max-w-4xl mx-auto pb-8 px-4 sm:px-0">
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader className="bg-primary/5 border-b rounded-t-xl">
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Tag className="w-6 h-6" /> Cadastro de Demandas
          </CardTitle>
          <CardDescription className="text-base">
            Acesse o formulário rápido para cadastrar as necessidades do seu cliente e acionar os
            captadores em tempo real.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 flex flex-col items-center justify-center gap-6 text-center min-h-[300px]">
          <div className="bg-[#E8F0F8] p-4 rounded-full">
            <FileText className="w-12 h-12 text-[#1A3A52]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#1A3A52] mb-2">Demandas de Venda</h3>
            <p className="text-[#666666] max-w-md mx-auto">
              Utilize nosso novo assistente modal para registrar as especificações de compra do seu
              cliente de forma estruturada.
            </p>
          </div>
          <Button
            size="lg"
            className="bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold text-[16px] rounded-[8px] min-w-[200px]"
            onClick={() => setIsModalOpen(true)}
          >
            Nova Demanda de Venda
          </Button>

          <Button
            variant="ghost"
            className="text-gray-500 hover:text-gray-800"
            onClick={() => navigate('/app/demandas')}
          >
            Voltar para lista
          </Button>
        </CardContent>
      </Card>

      <ModalDemandaVenda isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
