export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const DIAS_LARGO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export const parseDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const weekday = (iso) => parseDate(iso).getDay()
export const dayNum = (iso) => Number(iso.slice(8))
export const dayLabel = (iso) => `${DIAS[weekday(iso)]} ${dayNum(iso)}`
export const dayLong = (iso) => `${DIAS_LARGO[weekday(iso)]} ${dayNum(iso)} de noviembre`

/** minutos desde medianoche → "8:05" */
export const clock = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
/** minutos → "2 h 30 min" */
export const dur = (m) => {
  m = Math.round(m)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h} h ${r} min` : `${h} h`
}
export const hours = (m, dec = 1) =>
  (m / 60).toLocaleString('es-CO', { maximumFractionDigits: dec, minimumFractionDigits: 0 })
export const pct = (v) => `${Math.round(v * 100)}%`
export const num = (v, dec = 0) =>
  v.toLocaleString('es-CO', { maximumFractionDigits: dec, minimumFractionDigits: 0 })
export const km = (v) => `${num(v, v < 10 ? 1 : 0)} km`
