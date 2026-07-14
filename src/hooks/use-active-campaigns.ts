import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

interface CampanhaRow {
  id: string
  tipo_imovel: string
  faixa_valor_min: number
  faixa_valor_max: number
  status: string
  meta: number
  progresso: number
  data_fim: string
  data_inicio: string
  bairro_alvo: string | null
  created_at: string
  updated_at: string
}

interface CampanhaImovelRow {
  id: string
  campanha_id: string
  imovel_id: string
  captador_id: string | null
  data_adicionado: string
  imovel: {
    codigo_imovel: string | null
    endereco: string | null
    preco: number | null
  } | null
  captador: {
    nome: string | null
    email: string | null
  } | null
}

let _campanhas: CampanhaRow[] = []
let _imoveis: CampanhaImovelRow[] = []
let _loaded = false
let _loading = false
let _needsReload = false
let _channel: any = null
let _listeners: Set<() => void> = new Set()
let _refCount = 0

async function loadData() {
  if (_loading) {
    _needsReload = true
    return
  }
  _loading = true
  _needsReload = false
  try {
    const [campanhasRes, imoveisRes] = await Promise.all([
      supabase
        .from('campanhas')
        .select(
          'id, tipo_imovel, faixa_valor_min, faixa_valor_max, status, meta, progresso, data_fim, data_inicio, bairro_alvo, created_at, updated_at',
        )
        .eq('status', 'ativa'),
      supabase.from('campanhas_imoveis').select(
        `id, campanha_id, imovel_id, captador_id, data_adicionado,
        imovel:imoveis_captados(codigo_imovel, endereco, preco),
        captador:users(nome, email)`,
      ),
    ])
    if (campanhasRes.error)
      console.error('[useActiveCampaigns] campanhas error:', campanhasRes.error)
    if (imoveisRes.error) console.error('[useActiveCampaigns] imoveis error:', imoveisRes.error)
    _campanhas = (campanhasRes.data || []) as CampanhaRow[]
    _imoveis = (imoveisRes.data || []) as unknown as CampanhaImovelRow[]
    _loaded = true
  } catch (err) {
    console.error('[useActiveCampaigns] Load error:', err)
  } finally {
    _loading = false
  }
  _listeners.forEach((fn) => fn())
  if (_needsReload) {
    loadData()
  }
}

function ensureSubscription() {
  if (_channel) return
  _channel = supabase
    .channel('campanhas_shared_demand_cards')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'campanhas' }, () => loadData())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'campanhas_imoveis' }, () =>
      loadData(),
    )
    .subscribe()
}

function cleanupSubscription() {
  if (_channel && _refCount === 0) {
    supabase.removeChannel(_channel)
    _channel = null
    _loaded = false
    _campanhas = []
    _imoveis = []
  }
}

export function useActiveCampaigns() {
  const [, setTick] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    const listener = () => {
      if (mountedRef.current) setTick((t) => t + 1)
    }
    _listeners.add(listener)
    _refCount++

    if (!_loaded && !_loading) {
      loadData()
    }
    ensureSubscription()

    return () => {
      mountedRef.current = false
      _listeners.delete(listener)
      _refCount--
      cleanupSubscription()
    }
  }, [])

  return { campanhas: _campanhas, imoveis: _imoveis }
}

export type { CampanhaRow, CampanhaImovelRow }
