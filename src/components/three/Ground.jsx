import { useRef } from 'react'
import { RepeatWrapping, NearestFilter, NearestMipmapLinearFilter } from 'three'
import { useTexture } from '@react-three/drei'

export default function Ground() {
    const meshRef = useRef()

    const grassTexture = useTexture('/textures/Grass.png')

    // This is what makes it look pixelated like Minecraft
    // instead of blurry — NearestFilter is key
    grassTexture.magFilter = NearestFilter
    grassTexture.minFilter = NearestMipmapLinearFilter  // match terrain — true green at distance
    grassTexture.generateMipmaps = true
    grassTexture.wrapS = RepeatWrapping
    grassTexture.wrapT = RepeatWrapping
    // 1 tile per world unit — matches the 1×1 grass-block tops in Terrain
    // so the flat ground and the hills read as the exact same green
    grassTexture.repeat.set(60, 60)

    return (
        <mesh
            ref={meshRef}
            rotation={[-Math.PI / 2, 0, 0]}  // flat on the ground
            position={[0, -0.01, 0]}          // tiny offset to avoid z-fighting
            receiveShadow
        >
            <planeGeometry args={[60, 60]} />
            <meshStandardMaterial map={grassTexture} />
        </mesh>
    )
}