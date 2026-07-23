// Google-linked profile: presets, recent activity, settings sync.
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, User as UserIcon, Trash2, Send, Download, Sparkles, Clock, Wind, Settings as SettingsIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useCloudSync } from "@/hooks/useCloudSync";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ActivitySparkline } from "@/components/profile/ActivitySparkline";
import type { Lang } from "@/utils/i18n";

const L = {
  ua: {
    title: "Профіль", back: "Назад", signIn: "Увійти з Google", signInHint: "Увійдіть, щоб зберігати пресети, історію та налаштування у хмарі.",
    signOut: "Вийти", presets: "Мої пресети", history: "Історія", settings: "Налаштування", activity: "Активність 14 днів",
    empty: "Порожньо", send: "У симуляцію", del: "Видалити", stl: "STL", noPresets: "Пресети зʼявляться після Blade Lab.", noHistory: "Історія зʼявиться після дій.",
    langPref: "Мова", windPref: "Вітер за замовч.", memberSince: "З нами з",
  },
  en: {
    title: "Profile", back: "Back", signIn: "Sign in with Google", signInHint: "Sign in to keep presets, history and settings in the cloud.",
    signOut: "Sign out", presets: "My presets", history: "History", settings: "Settings", activity: "14-day activity",
    empty: "Empty", send: "To sim", del: "Delete", stl: "STL", noPresets: "Presets appear after Blade Lab.", noHistory: "History appears after actions.",
    langPref: "Language", windPref: "Default wind", memberSince: "Member since",
  },
};

export default function Profile() {
  const { user, loading } = useAuthUser();
  const { listPresets, listHistory, saveSettings } = useCloudSync();
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>("ua");
  const [presets, setPresets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [settings, setSettings] = useState<{ lang?: string; wind_speed?: number }>({});
  const t = L[lang];

  useEffect(() => {
    if (!user) return;
    listPresets(50).then(setPresets);
    listHistory(60).then(setHistory);
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) { setSettings({ lang: data.lang ?? undefined, wind_speed: data.wind_speed ?? undefined }); if (data.lang === "en" || data.lang === "ua") setLang(data.lang as Lang); } });
  }, [user, listPresets, listHistory]);

  const memberSince = useMemo(() => {
    const iso = user?.created_at;
    if (!iso) return null;
    return new Date(iso).toLocaleDateString(lang === "ua" ? "uk-UA" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  }, [user, lang]);

  const daily = useMemo(() => {
    const buckets: Record<string, number> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    history.forEach((h) => {
      const k = String(h.opened_at).slice(0, 10);
      if (k in buckets) buckets[k]++;
    });
    return Object.entries(buckets).map(([date, n]) => ({ date, n }));
  }, [history]);

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    history.forEach((h) => { (g[h.kind] ??= []).push(h); });
    return g;
  }, [history]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("user_presets").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setPresets((p) => p.filter((x) => x.id !== id));
    toast.success(t.del);
  };

  const handleSendToSim = (p: any) => {
    // Persist as active preset and route to /
    try {
      const active = { id: p.id, nameUA: p.name, nameEN: p.name, geometry: p.geometry, materialId: p.material_id ?? "gfrp", rotorType: p.rotor_type ?? "hawt", heightOverDiameter: 1, helicalTwistDeg: 0, bendThresholdPct: 0.7, fractureThresholdPct: 1.1 };
      (window as any).__pendingBladePreset = active;
      navigate("/");
    } catch (e) { console.error(e); }
  };

  const handleLangChange = async (v: Lang) => {
    setLang(v); setSettings((s) => ({ ...s, lang: v }));
    await saveSettings({ lang: v });
  };
  const handleWindChange = async (v: number) => {
    setSettings((s) => ({ ...s, wind_speed: v }));
    await saveSettings({ wind_speed: v });
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <Link to="/" className="absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </Link>
        <UserIcon className="w-14 h-14 text-primary/60" />
        <div className="text-center max-w-sm">
          <div className="text-lg font-semibold">{t.title}</div>
          <div className="text-sm text-muted-foreground mt-1">{t.signInHint}</div>
        </div>
        <button
          onClick={() => lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/profile" })}
          className="px-4 py-2 rounded-lg bg-white text-slate-800 text-sm font-medium border border-border shadow hover:bg-slate-100"
        >
          {t.signIn}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-5xl flex items-center gap-3 px-4 py-3">
          <Link to="/" className="p-1 rounded hover:bg-primary/10" title={t.back}><ArrowLeft className="w-4 h-4" /></Link>
          <div className="font-semibold">{t.title}</div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => handleLangChange(lang === "ua" ? "en" : "ua")} className="px-2 py-1 rounded border border-border/40 text-[11px] text-muted-foreground hover:text-primary">
              {lang.toUpperCase()}
            </button>
            <button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive">
              <LogOut className="w-3.5 h-3.5" /> {t.signOut}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-8">
        {/* Header card */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 rounded-xl border border-primary/25 bg-card/40 backdrop-blur p-4">
          {user.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} className="w-14 h-14 rounded-full ring-2 ring-primary/40" referrerPolicy="no-referrer" alt="" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center"><UserIcon className="w-7 h-7 text-primary" /></div>
          )}
          <div className="min-w-0">
            <div className="font-semibold truncate">{user.user_metadata?.full_name ?? user.email}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            {memberSince && <div className="text-[11px] text-muted-foreground mt-0.5">{t.memberSince} {memberSince}</div>}
          </div>
        </motion.section>

        {/* Activity sparkline */}
        <section>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t.activity}</div>
          <div className="rounded-lg border border-border/40 bg-card/30 p-3">
            <ActivitySparkline data={daily} />
          </div>
        </section>

        {/* Presets */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <div className="text-sm font-semibold">{t.presets}</div>
            <div className="ml-auto text-[11px] text-muted-foreground">{presets.length}</div>
          </div>
          {presets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">{t.noPresets}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {presets.map((p) => (
                <div key={p.id} className="rounded-lg border border-border/40 bg-card/40 backdrop-blur p-3 hover:border-primary/40 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary text-xs uppercase">{(p.rotor_type ?? "??").slice(0, 3)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{p.material_id ?? "—"} · {new Date(p.updated_at ?? p.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <button onClick={() => handleSendToSim(p)} className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-[11px] hover:bg-primary/20">
                      <Send className="w-3 h-3" /> {t.send}
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="ml-auto p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* History */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <div className="text-sm font-semibold">{t.history}</div>
          </div>
          {history.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">{t.noHistory}</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(grouped).map(([kind, rows]) => (
                <div key={kind}>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{kind}</div>
                  <div className="rounded-lg border border-border/40 bg-card/30 divide-y divide-border/30">
                    {rows.slice(0, 12).map((h) => (
                      <div key={h.id} className="flex items-center gap-2 px-3 py-1.5 text-[12px]">
                        <span className="truncate flex-1">{h.label ?? h.ref_id}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{new Date(h.opened_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Settings */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <SettingsIcon className="w-4 h-4 text-primary" />
            <div className="text-sm font-semibold">{t.settings}</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/30 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground text-xs">{t.langPref}</span>
              <select value={lang} onChange={(e) => handleLangChange(e.target.value as Lang)} className="bg-background border border-border/40 rounded px-2 py-1 text-sm">
                <option value="ua">Українська</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground text-xs flex items-center gap-1"><Wind className="w-3 h-3" /> {t.windPref}</span>
              <input type="number" min={0} max={30} step={0.5} value={settings.wind_speed ?? 6}
                onChange={(e) => handleWindChange(parseFloat(e.target.value))}
                className="bg-background border border-border/40 rounded px-2 py-1 text-sm tabular-nums" />
            </label>
          </div>
        </section>
      </main>
    </div>
  );
}
