// ASCII STL export for blade rotors. No new dependency — uses three's bundled STLExporter.
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import type { BladeGeometry } from './bem';
import { buildBladeGeometry } from './buildBladeGeometry';

export interface ExportOptions {
  mode: 'single' | 'rotor';
  scaleMM: boolean;    // multiply by 1000 to output in mm for slicers
  windSpeed: number;
  tsr: number;
  helical?: number;
  vawt?: boolean;
}

export function exportBladeSTL(g: BladeGeometry, opts: ExportOptions): string {
  const built = buildBladeGeometry(g, 'solid', opts.windSpeed, opts.tsr, { helical: opts.helical, vawt: opts.vawt });
  const group = new THREE.Group();
  const baseMat = new THREE.MeshBasicMaterial();

  if (opts.mode === 'single') {
    group.add(new THREE.Mesh(built.geometry, baseMat));
  } else {
    const N = g.nBlades;
    for (let i = 0; i < N; i++) {
      const m = new THREE.Mesh(built.geometry.clone(), baseMat);
      m.rotation.z = (i * 2 * Math.PI) / N;
      group.add(m);
    }
    // hub spinner
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(g.rootRadius * 0.9, g.rootRadius * 0.9, g.rootRadius * 1.4, 32),
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
