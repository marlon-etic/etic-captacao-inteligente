import { Trophy, Medal, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useAppStore from '@/stores/useAppStore'

export default function Ranking() {
  const { users } = useAppStore()

  // Sort users by points descending
  const sortedUsers = [...users].sort((a, b) => b.points - a.points)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Ranking de Captadores</h1>
        <p className="text-muted-foreground mt-1">Os melhores do mês baseados em performance.</p>
      </div>

      <div className="space-y-3">
        {sortedUsers.map((user, index) => {
          const isTop3 = index < 3
          return (
            <Card
              key={user.id}
              className={`overflow-hidden border-0 ${isTop3 ? 'shadow-md ring-1 ring-primary/20' : 'shadow-sm border'}`}
            >
              <CardContent className="p-0 flex items-center">
                <div
                  className={`w-12 flex justify-center font-bold ${index === 0 ? 'text-yellow-500 text-xl' : index === 1 ? 'text-gray-400 text-lg' : index === 2 ? 'text-amber-700 text-lg' : 'text-muted-foreground'}`}
                >
                  #{index + 1}
                </div>
                <div className="flex-1 flex items-center gap-4 py-3 px-4 bg-background">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    />
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <Star className="w-4 h-4 fill-primary" />
                      {user.points}
                    </div>
                    {isTop3 && (
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">
                        Top Performer
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
