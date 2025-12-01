import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

const FoliageMaterial = shaderMaterial(
  {
    uTime: 0,
    uProgress: 0, 
    uColorBase: new THREE.Color('#003311'), 
    uColorTip: new THREE.Color('#FFD700'), 
  },
  // Vertex Shader
  `
    attribute vec3 aChaosPos;
    attribute vec3 aTargetPos;
    attribute float aRandom;
    
    varying vec2 vUv;
    varying float vRandom;
    varying float vDepth;

    uniform float uProgress;
    uniform float uTime;

    float easeOutCubic(float x) {
        return 1.0 - pow(1.0 - x, 3.0);
    }

    void main() {
      vUv = uv;
      vRandom = aRandom;

      float t = easeOutCubic(uProgress);
      
      vec3 chaosOffset = vec3(
        sin(uTime * 0.5 + aChaosPos.y) * 0.5,
        cos(uTime * 0.3 + aChaosPos.x) * 0.5,
        sin(uTime * 0.7 + aChaosPos.z) * 0.5
      ) * (1.0 - t);

      vec3 pos = mix(aChaosPos + chaosOffset, aTargetPos, t);
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      gl_PointSize = (6.0 * aRandom + 5.0) * (1.0 / -mvPosition.z);
      gl_PointSize *= (0.5 + 0.6 * t);
      
      // Safety clamp
      if (gl_PointSize < 2.0) gl_PointSize = 2.0;

      gl_Position = projectionMatrix * mvPosition;
      vDepth = -mvPosition.z;
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColorBase;
    uniform vec3 uColorTip;
    
    varying float vRandom;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      if(length(coord) > 0.5) discard;

      float strength = distance(gl_PointCoord, vec2(0.5));
      
      vec3 finalColor = mix(uColorBase, uColorTip, vRandom * 0.5);
      
      // Sparkle center
      if (strength < 0.15) {
        finalColor += vec3(0.6);
      }

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

// Register it
extend({ FoliageMaterial });

export { FoliageMaterial };