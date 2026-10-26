import { ROUTE, ROUTES, PDV, VECINOS, routeMetrics, COV, distKm } from '../lib/data'
import { Shape } from './Shape'
import { dur, hours, num, pct } from '../lib/format'

const hav = (a, b) => {
  const R = 6371, t = Math.PI / 180
  const dp = (b.lat - a.lat) * t, dl = (b.lon - a.lon) * t
  const h = Math.sin(dp / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
const travelMin = (a, b) => Math.ceil((hav(a, b) * 1.3) / 20 * 60 + 8)

const Tag = ({ r }) => <span className="pill"><Shape shape={r.shape} color={r.color} size={8} />{r.name}</span>

export default function Findings() {
  const ms = Object.fromEntries(ROUTES.map((r) => [r.id, routeMetrics(r)]))
  const [v1, v2] = VECINOS
  const busiest = [...ROUTES].sort((a, b) => ms[b.id].free - ms[a.id].free)[0]
  const totalFree = ROUTES.reduce((a, r) => a + ms[r.id].free, 0)
  const r7 = ROUTE.r7
  const can = r7.pdvs.find((p) => p.code === 149545), mz = r7.pdvs.find((p) => p.code === 128808)
  const tCM = travelMin(can, mz)
  const hv = ROUTE.hv10
  const R = COV.resumen
  const caliNo = COV.panel.filter((p) => p.ciu === 'Cali' && !p.cub).length
  const chainNo = new Map()
  COV.panel.filter((p) => !p.cub).forEach((p) => chainNo.set(p.cad, (chainNo.get(p.cad) || 0) + 1))
  const topChains = [...chainNo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  const nearRoute = (r, s) => r.pdvs.some((p) => distKm({ lat: s.la, lon: s.lo }, p) <= 1)
  const araNear = COV.ara.filter((s) => ROUTES.some((r) => nearRoute(r, s)))
  const araByRoute = ROUTES.map((r) => [r, COV.ara.filter((s) => nearRoute(r, s)).length]).sort((a, b) => b[1] - a[1])
  const cards = [
    {
      k: `${num(v1.km * 1000)} m`, t: 'Dos rutas exclusivas atienden puntos vecinos',
      p: `${PDV[v1.pa].name} y ${PDV[v1.pb].name} están a ${num(v1.km * 1000)} m en línea recta y los visitan personas distintas. Vale la pena revisar si una sola ruta puede cubrir los dos.`,
      tags: [ROUTE[v1.a], ROUTE[v1.b]],
    },
    {
      k: `${num(v2.km * 1000)} m`, t: 'El panel y una exclusiva se cruzan en Valle de Lili',
      p: `${PDV[v2.pa].name} (${ROUTE[v2.a].name}) queda a ${num(v2.km * 1000)} m de ${PDV[v2.pb].name} (${ROUTE[v2.b].name}). El sur de Cali concentra tres de las cuatro rutas.`,
      tags: [ROUTE[v2.a], ROUTE[v2.b]],
    },
    {
      k: `${hours(ms[busiest.id].free, 0)} h`, t: `${busiest.name} es la ruta con más capacidad libre`,
      p: `Usa el ${pct(ms[busiest.id].used / ms[busiest.id].cap)} de su jornada. Los días de ${busiest.pdvs.slice().sort((a, b) => a.min - b.min)[0].name} (${dur(busiest.pdvs.slice().sort((a, b) => a.min - b.min)[0].min)}) dejan más de la mitad de la jornada libre para ARA o Dollarcity.`,
      tags: [busiest],
    },
    {
      k: `${ms.r7.faltan} visitas`, t: `${r7.name}: dos visitas largas que no comparten día`,
      p: `${can.name} (${dur(can.min)}) y ${mz.name} (${dur(mz.min)}) más ${tCM} min de traslado suman ${dur(can.min + mz.min + tCM)}, por encima de la jornada de viernes y sábado (7 h 40 min). Con un cupo por día para cada una, falta una visita de ${can.name} por semana.`,
      tags: [r7],
    },
    {
      k: `${num(ms.hv10.km)} km`, t: `${hv.name} es la ruta más extensa`,
      p: `Recorre ${num(hv.spread_km, 1)} km de punta a punta, de Jamundí a Pasoancho, con ${hours(ms.hv10.travel)} h de desplazamiento en el mes. Cumple el 100% de las visitas y deja ${hours(ms.hv10.free)} h libres en ${ms.hv10.freeDays} días.`,
      tags: [hv],
    },
    {
      k: `${hours(totalFree, 0)} h`, t: 'Tiempo libre de las cuatro rutas en noviembre',
      p: `Equivale a unas ${num(totalFree / 400)} jornadas de lunes a jueves. Se ubica al final del día, cerca del último punto, para visitar ARA o Dollarcity alternos al panel sin mover visitas.`,
      tags: ROUTES,
    },
    {
      k: pct(R.cub / R.panel), t: 'Cobertura del panel Harinera del Valle',
      p: `${num(R.cub)} de ${num(R.panel)} puntos del panel están programados en ${R.corte.toLowerCase()}. Quedan ${num(R.nocub)} sin cobertura, ${caliNo} de ellos en Cali. Las cadenas con más puntos sin cobertura son ${topChains.map(([c, n]) => `${c} (${n})`).join(', ')}.`,
      tags: [],
    },
    {
      k: `${araNear.length} tiendas`, t: 'ARA y Dollarcity a menos de 1 km de las rutas',
      p: `De las ${R.ara + R.dollar} tiendas ARA y Dollarcity de Cali y Jamundí, ${araNear.length} quedan a menos de 1 km de un punto de las rutas propuestas: sirven para usar el tiempo libre sin desviarse. ${araByRoute[0][0].name} es la que tiene más cerca (${araByRoute[0][1]}).`,
      tags: araByRoute.filter(([, n]) => n > 0).map(([r]) => r),
    },
  ]
  return (
    <div className="finds">
      {cards.map((c, i) => (
        <article className="find" key={i}>
          <div className="find-k">{c.k}</div>
          <h3>{c.t}</h3>
          <p>{c.p}</p>
          <div className="who">{c.tags.map((r) => <Tag key={r.id} r={r} />)}</div>
        </article>
      ))}
    </div>
  )
}
