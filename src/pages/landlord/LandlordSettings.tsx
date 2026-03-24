import React from 'react'
import { useLandlordAuth } from '@/hooks/useLandlordAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Shield } from 'lucide-react'

export default function LandlordSettings() {
  const { landlordProfile } = useLandlordAuth()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto animate-fade-in-up">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-2xl md:text-3xl font-black text-[#1A3A52] tracking-tight">
          Configurações
        </h2>
        <p className="text-gray-500 text-sm font-medium mt-1">
          Gerencie os dados do seu perfil e preferências.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Dados Pessoais</CardTitle>
              <CardDescription>Informações básicas da sua conta.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">
                Nome Completo
              </Label>
              <Input
                value={landlordProfile?.name || ''}
                readOnly
                className="bg-gray-50 cursor-not-allowed font-medium text-gray-700 h-12"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">
                  Email
                </Label>
                <Input
                  value={landlordProfile?.email || ''}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed font-medium text-gray-700 h-12"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">
                  Telefone
                </Label>
                <Input
                  value={landlordProfile?.phone || ''}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed font-medium text-gray-700 h-12"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-bold text-gray-500">
                Código de Locador (Sincronização)
              </Label>
              <Input
                value={landlordProfile?.codigo_locador || ''}
                readOnly
                className="bg-gray-50 cursor-not-allowed font-mono text-gray-700 font-bold h-12"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Segurança & Suporte</CardTitle>
              <CardDescription>Proteção da conta e contato.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 p-4 rounded-lg font-medium leading-relaxed">
              Para alterar seus dados cadastrais, solicitar remoção de imóveis ou alterar sua senha,
              por favor entre em contato com nosso atendimento especializado.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
