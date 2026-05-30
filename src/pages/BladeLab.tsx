import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RotateCcw, Wind } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { setActiveBladePreset } from '@/store/useBladePresetStore';
import type { RotorType } from '@/aero/buildBladeGeometry';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BladeViewer3D } from '@/components/blade-lab/BladeViewer3D';
import { GeometryPanel } from '@/components/blade-lab/GeometryPanel';
import { AeroAnalysis } from '@/components/blade-lab/AeroAnalysis';
import { MacroRegime } from '@/components/blade-lab/MacroRegime';
import { AIRFOILS } from '@/aero/airfoils';
import type { BladeGeometry } from '@/aero/bem';
import type { ViewMode } from '@/aero/buildBladeGeometry';
import { PRESETS, clampGeometry } from '@/aero/presets';
import { exportBladeSTL, downloadSTL } from '@/aero/stlExport';
import { Lang } from '@/utils/i18n';

const VIEW_MODES: Array<{ id: ViewMode; ua: string; en: string }> = [
  { id: 'solid', ua: 'Поверхня', en: 'Solid' },
  { id: 'wireframe', ua: 'Каркас', en: 'Wireframe' },
  { id: 'pressure', ua: 'Тиск Cp', en: 'Pressure Cp' },
  { id: 'stall', ua: 'Зони зриву', en: 'Stall' },
  { id: 'stress', ua: 'Напруги', en: 'Stress' },
  { id: 'chord', ua: 'Хорда/закрутка', en: 'Chord/twist' },
  { id: 'reynolds', ua: 'Re', en: 'Reynolds' },
  { id: 'xray', ua: 'Рентген', en: 'X-ray' },
];

const T = {
  ua: { back: 'Назад', title: 'Лабораторія форми лопаті', sub: 'Аеродинаміка · Геометрія · Макро · STL', geometry: 'Геометрія', viewer: '3D', analysis: 'Аналіз', macro: 'Макро', view: 'Режим перегляду', windV: 'Швидкість вітру V∞', tsr: 'λ (TSR)', cinematic: 'Кінематика', vortex: 'Кінцеві вихори', stream: 'Лінії потоку', postFX: 'Пост-обробка', presets: 'Пресети турбін', utility: 'Промислові', small: 'Малі', diy: 'DIY / 3D-друк', vawt: 'Вертикальні', reference: 'Еталонні', exportSingle: 'Експорт лопаті (STL)', exportRotor: 'Експорт ротора (STL)', scaleMM: 'у міліметрах', reset: 'Скинути', applySim: 'У симуляцію', appliedToast: 'Лопать застосована до симуляції' },
  en: { back: 'Back', title: 'Blade Geometry Lab', sub: 'Aerodynamics · Geometry · Macro · STL', geometry: 'Geometry', viewer: '3D', analysis: 'Analysis', macro: 'Macro', view: 'View mode', windV: 'Freestream V∞', tsr: 'λ (TSR)', cinematic: 'Cinematic', vortex: 'Tip vortex', stream: 'Streamlines', postFX: 'Post-FX', presets: 'Turbine presets', utility: 'Utility', small: 'Small', diy: 'DIY / 3D-print', vawt: 'Vertical-axis', reference: 'Reference', exportSingle: 'Export blade (STL)', exportRotor: 'Export rotor (STL)', scaleMM: 'in mm', reset: 'Reset', applySim: 'To simulation', appliedToast: 'Blade applied to simulation' },
};

const DEFAULT_GEOMETRY: BladeGeometry = {
  airfoil: AIRFOILS.find(a => a.id === 's809') || AIRFOILS[0],
  rootRadius: 1.5, tipRadius: 30, chordRoot: 2.5, chordTip: 0.6,
  twistRoot: 14, twistTip: 0, pitch: 0, nBlades: 3, twistLaw: 'optimal',
};

export default function BladeLab() {
  const [lang, setLang] = useState<Lang>('ua');
  const t = T[lang];

  const [geometry, setGeometry] = useState<BladeGeometry>(DEFAULT_GEOMETRY);
  const [materialId, setMaterialId] = useState('gfrp');
  const [viewMode, setViewMode] = useState<ViewMode>('solid');
  const [windSpeed, setWindSpeed] = useState(10);
  const [tsr, setTsr] = useState(7);
  const [cinematic, setCinematic] = useState(false);
  const [showVortex, setShowVortex] = useState(true);
  const [showStream, setShowStream] = useState(false);
  const [postFX, setPostFX] = useState(true);
  const [scenarioId, setScenarioId] = useState('plain');
  const [presetId, setPresetId] = useState('');
  const [exportScaleMM, setExportScaleMM] = useState(true);
  const [rotorType, setRotorType] = useState<RotorType>('hawt');
  const [heightOverDiameter, setHeightOverDiameter] = useState<number | undefined>(undefined);
  const [helicalDeg, setHelicalDeg] = useState<number>(0);
  const navigate = useNavigate();

  const rho = 1.225;

  const grouped = useMemo(() => {
    const groups: Record<string, typeof PRESETS> = { utility: [], small: [], diy: [], vawt: [], reference: [] };
    PRESETS.forEach(p => groups[p.category]?.push(p));
    return groups;
  }, []);

  const applyPreset = (id: string) => {
    setPresetId(id);
    const p = PRESETS.find(x => x.id === id);
    if (!p) return;
    const airfoil = AIRFOILS.find(a => a.id === p.geometry.airfoilId) || AIRFOILS[0];
    const { airfoilId, ...rest } = p.geometry;
    const clamped = clampGeometry(rest);
    setGeometry({ ...clamped, airfoil } as BladeGeometry);
    setMaterialId(p.materialId);
    setRotorType(p.rotorType ?? 'hawt');
    setHeightOverDiameter(p.heightOverDiameter);
    setHelicalDeg(p.helicalTwistDeg ?? 0);
  };

  const resetAll = () => {
    setGeometry(DEFAULT_GEOMETRY); setMaterialId('gfrp'); setPresetId('');
    setRotorType('hawt'); setHeightOverDiameter(undefined); setHelicalDeg(0);
  };

  const applyToSimulation = () => {
    const p = PRESETS.find(x => x.id === presetId);
    setActiveBladePreset({
      id: presetId || 'custom',
      nameUA: p?.nameUA || 'Користувацька',
      nameEN: p?.nameEN || 'Custom',
      geometry, materialId, rotorType,
      heightOverDiameter, helicalTwistDeg: helicalDeg,
    });
    toast({ title: t.appliedToast });
    setTimeout(() => navigate('/'), 600);
  };

  const exportSTL = useCallback((mode: 'single' | 'rotor') => {
    const name = presetId ? `${presetId}_${mode}` : `blade_${mode}`;
    const stl = exportBladeSTL(geometry, { mode, scaleMM: exportScaleMM, windSpeed, tsr });
    downloadSTL(name, stl);
  }, [geometry, presetId, exportScaleMM, windSpeed, tsr]);

  const viewerProps = {
    geometry, viewMode, windSpeed, tsr, cinematic, postFX,
    showTipVortex: showVortex, showStreamlines: showStream,
    rotorType, heightOverDiameter, helical: helicalDeg,
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-card/60 backdrop-blur-md gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/" className="p-1.5 rounded hover:bg-primary/10 flex-shrink-0"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">{t.title}</div>
            <div className="text-[10px] text-muted-foreground tracking-wider uppercase truncate">{t.sub}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Select value={presetId} onValueChange={applyPreset}>
            <SelectTrigger className="h-7 text-[11px] w-44"><SelectValue placeholder={`— ${t.presets} —`} /></SelectTrigger>
            <SelectContent className="z-[100] max-h-80">
              {(['utility', 'small', 'diy', 'vawt', 'reference'] as const).map(cat => (
                <SelectGroup key={cat}>
                  <SelectLabel className="text-[10px] uppercase tracking-wider">{t[cat]}</SelectLabel>
                  {grouped[cat].map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {lang === 'ua' ? p.nameUA : p.nameEN}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <button onClick={resetAll} title={t.reset}
            className="h-7 px-1.5 rounded bg-card/50 hover:bg-card text-muted-foreground border border-border/40 flex items-center">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1 px-1.5 h-7 rounded border border-border/40 bg-card/40">
            <Switch checked={exportScaleMM} onCheckedChange={setExportScaleMM} className="scale-75" />
            <span className="text-[10px] text-muted-foreground">{t.scaleMM}</span>
          </div>
          <button onClick={() => exportSTL('single')}
            className="h-7 px-2 text-[10px] rounded bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 flex items-center gap-1">
            <Download className="w-3 h-3" /> {t.exportSingle}
          </button>
          <button onClick={() => exportSTL('rotor')}
            className="h-7 px-2 text-[10px] rounded bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 flex items-center gap-1">
            <Download className="w-3 h-3" /> {t.exportRotor}
          </button>
          <div className="flex bg-card/60 rounded border border-border/30 p-0.5">
            <button onClick={() => setLang('ua')} className={`px-2 py-0.5 rounded text-[10px] font-semibold ${lang === 'ua' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>UA</button>
            <button onClick={() => setLang('en')} className={`px-2 py-0.5 rounded text-[10px] font-semibold ${lang === 'en' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>EN</button>
          </div>
        </div>
      </header>

      {/* Desktop */}
      <div className="hidden md:grid flex-1 min-h-0 grid-cols-[300px_1fr_340px]">
        <aside className="border-r border-border/40 overflow-y-auto scrollbar-thin">
          <GeometryPanel geometry={geometry} onChange={setGeometry} lang={lang} materialId={materialId} onMaterialChange={setMaterialId} />
        </aside>
        <main className="relative min-w-0">
          <BladeViewer3D {...viewerProps} />
          <ViewerControls
            t={t} viewMode={viewMode} setViewMode={setViewMode}
            windSpeed={windSpeed} setWindSpeed={setWindSpeed}
            tsr={tsr} setTsr={setTsr}
            cinematic={cinematic} setCinematic={setCinematic}
            showVortex={showVortex} setShowVortex={setShowVortex}
            showStream={showStream} setShowStream={setShowStream}
            postFX={postFX} setPostFX={setPostFX}
            lang={lang}
          />
          <HUD geometry={geometry} windSpeed={windSpeed} tsr={tsr} />
        </main>
        <aside className="border-l border-border/40 overflow-y-auto scrollbar-thin">
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8 m-1 mb-0">
              <TabsTrigger value="analysis" className="text-[11px]">{t.analysis}</TabsTrigger>
              <TabsTrigger value="macro" className="text-[11px]">{t.macro}</TabsTrigger>
            </TabsList>
            <TabsContent value="analysis" className="m-0">
              <AeroAnalysis geometry={geometry} lang={lang} windSpeed={windSpeed} tsr={tsr} rho={rho} materialId={materialId} />
            </TabsContent>
            <TabsContent value="macro" className="m-0">
              <MacroRegime geometry={geometry} scenarioId={scenarioId} onScenarioChange={setScenarioId} lang={lang} />
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex-1 min-h-0 flex flex-col">
        <Tabs defaultValue="viewer" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-4 m-1 mb-0 h-8">
            <TabsTrigger value="geo" className="text-[10px]">{t.geometry}</TabsTrigger>
            <TabsTrigger value="viewer" className="text-[10px]">{t.viewer}</TabsTrigger>
            <TabsTrigger value="analysis" className="text-[10px]">{t.analysis}</TabsTrigger>
            <TabsTrigger value="macro" className="text-[10px]">{t.macro}</TabsTrigger>
          </TabsList>
          <TabsContent value="geo" className="flex-1 overflow-y-auto scrollbar-thin m-0">
            <GeometryPanel geometry={geometry} onChange={setGeometry} lang={lang} materialId={materialId} onMaterialChange={setMaterialId} />
          </TabsContent>
          <TabsContent value="viewer" className="flex-1 m-0 relative min-h-0">
            <BladeViewer3D {...viewerProps} />
            <ViewerControls
              t={t} viewMode={viewMode} setViewMode={setViewMode}
              windSpeed={windSpeed} setWindSpeed={setWindSpeed}
              tsr={tsr} setTsr={setTsr}
              cinematic={cinematic} setCinematic={setCinematic}
              showVortex={showVortex} setShowVortex={setShowVortex}
              showStream={showStream} setShowStream={setShowStream}
              postFX={postFX} setPostFX={setPostFX}
              lang={lang}
            />
            <HUD geometry={geometry} windSpeed={windSpeed} tsr={tsr} />
          </TabsContent>
          <TabsContent value="analysis" className="flex-1 overflow-y-auto scrollbar-thin m-0">
            <AeroAnalysis geometry={geometry} lang={lang} windSpeed={windSpeed} tsr={tsr} rho={rho} materialId={materialId} />
          </TabsContent>
          <TabsContent value="macro" className="flex-1 overflow-y-auto scrollbar-thin m-0">
            <MacroRegime geometry={geometry} scenarioId={scenarioId} onScenarioChange={setScenarioId} lang={lang} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ViewerControls(props: any) {
  const { t, viewMode, setViewMode, windSpeed, setWindSpeed, tsr, setTsr, cinematic, setCinematic, showVortex, setShowVortex, showStream, setShowStream, postFX, setPostFX, lang } = props;
  return (
    <div className="absolute top-2 left-2 right-2 sm:right-auto sm:w-72 z-10 space-y-2 pointer-events-auto">
      <div className="bg-card/70 backdrop-blur-xl border border-primary/20 rounded-md p-2 shadow-lg">
        <div className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">{t.view}</div>
        <div className="grid grid-cols-4 gap-1">
          {VIEW_MODES.map(m => (
            <button key={m.id} onClick={() => setViewMode(m.id)}
              className={`text-[9px] px-1 py-1 rounded border transition ${viewMode === m.id ? 'bg-primary/25 text-primary border-primary/60' : 'bg-card/40 text-muted-foreground border-border/40 hover:border-primary/30'}`}>
              {lang === 'ua' ? m.ua : m.en}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-card/70 backdrop-blur-xl border border-primary/20 rounded-md p-2 space-y-2 shadow-lg">
        <div>
          <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">{t.windV}</span><span className="font-mono text-primary tabular-nums">{windSpeed.toFixed(1)} m/s</span></div>
          <Slider min={2} max={30} step={0.5} value={[windSpeed]} onValueChange={([v]) => setWindSpeed(v)} />
        </div>
        <div>
          <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">{t.tsr}</span><span className="font-mono text-primary tabular-nums">{tsr.toFixed(1)}</span></div>
          <Slider min={1} max={14} step={0.5} value={[tsr]} onValueChange={([v]) => setTsr(v)} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Toggle label={t.cinematic} v={cinematic} on={setCinematic} />
          <Toggle label={t.vortex} v={showVortex} on={setShowVortex} />
          <Toggle label={t.stream} v={showStream} on={setShowStream} />
          <Toggle label={t.postFX} v={postFX} on={setPostFX} />
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, v, on }: { label: string; v: boolean; on: (b: boolean) => void }) {
  return (
    <div className="flex items-center justify-between text-[10px] gap-1 px-1.5 py-1 rounded border border-border/40 bg-card/40">
      <Label className="text-muted-foreground truncate">{label}</Label>
      <Switch checked={v} onCheckedChange={on} className="scale-75" />
    </div>
  );
}

function HUD({ geometry, windSpeed, tsr }: { geometry: BladeGeometry; windSpeed: number; tsr: number }) {
  const omega = (tsr * windSpeed) / Math.max(0.1, geometry.tipRadius);
  const rpm = (omega * 60) / (2 * Math.PI);
  const tip = tsr * windSpeed;
  const mach = tip / 343;
  return (
    <div className="absolute top-2 right-2 z-10 pointer-events-none">
      <div className="bg-card/70 backdrop-blur-xl border border-primary/20 rounded-md p-2 shadow-lg space-y-0.5 text-[10px] font-mono tabular-nums min-w-[120px]">
        <Hud label="ω" value={`${omega.toFixed(2)} rad/s`} />
        <Hud label="RPM" value={rpm.toFixed(1)} />
        <Hud label="V tip" value={`${tip.toFixed(0)} m/s`} />
        <Hud label="Mach" value={mach.toFixed(3)} accent={mach > 0.3} />
      </div>
    </div>
  );
}

function Hud({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? 'text-orange-400' : 'text-primary'}>{value}</span>
    </div>
  );
}
