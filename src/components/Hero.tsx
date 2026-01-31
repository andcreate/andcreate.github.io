import LightRays from "./LightRays";

export default function Hero() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "#000",
      }}
    >
      <LightRays
        raysOrigin="top-right"
        raysColor="#ffffff"
        raysSpeed={1.1}
        lightSpread={3}
        rayLength={5}
        pulsating={false}
        fadeDistance={2.7}
        saturation={2}
        followMouse={false}
        mouseInfluence={1}
        noiseAmount={0.2}
        distortion={0}
      />
    </div>
  );
}
