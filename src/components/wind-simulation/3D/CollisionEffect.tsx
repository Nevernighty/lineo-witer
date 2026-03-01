import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface CollisionEffectProps {
  position: [number, number, number];
  intensity: number;
  deflection?: [number, number, number];
  onComplete: () => void;
}

// Intensity-based color: weak=green, medium=yellow, strong=red-orange
const getImpactColor = (intensity: number): string => {
  if (intensity < 0.5) return '#44ff44';
  if (intensity < 1.2) return '#ffcc22';
  return '#ff6420';
};

export const CollisionEffect: React.FC<CollisionEffectProps> = ({ 
  position, intensity, deflection, onComplete 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(0.1);
  const [opacity, setOpacity] = useState(1);
  const startTime = useRef(Date.now());
  const sparksRef = useRef(
    Array.from({ length: 5 }, () => ({
      dir: [
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 2
      ] as [number, number, number],
      speed: 0.5 + Math.random() * 1.5,
    }))
  );

  const color = getImpactColor(intensity);

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    const duration = 0.8;
    const progress = Math.min(elapsed / duration, 1);

    const newScale = 0.1 + progress * intensity * 2;
    setScale(newScale);

    const newOpacity = Math.max(0, 1 - progress * progress);
    setOpacity(newOpacity);

    if (progress >= 1) {
      onComplete();
    }
  });

  const showDeflectionArrows = deflection && opacity > 0.3;

  return (
    <group ref={groupRef} position={position}>
      {/* Core flash */}
      <Sphere args={[scale * 0.4, 12, 12]}>
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.9} />
      </Sphere>

      {/* Shockwave ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[scale * 0.6, scale * 0.8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Expanding outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[scale * 1.0, scale * 1.15, 24]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Spark particles flying outward */}
      {sparksRef.current.map((spark, i) => {
        const elapsed = (Date.now() - startTime.current) / 1000;
        const sparkProgress = Math.min(elapsed / 0.6, 1);
        const sx = spark.dir[0] * spark.speed * sparkProgress * intensity;
        const sy = spark.dir[1] * spark.speed * sparkProgress * intensity;
        const sz = spark.dir[2] * spark.speed * sparkProgress * intensity;
        const sparkOpacity = Math.max(0, 1 - sparkProgress * 1.3);
        return (
          <Sphere key={i} args={[0.12, 6, 6]} position={[sx, sy, sz]}>
            <meshBasicMaterial color={color} transparent opacity={sparkOpacity * 0.8} />
          </Sphere>
        );
      })}

      {/* Deflection direction arrows */}
      {showDeflectionArrows && deflection && (
        <group>
          {[0, 1, 2].map((i) => {
            const spread = (i - 1) * 0.4;
            const arrowLen = 1.5 * intensity;
            const dx = deflection[0] * arrowLen;
            const dy = deflection[1] * arrowLen + spread * 0.3;
            const dz = deflection[2] * arrowLen + spread * 0.2;
            // Point cone in deflection direction
            const dir = new THREE.Vector3(deflection[0], deflection[1], deflection[2]).normalize();
            const quat = new THREE.Quaternion();
            quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            const euler = new THREE.Euler().setFromQuaternion(quat);
            return (
              <group key={`defl-${i}`} position={[dx * 0.5 + spread * 0.3, dy * 0.5, dz * 0.5]}>
                <mesh rotation={euler}>
                  <coneGeometry args={[0.15, 0.6, 4]} />
                  <meshBasicMaterial color="#00ffaa" transparent opacity={opacity * 0.6} />
                </mesh>
                <mesh rotation={[euler.x, euler.y, euler.z]} position={[-dir.x * 0.4, -dir.y * 0.4, -dir.z * 0.4]}>
                  <cylinderGeometry args={[0.05, 0.05, 0.6, 4]} />
                  <meshBasicMaterial color="#00ffaa" transparent opacity={opacity * 0.3} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
};

// Manager component
interface CollisionEffectsManagerProps {
  collisions: Array<{
    id: string;
    position: [number, number, number];
    intensity: number;
    deflection?: [number, number, number];
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
          deflection={collision.deflection}
          onComplete={() => onRemoveCollision(collision.id)}
        />
      ))}
    </group>
  );
};
