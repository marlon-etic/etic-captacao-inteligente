import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, Shield, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useAppStore from '@/stores/useAppStore'

export default function Perfil() {
  const { currentUser, logout } = useAppStore()
  const navigate = useNavigate()

  if (!currentUser) return null

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
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
            <User className="w-5 h-5 mr-3 text-muted-foreground" /> Dados Pessoais
          </div>
        </Button>
        <Button variant="outline" className="w-full justify-start py-6" asChild>
          <div>
            <Shield className="w-5 h-5 mr-3 text-muted-foreground" /> Segurança
          </div>
        </Button>
        <Button variant="outline" className="w-full justify-start py-6" asChild>
          <div>
            <Settings className="w-5 h-5 mr-3 text-muted-foreground" /> Configurações
          </div>
        </Button>
      </div>

      <Button variant="destructive" className="w-full py-6 mt-8" onClick={handleLogout}>
        <LogOut className="w-5 h-5 mr-2" /> Sair da Conta
      </Button>
    </div>
  )
}
