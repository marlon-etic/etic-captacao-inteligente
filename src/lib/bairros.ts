import { REGIONS_DATA } from './regions'

export const BAIRROS_ETIC = REGIONS_DATA.flatMap((r) => [r.anchor, ...r.satellites]).sort()
