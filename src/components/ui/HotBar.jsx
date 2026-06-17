import { useState } from 'react'

const SLOTS = [
    { id: 0, label: 'Home',       icon: '🏠' },
    { id: 1, label: 'About',      icon: '📖' },
    { id: 2, label: 'Skills',     icon: '⚔️' },
    { id: 3, label: 'Experience', icon: '🏆' },
    { id: 4, label: 'Projects',   icon: '🔨' },
    { id: 5, label: 'Contact',    icon: '✉️' },
]

// Hotbar.png: 182×22px native (9 slots × 20px + 1px borders)
// 3.5× scale → 637×77px  — sits between "too small" 3× and "too big" 4.5×
const SCALE    = 3.5
const BAR_W    = Math.round(182 * SCALE)   // 637px
const BAR_H    = Math.round(22  * SCALE)   // 77px
const SLOT_W   = Math.round(20  * SCALE)   // 70px
const BORDER   = Math.round(1   * SCALE)   // 4px outer border

export default function Hotbar() {
    const [active, setActive] = useState(0)

    return (
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
            style={{
                width:            `${BAR_W}px`,
                height:           `${BAR_H}px`,
                backgroundImage:  "url('/textures/Hotbar.png')",
                backgroundSize:   `${BAR_W}px ${BAR_H}px`,
                backgroundRepeat: 'no-repeat',
                imageRendering:   'pixelated',
            }}
        >
            {SLOTS.map((slot) => {
                const isActive = active === slot.id
                const slotLeft = BORDER + slot.id * SLOT_W

                return (
                    <div
                        key={slot.id}
                        onClick={() => setActive(slot.id)}
                        className="absolute flex items-center justify-center cursor-pointer select-none"
                        style={{
                            left:   `${slotLeft}px`,
                            top:    `${BORDER}px`,
                            width:  `${SLOT_W}px`,
                            height: `${SLOT_W}px`,
                        }}
                    >
                        {/* Active slot: the MC "hotbar_selection" sprite — a bevelled
                            light frame overhanging the slot (white top-left → grey
                            bottom-right), seated with a faint dark outer pixel. */}
                        {isActive && (
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    inset: '-4px',                 // overhang the slot like the real sprite
                                    borderStyle: 'solid',
                                    borderWidth: '4px',
                                    borderTopColor: '#ffffff',
                                    borderLeftColor: '#ffffff',
                                    borderRightColor: '#a7a7a7',
                                    borderBottomColor: '#a7a7a7',
                                    boxSizing: 'border-box',
                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.45)',
                                    imageRendering: 'pixelated',
                                    zIndex: 2,
                                }}
                            />
                        )}

                        {/* Icon */}
                        <span
                            style={{
                                fontSize:   `${SLOT_W * 0.63}px`,
                                lineHeight:  1,
                                transform:   isActive ? 'scale(1.1)' : 'scale(1)',
                                filter:      isActive ? 'brightness(1.15)' : 'brightness(0.85)',
                                transition:  'transform 0.1s, filter 0.1s',
                                userSelect:  'none',
                                display:     'block',
                            }}
                        >
                            {slot.icon}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}