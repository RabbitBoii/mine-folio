import { useState, useEffect } from 'react'

// MC colours: join/system messages are yellow, chat is white, the <name> grey.
const MC_YELLOW = '#ffff55'
const MC_GREY   = '#aaaaaa'

const LINES = [
    { prefix: '',  text: 'Chetan Atram joined the game', color: MC_YELLOW },
    { prefix: '>', text: 'Full Stack Developer @ IIT Roorkee', color: '#ffffff' },
    { prefix: '>', text: 'React · Next.js · Node · AI', color: '#ffffff' },
]

function useTypewriter(text, speed = 40, startDelay = 0) {
    const [displayed, setDisplayed] = useState('')
    const [done, setDone] = useState(false)

    useEffect(() => {
        setDisplayed('')
        setDone(false)
        let i = 0
        const timeout = setTimeout(() => {
            const interval = setInterval(() => {
                setDisplayed(text.slice(0, i + 1))
                i++
                if (i >= text.length) {
                    clearInterval(interval)
                    setDone(true)
                }
            }, speed)
            return () => clearInterval(interval)
        }, startDelay)

        return () => clearTimeout(timeout)
    }, [text, speed, startDelay])

    return { displayed, done }
}

function ChatLine({ prefix, text, color = '#ffffff', delay, onDone }) {
    const { displayed, done } = useTypewriter(text, 35, delay)

    useEffect(() => {
        if (done && onDone) onDone()
    }, [done])

    if (!displayed && delay > 0) return null

    // MC chat glyphs cast a dark drop-shadow offset down-right
    const mcShadow = '2px 2px 0 rgba(0,0,0,0.55)'

    return (
        <div className="flex gap-2 leading-relaxed">
            {prefix && (
                <span style={{ color: MC_GREY, fontFamily: "'Minecraft', monospace", fontSize: '20px', textShadow: mcShadow }}>
                    {prefix}
                </span>
            )}
            <span style={{ fontFamily: "'Minecraft', monospace", fontSize: '20px', color, textShadow: mcShadow }}>
                {displayed}
                {!done && <span className="animate-pulse">▌</span>}
            </span>
        </div>
    )
}

export default function ChatIntro() {
    const [lineIndex, setLineIndex] = useState(0)

    return (
        <div
            className="fixed bottom-20 left-4 flex flex-col gap-1 z-50"
            style={{
                maxWidth: '500px',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '6px 10px',
                letterSpacing: '1.2px',
                lineHeight: '1.6',
            }}
        >
            {LINES.map((line, i) => (
                i <= lineIndex && (
                    <ChatLine
                        key={i}
                        prefix={line.prefix}
                        text={line.text}
                        color={line.color}
                        delay={i === 0 ? 500 : 0}
                        onDone={() => {
                            if (i === lineIndex && lineIndex < LINES.length - 1) {
                                setTimeout(() => setLineIndex(i + 1), 400)
                            }
                        }}
                    />
                )
            ))}
        </div>
    )
}