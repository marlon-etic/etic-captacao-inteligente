import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

export function UserManuals() {
  return (
    <Card className="border-[2px] border-[#2E5F8A]/20 shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#1A3A52]">Manuais de Uso por Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="captador">
            <AccordionTrigger className="font-bold text-[16px] text-[#1A3A52] hover:text-[#2E5F8A]">
              Manual do Captador
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-4 text-[14px] text-[#333333]">
              <div className="bg-[#F5F5F5] p-4 rounded-lg border border-[#E5E5E5]">
                <h4 className="font-bold text-[#1A3A52] mb-1">Cadastro de Imóveis (Botão FAB)</h4>
                <p>
                  Utilize o botão verde{' '}
                  <span className="font-bold text-[#4CAF50]">"➕ ADICIONAR IMÓVEL"</span> presente
                  na tela (ou no canto inferior direito pelo celular). Você pode vincular a uma
                  demanda específica, escolher de uma lista, ou cadastrar "Sem Demanda Específica"
                  (Disponível).
                </p>
              </div>
              <div className="bg-[#F5F5F5] p-4 rounded-lg border border-[#E5E5E5]">
                <h4 className="font-bold text-[#1A3A52] mb-1">Link de Pré-visualização</h4>
                <p>
                  O link gerado do imóvel segue o padrão:{' '}
                  <code className="bg-white px-2 py-0.5 rounded border border-[#E5E5E5] text-[#1A3A52]">
                    https://www.eticimoveis.com.br/imovel/&#123;codigo&#125;
                  </code>
                  . Mantenha os códigos sem espaços e fáceis de ler.
                </p>
              </div>
              <div className="bg-[#F5F5F5] p-4 rounded-lg border border-[#E5E5E5]">
                <h4 className="font-bold text-[#1A3A52] mb-1">Contato Interno</h4>
                <p>
                  Na aba de "Detalhes do Imóvel" ou pelo "Chat da Demanda", você pode enviar
                  mensagens para o SDR/Corretor para alinhar dúvidas sobre o que eles procuram.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sdr-corretor">
            <AccordionTrigger className="font-bold text-[16px] text-[#1A3A52] hover:text-[#2E5F8A]">
              Manual do SDR / Corretor
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-4 text-[14px] text-[#333333]">
              <div className="bg-[#F5F5F5] p-4 rounded-lg border border-[#E5E5E5]">
                <h4 className="font-bold text-[#1A3A52] mb-1">Criação de Demandas</h4>
                <p>
                  SDRs devem registrar clientes buscando Locação, e Corretores buscam Venda. Acesse
                  a rota "Nova Demanda" e preencha criteriosamente os dados.
                </p>
              </div>
              <div className="bg-[#F5F5F5] p-4 rounded-lg border border-[#E5E5E5]">
                <h4 className="font-bold text-[#1A3A52] mb-1">Gerenciamento de Status</h4>
                <p>
                  Após um imóvel ser captado e você apresentá-lo, atualize o status para{' '}
                  <strong className="text-[#FF9800]">VISITA AGENDADA</strong>,{' '}
                  <strong className="text-[#4CAF50]">NEGÓCIO FECHADO</strong> ou{' '}
                  <strong className="text-[#F44336]">PERDIDA</strong>. Isso libera as bonificações
                  ao captador.
                </p>
              </div>
              <div className="bg-[#F5F5F5] p-4 rounded-lg border border-[#E5E5E5]">
                <h4 className="font-bold text-[#1A3A52] mb-1">
                  Vínculo Manual de Imóveis "Disponíveis"
                </h4>
                <p>
                  Na aba "Imóveis Captados", propriedades Soltas podem ser "Reivindicadas" para o
                  cliente que você gerencia, tornando o imóvel bloqueado para outros corretores.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="admin">
            <AccordionTrigger className="font-bold text-[16px] text-[#1A3A52] hover:text-[#2E5F8A]">
              Manual do Gestor / Admin
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-4 text-[14px] text-[#333333]">
              <div className="bg-[#F5F5F5] p-4 rounded-lg border border-[#E5E5E5]">
                <h4 className="font-bold text-[#1A3A52] mb-1">Uso de Filtros no Analytics</h4>
                <p>
                  No "Dashboard Analytics", utilize o filtro superior para mudar o intervalo de
                  tempo (Semana, Mês) e Tipo de Negócio para orientar os esforços da equipe.
                </p>
              </div>
              <div className="bg-[#F5F5F5] p-4 rounded-lg border border-[#E5E5E5]">
                <h4 className="font-bold text-[#1A3A52] mb-1">Interpretação de Dados</h4>
                <p>
                  O gráfico de Bairros (Top 10) orienta a logística de captação, e a tabela de
                  Perfis cruza quais nichos convertem mais (Venda vs Aluguel, faixa de preço, etc).
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
