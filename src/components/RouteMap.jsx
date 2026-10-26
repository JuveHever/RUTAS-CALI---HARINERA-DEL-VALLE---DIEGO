import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { ROUTES, ROUTE, PDV, VECINOS, pdvSchedule, COV, COV_COLORS } from '../lib/data'
import { shapeSvg, Shape } from './Shape'
import { dur, num, dayLong } from '../lib/format'

const esri = (svc, attr, opts = {}) =>
  L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/${svc}/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 19, maxNativeZoom: 16, attribution: attr, ...opts })

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/* Extensiones de la vista de cobertura */
const CALI_BOX = [[3.225, -76.585], [3.545, -76.445]] // Cali, Jamundí y la entrada a Yumbo
const covBounds = (extent) => {
  if (extent !== 'todo') return L.latLngBounds(CALI_BOX)
  const pts = COV.panel.map((p) => [p.la, p.lo])
  COV.ara.forEach((s) => pts.push([s.la, s.lo]))
  return L.latLngBounds(pts)
}

const dist = (km) => (km < 1 ? `${num(km * 1000, 0)} m` : `${num(km, 1)} km`)
const corte = () => COV.resumen.corte.toLowerCase()
const panelTip = (p, extra = '') =>
  `<b>${esc(p.n)}</b><br><span style="color:#56617d">${esc(p.cad)} · ${esc(p.ciu)} · cód. ${p.c}</span><br>` +
  (p.cub
    ? `<b style="color:${COV_COLORS.cub}">Cubierto por Harinera del Valle</b> · programado en ${esc(corte())}${p.ruta ? ` (${esc(p.ruta)})` : ''}`
    : `<b style="color:${COV_COLORS.nocub}">Sin cobertura de Harinera del Valle</b> · no programado en ${esc(corte())}`) + extra
const araTip = (s, extra = '') => `<b>${esc(s.n)}</b><br><span style="color:#56617d">${esc(s.cad)} · ${esc(s.dir)} · ${esc(s.mun)}</span>` + extra

export default function RouteMap({ routesSel, pdvSel, selDay, showNear, mode = 'rutas', cov = { cub: true, nocub: true, ara: true }, extent = 'cali', near = [], radiusKm = 1, focus = null }) {
  const el = useRef(null)
  const st = useRef({})

  useEffect(() => {
    const map = L.map(el.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true, zoomSnap: 0.25, zoomDelta: 0.5 })
    const claro = L.layerGroup([
      esri('Canvas/World_Light_Gray_Base', 'Mapa &copy; Esri'),
      esri('Canvas/World_Light_Gray_Reference', '', { pane: 'overlayPane' }),
    ])
    const calles = esri('World_Street_Map', 'Mapa &copy; Esri, HERE, Garmin, OpenStreetMap', { maxNativeZoom: 17 })
    const sat = esri('World_Imagery', 'Imágenes &copy; Esri, Maxar', { maxNativeZoom: 18 })
    claro.addTo(map)
    L.control.layers({ 'Mapa claro': claro, Calles: calles, Satélite: sat }, null, { position: 'topright' }).addTo(map)
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map)
    const zc = () => el.current && el.current.classList.toggle('z-low', map.getZoom() < 14)
    map.on('zoomend', zc)
    map.on('click', () => map.scrollWheelZoom.enable())
    map.on('mouseout', () => map.scrollWheelZoom.disable())
    st.current = {
      map, terr: L.layerGroup().addTo(map), near: L.layerGroup().addTo(map), path: L.layerGroup().addTo(map),
      pts: L.layerGroup().addTo(map), cov: L.layerGroup().addTo(map), canvas: L.canvas({ padding: 0.3 }), fit: null, mk: {},
    }
    const ro = new ResizeObserver(() => {
      map.invalidateSize()
      const f = st.current.fit
      if (f) map.fitBounds(f.b, f.o)
    })
    ro.observe(el.current)
    return () => { ro.disconnect(); map.remove() }
  }, [])

  useEffect(() => {
    const { map, terr, near: nearL, path, pts, cov: gCov, canvas } = st.current
    if (!map) return
    terr.clearLayers(); nearL.clearLayers(); path.clearLayers(); pts.clearLayers(); gCov.clearLayers()
    st.current.mk = {}
    const dot = (lat, lon, color, r) => L.circleMarker([lat, lon], { renderer: canvas, radius: r, color: '#fff', weight: 1.2, fillColor: color, fillOpacity: 0.95 })

    if (mode === 'cobertura') {
      // Un color por categoría: verde cubierto, rojo sin cobertura, naranja ARA / Dollarcity
      const order = [...COV.panel].sort((a, b) => a.cub - b.cub) // rojos debajo, verdes encima
      order.forEach((p) => {
        if (p.cub ? !cov.cub : !cov.nocub) return
        const m = dot(p.la, p.lo, p.cub ? COV_COLORS.cub : COV_COLORS.nocub, 6)
        const ruta = p.rp ? `<br><span style="color:#56617d">Está en la ruta propuesta ${esc(ROUTE[p.rp].name)}</span>` : ''
        m.bindTooltip(panelTip(p, ruta), { className: 'tt', direction: 'top', offset: [0, -6] })
        m.addTo(gCov)
      })
      if (cov.ara) {
        COV.ara.forEach((s) => {
          const m = dot(s.la, s.lo, COV_COLORS.ara, 5.5)
          m.bindTooltip(araTip(s), { className: 'tt', direction: 'top', offset: [0, -6] })
          m.addTo(gCov)
        })
      }
      st.current.fit = { b: covBounds(extent).pad(extent === "todo" ? 0.04 : 0), o: { maxZoom: 15 } }
      map.fitBounds(st.current.fit.b, { ...st.current.fit.o, animate: true })
      el.current.classList.toggle('z-low', map.getZoom() < 14)
      return
    }

    const rs = ROUTES.filter((r) => routesSel.includes(r.id))
    const maxH = Math.max(...ROUTES.flatMap((r) => r.pdvs.map((p) => p.prog * p.min)))

    if (mode === 'mixta') {
      // Rutas (figuras con su color) + PDV cercanos (círculos verde / rojo / naranja) + radio de cercanía
      const b = L.latLngBounds([])
      rs.forEach((r) => {
        L.polygon(r.territory, { color: r.color, weight: 1.2, opacity: 0.5, fillColor: r.color, fillOpacity: 0.04, dashArray: '5 5', interactive: false }).addTo(terr)
        r.pdvs.filter((p) => !pdvSel.size || pdvSel.has(p.code)).forEach((p) => {
          L.circle([p.lat, p.lon], { radius: radiusKm * 1000, color: r.color, weight: 1, opacity: 0.45, dashArray: '3 4', fillColor: r.color, fillOpacity: 0.035, interactive: false }).addTo(nearL)
          b.extend(L.latLng(p.lat, p.lon).toBounds(radiusKm * 2000))
        })
      })
      const rank = { nocub: 0, cub: 1, ara: 2 }
      const order = [...near].sort((a, b) => rank[a.kind] - rank[b.kind])
      order.forEach((x) => {
        if (!cov[x.kind]) return
        const m = dot(x.la, x.lo, COV_COLORS[x.kind], x.kind === 'ara' ? 5.5 : 6)
        const extra = `<br><span style="color:#56617d">A ${dist(x.km)} de ${esc(x.pdv.name)} (${esc(x.route.name)})</span>`
        m.bindTooltip(x.kind === 'ara' ? araTip(x.item, extra) : panelTip(x.item, extra), { className: 'tt', direction: 'top', offset: [0, -6] })
        m.addTo(gCov)
        st.current.mk[x.key] = m
      })
      rs.forEach((r) => r.pdvs.forEach((p) => {
        const sel = !pdvSel.size || pdvSel.has(p.code)
        const size = Math.round(11 + 9 * Math.sqrt((p.prog * p.min) / maxH))
        const icon = L.divIcon({ className: '', html: shapeSvg(r.shape, r.color, size, sel ? 1 : 0.28), iconSize: [size + 8, size + 8], iconAnchor: [(size + 8) / 2, (size + 8) / 2] })
        L.marker([p.lat, p.lon], { icon, zIndexOffset: sel ? 500 : -500, keyboard: false })
          .bindTooltip(`<b>${esc(p.name)}</b><br><span style="color:#56617d">Punto de la ${esc(r.name)} · cód. VUM ${p.code}</span><br>Visitas: <b>${p.prog}</b> de ${p.obj} · ${dur(p.min)} cada una`, { className: 'tt', direction: 'top', offset: [0, -size / 2] })
          .addTo(pts)
      }))
      if (b.isValid()) {
        st.current.fit = { b: b.pad(0.04), o: { maxZoom: 16 } }
        map.fitBounds(st.current.fit.b, { ...st.current.fit.o, animate: true })
      }
      el.current.classList.toggle('z-low', map.getZoom() < 14)
      return
    }

    const day = selDay && routesSel.includes(selDay.route) ? ROUTE[selDay.route].days.find((d) => d.fecha === selDay.fecha) : null
    const dayCodes = day ? day.stops : null

    rs.forEach((r) => {
      L.polygon(r.territory, { color: r.color, weight: 1.5, opacity: day && selDay.route !== r.id ? 0.25 : 0.7, fillColor: r.color, fillOpacity: day ? 0.04 : 0.08, dashArray: '5 5', interactive: false }).addTo(terr)
    })

    if (showNear && !day) {
      VECINOS.filter((v) => routesSel.includes(v.a) && routesSel.includes(v.b)).forEach((v) => {
        const a = PDV[v.pa], b = PDV[v.pb]
        const ln = L.polyline([[a.lat, a.lon], [b.lat, b.lon]], { color: '#0f1b3d', weight: 1.5, dashArray: '2 5', opacity: 0.8 }).addTo(nearL)
        ln.bindTooltip(v.km >= 1 ? `${num(v.km, 1)} km` : `${num(v.km * 1000, 0)} m`, { permanent: true, direction: 'center', className: 'dist' })
      })
    }

    const bounds = []
    rs.forEach((r) => r.pdvs.forEach((p) => {
      const sel = !pdvSel.size || pdvSel.has(p.code)
      const inDay = !dayCodes || dayCodes.includes(p.code)
      const faded = !sel || (day && !inDay)
      const h = p.prog * p.min
      const size = Math.round(13 + 15 * Math.sqrt(h / maxH))
      const icon = L.divIcon({ className: '', html: shapeSvg(r.shape, r.color, size, faded ? 0.28 : 1), iconSize: [size + 8, size + 8], iconAnchor: [(size + 8) / 2, (size + 8) / 2] })
      const sc = pdvSchedule(r.id, p.code)
      const m = L.marker([p.lat, p.lon], { icon, zIndexOffset: faded ? -500 : 0, keyboard: false })
      m.bindTooltip(
        `<b>${esc(p.name)}</b><br><span style="color:#56617d">${esc(r.name)} · cód. VUM ${p.code} · ${esc(p.mun)}</span><br>` +
        `Visitas: <b>${p.prog}</b> de ${p.obj}${p.extra ? ` (+${p.extra} el lun 30)` : ''} · ${dur(p.min)} cada una<br>` +
        `Horario más frecuente: ${sc.horario}<br><span style="color:#56617d">${esc(sc.dias)}</span>`,
        { className: 'tt', direction: 'top', offset: [0, -size / 2] }
      )
      m.addTo(pts)
      if (sel && !day) bounds.push([p.lat, p.lon])
    }))

    if (day) {
      const r = ROUTE[selDay.route]
      const ll = day.stops.map((c) => [PDV[c].lat, PDV[c].lon])
      if (ll.length > 1) {
        L.polyline(ll, { color: '#fff', weight: 7, opacity: 0.9 }).addTo(path)
        L.polyline(ll, { color: r.color, weight: 3.5, dashArray: '8 7', opacity: 1 }).addTo(path)
      }
      day.stops.forEach((c, i) => {
        const p = PDV[c]
        const icon = L.divIcon({ className: '', html: `<div class="pin" style="background:${r.color}">${i + 1}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] })
        L.marker([p.lat, p.lon], { icon, zIndexOffset: 1000 })
          .bindTooltip(`<b>${i + 1}. ${esc(p.name)}</b><br>${esc(r.name)} · ${dayLong(day.fecha)}`, { className: 'tt', direction: 'top', offset: [0, -14] })
          .addTo(path)
        bounds.push([p.lat, p.lon])
      })
    }
    if (bounds.length) {
      st.current.fit = { b: L.latLngBounds(bounds).pad(day ? 0.45 : 0.08), o: { maxZoom: day ? 15 : 14 } }
      map.fitBounds(st.current.fit.b, { ...st.current.fit.o, animate: true })
    }
    el.current.classList.toggle('z-low', map.getZoom() < 14)
  }, [routesSel, pdvSel, selDay, showNear, mode, cov.cub, cov.nocub, cov.ara, extent, near, radiusKm])

  // Ir a un PDV elegido en la lista de cercanos
  useEffect(() => {
    const { map, mk } = st.current
    if (!map || !focus) return
    const m = mk[focus.key]
    if (!m) return
    map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 16), { duration: 0.6 })
    map.once('moveend', () => m.openTooltip())
  }, [focus])

  const R = COV.resumen
  return (
    <div className="map-wrap">
      <div ref={el} className="map" role="region" aria-label={mode === 'cobertura' ? 'Mapa de cobertura del panel de Harinera del Valle' : mode === 'mixta' ? 'Mapa de rutas con los puntos de venta cercanos' : 'Mapa de rutas y puntos de venta'} />
      {mode === 'cobertura' ? (
        <div className="map-legend cov-leg">
          <span><i className="dot" style={{ background: COV_COLORS.cub, opacity: cov.cub ? 1 : 0.3 }} />Cubiertos por Harinera del Valle · {R.cub}</span>
          <span><i className="dot" style={{ background: COV_COLORS.nocub, opacity: cov.nocub ? 1 : 0.3 }} />Sin cobertura de Harinera del Valle · {R.nocub}</span>
          <span><i className="dot" style={{ background: COV_COLORS.ara, opacity: cov.ara ? 1 : 0.3 }} />ARA y Dollarcity · {R.ara + R.dollar}</span>
          <span style={{ color: '#8a93ab' }}>Panel HDV · {R.corte.toLowerCase()}</span>
        </div>
      ) : mode === 'mixta' ? (
        <div className="map-legend cov-leg">
          <span style={{ flexWrap: 'wrap' }}>
            {ROUTES.filter((r) => routesSel.includes(r.id)).map((r) => (
              <span key={r.id} style={{ marginRight: 6 }}><Shape shape={r.shape} color={r.color} size={11} />{r.name}</span>
            ))}
          </span>
          <span style={{ flexWrap: 'wrap' }}>
            <span style={{ marginRight: 6 }}><i className="dot" style={{ background: COV_COLORS.cub }} />Cubiertos HDV</span>
            <span style={{ marginRight: 6 }}><i className="dot" style={{ background: COV_COLORS.nocub }} />Sin cobertura</span>
            <span><i className="dot" style={{ background: COV_COLORS.ara }} />ARA y Dollarcity</span>
          </span>
          <span style={{ color: '#8a93ab' }}>Círculo punteado: {dist(radiusKm)} alrededor de cada punto de ruta</span>
        </div>
      ) : (
        <div className="map-legend">
          {ROUTES.filter((r) => routesSel.includes(r.id)).map((r) => (
            <span key={r.id}><Shape shape={r.shape} color={r.color} size={11} />{r.name} · {r.pdvs.length} PDV</span>
          ))}
          <span style={{ color: '#8a93ab' }}>Tamaño: horas de visita en el mes</span>
        </div>
      )}
    </div>
  )
}
