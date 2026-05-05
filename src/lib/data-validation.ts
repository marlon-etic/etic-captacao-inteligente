import { supabase } from '@/lib/supabase/client'

export interface DataValidationResult {
  isValid: boolean
  totalIssues: number
  issues: {
    type: string
    severity: string
    message: string
    affectedCount: number
  }[]
}

export async function validateDataIntegrity(): Promise<DataValidationResult> {
  const issues = []

  try {
    console.log('[validateDataIntegrity] Iniciando validação...')

    // Validação 1: Verificar eventos órfãos
    const { data: allEvents } = await supabase
      .from('analytics_events')
      .select('id, users(id)')
      .limit(1000)

    const orphanedEvents = allEvents?.filter((e) => !e.users) || []
    if (orphanedEvents.length > 0) {
      issues.push({
        type: 'orphaned_events',
        severity: 'critical',
        message: `${orphanedEvents.length} eventos referenciando usuários deletados (amostra de 1000)`,
        affectedCount: orphanedEvents.length,
      })
    }

    // Validação 2: Verificar imóveis sem referência válida
    const { data: allProps } = await supabase
      .from('imoveis_captados')
      .select('id, users!fk_imoveis_captador(id)')
      .limit(1000)

    const orphanedProperties = allProps?.filter((p) => !p.users) || []
    if (orphanedProperties.length > 0) {
      issues.push({
        type: 'orphaned_properties',
        severity: 'critical',
        message: `${orphanedProperties.length} imóveis referenciando captadores deletados (amostra de 1000)`,
        affectedCount: orphanedProperties.length,
      })
    }

    // Validação 3: Verificar demandas sem referência válida
    const { data: allDemands } = await supabase
      .from('demandas_locacao')
      .select('id, users!fk_demandas_locacao_sdr(id)')
      .limit(1000)

    const orphanedDemands = allDemands?.filter((d) => !d.users) || []
    if (orphanedDemands.length > 0) {
      issues.push({
        type: 'orphaned_demands',
        severity: 'warning',
        message: `${orphanedDemands.length} demandas referenciando SDRs deletados (amostra de 1000)`,
        affectedCount: orphanedDemands.length,
      })
    }

    // Validação 4: Verificar imóveis com tipo inválido
    const { data: invalidTypes } = await supabase
      .from('imoveis_captados')
      .select('id, tipo')
      .not('tipo', 'in', '("Venda","Locação","Aluguel","Ambos")')

    if ((invalidTypes?.length || 0) > 0) {
      issues.push({
        type: 'invalid_property_type',
        severity: 'warning',
        message: `${invalidTypes?.length || 0} imóveis com tipo inválido`,
        affectedCount: invalidTypes?.length || 0,
      })
    }

    // Validação 5: Verificar datas inconsistentes
    const { data: invalidDates } = await supabase
      .from('imoveis_captados')
      .select('id, created_at, data_visita')
      .not('data_visita', 'is', null)

    const invalidDatesCount =
      invalidDates?.filter((i) => new Date(i.data_visita!) < new Date(i.created_at!)).length || 0
    if (invalidDatesCount > 0) {
      issues.push({
        type: 'invalid_dates',
        severity: 'warning',
        message: `${invalidDatesCount} imóveis com data de visita anterior à criação`,
        affectedCount: invalidDatesCount,
      })
    }

    console.log(`[validateDataIntegrity] Validação concluída. Issues: ${issues.length}`)

    return {
      isValid: issues.length === 0,
      totalIssues: issues.length,
      issues,
    }
  } catch (err) {
    console.error('[validateDataIntegrity] Erro:', err)
    return {
      isValid: false,
      totalIssues: 1,
      issues: [
        {
          type: 'validation_error',
          severity: 'critical',
          message: 'Erro ao validar integridade de dados',
          affectedCount: 0,
        },
      ],
    }
  }
}

export async function validateMetric(
  metricType: string,
  userId?: string,
  dateRange?: { start: string; end: string },
): Promise<{ count: number; isValid: boolean }> {
  try {
    let query = supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', metricType)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (dateRange) {
      query = query.gte('created_at', dateRange.start).lt('created_at', dateRange.end)
    }

    const { count, error } = await query

    if (error) throw error

    return {
      count: count || 0,
      isValid: true,
    }
  } catch (err) {
    console.error('[validateMetric] Erro:', err)
    return {
      count: 0,
      isValid: false,
    }
  }
}
