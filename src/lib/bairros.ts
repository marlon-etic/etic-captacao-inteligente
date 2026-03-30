import { REGIONS_DATA } from './regions'

export const BAIRROS_ETIC = Array.from(
  new Set(REGIONS_DATA.flatMap((r) => [r.anchor, ...r.satellites])),
).sort()
