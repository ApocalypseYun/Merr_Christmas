import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import './TreeMaterials'; // Ensure side-effects (extend) run

interface GrandTreeProps {
  isFormed: boolean;
  greetings: string[];
}

const TREE_HEIGHT = 18;
const TREE_RADIUS = 7;
const PARTICLE_COUNT = 4500; // Reduced slightly for stability
const ORNAMENT_COUNT = 150;
const CARD_COUNT = 16; // "Polaroids" -> "Luxury Cards"

export const GrandTree: React.FC<GrandTreeProps> = ({ isFormed, greetings }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // -- Geometry Generation --
  const { positions, chaosPositions, randoms, ornamentData, cardData } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const chaos = new Float32Array(PARTICLE_COUNT * 3);
    const rands = new Float32Array(PARTICLE_COUNT);

    // Needles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Target: Cone shape
      const y = Math.random() * TREE_HEIGHT;
      const radiusAtY = (1 - y / TREE_HEIGHT) * TREE_RADIUS;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radiusAtY;
      
      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y - TREE_HEIGHT / 2 + 2;
      pos[i * 3 + 2] = z;

      // Chaos: Sphere cloud
      const cx = (Math.random() - 0.5) * 35;
      const cy = (Math.random() - 0.5) * 35;
      const cz = (Math.random() - 0.5) * 35;

      chaos[i * 3] = cx;
      chaos[i * 3 + 1] = cy;
      chaos[i * 3 + 2] = cz;

      rands[i] = Math.random();
    }

    // Ornaments (Golden Balls)
    const oData = [];
    for (let i = 0; i < ORNAMENT_COUNT; i++) {
        const y = Math.random() * TREE_HEIGHT;
        const radiusAtY = (1 - y / TREE_HEIGHT) * TREE_RADIUS * 0.95; 
        const angle = Math.random() * Math.PI * 2;
        
        oData.push({
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
            color: Math.random() > 0.6 ? '#FFD700' : '#8B0000' // Gold & Deep Red
        });
    }

    // Luxury Cards (Replacing Polaroids)
    const cData = [];
    for (let i = 0; i < CARD_COUNT; i++) {
         const y = (i / CARD_COUNT) * TREE_HEIGHT * 0.7 + 2;
         const radiusAtY = (1 - y / TREE_HEIGHT) * TREE_RADIUS * 1.2; 
         const angle = i * 2.4; 
         
         cData.push({
            target: new THREE.Vector3(
                radiusAtY * Math.cos(angle),
                y - TREE_HEIGHT / 2 + 2,
                radiusAtY * Math.sin(angle)
            ),
            chaos: new THREE.Vector3(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50
            ),
            rotation: new THREE.Euler(0, -angle + Math.PI/2, 0)
         });
    }

    return { positions: pos, chaosPositions: chaos, randoms: rands, ornamentData: oData, cardData: cData };
  }, []);

  // -- Animation Loop --
  const currentProgress = useRef(0);

  useFrame((state, delta) => {
    const target = isFormed ? 1 : 0;
    // Smooth Lerp
    currentProgress.current = THREE.MathUtils.lerp(currentProgress.current, target, delta * 1.5);

    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uProgress = currentProgress.current;
    }

    if (groupRef.current) {
        // Slow rotation when formed
        groupRef.current.rotation.y += delta * 0.05 * currentProgress.current;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Foliage */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
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
        {/* @ts-ignore */}
        <foliageMaterial ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* Ornaments */}
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
                    metalness={0.9} 
                    roughness={0.1} 
                />
            </mesh>
         </FloatingItem>
      ))}

      {/* Luxury Cards */}
      {cardData.map((data, i) => (
          <FloatingItem
            key={`card-${i}`}
            chaos={data.chaos}
            target={data.target}
            progressRef={currentProgress}
            finalRotation={data.rotation}
          >
             <LuxuryCard text={greetings[i % greetings.length] || "LUXURY"} />
          </FloatingItem>
      ))}
    </group>
  );
};

// Component for the "Card" replacing the image
const LuxuryCard = ({ text }: { text: string }) => {
  return (
    <group>
      {/* Gold Border */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 1.0, 0.05]} />
        <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
      </mesh>
      {/* Ivory Center */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[1.5, 0.9, 0.01]} />
        <meshStandardMaterial color="#FFFFF0" roughness={0.8} />
      </mesh>
      {/* Text */}
      <Text 
        position={[0, 0, 0.04]} 
        fontSize={0.15} 
        color="#111"
        font="https://fonts.gstatic.com/s/cinzel/v11/8vIJ7ww63mVu7gt78Uk.woff"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.4}
      >
        {text}
      </Text>
    </group>
  )
}

const FloatingItem = ({ chaos, target, progressRef, children, finalRotation }: any) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (!ref.current) return;
        const t = progressRef.current;
        const smoothT = 1 - Math.pow(1 - t, 3);
        
        ref.current.position.lerpVectors(chaos, target, smoothT);
        
        if (t > 0.9) {
            ref.current.position.y += Math.sin(state.clock.elapsedTime * 2 + chaos.x) * 0.002;
        }
        
        if (finalRotation) {
            ref.current.rotation.set(
                THREE.MathUtils.lerp(chaos.x * 0.1, finalRotation.x, smoothT),
                THREE.MathUtils.lerp(chaos.y * 0.1, finalRotation.y, smoothT),
                THREE.MathUtils.lerp(chaos.z * 0.1, finalRotation.z, smoothT)
            );
        }
    });
    return <group ref={ref}>{children}</group>;
}