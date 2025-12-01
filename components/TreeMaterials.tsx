import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

// A deep emerald shader with gold glint
const FoliageMaterial = shaderMaterial(
  {
    uTime: 0,
    uProgress: 0, // 0 = Chaos, 1 = Formed
    uColorBase: new THREE.Color('#002810'), // Deep Emerald
    uColorTip: new THREE.Color('#D4AF37'), // Gold
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

    // Cubic easing for smooth transition
    float easeOutCubic(float x) {
        return 1.0 - pow(1.0 - x, 3.0);
    }

    void main() {
      vUv = uv;
      vRandom = aRandom;

      // Interpolate position
      float t = easeOutCubic(uProgress);
      
      // Add some noise movement when in chaos mode
      vec3 chaosOffset = vec3(
        sin(uTime * 0.5 + aChaosPos.y) * 0.5,
        cos(uTime * 0.3 + aChaosPos.x) * 0.5,
        sin(uTime * 0.7 + aChaosPos.z) * 0.5
      ) * (1.0 - t);

      vec3 pos = mix(aChaosPos + chaosOffset, aTargetPos, t);
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Scale particles based on depth and progress
      gl_PointSize = (6.0 * aRandom + 4.0) * (1.0 / -mvPosition.z);
      // Make them slightly larger when formed to look dense
      gl_PointSize *= (0.5 + 0.5 * t);

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
      // Circular particle
      vec2 coord = gl_PointCoord - vec2(0.5);
      if(length(coord) > 0.5) discard;

      // Gradient from center to edge
      float strength = distance(gl_PointCoord, vec2(0.5));
      
      // Mix base emerald with gold tips based on randomness
      vec3 finalColor = mix(uColorBase, uColorTip, vRandom * 0.4);
      
      // Add a high-light center
      finalColor += vec3(0.2) * (1.0 - strength * 2.0);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ FoliageMaterial });

export { FoliageMaterial };
