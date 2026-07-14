import { useState } from "react";
import { LogIn, LogOut, User as UserIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { toast } from "sonner";
import type { Lang } from "@/utils/i18n";

const L = {
  ua: { signIn: "Увійти з Google", signOut: "Вийти", welcome: "Привіт" },
  en: { signIn: "Sign in with Google", signOut: "Sign out", welcome: "Hi" },
};

export function GoogleAuthPill({ lang }: { lang: Lang }) {
  const { user, loading } = useAuthUser();
  const [busy, setBusy] = useState(false);
  const t = L[lang];

  const handleSignIn = async () => {
    setBusy(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (res.error) toast.error(String(res.error?.message ?? res.error));
    } finally {
      setBusy(false);
    }
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(t.signOut);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/60 border border-border/30 text-muted-foreground text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div
          key="in"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg bg-card/60 border border-primary/25 backdrop-blur-sm"
        >
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt=""
              className="w-6 h-6 rounded-full ring-1 ring-primary/40"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <UserIcon className="w-3.5 h-3.5 text-primary" />
            </div>
          )}
          <span className="text-[11px] font-medium text-foreground max-w-[110px] truncate">
            {user.user_metadata?.full_name ?? user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title={t.signOut}
          >
            <LogOut className="w-3 h-3" />
          </button>
        </motion.div>
      ) : (
        <motion.button
          key="out"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleSignIn}
          disabled={busy}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-xs font-medium border border-border/30 shadow-sm transition-colors disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
          )}
          <span>{t.signIn}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
