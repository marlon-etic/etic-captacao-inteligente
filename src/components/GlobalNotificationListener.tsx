import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAppStore from '@/stores/useAppStore'
import { useNotification } from '@/hooks/useNotification'

export function GlobalNotificationListener() {
  const { currentUser } = useAppStore()
  const { showNotification } = useNotification()
  const currentUserRef = useRef(currentUser)

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

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
            showNotification({
              type: 'success',
              title: `Novo imóvel capturado para ${demanda.nome_cliente}!`,
              message: `Código: ${imv.codigo_imovel}, Localização: ${imv.endereco || 'Não informado'}, Preço: R$ ${(imv.preco || imv.valor || 0).toLocaleString('pt-BR')}`,
              icon: '🎉',
              onClickAction: () => {
                window.dispatchEvent(
                  new CustomEvent('navigate-to', { detail: `/app/demandas?id=${demanda.id}` }),
                )
              },
            })
            playSound()
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
              customColor: 'bg-[#F97316] text-white', // Laranja #F97316
            })
            playSound()
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
