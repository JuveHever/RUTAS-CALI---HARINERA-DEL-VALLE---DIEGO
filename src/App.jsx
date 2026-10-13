import { useEffect, useMemo, useState } from 'react'
import { ROUTES, ROUTE, META, metrics } from './lib/data'
import { dayLabel } from './lib/format'
import { TooltipProvider } from './components/Tooltip'
import Cover from './components/Cover'
import Header from './components/Header'
import Kpis from './components/Kpis'
import RouteMap from './components/RouteMap'
import RouteCards from './components/RouteCards'
import FreeCalendar from './components/FreeCalendar'
import Agenda from './components/Agenda'
import DayDetail from './components/DayDetail'
import PdvCompliance from './components/PdvCompliance'
import PdvTable from './components/PdvTable'
import Findings from './components/Findings'
import { Shape } from './components/Shape'

const ALL = ROUTES.map((r) => r.id)

function Section({ id, eyebrow, title, desc, tools, children }) {
  return (
    <section id={id} style={{ scrollMarginTop: 130 }}>
      <div className="section-head">
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h2>{title}</h2>
          {desc && <p>{desc}</p>}
        </div>
        {tools}
      </div>
      {children}
    </section>
  )
}

export default function App() {
  const [view, setView] = useState(() => (location.hash && location.hash !== '#portada' ? 'dash' : 'cover'))
  const [routesSel, setRoutesSel] = useState(ALL)
  const [pdvSel, setPdvSel] = useState(new Set())
  const [selDay, setSelDay] = useState({ route: 'hv10', fecha: ROUTE.hv10.days[0].fecha })
  const [mapDay, setMapDay] = useState(null)
  const [agendaRoute, setAgendaRoute] = useState('hv10')
  const [showNear, setShowNear] = useState(true)

  useEffect(() => {
    if (!routesSel.includes(agendaRoute)) setAgendaRoute(routesSel[0])
    if (!routesSel.includes(selDay.route)) setSelDay({ route: routesSel[0], fecha: ROUTE[routesSel[0]].days[0].fecha })
    if (mapDay && !routesSel.includes(mapDay.route)) setMapDay(null)
  }, [routesSel])

  useEffect(() => { window.scrollTo(0, 0) }, [view])

  const m = useMemo(() => metrics(routesSel, pdvSel), [routesSel, pdvSel])
  const pick = (d) => { setSelDay(d); setMapDay(d); setAgendaRoute(d.route) }

  if (view === 'cover') return <Cover onEnter={() => setView('dash')} />

  return (
    <TooltipProvider>
      <Header routesSel={routesSel} setRoutesSel={setRoutesSel} pdvSel={pdvSel} setPdvSel={setPdvSel} onHome={() => setView('cover')} />
      <main className="page">
        <Section id="resumen" eyebrow="Noviembre 2026 · 23 días hábiles" title="Resumen de las rutas propuestas"
          desc="Cumplimiento de las frecuencias del escenario, horas en tienda y tiempo que queda libre para visitar ARA o D1 alternos al panel. Los indicadores responden a los filtros de ruta y punto de venta.">
          <Kpis m={m} />
        </Section>

        <div className="grid">
          <div className="card span-8 map-card" id="mapa" style={{ scrollMarginTop: 130 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Análisis geoespacial</div>
                <h2>Mapa de rutas</h2>
                <p>Cada punto es un punto de venta en su coordenada real y el área punteada es el territorio de la ruta. Con la cercanía activa, las líneas unen puntos de rutas distintas a menos de 1,6 km; acerca el mapa para ver la distancia.</p>
              </div>
              <div className="map-tools">
                {mapDay ? (
                  <button className="chip" aria-pressed="true" onClick={() => setMapDay(null)} title="Volver a la vista del mes">
                    <Shape shape={ROUTE[mapDay.route].shape} color={ROUTE[mapDay.route].color} size={10} />
                    Recorrido {ROUTE[mapDay.route].name} · {dayLabel(mapDay.fecha)} <span aria-hidden="true">✕</span>
                  </button>
                ) : (
                  <label className="toggle"><input type="checkbox" id="cercania" checked={showNear} onChange={(e) => setShowNear(e.target.checked)} />Cercanía entre rutas</label>
                )}
              </div>
            </div>
            <RouteMap routesSel={routesSel} pdvSel={pdvSel} selDay={mapDay} showNear={showNear} />
          </div>
          <div className="card span-4">
            <div className="section-head">
              <div>
                <div className="eyebrow">Cumplimiento</div>
                <h2>Por ruta</h2>
                <p>Visitas programadas frente a las del escenario. Clic en una ruta para verla sola.</p>
              </div>
            </div>
            <RouteCards routesSel={routesSel} onSolo={(id) => setRoutesSel([id])} />
          </div>
        </div>

        <div className="card" id="calendario" style={{ scrollMarginTop: 130 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow">Tiempo libre para ARA o D1</div>
              <h2>Calendario de noviembre</h2>
              <p>Minutos que quedan libres en cada jornada después del panel. Clic en un día para ver su agenda y su recorrido en el mapa.</p>
            </div>
          </div>
          <FreeCalendar routesSel={routesSel} pdvSel={pdvSel} selDay={selDay} onSelect={pick} />
        </div>

        <div className="grid" id="agenda" style={{ scrollMarginTop: 130 }}>
          <div className="card span-8">
            <div className="section-head">
              <div>
                <div className="eyebrow">Horarios</div>
                <h2>Agenda del mes</h2>
                <p>Cada fila es un día: visitas, almuerzo, desplazamientos y espacio libre entre las 8:00 y el fin de la jornada.</p>
              </div>
              <div className="tabs" role="group" aria-label="Ruta de la agenda">
                {ROUTES.filter((r) => routesSel.includes(r.id)).map((r) => (
                  <button key={r.id} className="tab" aria-pressed={agendaRoute === r.id} onClick={() => setAgendaRoute(r.id)}>
                    <Shape shape={r.shape} color={agendaRoute === r.id ? '#fff' : r.color} size={10} />{r.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="legend-row" style={{ marginBottom: 10 }}>
              <span><i className="sw" style={{ background: ROUTE[agendaRoute].color }} />Visita</span>
              <span><i className="sw" style={{ background: '#d5dbe7' }} />Almuerzo</span>
              <span><i className="sw" style={{ background: 'repeating-linear-gradient(45deg,#3987e5 0 2px,#e6effc 2px 5px)' }} />Espacio libre ARA/D1</span>
              <span><i className="sw" style={{ background: 'none', borderTop: '2px dotted #8a93ab', height: 0, borderRadius: 0 }} />Desplazamiento</span>
              <span><i className="sw" style={{ width: 2, background: '#8a93ab' }} />Fin de jornada</span>
            </div>
            <Agenda routeId={agendaRoute} pdvSel={pdvSel} selDay={selDay} onSelect={pick} />
          </div>
          <div className="card span-4" style={{ alignSelf: 'start', position: 'sticky', top: 128 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Día seleccionado</div>
            <DayDetail selDay={selDay} />
          </div>
        </div>

        <div className="grid">
          <div className="card span-12" id="cumplimiento" style={{ scrollMarginTop: 130 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Frecuencias</div>
                <h2>Cumplimiento por punto de venta</h2>
                <p>Visitas programadas frente a las del escenario. En las rutas exclusivas el objetivo son las semanas 1 a 4; el lunes 30 abre la semana de diciembre y se muestra aparte.</p>
              </div>
            </div>
            <PdvCompliance routesSel={routesSel} pdvSel={pdvSel} />
          </div>
        </div>

        <div className="card" id="pdv" style={{ scrollMarginTop: 130 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow">Detalle</div>
              <h2>Puntos de venta, tiempos y horarios</h2>
              <p>Duración de cada visita, días en que se visita y el horario que más se repite. Clic en un encabezado para ordenar.</p>
            </div>
          </div>
          <PdvTable routesSel={routesSel} pdvSel={pdvSel} />
        </div>

        <Section id="hallazgos" eyebrow="Lectura para gerencia" title="Hallazgos geoespaciales"
          desc="Lo que muestran el mapa y la agenda sobre territorio, capacidad y cruces entre rutas.">
          <Findings />
        </Section>

        <footer className="foot">
          <div>
            <b style={{ color: '#0f1b3d' }}>Supuestos del modelo</b> · {META.jornada}
            <ul>{META.supuestos.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <div style={{ textAlign: 'right' }}>
            <img src="/hv-logo.png" alt="Harinera del Valle" />
            <div style={{ marginTop: 6 }}>Rutas propuesta Cali · Vision &amp; Marketing</div>
          </div>
        </footer>
      </main>
    </TooltipProvider>
  )
}
