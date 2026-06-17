import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

// openRef: a shared { v: 0..1 } ref the scroll timeline drives.
// v = how open the lid is. The baked "open" clip is sampled at v * duration.
export default function Chest({ position = [0, 0, 0], scale = 1, rotation = [0, 0, 0], openRef }) {
    const group = useRef()
    const { scene, animations } = useGLTF('/models/chest.glb')
    const { actions, mixer } = useAnimations(animations, group)

    const openAction  = useRef(null)
    const durationRef = useRef(0)
    const audio       = useRef(null)
    const soundArmed  = useRef(true)   // re-arms when chest closes again

    useEffect(() => {
        const open = actions['open']
        if (open) {
            open.setLoop(THREE.LoopOnce, 1)
            open.clampWhenFinished = true
            open.play()
            open.paused = true          // we scrub it manually — don't let it auto-advance
            openAction.current = open
            durationRef.current = open.getClip().duration
        }
        audio.current = new Audio('/sounds/chest.mp3')
        audio.current.volume = 0.55
    }, [actions])

    // Runs after drei's internal mixer.update(delta); because the action is
    // paused, that update just samples the pose at whatever time we set here.
    useFrame(() => {
        const v = openRef?.current?.v ?? 0
        const open = openAction.current

        if (open) {
            open.time = Math.min(Math.max(v, 0), 1) * durationRef.current
            mixer.update(0)             // apply the new pose immediately
        }

        // Play the creak once as it starts opening; re-arm after it closes
        if (v > 0.04 && soundArmed.current) {
            audio.current?.play().catch(() => {})
            soundArmed.current = false
        } else if (v < 0.02) {
            soundArmed.current = true
        }
    })

    return (
        <primitive ref={group} object={scene} position={position} scale={scale} rotation={rotation} />
    )
}

useGLTF.preload('/models/chest.glb')
