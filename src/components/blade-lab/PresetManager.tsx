// PresetManager — explicit, named preset saving plus a full library
// (rename, duplicate, apply, send to simulation, delete). Replaces the old
// behaviour where every "apply to simulation" silently inserted a row called
// "Користувацька".

import { useCallback, useEffect, useState } from 'react';
import { Copy, Library, Pencil, Save, Send, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useCloudSync } from '@/hooks/useCloudSync';
import type { BladeGeometry } from '@/aero/bem';

const L = {
  ua: {
    save: 'Зберегти пресет', library: 'Мої пресети', name: 'Назва', note: 'Нотатка',
    namePh: 'Напр. Дах — 3 лопаті, S809', notePh: 'Для чого цей пресет, який сценарій…',
    cancel: 'Скасувати', confirm: 'Зберегти', saved: 'Пресет збережено', empty: 'Ще немає збережених пресетів',
    apply: 'Застосувати', send: 'У симуляцію', dup: 'Дублювати', del: 'Видалити', rename: 'Перейменувати',
    signIn: 'Увійдіть, щоб зберігати пресети у хмарі.', deleted: 'Видалено', renamed: 'Перейменовано',
    blades: 'лопатей', radius: 'R',
  },
  en: {
    save: 'Save preset', library: 'My presets', name: 'Name', note: 'Note',
    namePh: 'e.g. Rooftop — 3 blades, S809', notePh: 'What is this preset for, which scenario…',
    cancel: 'Cancel', confirm: 'Save', saved: 'Preset saved', empty: 'No saved presets yet',
    apply: 'Apply', send: 'To simulation', dup: 'Duplicate', del: 'Delete', rename: 'Rename',
    signIn: 'Sign in to keep presets in the cloud.', deleted: 'Deleted', renamed: 'Renamed',
    blades: 'blades', radius: 'R',
  },
};

export interface PresetSnapshot {
  geometry: BladeGeometry;
  materialId: string;
  rotorType: string;
  heightOverDiameter: number;
  helicalTwistDeg: number;
  bendThresholdPct: number;
  fractureThresholdPct: number;
  windSpeed: number;
  tsr: number;
  siteId: string;
  suggestedName: string;
  thumbnail?: string | null;
}

interface Props {
  lang: 'ua' | 'en';
  snapshot: () => PresetSnapshot;
  onApply: (row: any) => void;
  onSend: (row: any) => void;
}

export function PresetManager({ lang, snapshot, onApply, onSend }: Props) {
  const t = L[lang];
  const { user, savePreset, updatePreset, deletePreset, duplicatePreset, listPresets, logHistory } = useCloudSync();
  const [saveOpen, setSaveOpen] = useState(false);
  const [libOpen, setLibOpen] = useState(false);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => { listPresets(60).then(setRows); }, [listPresets]);
  useEffect(() => { if (libOpen) refresh(); }, [libOpen, refresh]);

  const openSave = () => {
    setName(snapshot().suggestedName);
    setNote('');
    setSaveOpen(true);
  };

  const doSave = async () => {
    const s = snapshot();
    setBusy(true);
    await savePreset({
      name: name.trim() || s.suggestedName,
      rotor_type: s.rotorType,
      material_id: s.materialId,
      geometry: s.geometry as any,
      thumbnail_url: s.thumbnail ?? null,
      extra: {
        note: note.trim() || null,
        heightOverDiameter: s.heightOverDiameter,
        helicalTwistDeg: s.helicalTwistDeg,
        bendThresholdPct: s.bendThresholdPct,
        fractureThresholdPct: s.fractureThresholdPct,
        windSpeed: s.windSpeed,
        tsr: s.tsr,
        siteId: s.siteId,
      },
    });
    await logHistory('preset_save', 'custom', name.trim() || s.suggestedName);
    setBusy(false);
    setSaveOpen(false);
    toast({ title: t.saved });
    refresh();
  };

  const doRename = async (row: any) => {
    const next = window.prompt(t.rename, row.name);
    if (!next || next === row.name) return;
    await updatePreset(row.id, { name: next });
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, name: next } : x)));
    toast({ title: t.renamed });
  };

  const doDuplicate = async (row: any) => {
    const created = await duplicatePreset(row, `${row.name} ×2`);
    if (created) setRows((r) => [created, ...r]);
  };

  const doDelete = async (row: any) => {
    await deletePreset(row.id);
    setRows((r) => r.filter((x) => x.id !== row.id));
    toast({ title: t.deleted });
  };

  return (
    <>
      <button onClick={openSave} title={t.save}
        className="h-7 px-2 bl-btn-text rounded bg-card/60 hover:bg-card text-muted-foreground hover:text-primary border border-border/40 flex items-center gap-1">
        <Save className="w-3 h-3" /><span className="hidden lg:inline">{t.save}</span>
      </button>
      <button onClick={() => setLibOpen(true)} title={t.library}
        className="h-7 px-2 bl-btn-text rounded bg-card/60 hover:bg-card text-muted-foreground hover:text-primary border border-border/40 flex items-center gap-1">
        <Library className="w-3 h-3" /><span className="hidden lg:inline">{t.library}</span>
      </button>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t.save}</DialogTitle></DialogHeader>
          {!user && <div className="text-xs text-muted-foreground">{t.signIn}</div>}
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">{t.name}</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePh} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">{t.note}</span>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.notePh} rows={3} />
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>{t.cancel}</Button>
            <Button onClick={doSave} disabled={!user || busy}>{t.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={libOpen} onOpenChange={setLibOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t.library}</DialogTitle></DialogHeader>
          {!user && <div className="text-xs text-muted-foreground">{t.signIn}</div>}
          {user && rows.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">{t.empty}</div>}
          <div className="max-h-[60vh] space-y-2 overflow-y-auto scrollbar-thin pr-1">
            {rows.map((row) => (
              <div key={row.id} className="flex items-start gap-3 rounded-md border border-border/40 bg-card/40 p-2">
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-primary/10">
                  {row.thumbnail_url
                    ? <img src={row.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center text-[10px] uppercase text-primary">{(row.rotor_type ?? '??').slice(0, 4)}</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{row.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {row.rotor_type} · {row.material_id ?? '—'} · {t.radius} {Number(row.geometry?.tipRadius ?? 0).toFixed(1)} m · {row.geometry?.nBlades ?? '—'} {t.blades}
                  </div>
                  {row.extra?.note && <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground/80">{row.extra.note}</div>}
                  <div className="mt-0.5 text-[10px] text-muted-foreground/70">{new Date(row.updated_at ?? row.created_at).toLocaleString()}</div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  <Button size="sm" variant="secondary" className="h-7 px-2 text-[11px]" onClick={() => { onApply(row); setLibOpen(false); }}>{t.apply}</Button>
                  <Button size="sm" variant="secondary" className="h-7 px-2 text-[11px]" onClick={() => { onSend(row); setLibOpen(false); }}>
                    <Send className="mr-1 h-3 w-3" />{t.send}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => doRename(row)} title={t.rename}><Pencil /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => doDuplicate(row)} title={t.dup}><Copy /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => doDelete(row)} title={t.del}><Trash2 /></Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
