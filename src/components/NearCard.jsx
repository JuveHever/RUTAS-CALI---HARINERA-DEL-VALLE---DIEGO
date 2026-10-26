import { ROUTES, COV_COLORS } from '../lib/data'
import { Shape } from './Shape'
import { num } from '../lib/format'

const dist = (km) => (km < 1 ? `${num(km * 1000, 0)} m` : `${num(km, 1)} km`)
const KIND = { cub: 'Cubierto HDV', nocub: 'Sin cobertura', ara: '' }

/* Vista mixta: PDV del panel y tiendas ARA / Dollarcity cerca de cada ruta */
export default function NearCard({ near, routesSel, radiusKm, cov, onFocus }) {
  const rs = ROUTES.filter((r) => routesSel.includes(r.id))
  const shown = near.filter((x) => cov[x.kind])
  return (
    <div className="covcard">
      <div className="eyebrow">Vista mixta · a menos de {dist(radiusKm)}</div>
      <h2>Qué queda cerca de cada ruta</h2>
      <p className="near-lead">PDV del panel y tiendas ARA o Dollarcity a menos de {dist(radiusKm)} de algún punto de la ruta. Cada uno se asigna al punto de ruta más cercano. Clic en un nombre para verlo en el mapa.</p>
      <table className="cov-tbl">
        <thead>
          <tr>
            <th>Ruta</th>
            <th className="num"><i className="dot" style={{ background: COV_COLORS.cub }} title="Cubiertos HDV" /></th>
            <th className="num"><i className="dot" style={{ background: COV_COLORS.nocub }} title="Sin cobertura" /></th>
            <th className="num"><i className="dot" style={{ background: COV_COLORS.ara }} title="ARA y Dollarcity" /></th>
          </tr>
        </thead>
        <tbody>
          {rs.map((r) => {
            const c = (k) => near.filter((x) => x.route.id === r.id && x.kind === k).length
            return (
              <tr key={r.id}>
                <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Shape shape={r.shape} color={r.color} size={10} />{r.name}</span></td>
                <td className="num" style={{ color: COV_COLORS.cub }}>{c('cub')}</td>
                <td className="num" style={{ color: COV_COLORS.nocub }}>{c('nocub')}</td>
                <td className="num" style={{ color: '#a85f00' }}>{c('ara')}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="near-list" role="list">
        {rs.map((r) => {
          const items = shown.filter((x) => x.route.id === r.id)
          if (!items.length) return null
          return (
            <div key={r.id} className="near-group">
              <div className="near-head"><Shape shape={r.shape} color={r.color} size={10} />{r.name} · {items.length}</div>
              {items.map((x) => (
                <button key={x.key} className="near-item" role="listitem" onClick={() => onFocus({ key: x.key, t: Date.now() })}>
                  <i className="dot" style={{ background: COV_COLORS[x.kind] }} />
                  <span className="near-name">
                    <b>{x.item.n}</b>
                    <small>{x.kind === 'ara' ? x.item.cad : `${x.item.cad} · ${KIND[x.kind]}`} · de {x.pdv.name}</small>
                  </span>
                  <span className="near-km">{dist(x.km)}</span>
                </button>
              ))}
            </div>
          )
        })}
        {!shown.length && <div className="empty">No hay puntos a menos de {dist(radiusKm)} con los filtros actuales.</div>}
      </div>
    </div>
  )
}
