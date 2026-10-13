import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { ROUTES, ROUTE, PDV, VECINOS, pdvSchedule } from '../lib/data'
import { shapeSvg, Shape } from './Shape'
import { dur, num, dayLong } from '../lib/format'

const esri = (svc, attr, opts = {}) =>
  L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/${svc}/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 19, maxNativeZoom: 16, attribution: attr, ...opts })

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export default function RouteMap({ routesSel, pdvSel, selDay, showNear }) {
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
    st.current = { map, terr: L.layerGroup().addTo(map), near: L.layerGroup().addTo(map), path: L.layerGroup().addTo(map), pts: L.layerGroup().addTo(map), fit: null }
    const ro = new ResizeObserver(() => {
      map.invalidateSize()
      const f = st.current.fit
      if (f) map.fitBounds(f.b, f.o)
    })
    ro.observe(el.current)
    return () => { ro.disconnect(); map.remove() }
  }, [])

  useEffect(() => {
    const { map, terr, near, path, pts } = st.current
    if (!map) return
    terr.clearLayers(); near.clearLayers(); path.clearLayers(); pts.clearLayers()
    const rs = ROUTES.filter((r) => routesSel.includes(r.id))
    const day = selDay && routesSel.includes(selDay.route) ? ROUTE[selDay.route].days.find((d) => d.fecha === selDay.fecha) : null
    const dayCodes = day ? day.stops : null
    const maxH = Math.max(...ROUTES.flatMap((r) => r.pdvs.map((p) => p.prog * p.min)))

    rs.forEach((r) => {
      L.polygon(r.territory, { color: r.color, weight: 1.5, opacity: day && day && selDay.route !== r.id ? 0.25 : 0.7, fillColor: r.color, fillOpacity: day ? 0.04 : 0.08, dashArray: '5 5', interactive: false }).addTo(terr)
    })

    if (showNear && !day) {
      VECINOS.filter((v) => routesSel.includes(v.a) && routesSel.includes(v.b)).forEach((v) => {
        const a = PDV[v.pa], b = PDV[v.pb]
        const ln = L.polyline([[a.lat, a.lon], [b.lat, b.lon]], { color: '#0f1b3d', weight: 1.5, dashArray: '2 5', opacity: 0.8 }).addTo(near)
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
      if (sel && (!day)) bounds.push([p.lat, p.lon])
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
  }, [routesSel, pdvSel, selDay, showNear])

  return (
    <div className="map-wrap">
      <div ref={el} className="map" role="region" aria-label="Mapa de rutas y puntos de venta" />
      <div className="map-legend">
        {ROUTES.filter((r) => routesSel.includes(r.id)).map((r) => (
          <span key={r.id}><Shape shape={r.shape} color={r.color} size={11} />{r.name} · {r.pdvs.length} PDV</span>
        ))}
        <span style={{ color: '#8a93ab' }}>Tamaño: horas de visita en el mes</span>
      </div>
    </div>
  )
}
