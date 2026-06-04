import { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AIRFOILS } from '@/aero/airfoils';
import type { BladeGeometry } from '@/aero/bem';
import type { RotorType } from '@/aero/buildBladeGeometry';
import { SLIDER_BOUNDS } from '@/aero/presets';
import { MATERIALS, getMaterial } from '@/aero/materials';
import { Lang } from '@/utils/i18n';

interface Props {
  geometry: BladeGeometry;
  onChange: (g: BladeGeometry) => void;
  lang: Lang;
  materialId: string;
  onMaterialChange: (id: string) => void;
  rotorType: RotorType;
  onRotorTypeChange: (r: RotorType) => void;
  helicalDeg: number;
  onHelicalChange: (v: number) => void;
  heightOverDiameter?: number;
  onHeightOverDiameterChange: (v: number) => void;
}

const T = {
  ua: {
    airfoil: 'Профіль крила', rotor: 'Розміри ротора',
    span: 'Розмах R (м)', radius: 'Радіус ротора R (м)', height: 'Висота H/D',
    chordR: 'Хорда корінь (м)', chordT: 'Хорда кінчик (м)', chord: 'Хорда лопаті (м)',
    twist: 'Закрутка', twistR: 'Корінь (°)', twistT: 'Кінчик (°)',
    twistLaw: 'Закон закрутки', linear: 'Лінійний', optimal: 'Оптимальний (Betz)', schmitz: 'Schmitz',
    pitch: 'Загальний крок (°)', toeIn: 'Toe-in pitch (°)',
    blades: 'Кількість лопатей', buckets: 'Кількість ківшів',
    hub: 'Радіус втулки (м)', material: 'Матеріал',
    metrics: 'Розрахункові метрики', solidity: 'Солідність σ', AR: 'Подовження AR',
    area: 'Площа A', mass: 'Маса ротора (оцінка)', maxTip: 'Макс. лінійна швидкість',
    geometryGroup: 'Геометрія', materialGroup: 'Матеріал',
    family: 'Тип ротора', helical: 'Спіральна закрутка (°)', turns: 'Витки спіралі',
    showAirfoils: 'Деталі профілю',
    families: { hawt: 'HAWT (горизонт.)', 'vawt-h': 'Darrieus H', 'vawt-helical': 'Gorlov / QR (спіральний)', 'vawt-tropo': 'Φ Darrieus (тропоскейн)', 'vawt-savonius': 'Savonius', 'vawt-archimedes': 'Archimedes' },
  },
  en: {
    airfoil: 'Airfoil profile', rotor: 'Rotor dimensions',
    span: 'Span R (m)', radius: 'Rotor radius R (m)', height: 'H/D ratio',
    chordR: 'Chord root (m)', chordT: 'Chord tip (m)', chord: 'Blade chord (m)',
    twist: 'Twist', twistR: 'Root (°)', twistT: 'Tip (°)',
    twistLaw: 'Twist law', linear: 'Linear', optimal: 'Optimal (Betz)', schmitz: 'Schmitz',
    pitch: 'Collective pitch (°)', toeIn: 'Toe-in pitch (°)',
    blades: 'Blade count', buckets: 'Bucket count',
    hub: 'Hub radius (m)', material: 'Material',
    metrics: 'Derived metrics', solidity: 'Solidity σ', AR: 'Aspect ratio AR',
    area: 'Swept area A', mass: 'Rotor mass (est.)', maxTip: 'Max tip speed',
    geometryGroup: 'Geometry', materialGroup: 'Material',
    family: 'Rotor family', helical: 'Helical wrap (°)', turns: 'Spiral turns',
    showAirfoils: 'Airfoil details',
    families: { hawt: 'HAWT (horizontal)', 'vawt-h': 'Darrieus H', 'vawt-helical': 'Gorlov / QR (helical)', 'vawt-tropo': 'Φ Darrieus (troposkein)', 'vawt-savonius': 'Savonius', 'vawt-archimedes': 'Archimedes' },
  },
};

function Row({ label, value, unit, children }: { label: string; value: string; unit?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between bl-meta">
        <Label className="text-muted-foreground truncate pr-2">{label}</Label>
        <span className="font-mono text-primary tabular-nums shrink-0">{value}{unit ? ` ${unit}` : ''}</span>
      </div>
      {children}
    </div>
  );
}

function Chip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded border border-border/40 bg-card/40 px-1.5 py-1 min-w-0">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">{label}</div>
      <div className={`font-mono text-[11px] ${accent ? 'text-primary' : 'text-foreground'} tabular-nums truncate`}>{value}</div>
    </div>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-md border border-border/40 bg-card/20 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold hover:bg-card/40 transition">
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <span className="truncate">{title}</span>
      </button>
      {open && <div className="p-2 pt-1 space-y-2.5">{children}</div>}
    </section>
  );
}

export function GeometryPanel({
  geometry: g, onChange, lang, materialId, onMaterialChange,
  rotorType, onRotorTypeChange, helicalDeg, onHelicalChange,
  heightOverDiameter, onHeightOverDiameterChange,
}: Props) {
  const t = T[lang];
  const set = <K extends keyof BladeGeometry>(k: K, v: BladeGeometry[K]) => onChange({ ...g, [k]: v });

  const isVAWT = rotorType !== 'hawt';
  const isSavonius = rotorType === 'vawt-savonius';
  const isArchimedes = rotorType === 'vawt-archimedes';
  const isHelical = rotorType === 'vawt-helical' || isArchimedes;
  const showAirfoil = !isSavonius && !isArchimedes;
  const showTwistLaw = !isVAWT;

  const material = getMaterial(materialId);
  const derived = useMemo(() => {
    const H = (heightOverDiameter ?? (isSavonius ? 2 : isArchimedes ? 1.8 : 1)) * g.tipRadius * 2;
    const A = isVAWT ? 2 * g.tipRadius * H : Math.PI * g.tipRadius * g.tipRadius;
    const avgChord = isSavonius || isArchimedes ? g.chordRoot : (g.chordRoot + g.chordTip) / 2;
    const sigma = isVAWT
      ? (g.nBlades * avgChord) / g.tipRadius
      : (g.nBlades * avgChord) / (Math.PI * g.tipRadius);
    const span = isVAWT ? H : g.tipRadius - g.rootRadius;
    const AR = span / Math.max(0.01, avgChord);
    const volPerBlade = 0.685 * (g.airfoil.thickness / 100) * avgChord * avgChord * span * 0.35;
    const mass = volPerBlade * g.nBlades * material.density;
    return { A, sigma, AR, mass };
  }, [g, material, isVAWT, isSavonius, isArchimedes, heightOverDiameter]);

  const [airfoilOpen, setAirfoilOpen] = useState(false);

  return (
    <div className="space-y-2.5 p-2 text-xs min-w-0">
      {/* Family selector — compact pill row */}
      <Section title={t.family}>
        <Select value={rotorType} onValueChange={(v) => onRotorTypeChange(v as RotorType)}>
          <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[100]">
            {(Object.keys(t.families) as RotorType[]).map(k => (
              <SelectItem key={k} value={k} className="text-[11px]">{t.families[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      {/* Airfoil — compact, collapsible details */}
      {showAirfoil && (
        <section className="rounded-md border border-border/40 bg-card/20 p-2 space-y-1.5">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t.airfoil}</span>
            <button onClick={() => setAirfoilOpen(o => !o)}
              className="text-[10px] text-primary/80 hover:text-primary flex items-center gap-0.5">
              {airfoilOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {t.showAirfoils}
            </button>
          </div>
          <Select value={g.airfoil.id} onValueChange={(id) => set('airfoil', AIRFOILS.find(a => a.id === id) || AIRFOILS[0])}>
            <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72 z-[100]">
              {AIRFOILS.map(a => (
                <SelectItem key={a.id} value={a.id} className="text-[11px]">
                  {a.name} <span className="text-muted-foreground">· t/c {a.thickness}%</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {airfoilOpen && (
            <>
              <p className="text-[10px] text-muted-foreground italic leading-snug">{g.airfoil.notes}</p>
              <div className="grid grid-cols-3 gap-1">
                <Chip label="t/c" value={`${g.airfoil.thickness}%`} />
                <Chip label="α stall" value={`${g.airfoil.alphaStall}°`} />
                <Chip label="cl₀" value={g.airfoil.cl0.toFixed(2)} />
              </div>
            </>
          )}
        </section>
      )}

      {/* Geometry — family-aware fields */}
      <Section title={t.geometryGroup}>
        <Row label={isVAWT ? t.radius : t.span} value={g.tipRadius.toFixed(2)} unit="m">
          <Slider min={SLIDER_BOUNDS.tipRadius.min} max={SLIDER_BOUNDS.tipRadius.max} step={SLIDER_BOUNDS.tipRadius.step}
            value={[g.tipRadius]} onValueChange={([v]) => set('tipRadius', v)} />
        </Row>

        {isVAWT && (
          <Row label={t.height} value={(heightOverDiameter ?? 1).toFixed(2)}>
            <Slider min={0.4} max={3} step={0.05}
              value={[heightOverDiameter ?? 1]} onValueChange={([v]) => onHeightOverDiameterChange(v)} />
          </Row>
        )}

        {!isVAWT && (
          <Row label={t.hub} value={g.rootRadius.toFixed(2)} unit="m">
            <Slider min={SLIDER_BOUNDS.rootRadius.min} max={SLIDER_BOUNDS.rootRadius.max} step={SLIDER_BOUNDS.rootRadius.step}
              value={[g.rootRadius]} onValueChange={([v]) => set('rootRadius', v)} />
          </Row>
        )}

        {!isVAWT ? (
          <>
            <Row label={t.chordR} value={g.chordRoot.toFixed(2)} unit="m">
              <Slider min={SLIDER_BOUNDS.chordRoot.min} max={SLIDER_BOUNDS.chordRoot.max} step={SLIDER_BOUNDS.chordRoot.step}
                value={[g.chordRoot]} onValueChange={([v]) => set('chordRoot', v)} />
            </Row>
            <Row label={t.chordT} value={g.chordTip.toFixed(2)} unit="m">
              <Slider min={SLIDER_BOUNDS.chordTip.min} max={SLIDER_BOUNDS.chordTip.max} step={SLIDER_BOUNDS.chordTip.step}
                value={[g.chordTip]} onValueChange={([v]) => set('chordTip', v)} />
            </Row>
          </>
        ) : (
          <Row label={t.chord} value={g.chordRoot.toFixed(2)} unit="m">
            <Slider min={SLIDER_BOUNDS.chordRoot.min} max={Math.max(SLIDER_BOUNDS.chordRoot.max, g.tipRadius)} step={0.02}
              value={[g.chordRoot]} onValueChange={([v]) => onChange({ ...g, chordRoot: v, chordTip: v })} />
          </Row>
        )}

        <Row label={isSavonius ? t.buckets : t.blades} value={String(g.nBlades)}>
          <Slider min={isSavonius ? 2 : 1} max={isSavonius ? 4 : SLIDER_BOUNDS.nBlades.max} step={1}
            value={[g.nBlades]} onValueChange={([v]) => set('nBlades', v)} />
        </Row>
      </Section>

      {/* Twist — HAWT only */}
      {showTwistLaw && (
        <Section title={t.twist}>
          <Row label={t.twistR} value={g.twistRoot.toFixed(1)} unit="°">
            <Slider min={SLIDER_BOUNDS.twistRoot.min} max={SLIDER_BOUNDS.twistRoot.max} step={SLIDER_BOUNDS.twistRoot.step}
              value={[g.twistRoot]} onValueChange={([v]) => set('twistRoot', v)} />
          </Row>
          <Row label={t.twistT} value={g.twistTip.toFixed(1)} unit="°">
            <Slider min={SLIDER_BOUNDS.twistTip.min} max={SLIDER_BOUNDS.twistTip.max} step={SLIDER_BOUNDS.twistTip.step}
              value={[g.twistTip]} onValueChange={([v]) => set('twistTip', v)} />
          </Row>
          <div className="space-y-1">
            <Label className="bl-meta text-muted-foreground">{t.twistLaw}</Label>
            <Select value={g.twistLaw} onValueChange={(v) => set('twistLaw', v as BladeGeometry['twistLaw'])}>
              <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[100]">
                <SelectItem value="linear" className="text-[11px]">{t.linear}</SelectItem>
                <SelectItem value="optimal" className="text-[11px]">{t.optimal}</SelectItem>
                <SelectItem value="schmitz" className="text-[11px]">{t.schmitz}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Row label={t.pitch} value={g.pitch.toFixed(1)} unit="°">
            <Slider min={SLIDER_BOUNDS.pitch.min} max={SLIDER_BOUNDS.pitch.max} step={SLIDER_BOUNDS.pitch.step}
              value={[g.pitch]} onValueChange={([v]) => set('pitch', v)} />
          </Row>
        </Section>
      )}

      {/* VAWT-specific: toe-in pitch + helical wrap */}
      {isVAWT && !isSavonius && (
        <Section title={t.twist}>
          <Row label={t.toeIn} value={g.pitch.toFixed(1)} unit="°">
            <Slider min={-10} max={15} step={0.5}
              value={[g.pitch]} onValueChange={([v]) => set('pitch', v)} />
          </Row>
          {isHelical && (
            <Row label={isArchimedes ? t.turns : t.helical} value={isArchimedes ? (helicalDeg / 360).toFixed(2) : helicalDeg.toFixed(0)} unit={isArchimedes ? '' : '°'}>
              <Slider min={isArchimedes ? 180 : 0} max={isArchimedes ? 1080 : 240} step={5}
                value={[helicalDeg]} onValueChange={([v]) => onHelicalChange(v)} />
            </Row>
          )}
        </Section>
      )}

      {/* Material */}
      <Section title={t.materialGroup} defaultOpen={false}>
        <Select value={materialId} onValueChange={onMaterialChange}>
          <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[100]">
            {MATERIALS.map(m => (
              <SelectItem key={m.id} value={m.id} className="text-[11px]">
                {lang === 'ua' ? m.nameUA : m.nameEN} · {m.density} kg/m³
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground italic leading-snug">{lang === 'ua' ? material.notesUA : material.notesEN}</p>
        <div className="grid grid-cols-2 gap-1">
          <Chip label="E" value={`${material.youngsModulus} GPa`} />
          <Chip label="σ ult" value={`${material.ultimateStress} MPa`} />
          <Chip label={t.maxTip} value={`${material.maxTipSpeed} m/s`} />
          <Chip label="ρ" value={`${material.density} kg/m³`} />
        </div>
      </Section>

      {/* Derived metrics */}
      <Section title={t.metrics} defaultOpen>
        <div className="grid grid-cols-2 gap-1">
          <Chip label={t.area} value={`${derived.A.toFixed(1)} m²`} accent />
          <Chip label={t.solidity} value={derived.sigma.toFixed(3)} accent />
          <Chip label={t.AR} value={derived.AR.toFixed(1)} />
          <Chip label={t.mass} value={`${derived.mass < 1 ? derived.mass.toFixed(2) : derived.mass.toFixed(0)} kg`} />
        </div>
      </Section>
    </div>
  );
}
