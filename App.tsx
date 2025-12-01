import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import { GrandTree } from './components/GrandTree';
import { HandController } from './components/HandController';
import { generateLuxuryGreetings } from './services/geminiService';

// Camera Rig Component to smooth camera movement based on hand input
const CameraRig = ({ delta }: { delta: { x: number; y: number } }) => {
  useFrame((state, dt) => {
    // Parallax effect
    // Target position: Standard pos (0, 2, 22) + Delta offset
    const targetX = delta.x * 5;
    const targetY = 2 + delta.y * 3;
    
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, dt * 2);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, dt * 2);
    state.camera.lookAt(0, 4, 0);
  });
  return null;
};

const App: React.FC = () => {
  const [unleashed, setUnleashed] = useState(false); // False = Formed (Tree), True = Chaos
  const [cameraDelta, setCameraDelta] = useState({ x: 0, y: 0 });
  const [greetings, setGreetings] = useState<string[]>([]);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [useMouseFallback, setUseMouseFallback] = useState(false);

  // Initialize
  useEffect(() => {
    const fetchGreetings = async () => {
      const g = await generateLuxuryGreetings();
      setGreetings(g);
    };
    fetchGreetings();

    // Check permissions roughly
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setHasCameraPermission(true))
      .catch(() => {
        console.warn("Camera blocked, enabling mouse fallback");
        setUseMouseFallback(true);
      });
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!useMouseFallback) return;
    // Normalize -1 to 1
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    setCameraDelta({ x, y });

    // Center of screen = Formed. Edges = Unleashed.
    const dist = Math.sqrt(x*x + y*y);
    setUnleashed(dist > 0.6); // Unleash if near edges
  };

  return (
    <div 
        className="w-full h-screen bg-black relative" 
        onMouseMove={handleMouseMove}
    >
      {/* 3D Scene */}
      <Canvas shadows gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}>
        <PerspectiveCamera makeDefault position={[0, 4, 22]} fov={45} />
        
        <CameraRig delta={cameraDelta} />

        <ambientLight intensity={0.2} />
        <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={2} castShadow shadow-bias={-0.0001} color="#fffaed" />
        <pointLight position={[-10, 5, -10]} intensity={1} color="#00ff88" />

        <Suspense fallback={null}>
            <GrandTree isFormed={!unleashed} greetings={greetings} />
            {/* Cinematic Environment */}
            <Environment preset="lobby" background={false} /> 
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </Suspense>

        <EffectComposer disableNormalPass>
           {/* Luxury Glow */}
          <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.5} radius={0.6} />
          <Vignette eskil={false} offset={0.1} darkness={0.7} />
        </EffectComposer>
      </Canvas>

      {/* Logic Overlay */}
      {hasCameraPermission && !useMouseFallback && (
        <HandController 
            onUnleashChange={setUnleashed} 
            onCameraMove={(x, y) => setCameraDelta({ x, y })}
        />
      )}

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-10 flex flex-col justify-between z-10">
        <header className="flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] to-[#B8860B] font-luxury tracking-widest uppercase drop-shadow-lg filter">
                The Grand Tree
            </h1>
            <p className="text-[#D4AF37] font-body text-sm mt-2 tracking-widest opacity-80">
                A TRUMP LUXURY EXPERIENCE
            </p>
        </header>

        <footer className="text-center">
            <div className="inline-block border border-[#D4AF37]/30 bg-black/60 backdrop-blur-md p-4 rounded-full">
                <p className="text-[#fffaed] font-luxury text-sm md:text-base">
                    {useMouseFallback ? 
                        "MOVE MOUSE TO CENTER TO FORM • MOVE TO EDGE TO UNLEASH" : 
                        "CLOSE HAND TO FORM • OPEN HAND TO UNLEASH"}
                </p>
            </div>
            {!hasCameraPermission && !useMouseFallback && (
                <p className="text-red-500 text-xs mt-2">Please allow camera access for the full experience</p>
            )}
        </footer>
      </div>
      
      {/* Decorative Border */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[1px] border-[#D4AF37] opacity-20 m-4 rounded-xl box-border w-[calc(100%-2rem)] h-[calc(100%-2rem)]" />
    </div>
  );
};

export default App;
