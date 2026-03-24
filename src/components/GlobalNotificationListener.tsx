import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAppStore from '@/stores/useAppStore'
import { useNotification } from '@/hooks/useNotification'

export function GlobalNotificationListener() {
  const { currentUser, addNotification } = useAppStore()
  const { showNotification } = useNotification()
  const currentUserRef = useRef(currentUser)
  const addNotificationRef = useRef(addNotification)

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  useEffect(() => {
    addNotificationRef.current = addNotification
  }, [addNotification])

  const playSound = useCallback(() => {
    if (currentUserRef.current?.preferences?.notifications?.channels?.in_app !== false) {
      try {
        const audio = new Audio('/notification.mp3')
        audio.volume = 0.5
        audio.play().catch(() => {
          // ignore play errors
        })
      } catch (e) {
        // ignore audio creation errors
      }
    }
  }, [])

  const fetchDemand = async (
    demanda_locacao_id?: string | null,
    demanda_venda_id?: string | null,
  ) => {
    let d = null
    if (demanda_locacao_id) {
      const { data } = await supabase
        .from('demandas_locacao')
        .select('*')
        .eq('id', demanda_locacao_id)
        .single()
      d = data
    } else if (demanda_venda_id) {
      const { data } = await supabase
        .from('demandas_vendas')
        .select('*')
        .eq('id', demanda_venda_id)
        .single()
      d = data
    }
    return d
      ? {
          id: d.id,
          nome_cliente: d.nome_cliente || d.cliente_nome,
          sdr_id: d.sdr_id,
          corretor_id: d.corretor_id,
        }
      : null
  }

  const fetchUser = async (user_id: string) => {
    const { data } = await supabase.from('users').select('nome').eq('id', user_id).single()
    return data?.nome || 'Captador'
  }

  useEffect(() => {
    let mounted = true

    // Imoveis Captados (Insert & Update)
    const channel1 = supabase
      .channel('global_imoveis_captados_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'imoveis_captados' },
        async (payload) => {
          const imv = payload.new
          const user = currentUserRef.current
          if (!user) return

          const demanda = await fetchDemand(imv.demanda_locacao_id, imv.demanda_venda_id)
          if (!demanda) return

          if (demanda.sdr_id === user.id || demanda.corretor_id === user.id) {
            const clientName = demanda.nome_cliente || 'Cliente'

            // Mostrar toast
            showNotification({
              type: 'success',
              title: `Novo imóvel capturado para ${clientName}!`,
              message: `Código: ${imv.codigo_imovel}, Localização: ${imv.endereco || 'Não informado'}, Preço: R$ ${(imv.preco || imv.valor || 0).toLocaleString('pt-BR')}`,
              icon: '🎉',
              onClickAction: () => {
                window.dispatchEvent(
                  new CustomEvent('navigate-to', { detail: `/app/demandas?id=${demanda.id}` }),
                )
              },
            })
            playSound()

            // Adicionar notificação no Sino
            addNotificationRef.current({
              titulo: `Imóvel Captado: ${clientName}`,
              corpo: `O imóvel código ${imv.codigo_imovel} foi vinculado a esta demanda.\nPreço: R$ ${(imv.preco || imv.valor || 0).toLocaleString('pt-BR')}`,
              tipo_notificacao: 'novo_imovel',
              urgencia: 'alta',
              acao_url: `/app/demandas?id=${demanda.id}`,
              acao_botao: 'Ver no Card',
              usuario_id: user.id,
            })
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'imoveis_captados' },
        async (payload) => {
          const imv = payload.new
          const oldImv = payload.old
          const user = currentUserRef.current

          if (!user || !oldImv || imv.etapa_funil === oldImv.etapa_funil) return

          const captadorId = imv.user_captador_id || imv.captador_id
          if (user.role === 'captador' && captadorId === user.id) {
            const demanda = await fetchDemand(imv.demanda_locacao_id, imv.demanda_venda_id)
            const demandId = demanda ? demanda.id : imv.demanda_locacao_id || imv.demanda_venda_id

            if (imv.etapa_funil === 'visitado') {
              showNotification({
                type: 'warning',
                title: 'Imóvel Visitado',
                message: `Imóvel ${imv.codigo_imovel} marcado como visitado`,
                icon: '👁️',
                onClickAction: () => {
                  if (demandId)
                    window.dispatchEvent(
                      new CustomEvent('navigate-to', { detail: `/app/demandas?id=${demandId}` }),
                    )
                },
              })
              playSound()

              addNotificationRef.current({
                titulo: 'Imóvel Visitado',
                corpo: `Imóvel ${imv.codigo_imovel} marcado como visitado.`,
                tipo_notificacao: 'visita',
                urgencia: 'media',
                acao_url: demandId ? `/app/demandas?id=${demandId}` : undefined,
                usuario_id: user.id,
              })
            } else if (imv.etapa_funil === 'fechado') {
              showNotification({
                type: 'success',
                title: 'Negócio Fechado!',
                message: `Imóvel ${imv.codigo_imovel} marcado como fechado! Você ganhou 30 pontos!`,
                icon: '✅',
                onClickAction: () => {
                  if (demandId)
                    window.dispatchEvent(
                      new CustomEvent('navigate-to', { detail: `/app/demandas?id=${demandId}` }),
                    )
                },
              })
              playSound()

              addNotificationRef.current({
                titulo: 'Negócio Fechado! 🎉',
                corpo: `Imóvel ${imv.codigo_imovel} marcado como fechado!`,
                tipo_notificacao: 'negocio',
                urgencia: 'alta',
                acao_url: demandId ? `/app/demandas?id=${demandId}` : undefined,
                usuario_id: user.id,
              })
            }
          }
        },
      )
      .subscribe()

    // Respostas Captador (Não encontrei)
    const channel2 = supabase
      .channel('global_respostas_captador_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'respostas_captador' },
        async (payload) => {
          const resp = payload.new
          const user = currentUserRef.current
          if (!user || resp.resposta !== 'nao_encontrei') return

          const demanda = await fetchDemand(resp.demanda_locacao_id, resp.demanda_venda_id)
          if (!demanda) return

          if (demanda.sdr_id === user.id || demanda.corretor_id === user.id) {
            const captadorNome = await fetchUser(resp.captador_id)
            showNotification({
              type: 'error',
              title: 'Busca sem sucesso',
              message: `Captador ${captadorNome} não encontrou imóvel para ${demanda.nome_cliente}. Motivo: ${resp.motivo}${resp.observacao ? `\nObservação: ${resp.observacao}` : ''}`,
              icon: '❌',
              onClickAction: () => {
                window.dispatchEvent(
                  new CustomEvent('navigate-to', { detail: `/app/demandas?id=${demanda.id}` }),
                )
              },
              customColor: 'bg-[#F97316] text-white',
            })
            playSound()

            addNotificationRef.current({
              titulo: `Busca sem sucesso: ${demanda.nome_cliente}`,
              corpo: `Captador ${captadorNome} não encontrou imóvel. Motivo: ${resp.motivo}`,
              tipo_notificacao: 'demanda_respondida',
              urgencia: 'media',
              acao_url: `/app/demandas?id=${demanda.id}`,
              acao_botao: 'Ver Detalhes',
              usuario_id: user.id,
            })
          }
        },
      )
      .subscribe()

    // Prazos Captacao
    const channel3 = supabase
      .channel('global_prazos_captacao_notifications')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'prazos_captacao' },
        async (payload) => {
          const newP = payload.new
          const oldP = payload.old
          const user = currentUserRef.current
          if (!user || !oldP) return

          const demanda = await fetchDemand(newP.demanda_locacao_id, newP.demanda_venda_id)
          if (!demanda) return

          if (demanda.sdr_id === user.id || demanda.corretor_id === user.id) {
            if (newP.prorrogacoes_usadas > (oldP.prorrogacoes_usadas || 0)) {
              const captadorNome = newP.captador_id ? await fetchUser(newP.captador_id) : 'Captador'
              showNotification({
                type: 'warning',
                title: 'Prazo Prorrogado',
                message: `Captador ${captadorNome} prorrogou prazo para ${demanda.nome_cliente} até ${new Date(newP.prazo_resposta).toLocaleString('pt-BR')}. Prorrogações usadas: ${newP.prorrogacoes_usadas}/3`,
                icon: '⏰',
                onClickAction: () => {
                  window.dispatchEvent(
                    new CustomEvent('navigate-to', { detail: `/app/demandas?id=${demanda.id}` }),
                  )
                },
              })
              playSound()

              addNotificationRef.current({
                titulo: `Prazo Prorrogado: ${demanda.nome_cliente}`,
                corpo: `Captador ${captadorNome} prorrogou até ${new Date(newP.prazo_resposta).toLocaleString('pt-BR')}.`,
                tipo_notificacao: 'perdido',
                urgencia: 'baixa',
                acao_url: `/app/demandas?id=${demanda.id}`,
                usuario_id: user.id,
              })
            }

            if (
              (newP.status === 'sem_resposta_24h' ||
                newP.status === 'sem_resposta_final' ||
                newP.status === 'vencido') &&
              oldP.status === 'ativo'
            ) {
              showNotification({
                type: 'error',
                title: 'Prazo Vencido',
                message: `Prazo vencido para ${demanda.nome_cliente}. Nenhuma resposta de Captadores.`,
                icon: '⚠️',
                onClickAction: () => {
                  window.dispatchEvent(
                    new CustomEvent('navigate-to', { detail: `/app/demandas?id=${demanda.id}` }),
                  )
                },
              })
              playSound()

              addNotificationRef.current({
                titulo: `Prazo Vencido: ${demanda.nome_cliente}`,
                corpo: `Nenhuma resposta de Captadores no prazo definido.`,
                tipo_notificacao: 'perdido',
                urgencia: 'alta',
                acao_url: `/app/demandas?id=${demanda.id}`,
                acao_botao: 'Ver Demanda',
                usuario_id: user.id,
              })
            }
          }
        },
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel1)
      supabase.removeChannel(channel2)
      supabase.removeChannel(channel3)
    }
  }, [showNotification, playSound])

  return null
}
