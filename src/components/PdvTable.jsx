import { useMemo, useState } from 'react'
import { ROUTES, pdvSchedule } from '../lib/data'
import { Shape } from './Shape'
import { dur, dayNum } from '../lib/format'

const COLS = [
  ['ruta', 'Ruta'], ['name', 'Punto de venta'], ['code', 'Código VUM', 'num'], ['mun', 'Municipio'], ['min', 'Duración', 'num'],
  ['vis', 'Visitas', 'num'], ['dias', 'Días de visita'], ['horario', 'Horario más frecuente'], ['sug', 'Días sugeridos (base)'], ['fechas', 'Fechas en noviembre'],
]

export default function PdvTable({ routesSel, pdvSel }) {
  const [sort, setSort] = useState({ k: 'ruta', dir: 1 })
  const rows = useMemo(() => ROUTES.filter((r) => routesSel.includes(r.id)).flatMap((r, ri) =>
    r.pdvs.filter((p) => !pdvSel.size || pdvSel.has(p.code)).map((p) => {
      const sc = pdvSchedule(r.id, p.code)
      return { r, ri, p, ruta: ri, name: p.name, code: p.code, mun: p.mun, min: p.min, vis: p.prog / p.obj, dias: sc.dias, horario: sc.horario, horarioN: sc.horarioN, total: sc.total, sug: p.sug, fechas: p.fechas.length }
    })), [routesSel, pdvSel])
  const sorted = [...rows].sort((a, b) => {
    const va = a[sort.k], vb = b[sort.k]
    const c = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
    return c * sort.dir || a.ri - b.ri || b.p.obj - a.p.obj
  })
  const head = (k, t, cls) => (
    <th key={k} className={cls} onClick={() => setSort((s) => ({ k, dir: s.k === k ? -s.dir : 1 }))} aria-sort={sort.k === k ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}>
      {t}{sort.k === k ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}
    </th>
  )
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr>{COLS.map(([k, t, c]) => head(k, t, c))}</tr></thead>
        <tbody>
          {sorted.map(({ r, p, dias, horario, horarioN, total }) => {
            const miss = p.obj - p.prog
            return (
              <tr key={p.code}>
                <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}><Shape shape={r.shape} color={r.color} size={10} />{r.name}</span></td>
                <td><b>{p.name}</b>{p.nota && <div style={{ color: '#8a93ab', fontSize: '.76rem' }}>{p.nota}</div>}</td>
                <td className="num">{p.code}</td>
                <td>{p.mun}</td>
                <td className="num" style={{ whiteSpace: 'nowrap' }}>{dur(p.min)}</td>
                <td className="num">
                  <span className={'pill ' + (miss > 0 ? 'warn' : 'ok')}>{miss > 0 ? '▲ ' : '✓ '}{p.prog}/{p.obj}</span>
                  {p.extra ? <div style={{ color: '#8a93ab', fontSize: '.74rem', marginTop: 3 }}>+{p.extra} lun 30</div> : null}
                </td>
                <td style={{ minWidth: 150 }}>{dias}</td>
                <td className="tabular" style={{ whiteSpace: 'nowrap' }}>{horario}<div style={{ color: '#8a93ab', fontSize: '.74rem' }}>{horarioN} de {total} visitas</div></td>
                <td>{p.sug}</td>
                <td className="tabular" style={{ color: '#56617d', minWidth: 130 }}>{p.fechas.map(dayNum).join(', ')}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
