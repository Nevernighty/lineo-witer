import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { WindParticle } from '../types';

interface Particle3DProps {
  particle: WindParticle;
  onUpdate: (particle: WindParticle) => void;
}

export const Particle3D: React.FC<Particle3DProps> = ({ particle, onUpdate }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create material based on particle state
  const material = useMemo(() => {
    const color = particle.hasCollided ? '#ff6420' : '#39ff14';
    return new THREE.MeshBasicMaterial({ 
      color,
      transparent: true,
      opacity: 0.8
    });
  }, [particle.hasCollided]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(particle.x, particle.y, particle.z);
      meshRef.current.scale.setScalar(particle.size);
      
      // Update material color if collision state changed
      if (particle.hasCollided) {
        (meshRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xff6420);
      } else {
        (meshRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x39ff14);
      }
    }
  });

  return (
    <group>
      {/* Particle Trail */}
      {particle.trail && particle.trail.length > 1 && (
        <Trail
          width={particle.size * 0.5}
          color={particle.hasCollided ? '#ff6420' : '#39ff14'}
          length={8}
          decay={1}
          local={false}
          stride={0}
          interval={1}
          target={meshRef}
          attenuation={(width) => width}
        />
      )}
      
      {/* Main Particle */}
      <Sphere
        ref={meshRef}
        args={[0.1, 8, 8]}
        material={material}
        position={[particle.x, particle.y, particle.z]}
      />
      
      {/* Collision Glow Effect */}
      {particle.hasCollided && (
        <Sphere
          args={[0.15, 8, 8]}
          position={[particle.x, particle.y, particle.z]}
        >
          <meshBasicMaterial
            color="#ff6420"
            transparent
            opacity={0.3}
          />
        </Sphere>
      )}
    </group>
  );
};