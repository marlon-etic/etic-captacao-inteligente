import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, Target } from 'lucide-react'

export function SystemOverview() {
  return (
    <div className="space-y-6">
      <Card className="border-[2px] border-[#2E5F8A]/20 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1A3A52]">
            <Target className="w-5 h-5 text-[#4CAF50]" /> Objetivo do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[14px] text-[#333333]">
            Otimizar a captação de imóveis conectando captadores, corretores e SDRs em tempo real.
            Através de algoritmos de unificação, as demandas de clientes são agrupadas para
            maximizar a eficiência dos captadores na rua.
          </p>
        </CardContent>
      </Card>

      <Card className="border-[2px] border-[#2E5F8A]/20 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1A3A52]">
            <Users className="w-5 h-5 text-[#FF9800]" /> Papéis e Permissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-[#E5E5E5] rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-[#F5F5F5]">
                <TableRow>
                  <TableHead className="font-bold text-[#1A3A52]">Papel</TableHead>
                  <TableHead className="font-bold text-[#1A3A52]">Permissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-[#F5F5F5]/50">
                  <TableCell className="font-bold text-[#333333]">Admin</TableCell>
                  <TableCell className="text-[#333333]">
                    Acesso total a todos os dados, analytics e gestão de usuários.
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-[#F5F5F5]/50">
                  <TableCell className="font-bold text-[#333333]">Gestor</TableCell>
                  <TableCell className="text-[#333333]">
                    Acesso a dashboard, relatórios e visão da equipe.
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-[#F5F5F5]/50">
                  <TableCell className="font-bold text-[#333333]">SDR</TableCell>
                  <TableCell className="text-[#333333]">
                    Gerencia demandas de Locação, visualiza imóveis captados, atualiza status.
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-[#F5F5F5]/50">
                  <TableCell className="font-bold text-[#333333]">Corretor</TableCell>
                  <TableCell className="text-[#333333]">
                    Gerencia demandas de Venda, visualiza imóveis captados, atualiza status.
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-[#F5F5F5]/50">
                  <TableCell className="font-bold text-[#333333]">Captador</TableCell>
                  <TableCell className="text-[#333333]">
                    Visualiza demandas, cadastra imóveis, rastreia pontos e ranking.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[2px] border-[#2E5F8A]/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#1A3A52]">Fluxo Principal</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-3 text-[14px] text-[#333333]">
            <li>
              <strong>Criação de Demanda:</strong> SDR ou Corretor registra necessidades de um
              cliente.
            </li>
            <li>
              <strong>Agrupamento Inteligente:</strong> O sistema busca clientes com interesses
              similares (Bairro + Preço + Dorms) e forma Grupos de Demanda.
            </li>
            <li>
              <strong>Atribuição a Captadores:</strong> Captadores visualizam demandas abertas ou
              são acionados via notificação.
            </li>
            <li>
              <strong>Captação de Imóvel:</strong> O captador usa o botão "Adicionar Imóvel" e
              vincula-o a um grupo ou registra livremente (Disponível).
            </li>
            <li>
              <strong>Fechamento:</strong> O corretor/SDR entra em contato com o cliente, agenda
              visita e reporta negócio fechado, gerando pontos.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
