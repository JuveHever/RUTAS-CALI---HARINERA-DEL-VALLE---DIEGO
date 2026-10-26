import { useEffect, useRef, useState } from 'react'
import { ROUTE, PDV, DAYS } from '../lib/data'
import { useTip } from './Tooltip'
import { DIAS, weekday, dayNum, clock, dur, dayLong } from '../lib/format'

function useWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(900)
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(Math.max(760, Math.floor(e.contentRect.width))))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

const T0 = 480, T1 = 1000 // 8:00 → 16:40
const ROW = 26, BAR = 18, TOP = 30, LEFT = 74

export default function Agenda({ routeId, pdvSel, selDay, onSelect }) {
  const tip = useTip()
  const [ref, W] = useWidth()
  const r = ROUTE[routeId]
  const x = (m) => LEFT + ((m - T0) / (T1 - T0)) * (W - LEFT - 12)
  let y = TOP
  const rows = []
  let lastSem = null
  const ticks = []
  for (let h = 8; h <= 16; h++) ticks.push(h * 60)
  r.days.forEach((d) => {
    if (lastSem !== null && d.sem !== lastSem) y += 10
    lastSem = d.sem
    rows.push({ d, y }); y += ROW
  })
  const H = y + 8
  const pid = 'free-' + routeId
  return (
    <div className="gantt" ref={ref}>
      <svg width={W} height={H} role="img" aria-label={`Agenda del mes de ${r.name}: visitas, almuerzo y tiempo libre por día`}>
        <defs>
          <pattern id={pid} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="7" fill="#e6effc" /><line x1="0" y1="0" x2="0" y2="7" stroke="#3987e5" strokeWidth="2.4" />
          </pattern>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={TOP - 6} y2={H - 6} stroke="#e8ecf4" strokeWidth="1" />
            <text x={x(t)} y={TOP - 12} textAnchor="middle" fontSize="11" fill="#56617d" fontFamily="Outfit">{t / 60}:00</text>
          </g>
        ))}
        {rows.map(({ d, y }) => {
          const dd = DAYS.find((z) => z.fecha === d.fecha)
          const sel = selDay && selDay.route === routeId && selDay.fecha === d.fecha
          const cy = y + (ROW - BAR) / 2
          return (
            <g key={d.fecha} style={{ cursor: 'pointer' }} onClick={() => onSelect({ route: routeId, fecha: d.fecha })}>
              <rect x={0} y={y} width={W} height={ROW} fill={sel ? '#eef2fb' : 'transparent'} />
              <text x={8} y={y + ROW / 2 + 4} fontSize="12" fontFamily="Outfit" fontWeight={sel ? 700 : 500} fill="#0f1b3d">
                {DIAS[weekday(d.fecha)]} {dayNum(d.fecha)}
              </text>
              <rect x={x(T0)} y={cy} width={x(dd.endwin) - x(T0)} height={BAR} rx="4" fill="#f4f6fb" />
              <line x1={x(dd.endwin)} x2={x(dd.endwin)} y1={cy - 3} y2={cy + BAR + 3} stroke="#8a93ab" strokeWidth="1.5" />
              {d.segs.map((s, i) => {
                const nx = d.segs[i + 1]
                const els = []
                const w = Math.max(2, x(s.end) - x(s.start) - 2)
                if (s.tipo === 'visita' || s.tipo === 'continua') {
                  const p = PDV[s.code]
                  const faded = pdvSel.size > 0 && !pdvSel.has(s.code)
                  const maxc = Math.floor((w - 12) / 6.4)
                  const label = p.short.length <= maxc ? p.short : maxc >= 5 ? p.short.slice(0, maxc - 1).trimEnd() + '…' : null
                  els.push(
                    <g key={i} opacity={faded ? 0.22 : 1}
                      onMouseMove={(e) => tip.show(e, <div><b>{p.name}</b><div>{dayLong(d.fecha)}</div><div>{clock(s.start)}–{clock(s.end)} · {dur(s.end - s.start)}{s.tipo === 'continua' ? ' (después del almuerzo)' : ''}</div><div className="muted">Visita {s.orden} del día · cód. VUM {p.code}</div></div>)}
                      onMouseLeave={tip.hide}>
                      <rect x={x(s.start) + 1} y={cy} width={w} height={BAR} rx="4" fill={r.color} />
                      {label && <text x={x(s.start) + 7} y={cy + 13} fontSize="11" fontFamily="Nunito Sans" fontWeight="700" fill="#fff">{label}</text>}
                    </g>
                  )
                } else if (s.tipo === 'almuerzo') {
                  els.push(
                    <g key={i} onMouseMove={(e) => tip.show(e, <div><b>Almuerzo</b><div>{clock(s.start)}–{clock(s.end)}</div></div>)} onMouseLeave={tip.hide}>
                      <rect x={x(s.start) + 1} y={cy} width={w} height={BAR} rx="4" fill="#d5dbe7" />
                      {w > 62 && <text x={x(s.start) + 7} y={cy + 13} fontSize="10.5" fontFamily="Nunito Sans" fontWeight="600" fill="#56617d">Almuerzo</text>}
                    </g>
                  )
                } else if (s.tipo === 'libre') {
                  const m = s.end - s.start
                  els.push(
                    <g key={i} onMouseMove={(e) => tip.show(e, <div><b>Espacio libre · ARA o Dollarcity</b><div>{clock(s.start)}–{clock(s.end)} · {dur(m)}</div></div>)} onMouseLeave={tip.hide}>
                      <rect x={x(s.start) + 1} y={cy} width={w} height={BAR} rx="4" fill={`url(#${pid})`} />
                      {w > 74 && (
                        <g>
                          <rect x={x(s.start) + 5} y={cy + 3} width={Math.min(w - 8, dur(m).length * 6 + 34)} height={BAR - 6} rx="3" fill="#fff" />
                          <text x={x(s.start) + 9} y={cy + 13} fontSize="10.5" fontFamily="Nunito Sans" fontWeight="700" fill="#1c5cab">Libre {dur(m)}</text>
                        </g>
                      )}
                    </g>
                  )
                }
                if (s.tmin && nx) {
                  els.push(<line key={'t' + i} x1={x(s.end) + 1} x2={x(nx.start) - 1} y1={cy + BAR / 2} y2={cy + BAR / 2} stroke="#8a93ab" strokeWidth="1.5" strokeDasharray="2 3" />)
                }
                return els
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
