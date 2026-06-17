import { useState } from 'react'

// One category per chest row (each fits in 9 columns)
const CATEGORIES = [
    { name: 'Languages', color: '#6cab3f', items: ['TypeScript', 'JavaScript', 'Python', 'C++', 'SQL', 'HTML', 'CSS'] },
    { name: 'Frontend',  color: '#4aa3d4', items: ['React.js', 'Next.js', 'Tailwind CSS', 'Shadcn UI'] },
    { name: 'Backend',   color: '#c98b3a', items: ['Node.js', 'Express.js', 'FastAPI', 'Prisma', 'tRPC'] },
    { name: 'AI / LLM',  color: '#a86cd4', items: ['LangChain', 'ChromaDB', 'Pinecone', 'Ollama', 'Groq', 'RAG Pipelines', 'Vector Embeddings'] },
    { name: 'Databases', color: '#54b39b', items: ['MongoDB', 'SQLite', 'Firebase'] },
    { name: 'Tools',     color: '#bd5b5b', items: ['Git', 'GitHub'] },
]

const COLS = 9
const SLOT = 42

// 2-char placeholder until real item icons are dropped in
const abbr = (s) => {
    const caps = s.replace(/[^A-Z+]/g, '')
    if (caps.length >= 2) return caps.slice(0, 2)
    return s.replace(/[^A-Za-z]/g, '').slice(0, 2)
}

const MC = "'Minecraft', monospace"

// Sunken inventory slot (dark top-left, light bottom-right)
const slotStyle = {
    width: SLOT, height: SLOT,
    background: '#8b8b8b',
    borderTop: '2px solid #373737',
    borderLeft: '2px solid #373737',
    borderRight: '2px solid #ffffff',
    borderBottom: '2px solid #ffffff',
    boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
}

function Slot({ skill, color, onHover }) {
    const [hot, setHot] = useState(false)
    if (!skill) return <div style={slotStyle} />
    return (
        <div
            style={slotStyle}
            onMouseEnter={(e) => { setHot(true); onHover(skill, e) }}
            onMouseMove={(e) => onHover(skill, e)}
            onMouseLeave={() => { setHot(false); onHover(null) }}
        >
            {/* placeholder item tile — swap for <img> once icons exist */}
            <div style={{
                width: SLOT - 12, height: SLOT - 12,
                background: color,
                boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.35), inset 2px 2px 0 rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: MC, fontSize: 17, color: '#ffffff',
                textShadow: '1.5px 1.5px 0 rgba(0,0,0,0.55)',
            }}>
                {abbr(skill)}
            </div>
            {hot && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
            )}
        </div>
    )
}

function Row({ items, color, onHover }) {
    const slots = Array.from({ length: COLS }, (_, i) => items[i] || null)
    return (
        <div style={{ display: 'flex', gap: 2 }}>
            {slots.map((s, i) => <Slot key={i} skill={s} color={color} onHover={onHover} />)}
        </div>
    )
}

function EmptyGrid({ rows }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} style={{ display: 'flex', gap: 2 }}>
                    {Array.from({ length: COLS }).map((_, c) => <div key={c} style={slotStyle} />)}
                </div>
            ))}
        </div>
    )
}

const label = { fontFamily: MC, color: '#404040', fontSize: 22, letterSpacing: 1, textShadow: '1px 1px 0 rgba(255,255,255,0.4)' }

export default function ChestGUI({ reveal = 0 }) {
    const [tip, setTip] = useState(null) // { name, category, x, y }

    const onHover = (skill, e) => {
        if (!skill) return setTip(null)
        const cat = CATEGORIES.find((c) => c.items.includes(skill))
        setTip({ name: skill, category: cat?.name, x: e.clientX, y: e.clientY })
    }

    if (reveal <= 0.001) return null

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 60,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: reveal,
                pointerEvents: reveal > 0.9 ? 'auto' : 'none',
                background: `rgba(0,0,0,${0.55 * reveal})`,
            }}
        >
            <div style={{
                transform: `scale(${0.9 + 0.1 * reveal})`,
                // MC GUI panel: raised bevel (light top-left, dark bottom-right)
                background: '#c6c6c6',
                borderTop: '4px solid #ffffff',
                borderLeft: '4px solid #ffffff',
                borderRight: '4px solid #555555',
                borderBottom: '4px solid #555555',
                padding: '14px 16px',
                imageRendering: 'pixelated',
            }}>
                <div style={{ ...label, marginBottom: 8 }}>Skills</div>

                {/* Chest — one row per category */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {CATEGORIES.map((c) => (
                        <Row key={c.name} items={c.items} color={c.color} onHover={onHover} />
                    ))}
                </div>

                {/* Player inventory (decorative, like the real chest screen) */}
                <div style={{ ...label, margin: '14px 0 8px' }}>Inventory</div>
                <EmptyGrid rows={3} />
                <div style={{ height: 8 }} />
                <EmptyGrid rows={1} />
            </div>

            {/* MC-style hover tooltip */}
            {tip && (
                <div style={{
                    position: 'fixed', left: tip.x + 14, top: tip.y + 14,
                    background: '#100010', border: '2px solid #28007f',
                    padding: '4px 8px', pointerEvents: 'none',
                    fontFamily: MC, lineHeight: 1.4,
                }}>
                    <div style={{ color: '#ffffff', fontSize: 17, textShadow: '1.5px 1.5px 0 #3f3f3f' }}>{tip.name}</div>
                    {tip.category && (
                        <div style={{ color: '#a0a0a0', fontSize: 14, textShadow: '1.5px 1.5px 0 #3f3f3f' }}>{tip.category}</div>
                    )}
                </div>
            )}
        </div>
    )
}
