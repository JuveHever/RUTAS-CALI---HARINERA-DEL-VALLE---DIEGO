import { ROUTES, routeMetrics } from '../lib/data'
import { Shape } from './Shape'
import { hours, pct, num } from '../lib/format'

export function Progress({ value, total, color, extra = 0, h = 10 }) {
  const max = Math.max(total, value + extra)
  const w1 = (value / max) * 100, w2 = (extra / max) * 100, gap = ((total - value) / max) * 100
  const id = 'h' + color.replace('#', '')
  return (
    <svg width="100%" height={h} role="img" aria-label={`${value} de ${total}`} preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="#fff" /><line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="2.2" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height={h} rx={h / 2} fill="#eef2fb" />
      {gap > 0 && <rect x={`${w1}%`} y="0" width={`${gap}%`} height={h} fill={`url(#${id})`} opacity=".8" />}
      <rect x="0" y="0" width={`${w1}%`} height={h} rx={h / 2} fill={color} />
      {w2 > 0 && <rect x={`${w1}%`} y="0" width={`${w2}%`} height={h} fill={color} opacity=".35" />}
      {(w2 > 0 || gap > 0) && w1 > 0 && <rect x={`${w1}%`} y="0" width="2" height={h} fill="#fff" />}
    </svg>
  )
}

export default function RouteCards({ routesSel, onSolo }) {
  return (
    <div className="rcards">
      {ROUTES.filter((r) => routesSel.includes(r.id)).map((r) => {
        const m = routeMetrics(r)
        return (
          <button key={r.id} className="rcard" onClick={() => onSolo(r.id)} title="Ver solo esta ruta">
            <div className="rcard-top">
              <div>
                <div className="rcard-name"><Shape shape={r.shape} color={r.color} size={12} />{r.name}</div>
                <div className="rcard-tag">{r.tipo} · {r.pdvs.length} PDV</div>
              </div>
              <div className="rcard-pct">{pct(m.cumpl)}</div>
            </div>
            <Progress value={m.prog} total={m.obj} color={r.color} />
            <div className="rcard-row">
              <span>Visitas <b>{m.prog}</b> de {m.obj}{m.extra ? ` · +${m.extra} lun 30` : ''}</span>
              {m.faltan > 0 ? <span className="flag">▲ {m.faltan} no caben</span> : <span>Todas caben</span>}
            </div>
            <div className="rcard-row">
              <span>Libre ARA/D1 <b>{hours(m.free)} h</b> · {m.freeDays} días</span>
              <span>Ocupación <b>{pct(m.used / m.cap)}</b></span>
            </div>
            <div className="rcard-row">
              <span>Desplazamiento <b>{hours(m.travel)} h</b> · {num(m.km)} km</span>
              <span>Extensión <b>{num(r.spread_km, 1)} km</b></span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
