import { ROUTE, PDV, DAYS, nearestAra, COV_COLORS } from '../lib/data'
import { Shape } from './Shape'
import { clock, dur, dayLong, num } from '../lib/format'

export default function DayDetail({ selDay }) {
  if (!selDay) return <div className="empty">Elige un día en el calendario o en la agenda para ver su recorrido.</div>
  const r = ROUTE[selDay.route]
  const d = r.days.find((x) => x.fecha === selDay.fecha)
  const dd = DAYS.find((x) => x.fecha === d.fecha)
  const used = d.serv + d.travel
  const last = PDV[d.stops[d.stops.length - 1]]
  const near = d.free ? nearestAra({ lat: last.lat, lon: last.lon }, 3) : []
  return (
    <div>
      <div className="day-head">
        <div>
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shape shape={r.shape} color={r.color} size={9} />{r.name}</div>
          <h3>{dayLong(d.fecha).replace(/^./, (c) => c.toUpperCase())}</h3>
          <div style={{ color: '#56617d', fontSize: '.84rem', marginTop: 2 }}>
            {d.stops.length} {d.stops.length === 1 ? 'visita' : 'visitas'} · {dur(d.serv)} en tienda · {d.travel} min de desplazamiento · {Math.round((used / dd.cap) * 100)}% de la jornada
          </div>
        </div>
        <a className="gm" href={d.gmaps} target="_blank" rel="noopener noreferrer">Abrir en Google Maps ↗</a>
      </div>
      <ol className="it">
        {d.segs.map((s, i) => {
          const leg = s.tmin ? <div className="leg">↓ {s.modo === 'A pie' ? 'A pie' : 'En carro'} · {s.km} km · {s.tmin} min</div> : null
          if (s.tipo === 'visita' || s.tipo === 'continua') {
            const p = PDV[s.code]
            return (
              <li key={i}>
                <span className="time">{clock(s.start)}</span>
                <span className="dot" style={{ background: r.color, opacity: s.tipo === 'continua' ? 0.55 : 1 }}>{s.orden}</span>
                <div className="body">
                  <b>{p.name}{s.tipo === 'continua' ? ' · continúa' : ''}</b>
                  <small>{clock(s.start)}–{clock(s.end)} · {dur(s.end - s.start)} · cód. VUM {p.code}{s.tipo === 'visita' && p.sug ? ` · base: ${p.sug}` : ''}</small>
                </div>
                {leg}
              </li>
            )
          }
          if (s.tipo === 'almuerzo') return (
            <li key={i}>
              <span className="time">{clock(s.start)}</span><span className="dot lunch">◷</span>
              <div className="body"><b>Almuerzo</b><small>{clock(s.start)}–{clock(s.end)}</small></div>{leg}
            </li>
          )
          return (
            <li key={i}>
              <span className="time">{clock(s.start)}</span><span className="dot free">+</span>
              <div className="body"><b style={{ color: '#1c5cab' }}>Espacio libre · ARA o Dollarcity alterno</b><small>{clock(s.start)}–{clock(s.end)} · {dur(s.end - s.start)}</small></div>
            </li>
          )
        })}
        <li>
          <span className="time">{clock(dd.endwin)}</span><span className="dot" style={{ background: '#eef2fb', color: '#56617d' }}>■</span>
          <div className="body"><b>Fin de jornada</b><small>{d.free ? `${dur(d.free)} libres para ARA o Dollarcity` : 'Sin espacio libre de 30 min o más'}</small></div>
        </li>
      </ol>
      {near.length > 0 && (
        <div className="near-ara">
          <b>ARA y Dollarcity más cerca del último punto</b>
          <div style={{ color: '#56617d', fontSize: '.8rem' }}>Desde {last.name}, en línea recta</div>
          <ul>
            {near.map((s) => (
              <li key={s.n}><i className="dot" style={{ background: COV_COLORS.ara }} />{s.n}<small>{s.km < 1 ? `${num(s.km * 1000, 0)} m` : `${num(s.km, 1)} km`}</small></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
