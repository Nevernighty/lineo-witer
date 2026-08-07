// HighlightLayer — persistent, non-blocking 3D highlights for the guided steps.
//
// Design rules that keep the rotor readable while the marks explain it:
//  - nothing is opaque: zones are rim-lit shells with a very low-alpha fill,
//  - captions are small billboards pushed radially away from the rotor axis and
//    faded by distance, so they never sit on top of the blades,
//  - flow marks are moving dashes rather than solid tubes, so the airflow reads
//    as motion instead of geometry.

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { CinemaStep, HighlightMark } from './types';

interface Props {
  step: CinemaStep | null;
  /** Cue-space -> world scale (same convention as the camera cues). */
  scale: number;
  /** Rotor centre in world space. */
  center?: [number, number, number];
  /** Radius of the subject, used to push captions clear of the rotor. */
  subjectRadius: number;
  lang: 'ua' | 'en';
}

const DEFAULT_COLOR = '#66e8ff';

export function HighlightLayer({ step, scale, center = [0, 0, 0], subjectRadius, lang }: Props) {
  if (!step?.marks?.length) return null;
  return (
    <group position={center}>
      {step.marks.map((mark, i) => (
        <Mark key={`${step.id}-${i}`} mark={mark} scale={scale} subjectRadius={subjectRadius} lang={lang} />
      ))}
    </group>
  );
}

function Mark({ mark, scale, subjectRadius, lang }: { mark: HighlightMark; scale: number; subjectRadius: number; lang: 'ua' | 'en' }) {
  switch (mark.kind) {
    case 'flow': return <FlowMark mark={mark} scale={scale} />;
    case 'zone': return <ZoneMark mark={mark} scale={scale} subjectRadius={subjectRadius} />;
    case 'point': return <PointMark mark={mark} scale={scale} subjectRadius={subjectRadius} />;
    case 'span': return <SpanMark mark={mark} scale={scale} />;
    default: return null;
  }
}

/** Moving dashes along a direction — reads as flow, occludes almost nothing. */
function FlowMark({ mark, scale }: { mark: Extract<HighlightMark, { kind: 'flow' }>; scale: number }) {
  const group = useRef<THREE.Group>(null);
  const color = mark.color ?? DEFAULT_COLOR;
  const speed = mark.speed ?? 1;
  const dashes = 7;

  const { origin, axis, length, quat } = useMemo(() => {
    const o = new THREE.Vector3(...mark.pos).multiplyScalar(scale);
    const a = new THREE.Vector3(...mark.dir).multiplyScalar(scale);
    const len = Math.max(0.001, a.length());
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().normalize());
    return { origin: o, axis: a, length: len, quat: q };
  }, [mark.pos, mark.dir, scale]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime * speed * 0.5;
    group.current.children.forEach((child, i) => {
      const u = ((t + i / dashes) % 1);
      child.position.y = u * length;
      const fade = Math.sin(u * Math.PI);
      child.scale.setScalar(0.4 + fade * 0.8);
      const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (m) m.opacity = fade * 0.85;
    });
  });

  const dashLen = length * 0.09;
  const dashRad = Math.max(0.004, length * 0.012);

  return (
    <group position={origin} quaternion={quat}>
      <group ref={group}>
        {Array.from({ length: dashes }).map((_, i) => (
          <mesh key={i}>
            <capsuleGeometry args={[dashRad, dashLen, 4, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.7} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, length, 0]}>
        <coneGeometry args={[dashRad * 3.2, dashLen * 2.2, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} depthWrite={false} toneMapped={false} />
      </mesh>
      {mark.label && <Caption text={mark.label} color={color} position={[0, length * 1.08, 0]} size={length * 0.075} />}
    </group>
  );
}

/** Influence zone: rim-lit cylinder shell, ~4 % fill, so the rotor stays visible. */
function ZoneMark({ mark, scale, subjectRadius }: { mark: Extract<HighlightMark, { kind: 'zone' }>; scale: number; subjectRadius: number }) {
  const ref = useRef<THREE.Group>(null);
  const color = mark.color ?? '#ffaa44';
  const pos = useMemo(() => new THREE.Vector3(...mark.pos).multiplyScalar(scale), [mark.pos, scale]);
  const r = Math.max(0.05, mark.radius * scale);
  const h = Math.max(0.05, (mark.height ?? mark.radius * 1.2) * scale);

  useFrame((state) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.03;
    ref.current.scale.setScalar(pulse);
  });

  return (
    <group ref={ref} position={pos}>
      <mesh>
        <cylinderGeometry args={[r, r, h, 32, 1, true]} />
        <meshBasicMaterial
          color={color} transparent opacity={0.07} side={THREE.DoubleSide}
          depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false}
        />
      </mesh>
      {[h / 2, -h / 2].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, Math.max(0.004, r * 0.012), 6, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.75} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {mark.label && (
        <Caption text={mark.label} color={color} position={[0, h / 2 + subjectRadius * 0.12, 0]} size={r * 0.22} />
      )}
    </group>
  );
}

/** Control point: marker dot, leader line out of the rotor, caption at the end. */
function PointMark({ mark, scale, subjectRadius }: { mark: Extract<HighlightMark, { kind: 'point' }>; scale: number; subjectRadius: number }) {
  const dot = useRef<THREE.Mesh>(null);
  const color = mark.color ?? '#8ef7c4';
  const p = useMemo(() => new THREE.Vector3(...mark.pos).multiplyScalar(scale), [mark.pos, scale]);

  // Push the caption radially outward so it never lands over the rotor disc.
  const leaderEnd = useMemo(() => {
    const radial = new THREE.Vector3(p.x, 0, p.z);
    if (radial.lengthSq() < 1e-6) radial.set(1, 0, 0);
    radial.setLength(subjectRadius * 0.55);
    return new THREE.Vector3(p.x + radial.x, p.y + subjectRadius * 0.3, p.z + radial.z);
  }, [p, subjectRadius]);

  useFrame((state) => {
    if (!dot.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.18;
    dot.current.scale.setScalar(s);
  });

  const dotR = Math.max(0.012, subjectRadius * 0.022);

  return (
    <group>
      <mesh ref={dot} position={p}>
        <sphereGeometry args={[dotR, 16, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} toneMapped={false} />
      </mesh>
      <Line
        points={[p, leaderEnd]}
        color={color}
        lineWidth={1}
        transparent
        opacity={0.5}
        depthWrite={false}
      />
      <Caption
        text={mark.label}
        sub={mark.sub}
        color={color}
        position={[leaderEnd.x, leaderEnd.y, leaderEnd.z]}
        size={subjectRadius * 0.075}
      />
    </group>
  );
}

/** Dimension span with tick ends. */
function SpanMark({ mark, scale }: { mark: Extract<HighlightMark, { kind: 'span' }>; scale: number }) {
  const color = mark.color ?? '#c9b7ff';
  const a = useMemo(() => new THREE.Vector3(...mark.from).multiplyScalar(scale), [mark.from, scale]);
  const b = useMemo(() => new THREE.Vector3(...mark.to).multiplyScalar(scale), [mark.to, scale]);
  const mid = useMemo(() => a.clone().add(b).multiplyScalar(0.5), [a, b]);
  const len = a.distanceTo(b);
  return (
    <group>
      <Line points={[a, b]} color={color} lineWidth={1.4} transparent opacity={0.7} depthWrite={false} />
      {[a, b].map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[Math.max(0.008, len * 0.02), 10, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} toneMapped={false} />
        </mesh>
      ))}
      {mark.label && <Caption text={mark.label} color={color} position={[mid.x, mid.y + len * 0.06, mid.z]} size={len * 0.07} />}
    </group>
  );
}

/**
 * Billboarded caption drawn as a texture (not DOM), so it is depth-sorted with
 * the scene, fades with distance and cannot steal pointer events from the HUD.
 */
function Caption({ text, sub, color, position, size }: {
  text: string; sub?: string; color: string; position: [number, number, number] | THREE.Vector3; size: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const texture = useMemo(() => {
    const pad = 12;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const titleFont = '600 34px ui-sans-serif, system-ui, sans-serif';
    const subFont = '400 24px ui-sans-serif, system-ui, sans-serif';
    ctx.font = titleFont;
    const wTitle = ctx.measureText(text).width;
    ctx.font = subFont;
    const wSub = sub ? ctx.measureText(sub).width : 0;
    const w = Math.ceil(Math.max(wTitle, wSub) + pad * 2);
    const h = Math.ceil((sub ? 78 : 48) + pad);
    canvas.width = w; canvas.height = h;
    const c = canvas.getContext('2d')!;
    c.fillStyle = 'rgba(4, 10, 16, 0.62)';
    roundRect(c, 1, 1, w - 2, h - 2, 8);
    c.fill();
    c.strokeStyle = color; c.lineWidth = 2; c.globalAlpha = 0.75;
    roundRect(c, 1, 1, w - 2, h - 2, 8);
    c.stroke();
    c.globalAlpha = 1;
    c.fillStyle = color;
    c.font = titleFont;
    c.textBaseline = 'top';
    c.fillText(text, pad, pad);
    if (sub) {
      c.fillStyle = 'rgba(225, 240, 255, 0.82)';
      c.font = subFont;
      c.fillText(sub, pad, pad + 40);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  }, [text, sub, color]);

  const aspect = texture.image ? (texture.image as HTMLCanvasElement).width / (texture.image as HTMLCanvasElement).height : 4;
  const h = Math.max(0.04, size);
  const w = h * aspect;

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    // Distance fade: captions dissolve as the camera pulls away, so a wide shot
    // stays clean and a close shot gets the detail.
    const d = camera.position.distanceTo(mesh.getWorldPosition(new THREE.Vector3()));
    const near = h * 12;
    const far = h * 90;
    const a = 1 - Math.min(1, Math.max(0, (d - near) / Math.max(0.001, far - near)));
    (mesh.material as THREE.MeshBasicMaterial).opacity = 0.15 + a * 0.85;
  });

  return (
    <Billboard position={position as any}>
      <mesh ref={ref} renderOrder={5}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </Billboard>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
