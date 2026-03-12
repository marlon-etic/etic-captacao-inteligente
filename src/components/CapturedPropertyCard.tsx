import { useState } from 'react'
import {
  MapPin,
  Calendar,
  CheckCircle2,
  Bed,
  Car,
  Bath,
  UserCircle,
  Clock,
  MessageCircle,
} from 'lucide-react'
import { Demand, CapturedProperty } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'
import { InternalChatModal } from '@/components/InternalChatModal'

const statusLabels = {
  'Captado sob demanda': {
    label: '🟡 Captado',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  'Captado independente': {
    label: '🟡 Captado',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  Visita: { label: '🔵 Visita Agendada', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  Proposta: { label: '🟣 Proposta', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  Negócio: {
    label: '🟢 Negócio Fechado',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  Perdida: { label: '❌ Perdida', color: 'bg-red-100 text-red-800 border-red-300' },
}

export function CapturedPropertyCard({
  demand,
  property,
  onAction,
}: {
  demand: Demand
  property: CapturedProperty
  onAction: (
    t: 'visita' | 'proposta' | 'negocio' | 'history',
    d: Demand,
    p: CapturedProperty,
  ) => void
}) {
  const { users, currentUser, logContactAttempt } = useAppStore()
  const [isChatOpen, setIsChatOpen] = useState(false)

  const isClosed = !!property.fechamentoDate
  const isProposta = !!property.propostaDate && !isClosed
  const isVisita = !!property.visitaDate && !isProposta && !isClosed
  const isLost = demand.status === 'Perdida'

  let st = statusLabels['Captado sob demanda']
  if (isClosed) st = statusLabels['Negócio']
  else if (isProposta) st = statusLabels['Proposta']
  else if (isVisita) st = statusLabels['Visita']
  else if (isLost) st = statusLabels['Perdida']

  const capturer = users.find((u) => u.id === property.captador_id)
  const capturerName = capturer?.name || property.captador_name || 'N/A'

  const isSdrOrBroker = currentUser?.role === 'sdr' || currentUser?.role === 'corretor'
  const isCapturerActive = capturer?.status === 'ativo'

  let phoneStr = capturer?.phone || ''
  let cleanPhone = phoneStr.replace(/\D/g, '')
  let isValidPhone = cleanPhone.length >= 10
  if (isValidPhone && cleanPhone.length <= 11) {
    cleanPhone = '55' + cleanPhone
  }

  const contactHistory =
    property.history
      ?.filter((h) => h.type === 'contato_captador')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || []

  return (
    <Card
      className={cn(
        'overflow-hidden flex flex-col h-full border-2 transition-all hover:shadow-md relative',
        isClosed ? 'bg-emerald-50/40 border-emerald-400' : 'border-muted',
        isLost && 'opacity-80 grayscale-[30%]',
      )}
    >
      <div className="relative h-48 w-full bg-muted">
        <img
          src={
            property.photoUrl ||
            `https://img.usecurling.com/p/400/300?q=house&seed=${property.code}`
          }
          alt="Imóvel"
          className={cn('w-full h-full object-cover', isClosed && 'opacity-90')}
        />
        {isClosed && (
          <div className="absolute inset-0 bg-emerald-900/10 flex items-center justify-center pointer-events-none">
            <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1.5 transform -rotate-3 scale-110">
              <CheckCircle2 className="w-4 h-4" />
              CONCLUÍDO
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          <Badge variant="outline" className={cn('font-medium shadow-sm bg-white/90', st.color)}>
            {st.label}
          </Badge>
          <Badge
            variant="outline"
            className="font-medium shadow-sm bg-indigo-50 text-indigo-800 border-indigo-200"
          >
            🔗 Vinculado a {demand.clientName.split(' ')[0]}
          </Badge>
        </div>
        <div className="absolute bottom-2 left-3.5 flex flex-col gap-1">
          {property.numero_imovel_para_demanda && (
            <Badge className="bg-primary text-primary-foreground border-none shadow-sm self-start text-[10px] px-2 py-0.5">
              {property.numero_imovel_para_demanda}º Imóvel Vinculado
            </Badge>
          )}
          <Badge
            variant="secondary"
            className="bg-black/70 text-white border-none hover:bg-black/80 shadow-sm self-start"
          >
            Cód: {property.code}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 flex-grow flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-semibold text-lg line-clamp-1 flex-1" title={demand.location}>
            {demand.location}
          </h4>
          <span
            className={cn(
              'font-bold whitespace-nowrap',
              isClosed ? 'text-emerald-700' : 'text-primary',
            )}
          >
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(property.value)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {property.bairro_tipo === 'outro' && <span className="mr-1">🔹</span>}
            {property.neighborhood}
          </span>
        </p>

        <div className="flex items-center gap-3 text-xs font-medium text-foreground/80 mt-1">
          <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
            <Bed className="w-3.5 h-3.5 text-primary" /> {demand.bedrooms}
          </span>
          <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
            <Bath className="w-3.5 h-3.5 text-primary" /> {demand.bathrooms || 1}
          </span>
          <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
            <Car className="w-3.5 h-3.5 text-primary" /> {demand.parkingSpots}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground bg-indigo-50/50 p-2 rounded-md border border-indigo-100">
          <p className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            Captação:{' '}
            {new Date(property.capturedAt || demand.createdAt).toLocaleDateString('pt-BR')}
          </p>
          <p className="flex items-center gap-1.5">
            <UserCircle className="w-3.5 h-3.5 shrink-0" />👤 Captado por:{' '}
            <span className="font-medium text-foreground">{capturerName}</span>
          </p>
        </div>

        {isVisita && property.visitaDate && (
          <div className="mt-2 bg-blue-50 p-2.5 rounded-md border border-blue-100 text-xs text-blue-800 space-y-1">
            <p className="font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Visita:{' '}
              {new Date(property.visitaDate + 'T00:00:00').toLocaleDateString('pt-BR')} às{' '}
              {property.visitaTime}
            </p>
          </div>
        )}

        {isProposta && property.propostaDate && (
          <div className="mt-2 bg-purple-50 p-2.5 rounded-md border border-purple-100 text-xs text-purple-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 mb-1">🟣 Proposta Registrada</p>
            <p className="font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Em:{' '}
              {new Date(property.propostaDate + 'T00:00:00').toLocaleDateString('pt-BR')}
            </p>
            <p className="font-medium">
              Valor:{' '}
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                property.propostaValue || 0,
              )}
            </p>
            {property.propostaStatus && (
              <Badge variant="outline" className="bg-white/50 text-[10px] mt-1">
                Status: {property.propostaStatus}
              </Badge>
            )}
          </div>
        )}

        {isClosed && property.fechamentoDate && (
          <div className="mt-2 bg-emerald-100/50 p-2.5 rounded-md border border-emerald-200 text-xs text-emerald-900 space-y-1.5 flex-1">
            <p className="font-bold text-sm text-emerald-700 flex items-center gap-1.5 mb-1">
              💰 Negócio Fechado
            </p>
            <p className="font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Em:{' '}
              {new Date(property.fechamentoDate + 'T00:00:00').toLocaleDateString('pt-BR')}
            </p>
            <p className="font-medium">
              <span className="text-emerald-700">Valor Final:</span>{' '}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 2,
              }).format(property.fechamentoValue || 0)}
            </p>
          </div>
        )}
      </CardContent>

      {isSdrOrBroker && (
        <div className="px-4 pb-2 flex flex-col gap-2">
          {!isCapturerActive ? (
            <Button
              size="sm"
              variant="outline"
              disabled
              className="w-full text-xs font-semibold bg-muted/50 h-8"
            >
              Captador não está disponível
            </Button>
          ) : isValidPhone ? (
            <Button
              size="sm"
              className="w-full text-xs font-bold bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm h-8"
              onClick={() => {
                if (logContactAttempt) logContactAttempt(demand.id, property.code, 'whatsapp')
                const sysUrl = window.location.origin
                const msg = `Olá ${capturer?.name || capturerName}, tenho dúvidas sobre o imóvel ${property.code}. Você pode me ajudar? Link: ${sysUrl}/app/demandas`
                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank')
              }}
            >
              💬 CONTATAR CAPTADOR
            </Button>
          ) : (
            <div className="flex flex-col gap-1 w-full">
              <span className="text-[10px] text-center text-muted-foreground leading-none">
                Número de WhatsApp não disponível
              </span>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs font-semibold h-8"
                onClick={() => setIsChatOpen(true)}
              >
                ✉️ Enviar mensagem interna
              </Button>
            </div>
          )}

          {contactHistory.length > 0 && (
            <div className="mt-2 bg-muted/30 p-2 rounded-md border text-xs">
              <p className="font-semibold mb-1 text-muted-foreground text-[10px] uppercase tracking-wider flex items-center gap-1">
                <MessageCircle className="w-3 h-3" /> Últimas comunicações
              </p>
              <ul className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {contactHistory.slice(0, 3).map((h) => {
                  const dt = new Date(h.timestamp)
                  const formattedDate = `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()} ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`
                  return (
                    <li
                      key={h.id}
                      className="text-[10px] text-muted-foreground leading-tight bg-background p-1.5 rounded border border-border/50"
                    >
                      <span className="font-medium">[{formattedDate}]</span> - {h.description}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="p-4 pt-0 mt-auto flex flex-col gap-2 border-t pt-3">
        {!isLost && (
          <>
            <Button
              size="sm"
              variant={isVisita ? 'default' : 'outline'}
              className={cn(
                'w-full justify-start text-xs font-semibold',
                isVisita && 'bg-blue-600 hover:bg-blue-700 text-white',
              )}
              onClick={() => onAction('visita', demand, property)}
            >
              👁️ VISITA AGENDADA
            </Button>
            <Button
              size="sm"
              variant={isProposta ? 'default' : 'outline'}
              className={cn(
                'w-full justify-start text-xs font-semibold',
                isProposta && 'bg-purple-600 hover:bg-purple-700 text-white',
              )}
              onClick={() => onAction('proposta', demand, property)}
            >
              📄 PROPOSTA
            </Button>
            <Button
              size="sm"
              variant={isClosed ? 'default' : 'outline'}
              className={cn(
                'w-full justify-start text-xs font-semibold',
                isClosed && 'bg-emerald-600 hover:bg-emerald-700 text-white',
              )}
              onClick={() => onAction('negocio', demand, property)}
            >
              {isClosed ? '🎉 NEGÓCIO FECHADO' : '💰 NEGÓCIO FECHADO'}
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="secondary"
          className="w-full justify-start text-xs font-semibold mt-1 bg-muted/80 hover:bg-muted"
          onClick={() => onAction('history', demand, property)}
        >
          <Clock className="w-4 h-4 mr-2 text-muted-foreground" /> VER HISTÓRICO
        </Button>
      </div>

      <InternalChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSend={(msg) => {
          if (logContactAttempt) logContactAttempt(demand.id, property.code, 'interno', msg)
        }}
        capturerName={capturer?.name || capturerName}
      />
    </Card>
  )
}
