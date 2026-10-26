import { ROUTES, DAYS, PDV, dayVisits } from '../lib/data'
import { useTip } from './Tooltip'
import { Shape } from './Shape'
import { DIAS, weekday, dayNum, dur, dayLong, clock } from '../lib/format'

// Rampa secuencial azul (un solo tono, claro → oscuro) para minutos libres
export const FREE_BINS = [
  { min: 30, max: 59, bg: '#cde2fb', fg: '#0f1b3d', label: '30–59 min' },
  { min: 60, max: 119, bg: '#86b6ef', fg: '#0f1b3d', label: '1–2 h' },
  { min: 120, max: 179, bg: '#3987e5', fg: '#ffffff', label: '2–3 h' },
  { min: 180, max: 239, bg: '#1c5cab', fg: '#ffffff', label: '3–4 h' },
  { min: 240, max: 9999, bg: '#0d366b', fg: '#ffffff', label: '4 h o más' },
]
const binOf = (m) => FREE_BINS.find((b) => m >= b.min && m <= b.max)
const fmtFree = (m) => (m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` : `${m}`)

export default function FreeCalendar({ routesSel, pdvSel, selDay, onSelect }) {
  const tip = useTip()
  const rs = ROUTES.filter((r) => routesSel.includes(r.id))
  const weeks = []
  DAYS.forEach((d) => {
    const w = weeks.find((x) => x.sem === d.sem)
    w ? w.days.push(d) : weeks.push({ sem: d.sem, days: [d] })
  })
  return (
    <div>
      <div className="cal">
        <table>
          <thead>
            <tr>
              <th />
              {weeks.map((w) => (
                <th key={w.sem} className="wk" colSpan={w.days.length}>{w.sem <= 4 ? `Semana ${w.sem}` : 'Dic'}</th>
              ))}
            </tr>
            <tr>
              <th />
              {DAYS.map((d) => <th key={d.fecha}>{DIAS[weekday(d.fecha)]}<br />{dayNum(d.fecha)}</th>)}
            </tr>
          </thead>
          <tbody>
            {rs.map((r) => (
              <tr key={r.id}>
                <th className="rowh" scope="row"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Shape shape={r.shape} color={r.color} size={10} />{r.name}</span></th>
                {r.days.map((d) => {
                  const b = d.free >= 30 ? binOf(d.free) : null
                  const visits = dayVisits(d)
                  const hasSel = pdvSel.size > 0 && visits.some((v) => pdvSel.has(v.code))
                  const dim = pdvSel.size > 0 && !hasSel
                  const pressed = selDay && selDay.route === r.id && selDay.fecha === d.fecha
                  const dd = DAYS.find((x) => x.fecha === d.fecha)
                  const frees = d.segs.filter((s) => s.tipo === 'libre')
                  const content = (
                    <div>
                      <b>{r.name} · {dayLong(d.fecha)}</b>
                      <div>{visits.map((v) => PDV[v.code].short).join(' → ')}</div>
                      <div className="muted">Panel {dur(d.serv)} · desplazamiento {d.travel} min · {Math.round(((d.serv + d.travel) / dd.cap) * 100)}% de la jornada</div>
                      <div>{d.free ? <>Libre para ARA/Dollarcity: <b>{dur(d.free)}</b> ({frees.map((f) => `${clock(f.start)}–${clock(f.end)}`).join(', ')})</> : 'Sin espacio libre de 30 min o más'}</div>
                      <div className="muted">Clic para ver la agenda del día</div>
                    </div>
                  )
                  return (
                    <td key={d.fecha}>
                      <button
                        className="cell"
                        aria-pressed={!!pressed}
                        aria-label={`${r.name} ${dayLong(d.fecha)}: ${d.free ? dur(d.free) + ' libres' : 'sin tiempo libre'}`}
                        style={{ background: b ? b.bg : '#f1f4fa', color: b ? b.fg : '#8a93ab', opacity: dim ? 0.35 : 1, boxShadow: hasSel ? `inset 0 -3px 0 ${r.color}` : 'none' }}
                        onMouseMove={(e) => tip.show(e, content)}
                        onMouseLeave={tip.hide}
                        onClick={() => onSelect({ route: r.id, fecha: d.fecha })}
                      >
                        {d.free >= 30 ? fmtFree(d.free) : '·'}
                        {d.free >= 30 && <small>{d.free >= 60 ? 'h' : 'min'}</small>}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ramp" style={{ marginTop: 12, flexWrap: 'wrap' }}>
        <span>Tiempo libre del día:</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i style={{ background: '#f1f4fa', border: '1px solid #e2e7f1' }} />menos de 30 min</span>
        {FREE_BINS.map((b) => <span key={b.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i style={{ background: b.bg }} />{b.label}</span>)}
        {pdvSel.size > 0 && <span style={{ marginLeft: 8 }}>· Línea inferior: día con visita al punto de venta filtrado</span>}
      </div>
    </div>
  )
}
