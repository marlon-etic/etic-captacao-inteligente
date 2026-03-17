import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function BusinessRules() {
  return (
    <div className="space-y-6">
      <Card className="border-[2px] border-[#2E5F8A]/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#1A3A52]">Regras de Negócio e Algoritmos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-[14px] text-[#333333]">
          <div className="p-4 bg-[#F5F5F5] rounded-xl border border-[#E5E5E5]">
            <h3 className="font-bold text-[16px] text-[#1A3A52] mb-2 flex items-center gap-2">
              <Badge variant="outline" className="bg-[#2E5F8A] text-white border-none">
                1
              </Badge>
              Algoritmo de Agrupamento
            </h3>
            <p className="mb-2">
              As demandas abertas são inteligentemente agrupadas se satisfizerem os seguintes
              limites:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#333333]">
              <li>Bairro idêntico e mesma Tipologia de contrato (Venda/Aluguel).</li>
              <li>Orçamento coincidente ou sobreposto com margem de tolerância (±10%).</li>
              <li>Número de Dormitórios igual ou superior ao solicitado.</li>
              <li>Quantidade de vagas igual ou superior.</li>
            </ul>
          </div>

          <div className="p-4 bg-[#F5F5F5] rounded-xl border border-[#E5E5E5]">
            <h3 className="font-bold text-[16px] text-[#1A3A52] mb-2 flex items-center gap-2">
              <Badge variant="outline" className="bg-[#2E5F8A] text-white border-none">
                2
              </Badge>
              Regra de Roteamento de Notificações
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-[#333333]">
              <li>
                Alertas de novos imóveis de <strong>Aluguel</strong> são direcionados primeiramente
                aos <strong>SDRs</strong>.
              </li>
              <li>
                Alertas de novos imóveis de <strong>Venda</strong> são roteados para os{' '}
                <strong>Corretores</strong>.
              </li>
            </ul>
          </div>

          <div className="p-4 bg-[#F5F5F5] rounded-xl border border-[#E5E5E5]">
            <h3 className="font-bold text-[16px] text-[#1A3A52] mb-2 flex items-center gap-2">
              <Badge variant="outline" className="bg-[#2E5F8A] text-white border-none">
                3
              </Badge>
              Sistema de Pontuação (Scoring)
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-[#333333]">
              <li>
                <strong>Captação Individual:</strong>{' '}
                <span className="font-bold text-[#4CAF50]">+50 pts</span>.
              </li>
              <li>
                <strong>Captação p/ Grupo:</strong>
                <ul className="list-[circle] pl-5 mt-1">
                  <li>
                    2-3 clientes: <span className="font-bold text-[#4CAF50]">+75 pts</span>
                  </li>
                  <li>
                    4-6 clientes: <span className="font-bold text-[#4CAF50]">+100 pts</span>
                  </li>
                  <li>
                    7+ clientes: <span className="font-bold text-[#4CAF50]">+150 pts</span>
                  </li>
                </ul>
              </li>
              <li>
                <strong>Imóvel Disponível (Solto):</strong>{' '}
                <span className="font-bold text-[#4CAF50]">+35 pts</span>.
              </li>
              <li>
                <strong>Visita Agendada:</strong>{' '}
                <span className="font-bold text-[#4CAF50]">+25 pts</span> (repassados quando o
                corretor interage).
              </li>
              <li>
                <strong>Negócio Fechado:</strong>{' '}
                <span className="font-bold text-[#4CAF50]">+50 pts</span> bônus de conversão.
              </li>
            </ul>
          </div>

          <div className="p-4 bg-[#F5F5F5] rounded-xl border border-[#E5E5E5]">
            <h3 className="font-bold text-[16px] text-[#1A3A52] mb-2 flex items-center gap-2">
              <Badge variant="outline" className="bg-[#2E5F8A] text-white border-none">
                4
              </Badge>
              Permissões de Alteração de Status
            </h3>
            <p>
              Apenas <strong>SDRs, Corretores, Gestores e Admins</strong> possuem autorização para
              mover os cards pelo funil (Visita, Proposta, Negócio Fechado) ou sinalizar Perda. O
              Captador se restringe ao front de envio de imóveis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
