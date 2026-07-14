// Centralised registry of uploaded turbine GLB pointers.
import hawtHero from "./wind_turbine_animated.glb.asset.json";
import hawtAlt from "./wind_turbine_animated-2.glb.asset.json";
import hawtCompact from "./wind_generator_animated.glb.asset.json";
import phoenix from "./phoenix_rising_eco_wind_generator.glb.asset.json";
import vawtHero from "./vertical_wind_turbine.glb.asset.json";
import darrieus from "./darrieus_rotor_for_vertical_wind_turbine_.stl.glb.asset.json";
import savoniusMain from "./savonius3_main.glb.asset.json";
import savoniusTop from "./savonius3_top.glb.asset.json";
import archimedes from "./archimedes_wind_turbine.glb.asset.json";

export const TURBINE_MODELS = {
  hawtHero: hawtHero.url,
  hawtAlt: hawtAlt.url,
  hawtCompact: hawtCompact.url,
  phoenix: phoenix.url,
  vawtHero: vawtHero.url,
  darrieus: darrieus.url,
  savoniusMain: savoniusMain.url,
  savoniusTop: savoniusTop.url,
  archimedes: archimedes.url,
} as const;

export type TurbineModelKey = keyof typeof TURBINE_MODELS;
