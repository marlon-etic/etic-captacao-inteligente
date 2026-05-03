import React from 'react'
import { AlertTriangle } from 'lucide-react'

export function CheckInAlert() {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md flex items-start gap-3 shadow-sm animate-fade-in">
      <AlertTriangle className="text-amber-500 w-6 h-6 shrink-0 mt-0.5" />
      <div>
        <h3 className="text-amber-800 font-bold text-sm md:text-base">Atenção!</h3>
        <p className="text-amber-700 text-sm mt-1">
          Você não registrou um novo cliente nas últimas 24h! Vamos começar?
        </p>
      </div>
    </div>
  )
}
