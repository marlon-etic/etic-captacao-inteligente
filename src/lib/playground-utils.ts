import { useSystemStore } from '@/stores/useSystemStore'

/**
 * Helper to append the playground mode filter to a Supabase query builder.
 * Usage: applyPlaygroundFilter(supabase.from('table').select('*'))
 */
export function applyPlaygroundFilter(query: any, tableName?: string) {
  const isPlayground = useSystemStore.getState().isPlaygroundMode

  const supportedTables = ['demandas_locacao', 'demandas_vendas', 'imoveis_captados', 'fechamentos']

  if (tableName && !supportedTables.includes(tableName)) {
    return query
  }

  if (typeof query.eq === 'function') {
    return query.eq('is_test_data', isPlayground)
  }

  return query
}
