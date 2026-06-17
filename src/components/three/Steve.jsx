import { useRef, useEffect, forwardRef } from 'react'
import { useGLTF, useAnimations, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import Nametag from '../ui/Nametag'

const Steve = forwardRef(function Steve({ position = [0, 0, 0] }, externalRef) {
    const internalRef = useRef()
    const group = externalRef ?? internalRef
    const { scene, animations } = useGLTF('/models/steve.glb')
    const { actions } = useAnimations(animations, group)

    const hovered  = useRef(false)
    const mode     = useRef('idle')        // current anim mode
    const prevXZ   = useRef({ x: position[0], z: position[2] })
    const lastMove = useRef(-10)           // last time Steve was moving

    // Crossfade helper
    const setMode = (next) => {
        const idle = actions['Skeleton|Idle']
        const walk = actions['Skeleton|Walking']
        if (!idle || !walk || mode.current === next) return
        mode.current = next
        if (next === 'walk') {
            idle.fadeOut(0.25)
            walk.reset().fadeIn(0.25).play()
        } else {
            walk.fadeOut(0.25)
            idle.reset().fadeIn(0.25).play()
        }
    }

    useEffect(() => {
        actions['Skeleton|Idle']?.reset().fadeIn(0.3).play()
    }, [actions])

    useFrame((state, delta) => {
        if (!group.current) return
        const t = state.clock.elapsedTime

        // Detect horizontal movement (timeline moves x/z; bob owns y)
        const { x, z } = group.current.position
        const dx = x - prevXZ.current.x
        const dz = z - prevXZ.current.z
        prevXZ.current.x = x
        prevXZ.current.z = z
        const speed = Math.hypot(dx, dz) / Math.max(delta, 1e-3)
        if (speed > 0.08) lastMove.current = t

        // Walk while moving (or hovered), with a short grace window so micro-pauses
        // during scroll-scrub don't flicker the animation
        const movingRecently = t - lastMove.current < 0.15
        setMode(movingRecently || hovered.current ? 'walk' : 'idle')

        // Subtle floating bob
        group.current.position.y = Math.sin(t * 0.8) * 0.05
    })

    return (
        <group ref={group} position={position}>
            <primitive
                object={scene}
                scale={1.3}
                castShadow
                onPointerEnter={() => { hovered.current = true }}
                onPointerLeave={() => { hovered.current = false }}
            />

            {/* Nametag floats above Steve in 3D space */}
            <Html
                position={[0, 2.8, 0]}
                center
                distanceFactor={8}
                occlude={false}
            >
                <Nametag />
            </Html>
        </group>
    )
})

export default Steve

// Preload so there's no pop-in on first render
useGLTF.preload('/models/steve.glb')
