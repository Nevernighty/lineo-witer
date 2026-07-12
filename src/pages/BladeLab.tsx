import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RotateCcw, SlidersHorizontal, Wind, AlertTriangle, Activity } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { setActiveBladePreset } from '@/store/useBladePresetStore';
import type { RotorType } from '@/aero/buildBladeGeometry';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Menubar, MenubarMenu, MenubarTrigger, MenubarContent,
  MenubarItem, MenubarSeparator, MenubarLabel,
  MenubarCheckboxItem, MenubarRadioGroup, MenubarRadioItem,
  MenubarSub, MenubarSubTrigger, MenubarSubContent,
} from '@/components/ui/menubar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { BladeViewer3D, type VfxConfig } from '@/components/blade-lab/BladeViewer3D';
import { GeometryPanel } from '@/components/blade-lab/GeometryPanel';
import { AeroAnalysis } from '@/components/blade-lab/AeroAnalysis';
import { MacroRegime } from '@/components/blade-lab/MacroRegime';
import { DiagnosticsOverlay } from '@/components/blade-lab/DiagnosticsOverlay';
import { AIRFOILS } from '@/aero/airfoils';
import type { BladeGeometry } from '@/aero/bem';
import type { ViewMode } from '@/aero/buildBladeGeometry';
import { PRESETS, clampGeometry } from '@/aero/presets';
import { getMaterial } from '@/aero/materials';
import { exportBladeSTL, downloadSTL } from '@/aero/stlExport';
import { SITE_SCENARIOS, getSiteScenario } from '@/aero/sitePresets';
import { calibrationFor } from '@/aero/calibration';
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
  ua: { back: 'Назад', title: 'Лабораторія форми лопаті', sub: 'Аеродинаміка · Геометрія · Макро · STL',
    geometry: 'Геометрія', viewer: '3D', analysis: 'Аналіз', macro: 'Макро', scene: 'Симуляція', view: 'Режим перегляду',
    windV: 'V∞', tsr: 'λ', cinematic: 'Кінематика', vortex: 'Кінцеві вихори',
    stream: 'Лінії потоку', postFX: 'Пост-обробка', presets: 'Пресети турбін',
    utility: 'Промислові', small: 'Малі', diy: 'DIY / 3D-друк', vawt: 'Вертикальні', reference: 'Еталонні',
    exportSingle: 'Лопать STL', exportRotor: 'Ротор STL', scaleMM: 'мм', reset: 'Скинути',
    applySim: 'У симуляцію', appliedToast: 'Лопать застосована до симуляції',
    file: 'Файл', viewM: 'Вигляд', simM: 'Симуляція', siteM: 'Сценарій', vfxM: 'VFX',
    preset: 'Пресет', exportSTL: 'Експорт STL', singleBlade: 'Одна лопать', fullRotor: 'Повний ротор',
    overload: 'Перевантаження', failure: 'Руйнування лопаті',
    flow: 'Потік', visualFX: 'Візуальні ефекти', thresholds: 'Пороги руйнування',
    bendStart: 'Початок згину', fracture: 'Поріг розриву',
    diag: 'Діагностика', calib: 'Калібрування', airBlades: 'Повітря біля лопатей',
    vortexInt: 'Вихри', vortexTurns: 'Витки', vortexR: 'Радіус', vortexDec: 'Затухання',
    wakeDen: 'Сліди', wakeSwl: 'Закрутка',
    streamN: 'Кількість', streamLen: 'Довжина', streamJit: 'Турбулентність', streamSpd: 'Швидкість',
  },
  en: { back: 'Back', title: 'Blade Geometry Lab', sub: 'Aerodynamics · Geometry · Macro · STL',
    geometry: 'Geometry', viewer: '3D', analysis: 'Analysis', macro: 'Macro', scene: 'Simulation', view: 'View mode',
    windV: 'V∞', tsr: 'λ', cinematic: 'Cinematic', vortex: 'Tip vortex', stream: 'Streamlines',
    postFX: 'Post-FX', presets: 'Turbine presets', utility: 'Utility', small: 'Small', diy: 'DIY / 3D-print',
    vawt: 'Vertical-axis', reference: 'Reference', exportSingle: 'Blade STL', exportRotor: 'Rotor STL',
    scaleMM: 'mm', reset: 'Reset', applySim: 'To simulation', appliedToast: 'Blade applied to simulation',
    file: 'File', viewM: 'View', simM: 'Simulation', siteM: 'Scenario', vfxM: 'VFX',
    preset: 'Preset', exportSTL: 'Export STL', singleBlade: 'Single blade', fullRotor: 'Full rotor',
    overload: 'Overload', failure: 'Blade failure',
    flow: 'Flow', visualFX: 'Visual FX', thresholds: 'Failure thresholds',
    bendStart: 'Bend start', fracture: 'Fracture',
    diag: 'Diagnostics', calib: 'Calibration', airBlades: 'Air around blades',
    vortexInt: 'Vortex', vortexTurns: 'Turns', vortexR: 'Radius', vortexDec: 'Decay',
    wakeDen: 'Wake', wakeSwl: 'Swirl',
    streamN: 'Count', streamLen: 'Length', streamJit: 'Turbulence', streamSpd: 'Speed',
  },
};

const DEFAULT_GEOMETRY: BladeGeometry = {
  airfoil: AIRFOILS.find(a => a.id === 's809') || AIRFOILS[0],
  rootRadius: 1.5, tipRadius: 30, chordRoot: 2.5, chordTip: 0.6,
  twistRoot: 14, twistTip: 0, pitch: 0, nBlades: 3, twistLaw: 'optimal',
};

const DEFAULT_VFX: VfxConfig = {
  vortexIntensity: 1.0, vortexTurns: 3.2, vortexRadiusFactor: 1.0, vortexDecay: 0.18,
  wakeDensity: 1.0, wakeSwirl: 0.5,
  streamCount: 1.0, streamLength: 1.0, streamJitter: 0.0, streamSpeedMul: 1.0,
  airAroundBlades: false,
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
  const [heightOverDiameter, setHeightOverDiameter] = useState<number>(1);
  const [helicalDeg, setHelicalDeg] = useState<number>(0);
  const [bendThresholdPct, setBendThresholdPct] = useState(0.7);
  const [fractureThresholdPct, setFractureThresholdPct] = useState(1.1);
  const [reactionSpeed, setReactionSpeed] = useState(1);
  const [recoverySpeed, setRecoverySpeed] = useState(1);
  const [siteId, setSiteId] = useState<string>('lowland_open');
  const [vfx, setVfx] = useState<VfxConfig>(DEFAULT_VFX);
  const [showDiag, setShowDiag] = useState(false);
  const [turbulenceBoost, setTurbulenceBoost] = useState(0);
  const [failureBoost, setFailureBoost] = useState(0);
  const navigate = useNavigate();


  const rho = 1.225;
  const material = getMaterial(materialId);
  const tipSpeed = tsr * windSpeed;
  const failureLevel = useMemo(() => {
    const lo = material.maxTipSpeed * bendThresholdPct;
    const hi = material.maxTipSpeed * fractureThresholdPct;
    const base = Math.max(0, Math.min(1.3, (tipSpeed - lo) / Math.max(0.05, hi - lo)));
    return Math.max(0, Math.min(1.3, base + failureBoost));
  }, [tipSpeed, material.maxTipSpeed, bendThresholdPct, fractureThresholdPct, failureBoost]);


  // Auto-apply family calibration whenever rotor type changes.
  useEffect(() => {
    const c = calibrationFor(rotorType);
    setBendThresholdPct(c.bendThresholdPct);
    setFractureThresholdPct(c.fractureThresholdPct);
    setReactionSpeed(c.reactionSpeed);
    setRecoverySpeed(c.recoverySpeed);
  }, [rotorType]);

  const site = useMemo(() => getSiteScenario(siteId), [siteId]);

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
    setHeightOverDiameter(p.heightOverDiameter ?? 1);
    setHelicalDeg(p.helicalTwistDeg ?? 0);
  };

  const applySite = (id: string) => {
    setSiteId(id);
    const s = getSiteScenario(id);
    setWindSpeed(s.windSpeed);
  };

  const resetAll = () => {
    setGeometry(DEFAULT_GEOMETRY); setMaterialId('gfrp'); setPresetId('');
    setRotorType('hawt'); setHeightOverDiameter(1); setHelicalDeg(0);
    setVfx(DEFAULT_VFX);
  };

  const applyToSimulation = useCallback((silent = false) => {
    const p = PRESETS.find(x => x.id === presetId);
    setActiveBladePreset({
      id: presetId || 'custom',
      nameUA: p?.nameUA || 'Користувацька',
      nameEN: p?.nameEN || 'Custom',
      geometry, materialId, rotorType,
      heightOverDiameter, helicalTwistDeg: helicalDeg,
      bendThresholdPct, fractureThresholdPct,
    });
    if (!silent) {
      toast({ title: t.appliedToast });
      setTimeout(() => navigate('/'), 600);
    }
  }, [presetId, geometry, materialId, rotorType, heightOverDiameter, helicalDeg, bendThresholdPct, fractureThresholdPct, t.appliedToast, navigate]);

  useEffect(() => { applyToSimulation(true); }, [applyToSimulation]);

  const exportSTL = useCallback((mode: 'single' | 'rotor') => {
    const name = presetId ? `${presetId}_${mode}` : `blade_${mode}`;
    const stl = exportBladeSTL(geometry, { mode, scaleMM: exportScaleMM, windSpeed, tsr, rotorType, heightOverDiameter, helical: helicalDeg });
    downloadSTL(name, stl);
  }, [geometry, presetId, exportScaleMM, windSpeed, tsr, rotorType, heightOverDiameter, helicalDeg]);

  const viewerProps = {
    geometry, viewMode, windSpeed, tsr, cinematic, postFX,
    showTipVortex: showVortex, showStreamlines: showStream,
    rotorType, heightOverDiameter, helical: helicalDeg,
    failureLevel,
    bgTint: site.tint,
    turbulence: Math.min(1, site.turbulence + turbulenceBoost),
    reactionSpeed, recoverySpeed,
    vfx,
  };

  const director = useDirector({
    setWindSpeed,
    setTsr,
    setTurbulenceBoost,
    setFailureBoost,
  });


  const simCtl = {
    t, lang, windSpeed, setWindSpeed, tsr, setTsr,
    cinematic, setCinematic, showVortex, setShowVortex, showStream, setShowStream, postFX, setPostFX,
    bendThresholdPct, setBendThresholdPct, fractureThresholdPct, setFractureThresholdPct,
    reactionSpeed, setReactionSpeed, recoverySpeed, setRecoverySpeed,
    vfx, setVfx,
  };

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-background text-foreground overflow-hidden blade-lab-shell">
      <header className="border-b border-border/40 bg-card/70 backdrop-blur-md">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Link to="/" className="p-1 rounded hover:bg-primary/10 flex-shrink-0" title={t.back}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0 flex-shrink-0 hidden sm:block">
            <div className="bl-title leading-tight truncate max-w-[28vw]">{t.title}</div>
            <div className="bl-meta truncate hidden md:block">{t.sub}</div>
          </div>

          <div className="hidden md:block ml-2 min-w-0 flex-1">
            <Menubar className="h-7 border-border/40 bg-transparent p-0 gap-0">
              {/* File */}
              <MenubarMenu>
                <MenubarTrigger className="bl-menu-trigger">{t.file}</MenubarTrigger>
                <MenubarContent className="z-[120]">
                  <MenubarSub>
                    <MenubarSubTrigger className="bl-menu-item">{t.preset}</MenubarSubTrigger>
                    <MenubarSubContent className="max-h-[60vh] overflow-y-auto z-[121]">
                      {(['utility', 'small', 'diy', 'vawt', 'reference'] as const).map(cat => (
                        <div key={cat}>
                          <MenubarLabel className="bl-meta">{t[cat]}</MenubarLabel>
                          {grouped[cat].map(p => (
                            <MenubarItem key={p.id} onSelect={() => applyPreset(p.id)} className="bl-menu-item">
                              {lang === 'ua' ? p.nameUA : p.nameEN}
                              {presetId === p.id && <span className="ml-auto text-primary">●</span>}
                            </MenubarItem>
                          ))}
                          <MenubarSeparator />
                        </div>
                      ))}
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarItem onSelect={resetAll} className="bl-menu-item">
                    <RotateCcw className="w-3 h-3 mr-2" /> {t.reset}
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarSub>
                    <MenubarSubTrigger className="bl-menu-item">{t.exportSTL}</MenubarSubTrigger>
                    <MenubarSubContent className="z-[121]">
                      <MenubarItem onSelect={() => exportSTL('single')} className="bl-menu-item">
                        <Download className="w-3 h-3 mr-2" /> {t.singleBlade}
                      </MenubarItem>
                      <MenubarItem onSelect={() => exportSTL('rotor')} className="bl-menu-item">
                        <Download className="w-3 h-3 mr-2" /> {t.fullRotor}
                      </MenubarItem>
                      <MenubarSeparator />
                      <MenubarCheckboxItem checked={exportScaleMM}
                        onCheckedChange={(v) => setExportScaleMM(!!v)} className="bl-menu-item">
                        {t.scaleMM}
                      </MenubarCheckboxItem>
                    </MenubarSubContent>
                  </MenubarSub>
                </MenubarContent>
              </MenubarMenu>

              {/* View */}
              <MenubarMenu>
                <MenubarTrigger className="bl-menu-trigger">{t.viewM}</MenubarTrigger>
                <MenubarContent className="z-[120]">
                  <MenubarLabel className="bl-meta">{t.view}</MenubarLabel>
                  <MenubarRadioGroup value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                    {VIEW_MODES.map(m => (
                      <MenubarRadioItem key={m.id} value={m.id} className="bl-menu-item">
                        {lang === 'ua' ? m.ua : m.en}
                      </MenubarRadioItem>
                    ))}
                  </MenubarRadioGroup>
                  <MenubarSeparator />
                  <MenubarCheckboxItem checked={cinematic} onCheckedChange={(v) => setCinematic(!!v)} className="bl-menu-item">{t.cinematic}</MenubarCheckboxItem>
                  <MenubarCheckboxItem checked={postFX} onCheckedChange={(v) => setPostFX(!!v)} className="bl-menu-item">{t.postFX}</MenubarCheckboxItem>
                  <MenubarCheckboxItem checked={showDiag} onCheckedChange={(v) => setShowDiag(!!v)} className="bl-menu-item">
                    <Activity className="w-3 h-3 mr-2" /> {t.diag}
                  </MenubarCheckboxItem>
                </MenubarContent>
              </MenubarMenu>

              {/* Scenario */}
              <MenubarMenu>
                <MenubarTrigger className="bl-menu-trigger">{t.siteM}</MenubarTrigger>
                <MenubarContent className="z-[120] max-h-[60vh] overflow-y-auto">
                  <MenubarRadioGroup value={siteId} onValueChange={applySite}>
                    {SITE_SCENARIOS.map(s => (
                      <MenubarRadioItem key={s.id} value={s.id} className="bl-menu-item">
                        <div className="flex flex-col">
                          <span>{lang === 'ua' ? s.nameUA : s.nameEN}</span>
                          <span className="bl-meta text-muted-foreground">{s.windSpeed} m/s · TI {Math.round(s.turbulence * 100)}%</span>
                        </div>
                      </MenubarRadioItem>
                    ))}
                  </MenubarRadioGroup>
                </MenubarContent>
              </MenubarMenu>

              {/* Simulation — flow + thresholds + calibration */}
              <MenubarMenu>
                <MenubarTrigger className="bl-menu-trigger">{t.simM}</MenubarTrigger>
                <MenubarContent className="z-[120] w-80 p-2 bl-menu-panel" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <SimMenuPanel {...simCtl} />
                  <MenubarSeparator />
                  <MenubarItem onSelect={() => applyToSimulation(false)} className="bl-menu-item">
                    <Wind className="w-3 h-3 mr-2" /> {t.applySim}
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>

              {/* VFX — vortex / wake / streamlines knobs */}
              <MenubarMenu>
                <MenubarTrigger className="bl-menu-trigger">{t.vfxM}</MenubarTrigger>
                <MenubarContent className="z-[120] w-80 p-2 bl-menu-panel" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <VfxMenuPanel t={t} vfx={vfx} setVfx={setVfx} />
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>

          <div className="ml-auto flex items-center gap-1 flex-shrink-0">
            {failureLevel > 0.4 && (
              <div className="hidden sm:flex items-center gap-1 px-1.5 h-6 rounded border border-orange-500/40 bg-orange-500/10 text-orange-300 bl-meta">
                <AlertTriangle className="w-3 h-3" />
                {failureLevel >= 1 ? t.failure : t.overload}
              </div>
            )}
            <button onClick={() => applyToSimulation(false)}
              className="h-7 px-2 bl-btn-text rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 flex items-center gap-1">
              <Wind className="w-3 h-3" /> <span className="hidden sm:inline">{t.applySim}</span>
            </button>
            <div className="flex bg-card/60 rounded border border-border/30 p-0.5">
              <button onClick={() => setLang('ua')} className={`px-1.5 py-0.5 rounded bl-meta font-semibold ${lang === 'ua' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>UA</button>
              <button onClick={() => setLang('en')} className={`px-1.5 py-0.5 rounded bl-meta font-semibold ${lang === 'en' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>EN</button>
            </div>
          </div>
        </div>

        <div className="md:hidden flex items-center gap-1.5 px-2 pb-1.5 overflow-x-auto scrollbar-none">
          <Select value={presetId} onValueChange={applyPreset}>
            <SelectTrigger className="h-7 bl-text w-44 flex-shrink-0"><SelectValue placeholder={`— ${t.presets} —`} /></SelectTrigger>
            <SelectContent className="z-[100] max-h-80">
              {(['utility', 'small', 'diy', 'vawt', 'reference'] as const).map(cat => (
                <SelectGroup key={cat}>
                  <SelectLabel className="bl-meta uppercase tracking-wider">{t[cat]}</SelectLabel>
                  {grouped[cat].map(p => (
                    <SelectItem key={p.id} value={p.id} className="bl-text">
                      {lang === 'ua' ? p.nameUA : p.nameEN}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Select value={siteId} onValueChange={applySite}>
            <SelectTrigger className="h-7 bl-text w-40 flex-shrink-0"><SelectValue placeholder={t.siteM} /></SelectTrigger>
            <SelectContent className="z-[100] max-h-80">
              {SITE_SCENARIOS.map(s => (
                <SelectItem key={s.id} value={s.id} className="bl-text">
                  {lang === 'ua' ? s.nameUA : s.nameEN}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={resetAll} title={t.reset}
            className="h-7 px-1.5 rounded bg-card/50 hover:bg-card text-muted-foreground border border-border/40 flex items-center flex-shrink-0">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Desktop */}
      <div className="hidden md:block flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" autoSaveId="blade-lab-layout" className="h-full w-full">
          <ResizablePanel defaultSize={22} minSize={14} maxSize={40} className="min-w-0">
            <aside className="h-full overflow-y-auto scrollbar-thin">
              <GeometryPanel
                geometry={geometry} onChange={setGeometry} lang={lang}
                materialId={materialId} onMaterialChange={setMaterialId}
                rotorType={rotorType} onRotorTypeChange={setRotorType}
                helicalDeg={helicalDeg} onHelicalChange={setHelicalDeg}
                heightOverDiameter={heightOverDiameter} onHeightOverDiameterChange={setHeightOverDiameter}
              />
            </aside>
          </ResizablePanel>
          <ResizableHandle withHandle className="bl-resize-handle" />
          <ResizablePanel defaultSize={54} minSize={28} className="min-w-0">
            <main className="relative h-full min-w-0">
              <BladeViewer3D {...viewerProps} />
              <CanvasRibbon t={t} windSpeed={windSpeed} setWindSpeed={setWindSpeed} tsr={tsr} setTsr={setTsr} site={site} lang={lang} />
              <HUD geometry={geometry} windSpeed={windSpeed} tsr={tsr} failureLevel={failureLevel} t={t} />
              {showDiag && <DiagnosticsOverlay lang={lang} onClose={() => setShowDiag(false)} />}
            </main>
          </ResizablePanel>
          <ResizableHandle withHandle className="bl-resize-handle" />
          <ResizablePanel defaultSize={24} minSize={16} maxSize={44} className="min-w-0">
            <aside className="h-full overflow-y-auto scrollbar-thin min-w-0">
              <Tabs defaultValue="analysis" className="w-full min-w-0 bl-analysis-surface h-full">
                <TabsList className="grid w-[calc(100%-8px)] grid-cols-2 h-8 m-1 mb-0 bl-dark-tabs">
                  <TabsTrigger value="analysis" className="bl-text">{t.analysis}</TabsTrigger>
                  <TabsTrigger value="macro" className="bl-text">{t.macro}</TabsTrigger>
                </TabsList>
                <TabsContent value="analysis" className="m-0 min-w-0 overflow-x-hidden bl-analysis-surface">
                  <AeroAnalysis geometry={geometry} lang={lang} windSpeed={windSpeed} tsr={tsr} rho={rho} materialId={materialId} rotorType={rotorType} heightOverDiameter={heightOverDiameter} />
                </TabsContent>
                <TabsContent value="macro" className="m-0 min-w-0 overflow-x-hidden bl-analysis-surface">
                  <MacroRegime geometry={geometry} scenarioId={scenarioId} onScenarioChange={setScenarioId} lang={lang} />
                </TabsContent>
              </Tabs>
            </aside>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex-1 min-h-0 flex flex-col">
        <Tabs defaultValue="viewer" className="flex-1 flex flex-col min-h-0">
          <TabsList className="fixed bottom-2 left-2 right-2 z-40 grid grid-cols-4 h-10 bg-card/90 backdrop-blur-xl border border-primary/20 shadow-lg pb-[env(safe-area-inset-bottom)]">
            <TabsTrigger value="geo" className="bl-meta">{t.geometry}</TabsTrigger>
            <TabsTrigger value="viewer" className="bl-meta">{t.viewer}</TabsTrigger>
            <TabsTrigger value="analysis" className="bl-meta">{t.analysis}</TabsTrigger>
            <TabsTrigger value="macro" className="bl-meta">{t.macro}</TabsTrigger>
          </TabsList>
          <TabsContent value="geo" className="flex-1 overflow-y-auto scrollbar-thin m-0 pb-16">
            <GeometryPanel
              geometry={geometry} onChange={setGeometry} lang={lang}
              materialId={materialId} onMaterialChange={setMaterialId}
              rotorType={rotorType} onRotorTypeChange={setRotorType}
              helicalDeg={helicalDeg} onHelicalChange={setHelicalDeg}
              heightOverDiameter={heightOverDiameter} onHeightOverDiameterChange={setHeightOverDiameter}
            />
          </TabsContent>
          <TabsContent value="viewer" className="flex-1 m-0 relative min-h-[55vh] pb-14">
            <BladeViewer3D {...viewerProps} />
            <MobileSimSheet simCtl={simCtl} t={t} vfx={vfx} setVfx={setVfx} />
            <HUD geometry={geometry} windSpeed={windSpeed} tsr={tsr} failureLevel={failureLevel} t={t} mobile />
            {showDiag && <DiagnosticsOverlay lang={lang} onClose={() => setShowDiag(false)} />}
          </TabsContent>
          <TabsContent value="analysis" className="flex-1 overflow-y-auto scrollbar-thin m-0 pb-16 min-w-0 overflow-x-hidden">
            <AeroAnalysis geometry={geometry} lang={lang} windSpeed={windSpeed} tsr={tsr} rho={rho} materialId={materialId} rotorType={rotorType} heightOverDiameter={heightOverDiameter} />
          </TabsContent>
          <TabsContent value="macro" className="flex-1 overflow-y-auto scrollbar-thin m-0 pb-16 min-w-0 overflow-x-hidden">
            <MacroRegime geometry={geometry} scenarioId={scenarioId} onScenarioChange={setScenarioId} lang={lang} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SimMenuPanel({
  t, windSpeed, setWindSpeed, tsr, setTsr,
  cinematic, setCinematic, showVortex, setShowVortex, showStream, setShowStream, postFX, setPostFX,
  bendThresholdPct, setBendThresholdPct, fractureThresholdPct, setFractureThresholdPct,
  reactionSpeed, setReactionSpeed, recoverySpeed, setRecoverySpeed,
}: any) {
  return (
    <div className="space-y-2.5 bl-menu-panel" onClick={(e) => e.stopPropagation()}>
      <Section title={t.flow}>
        <RangeRow label={t.windV} value={`${windSpeed.toFixed(1)} m/s`} min={2} max={35} step={0.5} v={windSpeed} on={setWindSpeed} />
        <RangeRow label={t.tsr} value={tsr.toFixed(1)} min={1} max={14} step={0.5} v={tsr} on={setTsr} />
      </Section>
      <Section title={t.thresholds}>
        <RangeRow label={t.bendStart} value={`${Math.round(bendThresholdPct * 100)}%`}
          min={0.3} max={1} step={0.02} v={bendThresholdPct} on={setBendThresholdPct} />
        <RangeRow label={t.fracture} value={`${Math.round(fractureThresholdPct * 100)}%`}
          min={Math.max(0.5, bendThresholdPct + 0.05)} max={1.6} step={0.02}
          v={fractureThresholdPct} on={setFractureThresholdPct} />
      </Section>
      <Section title={t.calib}>
        <RangeRow label="Reaction" value={`${reactionSpeed.toFixed(2)}×`} min={0.3} max={3} step={0.05} v={reactionSpeed} on={setReactionSpeed} />
        <RangeRow label="Recovery" value={`${recoverySpeed.toFixed(2)}×`} min={0.3} max={3} step={0.05} v={recoverySpeed} on={setRecoverySpeed} />
      </Section>
      <Section title={t.visualFX}>
        <div className="grid grid-cols-2 gap-1.5">
          <FxToggle label={t.vortex} v={showVortex} on={setShowVortex} />
          <FxToggle label={t.stream} v={showStream} on={setShowStream} />
          <FxToggle label={t.cinematic} v={cinematic} on={setCinematic} />
          <FxToggle label={t.postFX} v={postFX} on={setPostFX} />
        </div>
      </Section>
    </div>
  );
}

function VfxMenuPanel({ t, vfx, setVfx }: { t: any; vfx: VfxConfig; setVfx: (v: VfxConfig) => void }) {
  const set = (k: keyof VfxConfig, v: any) => setVfx({ ...vfx, [k]: v });
  return (
    <div className="space-y-2.5 bl-menu-panel" onClick={(e) => e.stopPropagation()}>
      <Section title="Vortex">
        <RangeRow label={t.vortexInt} value={`${Math.round(vfx.vortexIntensity * 100)}%`} min={0} max={1.5} step={0.05} v={vfx.vortexIntensity} on={(n) => set('vortexIntensity', n)} />
        <RangeRow label={t.vortexTurns} value={vfx.vortexTurns.toFixed(1)} min={1} max={6} step={0.2} v={vfx.vortexTurns} on={(n) => set('vortexTurns', n)} />
        <RangeRow label={t.vortexR} value={vfx.vortexRadiusFactor.toFixed(2)} min={0.6} max={1.4} step={0.02} v={vfx.vortexRadiusFactor} on={(n) => set('vortexRadiusFactor', n)} />
        <RangeRow label={t.vortexDec} value={`${Math.round(vfx.vortexDecay * 100)}%`} min={0} max={0.6} step={0.02} v={vfx.vortexDecay} on={(n) => set('vortexDecay', n)} />
      </Section>
      <Section title="Wake / streamlines">
        <RangeRow label={t.wakeDen} value={`${Math.round(vfx.wakeDensity * 100)}%`} min={0} max={1.5} step={0.05} v={vfx.wakeDensity} on={(n) => set('wakeDensity', n)} />
        <RangeRow label={t.wakeSwl} value={`${Math.round(vfx.wakeSwirl * 100)}%`} min={0} max={1} step={0.05} v={vfx.wakeSwirl} on={(n) => set('wakeSwirl', n)} />
        <RangeRow label={t.streamN} value={`${Math.round(vfx.streamCount * 100)}%`} min={0.2} max={1.5} step={0.05} v={vfx.streamCount} on={(n) => set('streamCount', n)} />
        <RangeRow label={t.streamLen} value={vfx.streamLength.toFixed(2)} min={0.5} max={2} step={0.05} v={vfx.streamLength} on={(n) => set('streamLength', n)} />
        <RangeRow label={t.streamJit} value={`${Math.round(vfx.streamJitter * 100)}%`} min={0} max={1} step={0.05} v={vfx.streamJitter} on={(n) => set('streamJitter', n)} />
        <RangeRow label={t.streamSpd} value={`${vfx.streamSpeedMul.toFixed(2)}×`} min={0.2} max={3} step={0.05} v={vfx.streamSpeedMul} on={(n) => set('streamSpeedMul', n)} />
      </Section>
      <FxToggle label={t.airBlades} v={vfx.airAroundBlades} on={(b) => set('airAroundBlades', b)} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="bl-meta uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function RangeRow({ label, value, v, on, min, max, step }: { label: string; value: string; v: number; on: (n: number) => void; min: number; max: number; step: number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between bl-meta">
        <span className="text-muted-foreground truncate pr-2">{label}</span>
        <span className="font-mono text-primary tabular-nums">{value}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[v]} onValueChange={([x]) => on(x)} />
    </div>
  );
}

function FxToggle({ label, v, on }: { label: string; v: boolean; on: (b: boolean) => void }) {
  return (
    <label className="flex items-center justify-between bl-meta gap-1 px-1.5 py-1 rounded border border-border/40 bg-card/40 cursor-pointer">
      <span className="text-muted-foreground truncate">{label}</span>
      <Switch checked={v} onCheckedChange={on} className="scale-75" />
    </label>
  );
}

/** Fixed bottom ribbon — CSS-grid layout so the wind/TSR sliders never overflow at narrow widths. */
function CanvasRibbon({ t, windSpeed, setWindSpeed, tsr, setTsr, site, lang }:
  { t: any; windSpeed: number; setWindSpeed: (n: number) => void; tsr: number; setTsr: (n: number) => void; site: any; lang: 'ua' | 'en' }) {
  return (
    <div className="hidden md:flex absolute left-2 right-2 lg:right-auto lg:max-w-[520px] bottom-2 z-10 items-center gap-3 px-3 py-1.5 rounded-md bg-card/80 backdrop-blur-xl border border-primary/20 shadow-lg pointer-events-auto">
      <div className="bl-ribbon-cell">
        <div className="bl-ribbon-label">{t.windV}</div>
        <Slider min={2} max={35} step={0.5} value={[windSpeed]} onValueChange={([v]) => setWindSpeed(v)} />
        <div className="bl-ribbon-value">{windSpeed.toFixed(1)}<span className="text-muted-foreground"> m/s</span></div>
      </div>
      <div className="bl-ribbon-cell">
        <div className="bl-ribbon-label">{t.tsr}</div>
        <Slider min={1} max={14} step={0.5} value={[tsr]} onValueChange={([v]) => setTsr(v)} />
        <div className="bl-ribbon-value">{tsr.toFixed(1)}</div>
      </div>
      <div className="hidden lg:flex flex-col items-end bl-meta text-muted-foreground leading-tight">
        <span className="text-primary truncate max-w-[140px]">{lang === 'ua' ? site.nameUA : site.nameEN}</span>
        <span>TI {Math.round(site.turbulence * 100)}% · g {site.gustFactor.toFixed(2)}</span>
      </div>
    </div>
  );
}

function MobileSimSheet({ simCtl, t, vfx, setVfx }: { simCtl: any; t: any; vfx: VfxConfig; setVfx: (v: VfxConfig) => void }) {
  return (
    <div className="absolute top-2 left-2 z-20 pointer-events-auto">
      <Sheet>
        <SheetTrigger className="h-9 w-9 rounded-md bg-card/80 border border-primary/30 text-primary backdrop-blur-xl flex items-center justify-center shadow-lg">
          <SlidersHorizontal className="w-4 h-4" />
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[78dvh] overflow-y-auto scrollbar-thin border-primary/30 bg-background/95 p-3">
          <SheetHeader className="text-left mb-2"><SheetTitle className="bl-text text-primary">{simCtl.t.scene}</SheetTitle></SheetHeader>
          <SimMenuPanel {...simCtl} />
          <div className="mt-3 pt-2 border-t border-border/40">
            <VfxMenuPanel t={t} vfx={vfx} setVfx={setVfx} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function HUD({ geometry, windSpeed, tsr, failureLevel, t, mobile = false }: { geometry: BladeGeometry; windSpeed: number; tsr: number; failureLevel: number; t: any; mobile?: boolean }) {
  const omega = (tsr * windSpeed) / Math.max(0.1, geometry.tipRadius);
  const rpm = (omega * 60) / (2 * Math.PI);
  const tip = tsr * windSpeed;
  const mach = tip / 343;
  const failPct = Math.round(Math.min(1, failureLevel) * 100);
  return (
    <div className={`absolute ${mobile ? 'top-2 right-2 left-14' : 'top-2 right-2'} z-10 pointer-events-none`}>
      <div className={`bg-card/70 backdrop-blur-xl border border-primary/20 rounded-md shadow-lg font-mono tabular-nums ${mobile ? 'px-2 py-1 bl-meta flex items-center justify-end gap-3 overflow-hidden' : 'p-2 space-y-0.5 bl-meta min-w-[130px]'}`}>
        <Hud label="ω" value={`${omega.toFixed(2)} rad/s`} />
        <Hud label="RPM" value={rpm.toFixed(1)} />
        <Hud label="V tip" value={`${tip.toFixed(0)} m/s`} />
        <Hud label="Mach" value={mach.toFixed(3)} accent={mach > 0.3} />
        <Hud label={t.overload} value={`${failPct}%`} accent={failureLevel > 0.4} danger={failureLevel >= 1} />
      </div>
    </div>
  );
}

function Hud({ label, value, accent, danger }: { label: string; value: string; accent?: boolean; danger?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={danger ? 'text-red-400' : accent ? 'text-orange-400' : 'text-primary'}>{value}</span>
    </div>
  );
}
