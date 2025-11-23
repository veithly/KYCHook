import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Icosahedron, Float } from "@react-three/drei";
import * as THREE from "three";

function NetworkMesh() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.05;
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group>
      {/* Outer large network */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
        <Icosahedron args={[12, 2]} ref={meshRef}>
          <meshBasicMaterial
            color="#93c5fd" // primary-300
            wireframe
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </Icosahedron>
      </Float>

      {/* Inner denser network */}
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.4}>
        <Icosahedron args={[8, 4]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial
            color="#3b82f6" // primary-500
            wireframe
            transparent
            opacity={0.05}
            side={THREE.DoubleSide}
          />
        </Icosahedron>
      </Float>
    </group>
  );
}

export function ThreeBackground() {
  return (
    <div className="three-bg-container" style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: -1,
      pointerEvents: "none",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
    }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <fog attach="fog" args={['#f8fafc', 5, 25]} />
        <NetworkMesh />
      </Canvas>
    </div>
  );
}
