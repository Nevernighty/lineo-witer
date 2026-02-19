import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type WindGeneratorSpecs } from "@/utils/windCalculations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wind, Zap, Wrench, Calculator } from "lucide-react";

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
  { value: 'PMSG', desc_ua: 'Синхронний з постійними магнітами — безредукторний', desc_en: 'Permanent magnet synchronous — direct drive' },
  { value: 'DFIG', desc_ua: 'Подвійне живлення — з редуктором', desc_en: 'Doubly-fed induction — geared' },
  { value: 'SCIG', desc_ua: 'Асинхронний з к.з. ротором', desc_en: 'Squirrel cage induction' },
];

const materials = [
  { name: 'E-Glass/Epoxy', E: 40, sigma: 1000, rho: 2100, desc_ua: 'Стандарт для лопатей', desc_en: 'Standard for blades' },
  { name: 'Carbon/Epoxy', E: 135, sigma: 1500, rho: 1600, desc_ua: 'Преміум, легший, дорожчий', desc_en: 'Premium, lighter, costlier' },
  { name: 'Balsa/GF Sandwich', E: 8, sigma: 200, rho: 250, desc_ua: 'Легкий сандвіч для обшивки', desc_en: 'Lightweight sandwich for skins' },
  { name: 'Steel (Tower)', E: 210, sigma: 355, rho: 7850, desc_ua: 'Конструкційна сталь S355', desc_en: 'Structural steel S355' },
];

export const GeneratorSettings = ({
  open, onOpenChange, currentSettings, onSettingsChange, windSpeed, lang = 'ua'
}: GeneratorSettingsProps) => {
  const [bladeProfile, setBladeProfile] = useState('NACA 63-215');
  const [attackAngle, setAttackAngle] = useState(8);
  const [genType, setGenType] = useState('PMSG');
  const [poleCount, setPoleCount] = useState(48);
  const [voltage, setVoltage] = useState(690);

  const label = (ua: string, en: string) => lang === 'ua' ? ua : en;
  const profile = bladeProfiles.find(p => p.value === bladeProfile) || bladeProfiles[0];

  const liveCalc = useMemo(() => {
    const R = currentSettings.bladeLength;
    const rho = 1.225;
    const A = Math.PI * R * R;
    const V = windSpeed;
    const Cp = currentSettings.efficiency;
    const P = 0.5 * rho * A * Math.pow(V, 3) * Cp;
    const omega = (7 * V) / R; // TSR ≈ 7
    const torque = omega > 0 ? P / omega : 0;
    const bladeM = 0.5 * R * 15; // approximate blade mass per meter
    const Fc = bladeM * omega * omega * (R / 2); // centrifugal at mid-blade
    
    return { P, omega, torque, Fc, rps: omega / (2 * Math.PI) };
  }, [currentSettings, windSpeed]);

  const formatP = (w: number) => w >= 1e6 ? `${(w/1e6).toFixed(2)} MW` : w >= 1e3 ? `${(w/1e3).toFixed(1)} kW` : `${w.toFixed(0)} W`;

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
          <TabsList className="grid grid-cols-4 mb-3">
            <TabsTrigger value="aero" className="text-xs data-[state=inactive]:text-foreground data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Wind className="w-3.5 h-3.5 mr-1" />{label('Аеро', 'Aero')}
            </TabsTrigger>
            <TabsTrigger value="struct" className="text-xs data-[state=inactive]:text-foreground data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <Wrench className="w-3.5 h-3.5 mr-1" />{label('Конст.', 'Struct')}
            </TabsTrigger>
            <TabsTrigger value="elec" className="text-xs data-[state=inactive]:text-foreground data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              <Zap className="w-3.5 h-3.5 mr-1" />{label('Елект.', 'Elec')}
            </TabsTrigger>
            <TabsTrigger value="calc" className="text-xs data-[state=inactive]:text-foreground data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <Calculator className="w-3.5 h-3.5 mr-1" />{label('Розр.', 'Calc')}
            </TabsTrigger>
          </TabsList>

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
              {/* Betz limit efficiency bar */}
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[9px]">
                  <span className="text-muted-foreground">{label('Ефективність vs Бетц', 'Efficiency vs Betz')}</span>
                  <span className="text-blue-400 font-mono">{((currentSettings.efficiency / 0.593) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-background/60 rounded-full border border-border/30 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-primary rounded-full transition-all"
                    style={{ width: `${Math.min((currentSettings.efficiency / 0.593) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </TabsContent>

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
                {lang === 'ua' ? genTypes.find(g=>g.value===genType)?.desc_ua : genTypes.find(g=>g.value===genType)?.desc_en}
              </p>
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

            <div className="p-2 bg-primary/5 rounded-lg border border-primary/20 text-[10px] text-muted-foreground space-y-1">
              <p>• ω = TSR × V / R = {liveCalc.omega.toFixed(2)} rad/s</p>
              <p>• τ = P / ω = {liveCalc.torque.toFixed(0)} Nm</p>
              <p>• F_c = m_blade × ω² × r/2</p>
              <p>• {label('При збільшенні V у 2 рази, P зростає у 8 разів (V³)', 'When V doubles, P increases 8× (V³)')}</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
