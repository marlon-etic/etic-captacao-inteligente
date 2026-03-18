export const REGIONS_DATA = [
  {
    anchor: 'Mooca',
    satellites: [
      'Vila Claudia',
      'Belenzinho',
      'Brás',
      'Vila Bertioga',
      'Vila Oratório',
      'Água Rasa',
      'Quarta Parada',
      'Alto da Mooca',
      'Parque da Mooca',
      'Vila Regente Feijó',
    ],
  },
  {
    anchor: 'Tatuapé',
    satellites: [
      'Cidade Mãe do Céu',
      'Jardim Anália Franco',
      'Vila Gomes Cardim',
      'Carrão',
      'Vila Formosa',
      'Penha de França',
      'Vila Matilde',
      'Jardim Íris',
      'Vila Esperança',
      'Parque São Jorge',
    ],
  },
  {
    anchor: 'Carrão',
    satellites: [
      'Vila Domitila',
      'Jardim Anália Franco',
      'Vila Antonieta',
      'Parque Savoy City',
      'Vila Marieta',
      'Vila Talarico',
      'Parque Residencial Carrão',
      'Vila Invernada',
      'Jardim Aricanduva',
    ],
  },
  {
    anchor: 'Vila Prudente',
    satellites: [
      'Parque São Lucas',
      'Vila Alpina',
      'Vila São José',
      'Jardim da Saúde',
      'Vila Monumento',
      'Parque Jabaquara',
      'Vila Firmiano Pinto',
      'Jardim Independência',
      'Vila Zelina',
    ],
  },
  {
    anchor: 'Ipiranga',
    satellites: [
      'Sacomã',
      'Cursino',
      'Vila Carioca',
      'Parque Imperial',
      'Vila Monumento',
      'Heliópolis',
      'Vila Califórnia',
      'Parque Jabaquara',
      'Jardim Consórcio',
      'Vila Guarani',
    ],
  },
  {
    anchor: 'Vila Ema',
    satellites: [
      'São Lucas',
      'Jardim São Lucas',
      'Vila Moraes',
      'Parque São Lucas',
      'Vila Antonieta',
      'Jardim Três Marias',
      'Vila Nhocuné',
      'Jardim Aricanduva',
      'Vila Carmosina',
    ],
  },
]

export const ALL_NEIGHBORHOODS = REGIONS_DATA.flatMap((r) => [r.anchor, ...r.satellites])

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
