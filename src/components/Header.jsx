import { useEffect, useRef, useState } from 'react'
import { ROUTES, ROUTE } from '../lib/data'
import { Shape } from './Shape'

const SECTIONS = [
  ['resumen', 'Resumen'], ['mapa', 'Mapa'], ['calendario', 'Tiempo libre'], ['agenda', 'Agenda'],
  ['cumplimiento', 'Cumplimiento'], ['pdv', 'Puntos de venta'], ['hallazgos', 'Hallazgos'],
]

function PdvPicker({ routesSel, pdvSel, setPdvSel }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)
  useEffect(() => {
    const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const k = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', f); document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', f); document.removeEventListener('keydown', k) }
  }, [])
  const toggle = (code) => {
    const n = new Set(pdvSel)
    n.has(code) ? n.delete(code) : n.add(code)
    setPdvSel(n)
  }
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const label = pdvSel.size === 0 ? 'Todos los puntos de venta' : pdvSel.size === 1 ? [...pdvSel].map((c) => ROUTES.flatMap((r) => r.pdvs).find((p) => p.code === c)?.name)[0] : `${pdvSel.size} puntos de venta`
  return (
    <div className="picker" ref={ref}>
      <button className="chip picker-btn" aria-pressed={pdvSel.size > 0} aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{label}</span><span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="picker-pop" role="dialog" aria-label="Filtrar puntos de venta">
          <input type="search" id="buscar-pdv" placeholder="Buscar punto de venta o código" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          {ROUTES.filter((r) => routesSel.includes(r.id)).map((r) => {
            const items = r.pdvs.filter((p) => !q || norm(p.name).includes(norm(q)) || String(p.code).includes(q))
            if (!items.length) return null
            return (
              <div key={r.id}>
                <div className="picker-group"><Shape shape={r.shape} color={r.color} size={9} />{r.name}</div>
                {items.map((p) => (
                  <label className="picker-item" key={p.code}>
                    <input type="checkbox" id={'pdv-' + p.code} checked={pdvSel.has(p.code)} onChange={() => toggle(p.code)} />
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            )
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button className="btn-ghost" disabled={!pdvSel.size} onClick={() => setPdvSel(new Set())}>Quitar selección</button>
            <button className="btn-ghost" onClick={() => setOpen(false)}>Listo</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Header({ routesSel, setRoutesSel, pdvSel, setPdvSel, onHome }) {
  const toggleRoute = (id) => {
    // con todas activas, un clic deja solo esa ruta; después cada clic suma o quita
    let n = routesSel.length === ROUTES.length ? [id]
      : routesSel.includes(id) ? routesSel.filter((x) => x !== id) : [...routesSel, id]
    if (!n.length) n = ROUTES.map((r) => r.id)
    n = ROUTES.map((r) => r.id).filter((x) => n.includes(x))
    setRoutesSel(n)
    // quitar PDV de rutas no seleccionadas
    const keep = new Set([...pdvSel].filter((c) => n.some((rid) => ROUTE[rid].pdvs.some((p) => p.code === c))))
    if (keep.size !== pdvSel.size) setPdvSel(keep)
  }
  const allOn = routesSel.length === ROUTES.length
  const filtered = !allOn || pdvSel.size > 0
  return (
    <header className="topbar">
      <div className="topbar-row">
        <img className="topbar-logo" src="/hv-logo.png" alt="Harinera del Valle" onClick={onHome} />
        <div className="topbar-title"><b>Rutas propuesta Cali</b><span>Noviembre 2026 · 4 rutas</span></div>
        <nav className="nav" aria-label="Secciones">
          {SECTIONS.map(([id, t]) => <a key={id} href={'#' + id}>{t}</a>)}
          <a href="#portada" onClick={(e) => { e.preventDefault(); onHome() }}>Portada</a>
        </nav>
      </div>
      <div className="filters">
        <span className="filters-label">Ruta</span>
        <button className="chip" aria-pressed={allOn} onClick={() => setRoutesSel(ROUTES.map((r) => r.id))}>Todas</button>
        {ROUTES.map((r) => (
          <button key={r.id} className="chip" aria-pressed={!allOn && routesSel.includes(r.id)} data-on={routesSel.includes(r.id)} onClick={() => toggleRoute(r.id)}>
            <Shape shape={r.shape} color={r.color} size={11} />{r.name}
          </button>
        ))}
        <span className="chip-sep" />
        <span className="filters-label">Punto de venta</span>
        <PdvPicker routesSel={routesSel} pdvSel={pdvSel} setPdvSel={setPdvSel} />
        <button className="btn-ghost" disabled={!filtered} onClick={() => { setRoutesSel(ROUTES.map((r) => r.id)); setPdvSel(new Set()) }}>Limpiar filtros</button>
      </div>
    </header>
  )
}
