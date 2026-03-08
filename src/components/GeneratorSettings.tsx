import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type WindGeneratorSpecs } from "@/utils/windCalculations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wind, Zap, Wrench, Calculator, BarChart3, TrendingUp } from "lucide-react";

interface GeneratorSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: WindGeneratorSpecs;
  onSettingsChange: (settings: WindGeneratorSpecs) => void;
  windSpeed: number;
  lang?: 'ua' | 'en';
}

const bladeProfiles = [
  { value: 'NACA 4412', lift: 1.2, drag: 0.012, desc_ua: 'Класичний профіль для малих турбін', desc_en: 'Classic profile for small turbines' },
  { value: 'NACA 63-215', lift: 1.4, drag: 0.008, desc_ua: 'Ламінарний профіль, висока ефективність', desc_en: 'Laminar profile, high efficiency' },
  { value: 'S809', lift: 1.0, drag: 0.010, desc_ua: 'Спеціально для вітрових турбін (NREL)', desc_en: 'Designed specifically for wind turbines (NREL)' },
  { value: 'DU 93-W-210', lift: 1.3, drag: 0.009, desc_ua: 'Профіль Делфтського університету', desc_en: 'Delft University profile' },
];

const genTypes = [
  { value: 'PMSG', desc_ua: 'Синхронний з постійними магнітами — безредукторний', desc_en: 'Permanent magnet synchronous — direct drive', efficiency: 0.96 },
  { value: 'DFIG', desc_ua: 'Подвійне живлення — з редуктором', desc_en: 'Doubly-fed induction — geared', efficiency: 0.93 },
  { value: 'SCIG', desc_ua: 'Асинхронний з к.з. ротором', desc_en: 'Squirrel cage induction', efficiency: 0.91 },
];

const materials = [
  { name: 'E-Glass/Epoxy', E: 40, sigma: 1000, rho: 2100, desc_ua: 'Стандарт для лопатей', desc_en: 'Standard for blades' },
  { name: 'Carbon/Epoxy', E: 135, sigma: 1500, rho: 1600, desc_ua: 'Преміум, легший, дорожчий', desc_en: 'Premium, lighter, costlier' },
  { name: 'Balsa/GF Sandwich', E: 8, sigma: 200, rho: 250, desc_ua: 'Легкий сандвіч для обшивки', desc_en: 'Lightweight sandwich for skins' },
  { name: 'Steel (Tower)', E: 210, sigma: 355, rho: 7850, desc_ua: 'Конструкційна сталь S355', desc_en: 'Structural steel S355' },
];

// SVG Power Curve component
const PowerCurveSVG = ({ currentSettings, windSpeed, lang }: { currentSettings: WindGeneratorSpecs; windSpeed: number; lang: 'ua' | 'en' }) => {
  const cutIn = 3;
  const cutOut = 25;
  const rated = currentSettings.ratedPower;
  const ratedSpeed = Math.pow((rated) / (0.5 * 1.225 * Math.PI * currentSettings.bladeLength ** 2 * currentSettings.efficiency), 1/3);
  const clampedRated = Math.min(Math.max(ratedSpeed, 8), 16);

  const points: string[] = [];
  for (let v = 0; v <= 30; v += 0.5) {
    let p = 0;
    if (v >= cutIn && v <= cutOut) {
      if (v < clampedRated) {
        p = 0.5 * 1.225 * Math.PI * currentSettings.bladeLength ** 2 * v ** 3 * currentSettings.efficiency;
        p = Math.min(p, rated);
      } else {
        p = rated;
      }
    }
    const x = 20 + (v / 30) * 260;
    const y = 130 - (p / rated) * 110;
    points.push(`${x},${y}`);
  }

  const currentX = 20 + (windSpeed / 30) * 260;
  let currentP = 0;
  if (windSpeed >= cutIn && windSpeed <= cutOut) {
    currentP = Math.min(0.5 * 1.225 * Math.PI * currentSettings.bladeLength ** 2 * windSpeed ** 3 * currentSettings.efficiency, rated);
  }
  const currentY = 130 - (currentP / rated) * 110;

  const formatP = (w: number) => w >= 1e6 ? `${(w/1e6).toFixed(1)}MW` : w >= 1e3 ? `${(w/1e3).toFixed(0)}kW` : `${w.toFixed(0)}W`;

  return (
    <svg viewBox="0 0 300 155" className="w-full h-32">
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1="20" y1={130 - f * 110} x2="280" y2={130 - f * 110} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray={f === 0 ? "" : "2,3"} opacity="0.4" />
      ))}
      {[0, 5, 10, 15, 20, 25, 30].map(v => (
        <g key={v}>
          <line x1={20 + (v/30)*260} y1="130" x2={20 + (v/30)*260} y2="132" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" />
          <text x={20 + (v/30)*260} y="142" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">{v}</text>
        </g>
      ))}
      {/* Cut-in / cut-out zones */}
      <rect x="20" y="20" width={(cutIn/30)*260} height="110" fill="hsl(var(--destructive))" opacity="0.06" />
      <rect x={20 + (cutOut/30)*260} y="20" width={((30-cutOut)/30)*260} height="110" fill="hsl(var(--destructive))" opacity="0.06" />
      <line x1={20 + (cutIn/30)*260} y1="20" x2={20 + (cutIn/30)*260} y2="130" stroke="hsl(var(--destructive))" strokeWidth="0.5" strokeDasharray="3,2" opacity="0.5" />
      <line x1={20 + (cutOut/30)*260} y1="20" x2={20 + (cutOut/30)*260} y2="130" stroke="hsl(var(--destructive))" strokeWidth="0.5" strokeDasharray="3,2" opacity="0.5" />
      <text x={20 + (cutIn/30)*260} y="17" textAnchor="middle" fontSize="6" fill="hsl(var(--destructive))">Cut-in</text>
      <text x={20 + (cutOut/30)*260} y="17" textAnchor="middle" fontSize="6" fill="hsl(var(--destructive))">Cut-out</text>
      {/* Rated line */}
      <line x1="20" y1="20" x2="280" y2="20" stroke="hsl(var(--primary))" strokeWidth="0.5" strokeDasharray="4,3" opacity="0.3" />
      <text x="282" y="23" fontSize="6" fill="hsl(var(--primary))">{formatP(rated)}</text>
      {/* Power curve */}
      <polyline points={points.join(' ')} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Fill under curve */}
      <polyline points={`20,130 ${points.join(' ')} 280,130`} fill="hsl(var(--primary))" opacity="0.08" />
      {/* Current operating point */}
      <circle cx={currentX} cy={currentY} r="4" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="1.5" />
      <line x1={currentX} y1={currentY} x2={currentX} y2="130" stroke="hsl(var(--primary))" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
      <text x={currentX} y={currentY - 8} textAnchor="middle" fontSize="7" fontWeight="bold" fill="hsl(var(--primary))">{formatP(currentP)}</text>
      {/* Axes labels */}
      <text x="150" y="153" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">
        {lang === 'ua' ? 'Швидкість вітру (m/s)' : 'Wind Speed (m/s)'}
      </text>
      <text x="8" y="75" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))" transform="rotate(-90 8 75)">P</text>
    </svg>
  );
};

// Wind Range Bar component
const WindRangeBar = ({ windSpeed, lang }: { windSpeed: number; lang: 'ua' | 'en' }) => {
  const cutIn = 3;
  const ratedRange = [11, 14];
  const cutOut = 25;
  const max = 30;
  const pos = (v: number) => `${(v / max) * 100}%`;
  const currentPos = Math.min(windSpeed, max);

  return (
    <div className="relative h-6 rounded-full bg-secondary/20 border border-border/30 overflow-hidden">
      {/* Dead zone */}
      <div className="absolute h-full bg-destructive/10" style={{ left: 0, width: pos(cutIn) }} />
      {/* Operating zone */}
      <div className="absolute h-full bg-primary/15" style={{ left: pos(cutIn), width: `${((cutOut - cutIn) / max) * 100}%` }} />
      {/* Rated zone */}
      <div className="absolute h-full bg-primary/30" style={{ left: pos(ratedRange[0]), width: `${((ratedRange[1] - ratedRange[0]) / max) * 100}%` }} />
      {/* Shutdown zone */}
      <div className="absolute h-full bg-destructive/10" style={{ left: pos(cutOut), width: `${((max - cutOut) / max) * 100}%` }} />
      {/* Current indicator */}
      <div className="absolute top-0 h-full w-0.5 bg-primary z-10" style={{ left: pos(currentPos) }} />
      <div className="absolute -top-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background z-20" style={{ left: `calc(${pos(currentPos)} - 5px)` }} />
      {/* Labels */}
      <span className="absolute text-[7px] text-muted-foreground top-1" style={{ left: `calc(${pos(cutIn)} + 2px)` }}>
        {lang === 'ua' ? 'Старт' : 'Start'}
      </span>
      <span className="absolute text-[7px] text-primary font-bold top-1" style={{ left: `calc(${pos(ratedRange[0])} + 2px)` }}>
        {lang === 'ua' ? 'Номін.' : 'Rated'}
      </span>
      <span className="absolute text-[7px] text-destructive top-1 right-1">
        {lang === 'ua' ? 'Стоп' : 'Stop'}
      </span>
    </div>
  );
};

export const GeneratorSettings = ({
  open, onOpenChange, currentSettings, onSettingsChange, windSpeed, lang = 'ua'
}: GeneratorSettingsProps) => {
  const [bladeProfile, setBladeProfile] = useState('NACA 63-215');
  const [attackAngle, setAttackAngle] = useState(8);
  const [genType, setGenType] = useState('PMSG');
  const [poleCount, setPoleCount] = useState(48);
  const [voltage, setVoltage] = useState(690);
  const [weibullK, setWeibullK] = useState(2.0);
  const [weibullC, setWeibullC] = useState(7.0);

  const label = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const profile = bladeProfiles.find(p => p.value === bladeProfile) || bladeProfiles[0];
  const genTypeData = genTypes.find(g => g.value === genType) || genTypes[0];

  const liveCalc = useMemo(() => {
    const R = currentSettings.bladeLength;
    const rho = 1.225;
    const A = Math.PI * R * R;
    const V = windSpeed;
    const Cp = currentSettings.efficiency;
    const P = 0.5 * rho * A * Math.pow(V, 3) * Cp;
    const omega = (7 * V) / R;
    const torque = omega > 0 ? P / omega : 0;
    const bladeM = 0.5 * R * 15;
    const Fc = bladeM * omega * omega * (R / 2);
    const capacityFactor = Math.min(P / currentSettings.ratedPower, 1);

    // AEP using Weibull distribution
    let aep = 0;
    for (let v = 0.5; v <= 30; v += 0.5) {
      const fv = (weibullK / weibullC) * Math.pow(v / weibullC, weibullK - 1) * Math.exp(-Math.pow(v / weibullC, weibullK));
      let pv = 0;
      if (v >= 3 && v <= 25) {
        pv = Math.min(0.5 * rho * A * Math.pow(v, 3) * Cp, currentSettings.ratedPower);
      }
      aep += pv * fv * 0.5 * 8760;
    }

    return { P, omega, torque, Fc, rps: omega / (2 * Math.PI), capacityFactor, aep };
  }, [currentSettings, windSpeed, weibullK, weibullC]);

  const formatP = (w: number) => w >= 1e6 ? `${(w/1e6).toFixed(2)} MW` : w >= 1e3 ? `${(w/1e3).toFixed(1)} kW` : `${w.toFixed(0)} W`;
  const formatE = (wh: number) => wh >= 1e6 ? `${(wh/1e6).toFixed(1)} GWh` : wh >= 1e3 ? `${(wh/1e3).toFixed(0)} MWh` : `${wh.toFixed(0)} kWh`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            {label('Інженерна панель генератора', 'Generator Engineering Panel')}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="aero" className="w-full">
          <TabsList className="grid grid-cols-5 mb-3">
            <TabsTrigger value="aero" className="text-xs data-[state=inactive]:text-foreground data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Wind className="w-3.5 h-3.5 mr-1" />{label('Аеро', 'Aero')}
            </TabsTrigger>
            <TabsTrigger value="struct" className="text-xs data-[state=inactive]:text-foreground data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Wrench className="w-3.5 h-3.5 mr-1" />{label('Конст.', 'Struct')}
            </TabsTrigger>
            <TabsTrigger value="elec" className="text-xs data-[state=inactive]:text-foreground data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              <Zap className="w-3.5 h-3.5 mr-1" />{label('Елект.', 'Elec')}
            </TabsTrigger>
            <TabsTrigger value="curve" className="text-xs data-[state=inactive]:text-foreground data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <BarChart3 className="w-3.5 h-3.5 mr-1" />{label('Крива', 'Curve')}
            </TabsTrigger>
            <TabsTrigger value="calc" className="text-xs data-[state=inactive]:text-foreground data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Calculator className="w-3.5 h-3.5 mr-1" />{label('Розр.', 'Calc')}
            </TabsTrigger>
          </TabsList>

          {/* AERO TAB */}
          <TabsContent value="aero" className="space-y-4">
            <div>
              <Label className="text-xs">{label('Профіль лопаті (NACA)', 'Blade Profile (NACA)')}</Label>
              <Select value={bladeProfile} onValueChange={setBladeProfile}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bladeProfiles.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">
                {lang === 'ua' ? profile.desc_ua : profile.desc_en} — Cl={profile.lift}, Cd={profile.drag}
              </p>
            </div>

            <div>
              <div className="flex justify-between">
                <Label className="text-xs">{label('Кут атаки', 'Angle of Attack')}</Label>
                <span className="text-xs font-mono text-primary">{attackAngle}°</span>
              </div>
              <Slider value={[attackAngle]} onValueChange={v => setAttackAngle(v[0])} min={0} max={20} step={0.5} className="mt-1" />
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {label('Оптимальний: 6-10°. Більше = стрибок зриву (stall).', 'Optimal: 6-10°. Higher = stall onset.')}
              </p>
            </div>

            <div>
              <div className="flex justify-between">
                <Label className="text-xs">{label('Довжина лопаті', 'Blade Length')}</Label>
                <span className="text-xs font-mono text-primary">{currentSettings.bladeLength}m</span>
              </div>
              <Slider value={[currentSettings.bladeLength]} onValueChange={v => onSettingsChange({...currentSettings, bladeLength: v[0]})} min={5} max={120} step={1} className="mt-1" />
            </div>

            <div>
              <div className="flex justify-between">
                <Label className="text-xs">{label('Ефективність (Cp)', 'Efficiency (Cp)')}</Label>
                <span className="text-xs font-mono text-primary">{currentSettings.efficiency}</span>
              </div>
              <Slider value={[currentSettings.efficiency]} onValueChange={v => onSettingsChange({...currentSettings, efficiency: v[0]})} min={0.1} max={0.55} step={0.01} className="mt-1" />
              <p className="text-[9px] text-muted-foreground mt-0.5">{label('Ліміт Бетца: 0.593. Реальні турбіни: 0.35-0.50', 'Betz limit: 0.593. Real turbines: 0.35-0.50')}</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[9px]">
                  <span className="text-muted-foreground">{label('Ефективність vs Бетц', 'Efficiency vs Betz')}</span>
                  <span className="text-primary font-mono">{((currentSettings.efficiency / 0.593) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-background/60 rounded-full border border-border/30 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all"
                    style={{ width: `${Math.min((currentSettings.efficiency / 0.593) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* STRUCT TAB */}
          <TabsContent value="struct" className="space-y-4">
            <div className="text-xs font-semibold text-primary uppercase tracking-wide">{label('Властивості матеріалів', 'Material Properties')}</div>
            <div className="space-y-2">
              {materials.map((mat, i) => (
                <div key={i} className="p-2.5 bg-secondary/10 rounded-lg border border-border/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{mat.name}</span>
                    <span className="text-[9px] text-muted-foreground">{lang === 'ua' ? mat.desc_ua : mat.desc_en}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <span className="text-muted-foreground">{label('Модуль Юнга', "Young's Mod.")}</span>
                      <p className="font-mono">{mat.E} GPa</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{label('Міцність', 'Strength')}</span>
                      <p className="font-mono">{mat.sigma} MPa</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{label('Щільність', 'Density')}</span>
                      <p className="font-mono">{mat.rho} kg/m³</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between">
                <Label className="text-xs">{label('Висота маточини', 'Hub Height')}</Label>
                <span className="text-xs font-mono text-primary">{currentSettings.height}m</span>
              </div>
              <Slider value={[currentSettings.height]} onValueChange={v => onSettingsChange({...currentSettings, height: v[0]})} min={10} max={200} step={5} className="mt-1" />
            </div>
          </TabsContent>

          {/* ELEC TAB */}
          <TabsContent value="elec" className="space-y-4">
            <div>
              <Label className="text-xs">{label('Тип генератора', 'Generator Type')}</Label>
              <Select value={genType} onValueChange={setGenType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {genTypes.map(g => (
                    <SelectItem key={g.value} value={g.value}>{g.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">
                {lang === 'ua' ? genTypeData.desc_ua : genTypeData.desc_en}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground">{label('ККД генератора', 'Generator Eff.')}</span>
                <div className="flex-1 h-1.5 bg-secondary/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full" style={{ width: `${genTypeData.efficiency * 100}%` }} />
                </div>
                <span className="text-[9px] font-mono text-primary">{(genTypeData.efficiency * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between">
                <Label className="text-xs">{label('Кількість полюсів', 'Pole Count')}</Label>
                <span className="text-xs font-mono text-primary">{poleCount}</span>
              </div>
              <Slider value={[poleCount]} onValueChange={v => setPoleCount(v[0])} min={4} max={96} step={2} className="mt-1" />
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {label(`Синхронна частота: ${(60 * 50 / (poleCount/2)).toFixed(0)} об/хв при 50 Гц`, `Sync speed: ${(60 * 50 / (poleCount/2)).toFixed(0)} RPM at 50 Hz`)}
              </p>
            </div>

            <div>
              <div className="flex justify-between">
                <Label className="text-xs">{label('Напруга', 'Voltage')}</Label>
                <span className="text-xs font-mono text-primary">{voltage} V</span>
              </div>
              <Slider value={[voltage]} onValueChange={v => setVoltage(v[0])} min={230} max={6600} step={10} className="mt-1" />
            </div>

            <div>
              <div className="flex justify-between">
                <Label className="text-xs">{label('Номінальна потужність', 'Rated Power')}</Label>
                <span className="text-xs font-mono text-primary">{formatP(currentSettings.ratedPower)}</span>
              </div>
              <Slider value={[currentSettings.ratedPower]} onValueChange={v => onSettingsChange({...currentSettings, ratedPower: v[0]})} min={1000} max={15000000} step={1000} className="mt-1" />
            </div>
          </TabsContent>

          {/* POWER CURVE TAB */}
          <TabsContent value="curve" className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                {label('Крива потужності P(V)', 'Power Curve P(V)')}
              </span>
            </div>
            <div className="p-3 bg-secondary/5 rounded-lg border border-border/30">
              <PowerCurveSVG currentSettings={currentSettings} windSpeed={windSpeed} lang={lang} />
            </div>

            {/* Wind Range Bar */}
            <div>
              <span className="text-[10px] text-muted-foreground uppercase mb-1 block">
                {label('Робочий діапазон вітру', 'Operating Wind Range')}
              </span>
              <WindRangeBar windSpeed={windSpeed} lang={lang} />
              <div className="flex justify-between text-[8px] text-muted-foreground mt-0.5 px-1">
                <span>0 m/s</span>
                <span>3</span>
                <span>11-14 {label('номін.', 'rated')}</span>
                <span>25</span>
                <span>30</span>
              </div>
            </div>

            {/* Weibull Parameters for AEP */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
              <span className="text-xs font-semibold">{label('Параметри Вейбулла (для AEP)', 'Weibull Parameters (for AEP)')}</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between">
                    <Label className="text-[10px]">k ({label('форма', 'shape')})</Label>
                    <span className="text-[10px] font-mono text-primary">{weibullK.toFixed(1)}</span>
                  </div>
                  <Slider value={[weibullK]} onValueChange={v => setWeibullK(v[0])} min={1.0} max={4.0} step={0.1} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between">
                    <Label className="text-[10px]">c ({label('масштаб', 'scale')}), m/s</Label>
                    <span className="text-[10px] font-mono text-primary">{weibullC.toFixed(1)}</span>
                  </div>
                  <Slider value={[weibullC]} onValueChange={v => setWeibullC(v[0])} min={3} max={15} step={0.5} className="mt-1" />
                </div>
              </div>
              <p className="text-[8px] text-muted-foreground">
                {label('k=2 — типове для більшості сайтів. c ≈ середня швидкість × 1.12', 'k=2 — typical for most sites. c ≈ mean speed × 1.12')}
              </p>
            </div>
          </TabsContent>

          {/* CALC TAB */}
          <TabsContent value="calc" className="space-y-3">
            <div className="text-xs font-semibold text-primary uppercase tracking-wide">{label('Live-розрахунки при V =', 'Live Calculations at V =')} {windSpeed.toFixed(1)} m/s</div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-center">
                <div className="text-[9px] text-muted-foreground uppercase">{label('Потужність', 'Power')}</div>
                <p className="text-lg font-mono font-bold text-primary">{formatP(liveCalc.P)}</p>
                <div className="text-[8px] text-muted-foreground font-mono">P = ½ρAV³Cp</div>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg border border-border/30 text-center">
                <div className="text-[9px] text-muted-foreground uppercase">{label('Крутний момент', 'Torque')}</div>
                <p className="text-lg font-mono font-bold">{liveCalc.torque > 1000 ? `${(liveCalc.torque/1000).toFixed(1)} kNm` : `${liveCalc.torque.toFixed(0)} Nm`}</p>
                <div className="text-[8px] text-muted-foreground font-mono">τ = P/ω</div>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg border border-border/30 text-center">
                <div className="text-[9px] text-muted-foreground uppercase">{label('Відцентрова сила', 'Centrifugal Force')}</div>
                <p className="text-lg font-mono font-bold">{liveCalc.Fc > 1000 ? `${(liveCalc.Fc/1000).toFixed(1)} kN` : `${liveCalc.Fc.toFixed(0)} N`}</p>
                <div className="text-[8px] text-muted-foreground font-mono">F = mω²r</div>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg border border-border/30 text-center">
                <div className="text-[9px] text-muted-foreground uppercase">{label('Обертання', 'Rotation')}</div>
                <p className="text-lg font-mono font-bold">{(liveCalc.rps * 60).toFixed(1)}</p>
                <div className="text-[8px] text-muted-foreground">{label('об/хв', 'RPM')}</div>
              </div>
            </div>

            {/* Capacity Factor + AEP */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-center">
                <div className="text-[9px] text-muted-foreground uppercase">{label('Коеф. використання', 'Capacity Factor')}</div>
                <p className="text-lg font-mono font-bold text-primary">{(liveCalc.capacityFactor * 100).toFixed(1)}%</p>
                <div className="h-1.5 bg-background/60 rounded-full border border-border/30 overflow-hidden mt-1">
                  <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${liveCalc.capacityFactor * 100}%` }} />
                </div>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-center">
                <div className="text-[9px] text-muted-foreground uppercase">{label('Річна енергія (AEP)', 'Annual Energy (AEP)')}</div>
                <p className="text-lg font-mono font-bold text-primary">{formatE(liveCalc.aep)}</p>
                <div className="text-[8px] text-muted-foreground font-mono">Weibull k={weibullK}, c={weibullC}</div>
              </div>
            </div>

            <div className="p-2 bg-primary/5 rounded-lg border border-primary/20 text-[10px] text-muted-foreground space-y-1">
              <p>• ω = TSR × V / R = {liveCalc.omega.toFixed(2)} rad/s</p>
              <p>• τ = P / ω = {liveCalc.torque.toFixed(0)} Nm</p>
              <p>• F_c = m_blade × ω² × r/2</p>
              <p>• CF = P_actual / P_rated = {(liveCalc.capacityFactor * 100).toFixed(1)}%</p>
              <p>• {label('При збільшенні V у 2 рази, P зростає у 8 разів (V³)', 'When V doubles, P increases 8× (V³)')}</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
