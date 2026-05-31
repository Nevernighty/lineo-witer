// ASCII STL export for blade rotors. No new dependency — uses three's bundled STLExporter.
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import type { BladeGeometry } from './bem';
import { buildBladeGeometry, buildSavoniusBucketGeometry, buildVAWTBladeGeometry, type RotorType } from './buildBladeGeometry';

export interface ExportOptions {
  mode: 'single' | 'rotor';
  scaleMM: boolean;    // multiply by 1000 to output in mm for slicers
  windSpeed: number;
  tsr: number;
  helical?: number;
  rotorType?: RotorType;
  heightOverDiameter?: number;
}

export function exportBladeSTL(g: BladeGeometry, opts: ExportOptions): string {
  const rotorType = opts.rotorType ?? 'hawt';
  const isVAWT = rotorType !== 'hawt';
  const height = g.tipRadius * 2 * (opts.heightOverDiameter ?? (rotorType === 'vawt-savonius' ? 2 : 1));
  const built = rotorType === 'vawt-savonius'
    ? buildSavoniusBucketGeometry(g, 'solid', { height })
    : isVAWT
      ? buildVAWTBladeGeometry(g, 'solid', rotorType as 'vawt-h' | 'vawt-helical' | 'vawt-tropo', { helicalTwist: opts.helical, height })
      : buildBladeGeometry(g, 'solid', opts.windSpeed, opts.tsr, { helicalTwist: opts.helical });
  const group = new THREE.Group();
  const baseMat = new THREE.MeshBasicMaterial();

  if (opts.mode === 'single') {
    group.add(new THREE.Mesh(built.geometry, baseMat));
  } else {
    const N = rotorType === 'vawt-savonius' ? 2 : g.nBlades;
    for (let i = 0; i < N; i++) {
      const m = new THREE.Mesh(built.geometry.clone(), baseMat);
      if (isVAWT) m.rotation.y = (i * 2 * Math.PI) / N;
      else m.rotation.z = (i * 2 * Math.PI) / N;
      group.add(m);
    }
    // hub spinner
    const hubGeom = isVAWT
      ? new THREE.CylinderGeometry(g.tipRadius * 0.06, g.tipRadius * 0.06, height * 1.05, 32)
      : new THREE.CylinderGeometry(g.rootRadius * 0.9, g.rootRadius * 0.9, g.rootRadius * 1.4, 32);
    const hub = new THREE.Mesh(
      hubGeom,
      baseMat
    );
    group.add(hub);
  }

  if (opts.scaleMM) group.scale.setScalar(1000);
  group.updateMatrixWorld(true);

  const exporter = new STLExporter();
  return exporter.parse(group);
}

export function downloadSTL(filename: string, content: string) {
  const blob = new Blob([content], { type: 'model/stl' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.stl') ? filename : filename + '.stl';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
