import cov from '../data/cobertura.json'
import raw from '../data/rutas.json'
import { weekday, DIAS, clock } from './format'

export const META = raw.meta
export const DAYS = raw.days
export const ROUTES = raw.routes
export const VECINOS = raw.vecinos
export const ROUTE = Object.fromEntries(ROUTES.map((r) => [r.id, r]))
export const PDV = {}
ROUTES.forEach((r) => r.pdvs.forEach((p) => (PDV[p.code] = { ...p, route: r.id })))

/** Visitas de un día agrupadas por PDV (une la visita partida por el almuerzo). */
export function dayVisits(day) {
  const out = []
  for (const s of day.segs) {
    if (s.tipo === 'visita') out.push({ code: s.code, orden: s.orden, start: s.start, end: s.end, store: s.end - s.start, split: false })
    else if (s.tipo === 'continua') {
      const v = out[out.length - 1]
      v.end = s.end
      v.store += s.end - s.start
      v.split = true
    }
  }
  return out
}

/** Todas las visitas de un PDV en el mes, con hora de llegada y salida. */
export function pdvVisits(routeId, code) {
  const r = ROUTE[routeId]
  const res = []
  for (const d of r.days) for (const v of dayVisits(d)) if (v.code === code) res.push({ ...v, fecha: d.fecha })
  return res
}

const mode = (arr) => {
  const c = new Map()
  arr.forEach((x) => c.set(x, (c.get(x) || 0) + 1))
  return [...c.entries()].sort((a, b) => b[1] - a[1])[0]
}

/** Resumen de horario de un PDV: horario más frecuente y días de la semana. */
export function pdvSchedule(routeId, code) {
  const vs = pdvVisits(routeId, code)
  if (!vs.length) return { horario: '—', dias: '—', visits: vs }
  const [h, n] = mode(vs.map((v) => `${clock(v.start)}–${clock(v.end)}`))
  const wd = new Map()
  vs.forEach((v) => {
    const k = weekday(v.fecha)
    wd.set(k, (wd.get(k) || 0) + 1)
  })
  const dias = [...wd.entries()]
    .sort((a, b) => ((a[0] + 6) % 7) - ((b[0] + 6) % 7))
    .map(([k, c]) => `${DIAS[k]} ×${c}`)
    .join(' · ')
  return { horario: h, horarioN: n, total: vs.length, dias, visits: vs }
}

/** Indicadores para las rutas y PDV seleccionados. */
export function metrics(routeIds, pdvSet) {
  const rs = ROUTES.filter((r) => routeIds.includes(r.id))
  const usePdv = (p) => !pdvSet.size || pdvSet.has(p.code)
  let obj = 0, prog = 0, extra = 0, store = 0, free = 0, freeDays = 0, cap = 0, used = 0, travel = 0, kmT = 0, nPdv = 0
  for (const r of rs) {
    for (const p of r.pdvs) if (usePdv(p)) {
      obj += p.obj; prog += p.prog; extra += p.extra; nPdv++
      store += pdvVisits(r.id, p.code).reduce((a, v) => a + v.store, 0)
    }
    for (const d of r.days) {
      const dd = DAYS.find((x) => x.fecha === d.fecha)
      cap += dd.cap; used += d.serv + d.travel; travel += d.travel; kmT += d.km
      free += d.free; if (d.free > 0) freeDays++
    }
  }
  return { obj, prog, extra, store, free, freeDays, cap, used, travel, km: kmT, nPdv, nRoutes: rs.length, cumpl: obj ? prog / obj : 1 }
}

export function routeMetrics(r) {
  const m = metrics([r.id], new Set())
  return { ...m, faltan: m.obj - m.prog }
}

/* ---------- Cobertura del panel HDV y tiendas ARA / Dollarcity ---------- */
export const COV = cov

export const COV_COLORS = { cub: '#1e8e4e', nocub: '#d63a2f', ara: '#f08c00' }
export const COV_LABELS = { cub: 'Cubierto por Harinera del Valle', nocub: 'Sin cobertura de Harinera del Valle', ara: 'ARA y Dollarcity' }

export function distKm(a, b) {
  const R = 6371, t = Math.PI / 180
  const dp = (b.lat - a.lat) * t, dl = (b.lon - a.lon) * t
  const h = Math.sin(dp / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Tiendas ARA / Dollarcity más cercanas a un punto (línea recta). */
export function nearestAra(p, n = 3) {
  return COV.ara
    .map((s) => ({ ...s, km: distKm(p, { lat: s.la, lon: s.lo }) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n)
}
