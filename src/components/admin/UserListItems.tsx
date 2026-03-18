import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TableCell, TableRow } from '@/components/ui/table'
import { Edit, Key, PowerOff, Power, MoreVertical } from 'lucide-react'
import { UserBadge } from './UserBadge'
import { User } from '@/types'
import { cn } from '@/lib/utils'

interface UserItemProps {
  user: User
  onEdit: (u: User) => void
  onToggleStatus: (u: User, forceAction?: 'deactivate' | 'reactivate') => void
  onResetPassword: (u: User) => void
  isCurrentUser: boolean
}

export function UserDesktopRow({
  user,
  onEdit,
  onToggleStatus,
  onResetPassword,
  isCurrentUser,
}: UserItemProps) {
  const isInactive = user.status === 'inativo' || user.status === 'bloqueado'

  return (
    <TableRow className={cn(isInactive && 'opacity-60 bg-muted/30')}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border shadow-sm">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-[#1A3A52]">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <UserBadge role={user.role} />
      </TableCell>
      <TableCell className="text-sm font-medium text-[#666666]">{user.whatsapp || '-'}</TableCell>
      <TableCell className="text-sm font-medium text-[#666666]">
        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={!isInactive}
            onCheckedChange={() => onToggleStatus(user, isInactive ? 'reactivate' : 'deactivate')}
            disabled={isCurrentUser}
          />
          <span
            className={cn(
              'text-xs font-bold',
              isInactive ? 'text-destructive' : 'text-emerald-600',
            )}
          >
            {isInactive ? 'Inativo' : 'Ativo'}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(user)}
            className="h-8 px-2 border-[#E5E5E5] hover:bg-[#F5F5F5]"
            title="Editar"
          >
            <Edit className="w-4 h-4 text-[#2E5F8A]" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResetPassword(user)}
            className="h-8 px-2 border-[#E5E5E5] hover:bg-[#F5F5F5]"
            title="Resetar Senha"
          >
            <Key className="w-4 h-4 text-orange-500" />
          </Button>
          {!isCurrentUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(user, isInactive ? 'reactivate' : 'deactivate')}
              className="h-8 px-2 border-[#E5E5E5] hover:bg-[#F5F5F5]"
              title={isInactive ? 'Reativar' : 'Desativar'}
            >
              {isInactive ? (
                <Power className="w-4 h-4 text-emerald-600" />
              ) : (
                <PowerOff className="w-4 h-4 text-destructive" />
              )}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

export function UserMobileCard({
  user,
  onEdit,
  onToggleStatus,
  onResetPassword,
  isCurrentUser,
}: UserItemProps) {
  const isInactive = user.status === 'inativo' || user.status === 'bloqueado'

  return (
    <div
      className={cn(
        'p-4 bg-white border border-[#E5E5E5] rounded-xl shadow-sm space-y-3',
        isInactive && 'opacity-60 bg-muted/10',
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border shadow-sm">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-[#1A3A52] text-[16px] leading-tight">{user.name}</h3>
            <UserBadge role={user.role} className="mt-1" />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
              <MoreVertical className="w-5 h-5 text-[#999999]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Edit className="w-4 h-4 mr-2 text-[#2E5F8A]" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResetPassword(user)}>
              <Key className="w-4 h-4 mr-2 text-orange-500" /> Resetar Senha
            </DropdownMenuItem>
            {!isCurrentUser && (
              <DropdownMenuItem
                onClick={() => onToggleStatus(user, isInactive ? 'reactivate' : 'deactivate')}
                className={isInactive ? 'text-emerald-600' : 'text-destructive'}
              >
                {isInactive ? (
                  <Power className="w-4 h-4 mr-2" />
                ) : (
                  <PowerOff className="w-4 h-4 mr-2" />
                )}
                {isInactive ? 'Reativar' : 'Desativar'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-[13px] text-[#666666] space-y-1">
        <p>
          <span className="font-semibold text-[#333333]">Email:</span> {user.email}
        </p>
        <p>
          <span className="font-semibold text-[#333333]">WhatsApp:</span> {user.whatsapp || '-'}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5]">
        <span className="text-[12px] font-bold text-[#999999]">Status</span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-bold',
              isInactive ? 'text-destructive' : 'text-emerald-600',
            )}
          >
            {isInactive ? 'Inativo' : 'Ativo'}
          </span>
          <Switch
            checked={!isInactive}
            onCheckedChange={() => onToggleStatus(user, isInactive ? 'reactivate' : 'deactivate')}
            disabled={isCurrentUser}
          />
        </div>
      </div>
    </div>
  )
}
