import { useMemo, useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { NearestFilter, NearestMipmapLinearFilter } from 'three'
import { useTexture } from '@react-three/drei'

function pixelate(tex) {
    tex.magFilter = NearestFilter
    tex.minFilter = NearestMipmapLinearFilter
    tex.generateMipmaps = true
    tex.needsUpdate = true
    return tex
}

// One InstancedMesh for a list of unit-cube positions sharing a material
function Blocks({ positions, material, transparent = false }) {
    const ref = useRef()
    const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])

    useLayoutEffect(() => {
        if (!ref.current) return
        const m = new THREE.Matrix4()
        positions.forEach((p, i) => {
            m.makeTranslation(p[0], p[1], p[2])
            ref.current.setMatrixAt(i, m)
        })
        ref.current.instanceMatrix.needsUpdate = true
    }, [positions])

    if (!positions.length) return null
    return (
        <instancedMesh
            ref={ref}
            args={[geo, material, positions.length]}
            castShadow
            receiveShadow={!transparent}
        />
    )
}

const R = 3            // half-extent → 7×7 footprint
const WALL_Y = [3, 4, 5, 6]

// Build the cabin block layout once (local coords; front = +Z is left open)
function buildCabin() {
    const stonebrick = [], planks = [], log = [], glass = [], spruce = []

    // Foundation (2 layers) + floor
    for (let x = -R; x <= R; x++) {
        for (let z = -R; z <= R; z++) {
            stonebrick.push([x, 0, z], [x, 1, z])
            planks.push([x, 2, z])               // floor
        }
    }

    const isCorner = (x, z) => Math.abs(x) === R && Math.abs(z) === R
    // window cut-outs at eye level (left, right, back walls)
    const windows = new Set([`${-R},4,0`, `${R},4,0`, `0,4,${-R}`])

    for (const y of WALL_Y) {
        for (let x = -R; x <= R; x++) {
            for (let z = -R; z <= R; z++) {
                const onPerim = Math.abs(x) === R || Math.abs(z) === R
                if (!onPerim) continue
                if (isCorner(x, z)) { log.push([x, y, z]); continue } // corner posts (incl. front)
                if (z === R) continue                                 // open front
                if (windows.has(`${x},${y},${z}`)) { glass.push([x, y, z]); continue }
                planks.push([x, y, z])
            }
        }
    }

    // Stepped hip roof (overhanging eave → peak)
    const roof = [[R + 1, 7], [R, 8], [R - 1, 9], [R - 2, 10], [0, 11]]
    for (const [he, y] of roof) {
        for (let x = -he; x <= he; x++) {
            for (let z = -he; z <= he; z++) spruce.push([x, y, z])
        }
    }

    return { stonebrick, planks, log, glass, spruce }
}

export default function Cabin({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
    const [planksT, spruceT, brickT, logT, glassT] = useTexture([
        '/textures/oak-planks.png',
        '/textures/spruce-planks.png',
        '/textures/stone-bricks.png',
        '/textures/oak_log.png',
        '/textures/Glass_Pane.png',
    ])

    const mats = useMemo(() => ({
        planks: new THREE.MeshStandardMaterial({ map: pixelate(planksT) }),
        spruce: new THREE.MeshStandardMaterial({ map: pixelate(spruceT) }),
        brick:  new THREE.MeshStandardMaterial({ map: pixelate(brickT) }),
        log:    new THREE.MeshStandardMaterial({ map: pixelate(logT) }),
        glass:  new THREE.MeshStandardMaterial({
            map: pixelate(glassT), transparent: true, alphaTest: 0.1, opacity: 0.85,
        }),
    }), [planksT, spruceT, brickT, logT, glassT])

    const blocks = useMemo(buildCabin, [])

    return (
        <group position={position} rotation={rotation}>
            <Blocks positions={blocks.stonebrick} material={mats.brick} />
            <Blocks positions={blocks.planks}     material={mats.planks} />
            <Blocks positions={blocks.log}        material={mats.log} />
            <Blocks positions={blocks.spruce}     material={mats.spruce} />
            <Blocks positions={blocks.glass}      material={mats.glass} transparent />
        </group>
    )
}
