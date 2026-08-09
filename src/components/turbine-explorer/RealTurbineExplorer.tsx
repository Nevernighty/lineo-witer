// Real 3D-printed turbine library + interactive part explorer.
import { useMemo, useState } from 'react';
import { ExternalLink, Layers, Play, Pause, Boxes, Eye, RotateCcw, Wind, ChevronRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TurbineExplorer3D } from './TurbineExplorer3D';
import { REAL_TURBINES, getRealTurbine, turbineParts, partsByRole } from '@/data/realTurbines';
import { ROLE_COLOR, ROLE_LABEL, ROLE_FUNCTION, ROLE_ORDER, type PartRole } from '@/data/turbineParts/types';
import type { Lang } from '@/utils/i18n';

const T = {
  ua: {
    library: 'Реальні друковані вітряки', parts: 'Деталі', explode: 'Рознесення',
    spin: 'Обертання', xray: 'Рентген', reset: 'Скинути', inspector: 'Інспектор деталі',
    role: 'Вузол', fn: 'Призначення', size: 'Габарит', faces: 'Полігони', source: 'Джерело моделі',
    specs: 'Технічні дані', power: 'Потужність', dia: 'Діаметр ротора', height: 'Висота ротора',
    blades: 'Лопаті', cutIn: 'Старт', tsr: 'Розрахунковий λ', cp: 'Пік Cp', gen: 'Генератор',
    swept: 'Ометена площа', pwind: 'Потужність вітру', pshaft: 'На валу', notes: 'Практика збирання',
    toLab: 'У лабораторію лопаті', pick: 'Оберіть деталь у 3D або зі списку',
    axisH: 'Горизонтальна вісь', axisV: 'Вертикальна вісь', at: 'при',
  },
  en: {
    library: 'Real printed turbines', parts: 'Parts', explode: 'Explode',
    spin: 'Spin', xray: 'X-ray', reset: 'Reset', inspector: 'Part inspector',
    role: 'Sub-assembly', fn: 'Function', size: 'Bounding box', faces: 'Triangles', source: 'Model source',
    specs: 'Specifications', power: 'Rated power', dia: 'Rotor diameter', height: 'Rotor height',
    blades: 'Blades', cutIn: 'Cut-in', tsr: 'Design λ', cp: 'Peak Cp', gen: 'Generator',
    swept: 'Swept area', pwind: 'Wind power', pshaft: 'Shaft power', notes: 'Build notes',
    toLab: 'Open in blade lab', pick: 'Pick a part in 3D or from the list',
    axisH: 'Horizontal axis', axisV: 'Vertical axis', at: 'at',
  },
};

interface Props {
  lang: Lang;
  /** Loads the selected real turbine's rotor family/size into the aero lab. */
  onSendToLab?: (turbineId: string) => void;
}

export function RealTurbineExplorer({ lang, onSendToLab }: Props) {
  const t = T[lang];
  const [turbineId, setTurbineId] = useState(REAL_TURBINES[0].id);
  const [explode, setExplode] = useState(0);
  const [spin, setSpin] = useState(true);
  const [xray, setXray] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenRoles, setHiddenRoles] = useState<PartRole[]>([]);
  const [focusRole, setFocusRole] = useState<PartRole | null>(null);

  const turbine = getRealTurbine(turbineId);
  const parts = useMemo(() => turbineParts(turbineId), [turbineId]);
  const groups = useMemo(
    () => partsByRole(turbineId).sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)),
    [turbineId],
  );
  const selected = parts.find(p => p.id === selectedId) ?? null;

  const s = turbine.spec;
  const swept = turbine.axis === 'vertical' ? s.rotorD * s.rotorH : Math.PI * (s.rotorD / 2) ** 2;
  const pWind = 0.5 * 1.225 * swept * s.ratedWind ** 3;
  const pShaft = pWind * s.cpPeak;

  const switchTurbine = (id: string) => {
    setTurbineId(id as typeof turbineId);
    setSelectedId(null); setHoveredId(null);
    setHiddenRoles([]); setFocusRole(null); setExplode(0);
  };

  const toggleRole = (role: PartRole) => {
    setHiddenRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  return (
    <div className="h-full min-h-0 flex flex-col lg:flex-row bg-background">
      {/* Library */}
      <aside className="lg:w-56 xl:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-border/40 overflow-y-auto scrollbar-thin">
        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground sticky top-0 bg-background/95 backdrop-blur z-10">
          {t.library}
        </div>
        <div className="p-1.5 space-y-1.5">
          {REAL_TURBINES.map(rt => {
            const active = rt.id === turbineId;
            return (
              <button
                key={rt.id}
                onClick={() => switchTurbine(rt.id)}
                className={`w-full text-left rounded-md border px-2 py-1.5 transition-colors ${
                  active ? 'border-primary/60 bg-primary/10' : 'border-border/40 bg-card/40 hover:bg-card/70'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[12px] font-medium truncate">{lang === 'ua' ? rt.nameUA : rt.nameEN}</span>
                  <span className="font-mono text-[10px] text-primary shrink-0">{rt.spec.ratedW} W</span>
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {rt.axis === 'vertical' ? t.axisV : t.axisH} · {(RAWCOUNT(rt.id))} {t.parts.toLowerCase()}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Stage */}
      <main className="relative flex-1 min-h-[46vh] lg:min-h-0">
        <TurbineExplorer3D
          turbine={turbine}
          explode={explode}
          spin={spin}
          xray={xray}
          hoveredId={hoveredId}
          selectedId={selectedId}
          hiddenRoles={hiddenRoles}
          focusRole={focusRole}
          onHover={setHoveredId}
          onSelect={(id) => setSelectedId(prev => prev === id ? null : id)}
        />

        {/* Title card */}
        <div className="absolute top-2 left-2 right-2 pointer-events-none">
          <div className="inline-flex flex-col rounded-md border border-primary/20 bg-card/80 backdrop-blur px-2.5 py-1.5 max-w-[min(100%,28rem)]">
            <span className="text-[13px] font-semibold leading-tight">{lang === 'ua' ? turbine.nameUA : turbine.nameEN}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{turbine.author} · {turbine.sourceLabel}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-2 left-2 right-2 rounded-md border border-primary/20 bg-card/85 backdrop-blur px-2.5 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <Boxes className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[11px] text-muted-foreground w-16 shrink-0">{t.explode}</span>
            <Slider value={[explode]} min={0} max={1} step={0.01}
              onValueChange={([v]) => setExplode(v)} className="flex-1" />
            <span className="font-mono text-[11px] text-primary w-9 text-right tabular-nums">
              {Math.round(explode * 100)}%
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Switch checked={spin} onCheckedChange={setSpin} />
              {spin ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />} {t.spin}
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Switch checked={xray} onCheckedChange={setXray} />
              <Eye className="w-3 h-3" /> {t.xray}
            </label>
            <button
              onClick={() => { setExplode(0); setHiddenRoles([]); setFocusRole(null); setSelectedId(null); }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3 h-3" /> {t.reset}
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              <a href={turbine.source} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                <ExternalLink className="w-3 h-3" /> {t.source}
              </a>
              {onSendToLab && (
                <Button size="sm" variant="secondary" className="h-6 px-2 text-[11px]"
                  onClick={() => onSendToLab(turbine.id)}>
                  <Wind className="w-3 h-3 mr-1" /> {t.toLab}
                </Button>
              )}
            </div>
          </div>

          {/* Role legend / visibility */}
          <div className="flex flex-wrap gap-1">
            {groups.map(({ role, parts: ps }) => {
              const off = hiddenRoles.includes(role);
              const focused = focusRole === role;
              return (
                <button
                  key={role}
                  onClick={() => setFocusRole(focused ? null : role)}
                  onDoubleClick={() => toggleRole(role)}
                  title={ROLE_LABEL[role][lang]}
                  className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] transition-opacity ${
                    focused ? 'border-primary/70 bg-primary/15' : 'border-border/40 bg-card/50'
                  } ${off ? 'opacity-35 line-through' : ''}`}
                >
                  <span className="w-2 h-2 rounded-sm" style={{ background: ROLE_COLOR[role] }} />
                  {ROLE_LABEL[role][lang]}
                  <span className="font-mono text-muted-foreground">{ps.length}</span>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Inspector */}
      <aside className="lg:w-72 xl:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-border/40 overflow-y-auto scrollbar-thin">
        <Section title={t.specs}>
          <Spec label={t.power} value={`${s.ratedW} W ${t.at} ${s.ratedWind} m/s`} />
          <Spec label={t.dia} value={`${s.rotorD.toFixed(2)} m`} />
          <Spec label={t.height} value={`${s.rotorH.toFixed(2)} m`} />
          <Spec label={t.swept} value={`${swept.toFixed(2)} m²`} />
          <Spec label={t.blades} value={`${s.blades}`} />
          <Spec label={t.cutIn} value={`${s.cutIn.toFixed(1)} m/s`} />
          <Spec label={t.tsr} value={s.designTsr.toFixed(1)} />
          <Spec label={t.cp} value={s.cpPeak.toFixed(2)} accent />
          <Spec label={t.pwind} value={`${Math.round(pWind)} W`} />
          <Spec label={t.pshaft} value={`${Math.round(pShaft)} W`} accent />
          <Spec label={t.gen} value={s.generator[lang]} wrap />
        </Section>

        <div className="px-2.5 pb-2 text-[11px] text-muted-foreground leading-snug">
          {lang === 'ua' ? turbine.summaryUA : turbine.summaryEN}
        </div>

        <Section title={t.inspector}>
          {selected ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: ROLE_COLOR[selected.role] }} />
                <span className="text-[12px] font-medium">{lang === 'ua' ? selected.nameUA : selected.nameEN}</span>
              </div>
              <Spec label={t.role} value={ROLE_LABEL[selected.role][lang]} />
              <Spec label={t.size} value={selected.ext.map(v => v.toFixed(1)).join(' × ')} />
              <Spec label={t.faces} value={selected.faces.toLocaleString()} />
              <p className="text-[11px] text-muted-foreground leading-snug pt-0.5">
                {ROLE_FUNCTION[selected.role][lang]}
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">{t.pick}</p>
          )}
        </Section>

        <Section title={`${t.parts} · ${parts.length}`}>
          <div className="space-y-1.5">
            {groups.map(({ role, parts: ps }) => (
              <div key={role}>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="w-2 h-2 rounded-sm" style={{ background: ROLE_COLOR[role] }} />
                  {ROLE_LABEL[role][lang]}
                </div>
                <div className="mt-0.5 space-y-0.5">
                  {ps.map(p => (
                    <button
                      key={p.id}
                      onMouseEnter={() => setHoveredId(p.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => setSelectedId(prev => prev === p.id ? null : p.id)}
                      className={`w-full flex items-center gap-1 rounded px-1.5 py-0.5 text-left text-[11px] transition-colors ${
                        selectedId === p.id ? 'bg-primary/15 text-primary'
                          : hoveredId === p.id ? 'bg-card/80' : 'hover:bg-card/60 text-muted-foreground'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
                      <span className="truncate">{lang === 'ua' ? p.nameUA : p.nameEN}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t.notes}>
          <ul className="space-y-1">
            {(lang === 'ua' ? turbine.notesUA : turbine.notesEN).map((n, i) => (
              <li key={i} className="flex gap-1.5 text-[11px] text-muted-foreground leading-snug">
                <Layers className="w-3 h-3 mt-0.5 shrink-0 text-primary/70" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </Section>
      </aside>
    </div>
  );
}

function RAWCOUNT(id: string) {
  return turbineParts(id).length;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-2.5 py-2 border-b border-border/30">
      <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{title}</h3>
      {children}
    </section>
  );
}

function Spec({ label, value, accent, wrap }: { label: string; value: string; accent?: boolean; wrap?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-2 text-[11px] ${wrap ? 'flex-col items-start' : ''}`}>
      <span className="text-muted-foreground truncate">{label}</span>
      <span className={`font-mono tabular-nums ${accent ? 'text-primary' : 'text-foreground'} ${wrap ? '' : 'text-right'}`}>
        {value}
      </span>
    </div>
  );
}
