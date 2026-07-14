import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";
import { useCloudSync } from "@/hooks/useCloudSync";
import type { Lang } from "@/utils/i18n";

const L = {
  ua: { recent: "Нещодавнє", empty: "Ще нічого" },
  en: { recent: "Recent", empty: "Nothing yet" },
};

export function RecentlyUsedRibbon({ lang }: { lang: Lang }) {
  const { user, listPresets, listHistory } = useCloudSync();
  const [presets, setPresets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const t = L[lang];

  useEffect(() => {
    if (!user) return;
    listPresets(4).then(setPresets);
    listHistory(3).then(setHistory);
  }, [user, listPresets, listHistory]);

  if (!user || (presets.length === 0 && history.length === 0)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="w-full max-w-lg mb-3 flex flex-wrap gap-2 justify-center"
    >
      {presets.map((p) => (
        <button
          key={p.id}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30 text-[11px] text-primary hover:bg-primary/20 transition-colors"
          title={p.name}
        >
          <Sparkles className="w-3 h-3" />
          <span className="max-w-[110px] truncate">{p.name}</span>
        </button>
      ))}
      {history.map((h) => (
        <div
          key={h.id}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card/60 border border-border/30 text-[11px] text-muted-foreground"
        >
          <Clock className="w-3 h-3" />
          <span className="max-w-[110px] truncate">{h.label ?? h.ref_id}</span>
        </div>
      ))}
    </motion.div>
  );
}
