import { ROUTES, DAYS, metrics } from '../lib/data'
import { shapePath, Shape } from './Shape'
import { num } from '../lib/format'

const all = ROUTES.flatMap((r) => r.pdvs.map((p) => ({ ...p, r })))
const lats = all.map((p) => p.lat), lons = all.map((p) => p.lon)
const LAT0 = Math.min(...lats), LAT1 = Math.max(...lats), LON0 = Math.min(...lons), LON1 = Math.max(...lons)
const K = Math.cos((((LAT0 + LAT1) / 2) * Math.PI) / 180)
const W = 600, H = 600, PAD = 70
const spanX = (LON1 - LON0) * K, spanY = LAT1 - LAT0
const S = Math.min((W - PAD * 2) / spanX, (H - PAD * 2) / spanY)
const OX = (W - spanX * S) / 2, OY = (H - spanY * S) / 2
const px = (lon) => OX + (lon - LON0) * K * S
const py = (lat) => H - OY - (lat - LAT0) * S
const KM_PX = S / 110.57 // píxeles por km en latitud

function CoverMap() {
  const grid = []
  for (let g = Math.floor(LAT0 * 50) / 50; g <= LAT1 + 0.04; g += 0.02) grid.push(<line key={'h' + g} x1={0} x2={W} y1={py(g)} y2={py(g)} />)
  for (let g = Math.floor(LON0 * 50) / 50; g <= LON1 + 0.04; g += 0.02) grid.push(<line key={'v' + g} y1={0} y2={H} x1={px(g)} x2={px(g)} />)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ubicación de los 22 puntos de venta de las cuatro rutas en Cali y Jamundí">
      <defs>
        <radialGradient id="glow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#eef2fb" />
          <stop offset="100%" stopColor="#ffffff" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} rx="28" fill="url(#glow)" />
      <g stroke="#dfe6f4" strokeWidth="1">{grid}</g>
      {ROUTES.map((r) => (
        <polygon key={r.id} points={r.territory.map(([la, lo]) => `${px(lo)},${py(la)}`).join(' ')}
          fill={r.color} fillOpacity=".07" stroke={r.color} strokeOpacity=".55" strokeWidth="1.5" strokeLinejoin="round" />
      ))}
      {all.map((p) => (
        <path key={p.code} transform={`translate(${px(p.lon)},${py(p.lat)})`} d={shapePath(p.r.shape, 13)} fill={p.r.color} stroke="#fff" strokeWidth="2" />
      ))}
      {ROUTES.map((r) => {
        const L = { hv10: [205842, -16, 4, 'end'], r7: [128808, 0, -18, 'middle'], r47: [97415, 14, 18, 'start'], r45: [29714, -14, -8, 'end'] }[r.id]
        const p = r.pdvs.find((x) => x.code === L[0])
        return (
          <text key={r.id} x={px(p.lon) + L[1]} y={py(p.lat) + L[2]} textAnchor={L[3]} fontFamily="Outfit" fontWeight="600" fontSize="15" fill="#0f1b3d">{r.name}</text>
        )
      })}
      <g transform={`translate(${W - PAD - 2 * KM_PX},${H - 34})`} fontFamily="Outfit" fontSize="11" fill="#56617d">
        <line x1="0" x2={2 * KM_PX} y1="0" y2="0" stroke="#0f1b3d" strokeWidth="2" />
        <line x1="0" x2="0" y1="-4" y2="4" stroke="#0f1b3d" strokeWidth="2" />
        <line x1={2 * KM_PX} x2={2 * KM_PX} y1="-4" y2="4" stroke="#0f1b3d" strokeWidth="2" />
        <text x={KM_PX} y="-9" textAnchor="middle">2 km</text>
      </g>
      <g transform={`translate(${PAD - 24},${PAD - 20})`} fontFamily="Outfit" fontSize="12" fill="#0033a0" fontWeight="600">
        <path d="M0,-14 L6,4 L0,0 L-6,4 Z" fill="#0033a0" />
        <text x="0" y="20" textAnchor="middle">N</text>
      </g>
      <text x={px(-76.545)} y={py(3.268) + 34} fontFamily="Outfit" fontSize="11" letterSpacing="2" fill="#8a93ab">JAMUNDÍ</text>
      <text x={px(-76.512)} y={py(3.43)} fontFamily="Outfit" fontSize="11" letterSpacing="2" fill="#8a93ab">CALI</text>
    </svg>
  )
}

export default function Cover({ onEnter }) {
  const m = metrics(ROUTES.map((r) => r.id), new Set())
  return (
    <div className="cover">
      <div className="cover-main">
        <div>
          <img className="cover-logo" src="/hv-logo.png" alt="Harinera del Valle · Sabe de alimentos" />
          <div className="cover-eyebrow">Noviembre 2026 · Análisis geoespacial</div>
          <h1><span>Rutas</span><span>propuesta</span><span className="soft">Cali</span></h1>
          <p className="cover-lead">
            Cuatro rutas de mercadeo para Harinera del Valle en Cali y Jamundí: cumplimiento de frecuencias,
            horarios de visita, tiempo libre para atender ARA y Dollarcity alternos al panel y la cobertura del panel HDV.
          </p>
          <div className="cover-stats">
            <div><b>{ROUTES.length}</b><span>Rutas</span></div>
            <div><b>{m.nPdv}</b><span>Puntos de venta</span></div>
            <div><b>{DAYS.length}</b><span>Días hábiles</span></div>
            <div><b>{num(m.prog + m.extra)}</b><span>Visitas</span></div>
          </div>
          <div className="cover-legend">
            {ROUTES.map((r) => <span key={r.id}><Shape shape={r.shape} color={r.color} size={11} />{r.name}</span>)}
          </div>
          <button className="cover-cta" onClick={onEnter}>Ver tablero <span aria-hidden="true">→</span></button>
        </div>
        <div className="cover-art"><CoverMap /></div>
      </div>
      <div className="cover-band">
        <b>RUTAS PROPUESTA CALI</b>
        <span>Harinera del Valle · Vision &amp; Marketing · 3 al 30 de noviembre de 2026</span>
      </div>
    </div>
  )
}
