import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BladeViewer3D } from '@/components/blade-lab/BladeViewer3D';
import { GeometryPanel } from '@/components/blade-lab/GeometryPanel';
import { AeroAnalysis } from '@/components/blade-lab/AeroAnalysis';
import { MacroRegime } from '@/components/blade-lab/MacroRegime';
import { AIRFOILS } from '@/aero/airfoils';
import type { BladeGeometry } from '@/aero/bem';
import { Lang } from '@/utils/i18n';

const VIEW_MODES = [
  { id: 'solid', ua: 'Поверхня', en: 'Solid' },
  { id: 'wireframe', ua: 'Каркас', en: 'Wireframe' },
  { id: 'pressure', ua: 'Тиск Cp', en: 'Pressure Cp' },
  { id: 'stall', ua: 'Зони зриву', en: 'Stall zones' },
  { id: 'stress', ua: 'Напруги', en: 'Stress' },
] as const;

const PRESETS: Array<{ id: string; nameUA: string; nameEN: string; g: Partial<BladeGeometry> }> = [
  { id: 'nrel5', nameUA: 'NREL 5-MW', nameEN: 'NREL 5-MW', g: { tipRadius: 63, rootRadius: 1.5, chordRoot: 4.6, chordTip: 1.3, twistRoot: 13, twistTip: 0, nBlades: 3, pitch: 0, twistLaw: 'optimal' } },
  { id: 'iea15', nameUA: 'IEA 15-MW', nameEN: 'IEA 15-MW', g: { tipRadius: 120, rootRadius: 2.8, chordRoot: 5.2, chordTip: 0.9, twistRoot: 15, twistTip: -1, nBlades: 3, pitch: 0, twistLaw: 'optimal' } },
  { id: 'v90', nameUA: 'Vestas V90', nameEN: 'Vestas V90', g: { tipRadius: 45, rootRadius: 1.2, chordRoot: 3.4, chordTip: 0.7, twistRoot: 12, twistTip: 0, nBlades: 3, pitch: 0, twistLaw: 'linear' } },
  { id: 'urban', nameUA: 'Міський мікро-HAWT', nameEN: 'Urban micro-HAWT', g: { tipRadius: 1.5, rootRadius: 0.1, chordRoot: 0.25, chordTip: 0.08, twistRoot: 18, twistTip: 2, nBlades: 3, pitch: 0, twistLaw: 'schmitz' } },
];

const T = {
  ua: { back: 'Назад', title: 'Лабораторія форми лопаті', sub: 'Аеродинаміка · Геометрія · Макро-режим', geometry: 'Геометрія', viewer: '3D Перегляд', analysis: 'Аналіз', macro: 'Макро', view: 'Режим перегляду', windV: 'Швидкість вітру V∞', tsr: 'λ (TSR)', cinematic: 'Кінематична камера', vortex: 'Кінцеві вихори', stream: 'Лінії потоку', presets: 'Пресети турбін' },
  en: { back: 'Back', title: 'Blade Geometry Lab', sub: 'Aerodynamics · Geometry · Macro regime', geometry: 'Geometry', viewer: '3D Viewer', analysis: 'Analysis', macro: 'Macro', view: 'View mode', windV: 'Freestream V∞', tsr: 'λ (TSR)', cinematic: 'Cinematic camera', vortex: 'Tip vortex', stream: 'Streamlines', presets: 'Turbine presets' },
};

export default function BladeLab() {
  const [lang, setLang] = useState<Lang>('ua');
  const t = T[lang];

  const [geometry, setGeometry] = useState<BladeGeometry>({
    airfoil: AIRFOILS.find(a => a.id === 's809') || AIRFOILS[0],
    rootRadius: 1.5, tipRadius: 30, chordRoot: 2.5, chordTip: 0.6,
    twistRoot: 14, twistTip: 0, pitch: 0, nBlades: 3, twistLaw: 'optimal',
  });
  const [viewMode, setViewMode] = useState<typeof VIEW_MODES[number]['id']>('solid');
  const [windSpeed, setWindSpeed] = useState(10);
  const [tsr, setTsr] = useState(7);
  const [cinematic, setCinematic] = useState(false);
  const [showVortex, setShowVortex] = useState(true);
  const [showStream, setShowStream] = useState(false);
  const [scenarioId, setScenarioId] = useState('plain');

  const rho = 1.225;

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-card/60 backdrop-blur-md gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Link to="/" className="p-1.5 rounded hover:bg-primary/10"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <div className="text-sm font-bold">{t.title}</div>
            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">{t.sub}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)} className="text-[10px] bg-card border border-border/40 rounded px-1.5 py-1">
            <option value="">— {t.presets} —</option>
            {PRESETS.map(p => <option key={p.id} value={p.id}>{lang === 'ua' ? p.nameUA : p.nameEN}</option>)}
          </select>
          <button onClick={() => { const p = PRESETS.find(x => x.id === scenarioId); if (p) setGeometry(prev => ({ ...prev, ...p.g })); }}
            className="text-[10px] px-2 py-1 rounded bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30">Load</button>
          <div className="flex bg-card/60 rounded border border-border/30 p-0.5">
            <button onClick={() => setLang('ua')} className={`px-2 py-0.5 rounded text-[10px] font-semibold ${lang === 'ua' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>UA</button>
            <button onClick={() => setLang('en')} className={`px-2 py-0.5 rounded text-[10px] font-semibold ${lang === 'en' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>EN</button>
          </div>
        </div>
      </header>

      {/* Desktop layout */}
      <div className="hidden md:grid flex-1 min-h-0 grid-cols-[280px_1fr_320px]">
        <aside className="border-r border-border/40 overflow-y-auto"><GeometryPanel geometry={geometry} onChange={setGeometry} lang={lang} /></aside>
        <main className="relative">
          <BladeViewer3D geometry={geometry} viewMode={viewMode} windSpeed={windSpeed} tsr={tsr} cinematic={cinematic} showTipVortex={showVortex} showStreamlines={showStream} />
          <ViewerControls t={t} viewMode={viewMode} setViewMode={setViewMode} windSpeed={windSpeed} setWindSpeed={setWindSpeed} tsr={tsr} setTsr={setTsr} cinematic={cinematic} setCinematic={setCinematic} showVortex={showVortex} setShowVortex={setShowVortex} showStream={showStream} setShowStream={setShowStream} lang={lang} />
        </main>
        <aside className="border-l border-border/40 overflow-y-auto">
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8 m-1 mb-0"><TabsTrigger value="analysis" className="text-[11px]">{t.analysis}</TabsTrigger><TabsTrigger value="macro" className="text-[11px]">{t.macro}</TabsTrigger></TabsList>
            <TabsContent value="analysis" className="m-0"><AeroAnalysis geometry={geometry} lang={lang} windSpeed={windSpeed} tsr={tsr} rho={rho} /></TabsContent>
            <TabsContent value="macro" className="m-0"><MacroRegime geometry={geometry} scenarioId={scenarioId || 'plain'} onScenarioChange={setScenarioId} lang={lang} /></TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex-1 min-h-0 flex flex-col">
        <Tabs defaultValue="viewer" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-4 m-1 mb-0 h-8">
            <TabsTrigger value="geo" className="text-[10px]">{t.geometry}</TabsTrigger>
            <TabsTrigger value="viewer" className="text-[10px]">{t.viewer}</TabsTrigger>
            <TabsTrigger value="analysis" className="text-[10px]">{t.analysis}</TabsTrigger>
            <TabsTrigger value="macro" className="text-[10px]">{t.macro}</TabsTrigger>
          </TabsList>
          <TabsContent value="geo" className="flex-1 overflow-y-auto m-0"><GeometryPanel geometry={geometry} onChange={setGeometry} lang={lang} /></TabsContent>
          <TabsContent value="viewer" className="flex-1 m-0 relative min-h-0">
            <BladeViewer3D geometry={geometry} viewMode={viewMode} windSpeed={windSpeed} tsr={tsr} cinematic={cinematic} showTipVortex={showVortex} showStreamlines={showStream} />
            <ViewerControls t={t} viewMode={viewMode} setViewMode={setViewMode} windSpeed={windSpeed} setWindSpeed={setWindSpeed} tsr={tsr} setTsr={setTsr} cinematic={cinematic} setCinematic={setCinematic} showVortex={showVortex} setShowVortex={setShowVortex} showStream={showStream} setShowStream={setShowStream} lang={lang} />
          </TabsContent>
          <TabsContent value="analysis" className="flex-1 overflow-y-auto m-0"><AeroAnalysis geometry={geometry} lang={lang} windSpeed={windSpeed} tsr={tsr} rho={rho} /></TabsContent>
          <TabsContent value="macro" className="flex-1 overflow-y-auto m-0"><MacroRegime geometry={geometry} scenarioId={scenarioId || 'plain'} onScenarioChange={setScenarioId} lang={lang} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ViewerControls(props: any) {
  const { t, viewMode, setViewMode, windSpeed, setWindSpeed, tsr, setTsr, cinematic, setCinematic, showVortex, setShowVortex, showStream, setShowStream, lang } = props;
  return (
    <div className="absolute top-2 left-2 right-2 sm:right-auto sm:w-72 z-10 space-y-2">
      <div className="bg-card/70 backdrop-blur-md border border-border/40 rounded-md p-2">
        <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">{t.view}</div>
        <div className="grid grid-cols-3 gap-1">
          {VIEW_MODES.map(m => (
            <button key={m.id} onClick={() => setViewMode(m.id)} className={`text-[10px] px-1.5 py-1 rounded border ${viewMode === m.id ? 'bg-primary/20 text-primary border-primary/50' : 'bg-card/40 text-muted-foreground border-border/40 hover:border-primary/30'}`}>
              {lang === 'ua' ? m.ua : m.en}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-card/70 backdrop-blur-md border border-border/40 rounded-md p-2 space-y-2">
        <div>
          <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">{t.windV}</span><span className="font-mono text-primary">{windSpeed.toFixed(1)} m/s</span></div>
          <Slider min={2} max={25} step={0.5} value={[windSpeed]} onValueChange={([v]) => setWindSpeed(v)} />
        </div>
        <div>
          <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">{t.tsr}</span><span className="font-mono text-primary">{tsr.toFixed(1)}</span></div>
          <Slider min={1} max={14} step={0.5} value={[tsr]} onValueChange={([v]) => setTsr(v)} />
        </div>
        <div className="flex items-center justify-between text-[10px]"><Label className="text-muted-foreground">{t.cinematic}</Label><Switch checked={cinematic} onCheckedChange={setCinematic} /></div>
        <div className="flex items-center justify-between text-[10px]"><Label className="text-muted-foreground">{t.vortex}</Label><Switch checked={showVortex} onCheckedChange={setShowVortex} /></div>
        <div className="flex items-center justify-between text-[10px]"><Label className="text-muted-foreground">{t.stream}</Label><Switch checked={showStream} onCheckedChange={setShowStream} /></div>
      </div>
    </div>
  );
}
