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

/** Stable fingerprint of a preset's shape — used to dedupe repeated saves. */
export function presetHash(p: Pick<CloudPresetPayload, "rotor_type" | "material_id" | "geometry">) {
  const g = p.geometry ?? {};
  const parts = [
    p.rotor_type,
    p.material_id ?? "",
    g.airfoil?.id ?? g.airfoilId ?? "",
    g.rootRadius, g.tipRadius, g.chordRoot, g.chordTip,
    g.twistRoot, g.twistTip, g.pitch, g.nBlades, g.twistLaw,
  ];
  return parts.map((x) => (typeof x === "number" ? Math.round(x * 1000) / 1000 : x)).join("|");
}

export function useCloudSync() {
  const { user } = useAuthUser();

  /**
   * Insert or update a preset. Presets sharing a geometry hash are updated in
   * place instead of piling up as duplicates.
   */
  const savePreset = useCallback(async (p: CloudPresetPayload) => {
    if (!user) return null;
    const hash = presetHash(p);
    const extra = { ...(p.extra ?? {}), hash };
    const { data: existing } = await supabase
      .from("user_presets")
      .select("id, extra")
      .eq("user_id", user.id)
      .limit(200);
    const dupe = (existing ?? []).find((row: any) => row?.extra?.hash === hash);
    if (dupe) {
      const { error } = await supabase
        .from("user_presets")
        .update({ ...p, extra, updated_at: new Date().toISOString() })
        .eq("id", dupe.id);
      if (error) console.warn("[cloud] savePreset(update)", error.message);
      return dupe.id as string;
    }
    const { data, error } = await supabase
      .from("user_presets")
      .insert({ ...p, extra, user_id: user.id })
      .select("id")
      .single();
    if (error) console.warn("[cloud] savePreset", error.message);
    return data?.id ?? null;
  }, [user]);

  const updatePreset = useCallback(async (id: string, patch: Partial<CloudPresetPayload>) => {
    if (!user) return;
    const { error } = await supabase.from("user_presets").update(patch as any).eq("id", id);
    if (error) console.warn("[cloud] updatePreset", error.message);
  }, [user]);

  const deletePreset = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("user_presets").delete().eq("id", id);
    if (error) console.warn("[cloud] deletePreset", error.message);
  }, [user]);

  const duplicatePreset = useCallback(async (row: any, name: string) => {
    if (!user) return null;
    const payload = {
      user_id: user.id,
      name,
      rotor_type: row.rotor_type,
      material_id: row.material_id,
      geometry: row.geometry,
      thumbnail_url: row.thumbnail_url,
      extra: { ...(row.extra ?? {}), hash: `${row.extra?.hash ?? presetHash(row)}#${Date.now()}` },
    };
    const { data, error } = await supabase.from("user_presets").insert(payload).select("*").single();
    if (error) console.warn("[cloud] duplicatePreset", error.message);
    return data ?? null;
  }, [user]);

  const listPresets = useCallback(async (limit = 50) => {
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

  return { user, savePreset, updatePreset, deletePreset, duplicatePreset, listPresets, logHistory, listHistory, saveSettings };
}
