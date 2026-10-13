import { ROUTES } from '../lib/data'
import { Shape } from './Shape'
import { useTip } from './Tooltip'
import { dur } from '../lib/format'

export default function PdvCompliance({ routesSel, pdvSel }) {
  const tip = useTip()
  const rs = ROUTES.filter((r) => routesSel.includes(r.id))
  const max = Math.max(...rs.flatMap((r) => r.pdvs.map((p) => Math.max(p.obj, p.prog + p.extra))))
  return (
    <div className="bars">
      {rs.map((r) => {
        const ps = [...r.pdvs].filter((p) => !pdvSel.size || pdvSel.has(p.code)).sort((a, b) => b.obj - a.obj || b.min - a.min)
        if (!ps.length) return null
        return (
          <div key={r.id}>
            <div className="bars-group"><Shape shape={r.shape} color={r.color} size={9} />{r.name}</div>
            {ps.map((p) => {
              const wObj = (p.obj / max) * 100, wProg = (p.prog / max) * 100, wExtra = (p.extra / max) * 100
              const miss = p.obj - p.prog
              const content = (
                <div>
                  <b>{p.name}</b>
                  <div>{p.prog} de {p.obj} visitas{p.extra ? ` · +${p.extra} el lunes 30` : ''} · {dur(p.min)} cada una</div>
                  {p.obj_sem && <div className="muted">Por semana: {p.obj_sem.map((o, k) => `S${k + 1} ${p.semanas[k]}/${o}`).join(' · ')}</div>}
                  {p.nota && <div className="muted">Escenario: {p.nota}</div>}
                  {miss > 0 && <div>No caben {miss} visitas</div>}
                </div>
              )
              const pid = 'pc-' + p.code
              return (
                <div className="bar-row" key={p.code} onMouseMove={(e) => tip.show(e, content)} onMouseLeave={tip.hide}>
                  <div className="bar-name" title={p.name}>{p.name}</div>
                  <div className="bar-track">
                    <svg width="100%" height="14" preserveAspectRatio="none" aria-hidden="true">
                      <defs>
                        <pattern id={pid} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                          <rect width="6" height="6" fill="#fff" /><line x1="0" y1="0" x2="0" y2="6" stroke={r.color} strokeWidth="2.2" />
                        </pattern>
                      </defs>
                      <rect x="0" y="0" width={`${wObj}%`} height="14" rx="4" fill="#eef2fb" />
                      {miss > 0 && <rect x={`${wProg}%`} y="0" width={`${wObj - wProg}%`} height="14" fill={`url(#${pid})`} />}
                      <rect x="0" y="0" width={`${wProg}%`} height="14" rx="4" fill={r.color} />
                      {p.extra > 0 && <rect x={`${Math.max(wObj, wProg)}%`} y="0" width={`${wExtra}%`} height="14" fill={r.color} opacity=".3" />}
                      {(miss > 0 || p.extra > 0) && <rect x={`${wProg}%`} y="0" width="2" height="14" fill="#fff" />}
                    </svg>
                  </div>
                  <div className="bar-val">{p.prog}/{p.obj}{miss > 0 ? <span style={{ color: '#8a4b00' }}> ▲</span> : ''}</div>
                </div>
              )
            })}
          </div>
        )
      })}
      <div className="legend-row" style={{ marginTop: 14 }}>
        <span><i className="sw" style={{ background: '#56617d' }} />Programadas (color de la ruta)</span>
        <span><i className="sw" style={{ background: 'repeating-linear-gradient(45deg,#56617d 0 2px,#fff 2px 5px)' }} />Visitas del escenario que no caben</span>
        <span><i className="sw" style={{ background: '#56617d', opacity: 0.3 }} />Visitas extra del lunes 30</span>
      </div>
    </div>
  )
}
