import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, RoundedBox, Octahedron } from '@react-three/drei'
import type { Mesh } from 'three'

/** A floating crate representing an inventory/shipment package. */
function Crate({ position, size, speed }: { position: [number, number, number]; size: number; speed: number }) {
  const ref = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * speed * 0.15
      ref.current.rotation.y += delta * speed * 0.1
    }
  })

  return (
    <Float speed={speed} rotationIntensity={0.3} floatIntensity={1.6}>
      <RoundedBox ref={ref} args={[size, size, size]} radius={size * 0.12} smoothness={4} position={position}>
        <meshStandardMaterial color="#ffffff" transparent opacity={0.85} roughness={0.25} metalness={0.1} />
      </RoundedBox>
    </Float>
  )
}

/** A subtle accent shape suggesting the AI/insight layer. */
function AccentShape({ position, speed }: { position: [number, number, number]; speed: number }) {
  return (
    <Float speed={speed} rotationIntensity={0.6} floatIntensity={1.2}>
      <Octahedron args={[0.45, 0]} position={position}>
        <meshStandardMaterial color="#ffffff" transparent opacity={0.55} roughness={0.1} metalness={0.3} wireframe />
      </Octahedron>
    </Float>
  )
}

export function AuthHero3D() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 42 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 4, 3]} intensity={1.4} />
      <directionalLight position={[-3, -2, -2]} intensity={0.5} />
      <Crate position={[-1.3, 0.5, 0]} size={1.1} speed={1} />
      <Crate position={[1.2, -0.4, -1]} size={0.75} speed={1.3} />
      <Crate position={[0.3, 1.3, -2]} size={0.55} speed={0.9} />
      <AccentShape position={[1.6, 1.1, -1.5]} speed={1.6} />
      <AccentShape position={[-1.7, -0.9, -0.5]} speed={1.2} />
    </Canvas>
  )
}
