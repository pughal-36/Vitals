"use client";

import { Html, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";

const OCEAN = "#E8D86A"; // sun yellow
const LAND = "#7479A9"; // blue-violet
const STEEL = "#59683D"; // olive
const AMBER = "#F3E45D"; // palette yellow, reserved for the site pin
const RADIUS = 0.96;
const EARTH_ROTATION_RADIANS_PER_SECOND = (Math.PI * 2) / 20;

type MotionInput = { x: number; y: number; dragging: boolean; dragX: number; dragY: number; wheel: number; zoom: number };
type Props = { scanId?: string; score?: number; active: boolean };

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return hash >>> 0;
}

function Earth({ input, scanId, score }: { input: MutableRefObject<MotionInput>; scanId?: string; score?: number }) {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const pin = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const [labelVisible, setLabelVisible] = useState(false);
  const { scene } = useGLTF("/models/earth.glb", false, true);
  const earth = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const recolored = materials.map((source) => {
        const material = source.clone() as THREE.MeshStandardMaterial;
        const land = source.name === "mat10";
        material.color.set(land ? LAND : OCEAN);
        material.roughness = 1;
        material.metalness = 0;
        material.flatShading = true;
        material.needsUpdate = true;
        return material;
      });
      object.material = Array.isArray(object.material) ? recolored : recolored[0];
      object.castShadow = false;
      object.receiveShadow = false;
    });
    return clone;
  }, [scene]);
  useEffect(() => () => {
    earth.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    });
  }, [earth]);
  const coords = useMemo(() => {
    const h = hashString(scanId || "vitals");
    const longitude = ((h % 360) * Math.PI) / 180;
    const latitude = (((h >>> 9) % 90) - 45) * Math.PI / 180;
    const normal = new THREE.Vector3(Math.sin(longitude) * Math.cos(latitude), Math.sin(latitude), Math.cos(longitude) * Math.cos(latitude)).normalize();
    const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    return { longitude, latitude, normal, rotation };
  }, [scanId]);
  const sites = useMemo(() => [
    [1.2, 0.15], [2.5, -0.4], [4.1, 0.52], [5.2, -0.12], [0.25, -0.58],
  ] as const, []);
  const rings = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), coords.normal), [coords]);

  // The mutable input ref is an imperative pointer channel for the R3F frame loop.
  // eslint-disable-next-line react-hooks/immutability
  useFrame((_, delta) => {
    if (!root.current) return;
    const state = input.current;
    const step = delta;
    if (state.dragging) {
      root.current.rotation.y += state.dragX * 0.006;
      root.current.rotation.x += state.dragY * 0.005;
      // eslint-disable-next-line react-hooks/immutability
      state.dragX *= 0.84;
      state.dragY *= 0.84;
    } else {
      root.current.rotation.y += state.dragX * 0.006;
      root.current.rotation.x += state.dragY * 0.005;
      state.dragX *= 0.84;
      state.dragY *= 0.84;
      root.current.rotation.y += state.wheel;
      state.wheel *= 0.88;
      const hasAudit = score !== undefined && Boolean(scanId);

      const targetX = hasAudit ? coords.latitude : -state.y * 0.16;
      const targetY = hasAudit ? -coords.longitude : state.x * 0.18;
      root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, targetX, 2.2, step);
      root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, targetY, 1.5, step);
    }
    if (spin.current) spin.current.rotation.y += EARTH_ROTATION_RADIANS_PER_SECOND * step;
    if (pin.current && scanId && score !== undefined) {
      const t = Math.min(1, (pin.current.scale.x + step * 1.7));
      pin.current.scale.setScalar(THREE.MathUtils.damp(pin.current.scale.x, t, 4, step));
      const settle = 0.16 * (1 - Math.min(1, pin.current.scale.x));
      pin.current.position.z = settle;
    }
    if (ringA.current && ringB.current && scanId && score !== undefined) {
      const t = performance.now() * 0.00055;
      const a = 1 + (Math.sin(t) + 1) * 0.12;
      const b = 1 + (Math.sin(t + Math.PI) + 1) * 0.12;
      ringA.current.scale.setScalar(a);
      ringB.current.scale.setScalar(b);
    }
    const camera = _.camera;
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 3.15 + state.zoom, 3.5, step);
  });

  return (
    <group ref={root} scale={1.37}>
      <group ref={spin}>
      <primitive object={earth} />
      {sites.map(([longitude, latitude], index) => {
        const normal = new THREE.Vector3(Math.sin(longitude) * Math.cos(latitude), Math.sin(latitude), Math.cos(longitude) * Math.cos(latitude));
        return <mesh key={index} position={normal.clone().multiplyScalar(RADIUS)} scale={0.018}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color={index % 2 ? STEEL : LAND} />
        </mesh>;
      })}
      {scanId && score !== undefined && (
        <group position={coords.normal.clone().multiplyScalar(RADIUS)} quaternion={rings}>
          <group ref={pin} scale={0} onPointerOver={(event) => { event.stopPropagation(); setLabelVisible(true); }} onPointerOut={() => setLabelVisible(false)} onClick={(event) => { event.stopPropagation(); setLabelVisible((v) => !v); }}>
            <mesh ref={ringA} position={[0, 0, 0.018]}>
              <torusGeometry args={[0.115, 0.004, 6, 40]} />
              <meshBasicMaterial color={AMBER} transparent opacity={0.62} depthWrite={false} />
            </mesh>
            <mesh ref={ringB} position={[0, 0, 0.021]}>
              <torusGeometry args={[0.165, 0.003, 6, 40]} />
              <meshBasicMaterial color={AMBER} transparent opacity={0.35} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.003, 0.003, 0.22, 5]} />
              <meshBasicMaterial color={AMBER} transparent opacity={0.55} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0, 0.064]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.025, 0.09, 6]} />
              <meshBasicMaterial color={AMBER} />
            </mesh>
            <mesh position={[0, 0, 0.1]}>
              <sphereGeometry args={[0.025, 8, 6]} />
              <meshBasicMaterial color={AMBER} />
            </mesh>
            {labelVisible && <Html position={[0, 0, 0.24]} center distanceFactor={4}>
              <div className="globe-score-label" role="status"><span>YOUR SITE</span><strong>{score}</strong><small>/ 100</small></div>
            </Html>}
          </group>
        </group>
      )}
      </group>
    </group>
  );
}

function Scene({ scanId, score, input }: { scanId?: string; score?: number; input: MutableRefObject<MotionInput> }) {
  return <>
    <ambientLight color="#FFFFFF" intensity={0.82} />
    <directionalLight color="#FFF9D8" intensity={1.1} position={[3, 4, 5]} />
    <Earth input={input} scanId={scanId} score={score} />
  </>;
}

function FrameLimiter({ active }: { active: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameInterval = useRef(1000 / 60);
  useEffect(() => {
    if (active) frameInterval.current = window.matchMedia("(max-width: 640px)").matches ? 1000 / 30 : 1000 / 60;
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [active]);
  useFrame(() => {
    if (!active || timer.current !== null) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      invalidate();
    }, frameInterval.current);
  });
  return null;
}

export default function GlobeScene({ scanId, score, active }: Props) {
  const input = useRef<MotionInput>({ x: 0, y: 0, dragging: false, dragX: 0, dragY: 0, wheel: 0, zoom: 0 });
  const pointer = useRef({ down: false, x: 0, y: 0 });
  return <div
    className="globe-canvas"
    role="img"
    aria-label={scanId ? `Interactive low-poly Earth. Audit score ${score ?? "available"}. Drag to rotate; scroll to zoom.` : "Interactive low-poly Earth. Drag to tilt and scroll to zoom."}
    onPointerDown={(event) => { pointer.current = { down: true, x: event.clientX, y: event.clientY }; input.current.dragging = true; event.currentTarget.setPointerCapture(event.pointerId); }}
    onPointerUp={(event) => { pointer.current.down = false; input.current.dragging = false; event.currentTarget.releasePointerCapture(event.pointerId); }}
    onPointerCancel={() => { pointer.current.down = false; input.current.dragging = false; }}
    onPointerMove={(event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      input.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      input.current.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      if (pointer.current.down) {
        input.current.dragX = event.clientX - pointer.current.x;
        input.current.dragY = event.clientY - pointer.current.y;
        pointer.current.x = event.clientX;
        pointer.current.y = event.clientY;
      }
    }}
    onWheel={(event) => { event.preventDefault(); input.current.zoom = THREE.MathUtils.clamp(input.current.zoom + event.deltaY * 0.001, -0.55, 1.25); input.current.wheel += event.deltaY * 0.00025; }}
  >
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 3.15], fov: 38 }} frameloop={active ? "demand" : "never"} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}>
      <FrameLimiter active={active} />
      <Scene scanId={scanId} score={score} input={input} />
    </Canvas>
  </div>;
}
