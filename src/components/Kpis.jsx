import { hours, num, pct } from '../lib/format'

export default function Kpis({ m }) {
  return (
    <div className="kpis" aria-label="Indicadores principales">
      <div className="kpi hero">
        <span className="kpi-label">Cumplimiento de frecuencia</span>
        <span className="kpi-value">{pct(m.cumpl)}</span>
        <div className="meter" aria-hidden="true"><i style={{ width: `${Math.min(100, m.cumpl * 100)}%` }} /></div>
        <span className="kpi-sub">{num(m.prog)} de {num(m.obj)} visitas del escenario{m.obj - m.prog > 0 ? ` · ${m.obj - m.prog} no caben` : ' · todas caben'}</span>
      </div>
      <div className="kpi">
        <span className="kpi-label">Visitas programadas</span>
        <span className="kpi-value">{num(m.prog + m.extra)}</span>
        <span className="kpi-sub">{m.nPdv} puntos de venta{m.extra ? ` · ${m.extra} el lun 30` : ''}</span>
      </div>
      <div className="kpi">
        <span className="kpi-label">Horas en tienda</span>
        <span className="kpi-value">{hours(m.store, 0)} h</span>
        <span className="kpi-sub">{hours(m.travel)} h de desplazamiento · {num(m.km)} km</span>
      </div>
      <div className="kpi">
        <span className="kpi-label">Tiempo libre para ARA/Dollarcity</span>
        <span className="kpi-value">{hours(m.free)} h</span>
        <span className="kpi-sub">en {m.freeDays} días-ruta con 30 min o más</span>
      </div>
      <div className="kpi">
        <span className="kpi-label">Ocupación de la jornada</span>
        <span className="kpi-value">{pct(m.used / m.cap)}</span>
        <span className="kpi-sub">{hours(m.used, 0)} h de {hours(m.cap, 0)} h efectivas</span>
      </div>
    </div>
  )
}
