import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { calculateMatching, ImovelForMatching } from '@/lib/matching'

export interface QuickMatchClient {
  id: string
  nome: string
}

export function useQuickMatchCount(propertyParams: ImovelForMatching & { tipo?: string }) {
  const [count, setCount] = useState<number | null>(null)
  const [matchedClients, setMatchedClients] = useState<QuickMatchClient[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchMatches() {
      if (!propertyParams.preco || !propertyParams.tipo || !propertyParams.tipo_imovel) {
        setCount(0)
        setMatchedClients([])
        return
      }

      setLoading(true)
      try {
        let clients: QuickMatchClient[] = []

        const checkType = async (table: 'demandas_vendas' | 'demandas_locacao') => {
          const { data, error } = await supabase
            .from(table)
            .select(
              'id, nome_cliente, bairros, valor_maximo, dormitorios, vagas_estacionamento, tipo_imovel',
            )
            .in('status_demanda', ['aberta', 'em_andamento'])

          if (error) {
            console.error('[useQuickMatchCount] Query Error:', error)
            return []
          }

          const imovelMock: ImovelForMatching = {
            endereco: propertyParams.endereco,
            preco: propertyParams.preco,
            dormitorios: propertyParams.dormitorios || 0,
            vagas: propertyParams.vagas || 0,
            tipo_imovel: propertyParams.tipo_imovel,
          }

          const validClients: QuickMatchClient[] = []
          for (const d of data || []) {
            const match = calculateMatching(imovelMock, {
              bairros: d.bairros || [],
              valor_maximo: d.valor_maximo || 0,
              dormitorios: d.dormitorios || 0,
              vagas_estacionamento: d.vagas_estacionamento || 0,
              tipo_imovel: d.tipo_imovel || '',
            })

            if (match.score >= 60) {
              validClients.push({ id: d.id, nome: d.nome_cliente || 'Cliente' })
            }
          }
          return validClients
        }

        if (propertyParams.tipo === 'Venda' || propertyParams.tipo === 'Ambos') {
          clients = clients.concat(await checkType('demandas_vendas'))
        }
        if (propertyParams.tipo === 'Locação' || propertyParams.tipo === 'Ambos') {
          clients = clients.concat(await checkType('demandas_locacao'))
        }

        setCount(clients.length)
        setMatchedClients(clients)
      } catch (e) {
        console.error('Error fetching match count', e)
        setCount(0)
        setMatchedClients([])
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchMatches, 600)
    return () => clearTimeout(timer)
  }, [
    propertyParams.preco,
    propertyParams.endereco,
    propertyParams.tipo,
    propertyParams.tipo_imovel,
    propertyParams.dormitorios,
    propertyParams.vagas,
  ])

  return { count, matchedClients, loading }
}
