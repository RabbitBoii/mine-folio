import Signboard from './Signboard'

export default function AboutSign({ position = [7, 0, -1.5], rotation }) {
    return (
        <Signboard position={position} rotation={rotation}>
            <div style={{ fontSize: '38px', fontWeight: 'bold', letterSpacing: '2px' }}>
                Chetan Atram
            </div>
            <div style={{ fontSize: '20px', color: '#5a3a16', marginTop: '4px' }}>
                IIT Roorkee — Mathematics &amp; Computing
            </div>
            <div style={{ borderTop: '3px solid rgba(90,58,22,0.5)', margin: '14px 24px' }} />
            <div style={{ fontSize: '21px', lineHeight: '1.5' }}>
                Building full-stack products and teaching
                <br />myself to think in systems — React, Next.js,
                <br />Node, and increasingly, AI under the hood.
            </div>
        </Signboard>
    )
}
