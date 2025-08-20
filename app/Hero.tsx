"use client";
import FaultyTerminal from './components/FaultyTerminal/FaultyTerminal';

export default function Hero() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      // zIndex: -1
    }}>
      <FaultyTerminal
        scale={2}
        gridMul={[1, 1]}
        digitSize={2}
        timeScale={0.5}
        pause={false}
        scanlineIntensity={1}
        glitchAmount={10}
        flickerAmount={10}
        noiseAmp={1}
        chromaticAberration={10}
        dither={0}
        curvature={0.1}
        tint="#ffffff"
        mouseReact={true}
        mouseStrength={0.5}
        pageLoadAnimation={false}
        brightness={0.25}
      />
    </div>
  );
}