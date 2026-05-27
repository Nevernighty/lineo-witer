import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIRFOILS } from '@/aero/airfoils';
import type { BladeGeometry } from '@/aero/bem';
import { Lang } from '@/utils/i18n';

interface Props {
  geometry: BladeGeometry;
  onChange: (g: BladeGeometry) => void;
  lang: Lang;
}

const T = {
  ua: { airfoil: 'Профіль крила', rotor: 'Розміри ротора', root: 'Корінь', tip: 'Кінчик', span: 'Розмах R (м)', chordR: 'Хорда корінь (м)', chordT: 'Хорда кінчик (м)', twistR: 'Закрутка корінь (°)', twistT: 'Закрутка кінчик (°)', twistLaw: 'Закон закрутки', linear: 'Лінійний', optimal: 'Оптимальний (Betz)', schmitz: 'Schmitz', pitch: 'Загальний крок (°)', blades: 'Кількість лопатей', notes: 'Опис', presets: 'Пресети' },
  en: { airfoil: 'Airfoil profile', rotor: 'Rotor dimensions', root: 'Root', tip: 'Tip', span: 'Span R (m)', chordR: 'Chord root (m)', chordT: 'Chord tip (m)', twistR: 'Twist root (°)', twistT: 'Twist tip (°)', twistLaw: 'Twist distribution', linear: 'Linear', optimal: 'Optimal (Betz)', schmitz: 'Schmitz', pitch: 'Collective pitch (°)', blades: 'Blade count', notes: 'Notes', presets: 'Presets' },
};

function Row({ label, value, unit, children }: { label: string; value: string; unit?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <Label className="text-muted-foreground">{label}</Label>
        <span className="font-mono text-primary">{value}{unit ? ` ${unit}` : ''}</span>
      </div>
      {children}
    </div>
  );
}

export function GeometryPanel({ geometry: g, onChange, lang }: Props) {
  const t = T[lang];
  const set = <K extends keyof BladeGeometry>(k: K, v: BladeGeometry[K]) => onChange({ ...g, [k]: v });

  return (
    <div className="space-y-4 p-3 text-xs">
      <div>
        <Label className="text-[11px] text-muted-foreground mb-1.5 block">{t.airfoil}</Label>
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
        <p className="text-[10px] text-muted-foreground mt-1 leading-tight italic">{g.airfoil.notes}</p>
      </div>

      <div className="space-y-3 border border-border/40 rounded-md p-2">
        <div className="text-[11px] font-semibold text-foreground">{t.rotor}</div>
        <Row label={t.span} value={g.tipRadius.toFixed(1)} unit="m">
          <Slider min={1} max={80} step={0.5} value={[g.tipRadius]} onValueChange={([v]) => set('tipRadius', v)} />
        </Row>
        <Row label={t.chordR} value={g.chordRoot.toFixed(2)} unit="m">
          <Slider min={0.2} max={6} step={0.05} value={[g.chordRoot]} onValueChange={([v]) => set('chordRoot', v)} />
        </Row>
        <Row label={t.chordT} value={g.chordTip.toFixed(2)} unit="m">
          <Slider min={0.05} max={3} step={0.05} value={[g.chordTip]} onValueChange={([v]) => set('chordTip', v)} />
        </Row>
      </div>

      <div className="space-y-3 border border-border/40 rounded-md p-2">
        <Row label={t.twistR} value={g.twistRoot.toFixed(1)} unit="°">
          <Slider min={-5} max={30} step={0.5} value={[g.twistRoot]} onValueChange={([v]) => set('twistRoot', v)} />
        </Row>
        <Row label={t.twistT} value={g.twistTip.toFixed(1)} unit="°">
          <Slider min={-10} max={15} step={0.5} value={[g.twistTip]} onValueChange={([v]) => set('twistTip', v)} />
        </Row>
        <div>
          <Label className="text-[11px] text-muted-foreground">{t.twistLaw}</Label>
          <Select value={g.twistLaw} onValueChange={(v) => set('twistLaw', v as BladeGeometry['twistLaw'])}>
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[100]">
              <SelectItem value="linear" className="text-xs">{t.linear}</SelectItem>
              <SelectItem value="optimal" className="text-xs">{t.optimal}</SelectItem>
              <SelectItem value="schmitz" className="text-xs">Schmitz</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Row label={t.pitch} value={g.pitch.toFixed(1)} unit="°">
        <Slider min={-10} max={30} step={0.5} value={[g.pitch]} onValueChange={([v]) => set('pitch', v)} />
      </Row>
      <Row label={t.blades} value={String(g.nBlades)}>
        <Slider min={1} max={5} step={1} value={[g.nBlades]} onValueChange={([v]) => set('nBlades', v)} />
      </Row>
    </div>
  );
}
