"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, MeshDistortMaterial, Stars, Sphere, Line } from "@react-three/drei"
import * as THREE from "three"

function NeuralNetwork() {
  const groupRef = useRef<THREE.Group>(null)
  
  // Create random points for the neural network
  const points = useMemo(() => {
    const pts = []
    for (let i = 0; i < 60; i++) {
      pts.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        )
      )
    }
    return pts
  }, [])

  // Create lines connecting close points
  const lines = useMemo(() => {
    const lns = []
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        if (points[i].distanceTo(points[j]) < 3.5) {
          lns.push([points[i], points[j]])
        }
      }
    }
    return lns
  }, [points])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05
      groupRef.current.rotation.x = state.clock.getElapsedTime() * 0.02
    }
  })

  return (
    <group ref={groupRef}>
      {points.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#818cf8" transparent opacity={0.6} />
        </mesh>
      ))}
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line}
          color="#4f46e5"
          lineWidth={1}
          transparent
          opacity={0.15}
        />
      ))}
    </group>
  )
}

function AbstractCore() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1.5, 64, 64]} scale={1.2}>
        <MeshDistortMaterial
          color="#4f46e5"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          wireframe={true}
        />
      </Sphere>
    </Float>
  )
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 z-[-1] bg-black overflow-hidden pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* The central AI core */}
        <AbstractCore />
        
        {/* The surrounding neural network */}
        <NeuralNetwork />
        
        {/* Deep space stars */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      </Canvas>
      
      {/* Gradient overlay to blend with the UI */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] pointer-events-none opacity-80" />
    </div>
  )
}
