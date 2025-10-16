import { Canvas, useFrame } from '@react-three/fiber';
import { XR, ARButton, useHitTest, useXR } from '@react-three/xr';
import { OrbitControls } from '@react-three/drei';
import { useState, useRef } from 'react';
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

  const { player } = useXR();

  const onSelect = () => {
    if (reticle.current) {
      const pos = reticle.current.position.clone();
      setModelPos(pos);
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

// ---------- Main App ----------
export default function App() {
  const [color, setColor] = useState('#ff0000');
  const [scale, setScale] = useState(1);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      {/* AR Activation */}
      <ARButton sessionInit={{ requiredFeatures: ['hit-test'] }} />

      <Canvas camera={{ position: [0, 1, 3], fov: 70 }}>
        <XR onSelect={() => {}}>
          <ambientLight intensity={1} />
          <directionalLight position={[2, 2, 2]} />
          <ARPlacement color={color} scale={scale} />
          <OrbitControls />
          <ExitARButton />
        </XR>
      </Canvas>

      {/* Controls */}
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
