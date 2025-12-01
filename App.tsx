import React, { useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, Stars, Html, useProgress } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import { GrandTree } from './components/GrandTree';
import { HandController } from './components/HandController';
import { generateLuxuryGreetings } from './services/geminiService';

// Error Boundary to catch 3D crashes
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error.toString() };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black text-red-500 p-8 text-center z-50">
          <div>
            <h1 className="text-2xl mb-4 font-luxury">Something went wrong</h1>
            <p className="font-mono text-sm border border-red-900 p-4 rounded bg-red-900/20">{this.state.error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition"
            >
              RELOAD EXPERIENCE
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const CameraRig = ({ delta }: { delta: { x: number; y: number } }) => {
  useFrame((state, dt) => {
    const targetX = delta.x * 6;
    const targetY = 3 + delta.y * 4;
    
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, dt * 2);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, dt * 2);
    state.camera.lookAt(0, 5, 0);
  });
  return null;
};

const Loader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="loader w-64">
        <h2 className="text-xl md:text-3xl text-[#D4AF37] whitespace-nowrap">PREPARING LUXURY</h2>
        <div className="w-full h-1 bg-gray-900 mt-2 rounded-full overflow-hidden">
            <div 
                className="h-full bg-[#D4AF37] transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
            />
        </div>
        <p className="text-xs text-[#D4AF37] mt-1 font-mono">{progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
};

const App: React.FC = () => {
  const [unleashed, setUnleashed] = useState(false); 
  const [cameraDelta, setCameraDelta] = useState({ x: 0, y: 0 });
  const [greetings, setGreetings] = useState<string[]>([]);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [useMouseFallback, setUseMouseFallback] = useState(false);

  useEffect(() => {
    // Generate greetings silently
    generateLuxuryGreetings().then(setGreetings);

    const checkCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Stop tracks immediately, we just want to know if we CAN
            stream.getTracks().forEach(t => t.stop());
            setHasCameraPermission(true);
        } catch (e) {
            console.warn("Camera access denied or unavailable", e);
            setUseMouseFallback(true);
        }
    };
    checkCamera();
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!useMouseFallback) return;
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    setCameraDelta({ x, y });
    const dist = Math.sqrt(x*x + y*y);
    setUnleashed(dist > 0.6); 
  };

  return (
    <ErrorBoundary>
      <div className="w-full h-screen bg-[#020402] relative overflow-hidden" onMouseMove={handleMouseMove}>
        <Canvas 
            shadows 
            dpr={[1, 2]} // Dynamic pixel ratio
            gl={{ 
                antialias: false, 
                toneMapping: THREE.ACESFilmicToneMapping, 
                toneMappingExposure: 1.2,
                powerPreference: "high-performance"
            }}
        >
          <PerspectiveCamera makeDefault position={[0, 4, 24]} fov={50} />
          
          <CameraRig delta={cameraDelta} />

          <ambientLight intensity={0.4} color="#001a0a" />
          <spotLight position={[15, 25, 15]} angle={0.4} penumbra={0.5} intensity={3} castShadow color="#fff5cc" />
          <pointLight position={[-10, 8, -10]} intensity={2} color="#D4AF37" distance={30} />

          <Suspense fallback={<Loader />}>
              <GrandTree isFormed={!unleashed} greetings={greetings} />
              
              {/* Procedural Environment for reflections to replace external HDRI */}
              <Environment resolution={256}>
                  <group rotation={[-Math.PI / 4, -0.3, 0]}>
                      {/* Gold Reflection Source */}
                      <mesh position={[10, 10, 10]} scale={10}>
                          <boxGeometry />
                          <meshBasicMaterial color="#FFD700" toneMapped={false} />
                      </mesh>
                      {/* General Highlight Source */}
                      <mesh position={[-10, -10, -10]} scale={10}>
                          <boxGeometry />
                          <meshBasicMaterial color="white" toneMapped={false} />
                      </mesh>
                      {/* Dark Background for contrast in reflections */}
                      <mesh scale={100}>
                          <sphereGeometry args={[1, 64, 64]} />
                          <meshBasicMaterial color="#020402" side={THREE.BackSide} />
                      </mesh>
                  </group>
              </Environment>

              <Stars radius={80} depth={40} count={3000} factor={4} saturation={1} fade speed={0.5} />
          </Suspense>

          <EffectComposer enableNormalPass={false} multisampling={0}>
            <Bloom luminanceThreshold={0.7} mipmapBlur intensity={1.5} radius={0.5} />
            <Vignette eskil={false} offset={0.2} darkness={0.6} />
          </EffectComposer>
        </Canvas>

        {hasCameraPermission && !useMouseFallback && (
            <HandController 
                onUnleashChange={setUnleashed} 
                onCameraMove={(x, y) => setCameraDelta({ x, y })}
            />
        )}

        <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-6 md:p-10 flex flex-col justify-between z-10">
            <header className="flex flex-col items-center text-center">
                <h1 className="text-3xl md:text-5xl lg:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] to-[#CFB53B] font-luxury tracking-widest uppercase drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                    The Grand Tree
                </h1>
                <p className="text-[#D4AF37] font-body text-xs md:text-sm mt-3 tracking-[0.3em] opacity-90 uppercase border-b border-[#D4AF37]/40 pb-2">
                    Official Luxury Christmas Interactive
                </p>
            </header>

            <footer className="text-center w-full flex flex-col items-center">
                <div className="border border-[#D4AF37]/50 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                    <p className="text-[#fffaed] font-luxury text-xs md:text-sm tracking-wide">
                        {useMouseFallback ? 
                            "MOUSE: CENTER TO FORM • EDGE TO UNLEASH" : 
                            "HAND: CLOSED TO FORM • OPEN TO UNLEASH"}
                    </p>
                </div>
            </footer>
        </div>
        
        <div className="absolute top-4 left-4 right-4 bottom-4 pointer-events-none border border-[#D4AF37]/30 rounded-xl" />
        <div className="absolute top-5 left-5 right-5 bottom-5 pointer-events-none border border-[#D4AF37]/10 rounded-lg" />
      </div>
    </ErrorBoundary>
  );
};

export default App;