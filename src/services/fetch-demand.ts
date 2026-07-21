import { supabase } from '@/lib/supabase/client'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'

export async function fetchDemandById(
  demandId: string,
  type: 'locacao' | 'vendas',
): Promise<SupabaseDemand | null> {
  const table = type === 'locacao' ? 'demandas_locacao' : 'demandas_vendas'
  const tipo = type === 'locacao' ? 'Aluguel' : 'Venda'

  const selectFields =
    type === 'locacao'
      ? 'id, nome_cliente, cliente_nome, telefone, email, bairros, localizacoes, valor_minimo, valor_maximo, orcamento_max, dormitorios, vagas_estacionamento, observacoes, tipo_imovel, nivel_urgencia, urgencia, status_demanda, is_prioritaria, created_at, updated_at, sdr_id, vinculacao_captador_id, captadores_busca, links_sugeridos, imoveis_captados(id, codigo_imovel, user_captador_id, captador_id, etapa_funil, data_visita, data_fechamento, dormitorios, vagas, observacoes, localizacao_texto, created_at, updated_at), respostas_captador(id, captador_id, resposta, motivo, observacao, created_at), prazos_captacao(id, prazo_resposta, prorrogacoes_usadas, status)'
      : 'id, nome_cliente, cliente_nome, telefone, email, bairros, localizacoes, valor_minimo, valor_maximo, orcamento_max, dormitorios, vagas_estacionamento, necessidades_especificas, tipo_imovel, nivel_urgencia, urgencia, status_demanda, is_prioritaria, created_at, updated_at, corretor_id, vinculacao_captador_id, captadores_busca, links_sugeridos, imoveis_captados(id, codigo_imovel, user_captador_id, captador_id, etapa_funil, data_visita, data_fechamento, dormitorios, vagas, observacoes, localizacao_texto, created_at, updated_at), respostas_captador(id, captador_id, resposta, motivo, observacao, created_at), prazos_captacao(id, prazo_resposta, prorrogacoes_usadas, status)'

  const { data, error } = await supabase
    .from(table)
    .select(selectFields)
    .eq('id', demandId)
    .single()

  if (error || !data) return null

  const respostas = (data.respostas_captador || []).sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return {
    id: data.id,
    nome_cliente: data.nome_cliente || data.cliente_nome || 'Cliente',
    telefone: data.telefone || '',
    email: data.email || '',
    bairros: data.bairros || data.localizacoes || [],
    valor_minimo: data.valor_minimo || 0,
    valor_maximo: data.valor_maximo || data.orcamento_max || 0,
    dormitorios: data.dormitorios || 0,
    vagas_estacionamento: data.vagas_estacionamento || 0,
    observacoes: data.observacoes || data.necessidades_especificas || '',
    tipo_imovel: data.tipo_imovel || 'Casa',
    nivel_urgencia: data.nivel_urgencia || data.urgencia || 'Média',
    db_status_demanda: data.status_demanda || 'aberta',
    status_demanda: data.status_demanda || 'aberta',
    is_prioritaria: data.is_prioritaria || false,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at,
    tipo: tipo as 'Aluguel' | 'Venda',
    sdr_id: data.sdr_id,
    corretor_id: data.corretor_id,
    vinculacao_captador_id: data.vinculacao_captador_id,
    captadores_busca: data.captadores_busca || [],
    links_sugeridos: (data.links_sugeridos as string[]) || [],
    respostas_captador: respostas,
    prazos_captacao: data.prazos_captacao || [],
    imoveis_captados: (data.imoveis_captados || []).map((i: any) => ({
      ...i,
      captador_nome: 'Captador',
      etapa_funil: i.etapa_funil || 'capturado',
      observacoes: i.observacoes || i.localizacao_texto,
    })),
  }
}
