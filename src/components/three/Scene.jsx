import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Sky } from '@react-three/drei'
import { Suspense, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Ground from './Ground'
import Steve from './Steve'
import Environment from './Environment'
import AboutSign from './AboutSign'
import Signboard from './Signboard'
import Chest from './Chest'
import Particles from './Particles'

gsap.registerPlugin(ScrollTrigger)

// Y-rotation so an object's +Z face (model/sign front) points from `from` → `to`
const faceY = (from, to) => Math.atan2(to[0] - from[0], to[2] - from[2])

const STEVE_HOME = [0, 0, 0]

// About sign sits to the right, between the trees — faces Steve
const SIGN_POS = [7, 0, -1.5]
const SIGN_ROT = faceY(SIGN_POS, STEVE_HOME)

// Experience boards on the left (placeholder content for now) — each faces Steve
const EXP_SIGNS = [
    { pos: [-7.5, 0, -1],  rotY: faceY([-7.5, 0, -1],  STEVE_HOME), title: 'Projects' },
    { pos: [-3.8, 0, 0.2], rotY: faceY([-3.8, 0, 0.2], STEVE_HOME), title: 'Experience' },
]

// Chest sits to Steve's right, mid-depth; Steve walks to just in front of it
const CHEST_POS     = [2.8, 0, -2.8]
const STEVE_WALK_TO = { x: 1.5, z: -1.8 }
// +PI because the model's opening is on its -Z face
const CHEST_ROT_Y   = faceY(CHEST_POS, [STEVE_WALK_TO.x, 0, STEVE_WALK_TO.z]) + Math.PI

// Steve facing: 0 = toward camera, +PI/2 = the sign, then turns to the chest
const STEVE_ROT_START = 0
const STEVE_ROT_SIGN  = faceY(STEVE_HOME, SIGN_POS)
const STEVE_ROT_CHEST = faceY([STEVE_WALK_TO.x, 0, STEVE_WALK_TO.z], CHEST_POS)

// Camera keyframes
const CAM_START   = { x: 0,    y: 1,    z: 5    }
const CAM_PAN     = { x: 2.5,  y: 1.6,  z: 4    }   // panning right toward sign
const CAM_SIGN    = { x: 5.44, y: 1.55, z: -1.17 } // head-on, on Steve's side of the sign
const CAM_CHEST   = { x: 0.6,  y: 2.1,  z: 1.4  }   // 3/4 view of Steve at the chest

const CAM_EXP     = { x: -2.4, y: 1.5,  z: 1.0  }   // in front of the exp board (Steve behind cam)

const TARGET_START = { x: 0,    y: 1,    z: 0    }
const TARGET_PAN   = { x: 3.5,  y: 1.4,  z: -0.5 }
const TARGET_SIGN  = { x: 7,    y: 1.45, z: -1.5 }
const TARGET_CHEST = { x: 2.2,  y: 1.0,  z: -2.6 }
const TARGET_EXP   = { x: -3.8, y: 1.4,  z: 0.2  }  // nearer experience board, head-on

// After the skills, Steve walks back home and faces the experience boards (on his right)
const STEVE_ROT_EXP = faceY(STEVE_HOME, [-3.8, 0, 0.2])

function SceneInner({ onSkillsReveal }) {
    const { camera } = useThree()
    const controlsRef = useRef()
    const steveRef    = useRef()
    const setupDone   = useRef(false)
    const chestOpen   = useRef({ v: 0 })          // shared with <Chest>
    const lastReveal  = useRef(0)

    // Wait until all refs are populated (Steve loads async via Suspense)
    useFrame(() => {
        if (setupDone.current) return
        if (!steveRef.current || !controlsRef.current) return
        setupDone.current = true

        // Ensure camera starts at the right spot
        camera.position.set(CAM_START.x, CAM_START.y, CAM_START.z)
        controlsRef.current.target.set(TARGET_START.x, TARGET_START.y, TARGET_START.z)
        controlsRef.current.update()

        // Proxy objects GSAP can tween freely
        const camPos    = { ...CAM_START }
        const targetPos = { ...TARGET_START }
        const steveRot  = { y: STEVE_ROT_START }
        const stevePos  = { x: 0, z: 0 }
        const reveal    = { v: 0 }

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger:  '#scroll-container',
                start:    'top top',
                end:      'bottom bottom',
                scrub:    1.8,
            },
            onUpdate() {
                camera.position.set(camPos.x, camPos.y, camPos.z)
                controlsRef.current.target.set(targetPos.x, targetPos.y, targetPos.z)
                controlsRef.current.update()
                steveRef.current.rotation.y = steveRot.y
                steveRef.current.position.x = stevePos.x
                steveRef.current.position.z = stevePos.z
                // Throttle React state updates for the GUI overlay (but always
                // snap to the 0 / 1 extremes so it fully clears or fully shows)
                const atExtreme = reveal.v <= 0.001 || reveal.v >= 0.999
                if (atExtreme ? lastReveal.current !== reveal.v
                              : Math.abs(reveal.v - lastReveal.current) > 0.015) {
                    lastReveal.current = reveal.v
                    onSkillsReveal(reveal.v)
                }
            },
        })

        // ── Sign beat ───────────────────────────────────────────────
        tl.to(steveRot, { y: STEVE_ROT_SIGN, duration: 0.10, ease: 'power2.inOut' }, 0)
        tl.to(camPos,    { ...CAM_PAN,    duration: 0.12, ease: 'power1.inOut' }, 0.04)
        tl.to(targetPos, { ...TARGET_PAN, duration: 0.12, ease: 'power1.inOut' }, 0.04)
        tl.to(camPos,    { ...CAM_SIGN,   duration: 0.11, ease: 'power2.inOut' }, 0.15)
        tl.to(targetPos, { ...TARGET_SIGN, duration: 0.11, ease: 'power2.inOut' }, 0.15)
        // (0.26 – 0.32) hold so the bio can be read

        // ── Transition to the chest ─────────────────────────────────
        tl.to(steveRot, { y: STEVE_ROT_CHEST, duration: 0.10, ease: 'power2.inOut' }, 0.32)
        tl.to(camPos,    { ...CAM_CHEST,    duration: 0.20, ease: 'power1.inOut' }, 0.32)
        tl.to(targetPos, { ...TARGET_CHEST, duration: 0.20, ease: 'power1.inOut' }, 0.32)
        tl.to(stevePos, { ...STEVE_WALK_TO, duration: 0.14, ease: 'none' }, 0.42)

        // ── Chest opens + skills reveal ─────────────────────────────
        tl.to(chestOpen.current, { v: 1, duration: 0.08, ease: 'power2.out' }, 0.56)
        tl.to(reveal,            { v: 1, duration: 0.06, ease: 'power1.inOut' }, 0.64)
        // (0.70 – 0.76) hold — skills fully visible to read

        // ── Skills fade + chest closes; Steve heads home ────────────
        tl.to(reveal,            { v: 0, duration: 0.06, ease: 'power1.in' }, 0.76)
        tl.to(chestOpen.current, { v: 0, duration: 0.06, ease: 'power2.in' }, 0.76)
        // Steve turns toward the experience boards and walks back home
        tl.to(steveRot, { y: STEVE_ROT_EXP, duration: 0.14, ease: 'power2.inOut' }, 0.76)
        tl.to(stevePos, { x: 0, z: 0,       duration: 0.12, ease: 'none' }, 0.78)

        // ── Experience beat — camera eases back + rotates to the boards
        //    in step with the walk-back (no last-second snap) ────────
        tl.to(camPos,    { ...CAM_EXP,    duration: 0.18, ease: 'power2.inOut' }, 0.78)
        tl.to(targetPos, { ...TARGET_EXP, duration: 0.18, ease: 'power2.inOut' }, 0.78)
    })

    useEffect(() => {
        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill())
            // Allow the timeline to rebuild after Fast Refresh / remount
            // (otherwise the one-time setup guard blocks it and scroll dies)
            setupDone.current = false
        }
    }, [])

    return (
        <>
            {/* Soft fill so shadows never go pitch-black */}
            <ambientLight intensity={0.5} />

            {/* Sky/ground bounce — natural outdoor light that evens out the
                green between the lit foreground and the distant hills */}
            <hemisphereLight args={['#cfe8ff', '#6b9d4a', 0.55]} />

            {/* Sun — single shadow caster, tuned for clean soft shadows */}
            <directionalLight
                position={[14, 20, 8]}
                intensity={1.1}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0005}
                shadow-normalBias={0.04}
                shadow-radius={4}
                shadow-camera-near={1}
                shadow-camera-far={70}
                shadow-camera-left={-25}
                shadow-camera-right={25}
                shadow-camera-top={25}
                shadow-camera-bottom={-25}
            />

            <Sky
                sunPosition={[2, 0.15, -5]}
                turbidity={10}
                rayleigh={2}
                mieCoefficient={0.005}
                mieDirectionalG={0.8}
            />

            <Suspense fallback={null}>
                <Steve ref={steveRef} position={[0, 0, 0]} />
            </Suspense>

            <Ground />

            {/* Ambient floating motes for atmosphere */}
            <Particles />

            <Suspense fallback={null}>
                <Environment />
            </Suspense>

            <Suspense fallback={null}>
                <AboutSign position={SIGN_POS} rotation={[0, SIGN_ROT, 0]} />
            </Suspense>

            {/* Experience boards on the left — placeholder bullets for now */}
            {EXP_SIGNS.map((s, i) => (
                <Signboard key={i} position={s.pos} rotation={[0, s.rotY, 0]}>
                    <div style={{ fontSize: '30px', fontWeight: 'bold' }}>{s.title}</div>
                    <div style={{ borderTop: '3px solid rgba(90,58,22,0.5)', margin: '10px 22px' }} />
                    <div style={{ fontSize: '19px', lineHeight: '1.7' }}>
                        • Coming soon<br />• Coming soon<br />• Coming soon
                    </div>
                </Signboard>
            ))}

            <Suspense fallback={null}>
                <Chest position={CHEST_POS} scale={1} rotation={[0, CHEST_ROT_Y, 0]} openRef={chestOpen} />
            </Suspense>

            <OrbitControls
                ref={controlsRef}
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 2}
                maxAzimuthAngle={Math.PI / 4}
            />
        </>
    )
}

export default function Scene({ onSkillsReveal = () => {} }) {
    return (
        <div className="fixed inset-0">
            <Canvas
                shadows="soft"
                camera={{
                    position: [CAM_START.x, CAM_START.y, CAM_START.z],
                    fov: 80,
                    near: 0.1,
                    far: 1000,
                }}
            >
                <SceneInner onSkillsReveal={onSkillsReveal} />
            </Canvas>
        </div>
    )
}
