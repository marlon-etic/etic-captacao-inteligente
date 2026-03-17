import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Database, ShieldCheck } from 'lucide-react'

export function DatabaseStructure() {
  return (
    <div className="space-y-6">
      <Card className="border-[2px] border-[#2E5F8A]/20 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1A3A52]">
            <Database className="w-5 h-5 text-[#2E5F8A]" /> Estrutura de Banco de Dados (Supabase)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-[14px] text-[#333333]">
          <div>
            <h3 className="font-bold text-[16px] text-[#1A3A52] mb-3">Tabelas Principais</h3>
            <ul className="space-y-3">
              <li className="bg-[#F5F5F5] p-3 rounded-lg border border-[#E5E5E5]">
                <strong className="text-[#1A3A52]">usuarios:</strong>{' '}
                <code className="text-xs bg-white px-1 py-0.5 rounded border">
                  id (uuid), name, role, status, email
                </code>
                <br />
                Armazena as credenciais e o papel do usuário no sistema.
              </li>
              <li className="bg-[#F5F5F5] p-3 rounded-lg border border-[#E5E5E5]">
                <strong className="text-[#1A3A52]">demandas_locacao:</strong>{' '}
                <code className="text-xs bg-white px-1 py-0.5 rounded border">
                  id, client_name, neighborhood, min_value, max_value, dorms, parking, status,
                  sdr_id, grupo_id
                </code>
                <br />
                Guarda demandas controladas exclusivamente pelos SDRs.
              </li>
              <li className="bg-[#F5F5F5] p-3 rounded-lg border border-[#E5E5E5]">
                <strong className="text-[#1A3A52]">demandas_vendas:</strong>{' '}
                <code className="text-xs bg-white px-1 py-0.5 rounded border">
                  id, client_name, neighborhood, min_value, max_value, dorms, parking, status,
                  corretor_id, grupo_id
                </code>
                <br />
                Guarda demandas controladas pelos Corretores.
              </li>
              <li className="bg-[#F5F5F5] p-3 rounded-lg border border-[#E5E5E5]">
                <strong className="text-[#1A3A52]">grupos_demandas:</strong>{' '}
                <code className="text-xs bg-white px-1 py-0.5 rounded border">
                  id, neighborhood, typology, avg_value, type, count_clients
                </code>
                <br />
                Virtualização e clusterização das demandas unitárias.
              </li>
              <li className="bg-[#F5F5F5] p-3 rounded-lg border border-[#E5E5E5]">
                <strong className="text-[#1A3A52]">imoveis_captados:</strong>{' '}
                <code className="text-xs bg-white px-1 py-0.5 rounded border">
                  id, code, neighborhood, value, type, dorms, bathrooms, parking, observations,
                  captador_id, demanda_id
                </code>
                <br />
                Inventário das propriedades fornecidas no sistema.
              </li>
              <li className="bg-[#F5F5F5] p-3 rounded-lg border border-[#E5E5E5]">
                <strong className="text-[#1A3A52]">notificacoes:</strong>{' '}
                <code className="text-xs bg-white px-1 py-0.5 rounded border">
                  id, user_id, message, read_status, type
                </code>
                <br />
                Histórico de mensagens do sistema e interações transacionais.
              </li>
              <li className="bg-[#F5F5F5] p-3 rounded-lg border border-[#E5E5E5]">
                <strong className="text-[#1A3A52]">pontuacao:</strong>{' '}
                <code className="text-xs bg-white px-1 py-0.5 rounded border">
                  id, user_id, points, action_type, reference_id
                </code>
                <br />
                Registro isolado e imutável para contagem do Ranking (Gamificação).
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[2px] border-[#2E5F8A]/20 shadow-sm bg-[#F5F5F5]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1A3A52]">
            <ShieldCheck className="w-5 h-5 text-[#4CAF50]" /> Row Level Security (RLS)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[14px] text-[#333333]">
            O banco de dados é altamente protegido no backend utilizando políticas{' '}
            <strong>RLS do PostgreSQL</strong>. Isto impede que <strong>Captadores</strong> extraiam
            diretamente nomes de clientes não autorizados (que surgem como "Cliente Oculto" na UI) e
            obriga <strong>Corretores/SDRs</strong> a lerem unicamente as demandas que geraram. O
            painel global de visibilidade é restrito aos papéis <strong>Admin e Gestor</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
