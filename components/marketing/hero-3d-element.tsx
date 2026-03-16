"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, MeshTransmissionMaterial } from "@react-three/drei"
import * as THREE from "three"

function GlassShape() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.1
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15
    }
  })

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} scale={1.8}>
        <icosahedronGeometry args={[1, 0]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.5}
          chromaticAberration={1}
          anisotropy={0.1}
          distortion={0.5}
          distortionScale={0.5}
          temporalDistortion={0.1}
          color="#818cf8"
        />
      </mesh>
      
      {/* Inner glowing core */}
      <mesh scale={0.8}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#4f46e5" wireframe />
      </mesh>
    </Float>
  )
}

export function Hero3DElement() {
  return (
    <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none hidden lg:block opacity-70">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <GlassShape />
      </Canvas>
    </div>
  )
}
