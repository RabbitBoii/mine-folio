import { Html } from '@react-three/drei'

// Shared Minecraft signpost (sign-1.png board + post). Pass board content as
// children; leave empty for a blank sign. Same size/style everywhere.
export default function Signboard({ position = [0, 0, 0], rotation = [0, 0, 0], children }) {
    return (
        <group position={position} rotation={rotation}>
            <Html
                position={[0, 0.85, 0]}
                center
                transform
                scale={0.085}
                occlude={false}
                style={{ pointerEvents: 'none' }}
            >
                {/* Rendered at 3× pixel density (then scaled down) so text stays crisp on zoom */}
                <div style={{ position: 'relative', width: '660px', userSelect: 'none' }}>
                    <img
                        src="/textures/sign-1.png"
                        alt=""
                        style={{ width: '100%', display: 'block', imageRendering: 'pixelated' }}
                    />

                    {/* Content sits over the board portion (top ~46% of the image) */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: '46%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '0 48px',
                        fontFamily: "'Minecraft', monospace",
                        color: '#3a2410',
                    }}>
                        {children}
                    </div>
                </div>
            </Html>
        </group>
    )
}
