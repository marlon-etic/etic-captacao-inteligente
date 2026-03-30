import { Edit, Trash2, MoreVertical } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { TableRow, TableCell } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Props {
  property: any
  userName?: string
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

const getStatusColor = (status: string) => {
  const s = (status || '').toLowerCase()
  if (s === 'capturado') return 'bg-blue-100 text-blue-700'
  if (s === 'visitado') return 'bg-yellow-100 text-yellow-700'
  if (s === 'fechado') return 'bg-emerald-100 text-emerald-700'
  if (s === 'perdido') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-700'
}

export function PropertyDesktopRow({
  property,
  userName,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  const status = property.status_captacao || property.etapa_funil || 'pendente'

  return (
    <TableRow className={cn('hover:bg-[#F8FAFC] transition-colors', isSelected && 'bg-blue-50/50')}>
      <TableCell className="text-center">
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-bold text-[#1A3A52]">{property.codigo_imovel || '-'}</span>
          <span className="text-[11px] text-[#999999] font-mono" title={property.id}>
            {property.id.substring(0, 8)}...
          </span>
        </div>
      </TableCell>
      <TableCell className="capitalize font-medium text-[#666666]">
        {property.tipo || '-'}
      </TableCell>
      <TableCell className="font-bold text-emerald-600">
        {property.preco
          ? `R$ ${Number(property.preco).toLocaleString('pt-BR')}`
          : property.valor
            ? `R$ ${Number(property.valor).toLocaleString('pt-BR')}`
            : '-'}
      </TableCell>
      <TableCell
        className="text-[#333333] max-w-[150px] truncate"
        title={property.localizacao_texto || property.endereco || '-'}
      >
        {property.localizacao_texto || property.endereco || '-'}
      </TableCell>
      <TableCell className="text-center font-medium text-[#666666]">
        {property.dormitorios || '-'}
      </TableCell>
      <TableCell className="text-center font-medium text-[#666666]">
        {property.vagas || '-'}
      </TableCell>
      <TableCell className="text-[#333333] max-w-[120px] truncate" title={userName || '-'}>
        {userName || '-'}
      </TableCell>
      <TableCell className="text-[#666666] text-sm">
        {new Date(property.created_at).toLocaleDateString('pt-BR')}
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'px-2.5 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider',
            getStatusColor(status),
          )}
        >
          {status}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#666666] hover:text-[#1A3A52]"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem
              onClick={onEdit}
              className="cursor-pointer font-medium text-[#1A3A52]"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="cursor-pointer font-medium text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

export function PropertyMobileCard({
  property,
  userName,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  const status = property.status_captacao || property.etapa_funil || 'pendente'

  return (
    <div
      className={cn(
        'bg-white p-4 rounded-xl shadow-sm border border-[#E5E5E5] space-y-3 relative',
        isSelected && 'border-blue-400 bg-blue-50/20',
      )}
    >
      <div className="absolute top-4 left-4">
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </div>

      <div className="pl-8 flex justify-between items-start">
        <div>
          <h3 className="font-bold text-[#1A3A52] text-lg">{property.codigo_imovel || '-'}</h3>
          <p className="text-sm text-[#666666] capitalize">{property.tipo || '-'}</p>
        </div>
        <span
          className={cn(
            'px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
            getStatusColor(status),
          )}
        >
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-100 pl-8">
        <div>
          <span className="text-[#999999] block text-xs">Preço</span>
          <span className="font-bold text-emerald-600">
            {property.preco
              ? `R$ ${Number(property.preco).toLocaleString('pt-BR')}`
              : property.valor
                ? `R$ ${Number(property.valor).toLocaleString('pt-BR')}`
                : '-'}
          </span>
        </div>
        <div>
          <span className="text-[#999999] block text-xs">Bairro</span>
          <span className="font-medium text-[#333333] truncate block">
            {property.localizacao_texto || property.endereco || '-'}
          </span>
        </div>
        <div>
          <span className="text-[#999999] block text-xs">Dorm. / Vagas</span>
          <span className="font-medium text-[#333333]">
            {property.dormitorios || '-'} / {property.vagas || '-'}
          </span>
        </div>
        <div>
          <span className="text-[#999999] block text-xs">Captador</span>
          <span className="font-medium text-[#333333] truncate block">{userName || '-'}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-100 pl-8">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex-1 font-bold text-[#1A3A52]"
        >
          <Edit className="w-4 h-4 mr-2" /> Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="flex-1 font-bold text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Deletar
        </Button>
      </div>
    </div>
  )
}
