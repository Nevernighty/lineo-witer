import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface CollisionEffectProps {
  position: [number, number, number];
  intensity: number;
  onComplete: () => void;
}

export const CollisionEffect: React.FC<CollisionEffectProps> = ({ 
  position, 
  intensity,
  onComplete 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(0.1);
  const [opacity, setOpacity] = useState(1);
  const startTime = useRef(Date.now());

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    const duration = 0.5;
    const progress = Math.min(elapsed / duration, 1);

    // Volumetric expansion
    const newScale = 0.1 + progress * intensity * 2;
    setScale(newScale);

    // Fade out
    const newOpacity = Math.max(0, 1 - progress * progress);
    setOpacity(newOpacity);

    if (progress >= 1) {
      onComplete();
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Core flash */}
      <Sphere args={[scale * 0.5, 16, 16]}>
        <meshBasicMaterial
          color="#ff6420"
          transparent
          opacity={opacity * 0.9}
        />
      </Sphere>

      {/* Outer glow ring 1 */}
      <Sphere args={[scale * 0.8, 16, 16]}>
        <meshBasicMaterial
          color="#ff8844"
          transparent
          opacity={opacity * 0.4}
        />
      </Sphere>

      {/* Outer glow ring 2 */}
      <Sphere args={[scale * 1.2, 12, 12]}>
        <meshBasicMaterial
          color="#ffaa66"
          transparent
          opacity={opacity * 0.2}
        />
      </Sphere>

      {/* Volumetric light rays */}
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <mesh 
          key={angle}
          rotation={[0, (angle * Math.PI) / 180, Math.PI / 2]}
          position={[0, 0, 0]}
        >
          <cylinderGeometry args={[0.02, 0.02, scale * 2, 4]} />
          <meshBasicMaterial
            color="#ff6420"
            transparent
            opacity={opacity * 0.6}
          />
        </mesh>
      ))}
    </group>
  );
};

// Manager component to handle multiple collision effects
interface CollisionEffectsManagerProps {
  collisions: Array<{
    id: string;
    position: [number, number, number];
    intensity: number;
  }>;
  onRemoveCollision: (id: string) => void;
}

export const CollisionEffectsManager: React.FC<CollisionEffectsManagerProps> = ({
  collisions,
  onRemoveCollision
}) => {
  return (
    <group>
      {collisions.map((collision) => (
        <CollisionEffect
          key={collision.id}
          position={collision.position}
          intensity={collision.intensity}
          onComplete={() => onRemoveCollision(collision.id)}
        />
      ))}
    </group>
  );
};
