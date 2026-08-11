import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import type { Mesh } from 'three'
import { useTheme } from '@/theme/ThemeProvider'

function Blob({ position, color, speed }: { position: [number, number, number]; color: string; speed: number }) {
  const ref = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.x += delta * speed * 0.2
  })

  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={1.2}>
      <mesh ref={ref} position={position}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial color={color} distort={0.35} speed={1.5} roughness={0.2} metalness={0.4} />
      </mesh>
    </Float>
  )
}

export function CommandCenterHero3D() {
  const { resolvedTheme } = useTheme()
  const colors = useMemo(
    () => (resolvedTheme === 'dark' ? ['#818cf8', '#22d3ee', '#a78bfa'] : ['#4f46e5', '#0891b2', '#7c3aed']),
    [resolvedTheme],
  )

  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 3, 3]} intensity={1.2} />
      <Blob position={[-1.4, 0.4, 0]} color={colors[0]!} speed={1} />
      <Blob position={[1.3, -0.3, -1]} color={colors[1]!} speed={1.4} />
      <Blob position={[0.2, 1, -2]} color={colors[2]!} speed={0.8} />
    </Canvas>
  )
}
