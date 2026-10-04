import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { unzipSync } from 'fflate';
import { Upload, X, Check } from 'lucide-react';
import type { RotorType } from '@/aero/buildBladeGeometry';
import type { Lang } from '@/utils/i18n';

export interface ModelAnalysis {
  name: string;
  parts: number;
  triangles: number;
  units: 'mm' | 'm';
  size: [number, number, number];   // metres
  axis: 'x' | 'y' | 'z';
  rotorType: RotorType;
  radius: number;                   // m
  heightOverDiameter: number;
  bladesGuess: number;
  confidence: number;               // 0..1
}

const T = {
  ua: { upload: 'Завантажити модель', title: 'Власна модель', drop: 'Перетягни .glb / .stl / .zip або натисни', apply: 'Застосувати до ротора', parts: 'Частин', tris: 'Трикутників', units: 'Одиниці', size: 'Габарит', axis: 'Вісь обертання', type: 'Розпізнаний тип', R: 'Радіус', blades: 'Лопатей (оцінка)', conf: 'Впевненість', err: 'Не вдалося прочитати файл' },
  en: { upload: 'Upload model', title: 'Custom model', drop: 'Drop .glb / .stl / .zip or click', apply: 'Apply to rotor', parts: 'Parts', tris: 'Triangles', units: 'Units', size: 'Size', axis: 'Spin axis', type: 'Detected type', R: 'Radius', blades: 'Blades (est.)', conf: 'Confidence', err: 'Could not read file' },
};

const TYPE_LABEL: Record<RotorType, string> = {
  hawt: 'HAWT', 'vawt-h': 'Darrieus H', 'vawt-helical': 'Gorlov', 'vawt-tropo': 'Φ Darrieus',
  'vawt-savonius': 'Savonius', 'vawt-archimedes': 'Archimedes',
};

async function loadAny(file: File): Promise<THREE.Object3D> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const buf = await file.arrayBuffer();
  if (ext === 'stl') {
    const g = new STLLoader().parse(buf);
    g.computeVertexNormals();
    return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#cfd8dc', metalness: 0.2, roughness: 0.5 }));
  }
  if (ext === 'glb' || ext === 'gltf') {
    const gltf = await new GLTFLoader().parseAsync(buf, '');
    return gltf.scene;
  }
  if (ext === 'zip') {
    const files = unzipSync(new Uint8Array(buf));
    const group = new THREE.Group();
    for (const [name, data] of Object.entries(files)) {
      const e = name.split('.').pop()?.toLowerCase();
      if (name.includes('__MACOSX')) continue;
      const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
      if (e === 'stl') {
        const g = new STLLoader().parse(ab); g.computeVertexNormals();
        const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#cfd8dc', metalness: 0.2, roughness: 0.5 }));
        m.name = name; group.add(m);
      } else if (e === 'glb') {
        const gltf = await new GLTFLoader().parseAsync(ab, ''); group.add(gltf.scene);
      }
    }
    if (!group.children.length) throw new Error('empty zip');
    return group;
  }
  throw new Error('unsupported');
}

/** Geometry-based recognition: bbox proportions, PCA of vertices around the spin axis, angular lobe count. */
function analyse(obj: THREE.Object3D, name: string): ModelAnalysis {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const s = box.getSize(new THREE.Vector3());
  const c = box.getCenter(new THREE.Vector3());
  let parts = 0, tris = 0;
  const pts: THREE.Vector3[] = [];
  obj.traverse(o => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    parts++;
    const p = m.geometry.attributes.position;
    tris += m.geometry.index ? m.geometry.index.count / 3 : p.count / 3;
    const step = Math.max(1, Math.floor(p.count / 4000));
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i += step) pts.push(v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).sub(c).clone());
  });
  const maxDim = Math.max(s.x, s.y, s.z);
  const units: 'mm' | 'm' = maxDim > 20 ? 'mm' : 'm';
  const k = units === 'mm' ? 0.001 : 1;
  const dims: Array<['x' | 'y' | 'z', number]> = [['x', s.x], ['y', s.y], ['z', s.z]];
  // Spin axis = the axis around which the cross-section is most circular (two other dims ~ equal).
  let best: 'x' | 'y' | 'z' = 'y', bestScore = Infinity;
  for (const [ax] of dims) {
    const o = dims.filter(d => d[0] !== ax).map(d => d[1]);
    const score = Math.abs(o[0] - o[1]) / Math.max(1e-6, Math.max(o[0], o[1]));
    if (score < bestScore) { bestScore = score; best = ax; }
  }
  const axLen = s[best];
  const others = dims.filter(d => d[0] !== best).map(d => d[1]);
  const D = Math.max(...others);
  const HD = axLen / Math.max(1e-6, D);
  // Angular lobe count: histogram of mass in the plane ⟂ axis (outer 50% radius only).
  const bins = new Array(36).fill(0);
  const uKey = best === 'x' ? ['y', 'z'] : best === 'y' ? ['x', 'z'] : ['x', 'y'];
  for (const p of pts) {
    const a = (p as any)[uKey[0]], b = (p as any)[uKey[1]];
    if (Math.hypot(a, b) < D * 0.25) continue;
    bins[Math.floor(((Math.atan2(b, a) + Math.PI) / (2 * Math.PI)) * 36) % 36]++;
  }
  const mean = bins.reduce((x, y) => x + y, 0) / 36 || 1;
  let lobes = 0;
  for (let i = 0; i < 36; i++) {
    const p = bins[(i + 35) % 36], n = bins[(i + 1) % 36];
    if (bins[i] > mean * 1.25 && bins[i] >= p && bins[i] > n) lobes++;
  }
  const bladesGuess = Math.min(7, Math.max(2, lobes || 3));
  let rotorType: RotorType;
  if (best !== 'y' && HD < 0.45) rotorType = 'hawt';
  else if (best !== 'y' && HD >= 0.45) rotorType = 'vawt-archimedes';
  else if (HD > 1.6 && bladesGuess <= 2) rotorType = 'vawt-savonius';
  else if (HD > 1.2) rotorType = 'vawt-helical';
  else rotorType = 'vawt-h';
  return {
    name, parts, triangles: Math.round(tris), units,
    size: [s.x * k, s.y * k, s.z * k], axis: best, rotorType,
    radius: (D / 2) * k, heightOverDiameter: +HD.toFixed(2), bladesGuess,
    confidence: Math.max(0.2, Math.min(0.95, 1 - bestScore)),
  };
}

function Spinner({ obj, axis }: { obj: THREE.Object3D; axis: 'x' | 'y' | 'z' }) {
  const ref = useRef<THREE.Group>(null);
  const fitted = useMemo(() => {
    const box = new THREE.Box3().setFromObject(obj);
    const c = box.getCenter(new THREE.Vector3());
    const sc = 2 / Math.max(1e-6, box.getSize(new THREE.Vector3()).length());
    const g = new THREE.Group(); const inner = obj.clone(); inner.position.sub(c);
    g.add(inner); g.scale.setScalar(sc * 1.6); return g;
  }, [obj]);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation[axis] += dt * 0.8; });
  return <group ref={ref}><primitive object={fitted} /></group>;
}

export function CustomModelImport({ lang, onApply, compact }: {
  lang: Lang; compact?: boolean;
  onApply: (a: ModelAnalysis) => void;
}) {
  const t = T[lang];
  const [open, setOpen] = useState(false);
  const [obj, setObj] = useState<THREE.Object3D | null>(null);
  const [info, setInfo] = useState<ModelAnalysis | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const handle = async (f?: File) => {
    if (!f) return;
    setBusy(true); setErr(null);
    try { const o = await loadAny(f); setObj(o); setInfo(analyse(o, f.name)); }
    catch { setErr(t.err); }
    finally { setBusy(false); }
  };
  useEffect(() => { if (!open) { setErr(null); } }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} title={t.upload}
        className="h-7 px-2 rounded bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground border border-border/40 flex items-center gap-1 flex-shrink-0 bl-text">
        <Upload className="w-3.5 h-3.5" />{!compact && <span className="hidden lg:inline">{t.upload}</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6" onClick={() => setOpen(false)}>
          <div className="w-full max-w-3xl max-h-[92dvh] overflow-y-auto rounded-xl border border-primary/25 bg-card/95 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
              <span className="bl-title">{t.title}</span>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-primary/10"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid md:grid-cols-[1fr_240px] gap-0">
              <div
                className="relative h-64 md:h-96 bg-background/60 cursor-pointer"
                onClick={() => !obj && input.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handle(e.dataTransfer.files[0]); }}
              >
                {obj && info ? (
                  <Canvas camera={{ position: [3, 2, 3], fov: 45 }}>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[4, 6, 3]} intensity={1.4} />
                    <Spinner obj={obj} axis={info.axis} />
                    <gridHelper args={[6, 12, '#1f3a2b', '#14202a']} position={[0, -1.6, 0]} />
                    <OrbitControls makeDefault />
                  </Canvas>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bl-text border-2 border-dashed border-border/50 m-3 rounded-lg">
                    <Upload className="w-6 h-6" />
                    {busy ? '…' : t.drop}
                  </div>
                )}
                <input ref={input} type="file" accept=".glb,.gltf,.stl,.zip" className="hidden" onChange={e => handle(e.target.files?.[0])} />
              </div>
              <div className="p-3 space-y-1.5 bl-text">
                {err && <div className="text-destructive">{err}</div>}
                {info && (
                  <>
                    <div className="font-mono truncate text-foreground" title={info.name}>{info.name}</div>
                    {[
                      [t.type, TYPE_LABEL[info.rotorType]],
                      [t.axis, info.axis.toUpperCase()],
                      [t.R, `${info.radius.toFixed(2)} m`],
                      ['H/D', info.heightOverDiameter.toFixed(2)],
                      [t.blades, String(info.bladesGuess)],
                      [t.size, info.size.map(v => v.toFixed(2)).join(' × ') + ' m'],
                      [t.units, info.units],
                      [t.parts, String(info.parts)],
                      [t.tris, info.triangles.toLocaleString()],
                      [t.conf, `${Math.round(info.confidence * 100)}%`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 border-b border-border/20 pb-1">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-mono text-primary tabular-nums text-right">{v}</span>
                      </div>
                    ))}
                    <div className="flex gap-1.5 pt-2">
                      <button onClick={() => input.current?.click()} className="flex-1 h-8 rounded border border-border/50 hover:bg-card">
                        <Upload className="w-3.5 h-3.5 inline" />
                      </button>
                      <button onClick={() => { onApply(info); setOpen(false); }}
                        className="flex-[3] h-8 rounded bg-primary text-primary-foreground font-medium flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" />{t.apply}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
