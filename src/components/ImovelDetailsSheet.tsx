import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import { format } from 'date-fns'
import { getPropertyPublicUrl } from '@/lib/propertyUrl'
import {
  Building,
  MapPin,
  Bed,
  Car,
  DollarSign,
  User,
  Calendar,
  ExternalLink,
  Share2,
  Info,
  Link as LinkIcon,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { UltimoImovel } from '@/hooks/use-ultimos-imoveis'

interface ImovelDetailsSheetProps {
  imovel: UltimoImovel | null
  onClose: () => void
  onVincular: (imovel: UltimoImovel) => void
}

export function ImovelDetailsSheet({ imovel, onClose, onVincular }: ImovelDetailsSheetProps) {
  const { toast } = useToast()

  if (!imovel) return null

  const publicUrl = imovel.codigo_imovel ? getPropertyPublicUrl(imovel.codigo_imovel) : ''

  const handleCopyLink = async () => {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      toast({ title: 'Sucesso', description: 'Link copiado para clipboard!' })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link',
        variant: 'destructive',
      })
    }
  }

  const fotos =
    imovel.fotos && imovel.fotos.length > 0
      ? imovel.fotos
      : ['https://img.usecurling.com/p/800/600?q=house&color=blue']

  return (
    <Sheet open={!!imovel} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-[500px] p-0 flex flex-col bg-[#F8FAFC] border-l border-[#E5E5E5] shadow-2xl">
        <SheetHeader className="p-6 border-b border-[#E5E5E5] bg-white z-10 relative">
          <div className="flex justify-between items-start pr-8">
            <SheetTitle className="text-[22px] font-black text-[#1A3A52] flex items-center gap-2">
              <Building className="w-6 h-6 text-[#3B82F6]" /> {imovel.codigo_imovel}
            </SheetTitle>
            <Badge className="bg-[#E8F0F8] text-[#1A3A52] hover:bg-[#E8F0F8] uppercase tracking-wider text-[10px] font-bold border-none shadow-none">
              {imovel.etapa_funil}
            </Badge>
          </div>
          <SheetDescription className="text-[13px] text-[#666666] font-medium mt-1">
            Visualizando detalhes completos do imóvel capturado
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Fotos */}
            <div className="rounded-[12px] overflow-hidden border border-[#E5E5E5] shadow-sm bg-white">
              <Carousel className="w-full">
                <CarouselContent>
                  {fotos.map((f, i) => (
                    <CarouselItem key={i}>
                      <div className="aspect-[4/3] w-full relative bg-[#F5F5F5]">
                        <img
                          src={f}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {fotos.length > 1 && (
                  <>
                    <CarouselPrevious className="left-3 bg-white/90 hover:bg-white border-none shadow-md" />
                    <CarouselNext className="right-3 bg-white/90 hover:bg-white border-none shadow-md" />
                  </>
                )}
              </Carousel>
            </div>

            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-black text-[16px] text-[#1A3A52] flex items-center gap-2 border-b border-[#E5E5E5] pb-2">
                <Info className="w-4 h-4 text-[#3B82F6]" /> Informações Básicas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-[8px] border border-[#E5E5E5] shadow-sm">
                  <span className="text-[#666666] text-[12px] font-bold uppercase tracking-wider block">
                    Captador
                  </span>
                  <div className="font-bold text-[#333333] flex items-center gap-1.5 mt-1 text-[14px]">
                    <User className="w-4 h-4 text-[#999999]" />{' '}
                    <span className="truncate">{imovel.captador_nome}</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-[8px] border border-[#E5E5E5] shadow-sm">
                  <span className="text-[#666666] text-[12px] font-bold uppercase tracking-wider block">
                    Data de Captura
                  </span>
                  <div className="font-bold text-[#333333] flex items-center gap-1.5 mt-1 text-[14px]">
                    <Calendar className="w-4 h-4 text-[#999999]" />{' '}
                    {format(new Date(imovel.created_at), 'dd/MM/yyyy')}
                  </div>
                </div>
              </div>
            </div>

            {/* Localização */}
            <div className="space-y-4">
              <h3 className="font-black text-[16px] text-[#1A3A52] flex items-center gap-2 border-b border-[#E5E5E5] pb-2">
                <MapPin className="w-4 h-4 text-[#EF4444]" /> Localização
              </h3>
              <div className="bg-white p-4 rounded-[8px] border border-[#E5E5E5] shadow-sm">
                <div className="text-[14px] font-medium text-[#333333] leading-relaxed">
                  {imovel.endereco || 'Endereço não informado'}
                </div>
                {imovel.bairros && imovel.bairros.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#F5F5F5]">
                    {imovel.bairros.map((b) => (
                      <Badge
                        key={b}
                        variant="secondary"
                        className="font-bold text-[11px] bg-[#F5F5F5] text-[#666666] border border-[#E5E5E5]"
                      >
                        {b}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Características */}
            <div className="space-y-4">
              <h3 className="font-black text-[16px] text-[#1A3A52] flex items-center gap-2 border-b border-[#E5E5E5] pb-2">
                <DollarSign className="w-4 h-4 text-[#10B981]" /> Características
              </h3>

              <div className="bg-white p-4 rounded-[8px] border border-[#E5E5E5] shadow-sm space-y-4">
                <div className="text-[28px] font-black text-[#10B981] flex items-center gap-1 tracking-tight">
                  <span className="text-[16px] text-[#666666] font-bold">R$</span>{' '}
                  {imovel.preco.toLocaleString('pt-BR')}
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-[#F8FAFC] px-4 py-2 rounded-md border border-[#E5E5E5] flex-1 min-w-[120px]">
                    <Bed className="w-5 h-5 text-[#3B82F6]" />
                    <div className="flex flex-col">
                      <span className="font-black text-[16px] text-[#1A3A52] leading-none">
                        {imovel.dormitorios}
                      </span>
                      <span className="text-[#666666] text-[11px] font-bold uppercase">
                        Dormitórios
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-[#F8FAFC] px-4 py-2 rounded-md border border-[#E5E5E5] flex-1 min-w-[120px]">
                    <Car className="w-5 h-5 text-[#3B82F6]" />
                    <div className="flex flex-col">
                      <span className="font-black text-[16px] text-[#1A3A52] leading-none">
                        {imovel.vagas}
                      </span>
                      <span className="text-[#666666] text-[11px] font-bold uppercase">Vagas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            {imovel.observacoes && (
              <div className="space-y-4">
                <h3 className="font-black text-[16px] text-[#1A3A52] flex items-center gap-2 border-b border-[#E5E5E5] pb-2">
                  <Info className="w-4 h-4 text-[#F59E0B]" /> Observações
                </h3>
                <div className="text-[14px] text-[#333333] font-medium bg-[#FFFBEB] p-4 rounded-[8px] border border-[#FDE68A] whitespace-pre-wrap leading-relaxed shadow-sm">
                  {imovel.observacoes}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="p-4 border-t border-[#E5E5E5] bg-white flex flex-col gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 relative">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1 font-bold h-[48px] text-[14px] border-[#E5E5E5] hover:bg-[#F8FAFC] text-[#333333]"
              disabled={!publicUrl}
              onClick={() => {
                if (publicUrl) window.open(publicUrl, '_blank')
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Ver no site
            </Button>
            <Button
              variant="outline"
              className="flex-1 font-bold h-[48px] text-[14px] border-[#E5E5E5] hover:bg-[#F8FAFC] text-[#333333]"
              disabled={!publicUrl}
              onClick={handleCopyLink}
            >
              <Share2 className="w-4 h-4 mr-2" /> Compartilhar
            </Button>
          </div>

          {!imovel.has_demanda && (
            <Button
              className="w-full font-bold h-[48px] bg-[#10B981] hover:bg-[#059669] text-white text-[14px] shadow-sm"
              onClick={() => onVincular(imovel)}
            >
              <LinkIcon className="w-4 h-4 mr-2" /> Vincular a um Cliente
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
