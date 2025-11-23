import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Grid, RoundedBox, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function StatusIcon({ isVerified }: { isVerified: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);

  // User Icon Shape (Head + Body)
  const userShape = useMemo(() => {
    const s = new THREE.Shape();
    // Body (Arc)
    s.absarc(0, -0.2, 0.25, 0, Math.PI, true);
    s.lineTo(0.25, -0.2);
    s.lineTo(-0.25, -0.2);
    return s;
  }, []);

  const headShape = useMemo(() => {
     const s = new THREE.Shape();
     s.absarc(0, 0.15, 0.12, 0, Math.PI * 2, false);
     return s;
  }, []);

  // Checkmark Shape
  const checkShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.18, 0.02);
    s.quadraticCurveTo(-0.05, -0.12, -0.02, -0.12);
    s.quadraticCurveTo(0.22, 0.18, 0.25, 0.22);
    s.quadraticCurveTo(0.22, 0.25, 0.18, 0.22);
    s.lineTo(-0.05, -0.02);
    s.lineTo(-0.22, 0.08);
    s.quadraticCurveTo(-0.25, 0.05, -0.18, 0.02);
    return s;
  }, []);

  const userBodyGeo = useMemo(() => new THREE.ExtrudeGeometry(userShape, { depth: 0.01, bevelEnabled: false }), [userShape]);
  const userHeadGeo = useMemo(() => new THREE.ExtrudeGeometry(headShape, { depth: 0.01, bevelEnabled: false }), [headShape]);
  const checkGeo = useMemo(() => new THREE.ExtrudeGeometry(checkShape, { depth: 0.02, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 5 }), [checkShape]);

  useFrame(() => {
    if (!groupRef.current) return;
  });

  return (
    // Positioned slightly above card surface (Card surface is at Z ~ 0.01)
    // Card thickness is 0.02, so half is 0.01. We put this at 0.02 to sit on top.
    <group ref={groupRef} position={[0, 0, 0.02]}>

      {/* Blue State: User Icon */}
      <group scale={isVerified ? 0 : 1} visible={!isVerified}>
        <mesh geometry={userHeadGeo} material-color="#ffffff" />
        <mesh geometry={userBodyGeo} material-color="#ffffff" />
      </group>

      {/* Green State: Circular Checkmark */}
      <group scale={isVerified ? 1 : 0} visible={isVerified}>
         {/* The Ring Circle */}
        <mesh position={[0, 0, 0]}>
            <torusGeometry args={[0.4, 0.04, 16, 48]} />
            <meshStandardMaterial color="#f0fdf4" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Checkmark */}
        <mesh geometry={checkGeo} position={[0, -0.02, 0]}>
            <meshStandardMaterial color="#f0fdf4" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Glow */}
        <pointLight color="#14b8a6" intensity={1.5} distance={2} />
      </group>

    </group>
  );
}

function RotatingGroup({ isVerified }: { isVerified: boolean }) {
    const groupRef = useRef<THREE.Group>(null!);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null!);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        const targetRotX = -state.pointer.y * 0.5;
        const targetRotY = state.pointer.x * 0.5;

        if (groupRef.current) {
             groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX + Math.cos(time * 0.5) * 0.05, 0.1);
             groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY + Math.sin(time * 0.3) * 0.05, 0.1);
        }

        if (materialRef.current) {
            const pendingColor = new THREE.Color("#38bdf8");
            const verifiedColor = new THREE.Color("#2dd4bf");
            const targetColor = isVerified ? verifiedColor : pendingColor;

            materialRef.current.color.lerp(targetColor, 0.03);
            materialRef.current.emissive.lerp(targetColor, 0.03);
        }
    });

    return (
        <group ref={groupRef}>
            <RoundedBox args={[3.2, 2.0, 0.02]} radius={0.1} smoothness={8}>
                <meshStandardMaterial
                ref={materialRef}
                color="#38bdf8"
                emissive="#38bdf8"
                emissiveIntensity={0.4}
                roughness={0.3}
                metalness={0.1}
                />
            </RoundedBox>
            <StatusIcon isVerified={isVerified} />
        </group>
    )
}


export function IdentityScanner() {
  return (
    <div className="glass-panel-pro" style={{ width: "100%", height: "500px", position: "relative", overflow: "hidden" }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 35 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />

        <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
             {/* State management needs to be lifted or shared */}
             <SceneContent />
        </Float>

        <Grid
          position={[0, -2.5, 0]}
          args={[10, 10]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#cbd5e1"
          sectionSize={2.5}
          sectionThickness={1}
          sectionColor="#94a3b8"
          fadeDistance={10}
          fadeStrength={1.5}
        />
      </Canvas>

      <div style={{
        position: "absolute",
        bottom: "2rem",
        left: "0",
        right: "0",
        textAlign: "center",
        pointerEvents: "none"
      }}>
        <div className="status-badge-large" style={{ display: "inline-flex", background: "rgba(255,255,255,0.9)" }}>
          <span className="status-dot" style={{ animation: "pulse 2s infinite" }}></span>
          <span>Verification Status</span>
        </div>
      </div>
    </div>
  );
}

function SceneContent() {
    const [isVerified, setVerified] = useState(false);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        const cycle = 6;
        const t = time % cycle;
        setVerified(t > 3.0 && t < 5.5);
    });

    return (
        <>
            <RotatingGroup isVerified={isVerified} />
            {isVerified && (
                <Sparkles
                count={25}
                scale={4}
                size={3}
                speed={0.3}
                opacity={0.5}
                color="#ccfbf1"
                />
            )}
        </>
    )
}
