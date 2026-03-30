import { supabase } from '@/lib/supabase/client'

const processedEvents = new Set<string>()

const generateEventHash = (table: string, payload: any) => {
  return `${table}_${payload.eventType}_${payload.new?.id}_${payload.new?.updated_at || payload.new?.created_at || Date.now()}`
}

export const createNotification = async (
  userId: string,
  tipo: 'nova_demanda' | 'novo_imovel' | 'imovel_capturado' | 'status_atualizado',
  titulo: string,
  mensagem: string,
  dadosRelacionados: any,
  prioridade: 'alta' | 'normal' | 'baixa',
) => {
  if (!userId) return

  try {
    // Prevent duplicate insertion within a short timeframe
    const { data } = await supabase
      .from('notificacoes')
      .select('id')
      .eq('usuario_id', userId)
      .eq('tipo', tipo)
      .eq('titulo', titulo)
      .gte('created_at', new Date(Date.now() - 30000).toISOString())
      .limit(1)

    if (data && data.length > 0) {
      return // Already exists
    }

    await supabase.from('notificacoes').insert({
      usuario_id: userId,
      tipo,
      titulo,
      mensagem,
      dados_relacionados: dadosRelacionados,
      prioridade,
      lido: false,
    })
  } catch (error) {
    console.error('[createNotification] Falha ao criar notificação:', error)
  }
}

export const processRealtimeNotification = async (
  table: string,
  payload: any,
  currentUser: any,
) => {
  if (!currentUser) return
  if (!payload || !payload.new || !payload.new.id) return

  const hash = generateEventHash(table, payload)
  if (processedEvents.has(hash)) return
  processedEvents.add(hash)

  // Keep set size manageable
  if (processedEvents.size > 500) {
    const arr = Array.from(processedEvents)
    processedEvents.clear()
    arr.slice(250).forEach((i) => processedEvents.add(i))
  }

  try {
    if (table === 'imoveis_captados') {
      const imovel = payload.new
      const oldImovel = payload.old

      if (payload.eventType === 'INSERT') {
        if (imovel.demanda_locacao_id) {
          const { data: demanda } = await supabase
            .from('demandas_locacao')
            .select('sdr_id')
            .eq('id', imovel.demanda_locacao_id)
            .single()
          if (demanda?.sdr_id) {
            await createNotification(
              demanda.sdr_id,
              'novo_imovel',
              'Novo Imóvel Cadastrado',
              `O imóvel ${imovel.codigo_imovel || 'S/C'} foi cadastrado para sua demanda de locação.`,
              { imovel_id: imovel.id, demanda_id: imovel.demanda_locacao_id },
              'normal',
            )
          }
        } else if (imovel.demanda_venda_id) {
          const { data: demanda } = await supabase
            .from('demandas_vendas')
            .select('corretor_id')
            .eq('id', imovel.demanda_venda_id)
            .single()
          if (demanda?.corretor_id) {
            await createNotification(
              demanda.corretor_id,
              'novo_imovel',
              'Novo Imóvel Cadastrado',
              `O imóvel ${imovel.codigo_imovel || 'S/C'} foi cadastrado para sua demanda de venda.`,
              { imovel_id: imovel.id, demanda_id: imovel.demanda_venda_id },
              'normal',
            )
          }
        }
      }

      if (payload.eventType === 'UPDATE') {
        const wasLinkedLocacao = !oldImovel?.demanda_locacao_id && imovel.demanda_locacao_id
        const wasLinkedVenda = !oldImovel?.demanda_venda_id && imovel.demanda_venda_id
        if (
          (wasLinkedLocacao || wasLinkedVenda) &&
          (imovel.user_captador_id || imovel.captador_id)
        ) {
          await createNotification(
            imovel.user_captador_id || imovel.captador_id,
            'imovel_capturado',
            'Imóvel Vinculado',
            `O imóvel ${imovel.codigo_imovel || ''} foi vinculado a uma demanda.`,
            { imovel_id: imovel.id },
            'normal',
          )
        }

        // CRÍTICO: Imóvel marcado como "PERDIDO"
        if (imovel.status_captacao === 'perdido' && oldImovel?.status_captacao !== 'perdido') {
          const usersToNotify = new Set<string>()
          let hasInterestedParties = false

          if (imovel.user_captador_id || imovel.captador_id) {
            usersToNotify.add(imovel.user_captador_id || imovel.captador_id)
            hasInterestedParties = true
          }
          if (imovel.demanda_locacao_id) {
            const { data: demanda } = await supabase
              .from('demandas_locacao')
              .select('sdr_id')
              .eq('id', imovel.demanda_locacao_id)
              .single()
            if (demanda?.sdr_id) {
              usersToNotify.add(demanda.sdr_id)
              hasInterestedParties = true
            }
          }
          if (imovel.demanda_venda_id) {
            const { data: demanda } = await supabase
              .from('demandas_vendas')
              .select('corretor_id')
              .eq('id', imovel.demanda_venda_id)
              .single()
            if (demanda?.corretor_id) {
              usersToNotify.add(demanda.corretor_id)
              hasInterestedParties = true
            }
          }

          const { data: admins } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'admin')
            .eq('status', 'ativo')
          if (admins) {
            admins.forEach((a) => usersToNotify.add(a.id))
          }

          const promises = Array.from(usersToNotify).map((userId) =>
            createNotification(
              userId,
              'status_atualizado', // Using DB enum equivalent to imovel_perdido
              'Imóvel Perdido',
              `O imóvel ${imovel.codigo_imovel || 'S/C'} em ${imovel.localizacao_texto || imovel.endereco || 'localização não informada'} foi marcado como perdido${imovel.observacoes ? ' - Motivo: ' + imovel.observacoes : ''}.`,
              { imovel_id: imovel.id, status: 'perdido' },
              'alta',
            ),
          )
          await Promise.all(promises)
        }
      }
    } else if (table === 'demandas_locacao' || table === 'demandas_vendas') {
      if (payload.eventType === 'INSERT') {
        const { data: captadores } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'captador')
          .eq('status', 'ativo')
        if (captadores) {
          const promises = captadores.map((c) =>
            createNotification(
              c.id,
              'nova_demanda',
              'Nova Demanda',
              `Uma nova demanda foi criada por ${payload.new.nome_cliente || payload.new.cliente_nome || 'Cliente'}.`,
              { demanda_id: payload.new.id },
              'normal',
            ),
          )
          await Promise.all(promises)
        }
      }
    }
  } catch (error) {
    console.error('[processRealtimeNotification] Error:', error)
  }
}
