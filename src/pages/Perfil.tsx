import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  Settings,
  Shield,
  User as UserIcon,
  BellRing,
  Smartphone,
  Mail,
  Moon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import useAppStore, { defaultPreferences } from '@/stores/useAppStore'
import { UserPreferences, NotificationType } from '@/types'

export default function Perfil() {
  const { currentUser, logout, updateUserPreferences } = useAppStore()
  const navigate = useNavigate()

  if (!currentUser) return null

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const prefs = currentUser.preferences || defaultPreferences
  const [localPrefs, setLocalPrefs] = useState<UserPreferences['notifications']>(
    prefs.notifications,
  )

  const handleSavePrefs = () => {
    updateUserPreferences(localPrefs)
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12">
      <Card className="border-0 shadow-md">
        <CardContent className="p-6 text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/10">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
            />
            <AvatarFallback className="text-2xl">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold">{currentUser.name}</h2>
          <p className="text-muted-foreground capitalize mb-4">{currentUser.role}</p>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full font-semibold">
            <span>Pontuação Total:</span>
            <span>{currentUser.points} pts</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-start py-6" asChild>
          <div>
            <UserIcon className="w-5 h-5 mr-3 text-muted-foreground" /> Dados Pessoais
          </div>
        </Button>
        <Button variant="outline" className="w-full justify-start py-6" asChild>
          <div>
            <Shield className="w-5 h-5 mr-3 text-muted-foreground" /> Segurança
          </div>
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-start py-6 relative">
              <BellRing className="w-5 h-5 mr-3 text-muted-foreground" /> Preferências de
              Notificação
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Notificações</SheetTitle>
              <SheetDescription>Configure como e quando deseja ser avisado.</SheetDescription>
            </SheetHeader>

            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Canais de Entrega
                </h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2">
                      <BellRing className="w-4 h-4" /> In-App (Web)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Notificações no painel do sistema
                    </p>
                  </div>
                  <Switch
                    checked={localPrefs.channels.in_app}
                    onCheckedChange={(c) =>
                      setLocalPrefs((p) => ({ ...p, channels: { ...p.channels, in_app: c } }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /> Push (Celular)
                    </Label>
                    <p className="text-xs text-muted-foreground">Avisos na tela do celular</p>
                  </div>
                  <Switch
                    checked={localPrefs.channels.push}
                    onCheckedChange={(c) =>
                      setLocalPrefs((p) => ({ ...p, channels: { ...p.channels, push: c } }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2">
                      <Mail className="w-4 h-4" /> E-mail
                    </Label>
                    <p className="text-xs text-muted-foreground">Resumos e alertas urgentes</p>
                  </div>
                  <Switch
                    checked={localPrefs.channels.email}
                    onCheckedChange={(c) =>
                      setLocalPrefs((p) => ({ ...p, channels: { ...p.channels, email: c } }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Modo Silencioso
                </h3>

                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base flex items-center gap-2">
                          <Moon className="w-4 h-4" /> Não Perturbe
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Silencia Push e E-mail no período
                        </p>
                      </div>
                      <Switch
                        checked={localPrefs.quietHours.enabled}
                        onCheckedChange={(c) =>
                          setLocalPrefs((p) => ({
                            ...p,
                            quietHours: { ...p.quietHours, enabled: c },
                          }))
                        }
                      />
                    </div>

                    {localPrefs.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Início</Label>
                          <Input
                            type="time"
                            value={localPrefs.quietHours.start}
                            onChange={(e) =>
                              setLocalPrefs((p) => ({
                                ...p,
                                quietHours: { ...p.quietHours, start: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Fim</Label>
                          <Input
                            type="time"
                            value={localPrefs.quietHours.end}
                            onChange={(e) =>
                              setLocalPrefs((p) => ({
                                ...p,
                                quietHours: { ...p.quietHours, end: e.target.value },
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Tipos de Alerta
                </h3>

                {Object.entries({
                  novo_imovel: 'Novos imóveis disponíveis',
                  reivindicado: 'Meus imóveis reivindicados',
                  ja_reivindicado: 'Imóveis já reivindicados por outros',
                  demanda_respondida: 'Atualizações e Mensagens',
                  visita: 'Visitas agendadas',
                  negocio: 'Negócios fechados',
                  perdido: 'Demandas perdidas ou prazos',
                }).map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <Label className="text-sm cursor-pointer">{label}</Label>
                    <Switch
                      checked={localPrefs.types[key as NotificationType]}
                      onCheckedChange={(c) =>
                        setLocalPrefs((p) => ({ ...p, types: { ...p.types, [key]: c } }))
                      }
                    />
                  </div>
                ))}
              </div>

              <Button onClick={handleSavePrefs} className="w-full h-12 font-bold text-base">
                Salvar Preferências
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Button variant="outline" className="w-full justify-start py-6" asChild>
          <div>
            <Settings className="w-5 h-5 mr-3 text-muted-foreground" /> Configurações Gerais
          </div>
        </Button>
      </div>

      <Button variant="destructive" className="w-full py-6 mt-8" onClick={handleLogout}>
        <LogOut className="w-5 h-5 mr-2" /> Sair da Conta
      </Button>
    </div>
  )
}
