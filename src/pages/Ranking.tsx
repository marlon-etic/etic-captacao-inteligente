import { Trophy, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import useAppStore from '@/stores/useAppStore'
import { User } from '@/types'

export default function Ranking() {
  const { users } = useAppStore()

  const renderList = (
    sortedList: User[],
    pointKey: 'points' | 'weeklyPoints' | 'monthlyPoints',
  ) => (
    <div className="space-y-3 mt-4">
      {sortedList.map((user, index) => {
        const isTop3 = index < 3
        const pts = user[pointKey]
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
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{user.name}</p>
                    {isTop3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary font-bold uppercase">
                        Top
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.badges &&
                      user.badges.slice(0, 3).map((badge) => (
                        <Badge
                          key={badge}
                          variant="secondary"
                          className="text-[10px] px-1 py-0 h-4 font-normal"
                        >
                          {badge}
                        </Badge>
                      ))}
                    {(user.badges?.length || 0) > 3 && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 font-normal">
                        +{user.badges.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-primary font-bold text-lg">
                    <Star className="w-4 h-4 fill-primary" />
                    {pts}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">pts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  const weeklyUsers = [...users].sort((a, b) => b.weeklyPoints - a.weeklyPoints)
  const monthlyUsers = [...users].sort((a, b) => b.monthlyPoints - a.monthlyPoints)
  const allTimeUsers = [...users].sort((a, b) => b.points - a.points)

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Ranking de Captadores</h1>
        <p className="text-muted-foreground mt-1">Acumule pontos e conquiste o topo do pódio.</p>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="alltime">Geral</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly">{renderList(weeklyUsers, 'weeklyPoints')}</TabsContent>
        <TabsContent value="monthly">{renderList(monthlyUsers, 'monthlyPoints')}</TabsContent>
        <TabsContent value="alltime">{renderList(allTimeUsers, 'points')}</TabsContent>
      </Tabs>
    </div>
  )
}
