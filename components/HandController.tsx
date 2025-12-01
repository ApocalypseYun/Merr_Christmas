import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

interface HandControllerProps {
  onUnleashChange: (unleashed: boolean) => void;
  onCameraMove: (x: number, y: number) => void;
}

export const HandController: React.FC<HandControllerProps> = ({ onUnleashChange, onCameraMove }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const [debugMode, setDebugMode] = useState(false);
  
  // Basic Skin Color Detection Logic
  // This is a simplified CV algorithm to detect "Spread" vs "Cluster" of skin-like pixels
  const processFrame = useCallback(() => {
    if (!webcamRef.current || !webcamRef.current.video || !canvasRef.current) return;

    const video = webcamRef.current.video;
    if (video.readyState !== 4) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Downscale for performance
    canvas.width = 100;
    canvas.height = 75; // 4:3 aspect
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = frame.data;
    const length = data.length;

    let xSum = 0;
    let ySum = 0;
    let pixelCount = 0;
    
    // Bounds
    let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;

    for (let i = 0; i < length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Simple Skin Threshold (YCbCr approximation logic in RGB)
      // R > 95, G > 40, B > 20, Max-Min > 15, |R-G| > 15, R > G, R > B
      if (r > 95 && g > 40 && b > 20 && r > g && r > b && (Math.max(r,g,b) - Math.min(r,g,b) > 15) && Math.abs(r-g) > 15) {
        const x = (i / 4) % canvas.width;
        const y = Math.floor((i / 4) / canvas.width);
        
        xSum += x;
        ySum += y;
        pixelCount++;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    if (pixelCount > 200) { // Threshold to ignore noise
      const centerX = (xSum / pixelCount) / canvas.width; // 0 to 1
      const centerY = (ySum / pixelCount) / canvas.height; // 0 to 1

      // Map to -1 to 1, inverted X for mirror effect
      onCameraMove((centerX - 0.5) * -2, (centerY - 0.5) * 2);

      // Determine "Unleash" (Open Hand) vs "Form" (Closed Hand)
      // Heuristic: Fill Ratio. Closed hand is denser. Open hand has gaps or larger bounding box relative to pixel count?
      // Simpler: Bounding Box Area.
      // Spread hand: Large bounding box. Fist: Small bounding box.
      
      const width = maxX - minX;
      const height = maxY - minY;
      const area = width * height;
      // const density = pixelCount / area;

      // Tuning these magic numbers is hard without real-time feedback, 
      // but generally an open hand occupies a larger bounding box area than a fist.
      const boxAreaPercent = area / (canvas.width * canvas.height);
      
      // If box is large (> 15% of screen), assume Open Hand (Unleash/Chaos)
      // If box is small (< 15% of screen) but valid, assume Fist (Formed)
      // Inverted logic: We want Tree to be FORMED by default (Chaos=False).
      // If user SPREADS hand (Unleash), we set Unleash=True.
      
      if (boxAreaPercent > 0.15) {
        onUnleashChange(true); // Chaos
      } else {
        onUnleashChange(false); // Formed
      }
    } else {
        // No hand detected, default to Formed
        onUnleashChange(false);
    }

  }, [onUnleashChange, onCameraMove]);

  useEffect(() => {
    const interval = setInterval(processFrame, 100); // Check 10 times a second
    return () => clearInterval(interval);
  }, [processFrame]);

  return (
    <div className="absolute top-4 right-4 z-50">
       <div className={`relative rounded-lg overflow-hidden border-2 ${debugMode ? 'border-yellow-500' : 'border-emerald-900'} shadow-2xl`}>
          <Webcam
            ref={webcamRef}
            audio={false}
            width={160}
            height={120}
            mirrored
            screenshotFormat="image/jpeg"
            className="opacity-80 hover:opacity-100 transition-opacity"
          />
          <div className="absolute bottom-0 left-0 w-full bg-black/60 text-white text-[10px] text-center p-1 font-mono">
            HAND TRACKER
          </div>
       </div>
       <button 
         onClick={() => setDebugMode(!debugMode)}
         className="mt-2 text-xs text-white/50 hover:text-white underline"
       >
         {debugMode ? "Hide Debug" : "Show Debug"}
       </button>
    </div>
  );
};
