import React, { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function YesterdaySummary({ stats }: { stats: any }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="text-[#10B981] w-5 h-5" />
        <h3 className="font-semibold text-gray-800">Resumo de Ontem</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">Ótimo trabalho ontem! Continue assim.</p>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-blue-50 p-2 rounded text-center">
          <p className="text-xs text-blue-600 font-medium">Novos</p>
          <p className="text-lg font-bold text-blue-700">{stats?.novos_clientes || 0}</p>
        </div>
        <div className="bg-indigo-50 p-2 rounded text-center">
          <p className="text-xs text-indigo-600 font-medium">Visitas</p>
          <p className="text-lg font-bold text-indigo-700">{stats?.visitas || 0}</p>
        </div>
        <div className="bg-emerald-50 p-2 rounded text-center">
          <p className="text-xs text-emerald-600 font-medium">Fechamentos</p>
          <p className="text-lg font-bold text-emerald-700">{stats?.fechamentos || 0}</p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
      </Button>

      {showDetails && (
        <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-500">
          Você converteu{' '}
          {stats?.visitas > 0 ? ((stats.fechamentos / stats.visitas) * 100).toFixed(1) : 0}% das
          suas visitas ontem. Mantenha o foco!
        </div>
      )}
    </div>
  )
}
