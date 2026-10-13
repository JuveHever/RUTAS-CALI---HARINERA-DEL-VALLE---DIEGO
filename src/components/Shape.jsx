/** Forma de cada ruta: segundo canal de identidad además del color. */
export function shapePath(shape, s) {
  const h = s / 2
  switch (shape) {
    case 'square': return `M${-h * 0.85},${-h * 0.85}h${h * 1.7}v${h * 1.7}h${-h * 1.7}z`
    case 'diamond': return `M0,${-h * 1.1}L${h * 1.1},0L0,${h * 1.1}L${-h * 1.1},0z`
    case 'triangle': return `M0,${-h * 1.1}L${h * 1.05},${h * 0.8}L${-h * 1.05},${h * 0.8}z`
    default: return `M${h},0A${h},${h} 0 1,1 ${-h},0A${h},${h} 0 1,1 ${h},0z`
  }
}

export function Shape({ shape, color, size = 12, ring = false }) {
  const pad = 3
  const box = size + pad * 2
  return (
    <svg width={box} height={box} viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`} aria-hidden="true" style={{ flex: 'none' }}>
      <path d={shapePath(shape, size)} fill={color} stroke={ring ? '#fff' : 'none'} strokeWidth={ring ? 2 : 0} />
    </svg>
  )
}

export function shapeSvg(shape, color, size, opacity = 1) {
  const box = size + 8
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}" viewBox="${-box / 2} ${-box / 2} ${box} ${box}"><path d="${shapePath(shape, size)}" fill="${color}" fill-opacity="${opacity}" stroke="#fff" stroke-width="2"/></svg>`
}
