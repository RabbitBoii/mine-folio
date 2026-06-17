import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT  = 160
const BOUNDS = { x: [-16, 16], y: [0.4, 9], z: [-16, 4] }

// Soft round glow sprite so the points read as motes, not hard squares
function makeDotTexture() {
    const size = 64
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0,   'rgba(255,255,255,1)')
    g.addColorStop(0.35,'rgba(255,248,225,0.7)')
    g.addColorStop(1,   'rgba(255,248,225,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(c)
}

export default function Particles() {
    const pointsRef = useRef()
    const tex = useMemo(makeDotTexture, [])

    const { positions, data } = useMemo(() => {
        const positions = new Float32Array(COUNT * 3)
        const data = []
        for (let i = 0; i < COUNT; i++) {
            const x = THREE.MathUtils.randFloat(...BOUNDS.x)
            const y = THREE.MathUtils.randFloat(...BOUNDS.y)
            const z = THREE.MathUtils.randFloat(...BOUNDS.z)
            positions[i * 3]     = x
            positions[i * 3 + 1] = y
            positions[i * 3 + 2] = z
            data.push({
                baseX: x, baseZ: z,
                rise:      THREE.MathUtils.randFloat(0.05, 0.18), // upward drift
                swayAmp:   THREE.MathUtils.randFloat(0.2, 0.8),
                swaySpeed: THREE.MathUtils.randFloat(0.15, 0.5),
                phase:     Math.random() * Math.PI * 2,
            })
        }
        return { positions, data }
    }, [])

    useFrame((state, delta) => {
        if (!pointsRef.current) return
        const t = state.clock.elapsedTime
        const arr = pointsRef.current.geometry.attributes.position.array
        for (let i = 0; i < COUNT; i++) {
            const d = data[i]
            // gentle rise; wrap back to the bottom once it floats out the top
            let y = arr[i * 3 + 1] + d.rise * delta
            if (y > BOUNDS.y[1]) y = BOUNDS.y[0]
            arr[i * 3]     = d.baseX + Math.sin(t * d.swaySpeed + d.phase) * d.swayAmp
            arr[i * 3 + 1] = y
            arr[i * 3 + 2] = d.baseZ + Math.cos(t * d.swaySpeed * 0.8 + d.phase) * d.swayAmp * 0.6
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true
    })

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={COUNT}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                map={tex}
                size={0.16}
                sizeAttenuation
                transparent
                depthWrite={false}
                opacity={0.7}
                color="#fff2cc"
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}
