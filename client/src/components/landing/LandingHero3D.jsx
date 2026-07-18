import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

const COIN_HEIGHT = 0.052;
const COIN_RADIUS = 0.4;
const COIN_SEGMENTS = 56;

/** Single coin: thin cylinder — reads as a metallic disc / rupee-style stack */
function Coin({ position, rotationY, variant = 'gold' }) {
  const isGold = variant === 'gold';
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_HEIGHT, COIN_SEGMENTS]} />
      <meshStandardMaterial
        color={isGold ? '#e8c547' : '#d1dae6'}
        metalness={isGold ? 0.93 : 0.9}
        roughness={isGold ? 0.2 : 0.26}
        envMapIntensity={1.2}
      />
    </mesh>
  );
}

/** Main tower + small side stack — reads as money / coins, not stone */
function MoneyStackScene() {
  const groupRef = useRef(null);

  const mainStack = useMemo(() => {
    const count = 11;
    const gap = 0.004;
    const totalH = count * (COIN_HEIGHT + gap);
    const startY = -totalH / 2 + COIN_HEIGHT / 2;
    return Array.from({ length: count }, (_, i) => ({
      key: `m-${i}`,
      position: [0, startY + i * (COIN_HEIGHT + gap), 0],
      rotationY: i * 0.31 + (i % 3) * 0.08,
      variant: i === 3 || i === 7 ? 'silver' : 'gold',
    }));
  }, []);

  const sideStack = useMemo(() => {
    const count = 4;
    const gap = 0.004;
    const totalH = count * (COIN_HEIGHT + gap);
    const startY = -totalH / 2 + COIN_HEIGHT / 2;
    const offsetX = 0.72;
    const offsetZ = 0.15;
    return Array.from({ length: count }, (_, i) => ({
      key: `s-${i}`,
      position: [offsetX, startY + i * (COIN_HEIGHT + gap), offsetZ],
      rotationY: -i * 0.25 + 0.5,
      variant: 'gold',
    }));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.18;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 6]} intensity={1.15} castShadow color="#fff8e7" />
      <directionalLight position={[-4, 2, -5]} intensity={0.45} color="#a5d4ff" />
      <pointLight position={[3, -2, 4]} intensity={0.55} color="#ffd966" />
      <pointLight position={[-3, 1, 2]} intensity={0.35} color="#c4b5fd" />

      {mainStack.map(({ key, position, rotationY, variant }) => (
        <Coin key={key} position={position} rotationY={rotationY} variant={variant} />
      ))}
      {sideStack.map(({ key, position, rotationY, variant }) => (
        <Coin key={key} position={position} rotationY={rotationY} variant={variant} />
      ))}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.65}
        maxPolarAngle={Math.PI / 1.65}
        minPolarAngle={Math.PI / 3.2}
      />
    </group>
  );
}

export default function LandingHero3D() {
  return (
    <div className="relative h-[min(340px,48vh)] w-full min-h-[240px] touch-none overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1222] via-slate-900 to-amber-950/40 shadow-[0_0_60px_rgba(234,179,8,0.12)] ring-1 ring-amber-500/25">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_40%_25%,rgba(251,191,36,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_70%,rgba(34,211,238,0.08),transparent_50%)]" />
      <Canvas
        className="!absolute inset-0"
        camera={{ position: [0, 0.35, 3.5], fov: 40 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
          <MoneyStackScene />
        </Suspense>
      </Canvas>
      <p className="pointer-events-none absolute bottom-4 left-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/85">
        3D coin stack · Drag to orbit
      </p>
    </div>
  );
}
