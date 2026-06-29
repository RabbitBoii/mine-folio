import { useMemo, useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { NearestFilter, NearestMipmapLinearFilter } from 'three'
import { useTexture } from '@react-three/drei'

function pixelate(tex) {
    tex.magFilter = NearestFilter            // crisp pixels up close
    // Mipmaps fix the washed-out look on distant hills: instead of point-sampling
    // (which favours the lighter texels and brightens the distance), the blocks
    // far away render the true averaged green — matching the foreground ground.
    tex.minFilter = NearestMipmapLinearFilter
    tex.generateMipmaps = true
    tex.needsUpdate = true
    return tex
}

// Load every block texture once, share across the scene
function useBlockTextures() {
    const [log, leaves, stone, dirt, grassTop, grassSide] = useTexture([
        '/textures/oak_log.png',
        '/textures/oak-leaves.png',
        '/textures/stone.png',
        '/textures/dirt.png',
        '/textures/Grass.png',
        '/textures/grass_block_side.png',
    ])
    return {
        log: pixelate(log),
        leaves: pixelate(leaves),
        stone: pixelate(stone),
        dirt: pixelate(dirt),
        grassTop: pixelate(grassTop),
        grassSide: pixelate(grassSide),
    }
}

const TRUNK_H = 5

// Classic oak canopy: wide bottom, tapering to a small top
function buildCanopy() {
    const blocks = []
    const add = (x, y, z) => blocks.push([x, y + 0.5, z])
    for (const y of [3, 4]) {
        for (let x = -2; x <= 2; x++) {
            for (let z = -2; z <= 2; z++) {
                if (Math.abs(x) === 2 && Math.abs(z) === 2) continue
                add(x, y, z)
            }
        }
    }
    for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) add(x, 5, z)
    }
    add(0, 6, 0)
    add(1, 6, 0); add(-1, 6, 0); add(0, 6, 1); add(0, 6, -1)
    return blocks
}

function OakTree({ position, tex, scale = 1 }) {
    const leafBlocks = useMemo(buildCanopy, [])
    return (
        <group position={position} scale={scale}>
            {Array.from({ length: TRUNK_H }).map((_, y) => (
                <mesh key={y} position={[0, y + 0.5, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial map={tex.log} />
                </mesh>
            ))}
            {leafBlocks.map(([lx, ly, lz], i) => (
                <mesh key={i} position={[lx, ly, lz]} castShadow>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial map={tex.leaves} />
                </mesh>
            ))}
        </group>
    )
}

// Renders a list of cube positions as a single InstancedMesh (cheap)
function InstancedCubes({ positions, material, castShadow = false }) {
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

    if (positions.length === 0) return null
    return (
        <instancedMesh
            ref={ref}
            args={[geo, material, positions.length]}
            castShadow={castShadow}
            receiveShadow
        />
    )
}

// Solid blocky terrain — grass-capped hills with a dirt band over stone.
// Only the exposed surface shell is generated (interior culled) for perf.
function Terrain({ tex }) {
    // Materials — built once. BoxGeometry face order: +x,-x,+y,-y,+z,-z
    const { grassMats, dirtMat, stoneMat } = useMemo(() => {
        const grassTop = new THREE.MeshStandardMaterial({ map: tex.grassTop })
        const grassSide = new THREE.MeshStandardMaterial({ map: tex.grassSide })
        const dirt = new THREE.MeshStandardMaterial({ map: tex.dirt })
        const stone = new THREE.MeshStandardMaterial({ map: tex.stone })
        return {
            grassMats: [grassSide, grassSide, grassTop, dirt, grassSide, grassSide],
            dirtMat: dirt,
            stoneMat: stone,
        }
    }, [tex])

    // Heightmap → exposed-block lists per material layer
    const { grass, dirt, stone } = useMemo(() => {
        const X0 = -20, X1 = 20, Z0 = -8, Z1 = -30

        // deterministic pseudo-random in [0,1) from a coordinate pair
        const rand = (x, z) => {
            const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453
            return s - Math.floor(s)
        }

        const heightAt = (x, z) => {
            if (x < X0 || x > X1 || z > Z0 || z < Z1) return 0  // outside = ground level
            const dist = -z - (-Z0)                              // 0 at front, grows back
            let h = 1
                + dist * 0.4
                + 1.6 * Math.sin(x * 0.4) * Math.cos(z * 0.35)
                + 0.9 * Math.sin(x * 0.85 + z * 0.5)
            return Math.max(1, Math.min(Math.round(h), 10))
        }

        const grass = [], dirt = [], stone = []
        for (let x = X0; x <= X1; x++) {
            for (let z = Z0; z >= Z1; z--) {
                const h = heightAt(x, z)
                const hN = [heightAt(x + 1, z), heightAt(x - 1, z), heightAt(x, z + 1), heightAt(x, z - 1)]

                const r = rand(x, z)
                const dirtTop = r < 0.16                              // ~16% bare-dirt tops
                const dirtBand = Math.floor(rand(x + 99, z - 99) * 4) // 0..3 dirt thickness

                for (let y = 0; y < h; y++) {
                    const top = y === h - 1
                    const exposed = top || hN.some((nh) => nh <= y)
                    if (!exposed) continue
                    const pos = [x, y + 0.5, z]
                    const depth = h - 1 - y
                    if (top) {
                        (dirtTop ? dirt : grass).push(pos)   // top is grass OR dirt, never stone
                    } else if (depth <= dirtBand) {
                        dirt.push(pos)
                    } else {
                        stone.push(pos)                       // stone shows on lower / steep faces
                    }
                }
            }
        }
        return { grass, dirt, stone }
    }, [])

    return (
        <group>
            <InstancedCubes positions={grass} material={grassMats} />
            <InstancedCubes positions={dirt} material={dirtMat} />
            <InstancedCubes positions={stone} material={stoneMat} />
        </group>
    )
}

export default function Environment() {
    const tex = useBlockTextures()

    // Trees — [x, y, z, scale]. Pushed to the sides/back; foreground kept open
    // and spacious so the signs/chest/Steve have room to breathe.
    const trees = [
        [-6, 0, -6,  1.1],
        [6,  0, -6,  1.1],
        [-9, 0, -4,  1.2],
        [9,  0, -5,  1.2],
        [9.5, 0, -2.5, 1.2],  // behind the about sign — fills the empty right side
        [12,  0, -10, 1.3],
    ]

    return (
        <group>
            <Terrain tex={tex} />
            {trees.map(([x, y, z, scale], i) => (
                <OakTree key={i} position={[x, y, z]} tex={tex} scale={scale} />
            ))}
        </group>
    )
}
