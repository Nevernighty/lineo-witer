import React, { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface LocalHit {
  id: string;
  position: [number, number, number];
  energy: number;
  age: number;
  maxAge: number;
}

interface LocalHitPopupProps {
  hit: LocalHit;
  onExpire: (id: string) => void;
}

const LocalHitPopup: React.FC<LocalHitPopupProps> = ({ hit, onExpire }) => {
  const posRef = useRef<[number, number, number]>([...hit.position]);

  useFrame((_, delta) => {
    hit.age += delta;
    posRef.current[1] += delta * 3; // float upward
    if (hit.age >= hit.maxAge) {
      onExpire(hit.id);
    }
  });

  const progress = Math.min(hit.age / hit.maxAge, 1);
  const opacity = 1 - progress;

  if (opacity <= 0) return null;

  // Color based on energy
  const color = hit.energy > 0.5 ? '#ef4444' : hit.energy > 0.2 ? '#f97316' : hit.energy > 0.05 ? '#eab308' : '#22c55e';

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
        }}
      >
        {hit.energy.toFixed(2)} Дж
      </div>
    </Html>
  );
};

interface LocalHitManagerProps {
  enabled: boolean;
}

export const LocalHitManager: React.FC<LocalHitManagerProps> = ({ enabled }) => {
  const [hits, setHits] = useState<LocalHit[]>([]);

  const addHit = useCallback((position: [number, number, number], energy: number) => {
    if (!enabled) return;
    setHits(prev => {
      const newHits = prev.length >= 15 ? prev.slice(1) : prev;
      return [...newHits, {
        id: `hit-${Date.now()}-${Math.random()}`,
        position: [...position],
        energy,
        age: 0,
        maxAge: 1.5,
      }];
    });
  }, [enabled]);

  const removeHit = useCallback((id: string) => {
    setHits(prev => prev.filter(h => h.id !== id));
  }, []);

  // Expose addHit via ref-like pattern using a global
  React.useEffect(() => {
    (window as any).__localHitAdd = addHit;
    return () => { delete (window as any).__localHitAdd; };
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
