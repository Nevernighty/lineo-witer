import React, { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface LocalHit {
  id: string;
  position: [number, number, number];
  energy: number;
  age: number;
  maxAge: number;
  isAbsorption: boolean;
}

interface LocalHitPopupProps {
  hit: LocalHit;
  onExpire: (id: string) => void;
}

const LocalHitPopup: React.FC<LocalHitPopupProps> = ({ hit, onExpire }) => {
  const posRef = useRef<[number, number, number]>([...hit.position]);

  useFrame((_, delta) => {
    hit.age += delta;
    // Absorption popups float up faster
    posRef.current[1] += delta * (hit.isAbsorption ? 4.5 : 2.5);
    // Collision popups shake slightly
    if (!hit.isAbsorption) {
      posRef.current[0] += Math.sin(hit.age * 30) * delta * 0.8;
    }
    if (hit.age >= hit.maxAge) {
      onExpire(hit.id);
    }
  });

  const progress = Math.min(hit.age / hit.maxAge, 1);
  const opacity = 1 - progress;

  if (opacity <= 0) return null;

  // GREEN for absorption, RED for collisions
  const color = hit.isAbsorption ? '#22c55e' : '#ef4444';
  const prefix = hit.isAbsorption ? '+' : '';

  return (
    <Html position={posRef.current} center style={{ pointerEvents: 'none' }}>
      <div
        className="rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-lg border"
        style={{
          backgroundColor: `rgba(0,0,0,${0.8 * opacity})`,
          borderColor: `${color}${Math.round(opacity * 99).toString().padStart(2, '0')}`,
          color,
          opacity,
          transform: `scale(${0.8 + (1 - progress) * 0.4})`,
          transition: 'none',
          whiteSpace: 'nowrap',
          boxShadow: hit.isAbsorption ? `0 0 8px ${color}${Math.round(opacity * 60).toString().padStart(2, '0')}` : undefined,
        }}
      >
        {prefix}{hit.energy.toFixed(2)} Дж
      </div>
    </Html>
  );
};

interface LocalHitManagerProps {
  enabled: boolean;
}

export const LocalHitManager: React.FC<LocalHitManagerProps> = ({ enabled }) => {
  const [hits, setHits] = useState<LocalHit[]>([]);

  const addHit = useCallback((position: [number, number, number], energy: number, isAbsorption: boolean = false) => {
    if (!enabled) return;
    setHits(prev => {
      const newHits = prev.length >= 15 ? prev.slice(1) : prev;
      return [...newHits, {
        id: `hit-${Date.now()}-${Math.random()}`,
        position: [...position],
        energy,
        age: 0,
        maxAge: isAbsorption ? 1.8 : 1.5,
        isAbsorption,
      }];
    });
  }, [enabled]);

  const removeHit = useCallback((id: string) => {
    setHits(prev => prev.filter(h => h.id !== id));
  }, []);

  // Expose addHit for collisions (RED)
  React.useEffect(() => {
    (window as any).__localHitAdd = (pos: [number, number, number], energy: number) => addHit(pos, energy, false);
    return () => { delete (window as any).__localHitAdd; };
  }, [addHit]);

  // Expose addHit for absorption (GREEN)
  React.useEffect(() => {
    (window as any).__localAbsorptionAdd = (pos: [number, number, number], energy: number) => addHit(pos, energy, true);
    return () => { delete (window as any).__localAbsorptionAdd; };
  }, [addHit]);

  if (!enabled) return null;

  return (
    <group>
      {hits.map(hit => (
        <LocalHitPopup key={hit.id} hit={hit} onExpire={removeHit} />
      ))}
    </group>
  );
};
