import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export function ImoveisCadastradosGrid({ imoveis, loading, onSelect }: any) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    )
  }

  if (imoveis.length === 0) {
    return (
      <div className="p-8 mb-8 text-center text-gray-500 font-bold bg-white rounded-xl border border-gray-100 shadow-sm">
        Sem imóveis cadastrados neste período.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {imoveis.map((imv: any) => (
        <Card
          key={imv.id}
          className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all overflow-hidden rounded-xl border-gray-200"
          onClick={() => onSelect(imv)}
        >
          <div className="h-36 bg-gray-100 relative">
            {imv.fotos?.[0] ? (
              <img src={imv.fotos[0]} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-slate-100">
                Sem Foto
              </div>
            )}
            <Badge className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-800 font-black shadow-sm">
              {imv.status_captacao || 'pendente'}
            </Badge>
          </div>
          <CardContent className="p-4">
            <h3 className="font-black text-[#1A3A52] truncate" title={imv.endereco}>
              {imv.endereco || 'Endereço não informado'}
            </h3>
            <p className="text-sm font-bold text-gray-500 mt-1">
              {imv.tipo_imovel || 'Imóvel'} • {imv.dormitorios || 0} Dorm • {imv.vagas || 0} Vagas
            </p>
            <div className="mt-3 font-black text-emerald-600 text-lg">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                imv.preco || imv.valor || 0,
              )}
            </div>
            {(imv.demanda_locacao_id || imv.demanda_venda_id) && (
              <Badge className="mt-3 bg-emerald-100 text-emerald-800 border-none text-xs w-full justify-center">
                ✅ Vinculado à Demanda
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
