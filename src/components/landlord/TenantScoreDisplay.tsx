import React from 'react'

interface TenantScoreDisplayProps {
  score: number
}

export const TenantScoreDisplay: React.FC<TenantScoreDisplayProps> = ({ score }) => {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (s >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excelente'
    if (s >= 60) return 'Bom'
    return 'Atenção'
  }

  return (
    <div
      className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 shadow-sm ${getScoreColor(score)} flex-shrink-0`}
    >
      <span className="text-xl font-black leading-none tracking-tighter">{score}</span>
      <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">
        {getScoreLabel(score)}
      </span>
    </div>
  )
}
