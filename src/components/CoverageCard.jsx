import { COV, COV_COLORS } from '../lib/data'
import { num, pct } from '../lib/format'

/* Resumen de cobertura del panel HDV: cubiertos, sin cobertura y ARA / Dollarcity */
export default function CoverageCard() {
  const R = COV.resumen
  const byCity = new Map()
  COV.panel.forEach((p) => {
    const c = byCity.get(p.ciu) || { ciu: p.ciu, n: 0, cub: 0 }
    c.n++; c.cub += p.cub
    byCity.set(p.ciu, c)
  })
  const cities = [...byCity.values()].sort((a, b) => b.n - a.n || a.ciu.localeCompare(b.ciu, 'es'))
  const top = cities.slice(0, 9)
  const rest = cities.slice(9).reduce((a, c) => ({ ciu: `Otros ${cities.length - 9} municipios`, n: a.n + c.n, cub: a.cub + c.cub }), { n: 0, cub: 0 })
  const rows = rest.n ? [...top, rest] : top
  const byChain = new Map()
  COV.panel.filter((p) => !p.cub).forEach((p) => byChain.set(p.cad, (byChain.get(p.cad) || 0) + 1))
  const chains = [...byChain.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  return (
    <div className="covcard">
      <div className="eyebrow">Cobertura · {R.corte.toLowerCase()}</div>
      <h2>Panel Harinera del Valle</h2>
      <div className="cov-hero">
        <span className="kpi-value">{pct(R.cub / R.panel)}</span>
        <span className="kpi-sub">{num(R.cub)} de {num(R.panel)} puntos de venta del panel con cobertura</span>
        <div className="cov-bar" aria-hidden="true">
          <i style={{ width: `${(R.cub / R.panel) * 100}%`, background: COV_COLORS.cub }} />
          <i style={{ width: `${(R.nocub / R.panel) * 100}%`, background: COV_COLORS.nocub }} />
        </div>
      </div>
      <ul className="cov-legend">
        <li><i className="dot" style={{ background: COV_COLORS.cub }} />Cubiertos por Harinera del Valle<b>{num(R.cub)}</b></li>
        <li><i className="dot" style={{ background: COV_COLORS.nocub }} />Sin cobertura de Harinera del Valle<b>{num(R.nocub)}</b></li>
        <li><i className="dot" style={{ background: COV_COLORS.ara }} />ARA y Dollarcity<b>{num(R.ara + R.dollar)}</b></li>
        <li className="sub">{R.ara} ARA · {R.dollar} Dollarcity, en Cali y Jamundí</li>
      </ul>
      <table className="cov-tbl">
        <thead><tr><th>Municipio</th><th className="num">PDV</th><th className="num">Cubiertos</th><th className="num">Sin cobertura</th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.ciu}>
              <td>{c.ciu}</td>
              <td className="num">{c.n}</td>
              <td className="num" style={{ color: COV_COLORS.cub }}>{c.cub}</td>
              <td className="num" style={{ color: c.n - c.cub ? COV_COLORS.nocub : undefined }}>{c.n - c.cub}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cov-chains">
        <b>Cadenas con más puntos sin cobertura</b>
        <span>{chains.map(([c, n]) => `${c} (${n})`).join(' · ')}</span>
      </div>
    </div>
  )
}
