import { createContext, useContext, useState, useCallback } from 'react'

const Ctx = createContext(null)

export function TooltipProvider({ children }) {
  const [tip, setTip] = useState(null)
  const show = useCallback((e, content) => {
    const x = e.clientX, y = e.clientY
    setTip({ x, y, content })
  }, [])
  const hide = useCallback(() => setTip(null), [])
  let style = null
  if (tip) {
    const w = 290
    const left = tip.x + 16 + w > window.innerWidth ? tip.x - w - 12 : tip.x + 16
    style = { left, top: Math.min(tip.y + 14, window.innerHeight - 140) }
  }
  return (
    <Ctx.Provider value={{ show, hide }}>
      {children}
      {tip && <div className="tip" style={style} role="tooltip">{tip.content}</div>}
    </Ctx.Provider>
  )
}
export const useTip = () => useContext(Ctx)
