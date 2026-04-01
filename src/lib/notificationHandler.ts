import { supabase } from '@/lib/supabase/client'

const processedEvents = new Set<string>()

const generateEventHash = (table: string, payload: any) => {
  return `${table}_${payload.eventType}_${payload.new?.id}_${payload.new?.updated_at || payload.new?.created_at || Date.now()}`
}

export const createNotification = async (
  userId: string,
  tipo:
    | 'nova_demanda'
    | 'novo_imovel'
    | 'imovel_capturado'
    | 'status_atualizado'
    | 'busca_iniciada_outros'
    | 'busca_iniciada_responsavel'
    | 'busca_iniciada_admin',
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

export const getUsersByRole = async (role: string) => {
  const { data } = await supabase.from('users').select('id').eq('role', role).eq('status', 'ativo')
  return data?.map((u) => u.id) || []
}

export const notifyBuscaIniciada = async (
  demandaId: string,
  demandaTipo: 'Aluguel' | 'Venda',
  clienteNome: string,
  bairros: string[],
  captadorId: string,
  captadorNome: string,
  responsavelId: string | null,
) => {
  try {
    const checkDuplicate = async (userId: string, tipo: string) => {
      const { data } = await supabase
        .from('notificacoes')
        .select('id')
        .eq('usuario_id', userId)
        .eq('tipo', tipo as any)
        .filter('dados_relacionados->>demanda_id', 'eq', demandaId)
        .limit(1)
      return data && data.length > 0
    }

    // 1. Admin
    const admins = await getUsersByRole('admin')
    for (const adminId of admins) {
      if (!(await checkDuplicate(adminId, 'busca_iniciada_admin'))) {
        await createNotification(
          adminId,
          'busca_iniciada_admin' as any,
          'Busca atribuída',
          `${captadorNome} atribuído à demanda ${clienteNome}`,
          { demanda_id: demandaId, tipo_demanda: demandaTipo },
          'normal',
        )
      }
    }

    // 2. Responsável
    if (responsavelId && !admins.includes(responsavelId)) {
      if (!(await checkDuplicate(responsavelId, 'busca_iniciada_responsavel'))) {
        await createNotification(
          responsavelId,
          'busca_iniciada_responsavel' as any,
          'Captador atribuído',
          `${captadorNome} está buscando imóvel para sua demanda ${clienteNome}`,
          { demanda_id: demandaId, tipo_demanda: demandaTipo },
          'normal',
        )
      }
    }

    // 3. Outros Captadores
    const captadores = await getUsersByRole('captador')
    for (const capId of captadores) {
      if (capId !== captadorId) {
        if (!(await checkDuplicate(capId, 'busca_iniciada_outros'))) {
          await createNotification(
            capId,
            'busca_iniciada_outros' as any,
            'Demanda em busca',
            `${captadorNome} está buscando imóvel para demanda ${clienteNome} em ${bairros.join(', ')}`,
            { demanda_id: demandaId, tipo_demanda: demandaTipo },
            'normal',
          )
        }
      }
    }
  } catch (err) {
    console.error('Erro ao enviar notificacoes de busca iniciada:', err)
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
    const admins = await getUsersByRole('admin')

    if (table === 'imoveis_captados') {
      const imovel = payload.new
      const oldImovel = payload.old || {}

      const usersToNotify = new Set<string>()
      const captadorId = imovel.user_captador_id || imovel.captador_id
      let sdrId = null
      let corretorId = null

      if (imovel.demanda_locacao_id) {
        const { data: demanda } = await supabase
          .from('demandas_locacao')
          .select('sdr_id')
          .eq('id', imovel.demanda_locacao_id)
          .single()
        sdrId = demanda?.sdr_id
      }
      if (imovel.demanda_venda_id) {
        const { data: demanda } = await supabase
          .from('demandas_vendas')
          .select('corretor_id')
          .eq('id', imovel.demanda_venda_id)
          .single()
        corretorId = demanda?.corretor_id
      }

      if (payload.eventType === 'INSERT') {
        admins.forEach((id) => usersToNotify.add(id))
        if (captadorId) usersToNotify.add(captadorId)
        if (sdrId) usersToNotify.add(sdrId)
        if (corretorId) usersToNotify.add(corretorId)

        if (!imovel.demanda_locacao_id && !imovel.demanda_venda_id) {
          if (imovel.tipo === 'Aluguel' || imovel.tipo === 'Ambos') {
            const sdrs = await getUsersByRole('sdr')
            sdrs.forEach((id) => usersToNotify.add(id))
          }
          if (imovel.tipo === 'Venda' || imovel.tipo === 'Ambos') {
            const corretores = await getUsersByRole('corretor')
            corretores.forEach((id) => usersToNotify.add(id))
          }
        }

        const promises = Array.from(usersToNotify).map((userId) =>
          createNotification(
            userId,
            'novo_imovel',
            'Novo Imóvel Cadastrado',
            `O imóvel ${imovel.codigo_imovel || 'S/C'} foi cadastrado no sistema.`,
            { imovel_id: imovel.id },
            'normal',
          ),
        )
        await Promise.all(promises)
      }

      if (payload.eventType === 'UPDATE') {
        const wasLinkedLocacao = !oldImovel?.demanda_locacao_id && imovel.demanda_locacao_id
        const wasLinkedVenda = !oldImovel?.demanda_venda_id && imovel.demanda_venda_id

        if (wasLinkedLocacao || wasLinkedVenda) {
          usersToNotify.clear()
          admins.forEach((id) => usersToNotify.add(id))
          if (captadorId) usersToNotify.add(captadorId)
          if (sdrId) usersToNotify.add(sdrId)
          if (corretorId) usersToNotify.add(corretorId)

          const promises = Array.from(usersToNotify).map((userId) =>
            createNotification(
              userId,
              'imovel_capturado',
              'Imóvel Vinculado',
              `O imóvel ${imovel.codigo_imovel || 'S/C'} foi vinculado a uma demanda.`,
              {
                imovel_id: imovel.id,
                demanda_id: imovel.demanda_locacao_id || imovel.demanda_venda_id,
              },
              'normal',
            ),
          )
          await Promise.all(promises)
        }

        const visitado = imovel.etapa_funil === 'visitado' && oldImovel.etapa_funil !== 'visitado'
        if (visitado) {
          usersToNotify.clear()
          admins.forEach((id) => usersToNotify.add(id))
          if (captadorId) usersToNotify.add(captadorId)
          if (sdrId) usersToNotify.add(sdrId)
          if (corretorId) usersToNotify.add(corretorId)

          const promises = Array.from(usersToNotify).map((userId) =>
            createNotification(
              userId,
              'status_atualizado',
              'Visita Agendada',
              `Visita marcada para o imóvel ${imovel.codigo_imovel || 'S/C'}.`,
              { imovel_id: imovel.id, status: 'visitado' },
              'normal',
            ),
          )
          await Promise.all(promises)
        }

        const fechado =
          (imovel.etapa_funil === 'fechado' && oldImovel.etapa_funil !== 'fechado') ||
          (imovel.status_captacao === 'fechado' && oldImovel.status_captacao !== 'fechado')
        if (fechado) {
          usersToNotify.clear()
          admins.forEach((id) => usersToNotify.add(id))
          if (captadorId) usersToNotify.add(captadorId)
          if (sdrId) usersToNotify.add(sdrId)
          if (corretorId) usersToNotify.add(corretorId)

          const promises = Array.from(usersToNotify).map((userId) =>
            createNotification(
              userId,
              'status_atualizado',
              'Negócio Fechado! 🎉',
              `O imóvel ${imovel.codigo_imovel || 'S/C'} foi fechado com sucesso!`,
              { imovel_id: imovel.id, status: 'fechado' },
              'alta',
            ),
          )
          await Promise.all(promises)
        }

        const perdido =
          imovel.status_captacao === 'perdido' && oldImovel.status_captacao !== 'perdido'
        if (perdido) {
          usersToNotify.clear()
          admins.forEach((id) => usersToNotify.add(id))
          if (captadorId) usersToNotify.add(captadorId)
          if (sdrId) usersToNotify.add(sdrId)
          if (corretorId) usersToNotify.add(corretorId)

          const promises = Array.from(usersToNotify).map((userId) =>
            createNotification(
              userId,
              'status_atualizado',
              'Imóvel Perdido',
              `O imóvel ${imovel.codigo_imovel || 'S/C'} foi marcado como perdido.`,
              { imovel_id: imovel.id, status: 'perdido' },
              'alta',
            ),
          )
          await Promise.all(promises)
        }
      }
    } else if (table === 'demandas_locacao' || table === 'demandas_vendas') {
      const demanda = payload.new
      const oldDemanda = payload.old || {}
      const isLocacao = table === 'demandas_locacao'
      const ownerId = isLocacao ? demanda.sdr_id : demanda.corretor_id

      const captadores = await getUsersByRole('captador')
      const usersToNotify = new Set<string>()

      if (payload.eventType === 'INSERT') {
        admins.forEach((id) => usersToNotify.add(id))
        captadores.forEach((id) => usersToNotify.add(id))
        if (ownerId) usersToNotify.add(ownerId)

        const promises = Array.from(usersToNotify).map((userId) =>
          createNotification(
            userId,
            'nova_demanda',
            isLocacao ? 'Nova Demanda de Locação' : 'Nova Demanda de Venda',
            `Uma nova demanda foi criada para ${demanda.nome_cliente || demanda.cliente_nome || 'Cliente'}.`,
            { demanda_id: demanda.id, tipo_demanda: isLocacao ? 'Aluguel' : 'Venda' },
            'normal',
          ),
        )
        await Promise.all(promises)
      }

      if (payload.eventType === 'UPDATE') {
        const ganho = demanda.status_demanda === 'ganho' && oldDemanda.status_demanda !== 'ganho'
        const perdido =
          demanda.status_demanda &&
          demanda.status_demanda.includes('PERDIDA') &&
          oldDemanda.status_demanda !== demanda.status_demanda

        if (ganho || perdido) {
          admins.forEach((id) => usersToNotify.add(id))
          if (ownerId) usersToNotify.add(ownerId)

          const promises = Array.from(usersToNotify).map((userId) =>
            createNotification(
              userId,
              'status_atualizado',
              ganho ? 'Demanda Ganha! 🏆' : 'Demanda Perdida',
              `A demanda de ${demanda.nome_cliente || demanda.cliente_nome || 'Cliente'} foi marcada como ${ganho ? 'ganha' : 'perdida'}.`,
              { demanda_id: demanda.id, status: demanda.status_demanda },
              ganho ? 'alta' : 'normal',
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
