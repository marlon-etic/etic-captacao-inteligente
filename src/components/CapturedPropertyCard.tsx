import { useState } from 'react'
import {
  MapPin,
  Calendar,
  CheckCircle2,
  BarChart2,
  User,
  UserCircle,
  MessageCircle,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Demand, CapturedProperty } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'
import { InternalChatModal } from '@/components/InternalChatModal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'

const statusLabels = {
  'Captado sob demanda': {
    label: '🟡 Captado',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  'Captado independente': {
    label: '🟡 Captado',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  Visita: { label: '🟠 Visita Agendada', color: 'bg-orange-100 text-orange-800 border-orange-300' },
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
  demand?: Demand
  property: CapturedProperty
  onAction?: (
    t: 'visita' | 'proposta' | 'negocio' | 'history',
    d: Demand,
    p: CapturedProperty,
  ) => void
}) {
  const { users, currentUser, logContactAttempt, getMatchesForProperty, claimLooseProperty } =
    useAppStore()
  const { toast } = useToast()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showClientProperties, setShowClientProperties] = useState(false)

  const isLoose = !demand || property.tipo_vinculacao === 'solto'
  const isLost = demand?.status === 'Perdida'

  const isClosed = !!property.fechamentoDate
  const isProposta = !!property.propostaDate && !isClosed
  const isVisita = !!property.visitaDate && !isProposta && !isClosed

  let st = statusLabels['Captado sob demanda']
  if (isLoose) st = { label: '🔓 Solto', color: 'bg-gray-100 text-gray-800 border-gray-300' }
  else if (isClosed) st = statusLabels['Negócio']
  else if (isProposta) st = statusLabels['Proposta']
  else if (isVisita) st = statusLabels['Visita']
  else if (isLost) st = statusLabels['Perdida']

  const capturer = users.find((u) => u.id === property.captador_id)
  const capturerName = capturer?.name || property.captador_name || 'N/A'

  const isSdrOrBroker = currentUser?.role === 'sdr' || currentUser?.role === 'corretor'
  const isCaptador = currentUser?.role === 'captador'
  const isAdminOrGestor = currentUser?.role === 'admin' || currentUser?.role === 'gestor'

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

  const totalImoveis = demand?.capturedProperties?.length || 1
  const numeroImovel = property.numero_imovel_para_demanda || 1

  const matches = isLoose ? getMatchesForProperty(property) : []
  const topMatch = matches[0]
  const otherMatches = matches.slice(1)

  const chatTargetName =
    isCaptador && demand
      ? users.find((u) => u.id === demand.createdBy)?.name || 'SDR/Corretor'
      : capturerName

  return (
    <>
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
          </div>
          <div className="absolute bottom-2 left-3.5 flex flex-col gap-1">
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
            <h4 className="font-semibold text-lg line-clamp-1 flex-1" title={property.neighborhood}>
              {property.neighborhood}
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

          {demand && (
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground bg-indigo-50/50 p-3 rounded-md border border-indigo-100 mt-2">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <User className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">👤 Cliente: {demand.clientName}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">
                  📍 Demanda: {demand.location},{' '}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0,
                  }).format(demand.budget || demand.maxBudget || 0)}
                  , {demand.bedrooms} dorms
                </span>
              </p>
              <p className="flex items-center gap-1.5 font-medium text-indigo-700">
                <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  📊 Imóvel {numeroImovel} de {totalImoveis} para este cliente
                </span>
              </p>
            </div>
          )}

          {demand && (
            <Button
              variant="link"
              size="sm"
              className="text-xs h-auto p-0 mt-1 justify-start text-primary font-semibold"
              onClick={() => setShowClientProperties(true)}
            >
              Ver todos os imóveis para este cliente
            </Button>
          )}

          {isLoose && matches.length > 0 && (
            <div className="mt-3 bg-blue-50/80 border border-blue-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-blue-900 leading-tight">
                    ✨ Sugestão de Match: {topMatch.demand.clientName}
                  </p>
                  <p className="text-[10px] text-blue-700 mt-0.5 font-medium">
                    {topMatch.score}% de compatibilidade
                  </p>
                  <Button
                    size="sm"
                    className="w-full mt-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                    onClick={() => {
                      const res = claimLooseProperty(property.code, topMatch.demand.id)
                      if (res.success) {
                        toast({
                          title: 'Imóvel vinculado com sucesso!',
                          className: 'bg-emerald-600 text-white border-emerald-600',
                        })
                      } else {
                        toast({ title: 'Erro', description: res.message, variant: 'destructive' })
                      }
                    }}
                  >
                    Vincular a esta Demanda
                  </Button>
                  {otherMatches.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="link"
                          className="text-[10px] h-auto p-0 mt-2 text-blue-600"
                        >
                          Ver outras {otherMatches.length} sugestões
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 z-50">
                        <p className="text-xs font-semibold mb-3">Outras compatibilidades:</p>
                        <div className="space-y-3">
                          {otherMatches.map((m) => (
                            <div
                              key={m.demand.id}
                              className="flex flex-col gap-1.5 border-b border-border/50 pb-3 last:border-0 last:pb-0"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className="text-xs font-medium block">
                                    {m.demand.clientName}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {m.demand.location} • {m.demand.type}
                                  </span>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] shrink-0 bg-blue-100 text-blue-800"
                                >
                                  {m.score}%
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[10px] h-7 w-full mt-1"
                                onClick={() => {
                                  const res = claimLooseProperty(property.code, m.demand.id)
                                  if (res.success) toast({ title: 'Imóvel vinculado!' })
                                  else
                                    toast({
                                      title: 'Erro',
                                      description: res.message,
                                      variant: 'destructive',
                                    })
                                }}
                              >
                                Vincular
                              </Button>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            </div>
          )}

          {isLoose && matches.length === 0 && (
            <div className="mt-3 bg-muted/30 border border-dashed rounded-md p-3 text-center">
              <p className="text-xs text-muted-foreground font-medium">
                Nenhum match encontrado no momento
              </p>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md border border-muted">
            <p className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              Captação:{' '}
              {new Date(property.capturedAt || (demand?.createdAt as string)).toLocaleDateString(
                'pt-BR',
              )}
            </p>
            <p className="flex items-center gap-1.5">
              <UserCircle className="w-3.5 h-3.5 shrink-0" />👤 Captado por:{' '}
              <span className="font-medium text-foreground">{capturerName}</span>
            </p>
          </div>

          {isVisita && property.visitaDate && (
            <div className="mt-2 bg-orange-50 p-2.5 rounded-md border border-orange-200 text-xs text-orange-900 space-y-1">
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

        {(isSdrOrBroker ||
          isAdminOrGestor ||
          (isCaptador && property.captador_id === currentUser.id)) &&
          demand && (
            <div className="px-4 pb-2 flex flex-col gap-2">
              {isCaptador && contactHistory.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs font-semibold h-8 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  onClick={() => setIsChatOpen(true)}
                >
                  ✉️ Responder ao {chatTargetName}
                </Button>
              )}

              {!isCapturerActive && isSdrOrBroker ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  className="w-full text-xs font-semibold bg-muted/50 h-8"
                >
                  Captador não está disponível
                </Button>
              ) : isSdrOrBroker && isValidPhone ? (
                <Button
                  size="sm"
                  className="w-full text-xs font-bold bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm h-8"
                  onClick={() => {
                    if (logContactAttempt) logContactAttempt(demand.id, property.code, 'whatsapp')
                    const sysUrl = window.location.origin
                    const msg = `Olá ${capturer?.name || capturerName}, tenho dúvidas sobre o imóvel ${property.code}. Você pode me ajudar? Link: ${sysUrl}/app/demandas`
                    window.open(
                      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
                      '_blank',
                    )
                  }}
                >
                  💬 CONTATAR CAPTADOR
                </Button>
              ) : isSdrOrBroker ? (
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
              ) : null}

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

        <div className="p-4 pt-0 mt-auto flex flex-col gap-2 border-t pt-3 bg-card">
          {!isLost && !isLoose && onAction && demand && (
            <>
              <Button
                size="sm"
                variant={isVisita ? 'default' : 'outline'}
                className={cn(
                  'w-full justify-start text-xs font-semibold',
                  isVisita && 'bg-orange-600 hover:bg-orange-700 text-white',
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
          {onAction && demand && (
            <Button
              size="sm"
              variant="secondary"
              className="w-full justify-start text-xs font-semibold mt-1 bg-muted/80 hover:bg-muted"
              onClick={() => onAction('history', demand, property)}
            >
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" /> VER HISTÓRICO
            </Button>
          )}
        </div>

        <InternalChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onSend={(msg) => {
            if (demand && logContactAttempt)
              logContactAttempt(demand.id, property.code, 'interno', msg)
          }}
          capturerName={chatTargetName}
        />
      </Card>

      {demand && (
        <Dialog open={showClientProperties} onOpenChange={setShowClientProperties}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Imóveis do Cliente: {demand.clientName}</DialogTitle>
              <DialogDescription>
                Demanda: {demand.location} • {demand.type} • {demand.bedrooms} dormitórios
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {demand.capturedProperties?.map((p) => {
                const pIsClosed = !!p.fechamentoDate
                const pIsProposta = !!p.propostaDate && !pIsClosed
                const pIsVisita = !!p.visitaDate && !pIsProposta && !pIsClosed

                let statusLabel = '🟡 Captado'
                let statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-300'
                if (pIsClosed) {
                  statusLabel = '🟢 Negócio Fechado'
                  statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-300'
                } else if (pIsProposta) {
                  statusLabel = '🟣 Proposta'
                  statusClass = 'bg-purple-100 text-purple-800 border-purple-300'
                } else if (pIsVisita) {
                  statusLabel = '🟠 Visita Agendada'
                  statusClass = 'bg-orange-100 text-orange-800 border-orange-300'
                }

                return (
                  <div
                    key={p.code}
                    className="flex gap-3 border rounded-lg p-3 relative overflow-hidden"
                  >
                    <div
                      className={cn(
                        'absolute left-0 top-0 bottom-0 w-1',
                        statusClass.split(' ')[0],
                      )}
                    />
                    <img
                      src={
                        p.photoUrl || `https://img.usecurling.com/p/400/300?q=house&seed=${p.code}`
                      }
                      alt={p.code}
                      className="w-16 h-16 object-cover rounded bg-muted"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-semibold text-sm">Cód: {p.code}</p>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] px-1.5 py-0 whitespace-nowrap', statusClass)}
                        >
                          {statusLabel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.neighborhood}</p>
                      <p className="text-xs font-medium text-primary mt-1">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(p.value)}
                      </p>
                    </div>
                    <div className="flex flex-col justify-center gap-1 shrink-0">
                      {onAction && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px]"
                          onClick={() => {
                            setShowClientProperties(false)
                            onAction('history', demand, p)
                          }}
                        >
                          Histórico
                        </Button>
                      )}
                      {!pIsClosed && onAction && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-[10px]"
                          onClick={() => {
                            setShowClientProperties(false)
                            onAction(pIsVisita ? 'proposta' : 'visita', demand, p)
                          }}
                        >
                          {pIsVisita ? 'Proposta' : 'Agendar Visita'}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
