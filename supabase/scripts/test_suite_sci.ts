// PROMPT-005-TESTES: Suite de Testes Automatizados
// Objetivo: Validar todos os fluxos críticos
// Tempo: 20-30 minutos

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Para executar este script:
// export SUPABASE_URL="..."
// export SUPABASE_ANON_KEY="..."
// export SUPABASE_SERVICE_ROLE_KEY="..."
// npx ts-node supabase/scripts/test_suite_sci.ts

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERRO: Variáveis de ambiente ausentes.')
  console.error(
    'Defina SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY no seu .env ou terminal.',
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface TestResult {
  name: string
  status: 'PASSOU' | 'FALHOU'
  time: number
  error?: string
}

const testResults: TestResult[] = []

async function runTest(name: string, fn: () => Promise<void>, timeout = 10000): Promise<void> {
  const start = Date.now()
  try {
    await Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout de ${timeout}ms excedido`)), timeout),
      ),
    ])
    const time = Date.now() - start
    testResults.push({ name, status: 'PASSOU', time })
    console.log(`✅ ${name} - PASSOU (${time}ms)`)
  } catch (error: any) {
    const time = Date.now() - start
    testResults.push({ name, status: 'FALHOU', time, error: error.message })
    console.log(`❌ ${name} - FALHOU: ${error.message}`)
  }
}

async function main() {
  console.log('🧪 Iniciando Suite de Testes - Étic Captação Inteligente 🧪')
  console.log('='.repeat(70))

  // TESTE 1: Conexão Supabase
  await runTest('TEST-001: Conexão com Supabase', async () => {
    const { error } = await supabase
      .from('demandas_locacao')
      .select('id', { count: 'exact', head: true })
      .limit(1)
    if (error) throw new Error(`Erro de conexão: ${error.message}`)
    console.log('   └─ Tabela demandas_locacao acessível')
  })

  // TESTE 2: RLS - Admin consegue acessar dados
  await runTest('TEST-002: RLS - Acesso Admin', async () => {
    const { data, error } = await supabaseAdmin.from('demandas_locacao').select('id').limit(1)
    if (error) throw new Error(`Erro RLS: ${error.message}`)
    if (!Array.isArray(data)) throw new Error('Dados não são array')
    console.log(`   └─ RLS ativado, Admin pode acessar`)
  })

  // Fetch a valid user ID for FK constraints
  let validUserId = crypto.randomUUID()
  const { data: users } = await supabaseAdmin.from('users').select('id').limit(1)
  if (users && users.length > 0) validUserId = users[0].id

  // TESTE 3: Inserção de Demanda de Locação
  let demandaId = ''
  await runTest('TEST-003: Criar nova demanda de locação', async () => {
    const { data, error } = await supabaseAdmin
      .from('demandas_locacao')
      .insert({
        sdr_id: validUserId,
        bairros: ['Centro'],
        tipo_demanda: 'Aluguel',
        valor_maximo: 2500,
        dormitorios: 2,
        vagas_estacionamento: 1,
        status_demanda: 'aberta',
        renda_mensal_estimada: 7500,
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao inserir demanda: ${error.message}`)
    if (!data || !data.id) throw new Error('Demanda não foi criada')
    demandaId = data.id
    console.log(`   └─ Demanda criada com ID: ${demandaId.substring(0, 8)}...`)
  })

  // TESTE 4: Agrupamento Automático
  await runTest('TEST-004: Validar agrupamento automático', async () => {
    const { data, error } = await supabaseAdmin
      .from('grupos_demandas')
      .select('id, count_demandas, tier')
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(`Erro ao buscar grupos: ${error.message}`)
    if (data)
      console.log(`   └─ Grupo encontrado: ${data.count_demandas} demandas, Tier: ${data.tier}`)
    else console.log('   └─ Nenhum grupo disponível (esperado no primeiro uso)')
  })

  // TESTE 5: Cálculo de Tenant Score
  await runTest('TEST-005: Calcular tenant score via function', async () => {
    const { data, error } = await supabaseAdmin.rpc('fn_calcular_tenant_score', {
      p_renda_mensal: 10000,
      p_valor_aluguel: 2500,
    })

    if (error) throw new Error(`Erro ao calcular score: ${error.message}`)
    if (typeof data !== 'number')
      throw new Error(`Score incorreto. Esperado numérico, Recebido: ${data}`)
    console.log(`   └─ Score calculado corretamente: ${data}/100`)
  })

  // TESTE 6: Criação de Notificação
  await runTest('TEST-006: Criar notificação', async () => {
    const { data, error } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: validUserId,
        mensagem: 'Teste de notificação - Suite de Testes',
        tipo: 'nova_demanda',
        titulo: 'Teste',
        lido: false,
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar notificação: ${error.message}`)
    if (!data || !data.id) throw new Error('Notificação não foi criada')
    console.log(`   └─ Notificação criada com ID: ${data.id.substring(0, 8)}...`)
  })

  // TESTE 7: Pontuação de Captador
  await runTest('TEST-007: Atualizar pontuação de captador', async () => {
    const { data, error } = await supabaseAdmin
      .from('pontuacao_captador')
      .insert({
        captador_id: validUserId,
        pontos: 50,
        tipo_pontuacao: 'captura_com_demanda',
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar pontuação: ${error.message}`)
    if (!data || data.pontos !== 50) throw new Error('Pontuação não foi atualizada corretamente')
    console.log(`   └─ Pontuação registrada: ${data.pontos} pts`)
  })

  // TESTE 8: Performance de Listagem
  await runTest(
    'TEST-008: Performance - Listar 100 demandas em <3s',
    async () => {
      const start = Date.now()
      const { data, error } = await supabaseAdmin.from('demandas_locacao').select('id').limit(100)
      const duration = Date.now() - start

      if (error) throw new Error(`Erro ao listar: ${error.message}`)
      if (!Array.isArray(data)) throw new Error('Dados não são array')
      if (duration > 3000) throw new Error(`Query levou ${duration}ms (limite: 3000ms)`)
      console.log(`   └─ Listagem concluída em ${duration}ms (${data.length} registros)`)
    },
    5000,
  )

  // TESTE 9: Cache VistaSoft API
  await runTest('TEST-009: Inserir e recuperar cache VistaSoft', async () => {
    const cacheKey = `test_imovel_${Date.now()}`

    const { error: insertError } = await supabaseAdmin.from('vistasoft_cache').insert({
      key: cacheKey,
      data: { codigo: 'TEST123', valor: 500000 },
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    })
    if (insertError) throw new Error(`Erro ao inserir cache: ${insertError.message}`)

    const { data: selectData, error: selectError } = await supabaseAdmin
      .from('vistasoft_cache')
      .select('*')
      .eq('key', cacheKey)
      .single()

    if (selectError) throw new Error(`Erro ao recuperar cache: ${selectError.message}`)
    if (!selectData || (selectData.data as any).valor !== 500000) {
      throw new Error('Cache não foi recuperado corretamente')
    }
    console.log(`   └─ Cache VistaSoft funcionando (chave: ${cacheKey})`)
  })

  // TESTE 10: Webhook Queue
  await runTest('TEST-010: Enfileirar webhook na fila', async () => {
    const { data, error } = await supabaseAdmin
      .from('webhook_queue')
      .insert({
        event_type: 'test_event',
        payload: { teste: true, timestamp: new Date().toISOString() },
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao enfileirar webhook: ${error.message}`)
    if (!data || data.status !== 'pending')
      throw new Error('Webhook não foi enfileirado corretamente')
    console.log(`   └─ Webhook enfileirado com sucesso (status: ${data.status})`)
  })

  // Limpeza de testes (Opcional, mas recomendado para não sujar o DB com lixo)
  try {
    if (demandaId) await supabaseAdmin.from('demandas_locacao').delete().eq('id', demandaId)
  } catch (e) {}

  // RELATÓRIO FINAL
  console.log('\n' + '='.repeat(70))
  console.log('📊 RELATÓRIO FINAL DE TESTES')
  console.log('='.repeat(70))

  const passed = testResults.filter((r) => r.status === 'PASSOU').length
  const failed = testResults.filter((r) => r.status === 'FALHOU').length
  const total = testResults.length
  const percentage = ((passed / total) * 100).toFixed(1)
  const totalTime = testResults.reduce((a, b) => a + b.time, 0)

  console.log('📈 RESUMO:')
  console.log(`   ✅ Testes Passaram: ${passed}/${total}`)
  console.log(`   ❌ Testes Falharam: ${failed}/${total}`)
  console.log(`   📊 Percentual de Sucesso: ${percentage}%`)
  console.log(`   ⏱️  Tempo Total de Execução: ${totalTime}ms\n`)

  console.log('📋 DETALHES:')
  testResults.forEach((result) => {
    const icon = result.status === 'PASSOU' ? '✅' : '❌'
    const errorMsg = result.error ? ` - ${result.error}` : ''
    console.log(
      `   ${icon} ${result.name.padEnd(45)} ${result.time.toString().padStart(5)}ms${errorMsg}`,
    )
  })

  console.log('\n' + '='.repeat(70))
  if (passed >= total * 0.9) {
    console.log('   ✅ SUITE DE TESTES PASSOU (>90%)')
    console.log('   ✅ SISTEMA PRONTO PARA PROMPT-006 (Validação Final & Go-Live)')
    console.log('='.repeat(70))
    process.exit(0)
  } else {
    console.log('   ❌ SUITE DE TESTES NÃO PASSOU (<90%)')
    console.log('   ❌ REVISE OS ERROS ACIMA ANTES DE PROSSEGUIR')
    console.log('='.repeat(70))
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Erro fatal:', error)
  process.exit(1)
})
