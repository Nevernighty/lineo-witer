
-- user_presets
CREATE TABLE public.user_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rotor_type TEXT NOT NULL,
  material_id TEXT,
  geometry JSONB NOT NULL,
  thumbnail_url TEXT,
  extra JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_presets TO authenticated;
GRANT ALL ON public.user_presets TO service_role;
ALTER TABLE public.user_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own presets" ON public.user_presets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_history
CREATE TABLE public.user_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  label TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_history TO authenticated;
GRANT ALL ON public.user_history TO service_role;
ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own history" ON public.user_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX user_history_user_opened ON public.user_history(user_id, opened_at DESC);

-- user_settings
CREATE TABLE public.user_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lang TEXT,
  wind_speed NUMERIC,
  site_id TEXT,
  generator_spec JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER trg_user_presets_upd BEFORE UPDATE ON public.user_presets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_user_settings_upd BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
