import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, Image } from '@react-three/drei';
import { FoliageMaterial } from './TreeMaterials';

interface GrandTreeProps {
  isFormed: boolean;
  greetings: string[];
}

const TREE_HEIGHT = 18;
const TREE_RADIUS = 7;
const PARTICLE_COUNT = 6000;
const ORNAMENT_COUNT = 150;
const POLAROID_COUNT = 12;

export const GrandTree: React.FC<GrandTreeProps> = ({ isFormed, greetings }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // -- Geometry Generation --
  const { positions, chaosPositions, randoms, ornamentData, polaroidData } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const chaos = new Float32Array(PARTICLE_COUNT * 3);
    const rands = new Float32Array(PARTICLE_COUNT);

    // Needles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Target: Cone shape
      const y = Math.random() * TREE_HEIGHT; // 0 to Height
      const radiusAtY = (1 - y / TREE_HEIGHT) * TREE_RADIUS;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radiusAtY; // Fill volume
      
      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y - TREE_HEIGHT / 2 + 2; // Center vertically
      pos[i * 3 + 2] = z;

      // Chaos: Sphere cloud
      const cx = (Math.random() - 0.5) * 30;
      const cy = (Math.random() - 0.5) * 30;
      const cz = (Math.random() - 0.5) * 30;

      chaos[i * 3] = cx;
      chaos[i * 3 + 1] = cy;
      chaos[i * 3 + 2] = cz;

      rands[i] = Math.random();
    }

    // Ornaments (Golden Balls)
    const oData = [];
    for (let i = 0; i < ORNAMENT_COUNT; i++) {
        const y = Math.random() * TREE_HEIGHT;
        // Surface only
        const radiusAtY = (1 - y / TREE_HEIGHT) * TREE_RADIUS * 0.9; 
        const angle = Math.random() * Math.PI * 2;
        
        oData.push({
            target: new THREE.Vector3(
                radiusAtY * Math.cos(angle),
                y - TREE_HEIGHT / 2 + 2,
                radiusAtY * Math.sin(angle)
            ),
            chaos: new THREE.Vector3(
                (Math.random() - 0.5) * 35,
                (Math.random() - 0.5) * 35,
                (Math.random() - 0.5) * 35
            ),
            color: Math.random() > 0.7 ? '#FF0000' : '#FFD700' // Red or Gold
        });
    }

    // Polaroids
    const pData = [];
    for (let i = 0; i < POLAROID_COUNT; i++) {
         const y = Math.random() * (TREE_HEIGHT * 0.7) + 2; // Lower 70%
         const radiusAtY = (1 - y / TREE_HEIGHT) * TREE_RADIUS * 1.1; // Float slightly outside
         const angle = (i / POLAROID_COUNT) * Math.PI * 2;
         
         pData.push({
            target: new THREE.Vector3(
                radiusAtY * Math.cos(angle),
                y - TREE_HEIGHT / 2 + 2,
                radiusAtY * Math.sin(angle)
            ),
            chaos: new THREE.Vector3(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40
            ),
            rotation: new THREE.Euler(0, -angle, Math.random() * 0.4 - 0.2)
         });
    }

    return { positions: pos, chaosPositions: chaos, randoms: rands, ornamentData: oData, polaroidData: pData };
  }, []);

  // -- Animation Loop --
  // Using a ref for current progress to smooth it out manually
  const currentProgress = useRef(0);

  useFrame((state, delta) => {
    const target = isFormed ? 1 : 0;
    // Smooth Lerp
    currentProgress.current = THREE.MathUtils.lerp(currentProgress.current, target, delta * 1.5);

    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uProgress = currentProgress.current;
    }

    // Rotate the whole tree slowly when formed
    if (groupRef.current) {
        groupRef.current.rotation.y += delta * 0.1 * currentProgress.current;
    }
  });

  return (
    <group ref={groupRef}>
      {/* The Foliage Particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions} // Initial positions (Target) - shader handles mix
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aTargetPos"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aChaosPos"
            count={chaosPositions.length / 3}
            array={chaosPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aRandom"
            count={randoms.length}
            array={randoms}
            itemSize={1}
          />
        </bufferGeometry>
        {/* @ts-ignore - Custom Shader Material defined in extend */}
        <foliageMaterial ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* Ornaments - Using individual meshes for simplicity with lerping logic inside a wrapper would be expensive, 
          but for 150 items, React components are fine. For max perf, InstancedMesh is better, but complex to animate chaos/target dual positions. 
          Let's use a helper component for each Ornament.
      */}
      {ornamentData.map((data, i) => (
         <FloatingItem 
            key={`orn-${i}`} 
            chaos={data.chaos} 
            target={data.target} 
            progressRef={currentProgress}
         >
            <mesh castShadow receiveShadow>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial 
                    color={data.color} 
                    metalness={1} 
                    roughness={0.1} 
                    emissive={data.color}
                    emissiveIntensity={0.2}
                />
            </mesh>
         </FloatingItem>
      ))}

      {/* Polaroids */}
      {polaroidData.map((data, i) => (
          <FloatingItem
            key={`pol-${i}`}
            chaos={data.chaos}
            target={data.target}
            progressRef={currentProgress}
            finalRotation={data.rotation}
          >
             <group scale={0.8}>
                {/* Frame */}
                <mesh position={[0, 0, -0.01]}>
                    <boxGeometry args={[1.2, 1.5, 0.05]} />
                    <meshStandardMaterial color="#fffff0" roughness={0.8} />
                </mesh>
                {/* Photo */}
                <Image url={`https://picsum.photos/seed/${i + 100}/200/200`} position={[0, 0.2, 0.03]} scale={[1, 1]} />
                {/* Greeting Text */}
                <Text 
                    position={[0, -0.5, 0.04]} 
                    fontSize={0.1} 
                    color="#1a1a1a"
                    font="https://fonts.gstatic.com/s/cinzel/v11/8vIJ7ww63mVu7gt78Uk.woff" // Cinzel font url
                    anchorX="center"
                    anchorY="middle"
                    maxWidth={1}
                >
                    {greetings[i % greetings.length] || "Merry Xmas"}
                </Text>
             </group>
          </FloatingItem>
      ))}
    </group>
  );
};

// Helper for lerping items
const FloatingItem = ({ chaos, target, progressRef, children, finalRotation }: any) => {
    const ref = useRef<THREE.Group>(null);
    useFrame(() => {
        if (!ref.current) return;
        const t = progressRef.current;
        // Cubic ease out
        const smoothT = 1 - Math.pow(1 - t, 3);
        
        ref.current.position.lerpVectors(chaos, target, smoothT);
        
        if (finalRotation) {
            // Chaos rotation is random, target is fixed
            // Simple approach: look at center when formed
            const qChaos = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random(), Math.random(), Math.random()));
            const qTarget = new THREE.Quaternion().setFromEuler(finalRotation);
            // Slerp requires stable frames, let's just use Euler lerp approximation for visual style
            // Actually, simplest is just to set rotation based on T
            ref.current.rotation.set(
                THREE.MathUtils.lerp(1, finalRotation.x, smoothT),
                THREE.MathUtils.lerp(1, finalRotation.y, smoothT),
                THREE.MathUtils.lerp(1, finalRotation.z, smoothT)
            );
        }
    });
    return <group ref={ref}>{children}</group>;
}
