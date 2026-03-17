import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'

export function Troubleshooting() {
  return (
    <Card className="border-[2px] border-[#F44336]/30 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#F44336]">
          <ShieldAlert className="w-5 h-5" /> Solução de Problemas (FAQ)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-[14px] text-[#333333]">
        <div className="bg-[#FFFFFF] p-4 rounded-lg border border-[#E5E5E5] shadow-sm">
          <h4 className="font-bold text-[#1A3A52] mb-1">Demandas similares não estão agrupando?</h4>
          <p>
            Para agrupar, o sistema valida vários fatores obrigatórios:{' '}
            <strong>Bairro deve ser escrito de forma exata</strong> e o Orçamento (Teto e Piso)
            devem convergir numa faixa de tolerância de ±10%. Diferenças na tipologia também
            isolarão os cards.
          </p>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-lg border border-[#E5E5E5] shadow-sm">
          <h4 className="font-bold text-[#1A3A52] mb-1">Falha no Recebimento de Notificações</h4>
          <p>
            Se as notificações não estiverem tocando (push/som): Verifique se ativou o modo{' '}
            <strong>"Não Perturbe"</strong> em Perfil &gt; Preferências de Notificação.
            Certifique-se também se o tipo específico do alerta (Visita, Negócio) foi desmarcado por
            engano.
          </p>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-lg border border-[#E5E5E5] shadow-sm">
          <h4 className="font-bold text-[#1A3A52] mb-1">
            Botões de Ação Bloqueados (Acesso Negado)
          </h4>
          <p>
            Usuários configurados com perfil de <strong>Captador</strong> são proibidos de alterar
            status do cliente no funil. Da mesma forma, um <strong>SDR</strong> será bloqueado de
            interferir em funis de Venda. Confira seu papel atual na página inicial.
          </p>
        </div>

        <div className="bg-[#FFFFFF] p-4 rounded-lg border border-[#E5E5E5] shadow-sm">
          <h4 className="font-bold text-[#1A3A52] mb-1">Erro no Link de Propriedade</h4>
          <p>
            Evite usar caracteres complexos como `/`, `\`, `?` no <strong>Código do Imóvel</strong>{' '}
            durante o cadastro, pois isso corrompe o Link Externo. Dê preferência ao formato
            alfanumérico simples e direto (Ex: AP1020, CASA50, etc).
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
