import React from 'react'

export function TodaySummaryCards({ stats }: { stats: any }) {
  const conv = stats?.visitas > 0 ? ((stats.fechamentos / stats.visitas) * 100).toFixed(1) : 0

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <h3 className="font-semibold text-gray-800 mb-4">Resumo em Tempo Real (Hoje)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-3 text-center bg-gray-50">
          <p className="text-xs text-gray-500">Criados</p>
          <p className="text-xl font-bold text-gray-800">{stats?.novos_clientes || 0}</p>
        </div>
        <div className="border rounded-lg p-3 text-center bg-gray-50">
          <p className="text-xs text-gray-500">Visitas</p>
          <p className="text-xl font-bold text-[#0070f3]">{stats?.visitas || 0}</p>
        </div>
        <div className="border rounded-lg p-3 text-center bg-gray-50">
          <p className="text-xs text-gray-500">Fechamentos</p>
          <p className="text-xl font-bold text-[#10B981]">{stats?.fechamentos || 0}</p>
        </div>
        <div className="border rounded-lg p-3 text-center bg-gray-50">
          <p className="text-xs text-gray-500">Conversão</p>
          <p className="text-xl font-bold text-purple-600">{conv}%</p>
        </div>
      </div>
    </div>
  )
}
