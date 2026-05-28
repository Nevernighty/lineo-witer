import { useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIRFOILS } from '@/aero/airfoils';
import type { BladeGeometry } from '@/aero/bem';
import { SLIDER_BOUNDS } from '@/aero/presets';
import { MATERIALS, getMaterial } from '@/aero/materials';
import { Lang } from '@/utils/i18n';

interface Props {
  geometry: BladeGeometry;
  onChange: (g: BladeGeometry) => void;
  lang: Lang;
  materialId: string;
  onMaterialChange: (id: string) => void;
}

const T = {
  ua: { airfoil: 'Профіль крила', rotor: 'Розміри ротора', span: 'Розмах R (м)', chordR: 'Хорда корінь (м)', chordT: 'Хорда кінчик (м)', twist: 'Закрутка', twistR: 'Корінь (°)', twistT: 'Кінчик (°)', twistLaw: 'Закон закрутки', linear: 'Лінійний', optimal: 'Оптимальний (Betz)', schmitz: 'Schmitz', pitch: 'Загальний крок (°)', blades: 'Кількість лопатей', hub: 'Радіус втулки (м)', material: 'Матеріал', metrics: 'Розрахункові метрики', solidity: 'Солідність σ', AR: 'Подовження AR', area: 'Площа A', mass: 'Маса ротора (оцінка)', maxTip: 'Макс. лінійна швидкість', notes: 'Опис', geometryGroup: 'Геометрія', materialGroup: 'Матеріал' },
  en: { airfoil: 'Airfoil profile', rotor: 'Rotor dimensions', span: 'Span R (m)', chordR: 'Chord root (m)', chordT: 'Chord tip (m)', twist: 'Twist', twistR: 'Root (°)', twistT: 'Tip (°)', twistLaw: 'Twist distribution', linear: 'Linear', optimal: 'Optimal (Betz)', schmitz: 'Schmitz', pitch: 'Collective pitch (°)', blades: 'Blade count', hub: 'Hub radius (m)', material: 'Material', metrics: 'Derived metrics', solidity: 'Solidity σ', AR: 'Aspect ratio AR', area: 'Swept area A', mass: 'Rotor mass (est.)', maxTip: 'Max tip speed', notes: 'Notes', geometryGroup: 'Geometry', materialGroup: 'Material' },
};

function Row({ label, value, unit, children }: { label: string; value: string; unit?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <Label className="text-muted-foreground">{label}</Label>
        <span className="font-mono text-primary tabular-nums">{value}{unit ? ` ${unit}` : ''}</span>
      </div>
      {children}
    </div>
  );
}

function Chip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border/40 bg-card/40 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-mono text-xs ${accent ? 'text-primary' : 'text-foreground'} tabular-nums`}>{value}</div>
    </div>
  );
}

export function GeometryPanel({ geometry: g, onChange, lang, materialId, onMaterialChange }: Props) {
  const t = T[lang];
  const set = <K extends keyof BladeGeometry>(k: K, v: BladeGeometry[K]) => onChange({ ...g, [k]: v });

  const material = getMaterial(materialId);
  const derived = useMemo(() => {
    const A = Math.PI * g.tipRadius * g.tipRadius;
    const avgChord = (g.chordRoot + g.chordTip) / 2;
    const sigma = (g.nBlades * avgChord) / (Math.PI * g.tipRadius);
    const span = g.tipRadius - g.rootRadius;
    const AR = span / Math.max(0.01, avgChord);
    // hollow shell estimate: 0.685*t/c*c^2*span * shell-fraction
    const volPerBlade = 0.685 * (g.airfoil.thickness / 100) * avgChord * avgChord * span * 0.35;
    const mass = volPerBlade * g.nBlades * material.density;
    return { A, sigma, AR, mass };
  }, [g, material]);

  return (
    <div className="space-y-4 p-3 text-xs">
      {/* Airfoil */}
      <section className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t.airfoil}</div>
        <Select value={g.airfoil.id} onValueChange={(id) => set('airfoil', AIRFOILS.find(a => a.id === id) || AIRFOILS[0])}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72 z-[100]">
            {AIRFOILS.map(a => (
              <SelectItem key={a.id} value={a.id} className="text-xs">
                {a.name} <span className="text-muted-foreground">· t/c {a.thickness}%</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground italic leading-snug">{g.airfoil.notes}</p>
      </section>

      {/* Geometry */}
      <section className="space-y-3 rounded-md border border-border/40 p-2.5 bg-card/20">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t.geometryGroup}</div>
        <Row label={t.span} value={g.tipRadius.toFixed(2)} unit="m">
          <Slider min={SLIDER_BOUNDS.tipRadius.min} max={SLIDER_BOUNDS.tipRadius.max} step={SLIDER_BOUNDS.tipRadius.step}
            value={[g.tipRadius]} onValueChange={([v]) => set('tipRadius', v)} />
        </Row>
        <Row label={t.hub} value={g.rootRadius.toFixed(2)} unit="m">
          <Slider min={SLIDER_BOUNDS.rootRadius.min} max={SLIDER_BOUNDS.rootRadius.max} step={SLIDER_BOUNDS.rootRadius.step}
            value={[g.rootRadius]} onValueChange={([v]) => set('rootRadius', v)} />
        </Row>
        <Row label={t.chordR} value={g.chordRoot.toFixed(2)} unit="m">
          <Slider min={SLIDER_BOUNDS.chordRoot.min} max={SLIDER_BOUNDS.chordRoot.max} step={SLIDER_BOUNDS.chordRoot.step}
            value={[g.chordRoot]} onValueChange={([v]) => set('chordRoot', v)} />
        </Row>
        <Row label={t.chordT} value={g.chordTip.toFixed(2)} unit="m">
          <Slider min={SLIDER_BOUNDS.chordTip.min} max={SLIDER_BOUNDS.chordTip.max} step={SLIDER_BOUNDS.chordTip.step}
            value={[g.chordTip]} onValueChange={([v]) => set('chordTip', v)} />
        </Row>
      </section>

      {/* Twist */}
      <section className="space-y-3 rounded-md border border-border/40 p-2.5 bg-card/20">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t.twist}</div>
        <Row label={t.twistR} value={g.twistRoot.toFixed(1)} unit="°">
          <Slider min={SLIDER_BOUNDS.twistRoot.min} max={SLIDER_BOUNDS.twistRoot.max} step={SLIDER_BOUNDS.twistRoot.step}
            value={[g.twistRoot]} onValueChange={([v]) => set('twistRoot', v)} />
        </Row>
        <Row label={t.twistT} value={g.twistTip.toFixed(1)} unit="°">
          <Slider min={SLIDER_BOUNDS.twistTip.min} max={SLIDER_BOUNDS.twistTip.max} step={SLIDER_BOUNDS.twistTip.step}
            value={[g.twistTip]} onValueChange={([v]) => set('twistTip', v)} />
        </Row>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">{t.twistLaw}</Label>
          <Select value={g.twistLaw} onValueChange={(v) => set('twistLaw', v as BladeGeometry['twistLaw'])}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[100]">
              <SelectItem value="linear" className="text-xs">{t.linear}</SelectItem>
              <SelectItem value="optimal" className="text-xs">{t.optimal}</SelectItem>
              <SelectItem value="schmitz" className="text-xs">{t.schmitz}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Row label={t.pitch} value={g.pitch.toFixed(1)} unit="°">
          <Slider min={SLIDER_BOUNDS.pitch.min} max={SLIDER_BOUNDS.pitch.max} step={SLIDER_BOUNDS.pitch.step}
            value={[g.pitch]} onValueChange={([v]) => set('pitch', v)} />
        </Row>
        <Row label={t.blades} value={String(g.nBlades)}>
          <Slider min={SLIDER_BOUNDS.nBlades.min} max={SLIDER_BOUNDS.nBlades.max} step={1}
            value={[g.nBlades]} onValueChange={([v]) => set('nBlades', v)} />
        </Row>
      </section>

      {/* Material */}
      <section className="space-y-2 rounded-md border border-border/40 p-2.5 bg-card/20">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t.materialGroup}</div>
        <Select value={materialId} onValueChange={onMaterialChange}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[100]">
            {MATERIALS.map(m => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                {lang === 'ua' ? m.nameUA : m.nameEN} · {m.density} kg/m³
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground italic leading-snug">{lang === 'ua' ? material.notesUA : material.notesEN}</p>
        <div className="grid grid-cols-2 gap-1.5">
          <Chip label="E" value={`${material.youngsModulus} GPa`} />
          <Chip label="σ ult" value={`${material.ultimateStress} MPa`} />
          <Chip label={t.maxTip} value={`${material.maxTipSpeed} m/s`} />
          <Chip label="ρ" value={`${material.density} kg/m³`} />
        </div>
      </section>

      {/* Derived metrics */}
      <section className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t.metrics}</div>
        <div className="grid grid-cols-2 gap-1.5">
          <Chip label={t.area} value={`${derived.A.toFixed(1)} m²`} accent />
          <Chip label={t.solidity} value={derived.sigma.toFixed(3)} accent />
          <Chip label={t.AR} value={derived.AR.toFixed(1)} />
          <Chip label={t.mass} value={`${derived.mass < 1 ? derived.mass.toFixed(2) : derived.mass.toFixed(0)} kg`} />
        </div>
      </section>
    </div>
  );
}
