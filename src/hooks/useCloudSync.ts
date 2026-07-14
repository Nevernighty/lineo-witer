// Persists blade presets and page history to the Cloud when the user is signed in.
// Silently no-ops for anonymous users.
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

export interface CloudPresetPayload {
  name: string;
  rotor_type: string;
  material_id?: string | null;
  geometry: any;
  thumbnail_url?: string | null;
  extra?: any;
}

export function useCloudSync() {
  const { user } = useAuthUser();

  const savePreset = useCallback(async (p: CloudPresetPayload) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("user_presets")
      .insert({ ...p, user_id: user.id })
      .select("id")
      .single();
    if (error) console.warn("[cloud] savePreset", error.message);
    return data?.id ?? null;
  }, [user]);

  const listPresets = useCallback(async (limit = 8) => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("user_presets")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) console.warn("[cloud] listPresets", error.message);
    return data ?? [];
  }, [user]);

  const logHistory = useCallback(async (kind: string, ref_id: string, label?: string) => {
    if (!user) return;
    await supabase.from("user_history").insert({ user_id: user.id, kind, ref_id, label });
  }, [user]);

  const listHistory = useCallback(async (limit = 6) => {
    if (!user) return [];
    const { data } = await supabase
      .from("user_history")
      .select("*")
      .eq("user_id", user.id)
      .order("opened_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  }, [user]);

  const saveSettings = useCallback(async (patch: Record<string, any>) => {
    if (!user) return;
    await supabase.from("user_settings").upsert({ user_id: user.id, ...patch });
  }, [user]);

  return { user, savePreset, listPresets, logHistory, listHistory, saveSettings };
}
