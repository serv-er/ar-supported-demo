import { Canvas, useFrame } from '@react-three/fiber';
import { XR, useHitTest, useXR } from '@react-three/xr';
import { OrbitControls } from '@react-three/drei';
import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import './index.css';

// ---------- Cube Model ----------
function Model({ color, scale }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.01;
  });
  return (
    <mesh ref={ref} scale={scale}>
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// ---------- AR Object Placement ----------
function ARPlacement({ color, scale }) {
  const [modelPos, setModelPos] = useState(null);
  const reticle = useRef();

  useHitTest((hitMatrix) => {
    if (reticle.current) {
      hitMatrix.decompose(
        reticle.current.position,
        reticle.current.quaternion,
        reticle.current.scale
      );
    }
  });

  const onSelect = () => {
    if (reticle.current) {
      setModelPos(reticle.current.position.clone());
    }
  };

  return (
    <>
      <mesh ref={reticle}>
        <ringGeometry args={[0.05, 0.06, 32]} />
        <meshBasicMaterial color="yellow" />
      </mesh>

      {modelPos && (
        <group position={modelPos}>
          <Model color={color} scale={scale} />
        </group>
      )}
    </>
  );
}

// ---------- Exit Button ----------
function ExitARButton() {
  const { isPresenting } = useXR();
  if (!isPresenting) return null;

  const handleExit = async () => {
    const session = await navigator.xr?.getSession?.();
    if (session) session.end();
  };

  return (
    <button
      onClick={handleExit}
      className="absolute bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg z-50"
    >
      Exit AR
    </button>
  );
}

// ---------- Custom AR Button (Safe Outside R3F) ----------
function SafeARButton() {
  useEffect(() => {
    const button = document.createElement('button');
    button.textContent = 'Enter AR';
    button.style.position = 'absolute';
    button.style.bottom = '20px';
    button.style.left = '50%';
    button.style.transform = 'translateX(-50%)';
    button.style.padding = '12px 24px';
    button.style.background = '#007bff';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.fontSize = '16px';
    button.style.cursor = 'pointer';
    button.style.zIndex = 9999;
    document.body.appendChild(button);

    button.onclick = async () => {
      if (!navigator.xr) {
        alert('WebXR not supported on this device.');
        return;
      }

      const supported = await navigator.xr.isSessionSupported('immersive-ar');
      if (!supported) {
        alert('AR not supported on this browser.');
        return;
      }

      const canvas = document.querySelector('canvas');
      const gl = canvas.getContext('webgl', { xrCompatible: true });

      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'local-floor'],
      });

      session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });
    };

    return () => button.remove();
  }, []);

  return null;
}

// ---------- Main App ----------
export default function App() {
  const [color, setColor] = useState('#ff0000');
  const [scale, setScale] = useState(1);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      <SafeARButton />

      <Canvas camera={{ position: [0, 1, 3], fov: 70 }}>
        <XR>
          <ambientLight intensity={1} />
          <directionalLight position={[2, 2, 2]} />
          <ARPlacement color={color} scale={scale} />
          <OrbitControls />
          <ExitARButton />
        </XR>
      </Canvas>

      {/* UI Controls */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl w-64 transition-all duration-500 z-50">
        {!collapsed ? (
          <>
            <h2 className="text-lg font-bold mb-2">AR Model Controls</h2>

            <label className="text-sm">Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-8 mb-2 cursor-pointer"
            />

            <label className="text-sm">Scale:</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full mb-3"
            />

            <button
              onClick={() => setCollapsed(true)}
              className="w-full py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm mt-2"
            >
              Collapse
            </button>
          </>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm"
          >
            Show Controls ⚙️
          </button>
        )}
      </div>
    </div>
  );
}
