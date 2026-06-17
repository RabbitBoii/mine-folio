import { useState, useEffect } from 'react'

const MC = "'Minecraft', monospace"

export default function LoadingScreen() {
    const [pct, setPct] = useState(0)
    const [done, setDone] = useState(false)    // bar full → start fade
    const [hidden, setHidden] = useState(false) // fully removed after fade

    useEffect(() => {
        const start = performance.now()
        let raf
        const tick = (now) => {
            const e = now - start
            // step in chunks of 5% for that crunchy MC feel
            setPct(Math.min(100, Math.floor((e / 3000) * 20) * 5))
            if (e < 3000) {
                raf = requestAnimationFrame(tick)
            } else {
                setPct(100)
                setDone(true)
                setTimeout(() => setHidden(true), 650)
            }
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [])

    if (hidden) return null

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 100,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#000',
                backgroundImage: "url('/textures/dirt.png')",
                backgroundSize: '64px 64px',
                imageRendering: 'pixelated',
                opacity: done ? 0 : 1,
                transition: 'opacity 0.65s ease',
                pointerEvents: done ? 'none' : 'auto',
            }}
        >
            {/* Dark wash over the dirt — like MC's menu background */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />

            <div style={{ position: 'relative', textAlign: 'center' }}>
                {/* Percentage */}
                <div style={{
                    fontFamily: MC, color: '#ffffff', fontSize: '26px',
                    textShadow: '2px 2px 0 #000', marginBottom: '18px',
                }}>
                    {pct}%
                </div>

                {/* The classic filling box: grey frame → green border → white fill */}
                <div style={{
                    width: '180px', height: '180px',
                    background: '#aaaaaa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    imageRendering: 'pixelated',
                }}>
                    <div style={{
                        width: '132px', height: '132px',
                        border: '6px solid #57a64a',           // Minecraft green
                        boxSizing: 'border-box',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <div style={{
                            width: `${pct}%`, height: `${pct}%`,
                            background: '#f2f2f2',
                        }} />
                    </div>
                </div>
            </div>
        </div>
    )
}
